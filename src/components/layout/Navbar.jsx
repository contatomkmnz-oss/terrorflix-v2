import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationCenter from '@/components/admin/NotificationCenter';

export default function Navbar({ isStackRoute = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const links = [
    { label: 'Início', to: '/Home' },
    { label: 'Séries', to: '/Browse' },
    { label: 'Minha Lista', to: '/MyList' },
    { label: 'Assinar', to: '/Subscription' },
  ];

  const activeProfile = JSON.parse(localStorage.getItem('desenhos_active_profile') || 'null');

  // Navbar de stack (SeriesDetail, Player) — só mostra botão voltar no mobile
  if (isStackRoute) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F]/95 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center h-14 px-2">
          <button
            onClick={() => navigate(-1)}
            className="md:hidden flex items-center gap-2 p-2 text-white active:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* Desktop: mantém logo e links */}
          <Link to="/Home" className="hidden md:flex items-center ml-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b61a29474f4e54b5af9b86/acb41898f_desenhosflix.png"
              alt="DesenhosFlix"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-8">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Navbar padrão (tabs)
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0F0F0F]/95 backdrop-blur-md shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link to="/Home" className="flex items-center shrink-0">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b61a29474f4e54b5af9b86/acb41898f_desenhosflix.png"
                alt="DesenhosFlix"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {links.slice(0, -1).map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-medium transition-colors hover:text-white ${location.pathname === l.to ? 'text-white' : 'text-gray-400'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <Link to="/Search" className="p-2 hover:text-[#E50914] transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link
              to="/Subscription"
              className={`hidden md:block text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${location.pathname === '/Subscription' ? 'bg-[#E50914] border-[#E50914] text-white' : 'border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white'}`}
            >
              Assinar
            </Link>
            {user?.role === 'admin' && (
              <>
                <NotificationCenter />
                <Link to="/Admin" className="hidden md:block text-xs text-gray-400 hover:text-[#FFC107] transition-colors font-medium">
                  Admin
                </Link>
              </>
            )}
            <Link to="/ProfileSelect" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-md overflow-hidden bg-[#E50914] flex items-center justify-center ring-2 ring-transparent group-hover:ring-white/30 transition-all">
                {activeProfile?.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {activeProfile?.name?.[0] || user?.full_name?.[0] || '?'}
                  </span>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}