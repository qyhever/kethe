# 业务图标统一维护

## 范围与数据模型

分类、账户、成员、消费项目、商家的图形、名称、颜色、排序、启用状态统一由数据库提供。本期通过 SQL 维护，不新增图标管理后台或上传入口。导航、按钮等界面操作图标继续使用前端组件。

- `icon_resources`：完整 SVG、资源名称、可选主题色及资源启用状态；`resourceKey` 唯一。
- `icon_scene_options`：场景 `scene`、业务 `iconKey`、资源引用、显示名称 `label`、分组、排序、默认标识和启用状态；`(scene, iconKey)` 唯一。
- `account_icon_rules`：账户图标的适用一级类型及默认规则；`accountSubType = 0` 表示一级类型规则，非零表示子类型默认规则。
- `category_icon_resources`：只读兼容视图，将分类场景选项与资源合并。分类、流水、报表和用户初始化均从此视图取图标，不再维护 `category_icons` 表。

分类仍保存 `iconId`，其值为分类场景选项 ID；外键改为指向 `icon_scene_options.id`。其他四类继续保存原 `iconKey`，由所属业务固定场景解析。相同 key 可以在不同场景引用不同风格的资源，也可以共享同一资源。

分类默认使用该场景启用的 `isDefault` 选项；账户默认图标优先匹配子类型规则，再匹配一级类型规则。成员、项目、商家的新增表单从目录读取默认图标，项目和商家接口未传图标时也读取数据库默认值。初始化用户数据优先使用定义中的指定图标；指定图标停用时按数据库默认规则回退。已有用户的数据保持不变。

## 接口

`GET /api/icons` 返回 `{ version, items }`，外层仍由公共响应拦截器包装。接口沿用登录鉴权。

- `scene` 可选：`category`、`account`、`member`、`expense-project`、`merchant`。
- `selectableOnly` 可选布尔值，默认 `false`。完整目录包含停用项，供历史记录回显；选择器仅使用资源和场景选项均启用的项。
- 选项字段：`id`（字符串）、`scene`、`iconKey`、`iconName`、`groupKey`、`svgContent`、`color`、`isEnabled`、`isDefault`、`sortOrder`。
- `version` 为返回内容的摘要，图形、名称、颜色、排序、启用状态改变后更新。

兼容接口继续保留：`/category-icons` 返回可选分类资源；成员、项目、商家 `/options` 仍返回 key 数组，但改为查询数据库。`/accounts/options` 的 `accountIcons` 保留 `key`、`label`、`supportedTypes`，新增 `groupKey` 和 `defaultFor: [{ accountType, accountSubType }]`。账户的业务类型枚举继续由后端代码定义。

DTO 校验 key 的字符串类型、长度和 slug 格式；服务层根据数据库检查场景、启用状态及账户适用类型，新增合法 key 无需修改 DTO 白名单。

## 显示与停用

统一 `BusinessIcon` 渲染器读取目录，不再优先使用分类本地同名 SVG，也不再维护其余四类的组件和名称映射。原领域图标组件保留布局和调用接口。接口自带的分类 SVG 可在目录尚未加载时显示；缺失资源使用通用兜底图形。

目录在登录后加载，内存缓存五分钟，并合并并发请求。页面恢复可见或窗口重新聚焦时检查缓存；可见页面每分钟检查一次。版本未变时保持已有对象，变更后统一更新。打开成员、项目、商家图标选项时刷新目录。退出登录清空目录，并忽略旧会话尚未完成的响应。请求失败时保留已加载资源，后续刷新重试。

停用项不允许新增或替换选择，但保留历史图形。编辑其他字段或原样提交原图标可以保存。账户仍需符合适用一级类型；更改账户类型时重新选择或解析默认图标。资源和场景选项均不得物理删除已发布记录；图标 key、分类选项 ID 不应更改。

