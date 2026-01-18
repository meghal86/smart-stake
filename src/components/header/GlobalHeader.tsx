import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useNavigate } from 'react-router-dom'
import { User, Wallet, Settings, CreditCard, LogOut, Check, TestTube2, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/integrations/supabase/client'
import { AddWalletButton } from '@/components/wallet/AddWalletButton'
import { useWallet } from '@/contexts/WalletContext'
import { useDemoMode } from '@/lib/ux/DemoModeManager'

export interface GlobalHeaderProps {
  className?: string
}

export function GlobalHeader({ className }: GlobalHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { address: activeWallet } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [showMenu, setShowMenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  
  const { connectedWallets, activeWallet: contextActiveWallet, setActiveWallet: setContextActiveWallet } = useWallet()
  const { isDemo, setDemoMode } = useDemoMode()

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [showMenu])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowMenu(false)
    navigate('/')
  }

  const handleWalletSwitch = (address: string) => {
    setContextActiveWallet(address)
    setShowMenu(false)
  }

  const handleWalletConnect = () => {
    setShowMenu(false)
    if (openConnectModal) {
      openConnectModal()
    }
  }

  const renderMenu = (content: React.ReactNode) => {
    if (!showMenu) return null
    return createPortal(
      <>
        <div className="fixed inset-0 z-[9998]" onClick={() => setShowMenu(false)} />
        <div 
          className="fixed w-56 rounded-lg bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-[9999]"
          style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
        >
          {content}
        </div>
      </>,
      document.body
    )
  }

  return (
    <header className={cn('h-16 sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50', className)}>
      <div className="mx-auto h-full max-w-7xl px-6 relative z-50">
        <div className="flex h-full items-center justify-between">
          <button onClick={() => navigate(user ? '/cockpit' : '/')} className="text-xl font-bold text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
            AlphaWhale
          </button>

          <div>
            {user && activeWallet ? (
              <>
                <button ref={buttonRef} onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4 text-white dark:text-slate-900" />
                </button>
                {renderMenu(
                  <>
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Wallet className="w-3 h-3" />
                        {contextActiveWallet?.slice(0, 6)}...{contextActiveWallet?.slice(-4)}
                      </div>
                    </div>
                    {connectedWallets.length > 1 && connectedWallets.map((wallet) => (
                      <button key={wallet.address} onClick={() => handleWalletSwitch(wallet.address)} className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${contextActiveWallet === wallet.address ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        <Wallet className="w-4 h-4" />
                        {wallet.label || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
                        {contextActiveWallet === wallet.address && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                    <div className="px-3 py-2">
                      <AddWalletButton />
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button onClick={() => { navigate('/profile'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => { navigate('/settings'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { navigate('/subscription'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Subscription
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button onClick={() => { setDemoMode(!isDemo); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TestTube2 className="w-4 h-4" /> Demo Mode
                      </span>
                      <div className={cn("w-9 h-5 rounded-full transition-colors", isDemo ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5", isDemo ? "ml-4" : "ml-0.5")} />
                      </div>
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button onClick={handleSignOut} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </>
                )}
              </>
            ) : user ? (
              <>
                <button ref={buttonRef} onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4 text-white dark:text-slate-900" />
                </button>
                {renderMenu(
                  <>
                    <div className="px-3 py-2">
                      <AddWalletButton />
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button onClick={() => { navigate('/profile'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => { navigate('/settings'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { navigate('/subscription'); setShowMenu(false) }} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Subscription
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button onClick={handleSignOut} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </>
                )}
              </>
            ) : (
              <button onClick={handleWalletConnect} className="px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
