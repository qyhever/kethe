-- 新增收入分类图标，并回填已有用户的系统默认收入分类。
START TRANSACTION;

INSERT INTO category_icons (
  iconKey,
  iconName,
  svgContent,
  color,
  isSystemDefault,
  isEnabled
) VALUES
('salary', '工资', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4.5 8H18"/><path d="M14.5 11.5h5.5v4h-5.5a2 2 0 0 1 0-4Z"/><circle cx="16" cy="13.5" r=".75" fill="currentColor" stroke="none"/></svg>', '#347DF0', 1, 1),
('bonus', '奖金', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l-1.5 5h-5L8 3Z"/><circle cx="12" cy="13" r="5"/><path d="m12 10.2.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8Z"/></svg>', '#F2A30B', 1, 1),
('part-time', '兼职', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 11.5c2.8 1.4 5.8 2.1 9 2.1s6.2-.7 9-2.1"/><path d="M10.5 13.5h3"/></svg>', '#6755E8', 1, 1),
('investment', '理财', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18V6"/><path d="M4 18h16"/><path d="m7 14 4-4 3 3 5-6"/><path d="M15.5 7H19v3.5"/></svg>', '#42CDB2', 1, 1),
('gift-money', '礼金', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M12 9v11"/><path d="M3 13h18"/><path d="M12 9H8.5A2.5 2.5 0 1 1 11 6.5L12 9Z"/><path d="M12 9h3.5A2.5 2.5 0 1 0 13 6.5L12 9Z"/></svg>', '#F34F72', 1, 1)
ON DUPLICATE KEY UPDATE
  iconName = VALUES(iconName),
  svgContent = VALUES(svgContent),
  color = VALUES(color),
  isSystemDefault = VALUES(isSystemDefault),
  isEnabled = VALUES(isEnabled);

UPDATE categories AS c
INNER JOIN category_icons AS i
  ON i.iconKey = CASE c.systemKey
    WHEN 'income_salary' THEN 'salary'
    WHEN 'income_bonus' THEN 'bonus'
    WHEN 'income_part_time' THEN 'part-time'
    WHEN 'income_investment' THEN 'investment'
    WHEN 'income_gift' THEN 'gift-money'
    WHEN 'income_other' THEN 'other'
  END
SET c.iconId = i.id
WHERE c.categoryType = 2
  AND c.isSystemDefault = 1
  AND c.systemKey IN (
    'income_salary',
    'income_bonus',
    'income_part_time',
    'income_investment',
    'income_gift',
    'income_other'
  );

COMMIT;
