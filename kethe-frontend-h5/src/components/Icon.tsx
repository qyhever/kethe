export type IconName =
  | 'clipboard'
  | 'copy'
  | 'chevronDown'
  | 'external'
  | 'file'
  | 'filter'
  | 'link'
  | 'login'
  | 'image'
  | 'pin'
  | 'plus'
  | 'refresh'
  | 'save'
  | 'search'
  | 'trash'
  | 'user'
  | 'userPlus'
  | 'x'
  | 'edit'

const iconPaths: Record<IconName, string[]> = {
  chevronDown: ['<path d="m6 9 6 6 6-6"/>'],
  clipboard: [
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>',
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    '<path d="M8 12h8"/>',
    '<path d="M8 16h6"/>',
  ],
  copy: [
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>',
    '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  ],
  edit: ['<path d="M12 20h9"/>', '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'],
  external: ['<path d="M15 3h6v6"/>', '<path d="M10 14 21 3"/>', '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'],
  file: ['<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>', '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>', '<path d="M8 13h8"/>', '<path d="M8 17h5"/>'],
  image: ['<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>', '<circle cx="9" cy="9" r="2"/>', '<path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'],
  filter: ['<path d="M22 3H2l8 9.5V19l4 2v-8.5Z"/>'],
  link: ['<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/>', '<path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>'],
  login: ['<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>', '<path d="m10 17 5-5-5-5"/>', '<path d="M15 12H3"/>'],
  pin: ['<path d="M12 17v5"/>', '<path d="M5 17h14"/>', '<path d="m7 9 5-7 5 7"/>', '<path d="M8 9h8l-1 8H9Z"/>'],
  plus: ['<path d="M5 12h14"/>', '<path d="M12 5v14"/>'],
  refresh: ['<path d="M21 12a9 9 0 0 0-9-9 9.8 9.8 0 0 0-6.8 2.8L3 8"/>', '<path d="M3 3v5h5"/>', '<path d="M3 12a9 9 0 0 0 9 9 9.8 9.8 0 0 0 6.8-2.8L21 16"/>', '<path d="M16 16h5v5"/>'],
  save: ['<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>', '<path d="M17 21v-8H7v8"/>', '<path d="M7 3v5h8"/>'],
  search: ['<circle cx="11" cy="11" r="8"/>', '<path d="m21 21-4.3-4.3"/>'],
  trash: ['<path d="M3 6h18"/>', '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', '<path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>', '<path d="M10 11v6"/>', '<path d="M14 11v6"/>'],
  user: ['<path d="M19 21a7 7 0 0 0-14 0"/>', '<circle cx="12" cy="7" r="4"/>'],
  userPlus: ['<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>', '<circle cx="9" cy="7" r="4"/>', '<path d="M19 8v6"/>', '<path d="M22 11h-6"/>'],
  x: ['<path d="M18 6 6 18"/>', '<path d="m6 6 12 12"/>'],
}

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
      dangerouslySetInnerHTML={{ __html: iconPaths[name].join('') }}
    />
  )
}
