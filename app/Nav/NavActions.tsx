import FeatherIcon from 'feather-icons-react'

interface NavActionsProps {
  githubUrl?: string
  isMobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export function NavActions({ githubUrl, isMobileMenuOpen, onToggleMobileMenu }: NavActionsProps) {
  return (
    <div className="flex items-center gap-4">
      {githubUrl && (
        <a className="hidden md:block hover:opacity-80 transition-opacity" href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
          <FeatherIcon icon="github" size={20} />
        </a>
      )}

      <button className="md:hidden p-2 hover:bg-indigo-600 rounded transition-colors" onClick={onToggleMobileMenu} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}>
        <FeatherIcon icon={isMobileMenuOpen ? 'x' : 'menu'} size={24} />
      </button>
    </div>
  )
}
