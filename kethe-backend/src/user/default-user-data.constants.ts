import {
  AccountNature,
  AccountSubType,
  AccountType,
} from './enums/account-type.enum'

export const EXPENSE_CATEGORY_TYPE = 1
export const INCOME_CATEGORY_TYPE = 2

export interface DefaultExpenseCategory {
  name: string
  systemKey: string
  children: ReadonlyArray<{
    name: string
    systemKey: string
    iconKey: string
  }>
}

export const DEFAULT_EXPENSE_CATEGORIES: ReadonlyArray<DefaultExpenseCategory> =
  [
    {
      name: '餐饮',
      systemKey: 'expense_food',
      children: [
        {
          name: '早餐',
          systemKey: 'expense_food_breakfast',
          iconKey: 'breakfast',
        },
        { name: '午餐', systemKey: 'expense_food_lunch', iconKey: 'lunch' },
        { name: '晚餐', systemKey: 'expense_food_dinner', iconKey: 'dinner' },
        { name: '水果', systemKey: 'expense_food_fruit', iconKey: 'fruit' },
        { name: '零食', systemKey: 'expense_food_snacks', iconKey: 'snack' },
        {
          name: '酒水饮料',
          systemKey: 'expense_food_drinks',
          iconKey: 'drinks',
        },
      ],
    },
    {
      name: '交通',
      systemKey: 'expense_transport',
      children: [
        { name: '公交', systemKey: 'expense_transport_bus', iconKey: 'bus' },
        {
          name: '地铁',
          systemKey: 'expense_transport_subway',
          iconKey: 'train',
        },
        { name: '打车', systemKey: 'expense_transport_taxi', iconKey: 'taxi' },
        {
          name: '火车',
          systemKey: 'expense_transport_train',
          iconKey: 'railway',
        },
        {
          name: '飞机',
          systemKey: 'expense_transport_flight',
          iconKey: 'flight',
        },
        {
          name: '私家车',
          systemKey: 'expense_transport_private_car',
          iconKey: 'private-car',
        },
        { name: '加油', systemKey: 'expense_transport_fuel', iconKey: 'fuel' },
        {
          name: '充电',
          systemKey: 'expense_transport_charging',
          iconKey: 'charging',
        },
        {
          name: '停车',
          systemKey: 'expense_transport_parking',
          iconKey: 'parking',
        },
        {
          name: '过路费',
          systemKey: 'expense_transport_toll',
          iconKey: 'toll',
        },
        {
          name: '租车',
          systemKey: 'expense_transport_car_rental',
          iconKey: 'car-rental',
        },
        {
          name: '游轮',
          systemKey: 'expense_transport_cruise',
          iconKey: 'cruise',
        },
      ],
    },
    {
      name: '购物',
      systemKey: 'expense_shopping',
      children: [
        {
          name: '日用品',
          systemKey: 'expense_shopping_daily',
          iconKey: 'cart',
        },
        {
          name: '服饰',
          systemKey: 'expense_shopping_clothing',
          iconKey: 'clothes',
        },
        {
          name: '数码',
          systemKey: 'expense_shopping_digital',
          iconKey: 'phone',
        },
        {
          name: '美妆',
          systemKey: 'expense_shopping_beauty',
          iconKey: 'beauty',
        },
        {
          name: '家电',
          systemKey: 'expense_shopping_appliances',
          iconKey: 'appliances',
        },
        {
          name: '其他购物',
          systemKey: 'expense_shopping_other',
          iconKey: 'shopping-other',
        },
      ],
    },
    {
      name: '住房',
      systemKey: 'expense_housing',
      children: [
        { name: '房租', systemKey: 'expense_housing_rent', iconKey: 'rent' },
        {
          name: '房贷',
          systemKey: 'expense_housing_mortgage',
          iconKey: 'mortgage',
        },
        {
          name: '水电',
          systemKey: 'expense_housing_utilities',
          iconKey: 'utilities',
        },
        { name: '燃气', systemKey: 'expense_housing_gas', iconKey: 'gas' },
        {
          name: '物业',
          systemKey: 'expense_housing_property',
          iconKey: 'property',
        },
      ],
    },
    {
      name: '娱乐',
      systemKey: 'expense_entertainment',
      children: [
        {
          name: '电影',
          systemKey: 'expense_entertainment_movie',
          iconKey: 'movie',
        },
        {
          name: '游戏',
          systemKey: 'expense_entertainment_games',
          iconKey: 'game',
        },
        {
          name: '旅游',
          systemKey: 'expense_entertainment_travel',
          iconKey: 'travel',
        },
        {
          name: '聚会',
          systemKey: 'expense_entertainment_party',
          iconKey: 'party',
        },
        {
          name: '运动',
          systemKey: 'expense_entertainment_sports',
          iconKey: 'fitness',
        },
      ],
    },
    {
      name: '医疗',
      systemKey: 'expense_medical',
      children: [
        {
          name: '药品',
          systemKey: 'expense_medical_medicine',
          iconKey: 'medicine',
        },
        {
          name: '门诊',
          systemKey: 'expense_medical_outpatient',
          iconKey: 'outpatient',
        },
        {
          name: '住院',
          systemKey: 'expense_medical_hospital',
          iconKey: 'hospital',
        },
        {
          name: '保健',
          systemKey: 'expense_medical_healthcare',
          iconKey: 'healthcare',
        },
      ],
    },
    {
      name: '教育',
      systemKey: 'expense_education',
      children: [
        {
          name: '学费',
          systemKey: 'expense_education_tuition',
          iconKey: 'tuition',
        },
        {
          name: '书籍',
          systemKey: 'expense_education_books',
          iconKey: 'books',
        },
        {
          name: '培训',
          systemKey: 'expense_education_training',
          iconKey: 'training',
        },
        {
          name: '考试',
          systemKey: 'expense_education_exams',
          iconKey: 'exams',
        },
      ],
    },
    {
      name: '人情',
      systemKey: 'expense_gift',
      children: [
        { name: '礼金', systemKey: 'expense_gift_cash', iconKey: 'gift-money' },
        { name: '礼物', systemKey: 'expense_gift_present', iconKey: 'present' },
        {
          name: '红包',
          systemKey: 'expense_gift_red_packet',
          iconKey: 'red-packet',
        },
        { name: '请客', systemKey: 'expense_gift_treat', iconKey: 'treat' },
      ],
    },
    {
      name: '通讯',
      systemKey: 'expense_communication',
      children: [
        {
          name: '话费',
          systemKey: 'expense_communication_phone',
          iconKey: 'phone',
        },
        {
          name: '网费',
          systemKey: 'expense_communication_internet',
          iconKey: 'internet',
        },
        {
          name: '快递',
          systemKey: 'expense_communication_delivery',
          iconKey: 'delivery',
        },
      ],
    },
    {
      name: '订阅',
      systemKey: 'expense_subscription',
      children: [
        {
          name: '影音',
          systemKey: 'expense_subscription_media',
          iconKey: 'media',
        },
        {
          name: '会员',
          systemKey: 'expense_subscription_membership',
          iconKey: 'membership',
        },
        {
          name: '软件',
          systemKey: 'expense_subscription_software',
          iconKey: 'software',
        },
        {
          name: '云服务',
          systemKey: 'expense_subscription_cloud',
          iconKey: 'cloud',
        },
      ],
    },
    {
      name: '金融',
      systemKey: 'expense_finance',
      children: [
        { name: '手续费', systemKey: 'expense_finance_fee', iconKey: 'fee' },
        {
          name: '利息',
          systemKey: 'expense_finance_interest',
          iconKey: 'interest',
        },
        {
          name: '保险',
          systemKey: 'expense_finance_insurance',
          iconKey: 'insurance',
        },
        { name: '税费', systemKey: 'expense_finance_tax', iconKey: 'tax' },
      ],
    },
    {
      name: '其他',
      systemKey: 'expense_other',
      children: [
        { name: '宠物', systemKey: 'expense_other_pet', iconKey: 'pet' },
        {
          name: '公益',
          systemKey: 'expense_other_charity',
          iconKey: 'charity',
        },
        { name: '维修', systemKey: 'expense_other_repair', iconKey: 'repair' },
        { name: '丢失', systemKey: 'expense_other_loss', iconKey: 'loss' },
        {
          name: '其他支出',
          systemKey: 'expense_other_miscellaneous',
          iconKey: 'miscellaneous',
        },
      ],
    },
  ]

