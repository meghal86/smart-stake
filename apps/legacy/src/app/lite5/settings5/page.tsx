export default function Lite5Settings5Page() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-slate-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-900 p-6 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="your@email.com"
                defaultValue="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-teal-600 text-white text-sm font-semibold rounded-full">Lite</span>
                <button className="text-teal-400 hover:text-teal-300 text-sm underline">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-teal-600 bg-slate-800 border-slate-700 rounded focus:ring-teal-500" defaultChecked />
              <span className="text-slate-300">Whale alerts</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-teal-600 bg-slate-800 border-slate-700 rounded focus:ring-teal-500" defaultChecked />
              <span className="text-slate-300">Token unlock notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-teal-600 bg-slate-800 border-slate-700 rounded focus:ring-teal-500" />
              <span className="text-slate-300">Market updates</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900 p-6 shadow">
          <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
          <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
