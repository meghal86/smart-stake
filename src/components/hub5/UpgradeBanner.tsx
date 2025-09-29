'use client'

export default function UpgradeBanner() {
  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/lite5/upgrade', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message || 'Upgrade successful!')
        // Refresh the page to show updated features
        window.location.reload()
      } else {
        alert('Upgrade failed. Please try again.')
      }
    } catch (error) {
      alert('Upgrade failed. Please try again.')
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 p-6 shadow text-center">
      <h2 className="text-xl font-semibold text-white mb-2">🚀 Unlock Full Alpha</h2>
      <p className="text-white/90 mb-4">
        Upgrade to Pro for unlimited whale alerts, full calendar access, and advanced analytics
      </p>
      <button 
        onClick={handleUpgrade}
        className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow hover:bg-slate-100 transition-colors"
      >
        Upgrade to Pro
      </button>
    </div>
  )
}
