/**
 * Catálogo central de filmes (e minissérie) — estilo Netflix: várias categorias por título.
 * Edite apenas aqui para alterar títulos, categorias e metadados.
 * Lote adicional: `movieCatalogHorror70.js`.
 */
import { DEMO_VIDEO_MP4 } from '../constants/demoVideo.js';
import { MOVIE_HORROR_70 } from './movieCatalogHorror70.js';
import { posterUrlForCatalogId } from './catalogPosterUrls.js';

/** Rotação só com cartazes verticais — nunca usar hero-slide aqui (são banners horizontais). */
const POSTERS = [
  '/imagens/banners/poster-movie.svg',
  '/imagens/banners/poster-tile-b.svg',
  '/imagens/banners/poster-tile-c.svg',
];

/** Banners largos da ficha/hero (SVGs horizontais). */
const HERO_BANNERS = [
  '/imagens/banners/hero-slide-1.svg',
  '/imagens/banners/hero-slide-2.svg',
];

function poster(i) {
  return POSTERS[i % POSTERS.length];
}

export function coverForCatalogEntry(entry, i) {
  return entry.poster_url || posterUrlForCatalogId(entry.id) || poster(i);
}

export function bannerForCatalogEntry(entry, i) {
  return entry.banner_url || HERO_BANNERS[i % HERO_BANNERS.length];
}

/**
 * @typedef {Object} CatalogEntry
 * @property {string} id
 * @property {string} title
 * @property {number} year
 * @property {string} description
 * @property {string[]} categories — rótulos exatos das fileiras (podem repetir entre títulos)
 * @property {'movie'|'series'} kind
 * @property {number} [total_views]
 * @property {string} [age_rating]
 * @property {string} [poster_url] — capa absoluta (ex. TMDB/Bunny); senão rotação local + `catalogPosterUrls.js`
 * @property {string} [banner_url] — hero/banner opcional
 * @property {string} [movie_url] — URL de streaming (filmes); senão `DEMO_VIDEO_MP4` no seed/mock
 */