export const DEFAULT_INCOME_CATEGORIES = [
  { name: '工资', systemKey: 'income_salary', iconKey: 'salary' },
  { name: '奖金', systemKey: 'income_bonus', iconKey: 'bonus' },
  { name: '兼职', systemKey: 'income_part_time', iconKey: 'part-time' },
  { name: '理财', systemKey: 'income_investment', iconKey: 'investment' },
  { name: '礼金', systemKey: 'income_gift', iconKey: 'gift-money' },
  { name: '其他', systemKey: 'income_other', iconKey: 'other' },
] as const

export const DEFAULT_ACCOUNTS = [
  {
    name: '现金',
    systemKey: 'cash',
    accountType: AccountType.CASH,
    accountSubType: null,
    accountNature: AccountNature.ASSET,
    iconKey: 'cash',
  },
  {
    name: '储蓄卡',
    systemKey: 'bank_card',
    accountType: AccountType.DEBIT,
    accountSubType: AccountSubType.DEBIT_CARD,
    accountNature: AccountNature.ASSET,
    iconKey: 'bank-card',
  },
  {
    name: 'PayPal',
    systemKey: 'paypal',
    accountType: AccountType.VIRTUAL,
    accountSubType: AccountSubType.ONLINE_PAYMENT,
    accountNature: AccountNature.ASSET,
    iconKey: 'paypal',
  },
  {
    name: '微信',
    systemKey: 'wechat',
    accountType: AccountType.VIRTUAL,
    accountSubType: AccountSubType.ONLINE_PAYMENT,
    accountNature: AccountNature.ASSET,
    iconKey: 'wechat',
  },
  {
    name: '支付宝',
    systemKey: 'alipay',
    accountType: AccountType.VIRTUAL,
    accountSubType: AccountSubType.ONLINE_PAYMENT,
    accountNature: AccountNature.ASSET,
    iconKey: 'alipay',
  },
] as const
