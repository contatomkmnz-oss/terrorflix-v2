import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2x2, Bookmark, CreditCard, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { to: '/Home', icon: Home, label: 'Início' },
  { to: '/Browse', icon: Grid2x2, label: 'Séries' },
  { to: '/Search', icon: Search, label: 'Buscar' },
  { to: '/MyList', icon: Bookmark, label: 'Minha Lista' },
  { to: '/Subscription', icon: CreditCard, label: 'Assinar' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(null);

  const handleTap = (to) => {
    setPressed(to);
    setTimeout(() => setPressed(null), 150);
    // Se já está na aba, scroll para topo (comportamento nativo)
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(to);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F0F0F]/97 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/Home' && location.pathname.startsWith(to));
          const isPressed = pressed === to;

          return (
            <button
              key={to}
              onClick={() => handleTap(to)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#E50914] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <motion.div
                animate={{ scale: isPressed ? 0.82 : 1 }}
                transition={{ duration: 0.1 }}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon className={`w-5 h-5 transition-colors duration-150 ${active ? 'text-[#E50914]' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-medium transition-colors duration-150 ${active ? 'text-[#E50914]' : 'text-gray-500'}`}>
                  {label}
                </span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}