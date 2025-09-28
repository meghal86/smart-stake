export default function LiteSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-slate-400 mt-2">
          Manage your AlphaWhale preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-900 p-6 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <input 
                type="email" 
                className="w-full mt-1 rounded-lg bg-slate-800 px-3 py-2 text-white border border-slate-700"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Plan</label>
              <div className="mt-1 rounded-lg bg-slate-800 px-3 py-2 text-teal-400 font-semibold">
                Lite Plan
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-slate-300">Whale Alerts</span>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-slate-300">Daily Digest</span>
              <input type="checkbox" className="h-4 w-4" defaultChecked />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
