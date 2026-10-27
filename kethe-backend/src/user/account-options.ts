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
