import { 
  Home, 
  Activity, 
  Compass, 
  Shield, 
  Briefcase,
  Waves,
  User
} from 'lucide-react';

export function FooterNav() {
  return (
    <footer className="fixed bottom-0 w-full h-[72px] z-40">
      <div className="backdrop-blur-md bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(16,18,30,0.8)] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)]" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
        <nav className="flex justify-around items-center h-full px-4 text-gray-500 dark:text-gray-300 max-w-screen-xl mx-auto">
        <a href="/hub" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <Home className="w-6 h-6" />
          </div>
        </a>
        
        <a href="/hub2/pulse" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <Activity className="w-6 h-6" />
          </div>
        </a>
        
        <a href="/guardian" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <Shield className="w-6 h-6" />
          </div>
        </a>
        
        <a href="/hunter" className="flex items-center justify-center text-white flex-1 py-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] shadow-lg" style={{ boxShadow: '0 0 20px rgba(0, 245, 160, 0.4)' }}>
            <Compass className="w-6 h-6 stroke-white" />
          </div>
        </a>
        
        <a href="/whale-alert" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <Waves className="w-6 h-6" />
          </div>
        </a>
        
        <a href="/portfolio" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <Briefcase className="w-6 h-6" />
          </div>
        </a>
        
        <a href="/settings" className="flex items-center justify-center hover:text-white transition-all duration-200 flex-1 py-3">
          <div className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200">
            <User className="w-6 h-6" />
          </div>
        </a>
        </nav>
      </div>
    </footer>
  );
}