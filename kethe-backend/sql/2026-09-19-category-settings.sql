ALTER TABLE category_icons
  ADD COLUMN groupKey VARCHAR(32) NOT NULL DEFAULT 'other' COMMENT '图标分组标识' AFTER iconName;

UPDATE category_icons SET groupKey = 'food' WHERE iconKey IN ('food');
UPDATE category_icons SET groupKey = 'transport' WHERE iconKey IN ('transport');
UPDATE category_icons SET groupKey = 'shopping' WHERE iconKey IN ('shopping');
UPDATE category_icons SET groupKey = 'housing' WHERE iconKey IN ('housing');
UPDATE category_icons SET groupKey = 'entertainment' WHERE iconKey IN ('entertainment', 'subscription');
UPDATE category_icons SET groupKey = 'medical' WHERE iconKey = 'medical';
UPDATE category_icons SET groupKey = 'education' WHERE iconKey = 'education';
UPDATE category_icons SET groupKey = 'social' WHERE iconKey IN ('gift', 'gift-money', 'communication');
UPDATE category_icons SET groupKey = 'income' WHERE iconKey IN ('salary', 'bonus', 'part-time', 'investment');
UPDATE category_icons SET groupKey = 'finance' WHERE iconKey = 'finance';

ALTER TABLE categories
  MODIFY COLUMN name VARCHAR(12) NOT NULL COMMENT '分类名称',
  ADD COLUMN remark VARCHAR(50) DEFAULT NULL COMMENT '分类备注' AFTER name;

INSERT INTO category_icons (iconKey, iconName, groupKey, svgContent, color) VALUES
('breakfast', '早餐', 'food', '<svg viewBox="0 0 24 24"><path d="M4 10h16a8 8 0 0 1-16 0Zm3 9h10M6 7h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', '#FF6B35'),
('dessert', '甜点', 'food', '<svg viewBox="0 0 24 24"><path d="M5 10h14l-2 10H7L5 10Zm2-1c1-4 9-4 10 0M9 5c0-2 2-3 3-1" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('fruit', '水果', 'food', '<svg viewBox="0 0 24 24"><path d="M12 7c-7-4-10 8-4 13 2 2 3 0 4 0s2 2 4 0c6-5 3-17-4-13Zm0 0c0-3 2-5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#35B85A'),
('snack', '零食', 'food', '<svg viewBox="0 0 24 24"><path d="M8 4h8l3 5-7 11L5 9l3-5Zm0 0 4 5 4-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#FF864A'),
('pizza', '外卖', 'food', '<svg viewBox="0 0 24 24"><path d="M4 20 12 3l8 17H4Zm4-5h.01M14 11h.01M15 17h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#FF6334'),
('bus', '公交', 'transport', '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 13h14M8 7h8M8 21v-1m8 1v-1" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('train', '地铁', 'transport', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 12h12M9 22l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('taxi', '打车', 'transport', '<svg viewBox="0 0 24 24"><path d="m5 11 2-5h10l2 5v8H5v-8Zm3-5 1-2h6l1 2M5 14h14" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#25BF70'),
('flight', '机票', 'transport', '<svg viewBox="0 0 24 24"><path d="m2 16 20-8-1-3-8 2-5-4-2 1 3 5-5 2-2-2-1 1 1 6Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('fuel', '加油', 'transport', '<svg viewBox="0 0 24 24"><path d="M5 21V3h10v18M4 21h12M8 7h4m6 3 2 2v6a2 2 0 0 1-4 0v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F44336'),
('cart', '日用', 'shopping', '<svg viewBox="0 0 24 24"><path d="M3 4h2l2 12h11l2-8H6m3 12h.01M17 20h.01" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('clothes', '服饰', 'shopping', '<svg viewBox="0 0 24 24"><path d="m8 4-5 4 3 4 2-2v11h8V10l2 2 3-4-5-4c-1 3-7 3-8 0Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('phone', '数码', 'shopping', '<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 18h4" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('furniture', '家具', 'housing', '<svg viewBox="0 0 24 24"><path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M3 11v7h18v-7M6 18v3m12-3v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#9A674F'),
('movie', '电影', 'entertainment', '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 3 3 3m2-3 3 3m-2 5v5l4-2.5-4-2.5Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#8657E8'),
('music', '音乐', 'entertainment', '<svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3h3m10 1a3 3 0 1 1-3-3h3" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F45272'),
('travel', '旅行', 'entertainment', '<svg viewBox="0 0 24 24"><path d="M3 18c5-2 8-6 10-15 5 4 7 9 8 15H3Zm6-1c1-3 4-5 8-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#35B85A'),
('pet', '宠物', 'entertainment', '<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="20" cy="13" r="2"/><path d="M7 18c0-5 10-5 10 0 0 4-3 3-5 2-2 1-5 2-5-2Z" fill="currentColor"/></svg>', '#9A674F'),
('fitness', '健身', 'medical', '<svg viewBox="0 0 24 24"><path d="M3 9v6m3-8v10m12-10v10m3-8v6M6 12h12" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0'),
('medicine', '药品', 'medical', '<svg viewBox="0 0 24 24"><path d="M7 4a4 4 0 0 1 6 0l7 7a4 4 0 0 1-6 6L7 10a4 4 0 0 1 0-6Zm2 9 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F44336'),
('books', '书籍', 'education', '<svg viewBox="0 0 24 24"><path d="M4 4h7v16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm16 0h-7v16h7a2 2 0 0 1 2 2V6a2 2 0 0 0-2-2Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#F2A30B'),
('handshake', '礼尚往来', 'social', '<svg viewBox="0 0 24 24"><path d="m3 8 5-3 4 2 4-2 5 3-3 8-5 4-3-2-2 1-5-5V8Zm5-3 4 7 3-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>', '#347DF0')
ON DUPLICATE KEY UPDATE iconName = VALUES(iconName), groupKey = VALUES(groupKey), svgContent = VALUES(svgContent), color = VALUES(color);
