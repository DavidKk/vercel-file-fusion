import FeatherIcon from 'feather-icons-react'
import Link from 'next/link'

import type { NavItem } from './types'

interface NavDropdownProps {
  hero: string
  items: NavItem[]
}

export function NavDropdown({ hero, items }: NavDropdownProps) {
  return (
    <div className="relative group self-stretch">
      <button className="px-3 py-4 flex items-center gap-1 group/button relative" aria-haspopup="true">
        <span className="capitalize">{hero}</span>
        <FeatherIcon icon="chevron-down" size={16} className="transition-transform group-hover:rotate-180" />
        <span className="absolute inset-x-3 bottom-0 h-[2px] bg-white transition-all duration-300 transform scale-x-0 group-hover/button:scale-x-100"></span>
      </button>

      <div className="absolute top-full left-0 bg-indigo-600 rounded-sm shadow-lg min-w-[140px] z-50 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
        {items.map(({ name, href }) => (
          <Link key={href} href={href} className="block px-3 py-1.5 hover:bg-indigo-700 transition-colors text-sm">
            {name}
          </Link>
        ))}
      </div>
    </div>
  )
}
