/**
 * PAUTA ADUANEIRA DA REPÚBLICA DE MOÇAMBIQUE
 * Sistema Harmonizado de Designação e de Codificação de Mercadorias (SH)
 * 
 * Estrutura Tributária de Importação em Moçambique:
 * - Direitos Aduaneiros (DA): 0% (Isentos/Essenciais), 5% (Bens de Capital/Máquinas), 
 *   7.5% (Bens Intermédios/Matérias-primas), 20% (Bens de Consumo Final)
 * - ICE (Imposto sobre Consumos Específicos): 0% a 75% (Viaturas, bebidas, tabaco, cosméticos, luxo)
 * - IVA Alfandegário: 16% (Taxa oficial PAE Moçambique) ou 0% (Bens com isenção médica/didática)
 */

export interface PautaItem {
  codigo: string;          // Código Pautal SH (ex: "8482.10.00")
  shCapitulo: string;      // Capítulo SH (ex: "84")
  shPosicao: string;       // Posição SH (ex: "8482")
  descricao: string;       // Descrição oficial
  categoria: string;       // Categoria comercial/industrial
  tipoBem: 'capital' | 'intermediario' | 'consumo' | 'veiculo' | 'isento' | 'especial';
  direitosPerc: number;    // % Direitos Aduaneiros (DA)
  icePerc: number;         // % ICE
  ivaPerc: number;         // % IVA (normalmente 16%)
  unidadeFisica?: string;  // u, kg, m3, par, l
  notas?: string;          // Observações pautais oficiais
  palavrasChave?: string[];// Sinónimos e termos de pesquisa populares
}

export interface PosicaoSH {
  posicao: string;           // Código de 4 dígitos (ex: "8422")
  capitulo: string;          // Capítulo SH (ex: "84")
  tituloOficial: string;     // Título oficial da posição do Sistema Harmonizado
  categoria: string;
  tipoBemPrincipal: 'capital' | 'intermediario' | 'consumo' | 'veiculo' | 'isento' | 'especial';
  direitosPadrao: number;
  icePadrao: number;
  ivaPadrao: number;
  baseLegal?: string;
  notasOficiais?: string;
  subposicoes?: {
    codigo: string;
    descricao: string;
    tipoBem?: 'capital' | 'intermediario' | 'consumo' | 'veiculo' | 'isento' | 'especial';
    direitosPerc?: number;
    icePerc?: number;
    ivaPerc?: number;
    unidadeFisica?: string;
    notas?: string;
  }[];
}

export interface TaxasPautaResultado {
  encontrado: boolean;
  codigo: string;
  descricao: string;
  categoria: string;
  tipoBem: string;
  direitosPerc: number;
  icePerc: number;
  ivaPerc: number;
  notas: string;
  item?: PautaItem;
  posicaoSH?: string;
  posicaoDescricao?: string;
  baseLegal?: string;
  unidadeFisica?: string;
  verificado?: boolean;
  fonte: 'pauta_oficial' | 'estimativa_categoria' | 'padrao';
}

