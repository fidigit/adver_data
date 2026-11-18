# 广告投诉分析报表 v0.0.2

仓库：[fidigit/adver_data](https://github.com/fidigit/adver_data)。v0.0.2只保留「各来源在不同投诉类型中的表现」模块，保留日期范围/单日、来源范围、激烈情绪占比和小样本提示。原三维热力块及其他模块已移除。发布方式仍为main分支加版本标签。

点击「修改名称」打开「确认修改」弹窗，填写名称后选择「确认修改／放弃修改」。名称1–60个字符；Esc等同放弃。确认前不会更改标题。确认后的名称仅保存在当前浏览器，刷新后保留，不跨浏览器、设备或用户同步；禁用存储时本次页面生效并提示。

- [v0.0.2部署与升级](docs/deployment-v0.0.2.md)
- [外部广告投诉分析接入评估](docs/external-report-assessment-v0.0.2.md)

## 运行

安装 Git 和 Node.js 24（最低22.12），在项目目录执行：

```sh
node --test
node --env-file-if-exists=.env server.mjs
```

无需 `npm install`、Python、数据库或前端构建。访问 `http://127.0.0.1:18081`，健康检查 `http://127.0.0.1:18081/api/health`。

当前版本的Windows首次部署、Docker、升级及回滚命令见 [v0.0.2服务器部署手册](docs/deployment-v0.0.2.md)；后台自启沿用历史手册。

## 项目结构

```text
public/index.html         单模块热力表、标题修改弹窗及原汇总数据
server.mjs                HTTP服务，只开放首页和健康检查
scripts/start-local.ps1   Windows启动入口
Dockerfile / compose.yaml Linux容器部署和自动重启
.env.example              Node.js监听地址和端口配置样例
test/server.test.mjs      HTTP访问及脚本语法检查
```

## 数据与更新

报表自带2026-10-21至2026-10-27的汇总数据，2,899条投诉、869条激烈投诉，默认前8广告来源1,142条。部署后不会自动拉取新数据，没有数据上传、数据编辑、数据库连接或账号登录功能。访问者可以读取HTML内的全部汇总数据；需要限制访问时，在服务器现有网关配置HTTPS和访问控制。

更新数据或图表时替换 `public/index.html`，运行 `node --test` 后发布新标签。直接Node服务下刷新页面即可读取新文件；Docker方式需要重新构建镜像。原中文HTML在本机作为v0.0.1历史原件保留且被Git忽略；当前页面使用相同汇总数据，仅保留指定模块。

## 配置

可将 `.env.example` 复制为 `.env` 并修改：`HOST` 默认 `0.0.0.0`，`PORT` 默认 `18081`。直接Node入口读取 `.env`，已设置的进程环境变量优先。Docker容器内部固定18081，通过Compose的 `APP_PORT` 修改服务器映射端口，例如 `APP_PORT=28081 docker compose up -d --build`；不要用 `PORT` 修改容器内部端口。

## 验证范围

本机Node.js 25.2.1：5项自动化测试通过，覆盖HTTP服务、健康接口、脚本语法、模拟DOM中的标题确认/放弃/Esc/刷新恢复/输入校验/存储故障及热力表筛选。v0.0.2本轮浏览器工具启动失败，未完成真实浏览器视觉验收；本机没有Docker，镜像构建和目标服务器网络需在目标环境验证。

运行参数参考 [Node.js CLI文档](https://nodejs.org/api/cli.html#--env-file-if-existsfile)。
