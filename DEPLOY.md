# 部署指南

## 1. 构建生产环境代码

运行以下命令生成静态文件：

```bash
npm run build
```

构建完成后，静态文件将位于 `dist` 目录中。

## 2. 预览构建结果

在本地预览生成的静态网站：

```bash
npm run preview
```

## 3. 部署到服务器

### 静态托管 (推荐)
你可以将 `dist` 目录的内容部署到任何静态网站托管服务，如：
- **Vercel** (推荐)
- **Netlify**
- **GitHub Pages**
- **Nginx / Apache** 服务器

### Nginx 配置示例

如果你使用 Nginx，可以使用以下配置：

```nginx
server {
    listen 80;
    server_name zilanxuan.cn;

    location / {
        root /path/to/your/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 4. 性能优化提示

- 图片资源已使用 WebP 格式。
- 代码已自动分割 (Code Splitting)。
- 建议开启服务器 Gzip 或 Brotli 压缩。
