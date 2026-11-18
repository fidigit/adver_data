# 外部「广告投诉分析」接入评估

评估日期：2026-11-18。目标：[报表10274](https://sttc-dashboard.duowan.com/app/report/10274)。

## 结论与证据

技术上可尝试整页嵌入，或通过已授权接口/导出数据重建单个模块。当前不能承诺直接迁移「广告投诉分析」；v0.0.2未接入外部模块。

本机HTTP请求入口返回200与Vue Dashboard外壳，未包含报表10274图表、字段、数据或「广告投诉分析」内容。此次入口响应没有X-Frame-Options或Content-Security-Policy；这不代表登录跳转链、最终响应和接口均允许嵌入。

公开加载的 [app.8e396403.js](https://sttc-dashboard.duowan.com/js/app.8e396403.js) 显示：API域名配置为 `https://dashboardapi-sttc.duowan.com`；请求使用 `withCredentials: true`，并会从登录状态添加 `x-authorization` 认证头。登录入口指向portal.hiido.com，代码包含页面配置与图表数据请求接口。这些是通用应用代码线索，尚未确认10274实际使用的接口、参数、数据源。

浏览器工具两次启动失败，替代浏览器技能未配置，因此本轮未看到登录后的目标模块，未确认实际字段、图形、统计口径、SQL、导出能力或登录后的iframe可用性。

## 可选方案

| 方案 | 适合的目标 | 待确认 |
| --- | --- | --- |
| iframe嵌入 | 快速复用原站整份报表和筛选 | 官方嵌入能力、登录跳转、跨站Cookie策略、最终响应限制；一般无法只取其中一个模块 |
| 授权接口加本项目重建 | 独立展示单模块、统一筛选和样式 | 接口文档、服务端认证、字段口径、刷新频率、访问权限 |
| 导出CSV/Excel/JSON后重建 | 先落地可查看版本 | 截图、导出样例、筛选和指标定义；数据更新另行安排 |

推荐独立维护单个模块时选择接口接入或导出重建；快速查看整份原站报表时先验证官方嵌入能力。

浏览器同源策略使本项目不能任意读取跨域iframe内的DOM、隐藏其他模块或提取其中的图表。不能假定一个iframe就能只显示「广告投诉分析」。

接口方案需要新增服务端数据适配与必要的访问控制；当前服务只提供HTML和健康检查。认证材料应保存在服务器受控配置中，不放入HTML或公开GitHub仓库。

## 下一步

需能打开目标报表的登录后浏览器，或该模块截图及导出样例，以核实实际图表、字段、时间/来源筛选与统计口径。实时同步另需平台支持的授权API或原始数据源读取方式；无需在聊天提供密码或登录令牌。

技术限制参考 [MDN同源策略](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)、[MDN X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options)。
