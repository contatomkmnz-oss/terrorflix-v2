import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CreditCard, QrCode, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { demoMessages } from '@/data/siteContent';
import { saveDemoSubscriptionState } from '@/api/localMockClient';

export default function CheckoutModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState('method'); // method | form | processing | done | demo
  const [method, setMethod] = useState(null);
  const [form, setForm] = useState({ name: '', cpf: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [billingUrl, setBillingUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectMethod = (m) => {
    setMethod(m);
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.cpf) {
      setError('Por favor, preencha nome e CPF.');
      return;
    }
    setError(null);
    setLoading(true);
    setStep('processing');

    const res = await base44.functions.invoke('createAbacatepayBilling', {
      plan: plan.id,
      payment_method: method,
      customer: { name: form.name, cpf: form.cpf, phone: form.phone },
    });

    setLoading(false);

    if (res.data?.demo) {
      setStep('demo');
      return;
    }

    if (res.data?.billing_url) {
      setBillingUrl(res.data.billing_url);
      setStep('done');
    } else {
      setError(res.data?.error || 'Erro ao processar pagamento.');
      setStep('form');
    }
  };

  const simulatePaidSubscription = () => {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    saveDemoSubscriptionState({
      subscription: {
        id: 'demo-sub-1',
        plan: plan.id,
        status: 'active',
        expires_at: expires.toISOString(),
      },
      isActive: true,
    });
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="members-neon-card rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-neon-violet/15">
          <div>
            <h2 className="text-white font-bold text-lg">Finalizar Assinatura</h2>
            <p className="text-sm text-gray-400">
              Plano {plan.name} — {plan.price}
              {plan.period}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-neon-cyan transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-gray-300 text-sm mb-4">Escolha a forma de pagamento:</p>
              <button
                type="button"
                onClick={() => handleSelectMethod('pix')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-neon-lime/25 hover:border-neon-lime/55 hover:bg-neon-lime/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-neon-lime/15 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(74,222,128,0.4)]">
                  <QrCode className="w-5 h-5 text-neon-lime" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">PIX</p>
                  <p className="text-xs text-gray-400">Aprovação imediata</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectMethod('credit_card')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-neon-cyan/25 hover:border-neon-cyan/55 hover:bg-neon-cyan/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/15 flex items-center justify-center shadow-[0_0_16px_-4px_rgba(34,211,238,0.4)]">
                  <CreditCard className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Cartão de Crédito</p>
                  <p className="text-xs text-gray-400">Visa, Mastercard e outros</p>
                </div>
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">Dados para faturamento:</p>
              <Input
                placeholder="Nome completo *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="CPF (somente números) *"
                value={form.cpf}
                onChange={(e) =>
                  setForm({ ...form, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })
                }
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Celular (opcional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('method')}
                  className="flex-1 border-white/10 text-gray-300"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 border-0 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white hover:opacity-95 shadow-[0_0_20px_-6px_rgba(232,121,249,0.5)]"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-neon-cyan drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              <p className="text-gray-300">Gerando sua cobrança...</p>
            </div>
          )}

          {step === 'demo' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-fuchsia/30 to-neon-cyan/25 flex items-center justify-center shadow-[0_0_24px_-6px_rgba(232,121,249,0.45)]">
                <Sparkles className="w-8 h-8 text-neon-lime" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Modo demonstração</p>
                <p className="text-gray-400 text-sm mt-2">{demoMessages.checkoutDisabled}</p>
                <p className="text-gray-500 text-xs mt-3">{demoMessages.checkoutSimulateHint}</p>
              </div>
              <Button
                type="button"
                onClick={simulatePaidSubscription}
                className="w-full border-0 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white hover:opacity-95"
              >
                Simular assinatura ativa (local)
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {step === 'done' && billingUrl && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-neon-lime/15 flex items-center justify-center shadow-[0_0_20px_-6px_rgba(74,222,128,0.45)]">
                <QrCode className="w-8 h-8 text-neon-lime" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Cobrança gerada!</p>
                <p className="text-gray-400 text-sm mt-1">
                  Clique abaixo para pagar via AbacatePay. Após o pagamento, sua assinatura será
                  ativada automaticamente.
                </p>
              </div>
              <a href={billingUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full border-0 gap-2 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white hover:opacity-95">
                  <ExternalLink className="w-4 h-4" />
                  Pagar Agora
                </Button>
              </a>
              <button
                type="button"
                onClick={onSuccess}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Já paguei / fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
