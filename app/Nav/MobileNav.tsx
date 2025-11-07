import FeatherIcon from 'feather-icons-react'
import Link from 'next/link'

import type { NavItem } from './types'

interface MobileNavProps {
  nav: Record<string, NavItem[]>
  githubUrl?: string
  onClose: () => void
}

export function MobileNav({ nav, githubUrl, onClose }: MobileNavProps) {
  const navEntries = Object.entries(nav)

  return (
    <div className="md:hidden mt-4 pt-4 border-t border-indigo-400">
      <div className="flex flex-col gap-2">
        {navEntries.map(([hero, items]) => {
          const isSpecial = hero.startsWith('$')
          const displayName = isSpecial ? '' : hero

          if (isSpecial) {
            return (
              <div key={hero} className="flex flex-col gap-1">
                {items.map(({ name, href }) => (
                  <Link key={href} href={href} className="px-3 py-2 rounded hover:bg-indigo-600 transition-colors" onClick={onClose}>
                    {name}
                  </Link>
                ))}
              </div>
            )
          }

          return (
            <div key={hero} className="flex flex-col">
              <div className="px-3 py-2 text-sm font-semibold text-indigo-200 uppercase">{displayName}</div>
              {items.map(({ name, href }) => (
                <Link key={href} href={href} className="px-6 py-2 rounded hover:bg-indigo-600 transition-colors" onClick={onClose}>
                  {name}
                </Link>
              ))}
            </div>
          )
        })}
        {githubUrl && (
          <a className="px-3 py-2 rounded hover:bg-indigo-600 transition-colors flex items-center gap-2 mt-2" href={githubUrl} target="_blank" rel="noreferrer" onClick={onClose}>
            <FeatherIcon icon="github" size={18} />
            <span>GitHub</span>
          </a>
        )}
      </div>
    </div>
  )
}
