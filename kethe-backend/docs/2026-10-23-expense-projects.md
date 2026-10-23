# 消费项目

消费项目与招聘业务 projects 独立，入口为“我的 → 项目设置”。管理路由为 /profile/expense-projects，API 为 /api/expense-projects。

## 行为

- 仅支出流水可关联一个消费项目；项目日期仅作描述，不限制流水时间。
- 归档后禁止新增关联，已有流水可保留原项目、移除或更换；支持手动恢复。
- 项目采用软删除。任何流水引用（包括软删除流水）均阻止删除，返回 409。
- 项目金额、笔数仅聚合未删除支出；hasTransactions 包含软删除流水引用。
- 分类统计保留停用和软删除分类，下钻将一级直属支出列为“未细分”。金额使用分的字符串，计算使用 BigInt。
- 编辑支出时不传 expenseProjectId 保留原关联，null 清空；改为收入或转账且未传项目时自动清空。
- 流水查询 expenseProjectIds 数组内取并集，与其他筛选取交集；项目详情深链接默认查询全部日期。

## 发布

1. 备份数据库，执行 sql/2026-10-23-expense-projects.sql。
2. 发布后端，再发布前端。
3. 应用回退时保留新增表和可空字段。升级脚本为一次性迁移，请勿重复执行。

本次仅在临时隔离数据库执行验证，未修改当前应用数据库。

## 验证记录（2026-10-23）

- 定向 Jest：8 个测试套件、159 个测试通过（项目 DTO、服务、控制器、关联规则、公共 ID 校验、流水回归）。
- pnpm exec nest build、前端 pnpm lint 与 pnpm build 通过；新增后端文件 ESLint 通过。
- pnpm test:cov：全量运行时 45 个套件通过、1 个套件失败；470 个测试通过、1 个失败。失败位于 mail/mail.service.spec.ts，测试仍期望 MINGYE CARPOOL / 明叶同行，模板实际使用 KETHE / Kethe，与消费项目无关。该次全量运行后另补了一项控制器详情用例，定向测试通过。消费项目服务和 DTO 行覆盖率均为 100%。
- 临时 MySQL 数据库对比全新初始化和旧结构升级后的列、索引、外键和检查约束，结果一致。
- 真实 MySQL + TypeORM 验证创建、日期清空、用户隔离、跨日期累计、直属与二级分类统计、归档保留关联、切换收入清空、删除流水后累计更新、软删除引用阻止删除及历史分类保留。
- 两连接并发验证：归档持锁时创建关联等待，归档提交后拒绝；关联持锁时删除等待，新引用提交后返回 409。
- 浏览器使用模拟 API 验证 375px 布局、深色语义变量、长名称、环图下钻、归档项目多选筛选、切换收入清空项目条件，以及项目详情 → 流水 → 编辑 → 流水返回链路。

复验命令：

~~~powershell
# 后端目录
pnpm exec jest --runInBand expense-project positive-bigint-id ledger.service.spec ledger.dto.spec transaction.controller.spec
pnpm test:cov --runInBand
pnpm exec nest build

# 前端目录
pnpm lint
pnpm build
~~~
