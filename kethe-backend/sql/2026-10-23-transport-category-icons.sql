-- 修复已执行交通分类升级脚本后仍缺少图标的默认分类，保留用户自选图标。
SET NAMES utf8mb4;

UPDATE categories AS child
JOIN categories AS parent ON parent.id = child.parentId AND parent.userId = child.userId
JOIN (
  SELECT 'expense_transport_private_car' AS systemKey, 'private-car' AS iconKey
  UNION ALL SELECT 'expense_transport_fuel', 'fuel'
  UNION ALL SELECT 'expense_transport_charging', 'charging'
  UNION ALL SELECT 'expense_transport_parking', 'parking'
  UNION ALL SELECT 'expense_transport_toll', 'toll'
  UNION ALL SELECT 'expense_transport_car_rental', 'car-rental'
  UNION ALL SELECT 'expense_transport_cruise', 'cruise'
) AS defaults ON defaults.systemKey = child.systemKey
JOIN category_icons AS icon ON icon.iconKey = defaults.iconKey AND icon.isEnabled = 1
SET child.iconId = icon.id
WHERE parent.systemKey = 'expense_transport'
  AND child.isSystemDefault = 1
  AND (child.iconId IS NULL OR child.iconId = parent.iconId);
