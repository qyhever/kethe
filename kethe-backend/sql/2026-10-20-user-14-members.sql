INSERT INTO members
  (userId, name, iconKey, systemKey, isSystemDefault, sortOrder)
VALUES
  (15, '本人',     'user',    'self',     1, 1),
  (15, '老婆',     'woman',   'wife',     1, 2),
  (15, '老公',     'man',     'husband',  1, 3),
  (15, '子女',     'child',   'children', 1, 4),
  (15, '父母',     'parents', 'parents',  1, 5),
  (15, '家庭共用', 'family',  'family',   1, 6)
ON DUPLICATE KEY UPDATE id = id;