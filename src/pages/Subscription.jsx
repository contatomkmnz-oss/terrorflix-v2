import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Loader2, ArrowLeft, Calendar, AlertTriangle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CheckoutModal from '@/components/subscription/CheckoutModal';

const PLANS = [
  {
    id: "mensal",
    name: "Mensal",
    price: "R$ 19,90",
    priceValue: 1990,
    period: "/mês",
    icon: Zap,
    color: "border-blue-500",
    badge: null,
    features: [
      "Acesso a todo o catálogo",
      "Qualidade HD",
      "Múltiplos perfis",
      "Sem anúncios",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 29,90",
    priceValue: 2990,
    period: "/mês",
    icon: Star,
    color: "border-[#E50914]",
    badge: "Mais Popular",
    features: [
      "Tudo do plano Mensal",
      "Qualidade Full HD",
      "Downloads offline",
      "Acesso antecipado a lançamentos",
      "Suporte prioritário",
    ],
  },
  {
    id: "anual",
    name: "Anual",
    price: "R$ 199,00",
    priceValue: 19900,
    period: "/ano",
    icon: Crown,
    color: "border-[#FFC107]",
    badge: "Melhor Custo-Benefício",
    features: [
      "Tudo do plano Premium",
      "2 meses grátis",
      "Qualidade 4K",
      "Acesso vitalício ao histórico",
    ],
  },
];

const STATUS_CONFIG = {
  active:    { label: "Ativa",    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30" },
  pending:   { label: "Pendente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  expired:   { label: "Expirada", color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/30" },
  cancelled: { label: "Cancelada",color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30" },
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
    <div className="min-h-screen bg-[#0F0F0F] px-4 pt-24 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black">
              <span className="text-[#E50914]">Desenhos</span>
              <span className="text-[#FFC107]">Flix</span>
              <span className="text-white"> Premium</span>
            </h1>
            <p className="text-gray-400 mt-1">Escolha o plano ideal para você</p>
          </div>
        </div>

        {loadingStatus ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
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
                            <span className="text-yellow-400 font-semibold">({daysLeft}d restantes)</span>
                          )}
                        </span>
                      )}
                    </div>
                    {sub.status === 'pending' && (
                      <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
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
                    className={`relative rounded-2xl border-2 p-6 bg-[#1A1A1A] transition-all ${plan.color} ${isCurrentPlan ? 'opacity-60' : 'hover:scale-105 cursor-pointer'}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E50914] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-6 h-6 text-[#E50914]" />
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full font-bold ${isCurrentPlan ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#E50914] hover:bg-[#FF3D3D] text-white'}`}
                    >
                      {isCurrentPlan ? "Plano Atual" : isActive ? "Mudar para este plano" : "Assinar Agora"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-600 mt-8">
              Pagamento 100% seguro via AbacatePay • PIX ou Cartão de Crédito • Cancele quando quiser
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