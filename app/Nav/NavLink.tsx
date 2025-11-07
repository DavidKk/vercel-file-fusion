import Link from 'next/link'

import type { NavItem } from './types'

interface NavLinkProps {
  items: NavItem[]
}

export function NavLink({ items }: NavLinkProps) {
  return (
    <div className="flex gap-2 items-center">
      {items.map(({ name, href }) => (
        <Link key={href} className="whitespace-nowrap relative group/link px-3 -my-4 py-4 h-full flex items-center" href={href}>
          {name}
          <span className="absolute inset-x-3 bottom-0 h-[2px] bg-white transition-all duration-300 transform scale-x-0 group-hover/link:scale-x-100"></span>
        </Link>
      ))}
    </div>
  )
}
