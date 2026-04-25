import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ABACATEPAY_API_KEY = Deno.env.get("ABACATEPAY_API_KEY");
const BASE_URL = "https://api.abacatepay.com/v1";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription_id } = await req.json();

  const subscriptions = await base44.entities.Subscription.filter({ user_email: user.email }, "-created_date", 1);
  const subscription = subscriptions?.[0];

  if (!subscription) return Response.json({ error: "Assinatura não encontrada" }, { status: 404 });
  if (subscription.id !== subscription_id) return Response.json({ error: "Acesso negado" }, { status: 403 });

  // Tenta cancelar na AbacatePay se houver billing_id
  if (subscription.abacatepay_billing_id) {
    await fetch(`${BASE_URL}/billing/${subscription.abacatepay_billing_id}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }

  await base44.entities.Subscription.update(subscription.id, { status: "cancelled" });

  return Response.json({ ok: true });
});