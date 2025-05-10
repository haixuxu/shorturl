require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const path = require('path');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// URL Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

const Url = mongoose.model("Url", urlSchema);

// 生成短链接
app.post("/shorten", async (req, res) => {
  try {
    const { url, expiresIn } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // 检查URL是否已经存在且未过期
    let existingUrl = await Url.findOne({
      originalUrl: url,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    if (existingUrl) {
      return res.json({
        originalUrl: existingUrl.originalUrl,
        shortUrl: `${req.protocol}://${req.get("host")}/${existingUrl.shortId}`,
        expiresAt: existingUrl.expiresAt,
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
    const shortId = nanoid(6);
    const newUrl = new Url({
      originalUrl: url,
      shortId: shortId,
      expiresAt: expiresAt,
    });

    await newUrl.save();
    res.json({
      originalUrl: url,
      shortUrl: `${req.protocol}://${req.get("host")}/${shortId}`,
      expiresAt: expiresAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 重定向到原始URL
app.get("/:shortId", async (req, res) => {
  try {
    const url = await Url.findOne({
      shortId: req.params.shortId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    if (!url) {
      return res.status(404).json({ error: "URL not found or has expired" });
    }
    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 首页
app.get("/", (req, res) => {
  res.render('index');
});

const PORT = process.env.PORT || 3000;

// 连接数据库并启动服务器
function startServer() {
  try {
    // 连接数据库
    mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shorturl",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    // 监听连接状态
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB 连接成功");
      // 启动服务器
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB 连接失败", err);
    });
    // console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // 如果数据库连接失败，退出程序
  }
}

// 启动服务器
startServer();
