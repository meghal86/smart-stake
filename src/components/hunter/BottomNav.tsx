import { motion } from 'framer-motion';
import { 
  Home, 
  Activity, 
  Compass, 
  Bell, 
  User,
  MoreHorizontal
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { id: 'main', icon: Home, label: 'Main', active: false },
  { id: 'pulse', icon: Activity, label: 'Pulse', active: false },
  { id: 'explore', icon: Compass, label: 'Explore', active: true },
  { id: 'alerts', icon: Bell, label: 'Alerts', active: false },
  { id: 'profile', icon: User, label: 'Profile', active: false }
];

export function BottomNav() {
  const [activeTab, setActiveTab] = useState('explore');
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMore(false)}
        >
          <motion.div
            className="absolute bottom-20 right-4 glass rounded-2xl p-4 min-w-48"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {['Settings', 'Help', 'Feedback', 'About'].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-0 flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-violet-500 shadow-glow'
                      : 'hover:bg-white/10'
                  }`}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon 
                    className={`w-5 h-5 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`} 
                  />
                </motion.div>
                <span 
                  className={`text-xs font-medium ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="w-1 h-1 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </motion.button>
            );
          })}
          
          {/* More Button */}
          <motion.button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-0 flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`p-2 rounded-xl transition-all duration-200 ${
                showMore
                  ? 'bg-gradient-to-r from-emerald-500 to-violet-500 shadow-glow'
                  : 'hover:bg-white/10'
              }`}
              animate={showMore ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MoreHorizontal 
                className={`w-5 h-5 ${
                  showMore ? 'text-white' : 'text-slate-400'
                }`} 
              />
            </motion.div>
            <span 
              className={`text-xs font-medium ${
                showMore ? 'text-white' : 'text-slate-500'
              }`}
            >
              More
            </span>
          </motion.button>
        </div>
      </motion.nav>
    </>
  );
}