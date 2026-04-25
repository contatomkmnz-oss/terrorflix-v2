import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // AbacatePay v1 webhook payload: { event, billing }
  const event = body?.event;
  const billing = body?.billing;

  if (!billing?.id) return Response.json({ ok: true });

  const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
    abacatepay_billing_id: billing.id,
  });

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ ok: true, message: "Subscription not found" });
  }

  const subscription = subscriptions[0];

  let newStatus = subscription.status;

  // Eventos AbacatePay: billing.paid, billing.cancelled, billing.expired, billing.refunded
  if (event === "billing.paid" || billing.status === "PAID") {
    newStatus = "active";
  } else if (event === "billing.cancelled" || billing.status === "CANCELLED") {
    newStatus = "cancelled";
  } else if (event === "billing.expired" || billing.status === "EXPIRED") {
    newStatus = "expired";
  } else if (event === "billing.refunded" || billing.status === "REFUNDED") {
    newStatus = "cancelled";
  }

  if (newStatus !== subscription.status) {
    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
      status: newStatus,
    });
  }

  return Response.json({ ok: true });
});