/** Lista completa — mesmos filmes podem aparecer em várias categorias. */
export const MOVIE_CATALOG = [
  {
    id: 'movie-a-voz-assassina-1989',
    kind: 'movie',
    title: 'A Voz Assassina',
    year: 1989,
    description:
      'Um psicopata mascarado vai atrás das empregadas de uma empresa de sexo por telefone com a intenção de matá-las, criando seu próprio circo de terror e tortura.',
    categories: ['Slashers', 'Terror cult'],
    total_views: 2100,
    age_rating: '16',
  },
  {
    id: 'movie-it-bem-vindos-a-derry-2025',
    kind: 'movie',
    title: 'IT: Bem-Vindos a Derry',
    year: 2025,
    description: `A história de origem de Pennywise começa nos anos 60 em Derry — descubra mais sobre o terrível palhaço na série prelúdio de IT: A Coisa.

Antes dos eventos dos filmes de IT: A Coisa, o palhaço macabro começou a assombrar a pequena cidade de Derry nos anos 60. Descubra a história de origem do palhaço que marcou Derry como uma cidade assombrada com ondas de desaparecimentos inexplicáveis.`,
    categories: ['Em breve', 'Novidades'],
    total_views: 9800,
    age_rating: '16',
  },
  {
    id: 'movie-o-exorcista-1974',
    kind: 'movie',
    title: 'O Exorcista',
    year: 1974,
    description: `Uma garota de 12 anos começa a apresentar comportamentos perturbadores e inexplicáveis. O que parecia um problema de saúde rapidamente se transforma em algo muito mais sombrio.

Sem respostas da ciência, sua mãe recorre à fé. Dois padres são chamados para enfrentar uma presença maligna que desafia tudo o que eles acreditam.

Enquanto a situação foge do controle, uma batalha intensa entre o bem e o mal se inicia — e nem todos vão sair ilesos.`,
    categories: ['Destaques', 'Paranormal', 'Mais Assistidos'],
    total_views: 15000,
    age_rating: '16',
  },
  {
    id: 'movie-halloween-1978',
    kind: 'movie',
    title: 'Halloween',
    year: 1978,
    description:
      'A história começa em 1963, quando o jovem Michael Myers assassina sua irmã na noite de Halloween e é internado em um hospital psiquiátrico. Quinze anos depois, ele escapa e retorna à pacata cidade de Haddonfield, Illinois, perseguindo um grupo de adolescentes — entre eles Laurie Strode, uma babá que se torna alvo de sua fúria silenciosa. O psiquiatra Dr. Sam Loomis tenta impedir o assassino antes que a tragédia se repita.',
    categories: ['Slashers', 'Sagas Completas', 'Destaques'],
    total_views: 14200,
    age_rating: '16',
  },
  {
    id: 'movie-psicose-1960',
    kind: 'movie',
    title: 'Psicose',
    year: 1960,
    description:
      'O filme acompanha Marion Crane (Janet Leigh), uma secretária que foge após desviar dinheiro de seu empregador. Durante sua fuga, ela se hospeda no isolado Bates Motel, administrado pelo tímido e enigmático Norman Bates (Anthony Perkins). A narrativa muda bruscamente após o famoso assassinato no chuveiro, conduzindo a uma investigação que revela os segredos sombrios do motel e de seu proprietário.',
    categories: ['Terror psicológico', 'Destaques', 'Terror cult'],
    total_views: 13800,
    age_rating: '14',
  },
  {
    id: 'movie-o-iluminado-1980',
    kind: 'movie',
    title: 'O Iluminado',
    year: 1980,
    description:
      'Jack Torrance, um escritor em bloqueio criativo, aceita o emprego de zelador de inverno no isolado Hotel Overlook, nas montanhas do Colorado. Ao se instalar com a esposa Wendy e o filho Danny — que possui dons mediúnicos —, Jack começa a perder a sanidade sob a influência de forças sobrenaturais ligadas ao hotel. O isolamento e os fenômenos paranormais o levam à loucura, transformando-o em uma ameaça à própria família.',
    categories: ['Terror psicológico', 'Destaques', 'Mais Assistidos'],
    total_views: 13100,
    age_rating: '16',
  },
  {
    id: 'movie-o-massacre-da-serra-eletrica-1974',
    kind: 'movie',
    title: 'O Massacre da Serra Elétrica',
    year: 1974,
    description:
      'O filme acompanha Sally Hardesty, seu irmão Franklin e três amigos em viagem pelo interior do Texas para verificar o túmulo do avô. Ao visitarem a antiga fazenda da família, o grupo encontra uma moradia próxima habitada por canibais. Entre eles está Leatherface, um homem mascarado que ataca as vítimas com uma serra elétrica. A narrativa intensa e o realismo quase documental amplificam a sensação de terror e desespero.',
    categories: ['Slashers', 'Terror cult', 'Destaques'],
    total_views: 11200,
    age_rating: '18',
  },
  {
    id: 'movie-sexta-feira-13-1980',
    kind: 'movie',
    title: 'Sexta-Feira 13',
    year: 1980,
    description:
      'Após um duplo homicídio ocorrido em 1958, o acampamento Crystal Lake permanece fechado por décadas. Quando novos monitores decidem reabrir o local, uma série de assassinatos brutais começa a ocorrer. O filme acompanha a tentativa dos jovens de sobreviver enquanto um assassino desconhecido os caça um a um, culminando em uma revelação que redefine o mito do vilão Jason Voorhees e de sua mãe, Pamela.',
    categories: ['Slashers', 'Sagas Completas', 'Mais Assistidos'],
    total_views: 12100,
    age_rating: '18',
  },
  {
    id: 'movie-a-hora-do-pesadelo-1984',
    kind: 'movie',
    title: 'A Hora do Pesadelo',
    year: 1984,
    movie_url:
      'https://player.mediadelivery.net/embed/628574/d0073d52-2d6b-4a85-957e-794c2c0dc107',
    description:
      'O filme acompanha um grupo de adolescentes que começa a ter pesadelos perturbadores com um homem deformado que possui garras de aço nas mãos. Esse homem é Freddy Krueger, um assassino que invade os sonhos de suas vítimas e as mata durante o sono — mortes que se refletem na vida real. À medida que os jovens tentam permanecer acordados para sobreviver, descobrem a origem sombria do assassino: Krueger foi um molestador de crianças queimado vivo pelos pais da vizinhança e agora busca vingança através dos sonhos.',
    categories: ['Slashers', 'Sagas Completas', 'Mais Assistidos'],
    total_views: 11900,
    age_rating: '16',
  },
  {
    id: 'movie-chuck-brinquedo-assassino-1989',
    kind: 'movie',
    title: 'Chuck – Brinquedo Assassino',
    year: 1989,
    description:
      'A trama acompanha Karen Barclay, uma mãe solteira que presenteia o filho Andy com um boneco chamado “Good Guy”. O que parece um brinquedo inocente revela-se uma maldição: o boneco está possuído pelo espírito de um assassino em série, Charles Lee Ray, que usou um ritual de vodu para transferir sua alma ao brinquedo antes de morrer.',
    categories: ['Slashers', 'Sagas Completas', 'Mais Assistidos'],
    total_views: 9800,
    age_rating: '16',
  },
  {
    id: 'movie-panico-1996',
    kind: 'movie',
    title: 'Pânico',
    year: 1996,
    description:
      'A trama acompanha a adolescente Sidney Prescott, alvo de um assassino mascarado conhecido como Ghostface, que começa a aterrorizar a pequena cidade de Woodsboro. O filme combina elementos de mistério e comédia, apresentando personagens cientes das convenções do gênero de terror, o que o torna uma sátira e uma homenagem ao mesmo tempo.',
    categories: ['Slashers', 'Sagas Completas', 'Mais Assistidos'],
    total_views: 12500,
    age_rating: '16',
  },
  {
    id: 'movie-hellraiser-2018',
    kind: 'movie',
    title: 'Hellraiser',
    year: 2018,
    description:
      'O filme gira em torno de uma misteriosa caixa de quebra-cabeça — o Lament Configuration — que abre um portal para um reino de prazer e dor administrado pelos Cenobitas, seres extradimensionais. Quando Frank Cotton a resolve, é levado ao inferno, e sua amante Julia tenta trazê-lo de volta à vida, desencadeando uma série de horrores. A história explora obsessão, desejo e sofrimento físico como fronteiras indistintas.',
    categories: ['Terror cult', 'Novidades', 'Paranormal'],
    total_views: 6400,
    age_rating: '18',
  },
  {
    id: 'movie-poltergeist-1982',
    kind: 'movie',
    title: 'Poltergeist',
    year: 1982,
    description:
      'A trama acompanha a família Freeling, cuja vida pacata em um subúrbio da Califórnia é abalada por fenômenos paranormais que começam a se manifestar através da televisão da casa. O comportamento inicialmente lúdico dos espíritos logo se transforma em terror quando a pequena Carol Anne desaparece, sendo capturada por forças sobrenaturais.',
    categories: ['Paranormal', 'Destaques'],
    total_views: 10800,
    age_rating: '12',
  },
  {
    id: 'movie-a-profecia-1977',
    kind: 'movie',
    title: 'A Profecia',
    year: 1977,
    description:
      'Robert Thorn, diplomata americano, decide ocultar da esposa o fato de que o bebê dela nasceu morto. Ele substitui a criança por um órfão sem origem conhecida, Damien. À medida que o menino cresce, estranhos e violentos acontecimentos começam a cercar a família, revelando gradualmente que Damien pode ser o próprio Anticristo. A narrativa combina elementos de suspense psicológico, iconografia religiosa e tragédia familiar.',
    categories: ['Paranormal', 'Terror psicológico'],
    total_views: 9100,
    age_rating: '16',
  },
  {
    id: 'movie-o-chamado-2003',
    kind: 'movie',
    title: 'O Chamado',
    year: 2003,
    description:
      'A trama acompanha Rachel Keller, uma jornalista que investiga a misteriosa morte de sua sobrinha adolescente e de outros jovens, todos após assistirem a uma fita de vídeo amaldiçoada. Após assistir à gravação, Rachel descobre que tem apenas sete dias para desvendar a origem da maldição e salvar sua vida e a de seu filho.',
    categories: ['Paranormal', 'Mais Assistidos', 'Originais'],
    total_views: 11700,
    age_rating: '14',
  },
  {
    id: 'movie-a-casa-de-cera-2005',
    kind: 'movie',
    title: 'A Casa de Cera',
    year: 2005,
    description:
      'O filme segue um grupo de amigos que viaja para um jogo de futebol americano e acaba se perdendo em uma estrada deserta. Ao buscar ajuda, eles encontram a isolada cidade de Ambrose, cuja principal atração é um museu de cera. Logo descobrem que as figuras do local são, na verdade, corpos humanos cobertos de cera, vítimas dos irmãos sinistros que controlam a cidade.',
    categories: ['Slashers', 'Mais Assistidos'],
    total_views: 8600,
    age_rating: '18',
  },
  {
    id: 'movie-jogos-mortais-2004',
    kind: 'movie',
    title: 'Jogos Mortais',
    year: 2004,
    description:
      'A história gira em torno de dois homens que acordam acorrentados em um banheiro, sem saber como chegaram ali. Eles logo descobrem ser peças de um jogo mortal orquestrado por Jigsaw, um assassino que testa o valor da vida de suas vítimas por meio de armadilhas cruéis.',
    categories: ['Slashers', 'Mais Assistidos', 'Sagas Completas'],
    total_views: 12200,
    age_rating: '18',
  },
  {
    id: 'movie-atividade-paranormal-2007',
    kind: 'movie',
    title: 'Atividade Paranormal',
    year: 2007,
    description:
      'A trama acompanha Katie e Micah, um casal que instala câmeras em casa para investigar eventos sobrenaturais noturnos. Filmado quase inteiramente dentro da residência, o filme utiliza planos fixos, iluminação natural e atuações improvisadas para reforçar a sensação de realismo e tensão crescente. O foco está na sugestão do terror — ruídos, sombras e movimentos sutis — em vez de efeitos visuais explícitos.',
    categories: ['Paranormal', 'Found Footage', 'Originais', 'Mais Assistidos'],
    total_views: 12800,
    age_rating: '14',
  },
  {
    id: 'movie-invocacao-do-mal-2013',
    kind: 'movie',
    title: 'Invocação do Mal',
    year: 2013,
    description:
      'Ambientado em 1971, o filme acompanha o casal de investigadores paranormais Ed e Lorraine Warren enquanto ajuda a família Perron, assombrada por uma presença demoníaca em sua fazenda em Harrisville, Rhode Island. A trama foi inspirada em um caso real documentado pelos verdadeiros Warren, envolvendo supostos ataques espirituais atribuídos ao espírito de Bathsheba Sherman, uma mulher acusada de bruxaria no século XIX.',
    categories: ['Paranormal', 'Mais Assistidos', 'Sagas Completas', 'Destaques'],
    total_views: 13500,
    age_rating: '16',
  },
  {
    id: 'movie-rec-2008',
    kind: 'movie',
    title: 'REC',
    year: 2008,
    description:
      'Durante a gravação de um programa sobre o trabalho de bombeiros em Barcelona, uma repórter de TV (Manuela Velasco) e seu cameraman acompanham uma equipe a um edifício residencial após um chamado de emergência. O que começa como uma cobertura de rotina transforma-se em pesadelo quando uma infecção misteriosa transforma os moradores em criaturas violentas.',
    categories: ['Found Footage', 'Terror cult', 'Originais', 'Novidades'],
    total_views: 10400,
    age_rating: '18',
  },
  {
    id: 'movie-o-grito-2004',
    kind: 'movie',
    title: 'O Grito',
    year: 2004,
    description:
      'Ambientado em Tóquio, o filme acompanha Karen Davis, uma enfermeira americana que, ao visitar uma casa marcada por uma tragédia, entra em contato com uma maldição que consome todos que nela entram. O espírito vingativo de Kayako Saeki e seu filho Toshio perpetuam um ciclo de horror, atacando vítimas sucessivas. A trama se desenrola em narrativa fragmentada, reforçando a sensação de confusão e inevitabilidade do destino.',
    categories: ['Paranormal', 'Mais Assistidos', 'Terror psicológico'],
    total_views: 9900,
    age_rating: '16',
  },
  {
    id: 'series-it-a-coisa-1990',
    kind: 'series',
    title: 'It – A Coisa',
    year: 1990,
    description:
      'A minissérie acompanha um grupo de amigos de infância — o “Clube dos Perdedores” — que enfrenta uma entidade maligna em Derry, uma pequena cidade do Maine. Alternando entre os anos 1960 e 1990, a narrativa mostra os personagens lidando com o trauma persistente do encontro com o monstro, que assume a forma de seus piores medos, sendo mais frequentemente o palhaço Pennywise.',
    categories: ['Destaques', 'Terror psicológico'],
    total_views: 8900,
    age_rating: '16',
  },
  {
    id: 'movie-a-bruxa-de-blair-1999',
    kind: 'movie',
    title: 'A Bruxa de Blair',
    year: 1999,
    description:
      'A trama acompanha três estudantes de cinema que adentram uma floresta em Maryland para gravar um documentário sobre a lenda da Bruxa de Blair. O grupo desaparece misteriosamente, e apenas suas gravações são encontradas. O filme apresenta essas imagens “recuperadas”, sugerindo que o espectador está assistindo ao material deixado pelas vítimas.',
    categories: ['Found Footage', 'Terror cult', 'Originais'],
    total_views: 10100,
    age_rating: '14',
  },
  {
    id: 'movie-premonicao-1999',
    kind: 'movie',
    title: 'Premonição',
    year: 1999,
    description:
      'Alex Browning (Devon Sawa), estudante do ensino médio, tem uma premonição de que o avião em que ele e seus colegas embarcaram para uma viagem à Europa irá explodir logo após a decolagem. Ao entrar em pânico, ele convence alguns amigos a descer da aeronave, que de fato explode momentos depois. Porém, um a um, os sobreviventes passam a morrer em acidentes macabros, como se a própria Morte estivesse corrigindo o curso do destino.',
    categories: ['Mais Assistidos', 'Terror psicológico', 'Sagas Completas'],
    total_views: 9600,
    age_rating: '16',
  },
  {
    id: 'movie-exterminio-2003',
    kind: 'movie',
    title: 'Extermínio',
    year: 2003,
    description:
      'A história se passa em Londres após a liberação acidental de um vírus altamente contagioso chamado “Rage”, que transforma humanos em criaturas violentas e irracionais. O protagonista, Jim (interpretado por Cillian Murphy), acorda de um coma 28 dias após o surto e descobre uma cidade deserta. Junto a outros sobreviventes, ele tenta encontrar segurança em meio ao colapso da civilização.',
    categories: ['Sobrevivência / Apocalipse', 'Ficção Científica de Terror', 'Mais Assistidos'],
    total_views: 11800,
    age_rating: '18',
  },
  {
    id: 'movie-a-entidade-2012',
    kind: 'movie',
    title: 'A Entidade',
    year: 2012,
    description:
      'Ellison Oswalt, escritor de crimes verídicos em declínio, muda-se com a família para uma casa onde ocorreu um assassinato brutal. Ao encontrar rolos de filmes em Super 8 no sótão, ele descobre registros de diversas famílias mortas em circunstâncias semelhantes. A investigação o leva à figura demoníaca Bagul, entidade que usa imagens gravadas para amaldiçoar e destruir famílias inteiras.',
    categories: ['Paranormal', 'Terror psicológico', 'Mais Assistidos', 'Novidades'],
    total_views: 7200,
    age_rating: '16',
  },
  {
    id: 'movie-alien-1979',
    kind: 'movie',
    title: 'Alien – O Oitavo Passageiro',
    year: 1979,
    description:
      'A tripulação da nave cargueira USCSS Nostromo é despertada de um sono criogênico ao receber um sinal de socorro vindo de um planetoide. Durante a investigação, um tripulante é atacado por uma criatura parasita que implanta um embrião alienígena em seu corpo. O ser — posteriormente conhecido como xenomorfo — nasce e inicia uma caçada mortal dentro da nave, confinando os personagens em um ambiente de tensão crescente e desespero.',
    categories: ['Ficção Científica de Terror', 'Destaques', 'Terror cult'],
    total_views: 14000,
    age_rating: '14',
  },
  {
    id: 'movie-o-enigma-de-outro-mundo-1982',
    kind: 'movie',
    title: 'O Enigma de Outro Mundo',
    year: 1982,
    description:
      'Ambientado em uma estação de pesquisa norte-americana na Antártica, o filme acompanha doze homens que encontram uma criatura alienígena capaz de imitar perfeitamente qualquer ser vivo. À medida que a paranoia se espalha entre os cientistas, ninguém consegue distinguir humanos de impostores. O piloto R.J. MacReady (Kurt Russell) lidera uma luta desesperada pela sobrevivência em meio à desconfiança e ao isolamento glaciais.',
    categories: ['Ficção Científica de Terror', 'Terror psicológico', 'Destaques', 'Terror cult'],
    total_views: 10600,
    age_rating: '16',
  },
  {
    id: 'movie-corra-2017',
    kind: 'movie',
    title: 'Corra',
    year: 2017,
    description:
      'A trama acompanha Chris (Daniel Kaluuya), um jovem negro que viaja ao interior para conhecer a família de sua namorada branca, Rose (Allison Williams). O que começa como uma visita desconfortável transforma-se em um pesadelo, revelando um sinistro esquema envolvendo identidade e controle. O filme combina horror e crítica social, explorando o racismo velado e o medo da objetificação do corpo negro.',
    categories: ['Terror psicológico', 'Mais Assistidos', 'Novidades'],
    total_views: 12400,
    age_rating: '16',
  },
  {
    id: 'movie-hereditario-2018',
    kind: 'movie',
    title: 'Hereditário',
    year: 2018,
    description:
      'Após a morte de Ellen, a matriarca da família Graham, sua filha Annie e os demais membros da família começam a desvendar segredos sombrios sobre seus antepassados. À medida que eventos perturbadores se intensificam, Annie percebe que forças malignas podem estar manipulando o destino familiar. A narrativa combina drama psicológico e terror ocultista, explorando a herança de traumas e a inevitabilidade do destino.',
    categories: ['Terror psicológico', 'Destaques', 'Mais Assistidos', 'Novidades'],
    total_views: 11600,
    age_rating: '18',
  },
  {
    id: 'movie-a-morte-do-demonio-1981',
    kind: 'movie',
    title: 'A Morte do Demônio',
    year: 1981,
    description:
      'Cinco jovens universitários viajam a uma cabana isolada em uma floresta do Tennessee. Lá, descobrem o Necronomicon Ex-Mortis — o Livro dos Mortos — e uma gravação de feitiços que, quando reproduzida, desperta forças demoníacas. Os espíritos passam a possuir os integrantes do grupo, desencadeando uma sequência crescente de horror e mutilações, restando a Ash lutar pela própria sobrevivência.',
    categories: ['Terror cult', 'Paranormal', 'Mais Assistidos'],
    total_views: 9300,
    age_rating: '18',
  },
  {
    id: 'movie-out-of-the-dark-2014',
    kind: 'movie',
    title: 'Out of the Dark',
    year: 2014,
    description:
      'Um casal e sua filha se mudam para a Colômbia para assumir a fábrica da família, apenas para descobrir que sua nova casa é assombrada.',
    categories: ['Paranormal', 'Novidades'],
    total_views: 3100,
    age_rating: '16',
  },
  {
    id: 'movie-panico-na-floresta-2004',
    kind: 'movie',
    title: 'Pânico na Floresta',
    year: 2004,
    description:
      'Após um acidente de carro, os envolvidos precisam de uma nova rota para chegarem ao seu destino. Indo pela floresta, eles se deparam com um terrível grupo de canibais.',
    categories: ['Slashers', 'Mais Assistidos'],
    total_views: 6700,
    age_rating: '18',
  },
  {
    id: 'movie-todo-mundo-em-panico-2000',
    kind: 'movie',
    title: 'Todo Mundo em Pânico',
    year: 2000,
    description:
      'Cindy Campbell e suas amigas acabam matando um homem por engano. Um ano após o infeliz incidente, alguém as persegue, deixa mensagens ameaçadoras e tenta assassiná-las uma a uma.',
    categories: ['Originais'],
    total_views: 8800,
    age_rating: '16',
  },
  ...MOVIE_HORROR_70,
];

