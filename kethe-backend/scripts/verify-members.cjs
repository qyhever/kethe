// pnpm build && node scripts/verify-members.cjs
// 使用 .env 连接信息，仅创建并清理本脚本生成的临时数据库。
require('reflect-metadata')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const mysql = require('mysql2/promise')
const { DataSource } = require('typeorm')
const { Member } = require('../dist/user/entities/member.entity')
const { User } = require('../dist/user/entities/user.entity')
const { Account } = require('../dist/user/entities/account.entity')
const { Category } = require('../dist/user/entities/category.entity')
const { CategoryIcon } = require('../dist/ledger/entities/category-icon.entity')
const { Transaction } = require('../dist/ledger/entities/transaction.entity')
const { DefaultUserDataService } = require('../dist/user/default-user-data.service')
const { LedgerService } = require('../dist/ledger/ledger.service')
const { MemberService } = require('../dist/ledger/member.service')

async function check(dataSource) {
  const user = await dataSource.getRepository(User).save({ username: 'member-check', nickname: '验证', password: 'unused', email: 'member-check@example.invalid' })
  const other = await dataSource.getRepository(User).save({ username: 'member-other', nickname: '其他', password: 'unused', email: 'member-other@example.invalid' })
  const defaults = new DefaultUserDataService()
  await dataSource.transaction(manager => defaults.initialize(user.id, manager))
  await dataSource.transaction(manager => defaults.initialize(other.id, manager))
  const members = new MemberService(dataSource)
  const ledger = new LedgerService(dataSource, dataSource.getRepository(Category), dataSource.getRepository(Account), dataSource.getRepository(CategoryIcon), dataSource.getRepository(Transaction))
  const initial = await members.list(user.id)
  assert.deepEqual(initial.map(item => item.name), ['本人', '老婆', '老公', '子女', '父母', '家庭共用'])
  assert(initial.every(item => item.expenseAmount === '0'))
  const first = initial[0].id
  const second = initial[1].id
  const accounts = await ledger.listAccounts(user.id)
  const expense = (await ledger.listCategories(user.id, 1))[0].id
  const income = (await ledger.listCategories(user.id, 2))[0].id
  const payload = { transactionType: 1, amount: '1250', categoryId: expense, accountId: accounts[0].id, currency: 'CNY', transactionTime: '2025-12-31T04:00:00.000Z', timePrecision: 2 }
  const amount = async id => (await members.list(user.id)).find(item => item.id === id).expenseAmount
  const legacy = await ledger.createTransaction(user.id, payload)
  assert.equal(legacy.memberId, null)
  let transaction = await ledger.createTransaction(user.id, { ...payload, memberId: first })
  assert.equal(await amount(first), '1250')
  transaction = await ledger.updateTransaction(user.id, transaction.id, { ...payload, amount: '2000' })
  assert.equal(transaction.memberId, first)
  assert.equal(await amount(first), '2000')
  transaction = await ledger.updateTransaction(user.id, transaction.id, { ...payload, memberId: second })
  assert.equal(await amount(first), '0')
  assert.equal(await amount(second), '1250')
  transaction = await ledger.updateTransaction(user.id, transaction.id, { ...payload, memberId: null })
  assert.equal(transaction.memberId, null)
  assert.equal(await amount(second), '0')
  transaction = await ledger.updateTransaction(user.id, transaction.id, { ...payload, memberId: first })
  await ledger.createTransaction(user.id, { ...payload, memberId: first, transactionType: 2, categoryId: income })
  await ledger.createTransaction(user.id, { ...payload, memberId: first, transactionTime: '2026-10-20T04:00:00.000Z' })
  const transfer = { ...payload, transactionType: 3, categoryId: undefined, targetAccountId: accounts[1].id }
  await ledger.createTransaction(user.id, transfer)
  await assert.rejects(ledger.createTransaction(user.id, { ...transfer, memberId: first }))
  assert.equal(await amount(first), '2500')
  await assert.rejects(ledger.createTransaction(other.id, { ...payload, accountId: (await ledger.listAccounts(other.id))[0].id, categoryId: (await ledger.listCategories(other.id, 1))[0].id, memberId: first }))
  await assert.rejects(members.get(other.id, first))
  await assert.rejects(members.update(other.id, first, { name: '其他' }))
  await assert.rejects(members.remove(other.id, first))
  const acrossYears = await ledger.listTransactions(user.id, { memberIds: [first], transactionType: 1, currentPage: 1, pageSize: 20 })
  assert.equal(acrossYears.total, 2)
  assert.deepEqual(acrossYears.summaries.map(item => item.year), ['2026', '2025'])
  assert(acrossYears.summaries.every(item => item.expense === '1250' && item.income === '0'))
  await ledger.deleteTransaction(user.id, transaction.id)
  assert.equal(await amount(first), '1250')
  const result = await ledger.listTransactions(user.id, { memberIds: [first], transactionType: 1, currentPage: 1, pageSize: 20 })
  assert.equal(result.total, 1)
  assert.equal(result.summaries[0].expense, '1250')
  const historical = result.list[0]
  await members.update(user.id, first, { name: '自己', iconKey: 'heart' })
  await members.remove(user.id, first)
  assert.equal((await members.list(user.id)).length, 5)
  await assert.rejects(members.get(user.id, first))
  const deleted = await ledger.getTransaction(user.id, historical.id)
  assert.equal(deleted.memberName, '自己')
  assert.equal(deleted.memberIconKey, 'heart')
  assert.equal(deleted.memberDeleted, true)
  await ledger.updateTransaction(user.id, historical.id, { ...payload, memberId: first })
  await assert.rejects(ledger.createTransaction(user.id, { ...payload, memberId: first }))
  await assert.rejects(ledger.updateTransaction(user.id, legacy.id, { ...payload, memberId: first }))
  await dataSource.transaction(manager => defaults.initialize(user.id, manager))
  assert.equal((await members.list(user.id)).length, 5)
  const all = await dataSource.getRepository(Member).find({ where: { userId: user.id }, withDeleted: true })
  assert.equal(all.length, 6)
  assert.equal(all.find(item => item.id === first).name, '自己')
  assert(all.find(item => item.id === first).deletedAt)
  await ledger.updateTransaction(user.id, historical.id, { ...payload, memberId: null })
  await assert.rejects(ledger.updateTransaction(user.id, historical.id, { ...payload, memberId: first }))
}

