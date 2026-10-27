# 商家管理与流水关联

商家按用户独立管理，仅支出流水可关联一个商家，选填且默认“无”。本次提供列表、新增、编辑，不提供详情、统计、归档或删除。名称去除首尾空白后为 1～30 个字符，允许同名；图标由数据库商家场景目录维护，初始默认 store，后续可配置，见 [业务图标统一维护](2026-10-26-business-icons.md)。

“我的”在项目设置之后增加商家设置。路由 /profile/merchants、/profile/merchants/new、/profile/merchants/:id/edit 均受登录守卫保护。保存后返回列表并重新加载。记一笔在项目之后增加商家行，编辑回显，切换收入或转账清空关联。底部选择面板提供“无”、加载、失败重试和空数据提示。

流水筛选支持商家多选、全选与取消、摘要、应用和重置。商家条件进入草稿、应用状态和页面返回缓存；收入和转账清空并禁用商家条件。多个商家之间取并集，与其他筛选取交集；列表、总数、年月汇总使用相同查询条件。

## API

所有路由位于现有 /api 前缀下，使用现有 Bearer 认证与公共响应包装。前端沿用 /kethe/api 代理前缀。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /merchants | 当前用户列表，按 sortOrder、id 升序 |
| GET | /merchants/options | 图标 key 数组 |
| GET | /merchants/:id | 当前用户的商家，用于编辑回显 |
| POST | /merchants | 新增，name 必填，iconKey 选填 |
| PATCH | /merchants/:id | 编辑，name 和 iconKey 可省略，不接受 null |

商家返回 id（字符串）、name、iconKey 及归属、默认标识、排序和时间字段。初始图标：store、shopping-cart、shopping-bag、package、globe、gift、tags、building；后续可直接在数据库增加、排序或停用。商家 ID 路径使用现有正整数 BIGINT 校验；不存在或不属于当前用户返回 404。

POST /transactions 与 PATCH /transactions/:id 增加 merchantId?: string | null。创建省略为空，更新省略保留，显式 null 清空；切换非支出时省略或 null 清空，传非空关联返回 400。不存在或其他用户的商家返回 400。流水查询、新增、更新响应增加 merchantId、merchantName、merchantIconKey，无关联均为 null。ID 始终使用字符串。

POST /transactions/query 增加 merchantIds?: string[]，空数组表示不限制，非正整数字符串或非数组返回 400。过滤条件进入统一流水查询构造器，导出等复用此构造器的调用也保持一致。

## 默认数据与升级

新用户注册时初始化；现有用户由升级 SQL 补齐。默认数据按下表顺序展示，初始化服务按 userId 和 systemKey 幂等补齐，保留用户修改的名称、图标与排序。

| 顺序 | 名称 | iconKey | systemKey |
| --- | --- | --- | --- |
| 1 | 超市 | shopping-cart | merchant_supermarket |
| 2 | 商场 | building | merchant_mall |
| 3 | 亚马逊 | globe | merchant_amazon |
| 4 | 淘宝 | shopping-bag | merchant_taobao |
| 5 | 京东 | package | merchant_jd |
| 6 | 拼多多 | tags | merchant_pinduoduo |
| 7 | 其他 | store | merchant_other |

默认定义位于 kethe-backend/src/user/default-user-data.constants.ts。自定义商家 systemKey 为 null、isSystemDefault 为 false、sortOrder 为 100，追加在默认商家之后。商家表以 (userId, systemKey) 唯一约束防止默认项重复，不限制同名。

部署依次进行：

1. 备份数据库，执行 kethe-backend/sql/2026-10-26-merchants.sql，要求 MySQL 8.0.16+ 支持 CHECK 约束。
2. 部署后端。
3. 部署前端。

DDL 部分只执行一次；末尾 INSERT 补齐语句可单独重复执行，不覆盖用户编辑。历史流水 merchantId 保持 NULL。全新数据库使用同步更新的 sql/init.sql，由注册初始化默认商家。升级增加商家表、流水关联列、外键、按用户和商家查询的联合索引，以及仅支出可关联的 CHECK 约束。本次开发验证不执行升级或回填脚本。

## 实施验证记录

- 前后端 lint、build 通过，后端 lint 的自动格式修复已审查；构建生成的 public/meta.json 已移除。
- 商家、初始化及流水服务相关的 7 个测试文件共 85 项通过，包括 HTTP 参数校验、用户隔离、默认商家补齐、流水关联/清空/类型切换和余额、列表与汇总筛选一致性。
- 使用 NODE_OPTIONS=--experimental-vm-modules 运行全量 Jest 与覆盖率检查：53 个测试套件中 52 个通过，526 项中 525 项通过。现存 mail.service.spec.ts 仍断言旧品牌 MINGYE CARPOOL，与当前 Kethe 邮件模板不符；未改动此无关测试。总语句覆盖率 78.64%，商家 service/controller/DTO 语句覆盖率均为 100%。不加该 Node 参数时头像校验测试因 Jest 动态 import 支持而失败。
- 额外执行 tsc --noEmit 时，现存 src/user/profile.spec.ts:45 的 ConfigService 泛型不匹配；正式后端 build 不包含测试文件并已通过。
- 在隔离浏览器上下文使用模拟 API，以 320×720 视口验证商家新增与编辑后的列表刷新、图标选择、流水回显与切换收入清空、商家多选/全选、摘要、应用请求、收入禁用、重置、编辑流水返回后条件恢复，以及列表加载失败后的重试恢复；检查到的页面与选择面板无横向溢出。未连接真实后端和数据库联调，未在真实移动设备验证。
- 未执行数据库升级 SQL 或默认数据回填。
