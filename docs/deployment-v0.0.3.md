# v0.0.3部署与升级

版本v0.0.3，默认端口18081。前端已迁移至React、Ant Design及Ant Design Charts，新增构建步骤。使用Node.js 24与npm。package-lock.json纳入版本控制，dist由服务器构建且不提交Git。

## Windows已有部署升级

停止原前台实例（Ctrl+C）。如果使用AdverData计划任务，管理员PowerShell先执行 `Stop-ScheduledTask -TaskName 'AdverData'`。在PowerShell执行：

```powershell
cd D:\adver_data
git status --short
# 如有本地源码修改，先保存核对。
git fetch origin --tags
if ($LASTEXITCODE -ne 0) { throw '获取版本失败' }
git switch --detach v0.0.3
if ($LASTEXITCODE -ne 0) { throw '版本切换失败' }
node --version
# 应为v24或更高；先升级Node再继续。
npm ci
if ($LASTEXITCODE -ne 0) { throw '安装依赖失败' }
npm run build
if ($LASTEXITCODE -ne 0) { throw '前端构建失败' }
npm test
if ($LASTEXITCODE -ne 0) { throw '检查失败，停止启动' }
node --env-file-if-exists=.env server.mjs
```

计划任务部署将最后一行改为 `Start-ScheduledTask -TaskName 'AdverData'`，不要并行启动两个实例。如Node安装路径改变，请同步更新原scripts/run-server.ps1中的路径。既有.env、端口和标题浏览器存储保持不变。

另开PowerShell检查：

```powershell
Invoke-RestMethod http://127.0.0.1:18081/api/health
# status=ok，version=0.0.3
```

浏览器访问 `http://服务器IP:18081`。需要放行TCP18081，使用原防火墙与云安全组设置。首次部署先在D盘执行 `git clone https://github.com/fidigit/adver_data.git`，再进入D:\adver_data，执行上述切换版本、安装、构建、测试与启动命令。

Windows开机后台任务设置沿用 [v0.0.1手册](deployment-v0.0.1.md)第二节；注册前先完成本版构建。

## Linux Docker

需安装Git、Docker Engine、Compose插件。已有部署在原项目目录执行：

```bash
set -eu
git status --short
# 如有本地源码修改，先保存核对。
git fetch origin --tags
git switch --detach v0.0.3
docker compose up -d --build --wait --wait-timeout 180
curl --fail http://127.0.0.1:18081/api/health
```

首次部署先克隆仓库并cd adver_data。Dockerfile会在Node24构建阶段运行npm ci与npm run build，运行阶段仅复制dist、服务入口与package.json，以非root用户提供服务。无需在宿主机安装前端依赖。端口改变时沿用.env中的APP_PORT，并同步修改curl检查地址。

## 验收

1. 健康接口版本为0.0.3，首页显示Ant Design日期/来源控件和真实Heatmap。
2. 全部日期默认前8来源1,142条投诉，全部来源2,899条；单日/日期范围切换后合计与格子更新。
3. 格子标签、悬停明细、固定0–100%图例正确；小样本灰色、无记录白色、正常零占比浅蓝。
4. 标题确认生效、放弃/Esc不保存，刷新保留旧版已保存的名称。
5. 窄屏横向滚动能看到所有来源，展开数据明细可读取完整数值。

本机9项自动化测试及真实引擎离屏渲染通过；实际浏览器悬停、移动端视觉、Docker构建及目标服务器连通性尚未验证。

## 回滚

停止Node/计划任务，执行 `git switch --detach v0.0.2`，再按v0.0.2直接启动命令运行；旧版本服务使用public/index.html，不受保留的dist影响。Docker切换标签后重新 `docker compose up -d --build --wait`。无数据库迁移；标题本地存储键保持兼容。
