import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await base44.entities.Subscription.filter(
    { user_email: user.email },
    "-created_date",
    1
  );

  const subscription = subscriptions?.[0] || null;
  const isActive = subscription?.status === "active" && new Date(subscription.expires_at) > new Date();

  return Response.json({ subscription, isActive });
});