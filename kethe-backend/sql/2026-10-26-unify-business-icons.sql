-- 统一业务图标。发布后端前执行；支持重复执行，不覆盖已迁移资源的后续维护。
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS icon_resources (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 resourceKey VARCHAR(128) NOT NULL, name VARCHAR(64) NOT NULL, svgContent MEDIUMTEXT NOT NULL,
 color VARCHAR(7) DEFAULT NULL, isEnabled TINYINT UNSIGNED NOT NULL DEFAULT 1,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE KEY uk_icon_resource_key (resourceKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS icon_scene_options (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 scene VARCHAR(32) NOT NULL, iconKey VARCHAR(64) NOT NULL, resourceId BIGINT UNSIGNED NOT NULL,
 label VARCHAR(64) NOT NULL, groupKey VARCHAR(32) NOT NULL DEFAULT 'other',
 sortOrder INT UNSIGNED NOT NULL DEFAULT 0, isEnabled TINYINT UNSIGNED NOT NULL DEFAULT 1,
 isDefault TINYINT UNSIGNED NOT NULL DEFAULT 0, isSystemDefault TINYINT UNSIGNED NOT NULL DEFAULT 1,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE KEY uk_icon_scene_key (scene, iconKey), KEY idx_icon_scene_enabled_sort (scene,isEnabled,sortOrder),
 CONSTRAINT fk_icon_option_resource FOREIGN KEY (resourceId) REFERENCES icon_resources(id),
 CONSTRAINT chk_icon_scene CHECK (scene IN ('category','account','member','expense-project','merchant'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS account_icon_rules (
 optionId BIGINT UNSIGNED NOT NULL, accountType INT NOT NULL,
 accountSubType INT NOT NULL DEFAULT 0 COMMENT '0 表示一级类型规则', isDefault TINYINT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY (optionId,accountType,accountSubType),
 CONSTRAINT fk_account_icon_option FOREIGN KEY (optionId) REFERENCES icon_scene_options(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
DROP PROCEDURE IF EXISTS migrate_business_icons;
DELIMITER $$
CREATE PROCEDURE migrate_business_icons()
BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'category_icons' AND table_type = 'BASE TABLE') THEN
  INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color,isEnabled)
  SELECT CONCAT('category:',iconKey),iconName,CASE iconKey
   WHEN 'bonus' THEN '<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8 3h8l-1.5 5h-5L8 3Z"/>
  <circle cx="12" cy="13" r="5"/>
  <path d="m12 10.2.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2-1.45-1.4 2-.3.9-1.8Z"/>
</svg>'
   WHEN 'communication' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6.5" y="2.5" width="11" height="19" rx="3"
        stroke="currentColor" stroke-width="2"/>
  <path d="M10 5H14"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <circle cx="12" cy="18" r="1" fill="currentColor"/>
</svg>'
   WHEN 'education' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 9L12 4.5L21 9L12 13.5L3 9Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M6.5 11V15.5C6.5 17.2 9 18.5 12 18.5C15 18.5 17.5 17.2 17.5 15.5V11"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <path d="M21 9V14"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
</svg>'
   WHEN 'entertainment' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 8H16C18.76 8 21 10.24 21 13C21 15.76 18.76 18 16 18L13.5 15.5H10.5L8 18C5.24 18 3 15.76 3 13C3 10.24 5.24 8 8 8Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M7.5 11V15M5.5 13H9.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <circle cx="16.5" cy="11.5" r="1" fill="currentColor"/>
  <circle cx="18.5" cy="13.5" r="1" fill="currentColor"/>
</svg>'
   WHEN 'finance' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8.5"
          stroke="currentColor" stroke-width="2"/>
  <path d="M14.5 8.5H11C9.9 8.5 9 9.4 9 10.5C9 11.6 9.9 12.5 11 12.5H13C14.1 12.5 15 13.4 15 14.5C15 15.6 14.1 16.5 13 16.5H9.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <path d="M12 6.5V8.5M12 16.5V18.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
</svg>'
   WHEN 'food' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.5 3.5V10.2C6.5 11.75 7.75 13 9.3 13H9.5V20.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 3.5V8.5M9 3.5V8.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <path d="M16.5 3.5C18.43 3.5 20 5.07 20 7V11.5C20 13.43 18.43 15 16.5 15H15V20.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>'
   WHEN 'gift-money' THEN '<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="9" width="18" height="11" rx="2"/>
  <path d="M12 9v11"/>
  <path d="M3 13h18"/>
  <path d="M12 9H8.5A2.5 2.5 0 1 1 11 6.5L12 9Z"/>
  <path d="M12 9h3.5A2.5 2.5 0 1 0 13 6.5L12 9Z"/>
</svg>'
   WHEN 'gift' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="9" width="16" height="11" rx="2"
        stroke="currentColor" stroke-width="2"/>
  <path d="M3.5 9H20.5V6.5H3.5V9Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M12 6.5V20"
        stroke="currentColor" stroke-width="2"/>
  <path d="M12 6.5C10.5 6.5 8 6 8 4.5C8 3.5 8.8 3 9.6 3C11.1 3 12 5 12 6.5Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M12 6.5C13.5 6.5 16 6 16 4.5C16 3.5 15.2 3 14.4 3C12.9 3 12 5 12 6.5Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
</svg>'
   WHEN 'housing' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3.5 11L12 4L20.5 11"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5.5 10V20H18.5V10"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M9.5 20V14H14.5V20"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
</svg>'
   WHEN 'investment' THEN '<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 18V6"/>
  <path d="M4 18h16"/>
  <path d="m7 14 4-4 3 3 5-6"/>
  <path d="M15.5 7H19v3.5"/>
</svg>'
   WHEN 'medical' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 20C12 20 4.5 15.55 4.5 9.5C4.5 6.74 6.24 5 8.5 5C10.04 5 11.23 5.86 12 7C12.77 5.86 13.96 5 15.5 5C17.76 5 19.5 6.74 19.5 9.5C19.5 15.55 12 20 12 20Z"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 11.5H15M12 8.5V14.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
</svg>'
   WHEN 'other' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
</svg>'
   WHEN 'part-time' THEN '<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="7" width="18" height="12" rx="3"/>
  <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/>
  <path d="M3 11.5c2.8 1.4 5.8 2.1 9 2.1s6.2-.7 9-2.1"/>
  <path d="M10.5 13.5h3"/>
</svg>'
   WHEN 'salary' THEN '<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/>
  <path d="M4.5 8H18"/>
  <path d="M14.5 11.5h5.5v4h-5.5a2 2 0 0 1 0-4Z"/>
  <circle cx="16" cy="13.5" r=".75" fill="currentColor" stroke="none"/>
</svg>'
   WHEN 'shopping' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 8.5H19L18 20H6L5 8.5Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M8.5 9V7C8.5 5.07 10.07 3.5 12 3.5C13.93 3.5 15.5 5.07 15.5 7V9"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
</svg>'
   WHEN 'subscription' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3.5" y="5" width="17" height="14" rx="3"
        stroke="currentColor" stroke-width="2"/>
  <path d="M10 9L15 12L10 15V9Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
</svg>'
   WHEN 'transport' THEN '<svg width="24" height="24" viewBox="0 0 24 24"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.5 16.5H18.5C19.33 16.5 20 15.83 20 15V10.8L18.45 6.9C18.22 6.34 17.68 6 17.08 6H6.92C6.32 6 5.78 6.34 5.55 6.9L4 10.8V15C4 15.83 4.67 16.5 5.5 16.5Z"
        stroke="currentColor" stroke-width="2"
        stroke-linejoin="round"/>
  <path d="M6 10.5H18M7 19V16.5M17 19V16.5"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round"/>
  <circle cx="7.5" cy="13.5" r="1" fill="currentColor"/>
  <circle cx="16.5" cy="13.5" r="1" fill="currentColor"/>
</svg>'
   ELSE svgContent END,color,isEnabled FROM category_icons;
  INSERT IGNORE INTO icon_scene_options (id,scene,iconKey,resourceId,label,groupKey,sortOrder,isEnabled,isDefault,isSystemDefault)
  SELECT c.id,'category',c.iconKey,r.id,c.iconName,c.groupKey,c.id,c.isEnabled,c.iconKey='other',c.isSystemDefault
  FROM category_icons c JOIN icon_resources r ON r.resourceKey=CONCAT('category:',c.iconKey);
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='categories' AND constraint_name='fk_categories_icon') THEN
   ALTER TABLE categories DROP FOREIGN KEY fk_categories_icon;
  END IF;
  ALTER TABLE categories ADD CONSTRAINT fk_categories_icon FOREIGN KEY (iconId) REFERENCES icon_scene_options(id);
  DROP TABLE category_icons;
 END IF;
END$$
DELIMITER ;
CALL migrate_business_icons();
DROP PROCEDURE migrate_business_icons;
CREATE OR REPLACE VIEW category_icon_resources AS
 SELECT o.id,o.iconKey,o.label iconName,o.groupKey,r.svgContent,r.color,o.isSystemDefault,o.isDefault,
 (o.isEnabled AND r.isEnabled) isEnabled,o.sortOrder,GREATEST(o.updatedAt,r.updatedAt) updatedAt,o.createdAt
 FROM icon_scene_options o JOIN icon_resources r ON r.id=o.resourceId WHERE o.scene='category';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:cash','现金','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"></rect><path d="M7 9.5a2 2 0 0 1-2 2"></path><path d="M17 9.5a2 2 0 0 0 2 2"></path><path d="M7 14.5a2 2 0 0 0-2-2"></path><path d="M17 14.5a2 2 0 0 1 2-2"></path><circle cx="12" cy="12" r="2.4"></circle></svg>','#5BC982');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','cash',id,'现金','wallet',1,1 FROM icon_resources WHERE resourceKey='account:cash';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:credit-card','信用卡','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-credit-card" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','credit-card',id,'信用卡','card',2,0 FROM icon_resources WHERE resourceKey='account:credit-card';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:consumer-credit','消费信贷','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand-coins" aria-hidden="true"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"></path><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"></path><path d="m2 16 6 6"></path><circle cx="16" cy="9" r="2.9"></circle><circle cx="6" cy="5" r="3"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','consumer-credit',id,'消费信贷','wallet',3,0 FROM icon_resources WHERE resourceKey='account:consumer-credit';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:bank-card','银行卡','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark" aria-hidden="true"><path d="M10 18v-7"></path><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"></path><path d="M14 18v-7"></path><path d="M18 18v-7"></path><path d="M3 22h18"></path><path d="M6 18v-7"></path></svg>','#E63343');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','bank-card',id,'银行卡','card',4,0 FROM icon_resources WHERE resourceKey='account:bank-card';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:savings','储蓄','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-piggy-bank" aria-hidden="true"><path d="M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"></path><path d="M16 10h.01"></path><path d="M2 8v1a2 2 0 0 0 2 2h1"></path></svg>','#F39A5A');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','savings',id,'储蓄','wallet',5,0 FROM icon_resources WHERE resourceKey='account:savings';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:wallet','钱包','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wallet-cards" aria-hidden="true"><path d="M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21"></path><path d="M3 7h18"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>','#3B82F6');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','wallet',id,'钱包','wallet',6,0 FROM icon_resources WHERE resourceKey='account:wallet';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:wechat','微信','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.00121 14.2783C8.90179 14.3284 8.78998 14.3572 8.67104 14.3572C8.39631 14.3572 8.1572 14.2058 8.03145 13.9822L5.98105 9.48243C5.95937 9.43474 5.94574 9.38084 5.94574 9.32818C5.94574 9.12562 6.1099 8.96147 6.31246 8.96147C6.39485 8.96147 6.47073 8.98841 6.53205 9.03425L8.89497 10.7167C9.0678 10.8297 9.27408 10.896 9.49584 10.896C9.6281 10.896 9.75447 10.8713 9.87186 10.8285L20.9852 5.88214C18.9934 3.5344 15.7127 2 12 2C5.92468 2 1 6.10391 1 11.1667C1 13.9292 2.48174 16.4154 4.80067 18.096C4.98682 18.2289 5.10855 18.4469 5.10855 18.6931C5.10855 18.7746 5.0912 18.8492 5.06983 18.9267C4.88461 19.6177 4.5882 20.724 4.57426 20.7761C4.55134 20.8625 4.51511 20.9529 4.51511 21.044C4.51511 21.2462 4.67926 21.4107 4.88213 21.4107C4.96142 21.4107 5.02647 21.381 5.09368 21.3423L7.50182 19.9522C7.68301 19.8475 7.87473 19.7828 8.08596 19.7828C8.19839 19.7828 8.30711 19.8001 8.40932 19.8314C9.53301 20.1544 10.745 20.3341 12 20.3341C18.075 20.3341 23 16.2299 23 11.1667C23 9.63327 22.5459 8.18932 21.7472 6.91912L9.08143 14.2318L9.00121 14.2783Z" fill="currentColor"></path></svg>','#07C160');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','wechat',id,'微信','wallet',7,0 FROM icon_resources WHERE resourceKey='account:wechat';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:alipay','支付宝','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1.59229 4.99313V19.007C1.59229 20.8311 3.08352 22.3106 4.92669 22.3106H19.0739C20.9157 22.3106 22.4075 20.8311 22.4075 19.007V18.8636C22.3455 18.838 16.9979 16.6282 14.2798 15.3334C12.446 17.5691 10.0808 18.9254 7.62498 18.9254C3.47231 18.9254 2.06212 15.3249 4.02841 12.9547C4.45713 12.438 5.18646 11.9444 6.31839 11.6681C8.08911 11.2371 10.9071 11.9372 13.5484 12.8007C14.0235 11.9336 14.4232 10.9787 14.7209 9.96195H6.58145V9.14532H10.7785V7.68083H5.69513V6.86366H10.7785V4.77467C10.7785 4.77467 10.7785 4.4228 11.1384 4.4228H13.1901V6.86359H18.2154V7.68097H13.1901V9.14532H17.2921C16.8996 10.7384 16.3036 12.2048 15.5554 13.4921C15.9967 13.6503 16.422 13.8055 16.8243 13.9524C17.5569 14.2198 18.2131 14.4594 18.7507 14.6377C21.5287 15.5586 22.3073 15.6712 22.4077 15.6829V4.99319C22.4077 3.16769 20.9158 1.68903 19.0741 1.68903L4.92669 1.68896C3.08352 1.68896 1.59229 3.16762 1.59229 4.99313Z" fill="currentColor"></path><path d="M6.67164 12.8911C6.85201 12.8735 7.03108 12.8639 7.20932 12.8619C8.93241 12.8421 10.5729 13.5253 12.4777 14.4461C11.0003 16.355 9.11958 17.5472 7.23729 17.5472C3.99926 17.5472 3.04172 15.0203 4.64156 13.638C5.17532 13.1702 6.15163 12.9429 6.67164 12.8911Z" fill="currentColor"></path></svg>','#1484E6');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','alipay',id,'支付宝','wallet',8,0 FROM icon_resources WHERE resourceKey='account:alipay';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:paypal','PayPal','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8.1 3.5h5.5c3.7 0 5.8 1.9 5.3 5-.5 3.5-3 5.2-6.4 5.2h-2.1l-.8 4.8H6.1L8.1 3.5Z" fill="currentColor" opacity=".42"></path><path d="M6.7 5.5h5.4c3.3 0 5.1 1.6 4.7 4.3-.4 3-2.6 4.5-5.6 4.5H9.3l-1 6.2H4.8L6.7 5.5Z" fill="currentColor"></path><path d="M9.8 8.4h2.3c1.2 0 1.8.5 1.6 1.5-.2 1.1-.9 1.6-2.1 1.6H9.3l.5-3.1Z" fill="white"></path></svg>','#0070E0');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','paypal',id,'PayPal','wallet',9,0 FROM icon_resources WHERE resourceKey='account:paypal';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:stored-value-card','储值卡','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-dollar-sign" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>','#F39A5A');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','stored-value-card',id,'储值卡','card',10,0 FROM icon_resources WHERE resourceKey='account:stored-value-card';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:voucher','现金券','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ticket" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg>','#F97316');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','voucher',id,'现金券','wallet',11,0 FROM icon_resources WHERE resourceKey='account:voucher';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('account:coins','其他资金','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coins" aria-hidden="true"><path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"></path><path d="M15 6h1v4"></path><path d="m6.134 14.768.866-.5 2 3.464"></path><circle cx="16" cy="8" r="6"></circle></svg>','#F39A5A');
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,groupKey,sortOrder,isDefault) SELECT 'account','coins',id,'其他资金','wallet',12,0 FROM icon_resources WHERE resourceKey='account:coins';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:user','本人','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round" aria-hidden="true"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','user',id,'本人',1,1 FROM icon_resources WHERE resourceKey='member:user';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:woman','女性','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-venus" aria-hidden="true"><path d="M12 15v7"></path><path d="M9 19h6"></path><circle cx="12" cy="9" r="6"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','woman',id,'女性',2,0 FROM icon_resources WHERE resourceKey='member:woman';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:man','男性','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mars" aria-hidden="true"><path d="M16 3h5v5"></path><path d="m21 3-6.75 6.75"></path><circle cx="10" cy="14" r="6"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','man',id,'男性',3,0 FROM icon_resources WHERE resourceKey='member:man';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:child','子女','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-face-slightly-smiling" aria-hidden="true"><path d="M15 10V9"></path><path d="M16.472 15a6 6 0 01-8.943 0"></path><path d="M9 10V9"></path><circle cx="12" cy="12" r="10"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','child',id,'子女',4,0 FROM icon_resources WHERE resourceKey='member:child';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:parents','父母','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-round" aria-hidden="true"><path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','parents',id,'父母',5,0 FROM icon_resources WHERE resourceKey='member:parents';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:family','家庭','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','family',id,'家庭',6,0 FROM icon_resources WHERE resourceKey='member:family';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:heart','爱心','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','heart',id,'爱心',7,0 FROM icon_resources WHERE resourceKey='member:heart';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:baby','宝宝','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-baby" aria-hidden="true"><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"></path><path d="M15 12h.01"></path><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"></path><path d="M9 12h.01"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','baby',id,'宝宝',8,0 FROM icon_resources WHERE resourceKey='member:baby';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('member:friend','朋友','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-handshake" aria-hidden="true"><path d="m11 17 2 2a1 1 0 1 0 3-3"></path><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path><path d="m21 3 1 11h-2"></path><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path><path d="M3 4h8"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'member','friend',id,'朋友',9,0 FROM icon_resources WHERE resourceKey='member:friend';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:folder','项目','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','folder',id,'项目',1,1 FROM icon_resources WHERE resourceKey='expense-project:folder';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:plane','旅行','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plane" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','plane',id,'旅行',2,0 FROM icon_resources WHERE resourceKey='expense-project:plane';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:luggage','出行','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-luggage" aria-hidden="true"><path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"></path><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"></path><path d="M10 20h4"></path><circle cx="16" cy="20" r="2"></circle><circle cx="8" cy="20" r="2"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','luggage',id,'出行',3,0 FROM icon_resources WHERE resourceKey='expense-project:luggage';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:house','居家','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','house',id,'居家',4,0 FROM icon_resources WHERE resourceKey='expense-project:house';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:hammer','装修','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hammer" aria-hidden="true"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"></path><path d="m18 15 4-4"></path><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','hammer',id,'装修',5,0 FROM icon_resources WHERE resourceKey='expense-project:hammer';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:heart','心愿','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','heart',id,'心愿',6,0 FROM icon_resources WHERE resourceKey='expense-project:heart';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:gift','礼物','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gift" aria-hidden="true"><path d="M12 7v14"></path><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"></path><rect x="3" y="7" width="18" height="4" rx="1"></rect></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','gift',id,'礼物',7,0 FROM icon_resources WHERE resourceKey='expense-project:gift';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('expense-project:shopping-bag','购物','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag" aria-hidden="true"><path d="M16 10a4 4 0 0 1-8 0"></path><path d="M3.103 6.034h17.794"></path><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'expense-project','shopping-bag',id,'购物',8,0 FROM icon_resources WHERE resourceKey='expense-project:shopping-bag';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:store','商店','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store" aria-hidden="true"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','store',id,'商店',1,1 FROM icon_resources WHERE resourceKey='merchant:store';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:shopping-cart','超市','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart" aria-hidden="true"><path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"></path><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"></path><circle cx="18" cy="20" r="2"></circle><circle cx="8" cy="20" r="2"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','shopping-cart',id,'超市',2,0 FROM icon_resources WHERE resourceKey='merchant:shopping-cart';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:shopping-bag','购物','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag" aria-hidden="true"><path d="M16 10a4 4 0 0 1-8 0"></path><path d="M3.103 6.034h17.794"></path><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','shopping-bag',id,'购物',3,0 FROM icon_resources WHERE resourceKey='merchant:shopping-bag';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:package','包裹','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','package',id,'包裹',4,0 FROM icon_resources WHERE resourceKey='merchant:package';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:globe','海淘','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','globe',id,'海淘',5,0 FROM icon_resources WHERE resourceKey='merchant:globe';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:gift','礼品','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gift" aria-hidden="true"><path d="M12 7v14"></path><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"></path><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"></path><rect x="3" y="7" width="18" height="4" rx="1"></rect></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','gift',id,'礼品',6,0 FROM icon_resources WHERE resourceKey='merchant:gift';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:tags','折扣','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags" aria-hidden="true"><path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"></path><path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"></path><circle cx="10.5" cy="6.5" r=".5" fill="currentColor"></circle></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','tags',id,'折扣',7,0 FROM icon_resources WHERE resourceKey='merchant:tags';
INSERT IGNORE INTO icon_resources (resourceKey,name,svgContent,color) VALUES ('merchant:building','商场','<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building" aria-hidden="true"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>',NULL);
INSERT IGNORE INTO icon_scene_options (scene,iconKey,resourceId,label,sortOrder,isDefault) SELECT 'merchant','building',id,'商场',8,0 FROM icon_resources WHERE resourceKey='merchant:building';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,1,0,1 FROM icon_scene_options WHERE scene='account' AND iconKey='cash';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,10,0,1 FROM icon_scene_options WHERE scene='account' AND iconKey='credit-card';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,10,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='consumer-credit';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,20,0,1 FROM icon_scene_options WHERE scene='account' AND iconKey='bank-card';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,20,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='savings';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,99,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='savings';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,1 FROM icon_scene_options WHERE scene='account' AND iconKey='wallet';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,99,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='wallet';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='wechat';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='alipay';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='paypal';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='stored-value-card';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,0,0 FROM icon_scene_options WHERE scene='account' AND iconKey='voucher';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,99,0,1 FROM icon_scene_options WHERE scene='account' AND iconKey='coins';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,10,201,1 FROM icon_scene_options WHERE scene='account' AND iconKey='credit-card';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,10,202,1 FROM icon_scene_options WHERE scene='account' AND iconKey='consumer-credit';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,20,301,1 FROM icon_scene_options WHERE scene='account' AND iconKey='bank-card';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,20,302,1 FROM icon_scene_options WHERE scene='account' AND iconKey='savings';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,401,1 FROM icon_scene_options WHERE scene='account' AND iconKey='wallet';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,402,1 FROM icon_scene_options WHERE scene='account' AND iconKey='voucher';
INSERT IGNORE INTO account_icon_rules (optionId,accountType,accountSubType,isDefault) SELECT id,30,403,1 FROM icon_scene_options WHERE scene='account' AND iconKey='stored-value-card';
