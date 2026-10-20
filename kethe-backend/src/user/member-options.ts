export const MEMBER_ICONS = [
  'user',
  'woman',
  'man',
  'child',
  'parents',
  'family',
  'heart',
  'baby',
  'friend',
] as const
export const DEFAULT_MEMBERS = [
  { name: '本人', iconKey: 'user', systemKey: 'self' },
  { name: '老婆', iconKey: 'woman', systemKey: 'wife' },
  { name: '老公', iconKey: 'man', systemKey: 'husband' },
  { name: '子女', iconKey: 'child', systemKey: 'children' },
  { name: '父母', iconKey: 'parents', systemKey: 'parents' },
  { name: '家庭共用', iconKey: 'family', systemKey: 'family' },
]
