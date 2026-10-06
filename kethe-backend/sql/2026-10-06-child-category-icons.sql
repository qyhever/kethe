-- 默认子分类专属图标；保留用户已选择的其他图标。
INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('present', '礼物', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10h14v11H5V10Zm-2-4h18v4H3V6Zm9 0v15M12 6c-8 0-7-6-3-4l3 4Zm0 0c8 0 7-6 3-4l-3 4Z"/></svg>', '#F45272'),
('lunch', '午餐', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 0 16 0H4Zm3 8h10M8 8V5m4 3V3m4 5V5"/></svg>', '#FF7A1A'),
('dinner', '晚餐', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h18M5 14a7 7 0 0 1 14 0M12 7V5m-2 0h4M4 18h16M7 21h10"/></svg>', '#FF7A1A'),
('drinks', '酒水饮料', 'food', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10l-1 17H8L7 4Zm0 5h10m-5 0 3-7h3"/></svg>', '#FF7A1A'),
('railway', '火车', 'transport', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v13H5V4Zm0 8h14M9 4v8m6-8v8M8 17l-3 5m11-5 3 5M7 20h10M8 15h.01M16 15h.01"/></svg>', '#347DF0'),
('beauty', '美妆', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11h6v10H9V11Zm1 0V5l4-2v8M8 21h8"/></svg>', '#F45272'),
('appliances', '家电', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3Zm0 5h14M8 6h.01M16 6h.01"/></svg>', '#F45272'),
('shopping-other', '其他购物', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2M9 14h.01M12 14h.01M15 14h.01"/></svg>', '#F45272'),
('rent', '房租', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/></svg>', '#9A674F'),
('mortgage', '房贷', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-6 9 6M5 8v13h14V8m-7 4v7m2-6h-3a1 1 0 0 0 0 3h2a1 1 0 0 1 0 3h-3"/></svg>', '#9A674F'),
('utilities', '水电', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c-2 3-5 6-5 9a5 5 0 0 0 10 0c0-3-3-6-5-9Zm10 0-4 8h4l-2 10 6-12h-4l2-6"/></svg>', '#9A674F'),
('gas', '燃气', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 4-7 0 3 1 4 2 4 2-2 2-5 1-9Zm0 12c-2 2-3 3-3 4a3 3 0 0 0 6 0c0-1-1-2-3-4Z"/></svg>', '#9A674F'),
('property', '物业', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4h10v17M14 9h6v12M2 21h20M7 8h4m-4 4h4m-4 4h4m6-3h.01M17 17h.01"/></svg>', '#9A674F'),
('game', '游戏', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10a4 4 0 0 1 4 4l1 7a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-7a4 4 0 0 1 4-4Zm-2 5h6m-3-3v6m8-3h.01M18 14h.01"/></svg>', '#8657E8'),
('party', '聚会', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 21 4-12 7 7-11 5ZM8 9l7 7M13 3v3m5-1-2 3m5 2h-3M7 4l2 2m10 11 2 2"/></svg>', '#8657E8'),
('outpatient', '门诊', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v15H4V6Zm4 0V3h8v3m-4 5v6m-3-3h6"/></svg>', '#F44336'),
('hospital', '住院', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V3h14v18M2 21h20M10 21v-5h4v5m-2-14v6m-3-3h6"/></svg>', '#F44336'),
('healthcare', '保健', 'medical', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13ZM4 12h4l2-4 3 8 2-4h5"/></svg>', '#F44336'),
('tuition', '学费', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7c4 3 8 3 12 0v-7m4-2v9"/></svg>', '#F2A30B'),
('training', '培训', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v12H3V3Zm9 12v6m-4 0 4-3 4 3M7 8h10m-10 3h6"/></svg>', '#F2A30B'),
('exams', '考试', 'education', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H5v17h14V4h-3M8 2h8v4H8V2Zm0 9 2 2 4-4m-6 8h8"/></svg>', '#F2A30B'),
('red-packet', '红包', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3Zm0 4 7 5 7-5m-7 5v6m-3-3h6"/></svg>', '#F45272'),
('treat', '请客', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v18m11 0V3c-4 3-4 9 0 10"/></svg>', '#F45272'),
('internet', '网费', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a15 15 0 0 1 18 0M6 11a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0m-3 4h.01"/></svg>', '#347DF0'),
('delivery', '快递', 'social', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7 5l9 4"/></svg>', '#347DF0'),
('media', '影音', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v14H3V4Zm7 4 5 3-5 3V8Zm-3 14h10m-5-4v4"/></svg>', '#8657E8'),
('membership', '会员', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v14H3V6Zm4 4 3 2 2-3 2 3 3-2-1 6H8l-1-6Z"/></svg>', '#8657E8'),
('software', '软件', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18v16H3V4Zm0 4h18m-12 4-3 2 3 2m6-4 3 2-3 2"/></svg>', '#8657E8'),
('cloud', '云服务', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a5 5 0 0 1-1-10 6 6 0 0 1 12-1 5 5 0 0 1 0 11H7Zm5-7v10m-3-7 3-3 3 3"/></svg>', '#8657E8'),
('fee', '手续费', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm3 5h8m-8 4h8m-8 4h4"/></svg>', '#35B85A'),
('interest', '利息', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17 5 3 6-8 5 5M16 12h4v4M4 4v16h16"/></svg>', '#35B85A'),
('insurance', '保险', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6"/></svg>', '#35B85A'),
('tax', '税费', 'finance', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21h16M6 21V10m4 11V10m4 11V10m4 11V10M3 8l9-5 9 5H3Z"/></svg>', '#35B85A'),
('charity', '公益', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12s-5-3-5-6a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3-5 6-5 6ZM2 16h4l4-2h5a2 2 0 0 1 0 4h-5m5 0 5-3 2 2-7 5H8l-6-3"/></svg>', '#64748B'),
('repair', '维修', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3a6 6 0 0 0-7 7L3 18a2 2 0 0 0 3 3l8-8a6 6 0 0 0 7-7l-4 4-3-3 4-4h-4Z"/></svg>', '#64748B'),
('loss', '丢失', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v14H4V7Zm3 0V3h10v4m-8 5 6 5m0-5-6 5"/></svg>', '#64748B'),
('miscellaneous', '其他支出', 'other', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm13 0v6m-3-3h6"/></svg>', '#64748B')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);

UPDATE categories AS child
JOIN categories AS parent ON parent.id = child.parentId
JOIN (
  SELECT 'expense_food_breakfast' AS systemKey, 'breakfast' AS iconKey
  UNION ALL SELECT 'expense_food_lunch', 'lunch'
  UNION ALL SELECT 'expense_food_dinner', 'dinner'
  UNION ALL SELECT 'expense_food_fruit', 'fruit'
  UNION ALL SELECT 'expense_food_snacks', 'snack'
  UNION ALL SELECT 'expense_food_drinks', 'drinks'
  UNION ALL SELECT 'expense_transport_bus', 'bus'
  UNION ALL SELECT 'expense_transport_subway', 'train'
  UNION ALL SELECT 'expense_transport_taxi', 'taxi'
  UNION ALL SELECT 'expense_transport_train', 'railway'
  UNION ALL SELECT 'expense_transport_flight', 'flight'
  UNION ALL SELECT 'expense_transport_private_car', 'private-car'
  UNION ALL SELECT 'expense_transport_fuel', 'fuel'
  UNION ALL SELECT 'expense_transport_charging', 'charging'
  UNION ALL SELECT 'expense_transport_parking', 'parking'
  UNION ALL SELECT 'expense_transport_toll', 'toll'
  UNION ALL SELECT 'expense_transport_car_rental', 'car-rental'
  UNION ALL SELECT 'expense_transport_cruise', 'cruise'
  UNION ALL SELECT 'expense_shopping_daily', 'cart'
  UNION ALL SELECT 'expense_shopping_clothing', 'clothes'
  UNION ALL SELECT 'expense_shopping_digital', 'phone'
  UNION ALL SELECT 'expense_shopping_beauty', 'beauty'
  UNION ALL SELECT 'expense_shopping_appliances', 'appliances'
  UNION ALL SELECT 'expense_shopping_other', 'shopping-other'
  UNION ALL SELECT 'expense_housing_rent', 'rent'
  UNION ALL SELECT 'expense_housing_mortgage', 'mortgage'
  UNION ALL SELECT 'expense_housing_utilities', 'utilities'
  UNION ALL SELECT 'expense_housing_gas', 'gas'
  UNION ALL SELECT 'expense_housing_property', 'property'
  UNION ALL SELECT 'expense_entertainment_movie', 'movie'
  UNION ALL SELECT 'expense_entertainment_games', 'game'
  UNION ALL SELECT 'expense_entertainment_travel', 'travel'
  UNION ALL SELECT 'expense_entertainment_party', 'party'
  UNION ALL SELECT 'expense_entertainment_sports', 'fitness'
  UNION ALL SELECT 'expense_medical_medicine', 'medicine'
  UNION ALL SELECT 'expense_medical_outpatient', 'outpatient'
  UNION ALL SELECT 'expense_medical_hospital', 'hospital'
  UNION ALL SELECT 'expense_medical_healthcare', 'healthcare'
  UNION ALL SELECT 'expense_education_tuition', 'tuition'
  UNION ALL SELECT 'expense_education_books', 'books'
  UNION ALL SELECT 'expense_education_training', 'training'
  UNION ALL SELECT 'expense_education_exams', 'exams'
  UNION ALL SELECT 'expense_gift_cash', 'gift-money'
  UNION ALL SELECT 'expense_gift_present', 'present'
  UNION ALL SELECT 'expense_gift_red_packet', 'red-packet'
  UNION ALL SELECT 'expense_gift_treat', 'treat'
  UNION ALL SELECT 'expense_communication_phone', 'phone'
  UNION ALL SELECT 'expense_communication_internet', 'internet'
  UNION ALL SELECT 'expense_communication_delivery', 'delivery'
  UNION ALL SELECT 'expense_subscription_media', 'media'
  UNION ALL SELECT 'expense_subscription_membership', 'membership'
  UNION ALL SELECT 'expense_subscription_software', 'software'
  UNION ALL SELECT 'expense_subscription_cloud', 'cloud'
  UNION ALL SELECT 'expense_finance_fee', 'fee'
  UNION ALL SELECT 'expense_finance_interest', 'interest'
  UNION ALL SELECT 'expense_finance_insurance', 'insurance'
  UNION ALL SELECT 'expense_finance_tax', 'tax'
  UNION ALL SELECT 'expense_other_pet', 'pet'
  UNION ALL SELECT 'expense_other_charity', 'charity'
  UNION ALL SELECT 'expense_other_repair', 'repair'
  UNION ALL SELECT 'expense_other_loss', 'loss'
  UNION ALL SELECT 'expense_other_miscellaneous', 'miscellaneous'
) AS defaults ON defaults.systemKey = child.systemKey
JOIN category_icons AS icon ON icon.iconKey = defaults.iconKey AND icon.isEnabled = 1
SET child.iconId = icon.id
WHERE child.isSystemDefault = 1 AND (child.iconId IS NULL OR child.iconId = parent.iconId);
