import { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Home from './pages/Home';
import ProfileSelect from './pages/ProfileSelect';
import SeriesDetail from './pages/SeriesDetail';
import Player from './pages/Player';
import Search from './pages/Search';
import MyListPage from './pages/MyListPage';
import Browse from './pages/Browse';
import ActivateCode from './pages/ActivateCode';
import Propose from './pages/Propose';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSeries from './pages/admin/AdminSeries';
import AdminEpisodes from './pages/admin/AdminEpisodes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCodes from './pages/admin/AdminCodes';
import AdminProposals from './pages/admin/AdminProposals';
import AdminAvatars from './pages/admin/AdminAvatars';
import AdminEpisodeCreator from './pages/admin/AdminEpisodeCreator';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminMetrics from './pages/admin/AdminMetrics';
import AdminBanner from './pages/admin/AdminBanner';
import Subscription from './pages/Subscription';
import AppLayout from './components/layout/AppLayout';

/** Redireciona para rota canónica (PascalCase) mantendo ?query e #hash. */
function RedirectTo({ pathname }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname, search, hash }} replace />;
}

const BASENAME = (() => {
  const b = import.meta.env.BASE_URL || '/'
  if (b === '/' || b === './') return '/'
  return b.endsWith('/') ? b.slice(0, -1) : b
})()

function AuthRequiredScreen({ onLogin }) {
  useEffect(() => {
    onLogin();
    // Uma tentativa automática; o botão repete se o redirect falhar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#0F0F0F] px-6 text-center text-white">
      <h1 className="text-2xl font-black">
        <span className="text-[#E50914]">Desenhos</span>
        <span className="text-[#FFC107]">Flix</span>
      </h1>
      <p className="max-w-sm text-sm text-gray-400">A abrir a página de início de sessão…</p>
      <div className="h-8 w-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      <button
        type="button"
        onClick={onLogin}
        className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Entrar com a minha conta
      </button>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0F0F0F]">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">
            <span className="text-[#E50914]">Desenhos</span>
            <span className="text-[#FFC107]">Flix</span>
          </h1>
          <div className="w-8 h-8 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    if (authError.type === 'auth_required') {
      return <AuthRequiredScreen onLogin={navigateToLogin} />;
    }
  }

  return (
    <Routes>
      {/* ——— Compatibilidade: minúsculas, typos, slugs (preserva ? e #) ——— */}
      <Route path="/home" element={<RedirectTo pathname="/Home" />} />
      <Route path="/browse" element={<RedirectTo pathname="/Browse" />} />
      <Route path="/search" element={<RedirectTo pathname="/Search" />} />
      <Route path="/mylist" element={<RedirectTo pathname="/MyList" />} />
      <Route path="/subscription" element={<RedirectTo pathname="/Subscription" />} />
      <Route path="/profileselect" element={<RedirectTo pathname="/ProfileSelect" />} />
      <Route path="/activatecode" element={<RedirectTo pathname="/ActivateCode" />} />
      <Route path="/propose" element={<RedirectTo pathname="/Propose" />} />
      <Route path="/player" element={<RedirectTo pathname="/Player" />} />
      <Route path="/seriesdetail" element={<RedirectTo pathname="/SeriesDetail" />} />
      <Route path="/admin" element={<RedirectTo pathname="/Admin" />} />
      <Route path="/adminseries" element={<RedirectTo pathname="/AdminSeries" />} />
      <Route path="/adminepisodes" element={<RedirectTo pathname="/AdminEpisodes" />} />
      <Route path="/adminusers" element={<RedirectTo pathname="/AdminUsers" />} />
      <Route path="/admincodes" element={<RedirectTo pathname="/AdminCodes" />} />
      <Route path="/adminproposals" element={<RedirectTo pathname="/AdminProposals" />} />
      <Route path="/adminavatars" element={<RedirectTo pathname="/AdminAvatars" />} />
      <Route path="/adminepisodecreator" element={<RedirectTo pathname="/AdminEpisodeCreator" />} />
      <Route path="/adminsubscriptions" element={<RedirectTo pathname="/AdminSubscriptions" />} />
      <Route path="/adminmetrics" element={<RedirectTo pathname="/AdminMetrics" />} />
      <Route path="/adminbanner" element={<RedirectTo pathname="/AdminBanner" />} />
      <Route path="/Home/" element={<RedirectTo pathname="/Home" />} />
      <Route path="/Browse/" element={<RedirectTo pathname="/Browse" />} />
      <Route path="/Search/" element={<RedirectTo pathname="/Search" />} />

      <Route path="/" element={<Navigate to="/ProfileSelect" replace />} />
      <Route path="/ProfileSelect" element={<ProfileSelect />} />
      <Route path="/ActivateCode" element={<ActivateCode />} />
      <Route path="/Player" element={<Player />} />

      <Route element={<AppLayout />}>
        <Route path="/Home" element={<Home />} />
        <Route path="/SeriesDetail" element={<SeriesDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/Search" element={<Search />} />
        <Route path="/MyList" element={<MyListPage />} />
        <Route path="/Browse" element={<Browse />} />
        <Route path="/Propose" element={<Propose />} />
        <Route path="/Subscription" element={<Subscription />} />
        <Route path="/Admin" element={<AdminDashboard />} />
        <Route path="/AdminSeries" element={<AdminSeries />} />
        <Route path="/AdminEpisodes" element={<AdminEpisodes />} />
        <Route path="/AdminUsers" element={<AdminUsers />} />
        <Route path="/AdminCodes" element={<AdminCodes />} />
        <Route path="/AdminProposals" element={<AdminProposals />} />
        <Route path="/AdminAvatars" element={<AdminAvatars />} />
        <Route path="/AdminEpisodeCreator" element={<AdminEpisodeCreator />} />
        <Route path="/AdminSubscriptions" element={<AdminSubscriptions />} />
        <Route path="/AdminMetrics" element={<AdminMetrics />} />
        <Route path="/AdminBanner" element={<AdminBanner />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router basename={BASENAME}>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App