import React from 'react';
import {
  Boxes,
  Ship,
  Landmark,
  Anchor,
  Truck,
  FileText,
  BadgePercent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Percent,
  Calculator,
  Plus,
  Trash2,
  Copy,
  Info,
  Sparkles
} from 'lucide-react';
import {
  ContentorItem,
  ContentorCalculatedItem,
  CONTENTOR_SPECS,
  ContentorType
} from './contentorTypes';
import { PautaLookupWidget } from './PautaLookupWidget';
import { obterTaxasPauta } from './pautaAduaneira';

interface ContentorFclSectionProps {
  contentoresList: ContentorItem[];
  activeContentorId: string;
  setActiveContentorId: (id: string) => void;
  adicionarContentor: () => void;
  duplicarContentor: (id: string) => void;
  removerContentor: (id: string) => void;
  atualizarContentorField: (id: string, field: keyof ContentorItem, value: any) => void;
  currentContentor: ContentorItem;
  calculatedItem?: ContentorCalculatedItem;
  taxaCambio: number;
  moeda: string;
  formatoMoeda: (v: number) => string;
}

export const ContentorFclSection: React.FC<ContentorFclSectionProps> = ({
  contentoresList,
  activeContentorId,
  setActiveContentorId,
  adicionarContentor,
  duplicarContentor,
  removerContentor,
  atualizarContentorField,
  currentContentor,
  calculatedItem,
  taxaCambio,
  moeda,
  formatoMoeda
}) => {
  const spec = CONTENTOR_SPECS[currentContentor.tipoContentor] || CONTENTOR_SPECS['20_dry'];

  const aplicarTipoContentor = (tipo: ContentorType) => {
    const s = CONTENTOR_SPECS[tipo];
    atualizarContentorField(currentContentor.id, 'tipoContentor', tipo);
    atualizarContentorField(currentContentor.id, 'freteMaritimoUsd', s.freteSugeridoUsd);
    atualizarContentorField(currentContentor.id, 'kudumbaMzn', s.kudumbaSugeridoMzn);
    atualizarContentorField(currentContentor.id, 'thcPortuarioMzn', s.thcTerminalSugeridoMzn);
    atualizarContentorField(currentContentor.id, 'transporteInlandMzn', s.inlandSugeridoMzn);
  };

  const aplicarTarifaPauta = (percentual: number, codigoDesc: string) => {
    atualizarContentorField(currentContentor.id, 'direitosPerc', percentual);
    if (!currentContentor.codigoPautal || currentContentor.codigoPautal === '8482.10.00' || currentContentor.codigoPautal === 'Geral') {
      atualizarContentorField(currentContentor.id, 'codigoPautal', codigoDesc);
    }
  };

  const aplicarTarifaPautaCompleta = (tarifa: {
    codigo: string;
    descricao: string;
    direitosPerc: number;
    icePerc: number;
    ivaPerc: number;
    categoria?: string;
    notas?: string;
  }) => {
    atualizarContentorField(currentContentor.id, 'codigoPautal', tarifa.codigo);
    atualizarContentorField(currentContentor.id, 'direitosPerc', tarifa.direitosPerc);
    atualizarContentorField(currentContentor.id, 'icePerc', tarifa.icePerc);
    atualizarContentorField(currentContentor.id, 'ivaPerc', tarifa.ivaPerc);
    if (!currentContentor.descricaoCarga || currentContentor.descricaoCarga.trim() === '') {
      atualizarContentorField(currentContentor.id, 'descricaoCarga', tarifa.descricao);
    }
  };

  const aplicarDestinoInland = (destino: string) => {
    atualizarContentorField(currentContentor.id, 'destinoInland', destino);
    const is40 = currentContentor.tipoContentor.includes('40');
    if (destino === 'maputo_matola') {
      atualizarContentorField(currentContentor.id, 'transporteInlandMzn', is40 ? 32000 : 24000);
    } else if (destino === 'boane') {
      atualizarContentorField(currentContentor.id, 'transporteInlandMzn', is40 ? 46000 : 36000);
    } else if (destino === 'beira_dondo') {
      atualizarContentorField(currentContentor.id, 'transporteInlandMzn', is40 ? 35000 : 26000);
    } else if (destino === 'nacala') {
      atualizarContentorField(currentContentor.id, 'transporteInlandMzn', is40 ? 38000 : 28000);
    } else if (destino === 'retirada_porto') {
      atualizarContentorField(currentContentor.id, 'transporteInlandMzn', 0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Tabs: Lista de Contentores */}
      <section className="bento-item !p-5 md:!p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-2">
              <Boxes size={16} /> Contentores no Embarque ({contentoresList.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulação FCL (Full Container Load) com desembaraço aduaneiro oficial em Moçambique.
            </p>
          </div>
          <button
            type="button"
            onClick={adicionarContentor}
            className="text-xs font-bold text-corp-orange hover:text-corp-orange/80 flex items-center gap-1.5 self-start sm:self-auto uppercase tracking-wider bg-corp-orange/10 px-3 py-1.5 rounded-lg border border-corp-orange/20 cursor-pointer"
          >
            <Plus size={14} /> Adicionar Outro Contentor
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {contentoresList.map((c, idx) => {
            const isActive = c.id === currentContentor.id;
            const itemSpec = CONTENTOR_SPECS[c.tipoContentor] || CONTENTOR_SPECS['20_dry'];
            return (
              <div
                key={c.id}
                onClick={() => setActiveContentorId(c.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-corp-blue text-white border-corp-blue shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {itemSpec.nome}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicarContentor(c.id);
                      }}
                      className="p-1 hover:text-corp-orange transition-colors"
                      title="Duplicar este contentor"
                    >
                      <Copy size={13} />
                    </button>
                    {contentoresList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removerContentor(c.id);
                        }}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Remover contentor"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-bold text-xs truncate mb-1">
                  #{idx + 1}: {c.descricaoCarga || 'Mercadoria Geral'}
                </p>
                <div className={`text-[10px] flex justify-between font-medium ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  <span>FOB: ${Number(c.valorFobUsd) || 0}</span>
                  <span>Frete: ${Number(c.freteMaritimoUsd) || 0}</span>
                  <span>Qtd: {c.quantidade}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1. Escolha do Modelo de Contentor & Dados Básicos */}
      <section className="bento-item !p-6 md:!p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px] font-bold text-corp-blue">01</span>
            Especificações do Contentor & Carga
          </h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Capacidade Útil: {spec.capacidadeCbm} m³ | Carga Máx: {(spec.capacidadeCargaKg / 1000).toFixed(1)} Toneladas
          </span>
        </div>

        {/* Container Selector Pills */}
        <div className="mb-6">
          <label className="label-corp mb-2 block">Selecione o Modelo de Contentor Marítimo:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {(Object.keys(CONTENTOR_SPECS) as ContentorType[]).map((tipoKey) => {
              const s = CONTENTOR_SPECS[tipoKey];
              const isSelected = currentContentor.tipoContentor === tipoKey;
              return (
                <button
                  key={tipoKey}
                  type="button"
                  onClick={() => aplicarTipoContentor(tipoKey)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-corp-blue text-white border-corp-blue shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs leading-tight mb-1">{s.nome}</p>
                  <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                    {s.capacidadeCbm} m³ • até {(s.capacidadeCargaKg / 1000).toFixed(0)}t
                  </p>
                  <p className={`text-[9px] mt-1 font-semibold ${isSelected ? 'text-corp-orange' : 'text-emerald-600'}`}>
                    Frete Est.: ${s.freteSugeridoUsd}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 mt-3 flex items-start gap-2.5 text-xs text-blue-900">
            <Info size={16} className="text-corp-blue shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{spec.nome}: </span>
              {spec.descricao} Medidas internas: {spec.dimensoesInternas}.
            </div>
          </div>
        </div>

        {/* Inputs Básicos do Contentor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="label-corp !mb-0">Descrição da Mercadoria / Carga</label>
              <button
                type="button"
                onClick={() => {
                  const query = currentContentor.descricaoCarga || currentContentor.codigoPautal;
                  if (query) {
                    const res = obterTaxasPauta(query);
                    aplicarTarifaPautaCompleta(res);
                  }
                }}
                className="text-[9px] font-bold text-corp-blue hover:text-corp-blue-light flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                title="Puxar código e taxas da Pauta Aduaneira automaticamente"
              >
                <Sparkles size={10} className="text-amber-500 animate-pulse" /> Puxar da Pauta
              </button>
            </div>
            <input
              type="text"
              value={currentContentor.descricaoCarga}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'descricaoCarga', e.target.value)}
              onBlur={() => {
                if (currentContentor.descricaoCarga && currentContentor.descricaoCarga.trim().length >= 3) {
                  const res = obterTaxasPauta(currentContentor.descricaoCarga);
                  if (res.encontrado) {
                    aplicarTarifaPautaCompleta(res);
                  }
                }
              }}
              className="input-modern"
              placeholder="Ex: Rolamentos Industriais, Geradores, Painéis Solares, Camião..."
            />
          </div>

          <div>
            <label className="label-corp">Quantidade de Contentores</label>
            <input
              type="number"
              min="1"
              step="1"
              value={currentContentor.quantidade}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'quantidade', e.target.value)}
              className="input-modern"
              placeholder="1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label-corp !mb-0">Código Pautal / HS Code</label>
              <button
                type="button"
                onClick={() => {
                  const query = currentContentor.codigoPautal || currentContentor.descricaoCarga;
                  if (query) {
                    const res = obterTaxasPauta(query);
                    aplicarTarifaPautaCompleta(res);
                  }
                }}
                className="text-[9px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                title="Auto-detectar taxas da pauta para este código ou descrição"
              >
                <Sparkles size={10} className="text-amber-500" /> Auto-Taxas
              </button>
            </div>
            <input
              type="text"
              value={currentContentor.codigoPautal}
              onChange={(e) => {
                const val = e.target.value;
                atualizarContentorField(currentContentor.id, 'codigoPautal', val);
                if (val && val.trim().length >= 4) {
                  const res = obterTaxasPauta(val);
                  if (res.encontrado) {
                    atualizarContentorField(currentContentor.id, 'direitosPerc', res.direitosPerc);
                    atualizarContentorField(currentContentor.id, 'icePerc', res.icePerc);
                    atualizarContentorField(currentContentor.id, 'ivaPerc', res.ivaPerc);
                  }
                }
              }}
              onBlur={() => {
                if (currentContentor.codigoPautal && currentContentor.codigoPautal.trim().length >= 3) {
                  const res = obterTaxasPauta(currentContentor.codigoPautal);
                  if (res.encontrado) {
                    aplicarTarifaPautaCompleta(res);
                  }
                }
              }}
              className="input-modern"
              placeholder="Ex: 8482.10.00 ou 8502"
            />
          </div>

          <div>
            <label className="label-corp">Peso Total da Carga (Kg)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.pesoTotalKg}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'pesoTotalKg', e.target.value)}
              className="input-modern"
              placeholder="Ex: 18500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              = {((Number(currentContentor.pesoTotalKg) || 0) / 1000).toFixed(2)} Toneladas (Máx: {(spec.capacidadeCargaKg / 1000).toFixed(1)}t)
            </span>
          </div>

          <div>
            <label className="label-corp">Volume Real Ocupado (CBM)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.volumeUtilizadoCbm}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'volumeUtilizadoCbm', e.target.value)}
              className="input-modern"
              placeholder="Ex: 28"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Capacidade do contentor: {spec.capacidadeCbm} m³
            </span>
          </div>

          <div>
            <label className="label-corp">Porto de Origem</label>
            <input
              type="text"
              value={currentContentor.portoOrigem}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'portoOrigem', e.target.value)}
              className="input-modern"
              placeholder="Ex: Ningbo / Shanghai, China"
            />
          </div>

          <div>
            <label className="label-corp">Porto de Destino em Moçambique</label>
            <select
              value={currentContentor.portoDestino}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'portoDestino', e.target.value)}
              className="input-modern cursor-pointer"
            >
              <option value="Porto de Maputo (DP World Terminal)">Porto de Maputo (DP World Terminal)</option>
              <option value="Porto da Beira (Cornelder de Moçambique)">Porto da Beira (Cornelder de Moçambique)</option>
              <option value="Porto de Nacala (CDN)">Porto de Nacala (CDN)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Valores Comerciais & Frete Internacional FCL (USD) */}
      <section className="bento-item !p-6 md:!p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px] font-bold text-corp-blue">02</span>
            Valores Comerciais & Frete Internacional (USD)
          </h3>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Câmbio: 1 USD = {taxaCambio} MZN
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <label className="label-corp">Valor da Mercadoria FOB (USD)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="any"
                value={currentContentor.valorFobUsd}
                onChange={(e) => {
                  const val = e.target.value;
                  atualizarContentorField(currentContentor.id, 'valorFobUsd', val);
                  // Atualizar seguro padrão (~1% do FOB) se não editado
                  if (!currentContentor.seguroMaritimoUsd || Number(currentContentor.seguroMaritimoUsd) === (Number(currentContentor.valorFobUsd) * 0.01)) {
                    atualizarContentorField(currentContentor.id, 'seguroMaritimoUsd', (Number(val) * 0.01).toFixed(0));
                  }
                }}
                className="input-modern !pl-8 font-bold"
                placeholder="Ex: 16000"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              = MZN {formatoMoeda((Number(currentContentor.valorFobUsd) || 0) * taxaCambio)}
            </span>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <label className="label-corp">Frete Marítimo FCL por Contentor (USD)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="any"
                value={currentContentor.freteMaritimoUsd}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'freteMaritimoUsd', e.target.value)}
                className="input-modern !pl-8 font-bold"
                placeholder="Ex: 2400"
              />
            </div>
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => atualizarContentorField(currentContentor.id, 'freteMaritimoUsd', spec.freteSugeridoUsd)}
                className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
              >
                Padrão ({spec.nome.includes('20') ? '$2.400' : '$3.850'})
              </button>
            </div>
          </div>

          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <label className="label-corp">Seguro Marítimo Internacional (USD)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="any"
                value={currentContentor.seguroMaritimoUsd}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'seguroMaritimoUsd', e.target.value)}
                className="input-modern !pl-8 font-bold"
                placeholder="Ex: 160"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Geralmente 0.5% a 1.0% do FOB
            </span>
          </div>
        </div>

        {/* Resumo do Valor Aduaneiro CIF */}
        {calculatedItem && (
          <div className="mt-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">
                Valor Aduaneiro Oficial (CIF Porto de Entrada)
              </p>
              <p className="text-xs text-slate-300">
                Base legal para o cálculo dos Direitos Aduaneiros e do IVA das Alfândegas de Moçambique.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black font-heading text-emerald-400">
                ${formatoMoeda(calculatedItem.cifUsdTotal)} USD
              </p>
              <p className="text-xs font-semibold text-slate-300">
                {formatoMoeda(calculatedItem.cifMznTotal)} MZN
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. PARTE 1: Impostos e Despesas do Estado (Pauta Aduaneira de Moçambique) */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
              Parte 1 da Fatura Oficial
            </span>
            <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
              <Landmark size={16} /> Impostos Aduaneiros & Taxas do Estado (DU Oficial)
            </h3>
          </div>
          {calculatedItem && (
            <span className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              Subtotal Estado: {formatoMoeda(calculatedItem.subtotalAlfandegaMzn)} MZN (${formatoMoeda(calculatedItem.subtotalAlfandegaUsd)} USD)
            </span>
          )}
        </div>

        {/* Consulta & Automação da Pauta Aduaneira de Moçambique */}
        <div className="mb-6">
          <PautaLookupWidget
            codigoAtual={currentContentor.codigoPautal}
            descricaoAtual={currentContentor.descricaoCarga}
            direitosAtual={currentContentor.direitosPerc}
            iceAtual={currentContentor.icePerc}
            ivaAtual={currentContentor.ivaPerc}
            onSelectTarifa={aplicarTarifaPautaCompleta}
            modo="contentor"
          />
        </div>

        {/* Inputs de Impostos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="label-corp">Direitos Aduaneiros (%)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.direitosPerc}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'direitosPerc', e.target.value)}
              className="input-modern"
              placeholder="Ex: 5 ou 20"
            />
            {calculatedItem && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                = MZN {formatoMoeda(calculatedItem.direitosMzn)} ({currentContentor.direitosPerc}% do CIF)
              </span>
            )}
          </div>

          <div>
            <label className="label-corp">ICE - Imposto Consumos Específicos (%)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.icePerc}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'icePerc', e.target.value)}
              className="input-modern"
              placeholder="0"
            />
            {calculatedItem && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                = MZN {formatoMoeda(calculatedItem.iceMzn)}
              </span>
            )}
          </div>

          <div>
            <label className="label-corp">IVA Alfandegário (%)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.ivaPerc}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'ivaPerc', e.target.value)}
              className="input-modern"
              placeholder="16"
            />
            {calculatedItem && (
              <span className="text-[10px] text-slate-500 mt-1 block">
                = MZN {formatoMoeda(calculatedItem.ivaMzn)} (16% sobre CIF + DA + ICE)
              </span>
            )}
          </div>
        </div>

        {/* Taxas Aduaneiras Regulamentares */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-3">
            Taxas Aduaneiras Regulamentares Oficiais (Por Contentor / DU):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-corp">TSA - Taxa Serviços Aduaneiros (MZN)</label>
              <input
                type="number"
                step="any"
                value={currentContentor.tsaAduaneiroMzn}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'tsaAduaneiroMzn', e.target.value)}
                className="input-modern"
                placeholder="1250"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">Oficial das Alfândegas de Moçambique</span>
            </div>

            <div>
              <label className="label-corp">MCNET - Janela Única Eletrónica (MZN)</label>
              <input
                type="number"
                step="any"
                value={currentContentor.mcnetMzn}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'mcnetMzn', e.target.value)}
                className="input-modern"
                placeholder="1550"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">Processamento eletrónico JUE/DU</span>
            </div>

            <div>
              <label className="label-corp">Kudumba - Scanner FCL (MZN)</label>
              <input
                type="number"
                step="any"
                value={currentContentor.kudumbaMzn}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'kudumbaMzn', e.target.value)}
                className="input-modern"
                placeholder="3850"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">
                Scanner {spec.nome.includes('20') ? "20' (3.850 MT)" : "40' (6.200 MT)"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PARTE 2: Taxas Portuárias e Terminais (DP World / Cornelder) */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest bg-blue-100 px-2 py-0.5 rounded-full inline-block mb-1">
              Parte 2 da Fatura Oficial
            </span>
            <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
              <Anchor size={16} /> Taxas Portuárias & Terminal de Contentores (DP World / Cornelder)
            </h3>
          </div>
          {calculatedItem && (
            <span className="text-sm font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              Subtotal Porto: {formatoMoeda(calculatedItem.subtotalPortoTerminalMzn)} MZN (${formatoMoeda(calculatedItem.subtotalPortoTerminalUsd)} USD)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-corp">THC Portuário - Descarga e Movimentação (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.thcPortuarioMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'thcPortuarioMzn', e.target.value)}
              className="input-modern"
              placeholder="14500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Terminal Handling Charge ({spec.nome.includes('20') ? "20' ~14.500 MT" : "40' ~24.500 MT"})
            </span>
          </div>

          <div>
            <label className="label-corp">Segurança Portuária & Liberação ISPS (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.taxaSegurancaPortoMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'taxaSegurancaPortoMzn', e.target.value)}
              className="input-modern"
              placeholder="3500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Port Security & Terminal Release</span>
          </div>

          <div>
            <label className="label-corp">Armazenagem Portuária Prevista (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.armazenagemTerminalMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'armazenagemTerminalMzn', e.target.value)}
              className="input-modern"
              placeholder="0"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Franquia de 10 dias livres. 0 MT se despachado a tempo.
            </span>
          </div>
        </div>
      </section>

      {/* 5. PARTE 3: Despesas da Linha de Navegação (Shipping Line / Agência Marítima) */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-indigo-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-full inline-block mb-1">
              Parte 3 da Fatura Oficial
            </span>
            <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
              <Ship size={16} /> Linha de Navegação & Agência Marítima (Maersk, MSC, COSCO)
            </h3>
          </div>
          {calculatedItem && (
            <span className="text-sm font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
              Subtotal Linha: {formatoMoeda(calculatedItem.subtotalLinhaNavegacaoMzn)} MZN (${formatoMoeda(calculatedItem.subtotalLinhaNavegacaoUsd)} USD)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-corp">D.O. - Delivery Order / Liberação de BL (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.deliveryOrderMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'deliveryOrderMzn', e.target.value)}
              className="input-modern"
              placeholder="8500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Taxa de emissão da ordem de entrega marítima</span>
          </div>

          <div>
            <label className="label-corp">Limpeza & Desmagnetização do Contentor (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.limpezaDesmagnetizacaoMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'limpezaDesmagnetizacaoMzn', e.target.value)}
              className="input-modern"
              placeholder="4500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Container washing & inspection fee</span>
          </div>

          <div>
            <label className="label-corp">Caução / Seguro Contentor Vazio (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.caucaoContentorMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'caucaoContentorMzn', e.target.value)}
              className="input-modern"
              placeholder="6000"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Seguro de demoras / devolução de vazio</span>
          </div>
        </div>
      </section>

      {/* 6. PARTE 4: Despachante Aduaneiro, Transporte Terrestre (Inland) & PrimeWay */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-emerald-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
              Parte 4 da Fatura Oficial
            </span>
            <h3 className="font-heading font-semibold text-xs text-corp-blue uppercase tracking-[0.3em] flex items-center gap-3">
              <Truck size={16} /> Despachante Aduaneiro, Transporte Terrestre & PrimeWay
            </h3>
          </div>
          {calculatedItem && (
            <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Subtotal Logística: {formatoMoeda(calculatedItem.subtotalLogisticaPrimewayMzn)} MZN (${formatoMoeda(calculatedItem.subtotalLogisticaPrimewayUsd)} USD)
            </span>
          )}
        </div>

        {/* Despachante & Documentos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label-corp">Honorários do Despachante Aduaneiro Oficial (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.honorariosDespachanteMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'honorariosDespachanteMzn', e.target.value)}
              className="input-modern"
              placeholder="22000"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Desembaraço aduaneiro completo, vistoria física e encerramento de DU
            </span>
          </div>

          <div>
            <label className="label-corp">Pastas Aduaneiras & Comunicações (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.documentacaoPastasMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'documentacaoPastasMzn', e.target.value)}
              className="input-modern"
              placeholder="3500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Expediente, impressos e arquivo fiscal</span>
          </div>
        </div>

        {/* Transporte Inland / Camião Porta-Contentores */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <label className="label-corp mb-2 block">
            Transporte Terrestre Porta-Contentores (Camião com semi-reboque porta-contentor):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Destino de Entrega Inland:</label>
              <select
                value={currentContentor.destinoInland}
                onChange={(e) => aplicarDestinoInland(e.target.value)}
                className="input-modern cursor-pointer"
              >
                <option value="maputo_matola">Grande Maputo & Matola (Porto de Maputo → Armazém)</option>
                <option value="boane">Boane / Moamba / Marracuene / Ressano Garcia</option>
                <option value="beira_dondo">Grande Beira & Dondo (Porto da Beira → Armazém)</option>
                <option value="nacala">Nacala / Nampula (Porto de Nacala → Armazém)</option>
                <option value="retirada_porto">Sem Transporte Inland (Levantamento no Porto pelo Cliente)</option>
                <option value="manual">Outro Destino (Valor Personalizado)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Custo do Frete Terrestre (MZN):</label>
              <input
                type="number"
                step="any"
                value={currentContentor.transporteInlandMzn}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'transporteInlandMzn', e.target.value)}
                className="input-modern"
                placeholder="24000"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">
                Por contentor ({spec.nome.includes('20') ? '20 pés' : '40 pés'})
              </span>
            </div>
          </div>
        </div>

        {/* Honorários de Agenciamento PrimeWay (Totalmente Negociável) */}
        <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                <BadgePercent size={16} className="text-emerald-700" />
                Honorários de Assessoria & Agenciamento PrimeWay
              </h4>
              <p className="text-[11px] text-emerald-800">
                Valor negociável por operação para coordenação internacional, acompanhamento portuário e encerramento cambial bancário.
              </p>
            </div>
            <div className="flex bg-white rounded-lg p-0.5 border border-emerald-300">
              <button
                type="button"
                onClick={() => atualizarContentorField(currentContentor.id, 'tipoHonorariosPrimeway', 'fixo')}
                className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  currentContentor.tipoHonorariosPrimeway === 'fixo'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valor Fixo (MZN)
              </button>
              <button
                type="button"
                onClick={() => atualizarContentorField(currentContentor.id, 'tipoHonorariosPrimeway', 'percentual')}
                className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                  currentContentor.tipoHonorariosPrimeway === 'percentual'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comissão (% sobre CIF)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {currentContentor.tipoHonorariosPrimeway === 'fixo' ? (
              <div>
                <label className="label-corp">Honorários PrimeWay (MZN Fixo)</label>
                <input
                  type="number"
                  step="any"
                  value={currentContentor.honorariosPrimewayMzn}
                  onChange={(e) => atualizarContentorField(currentContentor.id, 'honorariosPrimewayMzn', e.target.value)}
                  className="input-modern font-bold text-emerald-950"
                  placeholder="15000"
                />
                <span className="text-[10px] text-emerald-700 mt-1 block">
                  Valor acordado na negociação com o cliente
                </span>
              </div>
            ) : (
              <div>
                <label className="label-corp">Percentual sobre CIF (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={currentContentor.honorariosPrimewayPerc}
                    onChange={(e) => atualizarContentorField(currentContentor.id, 'honorariosPrimewayPerc', e.target.value)}
                    className="input-modern font-bold text-emerald-950"
                    placeholder="2.5"
                  />
                  {calculatedItem && (
                    <div className="bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900 whitespace-nowrap flex items-center">
                      = {formatoMoeda(calculatedItem.honorariosPrimewayMzn)} MZN
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. PAINEL DE INTELIGÊNCIA ESTRATÉGICA: Custo por CBM & FCL vs LCL (Grupagem) */}
      {calculatedItem && (
        <section className="bento-item !p-6 md:!p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-corp-blue text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-corp-orange/20 border border-corp-orange/40 flex items-center justify-center text-corp-orange">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base uppercase tracking-wider text-white">
                Análise Estratégica & Comparativo: Contentor Inteiro (FCL) vs Grupagem (LCL)
              </h3>
              <p className="text-xs text-slate-300">
                Apoio à decisão para clientes: quando compensa fechar um contentor e quando compensa a grupagem.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Custo Efetivo por CBM */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                Custo Efetivo por Metro Cúbico (CBM)
              </p>
              <p className="text-3xl font-black font-heading text-corp-orange">
                ${formatoMoeda(calculatedItem.custoPorCbmUsd)} USD
              </p>
              <p className="text-xs text-slate-300 mt-1">
                = {formatoMoeda(calculatedItem.custoPorCbmMzn)} MZN por m³
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                Calculado com base em <strong className="text-white">{calculatedItem.volumeUtilizadoCbm} m³</strong> faturados num contentor de {spec.capacidadeCbm} m³.
              </div>
            </div>

            {/* Taxa de Ocupação */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                Taxa de Ocupação do Contentor
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-heading text-white">
                  {calculatedItem.taxaOcupacaoPerc.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-300">
                  ({calculatedItem.volumeUtilizadoCbm} de {spec.capacidadeCbm} m³)
                </span>
              </div>
              {/* Barra de progresso */}
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    calculatedItem.taxaOcupacaoPerc > 70
                      ? 'bg-emerald-400'
                      : calculatedItem.taxaOcupacaoPerc > 35
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, calculatedItem.taxaOcupacaoPerc)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-300 mt-2">
                {calculatedItem.taxaOcupacaoPerc < 40 ? (
                  <span className="text-amber-300 font-semibold">
                    ⚠️ Atenção: Carga com menos de 40% de ocupação. Se não for exigência bancária de DU exclusivo, a Grupagem LCL pode sair mais económica!
                  </span>
                ) : (
                  <span className="text-emerald-300 font-semibold">
                    Excelente aproveitamento de espaço! O frete FCL maximiza a rentabilidade.
                  </span>
                )}
              </p>
            </div>

            {/* Comparativo Grupagem LCL */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
                Simulação se fosse Grupagem LCL (~$380/m³)
              </p>
              <p className="text-2xl font-bold font-heading text-slate-200">
                ${formatoMoeda(calculatedItem.estimativaGrupagemLclUsd)} USD
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs">
                {calculatedItem.volumeUtilizadoCbm <= 10 ? (
                  <div className="text-amber-300">
                    <span className="font-bold">Para cargas pequenas (ex: 3 m³):</span> A Grupagem PrimeWay poupa despesas fixas de porto, Kudumba e linha de navegação. No entanto, o contentor inteiro confere DU próprio em nome do cliente para fecho de câmbio bancário!
                  </div>
                ) : (
                  <div className="text-emerald-300">
                    <span className="font-bold">Economia de Escala:</span> Para este volume ({calculatedItem.volumeUtilizadoCbm} m³), o Contentor Inteiro compensa imenso comparado com mandar em grupagem fracionada!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divisão Visual das 4 Partes */}
          <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Composição Oficial dos Custos no Destino (Moçambique):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">1. Estado & Alfândegas</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalAlfandegaMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Direitos ({currentContentor.direitosPerc}%) + IVA (16%) + TSA + JUE + Kudumba
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-blue-500/30">
                <span className="text-[10px] font-bold text-blue-400 uppercase block">2. Porto & Terminais</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalPortoTerminalMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  THC Descarga + Segurança ISPS + Armazenagem
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-indigo-500/30">
                <span className="text-[10px] font-bold text-indigo-400 uppercase block">3. Linha de Navegação</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalLinhaNavegacaoMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Delivery Order (D.O.) + Lavagem/Desmagnetização + Caução
                </span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">4. Despachante & Inland</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalLogisticaPrimewayMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Despachante Oficial + Camião Porta-Contentores + PrimeWay
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
