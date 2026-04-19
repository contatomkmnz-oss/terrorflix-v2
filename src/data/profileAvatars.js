/**
 * Avatares da seleção de perfil.
 * Imagens locais em `public/imagens/avatars/` (arte neon em silhueta).
 */

export const PROFILE_AVATAR_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect fill="#2a2a2a" width="256" height="256" rx="12"/><text x="128" y="140" text-anchor="middle" fill="#737373" font-family="system-ui,sans-serif" font-size="72">?</text></svg>'
  );

/** Lista oficial (4 itens) — ficheiros em `public/imagens/avatars/` */
export const profileAvatars = [
  { id: 'av-1', name: 'Impulso', image_url: '/imagens/avatars/av-1-neon.png' },
  { id: 'av-2', name: 'Ritmo', image_url: '/imagens/avatars/av-2-neon.png' },
  { id: 'av-3', name: 'Formação', image_url: '/imagens/avatars/av-3-neon.png' },
  { id: 'av-4', name: 'Energia', image_url: '/imagens/avatars/av-4-neon.png' },
];

/** Seed do mock (mesma lista) */
export const profileAvatarsSeed = profileAvatars.map(({ id, name, image_url }) => ({
  id,
  name,
  image_url,
}));

/** Pré-carrega imagens para reduzir flicker ao abrir o seletor */
export function preloadProfileAvatars() {
  profileAvatars.forEach((a) => {
    const img = new Image();
    img.src = a.image_url;
  });
}
