import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Loader2, ArrowLeft, Calendar, AlertTriangle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CheckoutModal from '@/components/subscription/CheckoutModal';
import { subscriptionPlans as PLANS_CONFIG, subscriptionPage } from '@/data/siteContent';

const ICON_MAP = { Zap, Star, Crown };
const PLANS = PLANS_CONFIG.map(({ iconKey, ...rest }) => ({
  ...rest,
  icon: ICON_MAP[iconKey] || Zap,
}));

const STATUS_CONFIG = {
  active: {
    label: 'Ativa',
    color: 'text-neon-lime',
    bg: 'bg-neon-lime/10 border-neon-lime/35 shadow-[0_0_20px_-8px_rgba(74,222,128,0.4)]',
  },
  pending: {
    label: 'Pendente',
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10 border-neon-orange/35',
  },
  expired: { label: 'Expirada', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => { loadSubscription(); }, []);

  const loadSubscription = async () => {
    setLoadingStatus(true);
    const res = await base44.functions.invoke('getMySubscription', {});
    setCurrentSubscription(res.data);
    setLoadingStatus(false);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setCheckoutOpen(false);
    loadSubscription();
  };

  const handleCancel = async () => {
    if (!cancelConfirm) { setCancelConfirm(true); return; }
    setCancelLoading(true);
    await base44.functions.invoke('cancelSubscription', {
      subscription_id: currentSubscription.subscription.id,
    });
    setCancelLoading(false);
    setCancelConfirm(false);
    loadSubscription();
  };

  const sub = currentSubscription?.subscription;
  const isActive = currentSubscription?.isActive;
  const statusCfg = STATUS_CONFIG[sub?.status] || STATUS_CONFIG.pending;
  const daysLeft = sub?.expires_at
    ? Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="members-area px-4 pt-24 pb-8">
      <div className="members-area-bg" aria-hidden />
      <div className="members-area-inner max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-neon-cyan transition-colors rounded-lg p-1 hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-neon-pink via-neon-fuchsia to-neon-cyan bg-clip-text text-transparent">
                {subscriptionPage.titleHtml[0]}
              </span>
              <span className="text-neon-cyan">{subscriptionPage.titleHtml[1]}</span>
              <span className="text-white">{subscriptionPage.titleHtml[2]}</span>
            </h1>
            <p className="text-gray-400 mt-1">{subscriptionPage.subtitle}</p>
          </div>
        </div>

        {loadingStatus ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
          </div>
        ) : (
          <>
            {/* Área do Assinante — exibida se houver assinatura */}
            {sub && (
              <div className={`mb-8 p-5 rounded-2xl border ${statusCfg.bg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-bold text-lg ${statusCfg.color}`}>
                        Assinatura {statusCfg.label}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        Plano <strong className="text-white capitalize">{PLANS.find(p => p.id === sub.plan)?.name || sub.plan}</strong>
                      </span>
                      {sub.expires_at && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Válido até {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                          {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                            <span className="text-neon-orange font-semibold">({daysLeft}d restantes)</span>
                          )}
                        </span>
                      )}
                    </div>
                    {sub.status === 'pending' && (
                      <p className="text-xs text-neon-orange mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Aguardando confirmação do pagamento. Após pagar, a assinatura será ativada automaticamente.
                      </p>
                    )}
                  </div>

                  {/* Botão cancelar — só para assinaturas ativas */}
                  {isActive && (
                    <div className="flex items-center gap-2">
                      {cancelConfirm ? (
                        <>
                          <span className="text-xs text-red-400">Tem certeza?</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCancelConfirm(false)}
                            className="border-white/10 text-gray-300 h-8 text-xs"
                          >
                            Não
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleCancel}
                            disabled={cancelLoading}
                            className="bg-red-600 hover:bg-red-700 h-8 text-xs"
                          >
                            {cancelLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim, cancelar"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs gap-1.5"
                        >
                          <Ban className="w-3 h-3" />
                          Cancelar Assinatura
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Planos */}
            <h2 className="text-lg font-bold text-white mb-4">
              {isActive ? "Alterar Plano" : "Escolha um Plano"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = sub?.plan === plan.id && isActive;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 p-6 bg-member-elevated/85 backdrop-blur-sm transition-all ${plan.color} ${isCurrentPlan ? 'opacity-60' : 'hover:scale-[1.02] cursor-pointer'}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neon-fuchsia to-neon-pink text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-[0_0_20px_-4px_rgba(232,121,249,0.7)]">
                        {plan.badge}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-6 h-6 text-neon-cyan drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-neon-lime shrink-0 drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full font-bold border-0 ${
                        isCurrentPlan
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white hover:opacity-95 shadow-[0_0_24px_-6px_rgba(232,121,249,0.55)]'
                      }`}
                    >
                      {isCurrentPlan ? "Plano Atual" : isActive ? "Mudar para este plano" : "Assinar Agora"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-500 mt-8 max-w-xl mx-auto">
              {subscriptionPage.paymentNote}
            </p>
          </>
        )}
      </div>

      {checkoutOpen && selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}