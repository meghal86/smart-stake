'use client';
import Link from 'next/link';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">🐋 AlphaWhale</h1>
          <p className="text-xl text-slate-400">Whale Intelligence Platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold mb-4">AlphaWhale Lite</h2>
              <p className="text-slate-400 mb-6">
                Enhanced whale intelligence with new features
              </p>
              <Link 
                href="/lite"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Lite App
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-4">AlphaWhale Pro</h2>
              <p className="text-slate-400 mb-6">
                Advanced features and analytics
              </p>
              <Link 
                href="/pro"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Pro App
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h2 className="text-2xl font-bold mb-4">Legacy App</h2>
              <p className="text-slate-400 mb-6">
                Full-featured whale intelligence platform
              </p>
              <a 
                href="http://localhost:8080/legacy"
                target="_blank"
                rel="noopener"
                className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Legacy App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}