import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Busca assinatura ativa existente
  const subscriptions = await base44.entities.Subscription.filter(
    { user_email: user.email },
    "-created_date",
    10
  );

  // Verifica se já tem alguma assinatura ativa
  const activeSub = subscriptions.find(
    s => s.status === "active" && s.expires_at && new Date(s.expires_at) > new Date()
  );

  if (activeSub) {
    return Response.json({ subscription: activeSub, isActive: true, isTrial: activeSub.plan === 'trial' });
  }

  // Verifica se já teve trial alguma vez (não criar segundo trial)
  const hadTrial = subscriptions.find(s => s.plan === 'trial');
  if (hadTrial) {
    // Teve trial mas expirou — não criar novo
    const latestSub = subscriptions[0] || null;
    return Response.json({ subscription: latestSub, isActive: false, isTrial: false });
  }

  // Nunca teve assinatura — criar trial de 29 dias
  const now = new Date();
  const expires = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);

  const newSub = await base44.entities.Subscription.create({
    user_email: user.email,
    plan: 'trial',
    status: 'active',
    payment_method: 'pix',
    starts_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });

  return Response.json({ subscription: newSub, isActive: true, isTrial: true });
});