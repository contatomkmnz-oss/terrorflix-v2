import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Buscar a série Caverna do Dragão
    const series = await base44.entities.Series.filter({ title: 'Caverna do Dragão' });
    if (!series || series.length === 0) {
      return Response.json({ error: 'Série não encontrada' }, { status: 404 });
    }

    const seriesId = series[0].id;

    const episodes = [
      { season: 1, number: 1, title: 'A Noite Sem Amanhã' },
      { season: 1, number: 2, title: 'O Salão Dos Ossos' },
      { season: 1, number: 3, title: 'O Olho do Observador' },
      { season: 1, number: 4, title: 'As Crianças Perdidas' },
      { season: 1, number: 5, title: 'O Vale Dos Unicórnio' },
      { season: 1, number: 6, title: 'A Procura Do Esqueleto Guerreiro' },
      { season: 1, number: 7, title: 'Em Busca Do Mestre Dos Magos' },
      { season: 1, number: 8, title: 'A Bela e a Fera Do Pântano' },
      { season: 1, number: 9, title: 'Servo Do Mal' },
      { season: 1, number: 10, title: 'Prisão Sem Muros' },
      { season: 1, number: 11, title: 'O Jardim de Zinn' },
      { season: 1, number: 12, title: 'A Caixa' },
      { season: 1, number: 13, title: 'As Mágicas Desastrosas De Presto' }
    ];

    const episodesToCreate = episodes.map(ep => ({
      ...ep,
      series_id: seriesId,
      description: `Episódio ${ep.number} - ${ep.title}`
    }));

    await base44.entities.Episode.bulkCreate(episodesToCreate);

    return Response.json({ 
      success: true, 
      message: `${episodes.length} episódios adicionados à série Caverna do Dragão`,
      count: episodes.length 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});