-- 分类图标增加主题色。主色随图标资源维护，浅色背景由客户端计算。
ALTER TABLE category_icons
  ADD COLUMN color VARCHAR(7) NOT NULL DEFAULT '#64748B'
  COMMENT '图标主题色，格式为#RRGGBB'
  AFTER svgContent;

UPDATE category_icons
SET color = CASE iconKey
  WHEN 'food' THEN '#FF7A1A'
  WHEN 'transport' THEN '#347DF0'
  WHEN 'shopping' THEN '#8657E8'
  WHEN 'housing' THEN '#25BF70'
  WHEN 'entertainment' THEN '#F45272'
  WHEN 'medical' THEN '#F05468'
  WHEN 'education' THEN '#F2A30B'
  WHEN 'gift' THEN '#F34F72'
  WHEN 'communication' THEN '#3B7EF2'
  WHEN 'subscription' THEN '#8D50EA'
  WHEN 'finance' THEN '#42CDB2'
  ELSE '#64748B'
END;
