import { UserRound, Venus, Mars, Baby, UsersRound, House, Heart, Smile, Handshake } from 'lucide-react'
const icons = { user: UserRound, woman: Venus, man: Mars, child: Smile, parents: UsersRound, family: House, heart: Heart, baby: Baby, friend: Handshake }
export function MemberIcon({ iconKey, size = 23 }: { iconKey?: string | null; size?: number }) {
  const Icon = icons[iconKey as keyof typeof icons] ?? UserRound
  return <Icon size={size} aria-hidden="true" />
}
