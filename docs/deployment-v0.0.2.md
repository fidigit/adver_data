# v0.0.2部署与升级

默认端口18081，Node.js 24（最低22.12）。无新增依赖或数据库迁移。

## Windows已有部署升级

在原服务终端Ctrl+C停止；计划任务方式则先 `Stop-ScheduledTask -TaskName 'AdverData'`。在PowerShell执行：

```powershell
cd D:\adver_data
git status --short
# 如有本地源码修改，先保存核对。
git fetch origin --tags
if ($LASTEXITCODE -ne 0) { throw '获取版本失败' }
git switch --detach v0.0.2
if ($LASTEXITCODE -ne 0) { throw '切换版本失败' }
node --test
if ($LASTEXITCODE -ne 0) { throw '验证失败，停止启动' }
node --env-file-if-exists=.env server.mjs
```

计划任务方式将最后一行替换为 `Start-ScheduledTask -TaskName 'AdverData'`，不要同时运行两个实例。既有.env和任务脚本保持不变。

另开窗口验证：`Invoke-RestMethod http://127.0.0.1:18081/api/health`，应返回status=ok、version=0.0.2。

## Windows首次部署

```powershell
cd D:\
git clone https://github.com/fidigit/adver_data.git
if ($LASTEXITCODE -ne 0) { throw '克隆失败' }
cd D:\adver_data
git switch --detach v0.0.2
if ($LASTEXITCODE -ne 0) { throw '切换版本失败' }
node --test
if ($LASTEXITCODE -ne 0) { throw '验证失败' }
node --env-file-if-exists=.env server.mjs
```

开机后台运行及防火墙参照 [v0.0.1手册](deployment-v0.0.1.md)第二节，启动命令不变。

## Linux Docker升级

在服务器原项目目录执行（需已安装Docker Engine与Compose插件）：

```bash
set -eu
git status --short
# 如有本地源码修改，先保存核对。
git fetch origin --tags
git switch --detach v0.0.2
docker compose up -d --build --wait --wait-timeout 120
curl --fail http://127.0.0.1:18081/api/health
```

首次部署先 `git clone https://github.com/fidigit/adver_data.git` 并 `cd adver_data`，再切换版本并启动Docker。

访问 `http://服务器IP:18081`，防火墙/安全组按原配置放行。自定义端口的部署沿用原端口，Docker通过APP_PORT设置映射，容器内仍为18081。

## 验收与回滚

页面只有一个热力表模块。验证日期/来源筛选，以及「放弃修改」保持原名称、「确认修改」生效、刷新保留。清除站点存储或更换浏览器后恢复默认名称。本版本未添加外部Dashboard模块。

回滚：停止Node实例/计划任务，执行 `git switch --detach v0.0.1` 后重新启动；Docker切换同一标签后运行 `docker compose up -d --build --wait`。

本轮5项自动化测试通过。真实浏览器视觉、Docker构建及目标服务器访问尚未验证。