async function main() {
  process.loadEnvFile('.env')
  const connection = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT), username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD }
  const admin = await mysql.createConnection({ host: connection.host, port: connection.port, user: connection.username, password: connection.password, multipleStatements: true })
  const init = fs.readFileSync('sql/init.sql', 'utf8')
  const migration = fs.readFileSync('sql/2026-10-20-members.sql', 'utf8')
  const memberTable = /CREATE TABLE members \([\s\S]+?ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\s*/
  assert(memberTable.test(init))
  try {
    for (const mode of ['fresh', 'upgrade']) {
      const database = 'kethe_members_verify_' + Date.now() + '_' + mode
      assert(/^kethe_members_verify_\d+_(fresh|upgrade)$/.test(database))
      await admin.query('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4')
      let source
      try {
        await admin.query('USE `' + database + '`')
        if (mode === 'fresh') await admin.query(init)
        else {
          const legacy = init.replace(memberTable, '').replace('    memberId BIGINT UNSIGNED NULL,\n', '').replace(/    KEY idx_transactions_user_member_time[^\n]+\n/, '').replace(/    CONSTRAINT fk_transactions_member[^\n]+\n/, '')
          assert(!legacy.includes('memberId'))
          await admin.query(legacy)
          // 存量流水升级后必须保持空关联。
          await admin.query("INSERT INTO users (username,nickname,password,email) VALUES ('legacy','legacy','unused','legacy@example.invalid')")
          const [[user]] = await admin.query("SELECT id FROM users WHERE username='legacy'")
          await admin.query('INSERT INTO categories (userId,categoryType,name) VALUES (?,1,?)', [user.id, '旧分类'])
          await admin.query('INSERT INTO accounts (userId,name,accountType,accountNature) VALUES (?,?,1,1)', [user.id, '旧账户'])
          await admin.query('INSERT INTO transactions (userId,transactionType,amount,categoryId,accountId,transactionTime) SELECT ?,1,100,c.id,a.id,NOW(3) FROM categories c JOIN accounts a ON a.userId=c.userId WHERE c.userId=? LIMIT 1', [user.id, user.id])
          await admin.query(migration)
          const [[row]] = await admin.query('SELECT memberId FROM transactions LIMIT 1')
          assert.equal(row.memberId, null)
        }
        source = await new DataSource({ ...connection, type: 'mysql', database, timezone: 'Z', synchronize: false, entities: [User, Member, Account, Category, CategoryIcon, Transaction] }).initialize()
        await check(source)
        console.log(mode + ': schema, defaults, transaction associations, totals, isolation and soft deletion passed')
      } finally {
        if (source?.isInitialized) await source.destroy()
        await admin.query('DROP DATABASE `' + database + '`')
      }
    }
  } finally { await admin.end() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
