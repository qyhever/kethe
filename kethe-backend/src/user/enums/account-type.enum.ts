export enum AccountType {
  CASH = 1,
  CREDIT = 10,
  DEBIT = 20,
  VIRTUAL = 30,
  OTHER = 99,
}

export enum AccountSubType {
  CREDIT_CARD = 201,
  CONSUMER_CREDIT = 202,
  DEBIT_CARD = 301,
  PASSBOOK = 302,
  ONLINE_PAYMENT = 401,
  CASH_VOUCHER = 402,
  STORED_VALUE_CARD = 403,
}

export enum AccountNature {
  ASSET = 1,
  LIABILITY = 2,
}
