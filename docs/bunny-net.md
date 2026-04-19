# Bunny.net — hospedar vídeos no DesenhosFlix

Este app **não precisa de API key no navegador** para reproduzir. Basta guardar no episódio uma **URL pública** que o Bunny já expõe após o upload.

## O que o player aceita

| Tipo | Exemplo de URL | Como reproduz |
|------|----------------|---------------|
| **Bunny Stream — iframe** | `https://player.mediadelivery.net/embed/...` ou `iframe.mediadelivery.net/embed/...` | `<iframe>` (player oficial Bunny) |
| **CDN — MP4/WebM direto** | `https://vz-xxxxx.b-cdn.net/.../video.mp4` | `<video>` nativo |
| **CDN — HLS** | `.../playlist.m3u8` | `<video>` — **Safari ok**; Chrome/Firefox podem precisar de player HLS (use iframe ou MP4) |

Recomendação: para máxima compatibilidade em todos os browsers, use **URL do embed (iframe)** copiada do painel **Stream**, ou **MP4** no Pull Zone.

---

## Passo a passo (Bunny Stream)

1. Aceda a [bunny.net](https://bunny.net) e crie conta.
2. No menu, abra **Stream** (vídeo) e crie uma **Video Library** se ainda não existir.
3. Faça **upload** do ficheiro de vídeo (ou use FTP/API no servidor; isso é configurado no painel Bunny, não neste repositório).
4. Depois do processamento, abra o vídeo e procure:
   - **Embed URL** — use o link com **`/embed/`** no caminho (ex.: `player.mediadelivery.net/embed/...`). O link **`/play/`** é a página completa e no nosso player (iframe) pode não reproduzir; o app converte `/play/` → `/embed/` automaticamente, mas no painel Bunny prefira **Embed**.
5. No DesenhosFlix: **Admin → Episódios** (ou equivalente) → campo **URL do vídeo** → cole essa URL.

Não cole a **API Key** nem **Library API Key** no front-end: essas chaves são para servidor e não devem ir para o `VITE_*` nem para o código público.

---

## API Stream no backend (opcional)

Com `npm run dev` (API em `localhost:8787`), podes configurar no **`.env`** (nunca commitar valores reais):

| Variável | Descrição |
|----------|-----------|
| `BUNNY_STREAM_LIBRARY_ID` | ID numérico da Video Library (painel Bunny). |
| `BUNNY_STREAM_API_KEY` | Chave **Stream API** / Access Key da biblioteca (só servidor). |
| `BUNNY_STREAM_CDN_HOSTNAME` | Opcional — hostname da pull zone (ex. `vz-xxxx.b-cdn.net`) para montar URLs CDN no código. |

O script `scripts/dev-api.mjs` carrega `.env` e `.env.local` antes de iniciar o Hono.

**Rotas (cookie de sessão admin obrigatório; `VITE_USE_REAL_API=true` + login em `/AdminLogin`):**

- `GET /api/admin/bunny/videos?page=1&itemsPerPage=50` — lista vídeos da biblioteca (proxy à API Bunny).
- `GET /api/admin/bunny/videos?collection=<UUID_DA_COLECAO>` — só vídeos dessa **coleção** (o mesmo UUID do painel Bunny Stream). Também aceita `collectionId=`. Se definires `BUNNY_STREAM_COLLECTION_ID` no `.env`, esse filtro aplica-se quando o query param não vem na URL. Cada item em `items` inclui `embedUrl` para colar no admin.
- `GET /api/admin/bunny/videos/:videoId` — detalhe de um vídeo; a resposta inclui `embedUrl` (`iframe.mediadelivery.net/embed/...`).
- `POST /api/admin/bunny/videos` — corpo JSON `{ "title": "Nome" }` — cria entrada de vídeo na biblioteca (upload continua no painel Bunny ou TUS).

Implementação: `api/lib/bunnyStream.mjs` (sem pacote npm extra — usa `fetch`).

**CLI (sem browser):** com `.env` preenchido,  
`npm run bunny:list -- 00d0e25c-3430-44f6-9909-503009d19264`  
(ou só `npm run bunny:list` se `BUNNY_STREAM_COLLECTION_ID` estiver no `.env`).

**Segurança:** se a chave de API tiver sido partilhada em texto aberto, **gere uma nova** no painel Bunny e atualize só o `.env` local / variáveis na Vercel.

---

## Passo a passo (CDN / Pull Zone — ficheiro MP4 ou HLS)

1. No Bunny, crie um **Storage** (ou use Stream com saída CDN, conforme o teu plano).
2. Configure um **Pull Zone** (CDN) associado ao hostname tipo `https://vz-xxxxxx.b-cdn.net`.
3. O URL final do ficheiro será algo como:
   - `https://vz-xxxxxx.b-cdn.net/nome-do-ficheiro.mp4`
   - ou `.../playlist.m3u8` para HLS.
4. Cole esse URL no campo **URL do vídeo** do episódio.

O player deteta `b-cdn.net` / `bunnycdn.com` e usa o elemento `<video>`.

---

## CORS e domínio

Se o vídeo estiver num **Pull Zone** próprio e o browser bloquear, no painel Bunny verifique:

- **CORS** / **Allowed Origins** para incluir o teu domínio (ex.: `http://localhost:3000` em dev e o domínio de produção).

O **Stream iframe** costuma funcionar sem ajustes extra porque o conteúdo é servido no domínio do Bunny.

---

## Segurança (opcional, avançado)

- **Signed URLs / token authentication**: exige gerar links no **backend** com expiração. Este projeto em modo demo **não** inclui backend; para produção, implemente um endpoint que devolva URL assinada e guarde no episódio só o ID do vídeo ou um token curto.
- **DRM / geo block**: configurável no painel Stream; não é obrigatório para integração básica.

---

## Onde editar no projeto

- **Episódios (UI admin):** `src/pages/admin/AdminEpisodes.jsx` — campo `video_url`.
- **Lógica de reprodução:** `src/lib/videoEmbed.js` — função `getVideoEmbedUrl`.
- **Player:** `src/pages/Player.jsx` — iframe vs `<video>`.

---

## Teste rápido

1. Cola uma **Embed URL** do Stream num episódio.
2. Abre o player nesse episódio: deves ver o iframe do Bunny a carregar.

Se algo não reproduzir, abre as **DevTools → Console / Network** e confirma que o URL devolve **200** (não 403 por CORS ou token).
