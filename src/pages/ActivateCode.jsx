import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { brand } from '@/data/siteContent';
import { publicAssetUrl } from '@/lib/publicAssetUrl';

export default function ActivateCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');

    const codes = await base44.entities.AccessCode.filter({ code: code.trim().toUpperCase() });
    
    if (codes.length === 0) {
      setError('Código inválido. Verifique e tente novamente.');
      setLoading(false);
      return;
    }

    const accessCode = codes[0];
    if (!accessCode.active) {
      setError('Este código está desativado.');
      setLoading(false);
      return;
    }
    if (accessCode.used_by) {
      setError('Este código já foi utilizado.');
      setLoading(false);
      return;
    }

    await base44.entities.AccessCode.update(accessCode.id, {
      used_by: user?.email,
      used_date: new Date().toISOString(),
    });

    await base44.auth.updateMe({ activated: true });

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate('/ProfileSelect'), 2000);
  };

  return (
    <div className="members-area flex items-center justify-center p-4">
      <div className="members-area-bg" aria-hidden />
      <div className="members-area-inner w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={publicAssetUrl(brand.logoUrl)}
            alt={brand.name}
            className="h-14 w-auto mx-auto mb-4 object-contain drop-shadow-[0_0_20px_rgba(232,121,249,0.35)]"
          />
          <h1 className="text-2xl font-black mb-2 members-heading-gradient">Ativar conta</h1>
          <p className="text-gray-400 text-sm">Use o código de acesso do seu plano</p>
        </div>

        <div className="members-neon-card rounded-xl p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-neon-lime mx-auto mb-4 drop-shadow-[0_0_16px_rgba(74,222,128,0.5)]" />
              <h2 className="text-xl font-bold mb-2">Conta Ativada!</h2>
              <p className="text-gray-400">Redirecionando...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-member-surface/80 border border-neon-violet/20">
                <Key className="w-5 h-5 text-neon-cyan shrink-0" />
                <p className="text-sm text-gray-300">
                  Insira o código de acesso que você recebeu ao adquirir o plano.
                </p>
              </div>

              <Input
                placeholder="Ex: DESENHOS-ABC123"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                className="bg-[#2A2A2A] border-none text-lg text-center tracking-widest font-mono mb-4"
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button
                onClick={handleActivate}
                disabled={loading || !code.trim()}
                className="w-full py-3 text-base border-0 bg-gradient-to-r from-neon-fuchsia via-neon-magenta to-neon-cyan text-white hover:opacity-95 shadow-[0_0_24px_-6px_rgba(232,121,249,0.45)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ativar Código'}
              </Button>

              <button
                onClick={() => navigate('/Home')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
              >
                Pular por agora
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
