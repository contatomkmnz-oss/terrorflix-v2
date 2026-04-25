import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Deleta todos os perfis do usuário
  const profiles = await base44.asServiceRole.entities.Profile.filter({ user_email: user.email });
  for (const profile of profiles) {
    // Deleta histórico de cada perfil
    const history = await base44.asServiceRole.entities.WatchHistory.filter({ profile_id: profile.id });
    for (const h of history) {
      await base44.asServiceRole.entities.WatchHistory.delete(h.id);
    }
    // Deleta lista de cada perfil
    const myList = await base44.asServiceRole.entities.MyList.filter({ profile_id: profile.id });
    for (const item of myList) {
      await base44.asServiceRole.entities.MyList.delete(item.id);
    }
    await base44.asServiceRole.entities.Profile.delete(profile.id);
  }

  // Deleta assinaturas
  const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
  for (const sub of subs) {
    await base44.asServiceRole.entities.Subscription.delete(sub.id);
  }

  // Deleta o próprio usuário
  await base44.asServiceRole.entities.User.delete(user.id);

  return Response.json({ success: true });
});