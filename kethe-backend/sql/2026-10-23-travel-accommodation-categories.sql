-- 补充景点门票、纪念品和住宿分类及图标；可重复执行。
SET NAMES utf8mb4;

INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('attraction-ticket', '景点门票', 'entertainment', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M15 5v2m0 4v2m0 4v2M7 10l2-2 3 4H7"/></svg>', '#8657E8'),
('souvenir', '纪念品', 'shopping', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="3"/><path d="m10 8 3 3m-1 1 4-4 6 6-7 7-6-6 3-3Z"/><path d="m16 12 .8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3.8-1.6Z"/></svg>', '#F45272'),
('accommodation', '住宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v14m18-7v7M3 17h18v-5a2 2 0 0 0-2-2h-8v7"/><path d="M3 17V9h5a3 3 0 0 1 3 3"/><path d="M3 20h18"/><circle cx="7" cy="13" r="1"/></svg>', '#25BF70'),
('hotel', '酒店', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M3 21h18M10 21v-5h4v5M9 7h1m4 0h1m-6 4h1m4 0h1"/></svg>', '#25BF70'),
('homestay', '民宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-6h6v6M16 6V3h3v5"/><rect x="10" y="9" width="4" height="3" rx=".5"/></svg>', '#25BF70'),
('accommodation-other', '其它住宿', 'housing', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5V3ZM8 6h8v6H8V6Z"/><circle cx="9" cy="9" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="9" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r=".5" fill="currentColor" stroke="none"/><path d="M15 16h1"/></svg>', '#25BF70')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);

START TRANSACTION;

-- 只为尚无该 systemKey 的用户新增住宿；包括软删除记录在内均不重复创建。
INSERT INTO categories (userId, categoryType, parentId, name, iconId, systemKey, isSystemDefault, sortOrder, isEnabled)
SELECT u.id, 1, NULL, '住宿', icon.id, 'expense_accommodation', 1,
       COALESCE(ordering.maxSortOrder, 0) + 1, 1
FROM users AS u
JOIN category_icons AS icon ON icon.iconKey = 'accommodation' AND icon.isEnabled = 1
LEFT JOIN (
  SELECT userId, MAX(sortOrder) AS maxSortOrder
  FROM categories
  WHERE categoryType = 1 AND parentId IS NULL
  GROUP BY userId
) AS ordering ON ordering.userId = u.id
LEFT JOIN categories AS existing
  ON existing.userId = u.id AND existing.systemKey = 'expense_accommodation'
WHERE u.deletedAt IS NULL AND existing.id IS NULL;

-- 原有二级分类不调整；新增分类排在各父分类的现有子分类之后。
INSERT INTO categories (userId, categoryType, parentId, name, iconId, systemKey, isSystemDefault, sortOrder, isEnabled)
SELECT parent.userId, 1, parent.id, defaults.name, icon.id, defaults.systemKey, 1,
       COALESCE(ordering.maxSortOrder, 0) + defaults.sortOffset, 1
FROM categories AS parent
JOIN (
  SELECT 'expense_entertainment' AS parentKey, '景点门票' AS name,
         'expense_entertainment_attraction_tickets' AS systemKey,
         'attraction-ticket' AS iconKey, 1 AS sortOffset
  UNION ALL SELECT 'expense_shopping', '纪念品', 'expense_shopping_souvenir', 'souvenir', 1
  UNION ALL SELECT 'expense_accommodation', '酒店', 'expense_accommodation_hotel', 'hotel', 1
  UNION ALL SELECT 'expense_accommodation', '民宿', 'expense_accommodation_homestay', 'homestay', 2
  UNION ALL SELECT 'expense_accommodation', '其它住宿', 'expense_accommodation_other', 'accommodation-other', 3
) AS defaults ON defaults.parentKey = parent.systemKey
JOIN category_icons AS icon ON icon.iconKey = defaults.iconKey AND icon.isEnabled = 1
LEFT JOIN (
  SELECT parentId, MAX(sortOrder) AS maxSortOrder
  FROM categories
  WHERE parentId IS NOT NULL
  GROUP BY parentId
) AS ordering ON ordering.parentId = parent.id
LEFT JOIN categories AS existing
  ON existing.userId = parent.userId AND existing.systemKey = defaults.systemKey
WHERE parent.categoryType = 1 AND parent.parentId IS NULL
  AND existing.id IS NULL;

COMMIT;

