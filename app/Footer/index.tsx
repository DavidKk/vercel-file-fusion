export default function Footer() {
  return (
    <footer className="mt-auto py-6 bg-gradient-to-r from-gray-50 to-gray-100 shadow-inner">
      <div className="mx-auto flex justify-end items-center px-6">
        <div className="text-xs font-medium text-gray-600 tracking-wide">
          Build Time: <span className="font-mono text-gray-700">{new Date(process.env.BUILD_TIME).toLocaleString()}</span>
        </div>
      </div>
    </footer>
  )
}
