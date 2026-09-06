import { calculateBalanceChanges } from './balance'
import { TransactionType } from './entities/transaction.entity'

describe('calculateBalanceChanges', () => {
  it.each([
    [TransactionType.EXPENSE, '-3800'],
    [TransactionType.INCOME, '3800'],
  ])('计算收支类型 %s 的主账户变化', (transactionType, expected) => {
    const changes = calculateBalanceChanges(
      {
        transactionType,
        amount: '3800',
        accountId: '1',
        targetAccountId: null,
      },
      1,
    )
    expect(changes.get('1')?.toString()).toBe(expected)
  })

  it('转账对双方账户产生相反影响', () => {
    const changes = calculateBalanceChanges(
      {
        transactionType: TransactionType.TRANSFER,
        amount: '1000',
        accountId: '1',
        targetAccountId: '2',
      },
      1,
    )
    expect(changes.get('1')).toBe(-1000n)
    expect(changes.get('2')).toBe(1000n)
  })

  it('反向应用可恢复原流水影响', () => {
    const changes = calculateBalanceChanges(
      {
        transactionType: TransactionType.EXPENSE,
        amount: '3800',
        accountId: '1',
        targetAccountId: null,
      },
      -1,
    )
    expect(changes.get('1')).toBe(3800n)
  })
})
