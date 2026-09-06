import { TransactionType } from './entities/transaction.entity'

export interface BalanceTransaction {
  transactionType: TransactionType
  amount: string
  accountId: string
  targetAccountId: string | null
}

export function calculateBalanceChanges(
  transaction: BalanceTransaction,
  direction: 1 | -1,
): Map<string, bigint> {
  const amount = BigInt(transaction.amount) * BigInt(direction)
  if (transaction.transactionType === TransactionType.EXPENSE) {
    return new Map([[transaction.accountId, -amount]])
  }
  if (transaction.transactionType === TransactionType.INCOME) {
    return new Map([[transaction.accountId, amount]])
  }
  return new Map([
    [transaction.accountId, -amount],
    [transaction.targetAccountId!, amount],
  ])
}
