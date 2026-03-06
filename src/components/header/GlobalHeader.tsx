import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Settings, CreditCard, LogOut, TestTube2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/integrations/supabase/client'
import { useWallet } from '@/contexts/WalletContext'
import { useDemoMode } from '@/lib/ux/DemoModeManager'
import { WalletChip } from './WalletChip'
import { ThemeToggle } from '@/components/ThemeToggle'

export interface GlobalHeaderProps {
  className?: string
}

export function GlobalHeader({ className }: GlobalHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  
  const { connectedWallets, activeWallet, isLoading: walletsLoading } = useWallet()
  const { isDemo, setDemoMode } = useDemoMode()

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 14,
        right: window.innerWidth - rect.right
      })
    }
  }, [showMenu])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowMenu(false)
    navigate('/')
  }

  const handleWalletChipClick = () => {
    // Simple navigation to wallet settings instead of complex modal
    navigate('/settings/wallets')
  }

  const renderMenu = (content: React.ReactNode) => {
    if (!showMenu) return null
    return createPortal(
      <>
        <div className="fixed inset-0 z-[1200]" onClick={() => setShowMenu(false)} />
        <div 
          className="fixed z-[1210] w-56 rounded-[22px] border border-black/10 bg-[rgba(245,243,238,0.98)] py-1 shadow-2xl dark:border-white/8 dark:bg-[rgba(10,10,10,0.98)]"
          style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
        >
          {content}
        </div>
      </>,
      document.body
    )
  }

  return (
    <header className={cn('sticky top-0 z-[120] border-b border-black/8 bg-[#f3f1ed]/92 backdrop-blur-xl dark:border-white/8 dark:bg-[#050505]/92', className)}>
      <div className="mx-auto h-16 max-w-7xl px-4 sm:px-6">
        <div className="flex h-full items-center justify-between">
          <button
            onClick={() => navigate(user ? '/cockpit' : '/')}
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-80"
          >
            <img src="/header.png" alt="WhalePulse" className="h-8 w-8 rounded-full" />
            <div className="flex flex-col">
              <span
                className="text-lg font-semibold tracking-tight text-[#111111] dark:text-[#f5f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                WhalePulse
              </span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#7a766e] dark:text-[#8f8a82]">
                Overview
              </span>
            </div>
          </button>

          <div className="relative z-[130] flex items-center gap-3">
            {/* Wallet Chip - Show if:
                1. User is authenticated AND
                2. Either:
                   - Has connected wallets OR
                   - Is in demo mode OR
                   - Has activeWallet set (even if still loading)
            */}
            {user && (connectedWallets.length > 0 || isDemo || activeWallet) && (
              <WalletChip 
                onClick={handleWalletChipClick}
                className="mr-2"
              />
            )}

            {/* Profile Menu */}
            {user ? (
              <>
                {/* Theme Toggle */}
                <ThemeToggle />
                
                <button
                  ref={buttonRef}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] transition hover:bg-[#ece9e2] dark:border-white/10 dark:bg-[#111111] dark:text-[#f5f2ea] dark:hover:bg-[#171717]"
                >
                  <User className="w-4 h-4" />
                </button>
                {renderMenu(
                  <>
                    <button onClick={() => { navigate('/profile'); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#44423d] hover:bg-[#f3f1ed] dark:text-[#d7d1c7] dark:hover:bg-[#171717]">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => { navigate('/settings'); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#44423d] hover:bg-[#f3f1ed] dark:text-[#d7d1c7] dark:hover:bg-[#171717]">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={() => { navigate('/subscription'); setShowMenu(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#44423d] hover:bg-[#f3f1ed] dark:text-[#d7d1c7] dark:hover:bg-[#171717]">
                      <CreditCard className="w-4 h-4" /> Subscription
                    </button>
                    <div className="my-1 border-t border-black/8 dark:border-white/8" />
                    <button onClick={() => { setDemoMode(!isDemo); setShowMenu(false) }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#44423d] hover:bg-[#f3f1ed] dark:text-[#d7d1c7] dark:hover:bg-[#171717]">
                      <span className="flex items-center gap-2">
                        <TestTube2 className="w-4 h-4" /> Demo Mode
                      </span>
                      <div className={cn("h-5 w-9 rounded-full transition-colors", isDemo ? "bg-[#5f83c2]" : "bg-[#d6d1c8] dark:bg-[#2f2f2f]")}>
                        <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5", isDemo ? "ml-4" : "ml-0.5")} />
                      </div>
                    </button>
                    <div className="my-1 border-t border-black/8 dark:border-white/8" />
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#8a6469] hover:bg-[#fbf1f4] dark:text-[#d7aeb6] dark:hover:bg-[#1a1013]">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/signin')} 
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#44423d] transition-colors hover:bg-[#ece9e2] dark:text-[#d7d1c7] dark:hover:bg-[#171717]"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="rounded-full border border-black/10 bg-[#111111] px-4 py-2 text-sm font-medium text-[#f5f2ea] transition-colors hover:bg-[#1a1a1a] dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-[#ece9e2]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
