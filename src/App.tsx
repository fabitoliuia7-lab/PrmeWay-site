import { useState, useEffect, useMemo } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  Globe, 
  Clock, 
  ShieldCheck,
  Package,
  Ship,
  Plane,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Product {
  id: number;
  descricao: string;
  valorUnitario: number;
  taxaEnvioFornecedor: number;
  quantidade: number;
  comprimento: number;
  largura: number;
  altura: number;
  pesoUnitario: number;
}

interface CalculationResult {
  subtotalProdutos: number;
  valorTaxaProc: number;
  valorComissao: number;
  taxaLevantamento: number;
  custosEnvio: number;
  total: number;
  cbmTotal: number;
  pesoTotal: number;
}

// --- Components ---

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [moeda, setMoeda] = useState('USD');
  const [taxaProcessamento, setTaxaProcessamento] = useState(0);
  const [comissaoServicos, setComissaoServicos] = useState(0);
  const [taxaLevantamento, setTaxaLevantamento] = useState(0);
  const [tipoTransporte, setTipoTransporte] = useState('maritimo');
  const [taxasAduaneiras, setTaxasAduaneiras] = useState(0);
  const [freteInternacional, setFreteInternacional] = useState(0);
  const [taxaEnvioLocal, setTaxaEnvioLocal] = useState(0);
  const [calcularRevenda, setCalcularRevenda] = useState(false);
  const [margemLucro, setMargemLucro] = useState(0);
  const [custosAdicionais, setCustosAdicionais] = useState(0);
  
  const [produtos, setProdutos] = useState<Product[]>([
    {
      id: 1,
      descricao: '',
      valorUnitario: 0,
      taxaEnvioFornecedor: 0,
      quantidade: 1,
      comprimento: 0,
      largura: 0,
      altura: 0,
      pesoUnitario: 0
    }
  ]);

  // --- Calculations ---

  const [showLegal, setShowLegal] = useState<{ title: string; content: string } | null>(null);

  const legalTerms = {
    termos: {
      title: "Termos de Serviço",
      content: `Estes termos regem o uso dos serviços da PrimeWay Invest & Logística, SU, Lda. 
      1. Âmbito: Atuamos como intermediários logísticos e consultores de importação.
      2. Responsabilidade: A PrimeWay responsabiliza-se pela coordenação do transporte e despacho, conforme a Lei de Proteção de Dados (Lei 3/2017) e o Código Comercial de Moçambique.
      3. Cotações: Os valores gerados no simulador são estimativas baseadas em dados fornecidos pelo cliente e podem variar conforme pesagem final e taxas alfandegárias em vigor (Pauta Aduaneira).
      4. Jurisdição: Qualquer litígio será dirimido nos tribunais da Cidade de Maputo, Moçambique.`
    },
    privacidade: {
      title: "Política de Privacidade",
      content: `A PrimeWay respeita a sua privacidade.
      1. Recolha de Dados: Recolhemos apenas os dados necessários para a execução dos serviços logísticos (NOME, NUIT, CONTACTO).
      2. Proteção: Em conformidade com a Lei 3/2017 de Moçambique, garantimos que os seus dados não serão partilhados com terceiros para fins comerciais.
      3. Direitos: O cliente tem o direito de solicitar a retificação ou eliminação dos seus dados dos nossos sistemas a qualquer momento.`
    },
    compliance: {
      title: "Compliance Aduaneiro",
      content: `A PrimeWay opera em estrita conformidade com as normas da Autoridade Tributária de Moçambique.
      1. Ética: Não facilitamos nem participamos em práticas de subfaturação ou contrabando.
      2. Documentação: Todas as importações devem ser acompanhadas de faturas comerciais autênticas e documentos de transporte válidos.`
    }
  };

  const results = useMemo((): CalculationResult => {
    let subtotalProdutos = 0;
    let cbmTotal = 0;
    let pesoTotal = 0;

    produtos.forEach(p => {
      const qtd = Number(p.quantidade) || 0;
      subtotalProdutos += (Number(p.valorUnitario) || 0) * qtd + (Number(p.taxaEnvioFornecedor) || 0);
      const cbmUnit = (Number(p.comprimento) || 0) * (Number(p.largura) || 0) * (Number(p.altura) || 0) / 1000000;
      cbmTotal += cbmUnit * qtd * 1.2; // 20% safety factor for packing
      pesoTotal += (Number(p.pesoUnitario) || 0) * qtd;
    });

    const valorTaxaProc = subtotalProdutos * (Number(taxaProcessamento) / 100);
    const valorComissao = subtotalProdutos * (Number(comissaoServicos) / 100);
    const baseCalculoEnvio = tipoTransporte === 'maritimo' ? cbmTotal : pesoTotal;
    const custosEnvio = (baseCalculoEnvio * Number(taxasAduaneiras)) + (baseCalculoEnvio * Number(freteInternacional)) + Number(taxaEnvioLocal);

    let total = subtotalProdutos + valorTaxaProc + valorComissao + Number(taxaLevantamento) + custosEnvio;

    if (calcularRevenda) {
      total = (total + Number(custosAdicionais)) * (1 + (Number(margemLucro) / 100));
    }

    return {
      subtotalProdutos,
      valorTaxaProc,
      valorComissao,
      taxaLevantamento: Number(taxaLevantamento),
      custosEnvio,
      total,
      cbmTotal,
      pesoTotal
    };
  }, [produtos, taxaProcessamento, comissaoServicos, taxaLevantamento, tipoTransporte, taxasAduaneiras, freteInternacional, taxaEnvioLocal, calcularRevenda, margemLucro, custosAdicionais]);

  // --- Handlers ---

  const adicionarProduto = () => {
    setProdutos(prev => [
      ...prev,
      {
        id: Date.now(),
        descricao: '',
        valorUnitario: 0,
        taxaEnvioFornecedor: 0,
        quantidade: 1,
        comprimento: 0,
        largura: 0,
        altura: 0,
        pesoUnitario: 0
      }
    ]);
  };

  const removerProduto = (id: number) => {
    if (produtos.length === 1) return;
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  const atualizarProduto = (id: number, field: keyof Product, value: string | number) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const limparTudo = () => {
    if (window.confirm("Resetar todos os dados da cotação atual?")) {
      setProdutos([{
        id: Date.now(),
        descricao: '',
        valorUnitario: 0,
        taxaEnvioFornecedor: 0,
        quantidade: 1,
        comprimento: 0,
        largura: 0,
        altura: 0,
        pesoUnitario: 0
      }]);
      setTaxaProcessamento(0);
      setComissaoServicos(0);
      setTaxaLevantamento(0);
      setTaxasAduaneiras(0);
      setFreteInternacional(0);
      setTaxaEnvioLocal(0);
      setCalcularRevenda(false);
      setMargemLucro(0);
      setCustosAdicionais(0);
    }
  };

  const imprimirFatura = () => {
    window.print();
  };

  const formatoMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/258826921467?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20PrimeWay!" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform no-print"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.004-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>

      {/* Topbar */}
      <div className="bg-corp-blue text-white py-2 px-6 hidden md:block no-print text-[10px] font-medium tracking-widest uppercase">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Phone size={12} className="text-corp-orange" /> +258 82 692 1467</span>
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-corp-orange" /> primewayinvestelogistica@gmail.com</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-corp-orange" /> Maputo, Moçambique</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-5 px-6 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-4">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg" 
              alt="PrimeWay Logo" 
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </a>
          
          <div className="hidden md:flex items-center gap-10">
            {['Início', 'A Empresa', 'Serviços'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(' ', '-')}`} 
                className="text-xs font-semibold text-slate-600 hover:text-corp-blue uppercase tracking-widest transition-colors"
              >
                {item}
              </a>
            ))}
            <a href="#simulador" className="btn-modern-primary !py-3 !px-6 !text-[11px]">
              Cotação Online
            </a>
          </div>

          <button className="md:hidden text-corp-blue" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-200 p-6 flex flex-col gap-4 md:hidden shadow-xl"
            >
              {['Início', 'A Empresa', 'Serviços'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(' ', '-')}`} 
                  className="text-sm font-semibold text-corp-blue uppercase tracking-widest"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <a 
                href="#simulador" 
                className="bg-corp-accent text-white text-sm font-semibold px-6 py-4 uppercase tracking-widest text-center rounded-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Cotação Online
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <header id="inicio" className="relative bg-slate-900 text-white min-h-[70vh] md:min-h-[90vh] flex items-center px-6 overflow-hidden no-print">
        <div className="absolute inset-0">
          <motion.video 
            autoPlay 
            loop 
            muted 
            playsInline
            poster="https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.2 }}
            transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="w-full h-full object-cover opacity-40"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-cargo-ship-sailing-in-the-ocean-40043-large.mp4" type="video/mp4" />
          </motion.video>
          <motion.div 
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"
          ></motion.div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-10"
          >
            <span className="section-label !text-white !mb-0">Excelência em cada Importação</span>
            <h2 className="font-heading font-bold text-6xl md:text-8xl leading-[0.9] uppercase tracking-tighter">
              A Sua Ponte <br /><span className="text-corp-blue-light">Para o Mundo.</span>
            </h2>
            <p className="text-xl text-slate-300 font-light leading-relaxed max-w-2xl">
              Especialistas em conectar Moçambique aos principais mercados globais. Soluções integradas de importação e exportação com foco em eficiência e redução de custos.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <a href="#simulador" className="btn-modern-primary">
                Simular Cotação <ChevronRight size={20} />
              </a>
              <a href="#serviços" className="btn-modern-outline !bg-transparent !text-white !border-white/20 hover:!bg-white/10">
                Nossos Serviços
              </a>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white py-10 md:py-16 no-print relative z-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {[
            { label: 'Transparência', value: '100%', icon: <ShieldCheck className="text-corp-blue" /> },
            { label: 'Rota Especializada', value: 'China > MZ', icon: <Globe className="text-corp-blue" /> },
            { label: 'Soluções Completas', value: 'Turn-key', icon: <Package className="text-corp-blue" /> },
            { label: 'Acompanhamento', value: '24/7', icon: <Clock className="text-corp-blue" /> }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <h4 className="font-heading font-bold text-2xl text-slate-900">{stat.value}</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="a-empresa" className="py-16 md:py-32 px-6 bg-slate-50 no-print">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="space-y-8">
            <span className="section-label">A Nossa Identidade</span>
            <h2 className="font-heading font-bold text-5xl md:text-6xl text-slate-900 leading-[0.9] uppercase tracking-tighter">
              Excelência em cada Importação.
            </h2>
            <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
              <p>
                A <strong className="text-corp-blue">PRIMEWAY INVEST & LOGÍSTICA</strong> é mais do que um operador logístico. Somos o seu parceiro estratégico na expansão de negócios internacionais.
              </p>
              <p>
                Com uma rede global de parceiros e infraestrutura própria, garantimos que a sua mercadoria chegue ao destino com a máxima segurança e o menor tempo de trânsito possível.
              </p>
            </div>
            <div className="pt-4">
              <a href="#simulador" className="btn-modern-outline">
                Conheça a Nossa História
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Transparência', desc: 'Processos claros e rastreabilidade total em cada etapa.', icon: <ShieldCheck size={24} /> },
              { title: 'Confiança', desc: 'Compromisso inabalável com prazos e integridade.', icon: <Clock size={24} /> },
              { title: 'Inovação', desc: 'Tecnologia aplicada para otimizar a sua cadeia logística.', icon: <CheckCircle2 size={24} /> },
              { title: 'Presença', desc: 'Conectamos Moçambique aos 5 continentes.', icon: <Globe size={24} /> }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bento-item"
              >
                <div className="text-corp-blue mb-6">{item.icon}</div>
                <h4 className="font-heading font-semibold text-slate-900 mb-3 uppercase text-xs tracking-widest">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="serviços" className="py-16 md:py-32 px-6 bg-white no-print">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <span className="section-label">O Nosso Portfólio</span>
            <h2 className="font-heading font-bold text-5xl text-slate-900 uppercase tracking-tighter mt-4">Soluções Logísticas</h2>
            <p className="text-slate-500 text-lg leading-relaxed mt-6">
              Modelos de negócio flexíveis desenhados para responder às necessidades específicas da sua empresa.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Modelo Assistida */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bento-item !p-16 border-t-8 border-corp-blue-light"
            >
              <div className="text-corp-blue mb-10">
                <Package size={56} strokeWidth={1} />
              </div>
              <h3 className="font-heading font-bold text-3xl text-slate-900 mb-6 uppercase tracking-tight">Importação Assistida</h3>
              <p className="text-slate-500 mb-10 text-lg leading-relaxed">
                Ideal para quem já tem fornecedores mas precisa de um parceiro logístico de confiança para garantir a integridade da operação.
              </p>
              <ul className="space-y-5 text-[10px] text-slate-400 font-semibold uppercase tracking-[0.3em] border-t border-slate-100 pt-10">
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue-light rounded-full"></span> Recepção no Armazém China</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue-light rounded-full"></span> Consolidação de Cargas</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue-light rounded-full"></span> Frete Marítimo/Aéreo</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue-light rounded-full"></span> Despacho Aduaneiro</li>
              </ul>
            </motion.div>

            {/* Modelo Completa */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bento-item !p-16 !bg-slate-900 !text-white border-t-8 border-corp-blue"
            >
              <div className="text-corp-blue-light mb-10">
                <Ship size={56} strokeWidth={1} />
              </div>
              <h3 className="font-heading font-bold text-3xl text-white mb-6 uppercase tracking-tight">Importação Completa</h3>
              <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                Serviço Turn-key. Indique o produto e nós executamos todas as etapas, desde a busca pelo fornecedor até a entrega na sua porta.
              </p>
              <ul className="space-y-5 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.3em] border-t border-white/5 pt-10">
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue rounded-full"></span> Busca & Negociação na Origem</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue rounded-full"></span> Pagamento Internacional</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue rounded-full"></span> Embalamento Profissional</li>
                <li className="flex items-center gap-4"><span className="w-2 h-2 bg-corp-blue rounded-full"></span> Logística End-to-End</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simulator Section */}
      <main id="simulador" className="max-w-7xl mx-auto px-6 py-16 md:py-32 space-y-16 no-print">
        <div className="text-center max-w-3xl mx-auto">
          <span className="section-label">Ferramenta de Cotação</span>
          <h2 className="font-heading font-bold text-5xl text-slate-900 uppercase tracking-tighter mt-4">Simulador Inteligente</h2>
          <p className="text-slate-500 text-lg leading-relaxed mt-6">
            Obtenha uma estimativa precisa dos seus custos logísticos em segundos. Transparência total, sem taxas ocultas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Inputs Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* 1. Parameters */}
            <section className="bento-item !p-10">
              <h3 className="font-heading font-semibold text-xs text-corp-blue mb-10 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-corp-blue/5 flex items-center justify-center text-[10px]">01</span>
                Parâmetros da Operação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="label-corp">Moeda Base</label>
                  <select 
                    value={moeda} 
                    onChange={(e) => setMoeda(e.target.value)}
                    className="input-modern font-semibold"
                  >
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="MZN">MZN - Metical Moçambicano</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="label-corp">Taxa de Processamento (%)</label>
                  <input 
                    type="number" 
                    value={taxaProcessamento || ''} 
                    onChange={(e) => setTaxaProcessamento(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="label-corp">Comissão Agenciamento (%)</label>
                  <input 
                    type="number" 
                    value={comissaoServicos || ''} 
                    onChange={(e) => setComissaoServicos(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="label-corp">Taxa Armazém ({moeda})</label>
                  <input 
                    type="number" 
                    value={taxaLevantamento || ''} 
                    onChange={(e) => setTaxaLevantamento(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </section>

            {/* 2. Products */}
            <section className="bento-item !p-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-corp-blue/5 flex items-center justify-center text-[10px]">02</span>
                  Mercadorias
                </h3>
                <button 
                  onClick={adicionarProduto} 
                  className="text-corp-blue bg-corp-blue/5 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest hover:bg-corp-blue hover:text-white transition-all rounded-xl flex items-center gap-2"
                >
                  <Plus size={14} /> Adicionar Item
                </button>
              </div>
              
              <div className="space-y-8">
                {produtos.map((p, index) => (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 border border-slate-100 bg-slate-50/50 rounded-2xl relative group"
                  >
                    <button 
                      onClick={() => removerProduto(p.id)} 
                      className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
                      <div className="md:col-span-6">
                        <label className="label-corp">Descrição</label>
                        <input 
                          type="text" 
                          value={p.descricao} 
                          onChange={(e) => atualizarProduto(p.id, 'descricao', e.target.value)}
                          className="input-modern" 
                          placeholder="Ex: Peças Industriais" 
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="label-corp">Valor ({moeda})</label>
                        <input 
                          type="number" 
                          value={p.valorUnitario || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'valorUnitario', Number(e.target.value))}
                          className="input-modern" 
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="label-corp">Qtd.</label>
                        <input 
                          type="number" 
                          value={p.quantidade} 
                          onChange={(e) => atualizarProduto(p.id, 'quantidade', Number(e.target.value))}
                          className="input-modern" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <label className="label-corp">Frete Fornecedor ({moeda})</label>
                        <input 
                          type="number" 
                          value={p.taxaEnvioFornecedor || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'taxaEnvioFornecedor', Number(e.target.value))}
                          className="input-modern" 
                        />
                      </div>
                      <div>
                        <label className="label-corp">Peso Unit. (kg)</label>
                        <input 
                          type="number" 
                          value={p.pesoUnitario || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'pesoUnitario', Number(e.target.value))}
                          className="input-modern" 
                        />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-100">
                      <label className="label-corp !text-corp-blue-light mb-4">Dimensões Unidade (cm)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <input 
                          type="number" 
                          value={p.comprimento || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'comprimento', Number(e.target.value))}
                          className="input-modern !bg-slate-50" 
                          placeholder="C" 
                        />
                        <input 
                          type="number" 
                          value={p.largura || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'largura', Number(e.target.value))}
                          className="input-modern !bg-slate-50" 
                          placeholder="L" 
                        />
                        <input 
                          type="number" 
                          value={p.altura || ''} 
                          onChange={(e) => atualizarProduto(p.id, 'altura', Number(e.target.value))}
                          className="input-modern !bg-slate-50" 
                          placeholder="A" 
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 3. Logistics */}
            <section className="bento-item !p-10">
              <h3 className="font-heading font-semibold text-xs text-corp-blue mb-10 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-corp-blue/5 flex items-center justify-center text-[10px]">03</span>
                Logística & Aduana
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="label-corp">Modal Logístico</label>
                  <select 
                    value={tipoTransporte} 
                    onChange={(e) => setTipoTransporte(e.target.value)}
                    className="input-modern font-semibold"
                  >
                    <option value="maritimo">Marítimo (CBM - m³)</option>
                    <option value="aereo">Aéreo (Peso - Kg)</option>
                  </select>
                </div>
                <div>
                  <label className="label-corp">Despacho Aduaneiro (por {tipoTransporte === 'maritimo' ? 'CBM' : 'Kg'})</label>
                  <input 
                    type="number" 
                    value={taxasAduaneiras || ''} 
                    onChange={(e) => setTaxasAduaneiras(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="label-corp">Frete Internacional (por {tipoTransporte === 'maritimo' ? 'CBM' : 'Kg'})</label>
                  <input 
                    type="number" 
                    value={freteInternacional || ''} 
                    onChange={(e) => setFreteInternacional(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
                <div>
                  <label className="label-corp">Transporte Interno (Inland)</label>
                  <input 
                    type="number" 
                    value={taxaEnvioLocal || ''} 
                    onChange={(e) => setTaxaEnvioLocal(Number(e.target.value))}
                    className="input-modern" 
                    placeholder="0.00" 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Results Column */}
          <div className="space-y-8">
            <div className="glass-card !bg-corp-blue !border-none p-10 text-white rounded-3xl sticky top-28">
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 mb-10 block">Resultado da Proforma</span>
              
              <div className="space-y-10">
                <div>
                  <span className="block text-[10px] text-white/40 mb-4 uppercase tracking-widest font-semibold">Investimento Total</span>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-xl font-semibold text-corp-blue-light">{moeda}</span>
                    <span className="text-4xl md:text-6xl font-heading font-bold tracking-tighter break-all">
                      {formatoMoeda(results.total)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-10 border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest">
                    <span className="text-white/40">Volume Total</span>
                    <span className="text-corp-blue-light">{results.cbmTotal.toFixed(4)} m³</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest">
                    <span className="text-white/40">Peso Bruto</span>
                    <span className="text-corp-blue-light">{results.pesoTotal.toFixed(2)} kg</span>
                  </div>
                </div>
                
                <div className="pt-10 space-y-4">
                  <button 
                    onClick={imprimirFatura} 
                    className="w-full btn-modern-primary !bg-white !text-corp-blue !shadow-none hover:!bg-slate-100"
                  >
                    <Printer size={20} /> Exportar PDF
                  </button>
                  <button 
                    onClick={limparTudo} 
                    className="w-full text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 hover:text-white transition-all text-center py-4 flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Resetar Simulador
                  </button>
                </div>
              </div>
            </div>

            {/* Resale Simulation */}
            <section className="bento-item !p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="calcularRevenda" 
                    checked={calcularRevenda} 
                    onChange={(e) => setCalcularRevenda(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-corp-blue"></div>
                </div>
                <label htmlFor="calcularRevenda" className="font-semibold text-[10px] text-slate-900 uppercase tracking-widest cursor-pointer select-none">Simulação de Revenda</label>
              </div>
              
              <AnimatePresence>
                {calcularRevenda && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-8 pt-8 border-t border-slate-100">
                      <div>
                        <label className="label-corp">Margem de Lucro (%)</label>
                        <input 
                          type="number" 
                          value={margemLucro || ''} 
                          onChange={(e) => setMargemLucro(Number(e.target.value))}
                          className="input-modern" 
                          placeholder="0" 
                        />
                      </div>
                      <div>
                        <label className="label-corp">Custos Extras Locais ({moeda})</label>
                        <input 
                          type="number" 
                          value={custosAdicionais || ''} 
                          onChange={(e) => setCustosAdicionais(Number(e.target.value))}
                          className="input-modern" 
                          placeholder="0.00" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-10 md:pt-32 md:pb-12 border-t border-white/5 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-10">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg" 
                alt="PrimeWay Logo Dark" 
                className="h-16 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4 text-sm text-slate-400">
              <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-corp-blue-light" /> NUIT: 402119357</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Sede Global</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-4">
                <MapPin size={20} className="text-corp-blue-light shrink-0 mt-1" /> 
                <span className="leading-relaxed">Bairro Matola A, Quarteirão 17, Casa Nº 38, Cidade da Matola, Maputo - Moçambique</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Contactos</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                <Phone size={20} className="text-corp-blue-light" /> +258 82 692 1467
              </li>
              <li className="flex items-center gap-4 hover:text-white transition-colors cursor-pointer">
                <Phone size={20} className="text-corp-blue-light" /> +258 84 291 4655
              </li>
              <li className="pt-6">
                <a href="mailto:primewayinvestelogistica@gmail.com" className="text-corp-blue-light hover:text-white transition-all flex items-center gap-3">
                  <Mail size={18} /> primewayinvestelogistica@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold mb-10 uppercase text-[10px] tracking-[0.4em] text-white/30">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button onClick={() => setShowLegal(legalTerms.termos)} className="hover:text-white transition-colors text-left">Termos de Serviço</button></li>
              <li><button onClick={() => setShowLegal(legalTerms.privacidade)} className="hover:text-white transition-colors text-left">Política de Privacidade</button></li>
              <li><button onClick={() => setShowLegal(legalTerms.compliance)} className="hover:text-white transition-colors text-left">Compliance Aduaneiro</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 md:mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">
          <p>&copy; 2024 PrimeWay Invest & Logística, SU, Lda. Todos os direitos reservados.</p>
          <p className="mt-6 md:mt-0">Global Logistics Infrastructure.</p>
        </div>
      </footer>

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 max-w-2xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowLegal(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-corp-blue transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="font-heading font-black text-3xl text-slate-900 uppercase tracking-tighter mb-8">{showLegal.title}</h3>
              <div className="text-slate-600 leading-relaxed space-y-4 whitespace-pre-line">
                {showLegal.content}
              </div>
              <div className="mt-10 pt-10 border-t border-slate-100">
                <button 
                  onClick={() => setShowLegal(null)}
                  className="btn-modern-primary w-full"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Print Area --- */}
      <div id="invoice-print-area" className="hidden bg-white font-sans text-black">
        <div className="p-16 max-w-5xl mx-auto border border-slate-200">
          <div className="flex justify-between items-end border-b-4 border-corp-blue pb-10 mb-12">
            <div>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028416962/glYQVTOtGErYGBoj.jpg" 
                alt="PrimeWay Logo Print" 
                className="h-16 w-auto object-contain mb-6"
                referrerPolicy="no-referrer"
              />
              <p className="font-bold text-[10px] text-slate-500 uppercase tracking-[0.4em]">Invest & Logística, SU, Lda</p>
              <p className="text-xs text-slate-400 mt-6">NUIT: 402119357 | Maputo, Moçambique</p>
            </div>
            <div className="text-right">
              <h2 className="font-heading font-bold text-4xl uppercase tracking-widest mb-4 text-slate-900">Cotação</h2>
              <p className="text-sm font-mono text-slate-500">Data: {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="text-sm font-mono text-slate-500">Ref: PW-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-10 border border-gray-200 p-6 bg-gray-50">
            <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Moeda</p><p className="text-sm font-bold">{moeda}</p></div>
            <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Modal</p><p className="text-sm font-bold uppercase">{tipoTransporte}</p></div>
            <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Volume Total</p><p className="text-sm font-bold">{results.cbmTotal.toFixed(4)} m³</p></div>
            <div><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Peso Bruto</p><p className="text-sm font-bold">{results.pesoTotal.toFixed(2)} kg</p></div>
          </div>

          <table className="w-full text-left border-collapse mb-10 text-sm border border-gray-300">
            <thead>
              <tr className="bg-corp-blue text-white text-[10px] uppercase tracking-widest">
                <th className="p-4 border border-gray-300">Descrição Comercial</th>
                <th className="p-4 border border-gray-300 text-center">Qtd</th>
                <th className="p-4 border border-gray-300 text-right">Valor Unit.</th>
                <th className="p-4 border border-gray-300 text-right">Frete Interno</th>
                <th className="p-4 border border-gray-300 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 font-medium">
              {produtos.map((p) => (
                <tr key={p.id} className="border-b border-gray-300">
                  <td className="p-4 border-r border-gray-300">{p.descricao || 'Mercadoria Geral'}</td>
                  <td className="p-4 border-r border-gray-300 text-center">{p.quantidade}</td>
                  <td className="p-4 border-r border-gray-300 text-right">{formatoMoeda(p.valorUnitario)}</td>
                  <td className="p-4 border-r border-gray-300 text-right">{formatoMoeda(p.taxaEnvioFornecedor)}</td>
                  <td className="p-4 text-right font-bold">{formatoMoeda((p.valorUnitario * p.quantidade) + p.taxaEnvioFornecedor)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-full max-w-sm border border-gray-300 p-6">
              <div className="space-y-3 mb-6 text-xs text-gray-600">
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Mercadoria (FOB/EXW):</span><span className="font-bold text-black">{moeda} {formatoMoeda(results.subtotalProdutos)}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Taxas / Agenciamento:</span><span className="font-bold text-black">{moeda} {formatoMoeda(results.valorTaxaProc + results.valorComissao)}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-2"><span>Despesas Armazém:</span><span className="font-bold text-black">{moeda} {formatoMoeda(results.taxaLevantamento)}</span></div>
                <div className="flex justify-between pb-2"><span>Logística & Aduana:</span><span className="font-bold text-black">{moeda} {formatoMoeda(results.custosEnvio)}</span></div>
              </div>
              <div className="flex justify-between items-end bg-gray-100 p-4 border-t-2 border-black">
                <span className="font-bold uppercase tracking-widest text-[10px]">Custo Operacional Total</span>
                <span className="text-2xl font-black">{moeda} {formatoMoeda(results.total)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-[10px] text-gray-500 border-t border-gray-300 pt-6">
            <p>Estimativa gerada em sistema. Sujeita a alterações mediante aferição de peso/cubagem na origem e variações cambiais.</p>
            <p className="font-bold text-gray-800 mt-2">PRIMEWAY INVEST & LOGÍSTICA - +258 82 692 1467 | primewayinvestelogistica@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
