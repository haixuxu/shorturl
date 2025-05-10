require("dotenv").config();
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const { customAlphabet } = require("nanoid");
const path = require('path');
const app = express();


app.set('trust proxy', true);

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建 Sequelize 实例
const sequelize = new Sequelize(
    process.env.DB_NAME || 'shorturl',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);


// 定义 URL 模型
const Url = sequelize.define('Url', {
    originalUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shortId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});
// 自定义 nanoid 配置
const customNanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_', 6);

// 生成短链接
app.post("/shorten", async (req, res) => {
    try {
        const { url, expiresIn } = req.body;
        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // 检查URL是否已经存在且未过期
        let existingUrl = await Url.findOne({
            where: {
                originalUrl: url,
                [Sequelize.Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Sequelize.Op.gt]: new Date() } }
                ]
            }
        });

        if (existingUrl) {
            return res.json({
                originalUrl: existingUrl.originalUrl,
                shortUrl: `${req.protocol}://${req.get("host")}/${existingUrl.shortId}`,
                expiresAt: existingUrl.expiresAt
            });
        }

        // 计算过期时间（将天数转换为毫秒）
        let expiresAt = null;
        if (expiresIn) {
            const days = parseInt(expiresIn);
            if (days < 1) {
                return res
                    .status(400)
                    .json({ error: "Expiration time must be at least 1 day" });
            }
            expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }

        // 生成新的短链接
        const shortId = customNanoid(6);
        const newUrl = await Url.create({
            originalUrl: url,
            shortId: shortId,
            expiresAt: expiresAt
        });

        res.json({
            originalUrl: url,
            shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
            expiresAt: expiresAt
        });
    } catch (error) {
        console.error('Error creating short URL:', error);
        res.status(500).json({ error: "Server error" });
    }
});

// 重定向到原始URL
app.get("/:shortId", async (req, res) => {
    try {
        const url = await Url.findOne({
            where: {
                shortId: req.params.shortId,
                [Sequelize.Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Sequelize.Op.gt]: new Date() } }
                ]
            }
        });

        if (!url) {
            return res.status(404).json({ error: "URL not found or has expired" });
        }
        res.redirect(url.originalUrl);
    } catch (error) {
        console.error('Error finding URL:', error);
        res.status(500).json({ error: "Server error" });
    }
});

// 首页
app.get("/", (req, res) => {
    res.render('index');
});

const PORT = process.env.PORT || 3000;

// 连接数据库并启动服务器
async function startServer() {
    try {
        // 连接数据库
        await sequelize.authenticate();
        console.log('✅ MySQL 连接成功');

        // 同步数据库模型
        await sequelize.sync();
        console.log('✅ 数据库表同步完成');

        // 启动服务器
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ MySQL 连接失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();
