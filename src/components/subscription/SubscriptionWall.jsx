import React from 'react';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { brand } from '@/data/siteContent';
import { publicAssetUrl } from '@/lib/publicAssetUrl';

export default function SubscriptionWall({ isTrial = false, daysLeft = 0 }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 members-area">
      <div className="members-area-bg" aria-hidden />
      <div className="members-area-inner max-w-md w-full text-center">
        <img
          src={publicAssetUrl(brand.logoUrl)}
          alt={brand.name}
          className="h-16 w-auto max-w-full mx-auto mb-8 object-contain drop-shadow-[0_0_24px_rgba(232,121,249,0.4)]"
        />

        <div className="members-neon-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-fuchsia/25 to-neon-cyan/20 border border-neon-cyan/35 flex items-center justify-center mx-auto mb-5 shadow-[0_0_28px_-6px_rgba(232,121,249,0.45)]">
            <Lock className="w-7 h-7 text-neon-cyan" />
          </div>

          {isTrial && daysLeft > 0 ? (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Seu período grátis acabou</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Você aproveitou os <strong className="text-neon-cyan">29 dias grátis</strong>. Para continuar
                assistindo, assine um dos nossos planos.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Assinatura necessária</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Para assistir no {brand.name} é necessário ter uma assinatura ativa.
              </p>
            </>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/Subscription')}
              className="w-full font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-white bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan hover:opacity-95 shadow-[0_0_28px_-6px_rgba(232,121,249,0.55)]"
            >
              <Crown className="w-4 h-4" />
              Ver Planos e Assinar
            </button>

            <p className="text-xs text-gray-500">Já assinou? Aguarde alguns instantes e recarregue a página.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {['Sem anúncios', 'Conteúdo exclusivo', 'Novidades semanais'].map((b) => (
            <div
              key={b}
              className="rounded-xl p-3 border border-neon-violet/20 bg-member-surface/70 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-neon-lime mx-auto mb-1 drop-shadow-[0_0_8px_rgba(74,222,128,0.45)]" />
              <p className="text-[11px] text-gray-400">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
