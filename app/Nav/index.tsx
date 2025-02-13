import Link from 'next/link'

export function Nav() {
  return (
    <nav className="w-full p-4 bg-blue-500 text-white flex items-center">
      <h1 className="text-xl font-bold">File Fusion</h1>

      <div className="ml-10 flex gap-4">
        <Link href="/zip">Zip</Link>
        <Link href="/unzip">Unzip</Link>
      </div>
    </nav>
  )
}
