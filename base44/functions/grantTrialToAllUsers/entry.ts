import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Busca todos os usuários e todas as assinaturas
  const [users, subscriptions] = await Promise.all([
    base44.asServiceRole.entities.User.list('-created_date', 1000),
    base44.asServiceRole.entities.Subscription.list('-created_date', 2000),
  ]);

  // Emails que já têm alguma assinatura (qualquer tipo)
  const emailsWithSub = new Set(subscriptions.map(s => s.user_email));

  // Usuários sem nenhuma assinatura
  const usersWithoutSub = users.filter(u => !emailsWithSub.has(u.email));

  const now = new Date();
  const expires = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);

  let created = 0;
  for (const u of usersWithoutSub) {
    await base44.asServiceRole.entities.Subscription.create({
      user_email: u.email,
      plan: 'trial',
      status: 'active',
      payment_method: 'pix',
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });
    created++;
  }

  return Response.json({ success: true, created, skipped: emailsWithSub.size });
});