import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { series_title, series_description, series_id } = await req.json();

  const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

  const seriesUrl = `https://preview-sandbox--69b61a29474f4e54b5af9b86.base44.app/SeriesDetail?id=${series_id}`;

  const emailBody = `
    <div style="background:#0F0F0F;color:#fff;font-family:Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto;border-radius:12px">
      <h1 style="color:#E50914;margin-bottom:4px">🎬 DesenhosFlix</h1>
      <h2 style="margin-top:0">Nova série disponível!</h2>
      <div style="background:#1A1A1A;border-radius:10px;padding:24px;margin:20px 0">
        <h3 style="color:#FFC107;margin-top:0">${series_title}</h3>
        <p style="color:#ccc">${series_description || 'Uma nova série incrível está disponível para você assistir agora!'}</p>
      </div>
      <a href="${seriesUrl}" style="background:#E50914;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:8px">▶ Assistir Agora</a>
      <p style="color:#555;font-size:12px;margin-top:24px">DesenhosFlix - Sua plataforma de animações favorita</p>
    </div>
  `;

  let sent = 0;
  for (const u of users) {
    if (u.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        subject: `🎬 ${series_title} foi disponibilizada no DesenhosFlix!`,
        body: emailBody,
        from_name: 'DesenhosFlix'
      });
      sent++;
    }
  }

  return Response.json({ success: true, sent });
});