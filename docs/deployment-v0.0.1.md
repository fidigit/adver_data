# v0.0.1 远程服务器部署

本项目沿用「AI用于商务人效分析」的GitHub版本发布流程，端口默认18081，可与其18080服务共存。以下命令在目标服务器执行；仓库若为私有，请先用服务器自己的GitHub授权完成克隆，不要将令牌写进脚本。

## 一、Windows服务器：直接启动

前提：已安装Git与Node.js 24（最低22.12）。在PowerShell执行；首次克隆目录须不存在：

```powershell
cd D:\
git clone https://github.com/fidigit/adver_data.git
if ($LASTEXITCODE -ne 0) { throw '克隆失败，请检查GitHub仓库权限与网络' }
cd D:\adver_data
git switch --detach v0.0.1
if ($LASTEXITCODE -ne 0) { throw '版本切换失败' }
node --test
if ($LASTEXITCODE -ne 0) { throw '检查失败，停止部署' }
node --env-file-if-exists=.env server.mjs
```

保持终端运行，访问 `http://服务器IP:18081`。Ctrl+C停止。另一个PowerShell窗口检查：

```powershell
Invoke-RestMethod http://127.0.0.1:18081/api/health
# status=ok，version=0.0.1
```

如果服务器防火墙尚未放行18081，在管理员PowerShell执行：

```powershell
New-NetFirewallRule -DisplayName 'Adver Data TCP 18081' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 18081
```

云服务器还须在云安全组放行相同端口，来源范围按实际访问者设置。公网域名可在现有HTTPS网关反向代理到 `127.0.0.1:18081`。

## 二、Windows服务器：开机后台运行

先按Ctrl+C停止前台实例，避免端口冲突。以下在管理员PowerShell执行，将任务配置为SYSTEM开机运行；日志在项目的logs目录：

```powershell
cd D:\adver_data
$nodePath = (Get-Command node -ErrorAction Stop).Source
New-Item -ItemType Directory -Path .\logs -Force | Out-Null
$runner = @"
Set-Location -LiteralPath 'D:\adver_data'
& '$nodePath' --env-file-if-exists=.env server.mjs >> 'D:\adver_data\logs\server.log' 2>&1
exit `$LASTEXITCODE
"@
$runner | Set-Content -LiteralPath .\scripts\run-server.ps1 -Encoding UTF8
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "D:\adver_data\scripts\run-server.ps1"' -WorkingDirectory 'D:\adver_data'
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
Register-ScheduledTask -TaskName 'AdverData' -Action $action -Trigger $trigger -Settings $settings -User 'SYSTEM' -RunLevel Highest
Start-ScheduledTask -TaskName 'AdverData'
Start-Sleep -Seconds 3
Invoke-RestMethod http://127.0.0.1:18081/api/health
```

此方案要求Node安装路径对SYSTEM可访问。不要把每用户私有目录下的Node路径直接用于SYSTEM任务；优先使用官方系统级安装。更换项目目录时须同步修改上述绝对路径。生成的run-server.ps1是服务器本地文件，已在.gitignore中忽略。

查看状态和日志：

```powershell
Get-ScheduledTaskInfo -TaskName 'AdverData'
Get-Content D:\adver_data\logs\server.log -Tail 50
# 停止：Stop-ScheduledTask -TaskName 'AdverData'
```

## 三、Linux服务器：Docker Compose常驻运行

前提：已安装Git、Docker Engine和Compose插件，当前用户可执行docker，Docker服务已设置开机启动。

```bash
set -eu
git clone https://github.com/fidigit/adver_data.git
cd adver_data
git switch --detach v0.0.1
docker compose up -d --build --wait --wait-timeout 120
docker compose ps
curl --fail http://127.0.0.1:18081/api/health
```

访问 `http://服务器IP:18081`。Compose配置自动重启，退出SSH不会停止服务。映射其他端口：`APP_PORT=28081 docker compose up -d --build --wait`，之后访问28081；也可在服务器 `.env` 中添加 `APP_PORT=28081` 供后续命令复用。

日志与停止命令：

```bash
docker compose logs --tail=100 app
docker compose stop
# 再启动：docker compose up -d --wait
```

## 四、升级与回滚

先检查 `git status --short`，若源码有本地修改，先核对保存。配置和日志被忽略。未来有新标签后，用实际标签替换下面v0.0.1。

Windows后台任务方式：

```powershell
cd D:\adver_data
git fetch origin --tags
if ($LASTEXITCODE -ne 0) { throw '获取版本失败' }
Stop-ScheduledTask -TaskName 'AdverData'
git switch --detach v0.0.1
if ($LASTEXITCODE -ne 0) { throw '版本切换失败，请检查后再启动' }
node --test
if ($LASTEXITCODE -ne 0) { throw '检查失败，请回退到上一标签' }
Start-ScheduledTask -TaskName 'AdverData'
```

前台方式则Ctrl+C停止，更新后重新运行 `node --env-file-if-exists=.env server.mjs`。

Linux Docker方式：

```bash
set -eu
git fetch origin --tags
git switch --detach v0.0.1
docker compose up -d --build --wait --wait-timeout 120
curl --fail http://127.0.0.1:18081/api/health
```

回滚使用相同命令切换到上一个已验证标签，并重启/重新构建。项目数据包含在HTML内，随版本一同回滚。无需迁移数据库。

## 五、实际验证

浏览器已通过HTTP加载报表，指标切换到“投诉条数”后色阶和热力表同步更新；最近N天切换为3天后，统计范围正确变为2026-10-25至2026-10-27。

本机HTTP测试和三个脚本语法检查通过；public/index.html与原中文HTML的SHA256均为 `9540f4c1dbc273454e75f85b9d07adddca8e09154c01124e2f40ae3e75c2ee0c`。当前机器未安装Docker；目标服务器的Docker构建、开机任务及远程网络连接需在服务器执行以上命令后检查。GitHub上传与服务器实际部署是两个步骤。
