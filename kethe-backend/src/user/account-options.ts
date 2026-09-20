import {
  AccountNature,
  AccountSubType,
  AccountType,
} from './enums/account-type.enum'

export interface AccountSubTypeOption {
  value: AccountSubType
  code: string
  label: string
  supportsLast4: boolean
}

export interface AccountTypeOption {
  value: AccountType
  code: string
  label: string
  remark?: string
  defaultNature: AccountNature | null
  requiresNature: boolean
  supportsInstitution: boolean
  supportsLast4: boolean
  supportsCreditLimit: boolean
  subTypes: ReadonlyArray<AccountSubTypeOption>
}

export interface AccountIconOption {
  key: string
  label: string
  supportedTypes: ReadonlyArray<AccountType>
}

export const ACCOUNT_ICON_OPTIONS: ReadonlyArray<AccountIconOption> = [
  { key: 'cash', label: '现金', supportedTypes: [AccountType.CASH] },
  {
    key: 'credit-card',
    label: '信用卡',
    supportedTypes: [AccountType.CREDIT],
  },
  {
    key: 'consumer-credit',
    label: '消费信贷',
    supportedTypes: [AccountType.CREDIT],
  },
  {
    key: 'bank-card',
    label: '银行卡',
    supportedTypes: [AccountType.DEBIT],
  },
  {
    key: 'savings',
    label: '储蓄',
    supportedTypes: [AccountType.DEBIT, AccountType.OTHER],
  },
  {
    key: 'wallet',
    label: '钱包',
    supportedTypes: [AccountType.VIRTUAL, AccountType.OTHER],
  },
  { key: 'wechat', label: '微信', supportedTypes: [AccountType.VIRTUAL] },
  { key: 'alipay', label: '支付宝', supportedTypes: [AccountType.VIRTUAL] },
  { key: 'paypal', label: 'PayPal', supportedTypes: [AccountType.VIRTUAL] },
  {
    key: 'stored-value-card',
    label: '储值卡',
    supportedTypes: [AccountType.VIRTUAL],
  },
  {
    key: 'voucher',
    label: '现金券',
    supportedTypes: [AccountType.VIRTUAL],
  },
  {
    key: 'coins',
    label: '其他资金',
    supportedTypes: [AccountType.OTHER],
  },
]

export const ACCOUNT_OPTIONS: ReadonlyArray<AccountTypeOption> = [
  {
    value: AccountType.CASH,
    code: 'cash',
    label: '现金',
    defaultNature: AccountNature.ASSET,
    requiresNature: false,
    supportsInstitution: false,
    supportsLast4: false,
    supportsCreditLimit: false,
    subTypes: [],
  },
  {
    value: AccountType.CREDIT,
    code: 'credit',
    label: '信用账户',
    remark: '信用卡、蚂蚁花呗、京东白条可以放到这里',
    defaultNature: AccountNature.LIABILITY,
    requiresNature: false,
    supportsInstitution: true,
    supportsLast4: true,
    supportsCreditLimit: true,
    subTypes: [
      {
        value: AccountSubType.CREDIT_CARD,
        code: 'credit_card',
        label: '信用卡',
        supportsLast4: true,
      },
      {
        value: AccountSubType.CONSUMER_CREDIT,
        code: 'consumer_credit',
        label: '消费信贷',
        supportsLast4: false,
      },
    ],
  },
  {
    value: AccountType.DEBIT,
    code: 'debit',
    label: '储蓄账户',
    defaultNature: AccountNature.ASSET,
    requiresNature: false,
    supportsInstitution: true,
    supportsLast4: true,
    supportsCreditLimit: false,
    subTypes: [
      {
        value: AccountSubType.DEBIT_CARD,
        code: 'debit_card',
        label: '借记卡',
        supportsLast4: true,
      },
      {
        value: AccountSubType.PASSBOOK,
        code: 'passbook',
        label: '存折',
        supportsLast4: true,
      },
    ],
  },
  {
    value: AccountType.VIRTUAL,
    code: 'virtual',
    label: '虚拟账户',
    remark: '支付宝、微信钱包、饭卡、公交卡可以放到这里',
    defaultNature: AccountNature.ASSET,
    requiresNature: false,
    supportsInstitution: true,
    supportsLast4: false,
    supportsCreditLimit: false,
    subTypes: [
      {
        value: AccountSubType.ONLINE_PAYMENT,
        code: 'online_payment',
        label: '在线支付',
        supportsLast4: false,
      },
      {
        value: AccountSubType.CASH_VOUCHER,
        code: 'cash_voucher',
        label: '现金券',
        supportsLast4: false,
      },
      {
        value: AccountSubType.STORED_VALUE_CARD,
        code: 'stored_value_card',
        label: '储值卡',
        supportsLast4: false,
      },
    ],
  },
  {
    value: AccountType.OTHER,
    code: 'other',
    label: '其他',
    defaultNature: null,
    requiresNature: true,
    supportsInstitution: true,
    supportsLast4: false,
    supportsCreditLimit: false,
    subTypes: [],
  },
]

export function accountTypeOption(accountType: AccountType) {
  return ACCOUNT_OPTIONS.find((option) => option.value === accountType)
}

export function defaultAccountNature(accountType: AccountType) {
  return accountTypeOption(accountType)?.defaultNature ?? null
}

export function isValidAccountSubType(
  accountType: AccountType,
  accountSubType: AccountSubType | null,
) {
  const option = accountTypeOption(accountType)
  if (!option) return false
  if (option.subTypes.length === 0) return accountSubType === null
  return option.subTypes.some((item) => item.value === accountSubType)
}

export function isValidAccountIcon(iconKey: string, accountType: AccountType) {
  return ACCOUNT_ICON_OPTIONS.some(
    (option) =>
      option.key === iconKey && option.supportedTypes.includes(accountType),
  )
}

export function defaultAccountIconKey(
  accountType: AccountType,
  accountSubType: AccountSubType | null,
) {
  if (accountSubType === AccountSubType.CREDIT_CARD) return 'credit-card'
  if (accountSubType === AccountSubType.CONSUMER_CREDIT)
    return 'consumer-credit'
  if (accountSubType === AccountSubType.DEBIT_CARD) return 'bank-card'
  if (accountSubType === AccountSubType.PASSBOOK) return 'savings'
  if (accountSubType === AccountSubType.STORED_VALUE_CARD)
    return 'stored-value-card'
  if (accountSubType === AccountSubType.CASH_VOUCHER) return 'voucher'
  if (accountType === AccountType.CASH) return 'cash'
  if (accountType === AccountType.VIRTUAL) return 'wallet'
  return 'coins'
}
