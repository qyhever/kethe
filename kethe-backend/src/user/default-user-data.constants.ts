import { AccountType } from './enums/account-type.enum'

export const EXPENSE_CATEGORY_TYPE = 1
export const INCOME_CATEGORY_TYPE = 2

export interface DefaultExpenseCategory {
  name: string
  systemKey: string
  children: ReadonlyArray<{
    name: string
    systemKey: string
  }>
}

export const DEFAULT_EXPENSE_CATEGORIES: ReadonlyArray<DefaultExpenseCategory> =
  [
    {
      name: '餐饮',
      systemKey: 'expense_food',
      children: [
        { name: '早餐', systemKey: 'expense_food_breakfast' },
        { name: '午餐', systemKey: 'expense_food_lunch' },
        { name: '晚餐', systemKey: 'expense_food_dinner' },
        { name: '水果', systemKey: 'expense_food_fruit' },
        { name: '零食', systemKey: 'expense_food_snacks' },
        { name: '酒水饮料', systemKey: 'expense_food_drinks' },
      ],
    },
    {
      name: '交通',
      systemKey: 'expense_transport',
      children: [
        { name: '公交', systemKey: 'expense_transport_bus' },
        { name: '地铁', systemKey: 'expense_transport_subway' },
        { name: '打车', systemKey: 'expense_transport_taxi' },
        { name: '火车', systemKey: 'expense_transport_train' },
        { name: '飞机', systemKey: 'expense_transport_flight' },
      ],
    },
    {
      name: '购物',
      systemKey: 'expense_shopping',
      children: [
        { name: '日用品', systemKey: 'expense_shopping_daily' },
        { name: '服饰', systemKey: 'expense_shopping_clothing' },
        { name: '数码', systemKey: 'expense_shopping_digital' },
        { name: '美妆', systemKey: 'expense_shopping_beauty' },
        { name: '家电', systemKey: 'expense_shopping_appliances' },
        { name: '其他购物', systemKey: 'expense_shopping_other' },
      ],
    },
    {
      name: '住房',
      systemKey: 'expense_housing',
      children: [
        { name: '房租', systemKey: 'expense_housing_rent' },
        { name: '房贷', systemKey: 'expense_housing_mortgage' },
        { name: '水电', systemKey: 'expense_housing_utilities' },
        { name: '燃气', systemKey: 'expense_housing_gas' },
        { name: '物业', systemKey: 'expense_housing_property' },
      ],
    },
    {
      name: '娱乐',
      systemKey: 'expense_entertainment',
      children: [
        { name: '电影', systemKey: 'expense_entertainment_movie' },
        { name: '游戏', systemKey: 'expense_entertainment_games' },
        { name: '旅游', systemKey: 'expense_entertainment_travel' },
        { name: '聚会', systemKey: 'expense_entertainment_party' },
        { name: '运动', systemKey: 'expense_entertainment_sports' },
      ],
    },
    {
      name: '医疗',
      systemKey: 'expense_medical',
      children: [
        { name: '药品', systemKey: 'expense_medical_medicine' },
        { name: '门诊', systemKey: 'expense_medical_outpatient' },
        { name: '住院', systemKey: 'expense_medical_hospital' },
        { name: '保健', systemKey: 'expense_medical_healthcare' },
      ],
    },
    {
      name: '教育',
      systemKey: 'expense_education',
      children: [
        { name: '学费', systemKey: 'expense_education_tuition' },
        { name: '书籍', systemKey: 'expense_education_books' },
        { name: '培训', systemKey: 'expense_education_training' },
        { name: '考试', systemKey: 'expense_education_exams' },
      ],
    },
    {
      name: '人情',
      systemKey: 'expense_gift',
      children: [
        { name: '礼金', systemKey: 'expense_gift_cash' },
        { name: '礼物', systemKey: 'expense_gift_present' },
        { name: '红包', systemKey: 'expense_gift_red_packet' },
        { name: '请客', systemKey: 'expense_gift_treat' },
      ],
    },
    {
      name: '通讯',
      systemKey: 'expense_communication',
      children: [
        { name: '话费', systemKey: 'expense_communication_phone' },
        { name: '网费', systemKey: 'expense_communication_internet' },
        { name: '快递', systemKey: 'expense_communication_delivery' },
      ],
    },
    {
      name: '订阅',
      systemKey: 'expense_subscription',
      children: [
        { name: '影音', systemKey: 'expense_subscription_media' },
        { name: '会员', systemKey: 'expense_subscription_membership' },
        { name: '软件', systemKey: 'expense_subscription_software' },
        { name: '云服务', systemKey: 'expense_subscription_cloud' },
      ],
    },
    {
      name: '金融',
      systemKey: 'expense_finance',
      children: [
        { name: '手续费', systemKey: 'expense_finance_fee' },
        { name: '利息', systemKey: 'expense_finance_interest' },
        { name: '保险', systemKey: 'expense_finance_insurance' },
        { name: '税费', systemKey: 'expense_finance_tax' },
      ],
    },
    {
      name: '其他',
      systemKey: 'expense_other',
      children: [
        { name: '宠物', systemKey: 'expense_other_pet' },
        { name: '公益', systemKey: 'expense_other_charity' },
        { name: '维修', systemKey: 'expense_other_repair' },
        { name: '丢失', systemKey: 'expense_other_loss' },
        { name: '其他支出', systemKey: 'expense_other_miscellaneous' },
      ],
    },
  ]

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '工资', systemKey: 'income_salary' },
  { name: '奖金', systemKey: 'income_bonus' },
  { name: '兼职', systemKey: 'income_part_time' },
  { name: '理财', systemKey: 'income_investment' },
  { name: '礼金', systemKey: 'income_gift' },
  { name: '其他', systemKey: 'income_other' },
] as const

export const DEFAULT_ACCOUNTS = [
  { name: '现金', systemKey: 'cash', accountType: AccountType.CASH },
  {
    name: '银行卡',
    systemKey: 'bank_card',
    accountType: AccountType.BANK_CARD,
  },
  { name: 'PayPal', systemKey: 'paypal', accountType: AccountType.PAYPAL },
  { name: '微信', systemKey: 'wechat', accountType: AccountType.WECHAT },
  { name: '支付宝', systemKey: 'alipay', accountType: AccountType.ALIPAY },
] as const
