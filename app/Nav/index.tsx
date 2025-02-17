import Link from 'next/link'
import FeatherIcon from 'feather-icons-react'

export function Nav() {
  return (
    <nav className="w-full p-4 bg-indigo-500 text-white">
      <div className="container-md flex items-center">
        <h1 className="text-xl font-bold">
          <Link href="/">File Fusion</Link>
        </h1>

        <div className="ml-8 flex gap-4">
          <Link href="/zip">Zip</Link>
          <Link href="/unzip">Unzip</Link>
          <Link href="/invoice">Invoice Optimizer</Link>
          <Link href="/audio">Audio Embedder</Link>
        </div>

        <a className="ml-auto" href="https://github.com/DavidKk/vercel-file-fusion" target="_blank" rel="noreferrer">
          <FeatherIcon icon="github" />
        </a>
      </div>
    </nav>
  )
}
