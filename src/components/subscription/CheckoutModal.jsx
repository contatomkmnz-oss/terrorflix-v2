import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CreditCard, QrCode, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckoutModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState("method"); // method | form | processing | done
  const [method, setMethod] = useState(null);
  const [form, setForm] = useState({ name: "", cpf: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [billingUrl, setBillingUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectMethod = (m) => {
    setMethod(m);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!form.name || !form.cpf) {
      setError("Por favor, preencha nome e CPF.");
      return;
    }
    setError(null);
    setLoading(true);
    setStep("processing");

    const res = await base44.functions.invoke("createAbacatepayBilling", {
      plan: plan.id,
      payment_method: method,
      customer: { name: form.name, cpf: form.cpf, phone: form.phone },
    });

    setLoading(false);

    if (res.data?.billing_url) {
      setBillingUrl(res.data.billing_url);
      setStep("done");
    } else {
      setError(res.data?.error || "Erro ao processar pagamento.");
      setStep("form");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg">Finalizar Assinatura</h2>
            <p className="text-sm text-gray-400">Plano {plan.name} — {plan.price}{plan.period}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5">
          {/* Step: Escolher método */}
          {step === "method" && (
            <div className="space-y-3">
              <p className="text-gray-300 text-sm mb-4">Escolha a forma de pagamento:</p>
              <button
                onClick={() => handleSelectMethod("pix")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-green-500/50 hover:bg-green-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">PIX</p>
                  <p className="text-xs text-gray-400">Aprovação imediata</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectMethod("credit_card")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Cartão de Crédito</p>
                  <p className="text-xs text-gray-400">Visa, Mastercard e outros</p>
                </div>
              </button>
            </div>
          )}

          {/* Step: Formulário */}
          {step === "form" && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">Dados para faturamento:</p>
              <Input
                placeholder="Nome completo *"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="CPF (somente números) *"
                value={form.cpf}
                onChange={e => setForm({ ...form, cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Celular (opcional)"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("method")} className="flex-1 border-white/10 text-gray-300">
                  Voltar
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-[#E50914] hover:bg-[#FF3D3D]">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step: Processando */}
          {step === "processing" && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#E50914]" />
              <p className="text-gray-300">Gerando sua cobrança...</p>
            </div>
          )}

          {/* Step: Concluído */}
          {step === "done" && billingUrl && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Cobrança gerada!</p>
                <p className="text-gray-400 text-sm mt-1">Clique abaixo para pagar via AbacatePay. Após o pagamento, sua assinatura será ativada automaticamente.</p>
              </div>
              <a
                href={billingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-[#E50914] hover:bg-[#FF3D3D] gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Pagar Agora
                </Button>
              </a>
              <button onClick={onSuccess} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Já paguei / fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}