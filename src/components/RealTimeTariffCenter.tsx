import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  Check, 
  Copy, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink, 
  FileText, 
  Layers, 
  Globe, 
  Percent, 
  ChevronDown, 
  X,
  Coins,
  AlertCircle
} from 'lucide-react';
import { 
  PautaItem, 
  PAUTA_MOCAMBIQUE, 
  CAPITULOS_SISTEMA_HARMONIZADO, 
  CAMBIO_ADUANEIRO_OFICIAL,
  CapituloSH,
  consultarPautaTempoReal
} from '../pautaAduaneira';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { checkAdminSession, getFirebaseIdToken } from '../services/apiSecurity';

interface RealTimeTariffCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarifa?: (tarifa: {
    codigo: string;
    descricao: string;
    direitosPerc: number;
    icePerc: number;
    ivaPerc: number;
    categoria?: string;
    notas?: string;
  }) => void;
}

export const RealTimeTariffCenter: React.FC<RealTimeTariffCenterProps> = ({
  isOpen,
  onClose,
  onSelectTarifa
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultadoAtual, setResultadoAtual] = useState<any | null>(null);
  const [historicoRecente, setHistoricoRecente] = useState<any[]>([]);
  const [secaoAtiva, setSecaoAtiva] = useState<'busca' | 'capitulos' | 'adicionar'>('busca');
  const [filtroCapitulo, setFiltroCapitulo] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Form para adicionar código customizado
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novosDireitos, setNovosDireitos] = useState('5');
  const [novoIce, setNovoIce] = useState('0');
  const [novoIva, setNovoIva] = useState('16');
  const [novasNotas, setNovasNotas] = useState('');
  const [salvandoCustom, setSalvandoCustom] = useState(false);
  const [sucessoCustom, setSucessoCustom] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const refreshAdminSession = async () => {
    if (!auth.currentUser) {
      setIsAdmin(false);
      setAdminCheckError(null);
      return;
    }

    try {
      const session = await checkAdminSession();
      setIsAdmin(session.admin);
      setAdminCheckError(
        session.status === 503
          ? 'Não foi possível verificar a sessão administrativa agora. Tente novamente.'
          : null
      );
    } catch (error) {
      setIsAdmin(false);
      setAdminCheckError(error instanceof Error ? error.message : 'Não foi possível verificar as permissões administrativas.');
    }
  };

  // Inicializar com item padrão relevante
  useEffect(() => {
    if (isOpen && !resultadoAtual) {
      handleSearch('8422.40.00'); // Máquinas de empacotar/embalar
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void refreshAdminSession();
    const unsubscribe = onIdTokenChanged(auth, () => {
      void refreshAdminSession();
    });
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (!isAdmin && secaoAtiva === 'adicionar') {
      setSecaoAtiva('busca');
    }
  }, [isAdmin, secaoAtiva]);

  const handleSearch = async (termToSearch?: string) => {
    const term = (termToSearch !== undefined ? termToSearch : searchTerm).trim();
    if (!term) return;

    setLoading(true);
    try {
      const res = await consultarPautaTempoReal(term);
      setResultadoAtual(res);
      setHistoricoRecente(prev => {
        const filtered = prev.filter(p => p.codigo !== res.codigo);
        return [res, ...filtered].slice(0, 8);
      });
    } catch (e) {
      console.error('Erro na pesquisa em tempo real:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleApply = (item: any) => {
    if (onSelectTarifa) {
      onSelectTarifa({
        codigo: item.codigo,
        descricao: item.descricao,
        direitosPerc: item.direitosPerc,
        icePerc: item.icePerc,
        ivaPerc: item.ivaPerc,
        categoria: item.categoria,
        notas: item.notas
      });
      onClose();
    }
  };

  const handleSalvarCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    const codigo = novoCodigo.trim();
    const descricao = novaDescricao.trim();
    const categoria = novaCategoria.trim() || 'Personalizado Despachante';
    const notas = novasNotas.trim() || 'Registado manualmente pelo importador/despachante.';
    const direitosPerc = Number(novosDireitos);
    const icePerc = Number(novoIce);
    const ivaPerc = Number(novoIva);
    if (!codigo || !descricao) return;
    if (![direitosPerc, icePerc, ivaPerc].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) {
      setCustomError('As taxas devem ser números entre 0 e 100.');
      return;
    }

    setSalvandoCustom(true);
    try {
      const token = await getFirebaseIdToken();
      const res = await fetch('/api/pauta/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          codigo,
          descricao,
          categoria,
          tipoBem: 'capital',
          direitosPerc,
          icePerc,
          ivaPerc,
          notas
        })
      });

      if (res.ok) {
        setSucessoCustom(true);
        setTimeout(() => {
          setSucessoCustom(false);
          setSecaoAtiva('busca');
          handleSearch(codigo);
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const messages: Record<number, string> = {
          400: 'Os dados do código pautal são inválidos. Verifique os campos e tente novamente.',
          401: 'A sua sessão expirou. Inicie sessão novamente para cadastrar um código.',
          403: 'Apenas administradores autorizados podem cadastrar códigos pautais.',
          429: 'Muitos pedidos em pouco tempo. Aguarde e tente novamente.',
          503: 'O serviço está temporariamente indisponível. Tente novamente mais tarde.'
        };
        setCustomError(messages[res.status] || errorData.error || `Não foi possível cadastrar o código (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.error('Erro ao salvar código customizado:', err);
      setCustomError(err instanceof Error ? err.message : 'Não foi possível cadastrar o código.');
    } finally {
      setSalvandoCustom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-corp-blue via-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300">
              <Globe size={22} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base sm:text-lg">
                  Central da Pauta Aduaneira em Tempo Real
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Tempo Real Ativo
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                Sistema Harmonizado (SH) de Moçambique • Alíquotas Oficiais DA, ICE, IVA & Despesas Regulamentares
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Câmbio Aduaneiro Ticker */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto text-[11px] text-slate-700 shrink-0">
          <div className="flex items-center gap-2 font-bold text-corp-blue shrink-0">
            <Coins size={14} className="text-amber-500" />
            <span>Câmbio Aduaneiro Oficial (Banco de Moçambique):</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-medium">
            {CAMBIO_ADUANEIRO_OFICIAL.map(m => (
              <span key={m.moeda} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                <strong className="text-slate-900">{m.moeda}:</strong> {m.taxaMzn.toFixed(2)} MT
              </span>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 shrink-0">
          <button
            onClick={() => setSecaoAtiva('busca')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              secaoAtiva === 'busca'
                ? 'border-corp-blue text-corp-blue bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search size={14} />
            Consulta em Tempo Real
          </button>

          <button
            onClick={() => setSecaoAtiva('capitulos')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              secaoAtiva === 'capitulos'
                ? 'border-corp-blue text-corp-blue bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            97 Capítulos do Sistema Harmonizado
          </button>

          {isAdmin && (
            <button
              onClick={() => setSecaoAtiva('adicionar')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                secaoAtiva === 'adicionar'
                  ? 'border-corp-blue text-corp-blue bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Plus size={14} />
              Cadastrar Novo Código Pautal
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {adminCheckError && !isAdmin && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{adminCheckError}</span>
            </div>
          )}
          {secaoAtiva === 'busca' && (
            <div className="space-y-6">
              {/* Barra de Busca Dinâmica */}
              <div className="bg-gradient-to-r from-blue-50 to-amber-50/60 p-4 rounded-xl border border-blue-200/80 shadow-sm">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  🔍 Pesquisar Qualquer Mercadoria ou Código SH em Moçambique:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Ex: 8422.40.00, máquinas de embalar, painéis solares, tratores, rolamentos, resinas..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-corp-blue/30 focus:border-corp-blue outline-none shadow-sm"
                    />
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-corp-blue to-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>A Consultar...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-amber-300" />
                        <span>Consultar em Tempo Real</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Atalhos rápidos de consulta em tempo real */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Exemplos Rápidos:
                  </span>
                  {[
                    { label: '📦 Embaladoras (8422.40)', term: '8422.40.00' },
                    { label: '☀️ Painéis Solares (8541.43)', term: '8541.43.00' },
                    { label: '🚜 Tratores Agrícolas (8701.90)', term: 'trator agricola' },
                    { label: '⚡ Geradores Diesel (8502.11)', term: 'gerador diesel' },
                    { label: '🌱 Fertilizantes NPK (0% DA)', term: 'fertilizantes' },
                    { label: '🏗️ Bombas de Betão (8413.40)', term: 'bomba de betao' },
                    { label: '💊 Medicamentos (Isento)', term: 'medicamento' },
                    { label: '🚚 Camiões Pesados (8704)', term: '8704.22.00' },
                    { label: '🔩 Varão de Aço (7214.20)', term: '7214.20.00' }
                  ].map((ex) => (
                    <button
                      key={ex.term}
                      onClick={() => {
                        setSearchTerm(ex.term);
                        handleSearch(ex.term);
                      }}
                      className="text-[10px] font-semibold bg-white hover:bg-blue-100/70 text-slate-700 px-2 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card do Resultado em Tempo Real */}
              {resultadoAtual && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-black text-corp-blue bg-blue-100/80 px-2.5 py-0.5 rounded-md border border-blue-300">
                          {resultadoAtual.codigo}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🟢 {resultadoAtual.fonte || 'Pauta Oficial Moçambique'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(resultadoAtual.dataConsulta || Date.now()).toLocaleTimeString('pt-MZ')}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {resultadoAtual.descricao}
                      </h4>
                      {resultadoAtual.posicaoDescricao && (
                        <div className="mt-1 text-xs text-blue-900 bg-blue-50/80 rounded-lg p-2 border border-blue-200">
                          <strong className="text-corp-blue">Posição SH {resultadoAtual.posicaoSH || resultadoAtual.codigo.slice(0, 4)}:</strong> {resultadoAtual.posicaoDescricao}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                        <span>Categoria: <strong className="text-slate-700">{resultadoAtual.categoria}</strong></span>
                        <span>•</span>
                        <span>Tipo de Bem: <strong className="text-slate-700 capitalize">{resultadoAtual.tipoBem}</strong></span>
                        {resultadoAtual.unidadeFisica && (
                          <>
                            <span>•</span>
                            <span>Unidade: <strong className="text-slate-700 font-mono uppercase">{resultadoAtual.unidadeFisica}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚖️ {resultadoAtual.baseLegal || 'Lei nº 13/2021 (AT Moçambique)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(`${resultadoAtual.codigo} - ${resultadoAtual.descricao} (DA: ${resultadoAtual.direitosPerc}%, ICE: ${resultadoAtual.icePerc}%, IVA: ${resultadoAtual.ivaPerc}%)`)}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Copiar dados"
                      >
                        {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                      </button>

                      {onSelectTarifa && (
                        <button
                          onClick={() => handleApply(resultadoAtual)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Aplicar no Simulador</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4 Cards de Métricas de Impostos */}
                  <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-200">
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                        Direitos Aduaneiros (DA)
                      </span>
                      <div className="text-2xl font-black text-amber-600">
                        {resultadoAtual.direitosPerc}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {resultadoAtual.direitosPerc === 0 ? 'Isenção total' : resultadoAtual.direitosPerc <= 5 ? 'Bem de Capital Reduzido' : resultadoAtual.direitosPerc <= 7.5 ? 'Bem Intermédio' : 'Consumo Geral'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block mb-1">
                        ICE (Consumo Específico)
                      </span>
                      <div className="text-2xl font-black text-rose-600">
                        {resultadoAtual.icePerc}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {resultadoAtual.icePerc === 0 ? 'Não Aplicável (0%)' : 'Imposto sobre Luxo/Viaturas'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                        IVA Alfandegário
                      </span>
                      <div className="text-2xl font-black text-emerald-600">
                        {resultadoAtual.ivaPerc}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Taxa oficial Moçambique (PAE)
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-sm">
                      <span className="text-[10px] font-bold text-corp-blue uppercase block mb-1">
                        Total Estimado de Tributos
                      </span>
                      <div className="text-2xl font-black text-corp-blue">
                        {(Number(resultadoAtual.direitosPerc) + Number(resultadoAtual.icePerc) + Number(resultadoAtual.ivaPerc)).toFixed(1)}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Sobre a base aduaneira CIF
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Despesas Fixas Regulamentares e Notas Legais */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText size={14} className="text-corp-blue" />
                        Notas Legais & Instruções de Desembaraço:
                      </h5>
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                        {resultadoAtual.notas || 'Mercadoria sujeita aos trâmites normais do Regulamento Aduaneiro de Moçambique.'}
                      </div>
                    </div>

                    {/* Taxas Fixas de Moçambique */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        Taxas Obrigatórias Fixas por Processo (Moçambique):
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <span className="text-slate-600 font-medium">TSA (Serviços Aduaneiros):</span>
                          <strong className="text-slate-900 font-mono">1.000,00 MT</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <span className="text-slate-600 font-medium">MCNET (Janela Única JUE):</span>
                          <strong className="text-slate-900 font-mono">1.550,00 MT</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Kudumba (Scanner Portuário):</span>
                          <strong className="text-slate-900 font-mono">2.250,00 MT</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navegação pelos 97 Capítulos do Sistema Harmonizado */}
          {secaoAtiva === 'capitulos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Estrutura Completa de Capítulos da Pauta Aduaneira (SH)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Consulte os regimes padrão dos 97 capítulos do Sistema Harmonizado em Moçambique.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filtroCapitulo}
                    onChange={(e) => setFiltroCapitulo(e.target.value)}
                    placeholder="Filtrar capítulo (ex: 84, madeira, trigo)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-corp-blue/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {CAPITULOS_SISTEMA_HARMONIZADO
                  .filter(c => 
                    !filtroCapitulo || 
                    c.capitulo.includes(filtroCapitulo) || 
                    c.titulo.toLowerCase().includes(filtroCapitulo.toLowerCase()) ||
                    c.descricaoCompleta.toLowerCase().includes(filtroCapitulo.toLowerCase())
                  )
                  .map(cap => (
                    <div
                      key={cap.capitulo}
                      onClick={() => {
                        setSecaoAtiva('busca');
                        setSearchTerm(cap.capitulo);
                        handleSearch(cap.capitulo);
                      }}
                      className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200 rounded-xl cursor-pointer transition-all hover:border-corp-blue shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-corp-blue/10 text-corp-blue border border-corp-blue/20">
                            Cap. {cap.capitulo}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Seção {cap.seccao}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            DA: {cap.direitosPadrao}%
                          </span>
                          {cap.icePadrao > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              ICE: {cap.icePadrao}%
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            IVA: {cap.ivaPadrao}%
                          </span>
                        </div>
                      </div>

                      <h5 className="text-xs font-bold text-slate-800 group-hover:text-corp-blue">
                        {cap.titulo}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {cap.descricaoCompleta}
                      </p>

                      {cap.requisitosEspeciais && (
                        <div className="mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          ⚠️ {cap.requisitosEspeciais}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Cadastro de Novo Código Pautal (Personalizado) */}
          {secaoAtiva === 'adicionar' && (
            <div className="max-w-xl mx-auto space-y-4">
              {(adminCheckError || customError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{customError || adminCheckError}</span>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-slate-700">
                <p className="font-bold text-corp-blue mb-1">
                  💡 Registo de Notificação / Código Aduaneiro Personalizado:
                </p>
                <p>
                  Caso o seu despachante oficial ou a Autoridade Tributária determine uma classificação pautal específica para o seu processo, você pode cadastrá-la aqui. O código ficará salvo em tempo real na plataforma e poderá ser usado em qualquer simulação.
                </p>
              </div>

              {sucessoCustom && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <Check size={16} />
                  <span>Código cadastrado e sincronizado com sucesso! Redirecionando...</span>
                </div>
              )}

              <form onSubmit={handleSalvarCustom} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código Pautal SH (ex: 8428.90.00 ou 8704.22.90): *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value)}
                    placeholder="ex: 8428.90.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-corp-blue/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição Oficial da Mercadoria: *
                  </label>
                  <input
                    type="text"
                    required
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    placeholder="ex: Equipamento de elevação contínua para transporte de granéis"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-corp-blue/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Direitos (DA %):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={novosDireitos}
                      onChange={(e) => setNovosDireitos(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-corp-blue/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ICE (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={novoIce}
                      onChange={(e) => setNovoIce(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-corp-blue/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      IVA (%):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={novoIva}
                      onChange={(e) => setNovoIva(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-corp-blue/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notas / Requisitos Especiais:
                  </label>
                  <textarea
                    rows={2}
                    value={novasNotas}
                    onChange={(e) => setNovasNotas(e.target.value)}
                    placeholder="ex: Isenção ao abrigo de projecto APEX / Código de Investimentos."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-corp-blue/30 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvandoCustom}
                  className="w-full py-2.5 bg-corp-blue hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer disabled:opacity-60"
                >
                  {salvandoCustom ? 'A Guardar...' : 'Salvar Código na Pauta Dinâmica'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            Em conformidade com a Lei da Pauta Aduaneira da República de Moçambique.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
