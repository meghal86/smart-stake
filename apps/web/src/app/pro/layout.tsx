import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AlphaWhale Pro',
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">AlphaWhale Pro</h1>
              <p className="text-slate-400">Advanced whale intelligence</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/"
                className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                ← Back to Home
              </Link>
              <Link 
                href="/legacy"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Legacy App
              </Link>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
