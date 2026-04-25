import React, { useState } from 'react';
import { AlertTriangle, X, Crown, Gift } from 'lucide-react';
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
      <div className="bg-[#FFC107]/10 border-b border-[#FFC107]/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#FFC107]">
          <Gift className="w-4 h-4 shrink-0" />
          <span>
            Seu período grátis encerra em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>. Assine para não perder o acesso!
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate('/Subscription')} className="text-xs text-[#FFC107] hover:text-yellow-300 font-bold underline">
            Assinar agora
          </button>
          <button onClick={() => setDismissed(true)} className="text-[#FFC107]/60 hover:text-[#FFC107]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Assinatura normal expirando em breve
  if (!isTrial && daysLeft !== null && daysLeft <= 5) {
    return (
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Sua assinatura expira em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>. Renove para não perder o acesso.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate('/Subscription')} className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold underline">
            Renovar
          </button>
          <button onClick={() => setDismissed(true)} className="text-yellow-500 hover:text-yellow-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}