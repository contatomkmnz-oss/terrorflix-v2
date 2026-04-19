import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationCenter from '@/components/admin/NotificationCenter';
import { brand } from '@/data/siteContent';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { readActiveProfile } from '@/lib/activeProfile';
import ProfileAvatarImage from '@/components/profile/ProfileAvatarImage';

export default function Navbar({ isStackRoute = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const browseType = searchParams.get('type');
  const navLinkActive = (to) => {
    if (to === '/Home') return location.pathname === '/Home';
    if (to === '/Browse?type=series') {
      return location.pathname === '/Browse' && browseType === 'series';
    }
    if (to === '/Browse?type=movie') {
      return location.pathname === '/Browse' && browseType === 'movie';
    }
    if (to === '/MyList') return location.pathname === '/MyList';
    if (to === '/Subscription') return location.pathname === '/Subscription';
    return false;
  };

  const links = [
    { label: 'Início', to: '/Home' },
    { label: 'Séries', to: '/Browse?type=series' },
    { label: 'Filmes', to: '/Browse?type=movie' },
    { label: 'Minha Lista', to: '/MyList' },
    { label: 'Assinar', to: '/Subscription' },
  ];

  const activeProfile = readActiveProfile();

  // Navbar de stack (SeriesDetail, Player) — só mostra botão voltar no mobile
  if (isStackRoute) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/95 backdrop-blur-md border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center h-14 px-2">
          <button
            onClick={() => navigate(-1)}
            className="md:hidden flex items-center gap-2 p-2 text-white active:opacity-60 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {/* Desktop: mantém logo e links */}
          <Link to="/Home" className="hidden md:flex items-center ml-4" aria-label="Início">
            <img src={publicAssetUrl(brand.logoUrl)} alt={brand.name} className="h-10 w-auto object-contain drop-shadow-[0_0_14px_rgba(232,121,249,0.35)]" />
          </Link>
          <div className="hidden md:flex items-center gap-6 ml-8">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-neon-cyan ${navLinkActive(l.to) ? 'text-white' : 'text-gray-400'}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Navbar padrão (tabs)
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${scrolled ? 'bg-[#050508]/95 backdrop-blur-md shadow-2xl border-white/5' : 'bg-gradient-to-b from-[#050508]/90 via-black/50 to-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-8">
            <Link to="/Home" className="flex items-center shrink-0">
              <img src={publicAssetUrl(brand.logoUrl)} alt={brand.name} className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_16px_rgba(232,121,249,0.35)]" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {links.slice(0, -1).map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-medium transition-colors hover:text-neon-cyan ${navLinkActive(l.to) ? 'text-white' : 'text-gray-400'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <Link to="/Search" className="p-2 text-gray-400 hover:text-neon-cyan transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            <Link
              to="/Subscription"
              className={`hidden md:block text-sm font-semibold px-4 py-1.5 rounded-full border transition-all ${
                location.pathname === '/Subscription'
                  ? 'border-transparent text-white bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan shadow-[0_0_20px_-6px_rgba(232,121,249,0.5)]'
                  : 'border-neon-fuchsia/50 text-neon-fuchsia hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-neon-fuchsia hover:via-neon-magenta hover:to-neon-cyan'
              }`}
            >
              Assinar
            </Link>
            {user?.role === 'admin' && (
              <>
                <NotificationCenter />
                <Link to="/Admin" className="hidden md:block text-xs text-gray-400 hover:text-neon-lime transition-colors font-medium">
                  Admin
                </Link>
              </>
            )}
            <Link to="/ProfileSelect" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-br from-neon-fuchsia to-neon-cyan flex items-center justify-center ring-2 ring-transparent group-hover:ring-neon-cyan/50 transition-all shadow-[0_0_16px_-4px_rgba(232,121,249,0.45)]">
                {activeProfile?.avatar_url ? (
                  <ProfileAvatarImage
                    src={activeProfile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
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