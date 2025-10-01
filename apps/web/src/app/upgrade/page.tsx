import Link from 'next/link';
// Simple inline track function
const track = (event: string, props?: any) => console.debug('[track]', event, props);

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-4xl font-bold mb-4">Upgrade Required</h1>
        <p className="text-xl text-slate-400 mb-8">
          This feature requires a Pro or Enterprise subscription
        </p>
        <div className="space-y-4">
          <Link 
            href="/pro"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
          >
            Upgrade to Pro
          </Link>
          <div>
            <Link href="/" className="text-slate-400 hover:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}