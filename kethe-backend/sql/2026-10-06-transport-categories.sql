-- 为已有数据库补充交通图标；新建数据库由 init.sql 初始化。
INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('private-car', '私家车', 'transport', '<svg viewBox="0 0 24 24"><path d="m4 12 2-5h12l2 5v7H4v-7Zm0 2h16M7 19v2m10-2v2M7 16h.01M17 16h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#347DF0'),
('charging', '充电', 'transport', '<svg viewBox="0 0 24 24"><path d="M5 21V3h10v18M4 21h12M8 7h4m6 3 2 2v6a2 2 0 0 1-4 0v-5M11 9l-2 4h3l-2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#35B85A'),
('parking', '停车', 'transport', '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('toll', '过路费', 'transport', '<svg viewBox="0 0 24 24"><path d="M3 7h18M6 7v14m12-14v14M8 12h8m-4-5V3M9 21l3-5 3 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#F2A30B'),
('car-rental', '租车', 'transport', '<svg viewBox="0 0 24 24"><path d="m3 13 2-5h14l2 5v6H3v-6Zm0 2h18M6 19v2m12-2v2M7 17h.01M17 17h.01M9 5h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#8657E8'),
('cruise', '游轮', 'transport', '<svg viewBox="0 0 24 24"><path d="M3 14h18l-3 6H6l-3-6Zm4 0V8h10v6M10 8V4h4v4M2 22c2-1 4-1 6 0s4 1 6 0 4-1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', '#347DF0')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);

-- 为已有用户补充二级分类，保留现有分类的名称、状态和排序。
INSERT INTO categories (userId, categoryType, parentId, name, iconId, systemKey, isSystemDefault, sortOrder, isEnabled)
SELECT parent.userId, 1, parent.id, defaults.name, NULL, defaults.systemKey, 1, defaults.sortOrder, 1
FROM categories AS parent
JOIN (
  SELECT '私家车' AS name, 'expense_transport_private_car' AS systemKey, 6 AS sortOrder
  UNION ALL SELECT '加油', 'expense_transport_fuel', 7
  UNION ALL SELECT '充电', 'expense_transport_charging', 8
  UNION ALL SELECT '停车', 'expense_transport_parking', 9
  UNION ALL SELECT '过路费', 'expense_transport_toll', 10
  UNION ALL SELECT '租车', 'expense_transport_car_rental', 11
  UNION ALL SELECT '游轮', 'expense_transport_cruise', 12
) AS defaults
LEFT JOIN categories AS existing
  ON existing.userId = parent.userId AND existing.systemKey = defaults.systemKey
WHERE parent.systemKey = 'expense_transport' AND existing.id IS NULL;
