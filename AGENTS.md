# 仓库指南

## 适用范围与沟通

本文件适用于整个仓库；修改子项目时，还需遵守该目录下的 `AGENTS.md`。前端和后端的专属约定分别见 `kethe-frontend-h5/AGENTS.md`、`kethe-backend/AGENTS.md`。

默认使用简体中文沟通，代码、命令和配置项保持原文。修改前先阅读相关实现与需求，沿用已有模式，避免顺带重构无关代码。

## 项目结构

Kethe 是移动端 H5 记账应用，包含收入与支出记录、流水查询、统计报表、账户、分类、成员和消费项目管理，以及邮件验证码与登录功能。

- `kethe-frontend-h5/`：React 19、TypeScript、Vite 8 前端，支持 PWA。
- `kethe-backend/`：NestJS 11、TypeScript、TypeORM、MySQL 后端。
- `docs/requirements/`：产品需求与功能方案；`docs/images/`：页面参考图。
- `DESIGN.md`：设计参考；页面实现同时参考现有前端样式与设计变量。

根目录没有 `package.json` 或统一的 pnpm workspace。两个子项目各自维护依赖与锁文件，安装、开发、检查和构建均应在对应目录执行。

## 开发与验证命令

统一使用 pnpm，保留各子项目的 `pnpm-lock.yaml`。后端声明 Node.js `^22.18.0 || >=24.12.0` 和 pnpm `11.9.0`；前端 `.nvmrc` 指定 Node.js 22。共用 Node.js 环境时可使用满足后端要求的 Node.js 22.18 及以上 22.x 版本。

从仓库根目录执行：

| 目的 | 前端 | 后端 |
| --- | --- | --- |
| 安装依赖 | `pnpm -C kethe-frontend-h5 install` | `pnpm -C kethe-backend install` |
| 启动开发服务 | `pnpm -C kethe-frontend-h5 dev` | `pnpm -C kethe-backend dev` |
| 静态检查 | `pnpm -C kethe-frontend-h5 lint` | `pnpm -C kethe-backend lint` |
| 构建 | `pnpm -C kethe-frontend-h5 build` | `pnpm -C kethe-backend build` |
| 单元测试 | 暂无测试脚本 | `pnpm -C kethe-backend test --runInBand` |
| 端到端测试 | 暂无测试脚本 | `pnpm -C kethe-backend test:e2e --runInBand` |

后端 `lint` 会自动修复文件，运行后需检查差异；后端构建会更新 `public/meta.json`，不要将构建产生的无关变化混入业务修改。纯文档变更检查内容、路径与差异即可；代码变更按涉及的子项目运行相关检查，说明未运行或失败的原因。

## 前后端协作

- 前端默认请求前缀为 `/kethe/api`，Vite 开发代理转发到 `http://localhost:6308`，并将前缀改写为后端的 `/api`。调整端口或前缀时同步检查代理、环境配置和部署配置。
- 接口变更同时检查后端控制器、DTO、响应结构和前端 `src/api/` 类型与调用方，保持字段、枚举、金额及时间口径一致。
- 后端普通响应由公共拦截器包装，前端请求层负责解包；新增接口应沿用现有约定，下载等特殊响应参考既有实现。
- 数据库结构或初始化数据变更需同时更新 `kethe-backend/sql/init.sql`，并新增 `YYYY-MM-DD-[name].sql` 升级脚本。不要通过运行 SQL 或回填脚本来替代代码验证。
- 如需保存计划，放到仓库根目录 `docs/plans/YYYY-MM-DD-[name].md`；需求变更更新 `docs/requirements/` 中对应文档。

## 提交与配置

使用中文 Conventional Commits，例如 `feat: 添加消费项目管理`、`fix: 修复流水筛选条件`、`docs: 更新开发指南`。提交说明应包含变更目的与验证方式，涉及接口、数据库或环境变量时明确说明。

不要编辑或提交依赖目录、构建产物、日志和覆盖率产物。不要在代码、文档或提交中写入真实密码、令牌、数据库凭据、SMTP 密码或 webhook 密钥；环境配置示例使用占位值。新增后端环境变量时同步更新校验与文档。
