# 广告投诉分析报表 v0.0.1

仓库：[fidigit/adver_data](https://github.com/fidigit/adver_data)。保留原HTML中的三维时间热力块、平面热力图、日期/来源/指标筛选和联动交互。发布方式参考「AI用于商务人效分析」：main分支、版本标签、服务器按标签部署。

## 运行

安装 Git 和 Node.js 24（最低22.12），在项目目录执行：

```sh
node --test
node --env-file-if-exists=.env server.mjs
```

无需 `npm install`、Python、数据库或前端构建。访问 `http://127.0.0.1:18081`，健康检查 `http://127.0.0.1:18081/api/health`。

完整的Windows首次部署、后台自启、Docker、升级及回滚命令见 [服务器部署手册](docs/deployment-v0.0.1.md)。

## 项目结构

```text
public/index.html         原始报表的部署副本，内容原样保留
server.mjs                HTTP服务，只开放首页和健康检查
scripts/start-local.ps1   Windows启动入口
Dockerfile / compose.yaml Linux容器部署和自动重启
.env.example              Node.js监听地址和端口配置样例
test/server.test.mjs      HTTP访问及脚本语法检查
```

## 数据与更新

报表自带2026-10-21至2026-10-27的汇总数据，2,899条投诉、869条激烈投诉。部署后不会自动拉取新数据，也没有上传、编辑、数据库连接或账号登录功能。访问者可以读取HTML内的全部汇总数据；需要限制访问时，在服务器现有网关配置HTTPS和访问控制。

更新数据或图表时替换 `public/index.html`，运行 `node --test` 后发布新标签。直接Node服务下刷新页面即可读取新文件；Docker方式需要重新构建镜像。原中文HTML在本机保留且被Git忽略，GitHub中的 `public/index.html` 已包含相同内容及汇总数据。

## 配置

可将 `.env.example` 复制为 `.env` 并修改：`HOST` 默认 `0.0.0.0`，`PORT` 默认 `18081`。直接Node入口读取 `.env`，已设置的进程环境变量优先。Docker容器内部固定18081，通过Compose的 `APP_PORT` 修改服务器映射端口，例如 `APP_PORT=28081 docker compose up -d --build`；不要用 `PORT` 修改容器内部端口。

## 验证范围

本机Node.js 25.2.1：HTTP首页与原件字节一致、HEAD、健康接口、404、方法限制及三个内联脚本语法检查通过。浏览器实际检查结果见部署手册。当前机器没有Docker，镜像构建和目标服务器网络需在目标环境验证。

运行参数参考 [Node.js CLI文档](https://nodejs.org/api/cli.html#--env-file-if-existsfile)。