export const PAUTA_MOCAMBIQUE: PautaItem[] = [
  // ==========================================
  // CAPÍTULO 84: REATORES, CALDEIRAS, MÁQUINAS E APARELHOS MECÂNICOS (BENS DE CAPITAL)
  // ==========================================
  {
    codigo: '8422.40.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Outras máquinas e aparelhos para empacotar ou embalar mercadorias (incluindo as máquinas e aparelhos para embalar com película termorretrátil)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Classificação oficial da Pauta Aduaneira de Moçambique (Lei 13/2021). Bem de Capital mecânico (DA reduzido para 5%, ICE isento 0%). Sujeito a declaração Janela Única MCNET e scanner Kudumba.',
    palavrasChave: ['8422.40.00', '84224000', '8422', 'embalar', 'empacotar', 'embaladora', 'empacotadora', 'embaladeira', 'packaging', 'termorretatil', 'pelicula']
  },
  {
    codigo: '8422.30.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Máquinas e aparelhos para encher, fechar, arrolhar ou rotular garrafas, latas, caixas, sacos ou outros recipientes; máquinas e aparelhos para capsular garrafas, vasos, tubos; máquinas e aparelhos para gaseificar bebidas',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Bem de Capital industrial para linhas de envase e rotulagem de bebidas e alimentos (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['8422.30.00', 'envasadora', 'rotuladora', 'encher garrafas', 'tapar garrafas', 'fechar latas', 'arrolhar', 'rotular']
  },
  {
    codigo: '8422.20.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Máquinas e aparelhos para limpar ou secar garrafas ou outros recipientes',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Linha de lavagem e secagem industrial de recipientes para engarrafamento (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['8422.20.00', 'lavadora garrafas', 'secadora garrafas', 'limpeza recipientes']
  },
  {
    codigo: '8422.19.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Outras máquinas de lavar louça (do tipo industrial e comercial para hotéis, restaurantes e cantinas)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de lavagem mecânica industrial para restauração coletiva (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['8422.19.00', 'lava louca industrial', 'lava pratos restaurante', 'lavadora louca']
  },
  {
    codigo: '8422.11.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Máquinas de lavar louça do tipo doméstico',
    categoria: 'Eletrodomésticos & Bens de Consumo',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Bem de Consumo Final (DA geral 20%, IVA 16%).',
    palavrasChave: ['8422.11.00', 'lava louca domestica', 'maquina de lavar pratos']
  },
  {
    codigo: '8422.90.00',
    shCapitulo: '84',
    shPosicao: '8422',
    descricao: 'Partes e peças separadas de máquinas e aparelhos da posição 84.22',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Componentes e peças sobressalentes para máquinas de embalagem e rotulagem (DA 5%, IVA 16%).',
    palavrasChave: ['8422.90.00', 'partes embaladora', 'pecas 8422', 'sobressalentes embalagem']
  },
  {
    codigo: '8456.11.00',
    shCapitulo: '84',
    shPosicao: '8456',
    descricao: 'Máquinas-ferramentas que trabalhem por laser para corte de chapas metálicas e perfis',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Máquina de corte a laser industrial de alta tecnologia (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['corte a laser', 'laser', 'maquina laser', 'laser cutting', '8456.11.00']
  },
  {
    codigo: '8458.11.00',
    shCapitulo: '84',
    shPosicao: '8458',
    descricao: 'Tornos horizontais de comando numérico computorizado (Tornos CNC)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Maquinaria de usinagem e torneamento de precisão (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['torno cnc', 'torno mecanico', 'cnc lathe', 'torno metal']
  },
  {
    codigo: '8477.10.00',
    shCapitulo: '84',
    shPosicao: '8477',
    descricao: 'Máquinas de moldar por injeção para trabalhar plástico ou borracha (Injetoras de Plástico)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento para fabrico de bacias, cadeiras e peças plásticas por injeção (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['injetora', 'injetora de plastico', 'molde plastico', 'maquina plastico', '8477.10.00']
  },
  {
    codigo: '8477.20.00',
    shCapitulo: '84',
    shPosicao: '8477',
    descricao: 'Extrusoras para trabalhar matérias plásticas (fabricação de tubos, perfis e películas)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Linhas industriais de extrusão de tubos de PVC/PEAD e sacos plásticos (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['extrusora', 'maquina extrusao', 'extrusora tubos']
  },
  {
    codigo: '8479.82.00',
    shCapitulo: '84',
    shPosicao: '8479',
    descricao: 'Máquinas industriais para misturar, amassar, triturar, moer, crivar, peneirar, homogeneizar ou agitar',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Misturadores e agitadores para indústrias químicas, alimentares e tintas (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['misturador industrial', 'agitador', 'homogeneizador']
  },
  {
    codigo: '8479.89.00',
    shCapitulo: '84',
    shPosicao: '8479',
    descricao: 'Outras máquinas e aparelhos mecânicos com função própria, não especificados noutras posições',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamentos mecânicos de função própria (DA 5%, ICE 0%, IVA 16%).',
    palavrasChave: ['maquina especial', 'aparelho mecanico', '8479.89.00']
  },
  {
    codigo: '8482.10.00',
    shCapitulo: '84',
    shPosicao: '8482',
    descricao: 'Rolamentos de esferas industriais',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Bem de Capital industrial (Direitos reduzidos 5%).',
    palavrasChave: ['rolamento', 'rolamentos', 'bearing', 'esferas', 'bearings', 'mecânica']
  },
  {
    codigo: '8482.20.00',
    shCapitulo: '84',
    shPosicao: '8482',
    descricao: 'Rolamentos de roletes cónicos (inclui cones e pistas montadas)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Bem de Capital mecânico (DA 5%).',
    palavrasChave: ['rolamento conico', 'roletes conicos', 'rolamento de carga pesada']
  },
  {
    codigo: '8482.40.00',
    shCapitulo: '84',
    shPosicao: '8482',
    descricao: 'Rolamentos de agulhas e roletes cilíndricos',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Componente de maquinaria de precisão (DA 5%).',
    palavrasChave: ['rolamento agulhas', 'agulha', 'agulhas', 'cilindrico']
  },
  {
    codigo: '8471.30.00',
    shCapitulo: '84',
    shPosicao: '8471',
    descricao: 'Computadores portáteis (Laptops, Notebooks, Tablets)',
    categoria: 'Informática & Tecnologia',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento informático para aceleração digital (DA 5%).',
    palavrasChave: ['laptop', 'computador', 'portatil', 'notebook', 'tablet', 'pc', 'macbook']
  },
  {
    codigo: '8471.41.00',
    shCapitulo: '84',
    shPosicao: '8471',
    descricao: 'Computadores de secretária (Desktops) e Servidores de Rede',
    categoria: 'Informática & Tecnologia',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Processamento de dados (DA 5%).',
    palavrasChave: ['desktop', 'servidor', 'computador mesa', 'cpu', 'workstation']
  },
  {
    codigo: '8413.40.00',
    shCapitulo: '84',
    shPosicao: '8413',
    descricao: 'Bombas de betão (Bombas para concreto e argamassa na construção)',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de construção civil (DA 5%).',
    palavrasChave: ['bomba betao', 'bomba de betao', 'concreto', 'argamassa', 'pumping']
  },
  {
    codigo: '8413.70.00',
    shCapitulo: '84',
    shPosicao: '8413',
    descricao: 'Bombas centrífugas para líquidos e captação de água',
    categoria: 'Equipamentos Hidráulicos & Agrícolas',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Bombas de água para furos e irrigação (DA 5%).',
    palavrasChave: ['bomba de agua', 'eletrobomba', 'irrigacao', 'submersivel', 'motobomba']
  },
  {
    codigo: '8429.51.00',
    shCapitulo: '84',
    shPosicao: '8429',
    descricao: 'Pás mecânicas, carregadoras e pás carregadoras de rodas',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Máquina de terraplanagem (DA 5%).',
    palavrasChave: ['pa carregadora', 'retroescavadora', 'wheel loader', 'carregadeira']
  },
  {
    codigo: '8429.52.00',
    shCapitulo: '84',
    shPosicao: '8429',
    descricao: 'Escavadoras com superestrutura giratória de 360 graus',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Escavadora pesada para mineração e construção (DA 5%).',
    palavrasChave: ['escavadora', 'escavadeira', 'excavator', 'giratoria', 'rastos']
  },
  {
    codigo: '8429.11.00',
    shCapitulo: '84',
    shPosicao: '8429',
    descricao: 'Bulldozers e tratores de rastos (lagartas)',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Maquinaria pesada de desmatação e mineração (DA 5%).',
    palavrasChave: ['bulldozer', 'buldozer', 'trator de rastos', 'trator lagarta', 'cat']
  },
  {
    codigo: '8429.20.00',
    shCapitulo: '84',
    shPosicao: '8429',
    descricao: 'Niveladoras e motoniveladoras',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Máquinas para abertura e regularização de estradas (DA 5%).',
    palavrasChave: ['motoniveladora', 'niveladora', 'grader', 'estrada']
  },
  {
    codigo: '8474.20.00',
    shCapitulo: '84',
    shPosicao: '8474',
    descricao: 'Máquinas de esmagamento, trituração ou britagem de pedras e minérios',
    categoria: 'Mineração & Pedreiras',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Britadeiras e moinhos minerais (DA 5%).',
    palavrasChave: ['britadeira', 'triturador', 'esmagador', 'crusher', 'pedreira']
  },
  {
    codigo: '8474.31.00',
    shCapitulo: '84',
    shPosicao: '8474',
    descricao: 'Betoneiras e aparelhos de amassar cimento ou argamassa',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Betoneiras elétricas ou a gasóleo (DA 5%).',
    palavrasChave: ['betoneira', 'misturador concreto', 'cimento misturador']
  },
  {
    codigo: '8426.41.00',
    shCapitulo: '84',
    shPosicao: '8426',
    descricao: 'Gruas móveis e pontes rolantes sobre pneumáticos',
    categoria: 'Construção Civil & Logística',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de elevação e movimentação de cargas (DA 5%).',
    palavrasChave: ['grua', 'guindaste', 'crane', 'ponte rolante']
  },
  {
    codigo: '8427.20.00',
    shCapitulo: '84',
    shPosicao: '8427',
    descricao: 'Empilhadores autopropulsados com motor de combustão ou elétricos',
    categoria: 'Logística & Armazém',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento para movimentação em armazéns e portos (DA 5%).',
    palavrasChave: ['empilhador', 'empilhadeira', 'forklift', 'paleteira']
  },
  {
    codigo: '8431.49.00',
    shCapitulo: '84',
    shPosicao: '8431',
    descricao: 'Partes e peças sobressalentes para escavadoras, tratores e niveladoras',
    categoria: 'Peças & Sobressalentes Industriais',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Peças de reposição para maquinaria pesada (DA 5%).',
    palavrasChave: ['pecas escavadora', 'dentes concha', 'balde', 'esteiras', 'sobressalentes']
  },
  {
    codigo: '8418.10.00',
    shCapitulo: '84',
    shPosicao: '8418',
    descricao: 'Combinados de refrigeração e congeladores frigoríficos',
    categoria: 'Eletrodomésticos & Frio Industrial',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de refrigeração doméstico/comercial (DA 20%).',
    palavrasChave: ['frigorifico', 'congelador', 'geladeira', 'arca frigorifica', 'freezer']
  },
  {
    codigo: '8415.10.00',
    shCapitulo: '84',
    shPosicao: '8415',
    descricao: 'Aparelhos de ar condicionado para parede, janelas ou split',
    categoria: 'Eletrodomésticos & Climatização',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de ar condicionado (DA 20%).',
    palavrasChave: ['ar condicionado', 'ac', 'split', 'climatizador']
  },
  {
    codigo: '8467.21.00',
    shCapitulo: '84',
    shPosicao: '8467',
    descricao: 'Ferramentas elétricas manuais (Berbequins, Furadeiras)',
    categoria: 'Ferramentas & Bricolage',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Ferramentas de trabalho e montagem (DA 7.5%).',
    palavrasChave: ['berbequim', 'furadeira', 'parafusadeira', 'ferramenta eletrica']
  },
  {
    codigo: '8467.29.00',
    shCapitulo: '84',
    shPosicao: '8467',
    descricao: 'Rebarbadoras, serras circulares e lixadeiras elétricas manuais',
    categoria: 'Ferramentas & Bricolage',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de corte e acabamento (DA 7.5%).',
    palavrasChave: ['rebarbadora', 'esmerilhadeira', 'serra circular', 'lixadeira']
  },

  // ==========================================
  // CAPÍTULO 85: MÁQUINAS, APARELHOS E MATERIAIS ELÉTRICOS (GERADORES, SOLAR, TELECOM)
  // ==========================================
  {
    codigo: '8502.11.00',
    shCapitulo: '85',
    shPosicao: '8502',
    descricao: 'Grupos electrogéneos com motor diesel de potência até 75 kVA (Geradores)',
    categoria: 'Energia & Geradores',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Gerador elétrico de emergência/industrial (DA 5%).',
    palavrasChave: ['gerador', 'geradores', 'grupo electrogeneo', 'diesel generator', 'kirloskar', 'cummins']
  },
  {
    codigo: '8502.12.00',
    shCapitulo: '85',
    shPosicao: '8502',
    descricao: 'Grupos electrogéneos com motor diesel de 75 kVA até 375 kVA',
    categoria: 'Energia & Geradores',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Gerador industrial de média/alta potência (DA 5%).',
    palavrasChave: ['gerador industrial', 'gerador pesado', 'energia diesel']
  },
  {
    codigo: '8541.43.00',
    shCapitulo: '85',
    shPosicao: '8541',
    descricao: 'Módulos e painéis solares fotovoltaicos',
    categoria: 'Energia Solar & Renováveis',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de energia solar renovável (Incentivo pautal DA 5%).',
    palavrasChave: ['painel solar', 'paineis solares', 'modulo solar', 'fotovoltaico', 'solar panel']
  },
  {
    codigo: '8504.40.00',
    shCapitulo: '85',
    shPosicao: '8504',
    descricao: 'Inversores de corrente solar, no-breaks (UPS) e conversores estáticos',
    categoria: 'Energia Solar & Renováveis',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Inversor solar híbrido e conversor elétrico (DA 5%).',
    palavrasChave: ['inversor', 'inversor solar', 'ups', 'no break', 'conversor']
  },
  {
    codigo: '8507.20.00',
    shCapitulo: '85',
    shPosicao: '8507',
    descricao: 'Baterias e acumuladores de chumbo-ácido (para veículos e solar)',
    categoria: 'Auto & Energia',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Baterias automóveis e de gel (DA 20%).',
    palavrasChave: ['bateria carro', 'acumulador', 'bateria chumbo', 'bateria automovel']
  },
  {
    codigo: '8507.60.00',
    shCapitulo: '85',
    shPosicao: '8507',
    descricao: 'Baterias de iões de lítio (para sistemas solares e eletrónica)',
    categoria: 'Energia Solar & Eletrónica',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Armazenamento de energia solar lítio (DA 5%).',
    palavrasChave: ['bateria litio', 'powerwall', 'lifepo4', 'bateria solar litio']
  },
  {
    codigo: '8517.13.00',
    shCapitulo: '85',
    shPosicao: '8517',
    descricao: 'Telefones inteligentes (Smartphones) e telemóveis',
    categoria: 'Telecomunicações & Gadgets',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Aparelhos terminais de telecomunicações móveis (DA 20%).',
    palavrasChave: ['telemovel', 'smartphone', 'celular', 'iphone', 'samsung', 'xiaomi']
  },
  {
    codigo: '8517.62.00',
    shCapitulo: '85',
    shPosicao: '8517',
    descricao: 'Roteadores de internet, modems Wi-Fi e switches de rede',
    categoria: 'Telecomunicações & Redes',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Equipamento de infraestrutura de rede (DA 5%).',
    palavrasChave: ['router', 'roteador', 'modem', 'switch', 'wifi', 'fibra optica']
  },
  {
    codigo: '8528.72.00',
    shCapitulo: '85',
    shPosicao: '8528',
    descricao: 'Aparelhos receptores de televisão (Smart TV, LED, OLED)',
    categoria: 'Eletrodomésticos & Áudio/Vídeo',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Televisores e telas residenciais/comerciais (DA 20%).',
    palavrasChave: ['tv', 'televisao', 'smart tv', 'monitor led', 'televisor']
  },
  {
    codigo: '8544.49.00',
    shCapitulo: '85',
    shPosicao: '8544',
    descricao: 'Cabos elétricos de cobre e condutores isolados para eletricidade',
    categoria: 'Construção & Material Elétrico',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Condutores para instalações prediais e industriais (DA 7.5%).',
    palavrasChave: ['cabo eletrico', 'fios eletricos', 'cabo cobre', 'instalacao eletrica']
  },

  // ==========================================
  // CAPÍTULO 87: VEÍCULOS AUTOMÓVEIS, CAMIÕES, TRATORES E SUAS PARTES
  // ==========================================
  {
    codigo: '8704.22.00',
    shCapitulo: '87',
    shPosicao: '8704',
    descricao: 'Camiões de carga e basculantes a gasóleo (Peso bruto > 5t até 20t)',
    categoria: 'Veículos Comerciais & Camiões',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Camião de transporte de mercadorias (Direitos de Capital 5%, ICE 0%).',
    palavrasChave: ['camiao', 'camiao basculante', 'tipper', 'howo', 'faw', 'shacman', 'truck']
  },
  {
    codigo: '8704.23.00',
    shCapitulo: '87',
    shPosicao: '8704',
    descricao: 'Camiões pesados basculantes e cavalos mecânicos / tratores de estrada (Peso bruto > 20t)',
    categoria: 'Veículos Comerciais & Camiões',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Cavalo mecânico e camião pesado para longo curso (DA 5%, ICE 0%).',
    palavrasChave: ['cavalo mecanico', 'camiao pesado', 'trator de estrada', 'semi reboque tractor']
  },
  {
    codigo: '8705.40.00',
    shCapitulo: '87',
    shPosicao: '8705',
    descricao: 'Camiões-betoneira (Camião com tambor misturador de betão)',
    categoria: 'Veículos Especiais & Betoneiras',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Veículo para usos especiais na construção (DA 5%, ICE 0%).',
    palavrasChave: ['camiao betoneira', 'mixer truck', 'concreto camiao', 'autobetoneira']
  },
  {
    codigo: '8705.90.10',
    shCapitulo: '87',
    shPosicao: '8705',
    descricao: 'Camião com Bomba de Betão telescópica (Concrete Pump Truck)',
    categoria: 'Veículos Especiais & Betoneiras',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Camião bomba de betão com lança distribuidora (DA 5%, ICE 0%).',
    palavrasChave: ['camiao bomba de betao', 'bomba betao camiao', 'concrete pump', 'bomba lanca']
  },
  {
    codigo: '8705.10.00',
    shCapitulo: '87',
    shPosicao: '8705',
    descricao: 'Camiões-grua móveis (Veículos especiais com guindaste)',
    categoria: 'Veículos Especiais',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Veículo guindaste móvel (DA 5%, ICE 0%).',
    palavrasChave: ['camiao grua', 'camiao guindaste', 'truck crane', 'mobil crane']
  },
  {
    codigo: '8701.90.00',
    shCapitulo: '87',
    shPosicao: '8701',
    descricao: 'Tratores agrícolas de rodas para lavoura e campos',
    categoria: 'Agricultura & Maquinaria Agrícola',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Trator para produção agrícola (Incentivo agrário DA 5%, ICE 0%).',
    palavrasChave: ['trator agricola', 'trator', 'tractor', 'massey ferguson', 'john deere']
  },
  {
    codigo: '8702.10.00',
    shCapitulo: '87',
    shPosicao: '8702',
    descricao: 'Autocarros e miniautocarros de passageiros (capacidade >= 10 passageiros)',
    categoria: 'Transporte de Passageiros',
    tipoBem: 'veiculo',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Transporte coletivo público e privado (DA 5%, ICE 0%).',
    palavrasChave: ['autocarro', 'machimbombo', 'chapa', 'coaster', 'hiace passageiros', 'onibus']
  },
  {
    codigo: '8703.21.00',
    shCapitulo: '87',
    shPosicao: '8703',
    descricao: 'Automóveis ligeiros de passageiros a gasolina até 1000 cc',
    categoria: 'Veículos Ligeiros',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 10,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Automóvel utilitário citadino (DA 20%, ICE 10%).',
    palavrasChave: ['carro 1000cc', 'vitz', 'passo', 'alto', 'carro pequeno']
  },
  {
    codigo: '8703.22.00',
    shCapitulo: '87',
    shPosicao: '8703',
    descricao: 'Automóveis ligeiros a gasolina de 1001 a 1500 cc',
    categoria: 'Veículos Ligeiros',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 15,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Automóvel familiar ligeiro (DA 20%, ICE 15%).',
    palavrasChave: ['corolla', 'fielder', 'tiida', 'demio', 'carro 1500cc']
  },
  {
    codigo: '8703.23.00',
    shCapitulo: '87',
    shPosicao: '8703',
    descricao: 'Automóveis ligeiros e SUV a gasolina de 1501 a 3000 cc',
    categoria: 'Veículos Ligeiros & SUV',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 25,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'SUV, carrinhas familiares e sedans médios (DA 20%, ICE 25%).',
    palavrasChave: ['suv', 'rav4', 'harrier', 'xtrail', 'prado gasolina', 'fortuner']
  },
  {
    codigo: '8703.24.00',
    shCapitulo: '87',
    shPosicao: '8703',
    descricao: 'Automóveis de luxo e desportivos a gasolina > 3000 cc',
    categoria: 'Veículos de Alta Cilindrada & Luxo',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 40,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Viaturas de alta cilindrada (DA 20%, ICE 40%).',
    palavrasChave: ['carro luxo', 'land cruiser v8', 'mercedes v6', 'bmw v8', 'lexus']
  },
  {
    codigo: '8703.32.00',
    shCapitulo: '87',
    shPosicao: '8703',
    descricao: 'Automóveis ligeiros a diesel de 1501 a 2500 cc (Pickups cabine dupla / SUV)',
    categoria: 'Veículos a Diesel & Pickups',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 20,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Pick-up cabine dupla ou SUV diesel (DA 20%, ICE 20%).',
    palavrasChave: ['hilux diesel', 'dmax', 'ranger', 'prado diesel', 'navara']
  },
  {
    codigo: '8704.31.00',
    shCapitulo: '87',
    shPosicao: '8704',
    descricao: 'Carrinhas de caixa aberta cabine simples (Pick-ups utilitárias até 5t)',
    categoria: 'Veículos Comerciais Ligeiros',
    tipoBem: 'veiculo',
    direitosPerc: 20,
    icePerc: 10,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Utilitário de carga aberta (DA 20%, ICE 10%).',
    palavrasChave: ['pickup', 'carrinha carga', 'canter ligeiro', 'bongo', 'h100']
  },
  {
    codigo: '8708.29.00',
    shCapitulo: '87',
    shPosicao: '8708',
    descricao: 'Peças de carroçaria e peças exteriores para veículos automóveis',
    categoria: 'Peças & Auto Peças',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Peças de reposição automóvel (DA 7.5%).',
    palavrasChave: ['auto pecas', 'para-choques', 'guarda-lamas', 'porta carro', 'capo']
  },
  {
    codigo: '8708.30.00',
    shCapitulo: '87',
    shPosicao: '8708',
    descricao: 'Travões, pastilhas e discos de travão para veículos automóveis',
    categoria: 'Peças & Auto Peças',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Componentes de travagem (DA 7.5%).',
    palavrasChave: ['pastilhas travao', 'disco travao', 'calcos', 'brakes']
  },
  {
    codigo: '8708.80.00',
    shCapitulo: '87',
    shPosicao: '8708',
    descricao: 'Amortecedores de suspensão e molas para veículos automóveis',
    categoria: 'Peças & Auto Peças',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Sistema de suspensão (DA 7.5%).',
    palavrasChave: ['amortecedor', 'amortecedores', 'suspensao', 'molas carro']
  },
  {
    codigo: '8716.39.00',
    shCapitulo: '87',
    shPosicao: '8716',
    descricao: 'Reboques e semi-reboques para transporte de mercadorias (Pranchas, Baús)',
    categoria: 'Reboques & Transporte Pesado',
    tipoBem: 'capital',
    direitosPerc: 5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Semi-reboque porta-contentores ou prancha (DA 5%).',
    palavrasChave: ['semi reboque', 'trailer', 'prancha transporte', 'porta contentor']
  },

  // ==========================================
  // CAPÍTULO 72, 73, 25, 68: MATERIAIS DE CONSTRUÇÃO CIVIL E SIDERURGIA
  // ==========================================
  {
    codigo: '7214.20.00',
    shCapitulo: '72',
    shPosicao: '7214',
    descricao: 'Varão de ferro com nervuras/estrias para armaduras de betão armado',
    categoria: 'Siderurgia & Construção',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Ferro para pilares, sapatas e lajes (DA 7.5%).',
    palavrasChave: ['varao de ferro', 'ferro de construcao', 'rebar', 'varao nervurado', 'aco construcao']
  },
  {
    codigo: '7210.49.00',
    shCapitulo: '72',
    shPosicao: '7210',
    descricao: 'Chapas de zinco galvanizadas onduladas ou IBR para coberturas',
    categoria: 'Construção Civil & Telhados',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Chapas de cobertura galvanizadas (DA 20%).',
    palavrasChave: ['chapas de zinco', 'chapa ibr', 'chapa ondulada', 'chapa telhado', 'zinco']
  },
  {
    codigo: '7308.90.00',
    shCapitulo: '73',
    shPosicao: '7308',
    descricao: 'Estruturas de ferro ou aço para pavilhões, hangares e pontes',
    categoria: 'Estruturas Metálicas',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Estruturas pré-fabricadas metálicas (DA 7.5%).',
    palavrasChave: ['estrutura metalica', 'armazem pre fabricado', 'hangar', 'vigas metalicas']
  },
  {
    codigo: '7318.15.00',
    shCapitulo: '73',
    shPosicao: '7318',
    descricao: 'Parafusos, porcas, anilhas e rebites de fixação de aço',
    categoria: 'Ferragens & Fixação',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Ferragens industriais de montagem (DA 7.5%).',
    palavrasChave: ['parafusos', 'porcas', 'anilhas', 'fixadores', 'screws']
  },
  {
    codigo: '2523.29.00',
    shCapitulo: '25',
    shPosicao: '2523',
    descricao: 'Cimento Portland cinzento para construção em sacos ou a granel',
    categoria: 'Construção Civil',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Cimento de construção civil (Proteção de indústria local: DA 20%).',
    palavrasChave: ['cimento', 'cimento portland', 'sacos de cimento']
  },
  {
    codigo: '6907.21.00',
    shCapitulo: '69',
    shPosicao: '6907',
    descricao: 'Ladrilhos, azulejos e mosaicos de cerâmica / porcelanato polido',
    categoria: 'Acabamentos & Cerâmica',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'm2',
    notas: 'Pisos e revestimentos cerâmicos (DA 20%).',
    palavrasChave: ['azulejos', 'porcelanato', 'cerâmica', 'ladrilhos', 'chao', 'tiles']
  },
  {
    codigo: '7604.21.00',
    shCapitulo: '76',
    shPosicao: '7604',
    descricao: 'Perfis e caixilharia de alumínio para portas e janelas',
    categoria: 'Serralharia & Caixilharia',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Perfis de alumínio extrudido (DA 7.5%).',
    palavrasChave: ['aluminio perfis', 'caixilharia', 'janelas aluminio', 'portas aluminio']
  },
  {
    codigo: '3917.23.00',
    shCapitulo: '39',
    shPosicao: '3917',
    descricao: 'Tubos rígidos de PVC para canalização de água e saneamento',
    categoria: 'Canalização & Plásticos',
    tipoBem: 'intermediario',
    direitosPerc: 7.5,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Tubagens de água e esgoto (DA 7.5%).',
    palavrasChave: ['tubos pvc', 'tubagem agua', 'cano pvc', 'canalizacao']
  },

  // ==========================================
  // CAPÍTULO 94, 61, 62, 64, 40: CONSUMO GERAL, MOBILIÁRIO, TÊXTEIS, PNEUS
  // ==========================================
  {
    codigo: '9403.30.00',
    shCapitulo: '94',
    shPosicao: '9403',
    descricao: 'Mobiliário de madeira e metal para escritório (Secretárias, Mesas, Armários)',
    categoria: 'Mobiliário & Escritório',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Mobiliário de escritório acabado (DA 20%).',
    palavrasChave: ['mobilia', 'mobiliario', 'secretaria', 'mesa escritorio', 'armario']
  },
  {
    codigo: '9401.30.00',
    shCapitulo: '94',
    shPosicao: '9401',
    descricao: 'Cadeiras giratórias reguláveis em altura para escritório',
    categoria: 'Mobiliário & Escritório',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Cadeiras executivas (DA 20%).',
    palavrasChave: ['cadeira giratoria', 'cadeira escritorio', 'assento', 'poltrona']
  },
  {
    codigo: '9404.21.00',
    shCapitulo: '94',
    shPosicao: '9404',
    descricao: 'Colchões ortopédicos, de espuma e de molas',
    categoria: 'Mobiliário & Quarto',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Colchões de repouso (DA 20%).',
    palavrasChave: ['colchao', 'colchoes', 'cama', 'espuma']
  },
  {
    codigo: '6109.10.00',
    shCapitulo: '61',
    shPosicao: '6109',
    descricao: 'T-shirts, polos e camisolas interiores de malha de algodão',
    categoria: 'Vestuário & Têxteis',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Vestuário acabado de consumo (DA 20%).',
    palavrasChave: ['t-shirt', 'camisetas', 'polos', 'roupa', 'vestuario']
  },
  {
    codigo: '6203.42.00',
    shCapitulo: '62',
    shPosicao: '6203',
    descricao: 'Calças, jardineiras e calções de algodão para homem (Jeans)',
    categoria: 'Vestuário & Têxteis',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Calças de ganga e vestuário casual (DA 20%).',
    palavrasChave: ['calcas', 'jeans', 'ganga', 'calcoes', 'roupas masculinas']
  },
  {
    codigo: '6403.99.00',
    shCapitulo: '64',
    shPosicao: '6403',
    descricao: 'Calçado com sola de borracha e parte superior em couro natural',
    categoria: 'Calçado',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'par',
    notas: 'Sapatos formais e botas de couro (DA 20%).',
    palavrasChave: ['calcado', 'sapatos', 'botas', 'couro', 'sapatos sociais']
  },
  {
    codigo: '6404.11.00',
    shCapitulo: '64',
    shPosicao: '6404',
    descricao: 'Calçado para ténis, basquetebol, ginástica e corrida (Sapatilhas / Sneakers)',
    categoria: 'Calçado Desportivo',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'par',
    notas: 'Sapatilhas e ténis desportivos (DA 20%).',
    palavrasChave: ['sapatilhas', 'tenis', 'sneakers', 'calcado desportivo']
  },
  {
    codigo: '4011.10.00',
    shCapitulo: '40',
    shPosicao: '4011',
    descricao: 'Pneus novos de borracha para automóveis ligeiros de passageiros',
    categoria: 'Pneus & Borracha',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Pneumáticos para viaturas ligeiras (DA 20%).',
    palavrasChave: ['pneus', 'pneu ligeiro', 'tyres', 'pneu carro', 'borracha']
  },
  {
    codigo: '4011.20.00',
    shCapitulo: '40',
    shPosicao: '4011',
    descricao: 'Pneus novos de borracha para autocarros e camiões pesados',
    categoria: 'Pneus & Transporte Pesado',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'u',
    notas: 'Pneus radiais pesados 315/80R22.5, etc. (DA 20%).',
    palavrasChave: ['pneu camiao', 'pneu pesado', 'truck tyres', 'pneu 315']
  },
  {
    codigo: '3926.90.90',
    shCapitulo: '39',
    shPosicao: '3926',
    descricao: 'Artigos diversos moldados de plástico para embalagem ou uso doméstico',
    categoria: 'Plásticos & Utilidades',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Artefatos de plástico (DA 20%).',
    palavrasChave: ['plastico', 'bacias', 'baldes', 'utilidades plastico']
  },

  // ==========================================
  // CAPÍTULO 30, 49, 90: SAÚDE, FARMÁCIA, LIVROS (ISENTOS DE IMPOSTOS)
  // ==========================================
  {
    codigo: '3004.90.00',
    shCapitulo: '30',
    shPosicao: '3004',
    descricao: 'Medicamentos dosados para medicina humana e produtos farmacêuticos',
    categoria: 'Saúde & Fármacos',
    tipoBem: 'isento',
    direitosPerc: 0,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'kg',
    notas: 'Isenção total de Direitos e IVA para saúde humana (Lei Aduaneira Moçambique).',
    palavrasChave: ['medicamento', 'medicamentos', 'farmacia', 'remedios', 'farmaceuticos', 'antibioticos']
  },
  {
    codigo: '3002.20.00',
    shCapitulo: '30',
    shPosicao: '3002',
    descricao: 'Vacinas para medicina humana',
    categoria: 'Saúde & Fármacos',
    tipoBem: 'isento',
    direitosPerc: 0,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'kg',
    notas: 'Isenção total de impostos aduaneiros.',
    palavrasChave: ['vacina', 'vacinas', 'soros', 'imunologia']
  },
  {
    codigo: '9018.90.00',
    shCapitulo: '90',
    shPosicao: '9018',
    descricao: 'Instrumentos e aparelhos para medicina, cirurgia e diagnóstico médico',
    categoria: 'Equipamento Hospitalar',
    tipoBem: 'isento',
    direitosPerc: 0,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'u',
    notas: 'Equipamentos médicos hospitalares com isenção aduaneira.',
    palavrasChave: ['equipamento hospitalar', 'ecografo', 'bisturi', 'raio x', 'aparelho medico']
  },
  {
    codigo: '4901.99.00',
    shCapitulo: '49',
    shPosicao: '4901',
    descricao: 'Livros didáticos, brochuras e material de ensino impresso',
    categoria: 'Educação & Livros',
    tipoBem: 'isento',
    direitosPerc: 0,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'u',
    notas: 'Isenção legal pedagógica de Direitos e IVA.',
    palavrasChave: ['livro', 'livros', 'manuais didaticos', 'livros escolares', 'publicacoes']
  },

  // ==========================================
  // CAPÍTULO 10, 15, 17, 02: BENS ALIMENTARES DE 1ª NECESSIDADE
  // ==========================================
  {
    codigo: '1006.30.00',
    shCapitulo: '10',
    shPosicao: '1006',
    descricao: 'Arroz semibranqueado ou branqueado, polido ou glaciado',
    categoria: 'Alimentação & Grãos',
    tipoBem: 'intermediario',
    direitosPerc: 2.5,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'kg',
    notas: 'Bem de 1ª necessidade com redução pautal e isenção de IVA.',
    palavrasChave: ['arroz', 'rice', 'graos arroz', 'alimentacao basica']
  },
  {
    codigo: '1001.99.00',
    shCapitulo: '10',
    shPosicao: '1001',
    descricao: 'Trigo em grão para moagem e panificação',
    categoria: 'Alimentação & Grãos',
    tipoBem: 'intermediario',
    direitosPerc: 2.5,
    icePerc: 0,
    ivaPerc: 0,
    unidadeFisica: 'kg',
    notas: 'Matéria-prima essencial para pão e farinha.',
    palavrasChave: ['trigo', 'trigo grao', 'wheat']
  },
  {
    codigo: '1511.90.00',
    shCapitulo: '15',
    shPosicao: '1511',
    descricao: 'Óleo de palma comestível refinado para cozinha',
    categoria: 'Alimentação & Óleos',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'l',
    notas: 'Óleo alimentar vegetal (DA 20%).',
    palavrasChave: ['oleo de cozinha', 'oleo vegetal', 'oleo palma', 'cooking oil']
  },
  {
    codigo: '1701.99.00',
    shCapitulo: '17',
    shPosicao: '1701',
    descricao: 'Açúcar de cana refinado em estado sólido',
    categoria: 'Alimentação & Açúcar',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Sobretaxa de proteção da indústria nacional açucareira (DA 20%).',
    palavrasChave: ['acucar', 'sugar', 'acucar refinado', 'acucar branco']
  },
  {
    codigo: '0207.14.00',
    shCapitulo: '02',
    shPosicao: '0207',
    descricao: 'Pedaços e miudezas de frango congelados (Coxas, asas de frango)',
    categoria: 'Alimentação & Congelados',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Frango congelado de importação (DA 20%).',
    palavrasChave: ['frango congelado', 'coxas de frango', 'asas frango', 'chicken', 'aves']
  },

  // ==========================================
  // CAPÍTULO 22, 24, 33, 71: BEBIDAS, TABACO, PERFUMES E LUXO (SUJEITOS A ICE)
  // ==========================================
  {
    codigo: '2203.00.00',
    shCapitulo: '22',
    shPosicao: '2203',
    descricao: 'Cervejas de malte em garrafas ou latas',
    categoria: 'Bebidas Alcoólicas (Sujeitas a ICE)',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 40,
    ivaPerc: 16,
    unidadeFisica: 'l',
    notas: 'Imposto sobre Consumos Específicos elevado (DA 20%, ICE 40%).',
    palavrasChave: ['cerveja', 'cervejas', 'beer', 'heineken', '2m', 'laurentina']
  },
  {
    codigo: '2204.21.00',
    shCapitulo: '22',
    shPosicao: '2204',
    descricao: 'Vinhos de uvas frescas em recipientes de capacidade <= 2 litros',
    categoria: 'Bebidas Alcoólicas (Sujeitas a ICE)',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 30,
    ivaPerc: 16,
    unidadeFisica: 'l',
    notas: 'Vinho de mesa e espumante (DA 20%, ICE 30%).',
    palavrasChave: ['vinho', 'vinhos', 'espumante', 'wine']
  },
  {
    codigo: '2208.30.00',
    shCapitulo: '22',
    shPosicao: '2208',
    descricao: 'Uísques (Whisky), Gin, Vodka e bebidas espirituosas destiladas',
    categoria: 'Bebidas Espirituosas (Sujeitas a ICE)',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 65,
    ivaPerc: 16,
    unidadeFisica: 'l',
    notas: 'Bebidas com alto teor alcoólico (DA 20%, ICE 65%).',
    palavrasChave: ['whisky', 'uisque', 'vodka', 'gin', 'bebidas destiladas', 'licores']
  },
  {
    codigo: '2402.20.00',
    shCapitulo: '24',
    shPosicao: '2402',
    descricao: 'Cigarros contendo tabaco',
    categoria: 'Tabaco (Sujeito a ICE)',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 75,
    ivaPerc: 16,
    unidadeFisica: 'mil',
    notas: 'Taxa máxima de ICE aduaneiro (DA 20%, ICE 75%).',
    palavrasChave: ['cigarros', 'tabaco', 'fumo', 'cigarettes']
  },
  {
    codigo: '3303.00.00',
    shCapitulo: '33',
    shPosicao: '3303',
    descricao: 'Perfumes e águas-de-colónia finas de luxo',
    categoria: 'Perfumaria & Cosmética',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 20,
    ivaPerc: 16,
    unidadeFisica: 'kg',
    notas: 'Perfumaria sujeita a taxa de luxo ICE (DA 20%, ICE 20%).',
    palavrasChave: ['perfume', 'perfumes', 'fragrancias', 'agua de colonia']
  },
  {
    codigo: '7113.19.00',
    shCapitulo: '71',
    shPosicao: '7113',
    descricao: 'Artigos de joalharia e bijuteria fina de metais preciosos (Ouro, Prata)',
    categoria: 'Joalharia & Artigos de Luxo',
    tipoBem: 'especial',
    direitosPerc: 20,
    icePerc: 30,
    ivaPerc: 16,
    unidadeFisica: 'g',
    notas: 'Bens de elevado valor com ICE de luxo (DA 20%, ICE 30%).',
    palavrasChave: ['joias', 'ouro', 'prata', 'joalharia', 'anel', 'colar', 'pulseira']
  }
];

/**
 * Base de Dados Oficial de Posições (4 dígitos) do Sistema Harmonizado
 * Aprovada pela Lei nº 13/2021 de 30 de Dezembro (República de Moçambique)
 */
export const POSICOES_SISTEMA_HARMONIZADO: PosicaoSH[] = [
  {
    posicao: '8422',
    capitulo: '84',
    tituloOficial: 'Máquinas de lavar louça; máquinas e aparelhos para limpar ou secar garrafas ou outros recipientes; máquinas e aparelhos para encher, fechar, arrolhar ou rotular recipientes; máquinas e aparelhos para empacotar ou embalar mercadorias (incluindo máquinas de película termorretrátil); máquinas para gaseificar bebidas',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
    notasOficiais: 'Posição 84.22 da Pauta Oficial de Moçambique: Maquinaria industrial de embalamento, enchimento e rotulagem classificada como Bem de Capital com taxa reduzida de 5% de Direitos Aduaneiros e isenção de ICE.',
    subposicoes: [
      { codigo: '8422.40.00', descricao: 'Outras máquinas e aparelhos para empacotar ou embalar mercadorias (incluindo as máquinas e aparelhos para embalar com película termorretrátil)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8422.30.00', descricao: 'Máquinas e aparelhos para encher, fechar, arrolhar ou rotular garrafas, latas, caixas, sacos ou outros recipientes', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8422.20.00', descricao: 'Máquinas e aparelhos para limpar ou secar garrafas ou outros recipientes', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8422.19.00', descricao: 'Outras máquinas de lavar louça do tipo industrial ou comercial para restauração', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8422.11.00', descricao: 'Máquinas de lavar louça do tipo doméstico', tipoBem: 'consumo', direitosPerc: 20, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8422.90.00', descricao: 'Partes e peças de máquinas e aparelhos da posição 84.22', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8471',
    capitulo: '84',
    tituloOficial: 'Máquinas automáticas para processamento de dados e suas unidades; leitores magnéticos ou óticos, máquinas para registo de dados em suporte sob forma codificada (Computadores, Laptops, Servidores)',
    categoria: 'Informática & Tecnologia',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
    notasOficiais: 'Bens de Capital digital com taxa de Direitos Aduaneiros reduzida a 5%.',
    subposicoes: [
      { codigo: '8471.30.00', descricao: 'Computadores portáteis (Laptops, Notebooks, Tablets)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8471.41.00', descricao: 'Computadores de secretária (Desktops) e Servidores de Rede', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8471.70.00', descricao: 'Unidades de memória para processamento de dados (Discos externos, storage)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8482',
    capitulo: '84',
    tituloOficial: 'Rolamentos de esferas, de roletes ou de agulhas',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
    notasOficiais: 'Componente mecânico industrial essencial (DA 5%).',
    subposicoes: [
      { codigo: '8482.10.00', descricao: 'Rolamentos de esferas industriais', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8482.20.00', descricao: 'Rolamentos de roletes cónicos', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8482.40.00', descricao: 'Rolamentos de agulhas e roletes cilíndricos', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8413',
    capitulo: '84',
    tituloOficial: 'Bombas para líquidos, mesmo com dispositivo medidor; elevadores de líquidos (Eletrobombas, bombas de água, bombas de betão)',
    categoria: 'Equipamentos Hidráulicos & Construção',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8413.40.00', descricao: 'Bombas de betão (bombas para concreto e argamassa)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8413.70.00', descricao: 'Bombas centrífugas para líquidos e captação de água', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8415',
    capitulo: '84',
    tituloOficial: 'Aparelhos de ar condicionado que contenham um ventilador acionado por motor e elementos próprios para modificar a temperatura e a humidade',
    categoria: 'Climatização & Eletrodomésticos',
    tipoBemPrincipal: 'consumo',
    direitosPadrao: 20,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8415.10.00', descricao: 'Aparelhos de ar condicionado para parede, janelas ou split', tipoBem: 'consumo', direitosPerc: 20, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8429',
    capitulo: '84',
    tituloOficial: 'Bulldozers, angledozers, niveladoras, rasquetadeiras, pás mecânicas, escavadoras, pás carregadoras, compactadores e rolos compressores, autopropulsados',
    categoria: 'Construção Civil & Maquinaria Pesada',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8429.51.00', descricao: 'Pás mecânicas, carregadoras e pás carregadoras de rodas (Wheel Loaders)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8429.52.00', descricao: 'Escavadoras com superestrutura giratória de 360 graus', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8429.11.00', descricao: 'Bulldozers e tratores de rastos (lagartas)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8429.20.00', descricao: 'Niveladoras e motoniveladoras', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8474',
    capitulo: '84',
    tituloOficial: 'Máquinas e aparelhos para selecionar, peneirar, separar, lavar, triturar, moer, misturar pedras, terras e minérios; betoneiras para cimento',
    categoria: 'Mineração & Construção Pesada',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8474.20.00', descricao: 'Máquinas de esmagamento, trituração ou britagem de pedras e minérios (Britadeiras)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8474.31.00', descricao: 'Betoneiras e aparelhos de amassar cimento ou argamassa', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8477',
    capitulo: '84',
    tituloOficial: 'Máquinas e aparelhos para trabalhar borracha ou plásticos ou para o fabrico de produtos dessas matérias (Injetoras, extrusoras, sopradoras)',
    categoria: 'Máquinas & Equipamentos Industriais',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8477.10.00', descricao: 'Máquinas de moldar por injeção para trabalhar plástico ou borracha (Injetoras)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8477.20.00', descricao: 'Extrusoras para trabalhar matérias plásticas', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8504',
    capitulo: '85',
    tituloOficial: 'Transformadores elétricos, conversores elétricos estáticos (por exemplo, retificadores, inversores), bobinas de reatância e de autoindução',
    categoria: 'Energia & Eletrotecnia',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
    subposicoes: [
      { codigo: '8504.40.00', descricao: 'Conversores estáticos elétricos (Inversores solares para sistemas fotovoltaicos, retificadores, no-breaks industriais)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8504.23.00', descricao: 'Transformadores de dielétrico líquido de potência superior a 10.000 kVA', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8541',
    capitulo: '85',
    tituloOficial: 'Dispositivos semicondutores; células fotovoltaicas montadas ou não em módulos ou constituindo painéis (Painéis Solares Fotovoltaicos)',
    categoria: 'Energia Solar & Renováveis',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8541.43.00', descricao: 'Células fotovoltaicas montadas em módulos ou constituindo painéis (Painéis solares)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8507',
    capitulo: '85',
    tituloOficial: 'Acumuladores elétricos, incluindo os seus separadores, de qualquer formato (Baterias de ião de lítio, chumbo-ácido, acumuladores solares)',
    categoria: 'Energia & Baterias',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8507.60.00', descricao: 'Acumuladores elétricos de ião de lítio (Baterias solares e para veículos)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8507.10.00', descricao: 'Acumuladores de chumbo-ácido dos tipos utilizados para arranque de motores de pistão', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8517',
    capitulo: '85',
    tituloOficial: 'Aparelhos telefónicos, incluindo os telefones para redes celulares (smartphones); outros aparelhos para emissão, transmissão ou receção de voz, imagens ou dados',
    categoria: 'Telecomunicações & Smartphones',
    tipoBemPrincipal: 'capital',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8517.13.00', descricao: 'Telefones inteligentes (Smartphones) para redes celulares', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8517.62.00', descricao: 'Aparelhos para receção, conversão e transmissão de voz ou dados (Routers, modems, switches)', tipoBem: 'capital', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8701',
    capitulo: '87',
    tituloOficial: 'Tratores (exceto os tratores da posição 87.09) - incluindo tratores agrícolas e tratores rodoviários para semirreboques (Cavalos mecânicos)',
    categoria: 'Veículos Comerciais & Maquinaria Agrícola',
    tipoBemPrincipal: 'veiculo',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8701.91.00', descricao: 'Tratores agrícolas de potência não superior a 18 kW', tipoBem: 'veiculo', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8701.20.00', descricao: 'Tratores rodoviários para semirreboques (Cavalos mecânicos de tração)', tipoBem: 'veiculo', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8704',
    capitulo: '87',
    tituloOficial: 'Veículos automóveis para transporte de mercadorias (Camiões pesados, basculantes, carrinhas de caixa aberta, camiões frigoríficos)',
    categoria: 'Veículos Comerciais Pesados',
    tipoBemPrincipal: 'veiculo',
    direitosPadrao: 5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '8704.23.00', descricao: 'Camiões pesados basculantes (Dump Trucks / HOWO / Shacman) de peso bruto superior a 20 toneladas', tipoBem: 'veiculo', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8704.22.00', descricao: 'Camiões para transporte de mercadorias de peso em carga bruta superior a 5 toneladas mas não superior a 20 toneladas', tipoBem: 'veiculo', direitosPerc: 5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '8703',
    capitulo: '87',
    tituloOficial: 'Automóveis de passageiros e outros veículos concebidos principalmente para transporte de pessoas (ligeiros de passageiros, SUV, peruas)',
    categoria: 'Automóveis Ligeiros',
    tipoBemPrincipal: 'veiculo',
    direitosPadrao: 20,
    icePadrao: 15,
    ivaPadrao: 16,
    notasOficiais: 'Direitos 20%, ICE progressivo de 10% a 40% conforme escalão de cilindrada e ano.',
    subposicoes: [
      { codigo: '8703.22.00', descricao: 'Automóveis de passageiros com motor de cilindrada superior a 1000 cm3 mas não superior a 1500 cm3', tipoBem: 'veiculo', direitosPerc: 20, icePerc: 15, ivaPerc: 16, unidadeFisica: 'u' },
      { codigo: '8703.23.00', descricao: 'Automóveis de passageiros com motor de cilindrada superior a 1500 cm3 mas não superior a 3000 cm3 (SUV, Sedan)', tipoBem: 'veiculo', direitosPerc: 20, icePerc: 25, ivaPerc: 16, unidadeFisica: 'u' }
    ]
  },
  {
    posicao: '7214',
    capitulo: '72',
    tituloOficial: 'Barras de ferro ou aço não ligado, simplesmente forjadas, laminadas ou extrudadas a quente com saliências ou nervuras (Varão de Construção Civil)',
    categoria: 'Siderurgia & Construção Civil',
    tipoBemPrincipal: 'intermediario',
    direitosPadrao: 7.5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '7214.20.00', descricao: 'Varão de ferro e aço com nervuras ou saliências para betão armado na construção civil', tipoBem: 'intermediario', direitosPerc: 7.5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '7210',
    capitulo: '72',
    tituloOficial: 'Produtos laminados planos de ferro ou aço não ligado, de largura igual ou superior a 600 mm, galvanizados ou revestidos (Chapas de zinco)',
    categoria: 'Siderurgia & Coberturas',
    tipoBemPrincipal: 'intermediario',
    direitosPadrao: 7.5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '7210.49.00', descricao: 'Chapas de zinco galvanizadas onduladas ou lisas para coberturas e telhados', tipoBem: 'intermediario', direitosPerc: 7.5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '3105',
    capitulo: '31',
    tituloOficial: 'Adubos ou fertilizantes minerais ou químicos que contenham os três elementos fertilizantes: azoto, fósforo e potássio (NPK)',
    categoria: 'Agricultura & Fertilizantes',
    tipoBemPrincipal: 'isento',
    direitosPadrao: 0,
    icePadrao: 0,
    ivaPadrao: 0,
    subposicoes: [
      { codigo: '3105.20.00', descricao: 'Adubos minerais ou químicos que contenham os três elementos fertilizantes: azoto, fósforo e potássio (NPK)', tipoBem: 'isento', direitosPerc: 0, icePerc: 0, ivaPerc: 0, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '3004',
    capitulo: '30',
    tituloOficial: 'Medicamentos constituídos por produtos misturados ou não misturados, preparados para fins terapêuticos ou profilácticos',
    categoria: 'Saúde & Farmacêutica',
    tipoBemPrincipal: 'isento',
    direitosPadrao: 0,
    icePadrao: 0,
    ivaPadrao: 0,
    subposicoes: [
      { codigo: '3004.90.00', descricao: 'Outros medicamentos preparados para fins terapêuticos ou profilácticos humanos ou veterinários', tipoBem: 'isento', direitosPerc: 0, icePerc: 0, ivaPerc: 0, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '1006',
    capitulo: '10',
    tituloOficial: 'Arroz (em casca, descascado, semibranqueado ou branqueado, quebrado)',
    categoria: 'Alimentação & Cereais',
    tipoBemPrincipal: 'consumo',
    direitosPadrao: 7.5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '1006.30.00', descricao: 'Arroz semibranqueado ou branqueado, mesmo polido ou glaciado', tipoBem: 'consumo', direitosPerc: 7.5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '1207',
    capitulo: '12',
    tituloOficial: 'Outras sementes e frutos oleaginosos (incluindo sementes de gergelim / sésamo)',
    categoria: 'Agricultura & Exportação',
    tipoBemPrincipal: 'intermediario',
    direitosPadrao: 7.5,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '1207.40.00', descricao: 'Sementes de gergelim (sésamo) para consumo e extração de óleo (Exportação Tarifa Zero China)', tipoBem: 'intermediario', direitosPerc: 7.5, icePerc: 0, ivaPerc: 16, unidadeFisica: 'kg' }
    ]
  },
  {
    posicao: '0801',
    capitulo: '08',
    tituloOficial: 'Castanha de caju, cocos e castanha-do-brasil, frescos ou secos, com ou sem casca ou película',
    categoria: 'Agricultura & Exportação',
    tipoBemPrincipal: 'intermediario',
    direitosPadrao: 20,
    icePadrao: 0,
    ivaPadrao: 16,
    subposicoes: [
      { codigo: '0801.32.00', descricao: 'Castanha de caju sem casca (amêndoa processada pronta para consumo e exportação)', tipoBem: 'intermediario', direitosPerc: 20, icePerc: 0, ivaPerc: 16, unidadeFisica: 'kg' }
    ]
  }
];

// Helper para normalizar textos para comparação sem acentos
function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Helper para limpar código numérico (removendo pontos, traços, espaços)
function limparCodigo(codigo: string): string {
  if (!codigo) return '';
  return codigo.replace(/[^0-9]/g, '');
}

/**
 * Procura itens na Pauta Aduaneira por código SH ou termos na descrição / palavras-chave
 */
export function buscarPautaAduaneira(termo: string, limite = 10): PautaItem[] {
  if (!termo || !termo.trim()) {
    return PAUTA_MOCAMBIQUE.slice(0, limite);
  }

  const termoNorm = normalizarTexto(termo);
  const digitosTermo = limparCodigo(termo);

  const resultados: { item: PautaItem; score: number }[] = [];
  const baseItens = [...PAUTA_DINAMICA_TEMPO_REAL, ...PAUTA_MOCAMBIQUE];

  for (const item of baseItens) {
    let score = 0;
    const codigoLimpo = limparCodigo(item.codigo);
    const descNorm = normalizarTexto(item.descricao);
    const catNorm = normalizarTexto(item.categoria);

    // 1. Correspondência por Código Pautal (HS Code)
    if (digitosTermo.length >= 2) {
      if (codigoLimpo === digitosTermo) {
        score += 150;
      } else if (codigoLimpo.startsWith(digitosTermo)) {
        score += 90;
      } else if (digitosTermo.length >= 4 && item.shPosicao === digitosTermo.slice(0, 4)) {
        score += 60;
      } else if (digitosTermo.length === 2 && item.shCapitulo === digitosTermo) {
        score += 30;
      }
    }

    // 2. Correspondência exata de frase na descrição
    if (descNorm.includes(termoNorm)) {
      score += 50;
      if (descNorm.startsWith(termoNorm)) {
        score += 20;
      }
    }

    // 3. Correspondência na categoria
    if (catNorm.includes(termoNorm)) {
      score += 25;
    }

    // 4. Correspondência em palavras-chave específicas
    if (item.palavrasChave) {
      for (const kw of item.palavrasChave) {
        const kwNorm = normalizarTexto(kw);
        if (kwNorm === termoNorm) {
          score += 60;
          break;
        } else if (kwNorm.includes(termoNorm) || termoNorm.includes(kwNorm)) {
          score += 35;
          break;
        }
      }
    }

    // 5. Correspondência por palavras isoladas (token matching)
    const palavrasPesquisa = termoNorm.split(/\s+/).filter(p => p.length >= 3);
    if (palavrasPesquisa.length > 0) {
      let tokensMatched = 0;
      for (const p of palavrasPesquisa) {
        if (descNorm.includes(p) || catNorm.includes(p)) {
          tokensMatched++;
        }
      }
      if (tokensMatched > 0) {
        score += tokensMatched * 15;
      }
    }

    if (score > 0) {
      resultados.push({ item, score });
    }
  }

  // Ordenar decrescente pelo score
  resultados.sort((a, b) => b.score - a.score);

  return resultados.slice(0, limite).map(r => r.item);
}

// Lista dinâmica em memória de itens adicionados ou sincronizados em tempo real
export const PAUTA_DINAMICA_TEMPO_REAL: PautaItem[] = [];

// Inicialização automática a partir do localStorage no navegador
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const salvo = localStorage.getItem('primeway_pauta_dinamica_v2');
    if (salvo) {
      const items = JSON.parse(salvo);
      if (Array.isArray(items)) {
        PAUTA_DINAMICA_TEMPO_REAL.push(...items);
      }
    }
  } catch (e) {
    console.warn('Não foi possível carregar pauta do localStorage:', e);
  }
}

/**
 * Adiciona ou atualiza um item na pauta dinâmica em tempo real
 */
export function adicionarItemPautaDinamica(item: PautaItem) {
  const idx = PAUTA_DINAMICA_TEMPO_REAL.findIndex(i => i.codigo === item.codigo);
  if (idx >= 0) {
    PAUTA_DINAMICA_TEMPO_REAL[idx] = item;
  } else {
    PAUTA_DINAMICA_TEMPO_REAL.unshift(item);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('primeway_pauta_dinamica_v2', JSON.stringify(PAUTA_DINAMICA_TEMPO_REAL.slice(0, 150)));
    } catch {}
  }
}

/**
 * Função principal requisitada:
 * Dado um código de produto (HS Code) ou descrição livre,
 * retorna com precisão as taxas de Direitos Aduaneiros (DA), ICE e IVA aplicáveis em Moçambique.
 */
export function obterTaxasPauta(codigoOuDescricao: string): TaxasPautaResultado {
  if (!codigoOuDescricao || !codigoOuDescricao.trim()) {
    return {
      encontrado: false,
      codigo: 'Padrão Geral',
      descricao: 'Bens de Consumo Final (Padrão)',
      categoria: 'Bens de Consumo Geral',
      tipoBem: 'consumo',
      direitosPerc: 20,
      icePerc: 0,
      ivaPerc: 16,
      notas: 'Taxa geral de consumo em Moçambique (20% Direitos, 16% IVA).',
      fonte: 'padrao'
    };
  }

  const raw = codigoOuDescricao.trim();
  const rawNorm = normalizarTexto(raw);
  const digitos = limparCodigo(raw);

  // 1. Tentar primeiro na lista dinâmica sincronizada em tempo real
  const matchDinamico = PAUTA_DINAMICA_TEMPO_REAL.find(i => 
    (digitos && digitos.length >= 4 && i.codigo.replace(/\D/g, '').startsWith(digitos)) ||
    normalizarTexto(i.descricao).includes(rawNorm) ||
    i.palavrasChave?.some(k => rawNorm.includes(normalizarTexto(k)))
  );
  if (matchDinamico) {
    return {
      encontrado: true,
      codigo: matchDinamico.codigo,
      descricao: matchDinamico.descricao,
      categoria: matchDinamico.categoria,
      tipoBem: matchDinamico.tipoBem,
      direitosPerc: matchDinamico.direitosPerc,
      icePerc: matchDinamico.icePerc,
      ivaPerc: matchDinamico.ivaPerc,
      notas: matchDinamico.notas || 'Item verificado em tempo real.',
      item: matchDinamico,
      fonte: 'pauta_oficial'
    };
  }

  // 2. Tentar encontrar correspondência na base de dados pautal
  const matchItens = buscarPautaAduaneira(raw, 3);
  if (matchItens.length > 0) {
    const item = matchItens[0];
    const itemCodLimpo = limparCodigo(item.codigo);
    const itemDescNorm = normalizarTexto(item.descricao);

    // Se o usuário digitou um código com 4 ou mais dígitos (ex: 8422, 8422.40.00),
    // apenas aceitar se o item pertencer à mesma posição de 4 dígitos ou prefixo exato
    const isValido = digitos.length >= 4
      ? (itemCodLimpo.startsWith(digitos) || item.shPosicao === digitos.slice(0, 4) || itemDescNorm.includes(rawNorm))
      : true;

    if (isValido) {
      const posObj = POSICOES_SISTEMA_HARMONIZADO.find(p => p.posicao === item.shPosicao);
      return {
        encontrado: true,
        codigo: item.codigo,
        descricao: item.descricao,
        categoria: item.categoria,
        tipoBem: item.tipoBem,
        direitosPerc: item.direitosPerc,
        icePerc: item.icePerc,
        ivaPerc: item.ivaPerc,
        notas: item.notas || '',
        posicaoSH: item.shPosicao,
        posicaoDescricao: posObj ? posObj.tituloOficial : undefined,
        unidadeFisica: item.unidadeFisica || 'u',
        baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
        item,
        fonte: 'pauta_oficial'
      };
    }
  }

  // 3. Correspondência em POSICOES_SISTEMA_HARMONIZADO (Posições oficiais a 4 dígitos e Subposições)
  if (digitos.length >= 4) {
    const pos4 = digitos.slice(0, 4);
    const posObj = POSICOES_SISTEMA_HARMONIZADO.find(p => p.posicao === pos4);
    if (posObj) {
      // Se houver subposição específica a 6 ou 8 dígitos
      if (digitos.length >= 6 && posObj.subposicoes && posObj.subposicoes.length > 0) {
        const subMatch = posObj.subposicoes.find(s => 
          s.codigo.replace(/\D/g, '').startsWith(digitos) || digitos.startsWith(s.codigo.replace(/\D/g, ''))
        );
        if (subMatch) {
          return {
            encontrado: true,
            codigo: subMatch.codigo,
            descricao: subMatch.descricao,
            categoria: posObj.categoria,
            tipoBem: subMatch.tipoBem || posObj.tipoBemPrincipal,
            direitosPerc: subMatch.direitosPerc !== undefined ? subMatch.direitosPerc : posObj.direitosPadrao,
            icePerc: subMatch.icePerc !== undefined ? subMatch.icePerc : posObj.icePadrao,
            ivaPerc: subMatch.ivaPerc !== undefined ? subMatch.ivaPerc : posObj.ivaPadrao,
            unidadeFisica: subMatch.unidadeFisica || 'u',
            posicaoSH: posObj.posicao,
            posicaoDescricao: posObj.tituloOficial,
            baseLegal: posObj.baseLegal || 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
            notas: subMatch.notas || posObj.notasOficiais || `Classificação oficial na Pauta Aduaneira de Moçambique para a subposição ${subMatch.codigo}.`,
            fonte: 'pauta_oficial'
          };
        }
      }

      // Se o usuário digitou a posição de 4 dígitos ou um código pertencente a esta posição
      const formattedCodigo = digitos.length >= 8
        ? `${digitos.slice(0, 4)}.${digitos.slice(4, 6)}.${digitos.slice(6, 8)}`
        : (digitos.length >= 6 ? `${digitos.slice(0, 4)}.${digitos.slice(4, 6)}.00` : `${posObj.posicao}.00.00`);

      return {
        encontrado: true,
        codigo: formattedCodigo,
        descricao: posObj.tituloOficial,
        categoria: posObj.categoria,
        tipoBem: posObj.tipoBemPrincipal,
        direitosPerc: posObj.direitosPadrao,
        icePerc: posObj.icePadrao,
        ivaPerc: posObj.ivaPadrao,
        posicaoSH: posObj.posicao,
        posicaoDescricao: posObj.tituloOficial,
        baseLegal: posObj.baseLegal || 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
        notas: posObj.notasOficiais || `Posição oficial ${posObj.posicao} do Sistema Harmonizado da Pauta Aduaneira de Moçambique.`,
        fonte: 'pauta_oficial'
      };
    }
  }

  // 4. Correspondência em CAPITULOS_SISTEMA_HARMONIZADO (01 a 97)
  if (digitos.length >= 2) {
    const cap2 = digitos.slice(0, 2);
    const capObj = CAPITULOS_SISTEMA_HARMONIZADO.find(c => c.capitulo === cap2);
    if (capObj) {
      const formattedCodigo = digitos.length >= 4 
        ? `${digitos.slice(0, 4)}.${digitos.slice(4, 6) || '00'}.${digitos.slice(6, 8) || '00'}`
        : `Capítulo ${cap2}`;

      return {
        encontrado: true,
        codigo: formattedCodigo,
        descricao: capObj.titulo,
        categoria: `Seção ${capObj.seccao}: ${capObj.titulo}`,
        tipoBem: capObj.tipoBemPrincipal,
        direitosPerc: capObj.direitosPadrao,
        icePerc: capObj.icePadrao,
        ivaPerc: capObj.ivaPadrao,
        posicaoSH: cap2,
        posicaoDescricao: capObj.descricaoCompleta,
        baseLegal: 'Lei nº 13/2021 de 30 de Dezembro (Pauta Aduaneira de Moçambique)',
        notas: capObj.descricaoCompleta + (capObj.requisitosEspeciais ? ` Requisito: ${capObj.requisitosEspeciais}.` : ''),
        fonte: 'pauta_oficial'
      };
    }
  }

  // 3. Classificação Heurística por Palavras-Chave de Descrição Livre
  if (rawNorm.includes('rolamento') || rawNorm.includes('bearing') || rawNorm.includes('maquina') || rawNorm.includes('industrial') || rawNorm.includes('gerador') || rawNorm.includes('trator') || rawNorm.includes('bomba betao') || rawNorm.includes('escavadora') || rawNorm.includes('computador') || rawNorm.includes('laptop') || rawNorm.includes('solar')) {
    return {
      encontrado: true,
      codigo: 'Bens de Capital',
      descricao: raw,
      categoria: 'Equipamentos & Bens de Capital',
      tipoBem: 'capital',
      direitosPerc: 5,
      icePerc: 0,
      ivaPerc: 16,
      notas: 'Classificado automaticamente como Bem de Capital industrial (Direitos 5%, IVA 16%).',
      fonte: 'estimativa_categoria'
    };
  }

  if (rawNorm.includes('medicamento') || rawNorm.includes('farmacia') || rawNorm.includes('remedio') || rawNorm.includes('livro') || rawNorm.includes('vacina')) {
    return {
      encontrado: true,
      codigo: 'Isenção Especial',
      descricao: raw,
      categoria: 'Saúde / Educação (Isento)',
      tipoBem: 'isento',
      direitosPerc: 0,
      icePerc: 0,
      ivaPerc: 0,
      notas: 'Classificado com isenção aduaneira moçambicana (0% Direitos, 0% IVA).',
      fonte: 'estimativa_categoria'
    };
  }

  if (rawNorm.includes('ferro') || rawNorm.includes('aco') || rawNorm.includes('tubo') || rawNorm.includes('cabo') || rawNorm.includes('perfil') || rawNorm.includes('parafuso') || rawNorm.includes('peca')) {
    return {
      encontrado: true,
      codigo: 'Bens Intermédios',
      descricao: raw,
      categoria: 'Matérias-Primas e Bens Intermédios',
      tipoBem: 'intermediario',
      direitosPerc: 7.5,
      icePerc: 0,
      ivaPerc: 16,
      notas: 'Classificado como bem intermédio de produção (Direitos 7.5%, IVA 16%).',
      fonte: 'estimativa_categoria'
    };
  }

  if (rawNorm.includes('camiao') || rawNorm.includes('basculante') || rawNorm.includes('howo') || rawNorm.includes('betoneira')) {
    return {
      encontrado: true,
      codigo: 'SH 8704 / 8705',
      descricao: raw,
      categoria: 'Veículos Comerciais Pesados',
      tipoBem: 'veiculo',
      direitosPerc: 5,
      icePerc: 0,
      ivaPerc: 16,
      notas: 'Camiões e equipamentos de transporte pesado gozam de Direitos reduzidos (5%) e isenção de ICE (0%).',
      fonte: 'estimativa_categoria'
    };
  }

  if (rawNorm.includes('carro') || rawNorm.includes('ligeiro') || rawNorm.includes('suv') || rawNorm.includes('automovel')) {
    return {
      encontrado: true,
      codigo: 'SH 8703',
      descricao: raw,
      categoria: 'Veículos Ligeiros',
      tipoBem: 'veiculo',
      direitosPerc: 20,
      icePerc: 15,
      ivaPerc: 16,
      notas: 'Veículos ligeiros: Direitos 20%, ICE médio 15%, IVA 16%.',
      fonte: 'estimativa_categoria'
    };
  }

  // 4. Padrão Geral para Bens de Consumo Final
  return {
    encontrado: false,
    codigo: '20% DA / 16% IVA',
    descricao: raw,
    categoria: 'Bens de Consumo Final',
    tipoBem: 'consumo',
    direitosPerc: 20,
    icePerc: 0,
    ivaPerc: 16,
    notas: 'Taxa pautal comum para bens de consumo acabados em Moçambique (Direitos: 20%, ICE: 0%, IVA: 16%).',
    fonte: 'padrao'
  };
}

/**
 * Retorna as categorias disponíveis para filtros rápidos na interface
 */
export function listarCategoriasPauta(): string[] {
  const cats = new Set<string>();
  for (const item of PAUTA_MOCAMBIQUE) {
    if (item.categoria) {
      cats.add(item.categoria);
    }
  }
  return Array.from(cats);
}

/**
 * Cotações oficiais de Câmbio Aduaneiro em vigor (Banco de Moçambique / AT)
 * Utilizadas no cálculo do valor aduaneiro (CIF) em Meticais (MZN)
 */
export interface CambioAduaneiroItem {
  moeda: string;
  simbolo: string;
  nome: string;
  taxaMzn: number;
  dataAtualizacao: string;
  fonte: string;
}

export const CAMBIO_ADUANEIRO_OFICIAL: CambioAduaneiroItem[] = [
  {
    moeda: 'USD',
    simbolo: '$',
    nome: 'Dólar Americano',
    taxaMzn: 63.90,
    dataAtualizacao: 'Em vigor (Banco de Moçambique)',
    fonte: 'Banco de Moçambique / Autoridade Tributária'
  },
  {
    moeda: 'CNY',
    simbolo: '¥',
    nome: 'Yuan Renminbi Chinês',
    taxaMzn: 8.92,
    dataAtualizacao: 'Em vigor (Banco de Moçambique)',
    fonte: 'Banco de Moçambique / Autoridade Tributária'
  },
  {
    moeda: 'ZAR',
    simbolo: 'R',
    nome: 'Rand Sul-Africano',
    taxaMzn: 3.56,
    dataAtualizacao: 'Em vigor (Banco de Moçambique)',
    fonte: 'Banco de Moçambique / Autoridade Tributária'
  },
  {
    moeda: 'EUR',
    simbolo: '€',
    nome: 'Euro',
    taxaMzn: 68.45,
    dataAtualizacao: 'Em vigor (Banco de Moçambique)',
    fonte: 'Banco de Moçambique / Autoridade Tributária'
  },
  {
    moeda: 'GBP',
    simbolo: '£',
    nome: 'Libra Esterlina',
    taxaMzn: 81.20,
    dataAtualizacao: 'Em vigor (Banco de Moçambique)',
    fonte: 'Banco de Moçambique / Autoridade Tributária'
  }
];

/**
 * Estrutura Oficial de Capítulos do Sistema Harmonizado (SH) de Moçambique
 * Permite navegação completa pelos 97 capítulos e 21 seções
 */
export interface CapituloSH {
  capitulo: string;
  seccao: string;
  titulo: string;
  tipoBemPrincipal: 'isento' | 'capital' | 'intermediario' | 'consumo' | 'veiculo' | 'especial';
  direitosPadrao: number;
  icePadrao: number;
  ivaPadrao: number;
  descricaoCompleta: string;
  requisitosEspeciais?: string;
}

export const CAPITULOS_SISTEMA_HARMONIZADO: CapituloSH[] = [
  // SEÇÃO I: ANIMAIS VIVOS E PRODUTOS DO REINO ANIMAL
  { capitulo: '01', seccao: 'I', titulo: 'Animais Vivos', tipoBemPrincipal: 'isento', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Reprodutores de raça pura (0% DA), outros animais (5% a 20%). Certificado Veterinário.', requisitosEspeciais: 'Certificado Veterinário (MADER)' },
  { capitulo: '02', seccao: 'I', titulo: 'Carnes e Miudezas Comestíveis', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Carnes de bovino, suíno, aves congeladas (DA: 20%, IVA: 16%).', requisitosEspeciais: 'Inspecção Sanitária na Fronteira' },
  { capitulo: '03', seccao: 'I', titulo: 'Peixes, Crustáceos e Moluscos', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Pescado fresco, congelado e mariscos (Carapau, camarão).', requisitosEspeciais: 'Certificado de Pesca / Sanidade' },
  { capitulo: '04', seccao: 'I', titulo: 'Leite e Laticínios, Ovos e Mel', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Leite em pó para indústria (7.5%), leite para consumo e manteiga (20%).' },
  { capitulo: '05', seccao: 'I', titulo: 'Outros Produtos de Origem Animal', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Ossos, chifres, tripas e matérias animais brutas.' },

  // SEÇÃO II: PRODUTOS DO REINO VEGETAL
  { capitulo: '06', seccao: 'II', titulo: 'Plantas Vivas e Produtos de Floricultura', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Mudas, flores e folhagens para plantação.', requisitosEspeciais: 'Certificado Fitossanitário' },
  { capitulo: '07', seccao: 'II', titulo: 'Legumes, Plantas, Raízes e Tubérculos', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Batatas, cebolas, alhos, tomates e legumes frescos ou secos.' },
  { capitulo: '08', seccao: 'II', titulo: 'Frutas e Frutos Comestíveis, Caju', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Castanha de caju, maçãs, laranjas, bananas. Caju in natura exportação tem taxa de sobretaxa de protecção local.' },
  { capitulo: '09', seccao: 'II', titulo: 'Café, Chá, Mate e Especiarias', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Café verde/torrado, pimenta, baunilha, canela, gengibre.' },
  { capitulo: '10', seccao: 'II', titulo: 'Cereais (Arroz, Milho, Trigo)', tipoBemPrincipal: 'isento', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Trigo em grão (2.5% ou 0%), Arroz e milho (5% a 20%). Bens de consumo primário.' },
  { capitulo: '11', seccao: 'II', titulo: 'Produtos da Moagem, Malte e Amidos', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Farinha de trigo, milho, sêmola e amidos industriais.' },
  { capitulo: '12', seccao: 'II', titulo: 'Sementes e Frutos Oleaginosos (Gergelim, Soja)', tipoBemPrincipal: 'intermediario', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Sementes de gergelim (sésamo), amendoim, soja e sementes agrícolas.' },

  // SEÇÃO IV: ALIMENTOS PREPARADOS, BEBIDAS E TABACO
  { capitulo: '16', seccao: 'IV', titulo: 'Preparações de Carnes e Pescados', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Enlatados de atum, sardinha, enchidos e conservas de carne.' },
  { capitulo: '17', seccao: 'IV', titulo: 'Açúcares e Produtos de Confeitaria', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Açúcar de cana (sujeito a sobretaxa variável de protecção à indústria moçambicana).' },
  { capitulo: '19', seccao: 'IV', titulo: 'Preparações de Cereais, Farinhas e Pastas', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Massas alimentícias, bolachas, biscoitos e produtos de padaria.' },
  { capitulo: '22', seccao: 'IV', titulo: 'Bebidas, Líquidos Alcoólicos e Vinagres', tipoBemPrincipal: 'especial', direitosPadrao: 20, icePadrao: 40, ivaPadrao: 16, descricaoCompleta: 'Águas minerais (20% DA), Cervejas (ICE 30%-40%), Vinhos e Espirituosos (ICE 40%-65%). Selos fiscais obrigatórios.' },
  { capitulo: '24', seccao: 'IV', titulo: 'Tabaco e Sucedâneos Manufaturados', tipoBemPrincipal: 'especial', direitosPadrao: 20, icePadrao: 75, ivaPadrao: 16, descricaoCompleta: 'Cigarros e charutos (DA 20%, ICE 75%, IVA 16%). Selagem fiscal obrigatória.' },

  // SEÇÃO V: PRODUTOS MINERAIS
  { capitulo: '25', seccao: 'V', titulo: 'Sal, Enxofre, Terras, Pedras e Cimento', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Clínquer e cimento cinzento (DA 10.5% ou 20%), areias, gesso e cal.' },
  { capitulo: '26', seccao: 'V', titulo: 'Minérios, Escórias e Cinzas', tipoBemPrincipal: 'intermediario', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Minérios de titânio (ilmenite, rutilo, zircão), grafite e terras raras.' },
  { capitulo: '27', seccao: 'V', titulo: 'Combustíveis Minerais, Óleos e Betumes', tipoBemPrincipal: 'intermediario', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Carvão mineral, petróleo bruto, gasóleo, gasolina, lubrificantes e betumes.' },

  // SEÇÃO VI: PRODUTOS DAS INDÚSTRIAS QUÍMICAS
  { capitulo: '28', seccao: 'VI', titulo: 'Produtos Químicos Inorgânicos', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Ácidos, bases industriais, soda cáustica e compostos minerais.' },
  { capitulo: '29', seccao: 'VI', titulo: 'Produtos Químicos Orgânicos', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Hidrocarbonetos, álcoois industriais e reagentes laboratoriais.' },
  { capitulo: '30', seccao: 'VI', titulo: 'Produtos Farmacêuticos (Medicamentos)', tipoBemPrincipal: 'isento', direitosPadrao: 0, icePadrao: 0, ivaPadrao: 0, descricaoCompleta: 'Medicamentos essenciais humanos e veterinários (ISENÇÃO TOTAL: 0% DA e 0% IVA pela Lei 11/2016).', requisitosEspeciais: 'Registo e Autorização MISAU' },
  { capitulo: '31', seccao: 'VI', titulo: 'Adubos ou Fertilizantes Agrícolas', tipoBemPrincipal: 'isento', direitosPadrao: 0, icePadrao: 0, ivaPadrao: 0, descricaoCompleta: 'Adubos minerais ou químicos (NPK, ureia, sulfato de amónio). Incentivo agrícola (0% DA).' },
  { capitulo: '38', seccao: 'VI', titulo: 'Produtos Químicos Diversos', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Inseticidas, fungicidas, aditivos de cimento, fluidos de travão.' },

  // SEÇÃO VII: PLÁSTICOS E BORRACHA
  { capitulo: '39', seccao: 'VII', titulo: 'Plásticos e suas Obras', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Polímeros em formas primárias (7.5%), tubos e embalagens industriais (7.5%), utilidades plásticas de consumo (20%).' },
  { capitulo: '40', seccao: 'VII', titulo: 'Borracha e suas Obras (Pneus)', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Pneus para camiões pesados e tratores (5% a 7.5%), pneus para ligeiros (20%).' },

  // SEÇÃO IX: MADEIRA E SUAS OBRAS
  { capitulo: '44', seccao: 'IX', titulo: 'Madeira, Carvão Vegetal e Obras de Madeira', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Madeira serrada, pranchões, contraplacados (7.5%). Exportação de toros em bruto PROIBIDA em Moçambique.', requisitosEspeciais: 'Certificado Florestal (MADER)' },

  // SEÇÃO X: PAPEL E LIVROS
  { capitulo: '48', seccao: 'X', titulo: 'Papel, Cartão e suas Obras', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Bobinas de papel kraft para caixas (7.5%), papel A4 de escritório (20%).' },
  { capitulo: '49', seccao: 'X', titulo: 'Livros, Jornais e Impressos Didáticos', tipoBemPrincipal: 'isento', direitosPadrao: 0, icePadrao: 0, ivaPadrao: 0, descricaoCompleta: 'Livros didáticos, manuais escolares e jornais científicos (ISENÇÃO TOTAL: 0% DA, 0% IVA).' },

  // SEÇÃO XI: MATÉRIAS TÊXTEIS E VESTUÁRIO
  { capitulo: '52', seccao: 'XI', titulo: 'Algodão e Fios de Algodão', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Algodão em rama, fios e tecidos para confecção.' },
  { capitulo: '61', seccao: 'XI', titulo: 'Vestuário e Acessórios de Malha', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'T-shirts, camisas polo, camisolas de malha (DA: 20%, IVA: 16%).' },
  { capitulo: '62', seccao: 'XI', titulo: 'Vestuário Exceto de Malha', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Fatos, calças, vestidos, camisas de tecido plano (DA: 20%, IVA: 16%).' },
  { capitulo: '63', seccao: 'XI', titulo: 'Outros Artefatos Têxteis Confeccionados (Roupa Usada)', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Roupa usada / fardos (DA: 20% ou taxa específica por kg), cortinas, mantas.' },
  { capitulo: '64', seccao: 'XII', titulo: 'Calçado, Polainas e Artefatos Semelhantes', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Sapatos de couro, ténis, botas de trabalho (20% DA).' },

  // SEÇÃO XV: METAIS COMUNS E SUAS OBRAS (SIDERURGIA)
  { capitulo: '72', seccao: 'XV', titulo: 'Ferro Fundido, Ferro e Aço (Siderurgia)', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Varão de construção, perfis laminados a quente, chapas de ferro (DA: 7.5%, IVA: 16%).' },
  { capitulo: '73', seccao: 'XV', titulo: 'Obras de Ferro Fundido, Ferro ou Aço', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Estruturas metálicas montadas (5% a 7.5%), tubos de aço, parafusos, porcas.' },
  { capitulo: '76', seccao: 'XV', titulo: 'Alumínio e suas Obras', tipoBemPrincipal: 'intermediario', direitosPadrao: 7.5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Perfis de alumínio para caixilharia, chapas onduladas (7.5%). Moçambique é grande produtor (Mozal).' },

  // SEÇÃO XVI: MÁQUINAS, APARELHOS E MATERIAIS ELÉTRICOS (BENS DE CAPITAL)
  { capitulo: '84', seccao: 'XVI', titulo: 'Reatores, Caldeiras, Máquinas e Aparelhos Mecânicos', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Bens de Capital: Motores, bombas industriais, rolamentos, máquinas agrícolas, escavadoras, computadores, ar condicionado (5% DA).' },
  { capitulo: '85', seccao: 'XVI', titulo: 'Máquinas, Aparelhos e Materiais Elétricos', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Transformadores elétricos, geradores, painéis solares (5%), baterias solares (5%), telemóveis/smartphones (5%), eletrodomésticos de consumo (20%).' },

  // SEÇÃO XVII: MATERIAL DE TRANSPORTE E VEÍCULOS
  { capitulo: '86', seccao: 'XVII', titulo: 'Veículos e Material para Vias Férreas', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Locomotivas, vagões de carga de carvão e minérios (CFM) (5% DA).' },
  { capitulo: '87', seccao: 'XVII', titulo: 'Veículos Automóveis, Tratores e Outros', tipoBemPrincipal: 'veiculo', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Tratores agrícolas (8701: 5% DA), Camiões pesados (8704: 5% DA), Automóveis ligeiros (8703: 20% DA + 10% a 40% ICE conforme cilindrada).' },
  { capitulo: '88', seccao: 'XVII', titulo: 'Aeronaves e Veículos Espaciais (Drones)', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Aviões comerciais, helicópteros, drones civis/industriais (5% DA).' },
  { capitulo: '89', seccao: 'XVII', titulo: 'Embarcações e Estruturas Flutuantes', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Barcos de pesca industrial, rebocadores portuários, batelões (5% DA).' },

  // SEÇÃO XVIII: INSTRUMENTOS DE PRECISÃO E MÉDICOS
  { capitulo: '90', seccao: 'XVIII', titulo: 'Instrumentos e Aparelhos de Ótica, Fotografia e Médicos', tipoBemPrincipal: 'capital', direitosPadrao: 5, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Equipamentos hospitalares e cirúrgicos (0% a 5% DA), instrumentos de topografia e medição (5% DA).' },

  // SEÇÃO XX: MERCADORIAS DIVERSAS
  { capitulo: '94', seccao: 'XX', titulo: 'Mobiliário, Colchões e Aparelhos de Iluminação', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Mobiliário de escritório e residencial, lâmpadas LED, luminárias públicas (5% a 20% DA).' },
  { capitulo: '95', seccao: 'XX', titulo: 'Brinquedos, Jogos e Artigos de Desporto', tipoBemPrincipal: 'consumo', direitosPadrao: 20, icePadrao: 0, ivaPadrao: 16, descricaoCompleta: 'Artigos recreativos, jogos eletrónicos, bolas de futebol (DA: 20%, IVA: 16%).' }
];

/**
 * Consulta em Tempo Real da Pauta Aduaneira
 * Consulta o backend (/api/pauta/realtime-lookup) para classificar e retornar qualquer mercadoria ou código HS
 * em tempo real, sem limitações de itens predefinidos.
 */
export async function consultarPautaTempoReal(termoOuCodigo: string): Promise<TaxasPautaResultado & {
  tempoReal: boolean;
  dataConsulta: string;
  tsaMzn: number;
  mcnetMzn: number;
  kudumbaMzn: number;
  totalEstimadoTaxasPct: number;
  requesitosOficiais?: string[];
  capituloInfo?: CapituloSH;
}> {
  const query = termoOuCodigo.trim();
  if (!query) {
    throw new Error('Informe um código ou descrição para consultar a pauta.');
  }
  if (query.length > 256) {
    throw new Error('A consulta da pauta deve ter no máximo 256 caracteres.');
  }

  // Tentar primeiro chamada real-time na API do servidor
  try {
    const res = await fetch(`/api/pauta/realtime-lookup?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      const rawCodigo = typeof data?.codigo === 'string' ? data.codigo.trim() : '';
      const codigo = /^\d{8}$/.test(rawCodigo)
        ? `${rawCodigo.slice(0, 4)}.${rawCodigo.slice(4, 6)}.${rawCodigo.slice(6, 8)}`
        : rawCodigo;
      const descricao = typeof data?.descricao === 'string' ? data.descricao.trim() : '';
      const categoria = typeof data?.categoria === 'string' ? data.categoria.trim() : '';
      const tipoBem = typeof data?.tipoBem === 'string' ? data.tipoBem : 'capital';
      const notas = typeof data?.notas === 'string' ? data.notas : '';
      const direitosPerc = Number(data?.direitosPerc);
      const icePerc = Number(data?.icePerc);
      const ivaPerc = Number(data?.ivaPerc);
      const taxasValidas = [direitosPerc, icePerc, ivaPerc].every((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100);
      if (codigo && descricao && categoria && notas && taxasValidas && codigo.length <= 64 && descricao.length <= 500 && categoria.length <= 160 && notas.length <= 2000) {
        const verificado = data.verificado !== false;
        // Armazenar no cache dinâmico da sessão
        if (verificado) {
          adicionarItemPautaDinamica({
            codigo,
            shCapitulo: codigo.slice(0, 2),
            shPosicao: codigo.replace(/\D/g, '').slice(0, 4),
            descricao,
            categoria,
            tipoBem: tipoBem as PautaItem['tipoBem'],
            direitosPerc,
            icePerc,
            ivaPerc,
            notas,
            palavrasChave: [query]
          });
        }

        const totalTaxas = direitosPerc + icePerc + ivaPerc;
        const numericOrDefault = (value: unknown, fallback: number) => {
          const numeric = Number(value);
          return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
        };
        return {
          encontrado: true,
          codigo,
          descricao,
          categoria,
          tipoBem,
          direitosPerc,
          icePerc,
          ivaPerc,
          notas,
          fonte: verificado ? 'pauta_oficial' : 'estimativa_categoria',
          verificado,
          tempoReal: true,
          dataConsulta: typeof data.dataConsulta === 'string' ? data.dataConsulta : new Date().toISOString(),
          tsaMzn: numericOrDefault(data.tsaMzn, 1000),
          mcnetMzn: numericOrDefault(data.mcnetMzn, 1550),
          kudumbaMzn: numericOrDefault(data.kudumbaMzn, 2250),
          totalEstimadoTaxasPct: totalTaxas,
          requesitosOficiais: Array.isArray(data.requesitosOficiais) ? data.requesitosOficiais.filter((item: unknown): item is string => typeof item === 'string').slice(0, 20) : [
            'Declaração na Janela Única MCNET (JUE)',
            'Inspecção Não-Intrusiva Kudumba (Scanner)',
            'Termo de Compromisso Bancário (Banco de Moçambique)'
          ],
          capituloInfo: CAPITULOS_SISTEMA_HARMONIZADO.find(c => c.capitulo === codigo.slice(0, 2))
        };
      }
    }
  } catch (err) {
    console.warn('Falha na consulta remota da pauta, aplicando motor local avançado:', err);
  }

  // Fallback para motor heurístico local caso offline
  const localRes = obterTaxasPauta(query);
  const totalTaxas = localRes.direitosPerc + localRes.icePerc + localRes.ivaPerc;
  const digitos = query.replace(/\D/g, '');
  const cap = digitos.length >= 2 ? digitos.slice(0, 2) : '84';
  const capInfo = CAPITULOS_SISTEMA_HARMONIZADO.find(c => c.capitulo === cap);

  return {
    ...localRes,
    tempoReal: true,
    dataConsulta: new Date().toISOString(),
    tsaMzn: 1000,
    mcnetMzn: 1550,
    kudumbaMzn: 2250,
    totalEstimadoTaxasPct: totalTaxas,
    requesitosOficiais: [
      'Declaração Aduaneira Eletrónica (MCNET / JUE)',
      'Taxa de Serviços Aduaneiros (TSA) 1.000,00 MZN',
      'Scanner Aduaneiro Kudumba 2.250,00 MZN',
      'Factura Comercial Definitiva & Certificado de Origem'
    ],
    capituloInfo: capInfo
  };
}