SVG 在统一目录响应和前端渲染时按绘图标签、属性白名单清洗，移除脚本、事件、内联样式、`foreignObject`、外部资源引用。手工导入时也应只保存静态绘图 SVG，保留 `viewBox`；单色图形使用 `currentColor`，多色图形保留路径填色。主题色为空时继承页面颜色。

## 升级与发布

已有数据库执行 `kethe-backend/sql/2026-10-26-unify-business-icons.sql`；全新数据库使用更新后的 `init.sql`。不要在已有环境执行会清空数据的 `init.sql`。

升级脚本保留分类原 ID 和其他业务 key；将分类当前实际使用的本地 SVG、账户自定义 SVG 和当前 Lucide 图形写入资源表，保留原名称、顺序和账户主题色。脚本支持重复执行，已存在的资源和选项不会被种子数据覆盖。分类迁移完成后移除原表，建立只读视图。

发布顺序：备份数据库，停止旧后端，执行升级脚本，部署新后端，再发布前端并刷新 PWA。新旧后端对分类表的依赖不同，不支持在迁移后直接回滚旧后端；回滚应恢复对应数据库备份。执行账户需有表、视图和临时存储过程的 DDL 权限；MySQL 客户端需支持 `DELIMITER`。

## 维护示例

新增商家图标（示例 key、名称、SVG 和颜色可替换）：

```sql
START TRANSACTION;
INSERT INTO icon_resources (resourceKey, name, svgContent, color)
VALUES ('merchant:coffee', '咖啡店',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h12v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M16 6h2a3 3 0 0 1 0 6h-2"/></svg>',
  NULL);
INSERT INTO icon_scene_options (scene, iconKey, resourceId, label, groupKey, sortOrder)
SELECT 'merchant', 'coffee', id, '咖啡店', 'other', 20
FROM icon_resources WHERE resourceKey = 'merchant:coffee';
COMMIT;
```

新增账户图标还需写入 `account_icon_rules`，否则不适用于任何账户类型。账户选择器的分组来自 `groupKey`，现有 `card` 显示“卡片”、`wallet` 显示“资金”。设置默认项时先清除同场景的旧默认标记；账户则按相同一级类型、子类型清除旧默认规则，确保每组只有一个启用的默认项。禁用默认项前应配置替代项，否则未指定图标的新增操作会返回明确错误。

停用某场景选项：

```sql
UPDATE icon_scene_options SET isEnabled = 0
WHERE scene = 'merchant' AND iconKey = 'coffee';
```

修改资源的 SVG 或颜色会影响所有引用该资源的场景；仅修改某个场景的名称、排序、启用状态应操作 `icon_scene_options`。

## 验证边界

需覆盖数据库新增 key、跨场景拒绝、停用项保留、账户适用性与默认规则、目录版本变化、SVG 清洗，以及列表、流水、报表、选择器和默认用户数据回显。SQL 应在目标 MySQL 环境演练升级、重复升级和全新初始化；代码检查、单测及模拟接口浏览器验证不能代替数据库迁移演练。

本次实现验证：前后端 lint、构建通过；图标、记账与默认数据相关 248 项单测通过；不依赖真实数据库的认证、资料、反馈、附件端到端测试 70 项通过。启用 Jest ESM 支持后，全量覆盖率检查为 539 项通过、1 项失败：既有邮件模板测试仍断言旧品牌名称，与当前模板不一致。本次未修改邮件代码。

隔离浏览器上下文使用模拟接口验证五类动态图标渲染、并发加载合并、版本更新、停用项回显和 SVG 清洗，以及账户、成员、项目、商家选择器的数据库名称与图形。320px 移动视口下账户图标弹层宽度为 320px；项目全局仍有既存的 `body { min-width: 375px }`，因此整页在 320px 下存在原有横向溢出。本次未连接真实数据库，未执行升级或回填脚本，未进行真实设备联调；依赖真实数据库的 `app.e2e-spec.ts` 未运行。
