import {
  Folder,
  Plane,
  Luggage,
  House,
  Hammer,
  Heart,
  Gift,
  ShoppingBag,
} from 'lucide-react'
const icons = {
  folder: Folder,
  plane: Plane,
  luggage: Luggage,
  house: House,
  hammer: Hammer,
  heart: Heart,
  gift: Gift,
  'shopping-bag': ShoppingBag,
}
export function ExpenseProjectIcon({
  iconKey,
  size = 24,
}: {
  iconKey?: string | null
  size?: number
}) {
  const Icon = icons[iconKey as keyof typeof icons] ?? Folder
  return <Icon size={size} aria-hidden="true" />
}
