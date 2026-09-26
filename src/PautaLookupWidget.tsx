import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Check, BookOpen, AlertCircle, ChevronDown, X, Globe, ArrowRight, RefreshCw } from 'lucide-react';
import { buscarPautaAduaneira, obterTaxasPauta, PautaItem, PAUTA_MOCAMBIQUE, consultarPautaTempoReal } from './pautaAduaneira';
import { RealTimeTariffCenter } from './components/RealTimeTariffCenter';

interface PautaLookupWidgetProps {
  codigoAtual?: string;
  descricaoAtual?: string;
  direitosAtual?: number | string;
  iceAtual?: number | string;
  ivaAtual?: number | string;
  onSelectTarifa: (tarifa: {
    codigo: string;
    descricao: string;
    direitosPerc: number;
    icePerc: number;
    ivaPerc: number;
    categoria?: string;
    notas?: string;
  }) => void;
  compact?: boolean;
  modo?: 'contentor' | 'veiculo' | 'geral';
}

export const PautaLookupWidget: React.FC<PautaLookupWidgetProps> = ({
  codigoAtual = '',
  descricaoAtual = '',
  direitosAtual,
  iceAtual,
  ivaAtual,
  onSelectTarifa,
  compact = false,
  modo = 'contentor'
}) => {
  const [searchTerm, setSearchTerm] = useState(codigoAtual || descricaoAtual || '');
  const [isOpen, setIsOpen] = useState(false);
  const [resultados, setResultados] = useState<PautaItem[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincronizar busca se código ou descrição mudarem externamente
  useEffect(() => {
    if (codigoAtual) {
      setSearchTerm(codigoAtual);
    } else if (descricaoAtual) {
      setSearchTerm(descricaoAtual);
    }
  }, [codigoAtual, descricaoAtual]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length >= 1) {
      const hits = buscarPautaAduaneira(term, 8);
      setResultados(hits);
      setIsOpen(true);
    } else {
      setResultados(PAUTA_MOCAMBIQUE.slice(0, 6));
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: {
    codigo: string;
    descricao: string;
    direitosPerc: number;
    icePerc: number;
    ivaPerc: number;
    categoria?: string;
    notas?: string;
  }) => {
    onSelectTarifa({
      codigo: item.codigo,
      descricao: item.descricao,
      direitosPerc: item.direitosPerc,
      icePerc: item.icePerc,
      ivaPerc: item.ivaPerc,
      categoria: item.categoria,
      notas: item.notas
    });
    setSearchTerm(`${item.codigo} - ${item.descricao}`);
    setIsOpen(false);
    setFeedbackMsg(`Taxas aplicadas: ${item.codigo} (DA: ${item.direitosPerc}%, ICE: ${item.icePerc}%, IVA: ${item.ivaPerc}%)`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOnlineRealtimeLookup = async (termoParaConsultar?: string) => {
    const query = termoParaConsultar || searchTerm || codigoAtual || descricaoAtual;
    if (!query || !query.trim()) {
      setFeedbackMsg('Digite um código ou descrição para consultar a pauta em tempo real.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }

    setIsSearchingOnline(true);
    try {
      const res = await consultarPautaTempoReal(query);
      handleSelectItem(res);
      setFeedbackMsg(`🟢 Pauta em Tempo Real: ${res.codigo} (DA: ${res.direitosPerc}% | ICE: ${res.icePerc}% | IVA: ${res.ivaPerc}%)`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (e) {
      console.error('Erro na consulta em tempo real:', e);
      handleAutoDetect();
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleAutoDetect = () => {
    const query = searchTerm || codigoAtual || descricaoAtual;
    if (!query) {
      setFeedbackMsg('Digite um código ou descrição para consultar a pauta.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      return;
    }
    const res = obterTaxasPauta(query);
    handleSelectItem(res);
    setFeedbackMsg(`Taxas oficiais aplicadas: DA ${res.direitosPerc}% | ICE ${res.icePerc}% | IVA ${res.ivaPerc}%`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="bg-gradient-to-r from-amber-500/10 via-blue-500/5 to-emerald-500/10 border border-amber-300/60 rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-corp-blue text-white shadow-sm flex items-center justify-center">
              <BookOpen size={14} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                Pauta Aduaneira de Moçambique
                <span className="flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tempo Real Ativo
                </span>
                <span className="text-[9px] bg-blue-100 text-corp-blue font-extrabold px-2 py-0.5 rounded-full border border-blue-300">
                  SH Moçambique
                </span>
              </p>
              <p className="text-[10px] text-slate-500">
                Pesquise qualquer produto ou código SH para carregar alíquotas oficiais de Direitos, ICE e IVA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsCenterOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg text-[11px] font-bold hover:from-emerald-700 hover:to-teal-800 shadow-sm transition-all cursor-pointer"
              title="Abrir Central da Pauta Aduaneira Completa em Tempo Real"
            >
              <Globe size={13} className="text-emerald-200" />
              Central Tempo Real
            </button>

            <button
              type="button"
              onClick={() => handleOnlineRealtimeLookup()}
              disabled={isSearchingOnline}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-corp-blue text-white rounded-lg text-[11px] font-bold hover:bg-corp-blue/90 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              title="Auto-detectar taxas oficiais em tempo real"
            >
              {isSearchingOnline ? (
                <>
                  <RefreshCw size={13} className="text-amber-300 animate-spin" />
                  <span>A Consultar...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300 animate-pulse" />
                  <span>Auto-Preencher Taxas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input de Busca com Dropdown Inteligente */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleOnlineRealtimeLookup();
                }
              }}
              onFocus={() => {
                if (!searchTerm) {
                  setResultados(PAUTA_MOCAMBIQUE.slice(0, 8));
                } else {
                  setResultados(buscarPautaAduaneira(searchTerm, 8));
                }
                setIsOpen(true);
              }}
              placeholder="Digite qualquer código SH (ex: 8422.40.00, 8541, 8704) ou produto (ex: embaladora, painel solar, gerador, resina)..."
              className="w-full pl-9 pr-24 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-corp-blue/20 focus:border-corp-blue outline-none transition-all shadow-sm placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="absolute right-12 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleOnlineRealtimeLookup()}
              className="absolute right-6 text-corp-blue hover:text-blue-800 p-1 cursor-pointer"
              title="Buscar em Tempo Real"
            >
              <Sparkles size={14} className="text-amber-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isOpen) {
                  setResultados(buscarPautaAduaneira(searchTerm || '', 8));
                }
                setIsOpen(!isOpen);
              }}
              className="absolute right-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Dropdown de Resultados da Pauta */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Botão de Busca em Tempo Real no topo do Dropdown */}
              <div 
                onClick={() => handleOnlineRealtimeLookup()}
                className="p-2.5 bg-gradient-to-r from-blue-50 via-emerald-50 to-amber-50 hover:from-blue-100 hover:to-emerald-100 text-corp-blue font-bold text-xs flex items-center justify-between cursor-pointer border-b border-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  <span>Consultar "{searchTerm || 'produto'}" em Tempo Real na Pauta Oficial</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                  Buscar Agora <ArrowRight size={11} />
                </span>
              </div>

              <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between sticky top-0 z-10 border-b border-slate-200">
                <span>Resultados Rápidos Indexados ({resultados.length})</span>
                <span className="text-[9px] text-corp-blue">Clique para aplicar</span>
              </div>

              {resultados.map((item) => (
                <div
                  key={item.codigo}
                  onClick={() => handleSelectItem(item)}
                  className="p-3 hover:bg-amber-50/70 cursor-pointer transition-colors text-left group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-bold text-corp-blue group-hover:text-amber-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.codigo}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 truncate">
                          {item.categoria}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-slate-900">
                        {item.descricao}
                      </p>
                      {item.notas && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.notas}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200" title="Direitos Aduaneiros">
                        DA: {item.direitosPerc}%
                      </span>
                      {item.icePerc > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200" title="Imposto sobre Consumos Específicos">
                          ICE: {item.icePerc}%
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200" title="Imposto sobre Valor Acrescentado">
                        IVA: {item.ivaPerc}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Atalhos Rápidos por Categoria Mais Comum */}
        {!compact && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Atalhos Rápidos da Pauta de Moçambique:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  handleOnlineRealtimeLookup('8422.40.00');
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                📦 Embaladoras (8422.40)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8482.10.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                ⚙️ Rolamentos (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8471.30.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                💻 Laptops / PCs (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8541.43.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                ☀️ Painéis Solares (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8502.11.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                ⚡ Geradores Diesel (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8704.22.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                🚛 Camiões / Pesados (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '8413.40.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                🏗️ Bombas Betão (5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '7214.20.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 cursor-pointer transition-all"
              >
                🔩 Ferro / Varão (7.5% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleOnlineRealtimeLookup('3105.20.00');
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 rounded-md border border-emerald-200 cursor-pointer transition-all"
              >
                🌱 Fertilizantes NPK (0% DA)
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = PAUTA_MOCAMBIQUE.find(p => p.codigo === '3004.90.00');
                  if (item) handleSelectItem(item);
                }}
                className="text-[10px] font-medium px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 rounded-md border border-emerald-200 cursor-pointer transition-all"
              >
                💊 Fármacos (0% Isento)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal da Central da Pauta Aduaneira em Tempo Real */}
      <RealTimeTariffCenter
        isOpen={isCenterOpen}
        onClose={() => setIsCenterOpen(false)}
        onSelectTarifa={handleSelectItem}
      />
    </div>
  );
};
