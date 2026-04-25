import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Tv, Users, Key, Lightbulb, Smile, BarChart3, CreditCard, LayoutDashboard } from 'lucide-react';
import AdminSubscriptions from './AdminSubscriptions';

const TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'subscriptions', label: 'Assinaturas', icon: CreditCard },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') navigate('/Home');
      setUser(u);
    });
  }, []);

  const { data: series = [] } = useQuery({ queryKey: ['adminSeries'], queryFn: () => base44.entities.Series.list() });
  const { data: episodes = [] } = useQuery({ queryKey: ['adminEpisodes'], queryFn: () => base44.entities.Episode.list() });
  const { data: users = [] } = useQuery({ queryKey: ['adminUsers'], queryFn: () => base44.entities.User.list() });
  const { data: codes = [] } = useQuery({ queryKey: ['adminCodes'], queryFn: () => base44.entities.AccessCode.list() });
  const { data: proposals = [] } = useQuery({ queryKey: ['adminProposals'], queryFn: () => base44.entities.ContentProposal.filter({ status: 'pendente' }) });

  const usedCodes = codes.filter(c => c.used_by);

  const stats = [
    { label: 'Séries', value: series.length, icon: Tv, color: 'from-red-500 to-red-700', link: '/AdminSeries' },
    { label: 'Episódios', value: episodes.length, icon: Film, color: 'from-blue-500 to-blue-700', link: '/AdminSeries' },
    { label: 'Usuários', value: users.length, icon: Users, color: 'from-green-500 to-green-700', link: '/AdminUsers' },
    { label: 'Códigos', value: `${usedCodes.length}/${codes.length}`, icon: Key, color: 'from-yellow-500 to-yellow-700', link: '/AdminCodes' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 md:pt-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie todo o conteúdo do DesenhosFlix</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#1A1A1A] p-1 rounded-xl w-fit border border-white/5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#E50914] text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'subscriptions' && <AdminSubscriptions embedded />}

        {activeTab === 'overview' && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map(s => (
            <Link
              key={s.label}
              to={s.link}
              className="bg-[#1A1A1A] rounded-xl p-5 hover:bg-[#222] transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold mb-3">Acesso Rápido</h2>
            {[
              { label: 'Dashboard de Métricas', to: '/AdminMetrics', icon: BarChart3 },
              { label: 'Banner Principal (Destaques)', to: '/AdminBanner', icon: LayoutDashboard },
              { label: 'Gerenciar Séries & Episódios', to: '/AdminSeries', icon: Tv },
              { label: 'Gerenciar Usuários', to: '/AdminUsers', icon: Users },
              { label: 'Códigos de Acesso', to: '/AdminCodes', icon: Key },
              { label: 'Propostas de Conteúdo', to: '/AdminProposals', icon: Lightbulb },
              { label: 'Gerenciar Avatares', to: '/AdminAvatars', icon: Smile },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg hover:bg-[#222] transition-colors"
              >
                <item.icon className="w-5 h-5 text-[#E50914]" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {proposals.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3">Propostas Pendentes</h2>
              <div className="space-y-2">
                {proposals.slice(0, 5).map(p => (
                  <div key={p.id} className="p-4 bg-[#1A1A1A] rounded-lg">
                    <p className="font-medium text-sm">{p.suggested_title}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                    <p className="text-[10px] text-gray-500 mt-1">por {p.user_email || 'anônimo'}</p>
                  </div>
                ))}
                <Link to="/AdminProposals" className="block text-center text-sm text-[#E50914] hover:text-[#FF3D3D] py-2">
                  Ver todas →
                </Link>
              </div>
            </div>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}