import React from 'react';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionWall({ isTrial = false, daysLeft = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F] px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <h1 className="text-3xl font-black mb-8">
          <span className="text-[#E50914]">Desenhos</span>
          <span className="text-[#FFC107]">Flix</span>
        </h1>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#E50914]" />
          </div>

          {isTrial && daysLeft > 0 ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Seu período grátis acabou</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Você aproveitou os <strong className="text-white">29 dias grátis</strong>. Para continuar assistindo, assine um dos nossos planos.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Assinatura necessária</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Para assistir aos desenhos no DesenhosFlix é necessário ter uma assinatura ativa.
              </p>
            </>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/Subscription')}
              className="w-full bg-[#E50914] hover:bg-[#FF3D3D] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Crown className="w-4 h-4" />
              Ver Planos e Assinar
            </button>

            <p className="text-xs text-gray-600">
              Já assinou? Aguarde alguns instantes e recarregue a página.
            </p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {['Sem anúncios', 'Conteúdo exclusivo', 'Novidades semanais'].map(b => (
            <div key={b} className="bg-[#1A1A1A]/60 rounded-xl p-3 border border-white/5">
              <Sparkles className="w-4 h-4 text-[#FFC107] mx-auto mb-1" />
              <p className="text-[11px] text-gray-400">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}