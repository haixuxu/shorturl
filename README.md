# URL Shortener Service

一个使用 Express 和 MongoDB 构建的 URL 缩短服务。

## 功能特点

- 将长 URL 转换为短链接
- 自动重定向到原始 URL
- 使用 MongoDB 存储 URL 映射
- 简单的 Web 界面
- 支持设置短链接有效期（最小单位为天）

## 安装

1. 克隆仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 确保已安装并运行 MongoDB
4. 复制 `.env.example` 到 `.env` 并配置环境变量

## 运行

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 使用

### 生成短链接

POST `/shorten`
```bash
# 生成永久有效的短链接
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com"}' http://localhost:3000/shorten

# 生成带过期时间的短链接（例如：7天后过期）
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com", "expiresIn": 7}' http://localhost:3000/shorten
```

参数说明：
- `url`: 必填，需要缩短的原始URL
- `expiresIn`: 可选，过期时间（单位：天）。最小值为1天，不设置则永久有效

### 访问短链接

GET `/:shortId`
```bash
curl http://localhost:3000/your-short-id
```

注意：如果短链接已过期，将返回 404 错误。
