# 数字投射解码

统一入口的解读应用 SPA。个人中心可挂多个应用：数字投射解码（Plum）和九宫格卡牌决策投射（Decision）。两个应用共用同一份账户点数，首页统一显示余额和购买入口；每次完整体验扣 1 点。

## 本地运行

需要 Node 20+。开两个终端：

```bash
cd server && cp .env.example .env && npm install && npm run dev
cd client && npm install && npm run dev
```

- 前端：http://localhost:5173 （个人中心）
- 起卦：http://localhost:5173/apps/plum
- 决策投射：http://localhost:5173/apps/decision
- 后台：http://localhost:5173/admin（`.env` 里的管理员账密）
- 本地默认 `WECHAT_MOCK=true`：点「微信入」会立刻建档并赠 100 点，无需真实公众号

## 微信公众号授权（上线）

需要 **认证服务号**（订阅号没有网页授权 `snsapi_userinfo`）。

1. 公众号后台 → 设置与开发 → 公众号设置 → 功能设置 → **网页授权域名**，填你的前端域名（如 `plum.example.com`，不带 `http://`）
2. 开发 → 基本配置，记下 AppID、AppSecret
3. 生产 `.env`：

```
WECHAT_MOCK=false
WECHAT_APP_ID=wx........
WECHAT_APP_SECRET=........
# 多网站共用统一服务号认证时配置；不配置则使用 PUBLIC_BASE_URL 的站内回调
WECHAT_SERVICE_ACCOUNT_CALLBACK_URL=http://bid.xinlioa.com/index.php?app_name=plum
PUBLIC_BASE_URL=https://plum.example.com
COOKIE_SECURE=true
REGISTER_BONUS_POINTS=100
JWT_SECRET=（长随机串）
```

4. Nginx 把 `/api` 反代到 Node，SPA 与 API **同域**，这样授权回调 `https://域名/api/auth/wechat/callback` 才能种下登录 Cookie。
5. 默认授权回调完整地址为：`{PUBLIC_BASE_URL}/api/auth/wechat/callback`（须能被微信访问）
6. 如果多个网站共用统一认证服务，配置 `WECHAT_SERVICE_ACCOUNT_CALLBACK_URL` 后，微信授权的 `redirect_uri` 会优先使用该地址，例如：`http://bid.xinlioa.com/index.php?app_name=plum`

本地 mock 走 `GET /api/auth/wechat` → 立即回调建档。同一 `openid` 再次登录不会重复赠点。

## 演算规则

- 上卦 = 前三位 ÷ 8 取余（0 = 坤）
- 下卦 = 后三位 ÷ 8 取余
- 动爻 = 六位全体 ÷ 6 取余（0 = 上爻）
- 编码 = (卦序 − 1) × 6 + 动爻位

例：`140792` → 雷地豫 · 六二 · `00092`

## 爻辞

`docs/` 下为 Word。当前缺 `00282`。重复的 `00147` 在 `docs/_dup/`。

```bash
npm test --prefix server
```

## 决策投射服务配置

决策投射由 Plum Node 服务端直接调用，浏览器不再持有服务访问凭据。服务密钥只配置在 `server/.env`，并可在独立 `/admin` 后台查看配置状态：

```
MODEL_PRIORITY=gemini,openai,custom
GEMINI_API_KEY=服务端密钥
GEMINI_MODEL=gemini-2.0-flash-exp
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
CUSTOM_API_KEY=
CUSTOM_BASE_URL=
CUSTOM_MODEL=gpt-3.5-turbo
DECISION_LOCAL_MOCK=false
```

开发环境默认 `DECISION_LOCAL_MOCK=true`，会返回流式模拟结果，同时验证统一点数扣减；无需配置外部决策投射服务或启动额外服务。生产环境设为 `false` 并至少配置一个服务。决策投射资源位于 `client/src/decision`。

## 管理后台说明

后台只保留单一管理员权限，不提供多级管理员。服务密钥和调用顺序仍由 `server/.env` 控制，后台只展示“已配置/未配置”和调用顺序，不会把密钥写入数据库或发送到浏览器。

管理员可以在统一用户账户页：

- 通过正式充值表单给用户增加点数，并填写备注；
- 禁用或重新启用账户。禁用后不能通过密码或微信继续登录，也不能调用两个应用；
- 永久删除账户。删除前会二次确认，并按数据库级联规则同时删除该用户的投射历史和点数流水。

后台入口增加了一次性算术挑战、登录接口限流、连续失败锁定、HttpOnly/SameSite Strict 管理员 Cookie，以及写操作的 CSRF 双提交校验。生产环境仍应使用 HTTPS（`COOKIE_SECURE=true`）、随机长 `JWT_SECRET`，并优先通过反向代理、防火墙或 VPN 限制 `/admin` 和 `/api/admin` 的访问来源；软件层面不能承诺绝对不可破解。
