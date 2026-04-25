import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ProfileSelect" replace />} />
      <Route path="/ProfileSelect" element={<ProfileSelect />} />
      <Route path="/ActivateCode" element={<ActivateCode />} />
      <Route path="/Player" element={<Player />} />
      
      <Route element={<AppLayout />}>
        <Route path="/Home" element={<Home />} />
        <Route path="/SeriesDetail" element={<SeriesDetail />} />
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
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App