/**
 * Converte entradas do catálogo em linhas da entidade `Series` (API local).
 */
export function buildSeriesRowsFromMovieCatalog() {
  return MOVIE_CATALOG.map((entry, i) => {
    const base = {
      id: entry.id,
      title: entry.title,
      description: entry.description,
      year: entry.year,
      age_rating: entry.age_rating || '16',
      featured: true,
      published: true,
      total_views: entry.total_views ?? 5000,
      cover_url: coverForCatalogEntry(entry, i),
      banner_url: bannerForCatalogEntry(entry, i),
      banner_object_position: '50% center',
      highlighted_home_section: '',
      categories: [...entry.categories],
      category: entry.categories.join(', '),
    };

    if (entry.kind === 'movie') {
      return {
        ...base,
        content_type: 'movie',
        movie_url: entry.movie_url || DEMO_VIDEO_MP4,
      };
    }

    return {
      ...base,
      content_type: 'series',
    };
  });
}

/** Episódios demo por minissérie (`kind: 'series'`) no catálogo — filmes usam só `movie_url`. */
export const MOVIE_CATALOG_EPISODES_PER_SERIES = 25;

/**
 * Episódios iniciais para entradas `kind: 'series'` do MOVIE_CATALOG (ex.: minissérie).
 */
export function buildEpisodesForMovieCatalogSeries() {
  const out = [];
  for (const entry of MOVIE_CATALOG) {
    if (entry.kind !== 'series') continue;
    for (let n = 1; n <= MOVIE_CATALOG_EPISODES_PER_SERIES; n += 1) {
      out.push({
        id: `ep-${entry.id}-${n}`,
        series_id: entry.id,
        title: `Episódio ${n}`,
        season: 1,
        number: n,
        description: '',
        video_url: DEMO_VIDEO_MP4,
        duration: 540 + ((n * 41) % 480),
        thumbnail_url: '',
      });
    }
  }
  return out;
}
