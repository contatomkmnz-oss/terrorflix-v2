import React, { useMemo, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, Eye, TrendingUp } from 'lucide-react';

export default function AdminMetrics() {
  const queryClient = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-metrics-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 1000),
    refetchInterval: 30000,
  });

  // Atualização em tempo real para assinaturas
  useEffect(() => {
    const unsub = base44.entities.Subscription.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-metrics-subscriptions'] });
    });
    return unsub;
  }, [queryClient]);

  const { data: series = [] } = useQuery({
    queryKey: ['admin-metrics-series'],
    queryFn: () => base44.entities.Series.list('-created_date', 500)
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['admin-metrics-episodes'],
    queryFn: () => base44.entities.Episode.list('-created_date', 500)
  });

  const { data: watchHistory = [] } = useQuery({
    queryKey: ['admin-metrics-history'],
    queryFn: () => base44.entities.WatchHistory.list('-created_date', 1000)
  });

  const metrics = useMemo(() => {
    const activeUsers = new Set(subscriptions.filter(s => s.status === 'active').map(s => s.user_email)).size;
    const totalViews = watchHistory.length;
    const avgCompletion = watchHistory.length > 0
      ? (watchHistory.filter(w => w.completed).length / watchHistory.length * 100).toFixed(1)
      : 0;

    // Gráfico de assinaturas por plano
    const planDistribution = {};
    subscriptions.forEach(s => {
      planDistribution[s.plan] = (planDistribution[s.plan] || 0) + 1;
    });
    const planChart = Object.entries(planDistribution).map(([plan, count]) => ({
      name: plan,
      value: count,
      color: { semanal: '#3B82F6', mensal: '#10B981', premium: '#F59E0B', anual: '#8B5CF6' }[plan]
    }));

    // Gráfico de assinaturas ao longo do tempo
    const dateMap = {};
    subscriptions.forEach(s => {
      const date = new Date(s.created_date).toLocaleDateString('pt-BR');
      dateMap[date] = (dateMap[date] || 0) + 1;
    });
    const timelineChart = Object.entries(dateMap)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, count]) => ({ date, assinaturas: count }));

    // Série mais assistida
    const seriesViews = {};
    watchHistory.forEach(w => {
      seriesViews[w.series_id] = (seriesViews[w.series_id] || 0) + 1;
    });
    const topSeries = Object.entries(seriesViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, views]) => {
        const s = series.find(s => s.id === id);
        return { name: s?.title || 'Desconhecida', views };
      });

    // Status das assinaturas
    const statusCount = {};
    subscriptions.forEach(s => {
      statusCount[s.status] = (statusCount[s.status] || 0) + 1;
    });

    return {
      activeUsers,
      totalSubscriptions: subscriptions.length,
      totalViews,
      avgCompletion,
      planChart,
      timelineChart,
      topSeries,
      statusCount
    };
  }, [subscriptions, series, watchHistory]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard de Métricas</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Usuários Ativos</p>
                <p className="text-3xl font-bold text-white">{metrics.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Assinaturas</p>
                <p className="text-3xl font-bold text-white">{metrics.totalSubscriptions}</p>
              </div>
              <CreditCard className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Visualizações</p>
                <p className="text-3xl font-bold text-white">{metrics.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Taxa Conclusão</p>
                <p className="text-3xl font-bold text-white">{metrics.avgCompletion}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Timeline de Assinaturas */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Assinaturas ao Longo do Tempo</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.timelineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="assinaturas" stroke="#E50914" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuição de Planos */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Distribuição de Planos</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.planChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.planChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Séries Mais Assistidas */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Top 5 Séries</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics.topSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="views" fill="#E50914" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status das Assinaturas */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Status das Assinaturas</h2>
            <div className="space-y-3">
              {Object.entries(metrics.statusCount).map(([status, count]) => {
                const colors = {
                  active: 'bg-green-500/20 border-green-500/50',
                  pending: 'bg-yellow-500/20 border-yellow-500/50',
                  expired: 'bg-gray-500/20 border-gray-500/50',
                  cancelled: 'bg-red-500/20 border-red-500/50'
                };
                return (
                  <div key={status} className={`p-3 rounded border ${colors[status]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white capitalize font-semibold">{status}</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}