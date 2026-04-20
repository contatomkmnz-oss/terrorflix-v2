import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isFirebaseAuthMode } from '@/lib/firebaseApp';
import { signInWithGoogle } from '@/lib/firebaseAuth';
import { brand } from '@/data/siteContent';
import { publicAssetUrl } from '@/lib/publicAssetUrl';
import { Button } from '@/components/ui/button';

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isFirebaseAuthMode()) {
      navigate('/ProfileSelect', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      navigate('/ProfileSelect', { replace: true });
    }
  }, [user, isLoadingAuth, navigate]);

  const onGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      const { hydrateCatalogBootstrap } = await import('@/lib/catalogHydration');
      await hydrateCatalogBootstrap();
      navigate('/ProfileSelect', { replace: true });
    } catch (e) {
      setErr(e?.message || 'Não foi possível iniciar sessão.');
    } finally {
      setBusy(false);
    }
  };

  if (!isFirebaseAuthMode()) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] px-4">
      <img
        src={publicAssetUrl(brand.logoUrl)}
        alt={brand.name}
        className="h-14 md:h-16 w-auto object-contain mb-10 drop-shadow-[0_0_20px_rgba(232,121,249,0.35)]"
      />
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-xl font-bold text-white text-center mb-2">Entrar</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Usa a tua conta Google para continuar.</p>
        {err && (
          <p className="text-sm text-red-400 mb-4 text-center" role="alert">
            {err}
          </p>
        )}
        <Button
          type="button"
          className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold"
          disabled={busy || isLoadingAuth}
          onClick={onGoogle}
        >
          {busy ? 'A abrir…' : 'Continuar com Google'}
        </Button>
      </div>
    </div>
  );
}
