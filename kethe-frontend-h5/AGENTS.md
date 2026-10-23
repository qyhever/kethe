# H5 前端指南

本文件适用于 `kethe-frontend-h5/`，与仓库根目录 `AGENTS.md` 一起使用。

## 技术栈与目录职责

本项目是移动端记账应用，使用 React 19、TypeScript、Vite 8、React Router 7、Zustand 和 Tailwind CSS 4。Vite 已启用 React Compiler，并通过 `vite-plugin-pwa` 提供 PWA 能力。

- `src/main.tsx`：React 入口，启用 StrictMode 和 BrowserRouter。
- `src/App.tsx`：路由、认证初始化、Toast 与版本更新通知；新增页面需在此接入对应路由和守卫。
- `src/pages/`：业务页面，通常使用 `PascalCasePage.tsx` 与同名 CSS；部分关联页面合并在同一文件导出。
- `src/components/`：公共交互组件，以及账户、分类、成员、消费项目等领域组件。优先复用已有 Dialog、Toast、日期选择器、选择面板和图标组件。
- `src/api/`：按领域组织接口方法；公共接口类型集中在 `types.ts`，令牌存储位于 `token.ts`。
- `src/utils/`：请求、会话通知、版本检测等基础功能；`src/stores/auth.ts`：认证状态。
- `src/styles/index.css`：全局样式与语义设计变量；`src/styles/tailwind.css`：Tailwind 入口及主题映射。
- `src/assets/`：随模块导入的资源；`public/`：按路径访问的静态资源与 PWA 图标。
- `build/meta.ts`：生成构建版本信息的 Vite 插件，是构建源码，不是输出目录；`types/` 存放类型声明，`scripts/` 存放部署等辅助脚本。

## 开发命令

以下命令在本目录执行。使用 pnpm 安装依赖；`.nvmrc` 指定 Node.js 22，具体共用环境要求见根目录指南。

- `pnpm install`：安装依赖，保留 `pnpm-lock.yaml`。
- `pnpm dev`：启动 Vite 开发服务，脚本带有 `--host`，可用于移动设备联调。
- `pnpm lint`：运行 Oxlint，不执行 TypeScript 构建检查。
- `pnpm build`：先执行 `tsc -b`，再通过 `vite build --mode prod` 生成 `dist/`。
- `pnpm preview`：本地预览已有构建产物。

当前未配置 `test` 或 `format` 脚本，不要使用不存在的命令。`README.md` 仍包含 Vite 模板说明，实际命令与行为以 `package.json` 和配置文件为准。

## 编码约定

使用函数组件和 Hooks；遵守 Hooks 调用规则，保持渲染纯净，并正确清理副作用。组件和类型使用 PascalCase，函数、变量和 Hooks 使用 camelCase，Hooks 以 `use` 开头。遵循附近代码的导出与目录模式，不为单个页面引入额外架构或状态管理依赖。

按 `.prettierrc` 使用单引号、不加分号，并沿用两个空格缩进。类型导入使用 `import type`；避免新增不必要的 `any`，处理未使用的变量和参数。`@/` 已映射到 `src/`，相对导入同样可用，修改时保持局部一致。

业务接口统一放在 `src/api/` 并使用 `src/utils/request.ts` 提供的 `get`、`post`、`patch`、`put`、`del`。该层负责 Bearer 令牌、GET 防缓存参数、并发令牌刷新、401 会话失效、响应解包和 `ApiError`；不要在页面中重复实现。`src/utils/fetch.ts` 是底层传输实现，特殊上传或下载需参考现有 `src/api/attach.ts`。

认证状态通过 `useAuthStore` 管理，登录与退出沿用既有令牌及会话处理。受保护页面放在 `RequireAuth` 下，登录、注册等匿名页面放在 `RequireAnonymous` 下。不要在页面中重复维护认证状态。

## 样式与交互

移动端体验优先。页面 CSS 与组件就近维护，优先使用 `src/styles/index.css` 的语义变量和映射后的 Tailwind 类，保持现有字体、收支颜色、间距及圆角一致。新增图标优先沿用已有领域图标体系或 `lucide-react`。

界面变更参考仓库的 `docs/requirements/`、`docs/images/` 和 `DESIGN.md`，并结合当前实现。处理窄屏、底部安全区域、固定导航、弹层滚动与软键盘遮挡；交互控件使用合适的按钮或表单语义，并提供必要的可访问名称。异步操作需呈现加载、空数据和失败状态，避免重复提交，并使用已有 Toast/Dialog 反馈。

## 环境、构建与验证

请求地址由 `VITE_API_BASE_URL` 控制，默认 `/kethe/api`；开发代理见 `vite.config.ts`。`VITE_APP_MODE_ENV` 用于控制构建哈希和版本检测，修改环境逻辑时检查 `src/utils/version-checker.ts` 与 `build/meta.ts`。构建使用 `prod` 模式，对应 `.env.prod`；不要误用 `production` 模式替代。所有 `VITE_*` 变量都可能进入客户端，禁止存放密钥。

修改 PWA、路由或部署前缀时，同步检查 manifest、Service Worker 导航回退和 API 排除规则。构建版本信息由插件生成，不手工编辑 `dist/meta.json` 或 Service Worker 产物。

代码变更后运行 `pnpm lint` 和 `pnpm build`。当前没有自动化测试框架；对涉及的页面手动验证主要成功与失败路径，包括必要的登录跳转、表单校验、列表刷新和窄屏交互。涉及记账、筛选或统计时，检查接口参数与数据显示口径；涉及认证时，检查刷新令牌及登录失效流程。报告实际验证结果，未执行的浏览器或设备检查需明确说明。
