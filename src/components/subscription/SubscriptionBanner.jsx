import React, { useState } from 'react';
import { AlertTriangle, X, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionBanner({ subscription, isActive, isTrial }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed || !subscription || !isActive) return null;

  const daysLeft = subscription.expires_at
    ? Math.ceil((new Date(subscription.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Trial: avisa nos últimos 5 dias
  if (isTrial && daysLeft !== null && daysLeft <= 5) {
    return (
      <div className="bg-gradient-to-r from-neon-fuchsia/12 via-member-surface/80 to-neon-cyan/12 border-b border-neon-cyan/25 px-4 py-2.5 flex items-center justify-between shadow-[0_4px_24px_-12px_rgba(232,121,249,0.35)]">
        <div className="flex items-center gap-2 text-sm text-neon-cyan">
          <Gift className="w-4 h-4 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]" />
          <span>
            Seu período grátis encerra em <strong className="text-white">{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>
            . Assine para não perder o acesso!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/Subscription')}
            className="text-xs text-neon-fuchsia hover:text-neon-pink font-bold underline underline-offset-2"
          >
            Assinar agora
          </button>
          <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Assinatura normal expirando em breve
  if (!isTrial && daysLeft !== null && daysLeft <= 5) {
    return (
      <div className="bg-neon-orange/10 border-b border-neon-orange/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neon-orange">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Sua assinatura expira em <strong className="text-white">{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>.
            Renove para não perder o acesso.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/Subscription')}
            className="text-xs text-neon-lime hover:text-white font-semibold underline underline-offset-2"
          >
            Renovar
          </button>
          <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}