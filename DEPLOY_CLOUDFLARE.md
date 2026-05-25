# Cloudflare Pages + Worker 部署说明

这个项目现在使用 Cloudflare Pages 托管静态页面，并使用 Pages Functions 作为 Worker 运行时替代原来的 `proxy.php`。

## 我已经改好的部分

- `index.html`：签到请求从 `proxy.php` 改为 `/api/proxy`。
- `functions/api/proxy.js`：新增 Cloudflare Pages Function，负责带 Cookie 请求同济 Canvas 签到链接。
- `proxy.php`：已删除，Cloudflare Pages 不运行 PHP。
- `wrangler.toml`：固定 Worker 兼容日期，方便本地调试。

## 你需要准备

- 一个 Cloudflare 账号。
- 一个 GitHub 账号。
- 你自己的 GitHub 仓库，建议 fork `mmmlllnnn/TongJi_Canvas_Web` 后把本项目改动推上去。

## Cloudflare Pages 设置

1. 打开 Cloudflare Dashboard。
2. 进入 `Workers & Pages`。
3. 点击 `Create application`。
4. 选择 `Pages`。
5. 选择 `Connect to Git`。
6. 授权 GitHub，并选择你的仓库。
7. 构建设置填写：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`
   - Root directory: 留空，除非你的仓库不是根目录部署
8. 点击 `Save and Deploy`。

## 部署后的访问方式

部署完成后，Cloudflare 会给你一个类似这样的地址：

```text
https://你的项目名.pages.dev
```

实际使用链接是：

```text
https://你的项目名.pages.dev/index.html?_canvas_middle_session=你的认证信息
```

如果绑定了自己的域名，就把前面的域名换成你的域名：

```text
https://你的域名/index.html?_canvas_middle_session=你的认证信息
```

## 本地测试

在项目根目录执行：

```bash
npx wrangler pages dev .
```

然后打开：

```text
http://localhost:8788
```

测试 Worker 接口是否存在：

```bash
curl -X OPTIONS -i http://localhost:8788/api/proxy
```

能看到 `204 No Content` 就说明函数路由正常。

## 注意事项

- 这个 Worker 目前只允许代理 `https://canvas.tongji.edu.cn`，避免变成公开代理。
- 浏览器调用摄像头要求 HTTPS；Cloudflare Pages 默认提供 HTTPS。
- 不要把自己的 `_canvas_middle_session` 发到公开群或公开仓库里。
