import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_email, plan } = await req.json();

    await base44.asServiceRole.entities.Notification.create({
      type: 'new_subscription',
      message: `Nova assinatura: ${user_email} - Plano ${plan}`,
      data: { user_email, plan }
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});