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
  Copy
} from 'lucide-react';
import {
  ContentorItem,
  ContentorCalculatedItem,
  CONTENTOR_SPECS,
  ContentorType
} from './contentorTypes';
import { ContentorTariffLookup } from './components/ContentorTariffLookup';
import { formatHsCode, type HsTariff } from './services/hsTariffTypes';

interface ContentorFclSectionProps {
  contentoresList: ContentorItem[];
  activeContentorId: string;
  setActiveContentorId: (id: string) => void;
  adicionarContentor: () => void;
  duplicarContentor: (id: string) => void;
  removerContentor: (id: string) => void;
  atualizarContentorField: (id: string, field: keyof ContentorItem, value: any) => void;
  atualizarContentorFields: (id: string, fields: Partial<ContentorItem>) => void;
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
  atualizarContentorFields,
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

  const aplicarTarifaHs = (tariff: HsTariff) => {
    const complete = [tariff.direitosPerc, tariff.icePerc, tariff.ivaPerc].every(rate => rate !== null);
    atualizarContentorFields(currentContentor.id, {
      codigoPautal: formatHsCode(tariff.codigo),
      descricaoCarga: tariff.descricao,
      direitosPerc: tariff.direitosPerc ?? '',
      icePerc: tariff.icePerc ?? '',
      ivaPerc: tariff.ivaPerc ?? '',
      iceRegraPauta: tariff.iceRule ?? '',
      pautaEstado: complete ? 'confirmada' : 'incompleta',
    });
  };

  const alterarCodigoHs = (value: string) => {
    atualizarContentorFields(currentContentor.id, {
      codigoPautal: value,
      direitosPerc: '', icePerc: '', ivaPerc: '', iceRegraPauta: '', pautaEstado: 'pendente',
    });
  };

  const editarAliquota = (field: 'direitosPerc' | 'icePerc' | 'ivaPerc', value: string) => {
    atualizarContentorFields(currentContentor.id, { [field]: value, pautaEstado: 'manual' });
  };

  const exibirAliquota = (value: number | string) => String(value ?? '').trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100 ? `${value}%` : 'A confirmar';

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
            <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-2">
              <Boxes size={16} /> Contentores no embarque ({contentoresList.length})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              FCL · volumes, pesos e custos.
            </p>
          </div>
          <button
            type="button"
            onClick={adicionarContentor}
            className="text-xs font-bold text-corp-orange hover:text-corp-orange/80 flex items-center gap-1.5 self-start sm:self-auto bg-corp-orange/10 px-3 py-1.5 rounded-lg border border-corp-orange/20 cursor-pointer"
          >
            <Plus size={14} /> Adicionar contentor
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
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

                <button
                  type="button"
                  onClick={(event) => { event.stopPropagation(); setActiveContentorId(c.id); }}
                  aria-pressed={isActive}
                  className="block max-w-full text-left font-bold text-xs truncate mb-1 cursor-pointer"
                >
                  #{idx + 1}: {c.descricaoCarga || 'Mercadoria Geral'}
                </button>
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
          <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px] font-bold text-corp-blue">01</span>
            Especificações do contentor e carga
          </h3>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {spec.capacidadeCbm} m³ · máximo {(spec.capacidadeCargaKg / 1000).toFixed(1)} t
          </span>
        </div>

        {/* Container Selector Pills */}
        <div className="mb-6">
          <label className="label-corp mb-2 block">Modelo do contentor</label>
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
          <details className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-corp-blue">Especificações do contentor</summary>
            <p className="pt-2">
              <span className="font-semibold text-slate-800">{spec.nome}: </span>
              {spec.descricao} Dimensões internas: {spec.dimensoesInternas}.
            </p>
          </details>
        </div>

        {/* Inputs Básicos do Contentor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="label-corp">Descrição da carga</label>
            <input
              type="text"
              value={currentContentor.descricaoCarga}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'descricaoCarga', e.target.value)}
              className="input-modern"
              placeholder="Descrição da mercadoria"
              aria-label="Descrição da carga"
            />
            <p className="text-[11px] text-slate-500 mt-2">O código HS preenche-a quando disponível.</p>
          </div>

          <div>
            <label className="label-corp">Quantidade (contentores)</label>
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
            <label className="label-corp">Peso total (kg)</label>
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
            {Number(currentContentor.pesoTotalKg) > spec.capacidadeCargaKg && (
              <p role="alert" className="mt-2 text-xs text-amber-800">Peso acima do limite deste contentor. Confirme a carga.</p>
            )}
          </div>

          <div>
            <label className="label-corp">Volume (CBM)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.volumeUtilizadoCbm}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'volumeUtilizadoCbm', e.target.value)}
              className="input-modern"
              placeholder="Ex: 28"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Capacidade: {spec.capacidadeCbm} m³
            </span>
            {Number(currentContentor.volumeUtilizadoCbm) > spec.capacidadeCbm && (
              <p role="alert" className="mt-2 text-xs text-amber-800">Volume acima da capacidade deste contentor. Confirme a carga.</p>
            )}
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
            <label className="label-corp">Porto de destino</label>
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
          <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-corp-blue/5 flex items-center justify-center text-[10px] font-bold text-corp-blue">02</span>
            Compra e frete internacional
          </h3>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Câmbio: 1 USD = {taxaCambio} MZN
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="border-b border-slate-200 pb-3">
            <label className="label-corp">Valor da mercadoria FOB (USD)</label>
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

          <div className="border-b border-slate-200 pb-3">
            <label className="label-corp">Frete marítimo por contentor (USD)</label>
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

          <div className="border-b border-slate-200 pb-3">
            <label className="label-corp">Seguro marítimo (USD)</label>
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
          <div className="mt-4 bg-corp-blue text-white p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-blue-200 font-semibold">
                Valor aduaneiro CIF
              </p>
              <p className="text-xs text-slate-300">
                Base usada nos direitos e no IVA.
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

      {/* 3. Parte 1: consulta HS e impostos */}
      <section id="contentor-impostos" className="bento-item !p-6 md:!p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] text-slate-500 mb-2">Parte 1 · Estimativa de impostos</p>
            <h3 className="font-heading font-semibold text-base text-corp-blue flex items-center gap-2">
              <Landmark size={17} aria-hidden="true" /> Impostos aduaneiros e taxas do Estado
            </h3>
          </div>
          {calculatedItem && <p className="text-sm font-semibold text-corp-blue">Subtotal Estado: {calculatedItem.taxasPendentes ? 'A confirmar' : `${formatoMoeda(calculatedItem.subtotalAlfandegaMzn)} MZN`}</p>}
        </div>

        <ContentorTariffLookup
          contentorId={currentContentor.id}
          codigo={currentContentor.codigoPautal}
          manual={currentContentor.pautaEstado === 'manual'}
          onCodigoChange={alterarCodigoHs}
          onTariff={aplicarTarifaHs}
          onPending={() => atualizarContentorFields(currentContentor.id, { pautaEstado: 'pendente' })}
          onUnavailable={() => atualizarContentorFields(currentContentor.id, { pautaEstado: 'nao_encontrada' })}
        />

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 py-4 border-y border-slate-200">
          <div><dt className="text-xs text-slate-500 mb-1">Direitos aduaneiros</dt><dd className="font-heading font-semibold text-lg text-corp-blue">{exibirAliquota(currentContentor.direitosPerc)}</dd></div>
          <div><dt className="text-xs text-slate-500 mb-1">ICE</dt><dd className="font-heading font-semibold text-lg text-corp-blue">{exibirAliquota(currentContentor.icePerc)}</dd></div>
          <div><dt className="text-xs text-slate-500 mb-1">IVA alfandegário</dt><dd className="font-heading font-semibold text-lg text-corp-blue">{exibirAliquota(currentContentor.ivaPerc)}</dd></div>
        </dl>

        <details className="mt-4 group">
          <summary className="text-xs font-medium text-corp-blue cursor-pointer py-2">Confirmar ou ajustar alíquotas e taxas de processamento</summary>
          <div className="pt-4 space-y-5">
            <p className="text-[11px] text-slate-500">A edição manual mantém os seus valores. Uma alíquota em branco na base não significa 0% nem isenção.</p>
            {currentContentor.iceRegraPauta && <p className="text-xs text-amber-800">ICE na pauta: {currentContentor.iceRegraPauta}. Este simulador usa percentagens; uma percentagem equivalente tem de ser confirmada pelo despachante, pois esta regra não é convertida automaticamente.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-corp" htmlFor={`da-${currentContentor.id}`}>Direitos aduaneiros (%)</label>
                <input id={`da-${currentContentor.id}`} type="number" min="0" max="100" step="any" value={currentContentor.direitosPerc} onChange={event => editarAliquota('direitosPerc', event.target.value)} className="input-modern" placeholder="A confirmar" />
                {calculatedItem && <p className="text-[11px] text-slate-500 mt-1">Base: valor CIF.</p>}
              </div>
              <div>
                <label className="label-corp" htmlFor={`ice-${currentContentor.id}`}>ICE (%)</label>
                <input id={`ice-${currentContentor.id}`} type="number" min="0" max="100" step="any" value={currentContentor.icePerc} onChange={event => editarAliquota('icePerc', event.target.value)} className="input-modern" placeholder="A confirmar" />
                <p className="text-[11px] text-slate-500 mt-1">Base: CIF + direitos aduaneiros.</p>
              </div>
              <div>
                <label className="label-corp" htmlFor={`iva-${currentContentor.id}`}>IVA alfandegário (%)</label>
                <input id={`iva-${currentContentor.id}`} type="number" min="0" max="100" step="any" value={currentContentor.ivaPerc} onChange={event => editarAliquota('ivaPerc', event.target.value)} className="input-modern" placeholder="A confirmar" />
                <p className="text-[11px] text-slate-500 mt-1">Base: CIF + direitos aduaneiros + ICE.</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-700 mb-1">Taxas de processamento (por contentor / DU)</p>
              <p className="text-[11px] text-slate-500 mb-3">Dependem da operação e não são determinadas pelo código HS. Confirme os valores antes do despacho.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label htmlFor={`tsa-${currentContentor.id}`} className="label-corp">TSA — serviços aduaneiros (MZN)</label><input id={`tsa-${currentContentor.id}`} type="number" min="0" step="any" value={currentContentor.tsaAduaneiroMzn} onChange={event => atualizarContentorField(currentContentor.id, 'tsaAduaneiroMzn', event.target.value)} className="input-modern" /></div>
                <div><label htmlFor={`mcnet-${currentContentor.id}`} className="label-corp">MCNET — Janela Única (MZN)</label><input id={`mcnet-${currentContentor.id}`} type="number" min="0" step="any" value={currentContentor.mcnetMzn} onChange={event => atualizarContentorField(currentContentor.id, 'mcnetMzn', event.target.value)} className="input-modern" /></div>
                <div><label htmlFor={`kudumba-${currentContentor.id}`} className="label-corp">Kudumba — scanner (MZN)</label><input id={`kudumba-${currentContentor.id}`} type="number" min="0" step="any" value={currentContentor.kudumbaMzn} onChange={event => atualizarContentorField(currentContentor.id, 'kudumbaMzn', event.target.value)} className="input-modern" /></div>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* 4. PARTE 2: Taxas Portuárias e Terminais (DP World / Cornelder) */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-3">
              <Anchor size={16} /> Porto e terminais
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
            <label className="label-corp">THC portuário (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.thcPortuarioMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'thcPortuarioMzn', e.target.value)}
              className="input-modern"
              placeholder="14500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Descarga e movimentação · {spec.nome.includes('20') ? "20' ~14.500 MT" : "40' ~24.500 MT"}
            </span>
          </div>

          <div>
            <label className="label-corp">Segurança portuária (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.taxaSegurancaPortoMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'taxaSegurancaPortoMzn', e.target.value)}
              className="input-modern"
              placeholder="3500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">ISPS e liberação.</span>
          </div>

          <div>
            <label className="label-corp">Armazenagem portuária (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.armazenagemTerminalMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'armazenagemTerminalMzn', e.target.value)}
              className="input-modern"
              placeholder="0"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Valor previsto; 0 se não aplicável.
            </span>
          </div>
        </div>
      </section>

      {/* 5. PARTE 3: Despesas da Linha de Navegação (Shipping Line / Agência Marítima) */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-indigo-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-3">
              <Ship size={16} /> Linha de navegação
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
            <label className="label-corp">Delivery Order (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.deliveryOrderMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'deliveryOrderMzn', e.target.value)}
              className="input-modern"
              placeholder="8500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Liberação do BL.</span>
          </div>

          <div>
            <label className="label-corp">Limpeza do contentor (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.limpezaDesmagnetizacaoMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'limpezaDesmagnetizacaoMzn', e.target.value)}
              className="input-modern"
              placeholder="4500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Lavagem e inspeção.</span>
          </div>

          <div>
            <label className="label-corp">Caução do contentor (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.caucaoContentorMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'caucaoContentorMzn', e.target.value)}
              className="input-modern"
              placeholder="6000"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Devolução do vazio.</span>
          </div>
        </div>
      </section>

      {/* 6. PARTE 4: Despachante Aduaneiro, Transporte Terrestre (Inland) & PrimeWay */}
      <section className="bento-item !p-6 md:!p-8 border-l-4 border-l-emerald-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-heading font-semibold text-sm text-corp-blue flex items-center gap-3">
              <Truck size={16} /> Despacho e entrega
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
            <label className="label-corp">Honorários do despachante (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.honorariosDespachanteMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'honorariosDespachanteMzn', e.target.value)}
              className="input-modern"
              placeholder="22000"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Despacho e vistoria.
            </span>
          </div>

          <div>
            <label className="label-corp">Documentação (MZN)</label>
            <input
              type="number"
              step="any"
              value={currentContentor.documentacaoPastasMzn}
              onChange={(e) => atualizarContentorField(currentContentor.id, 'documentacaoPastasMzn', e.target.value)}
              className="input-modern"
              placeholder="3500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Arquivo e expediente.</span>
          </div>
        </div>

        {/* Transporte Inland / Camião Porta-Contentores */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <label className="label-corp mb-2 block">
            Transporte terrestre
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Destino de entrega</label>
              <select
                value={currentContentor.destinoInland}
                onChange={(e) => aplicarDestinoInland(e.target.value)}
                className="input-modern cursor-pointer"
              >
                <option value="maputo_matola">Grande Maputo e Matola</option>
                <option value="boane">Boane / Moamba / Marracuene / Ressano Garcia</option>
                <option value="beira_dondo">Grande Beira e Dondo</option>
                <option value="nacala">Nacala / Nampula</option>
                <option value="retirada_porto">Levantamento no porto</option>
                <option value="manual">Outro destino</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Transporte terrestre (MZN)</label>
              <input
                type="number"
                step="any"
                value={currentContentor.transporteInlandMzn}
                onChange={(e) => atualizarContentorField(currentContentor.id, 'transporteInlandMzn', e.target.value)}
                className="input-modern"
                placeholder="24000"
              />
              <span className="text-[9px] text-slate-400 mt-1 block">
                Por contentor · {spec.nome.includes('20') ? '20 pés' : '40 pés'}
              </span>
            </div>
          </div>
        </div>

        {/* Honorários de Agenciamento PrimeWay (Totalmente Negociável) */}
        <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                  <BadgePercent size={16} className="text-emerald-700" />
                Assessoria PrimeWay
              </h4>
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
                Fixo (MZN)
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
                % sobre CIF
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
                  Valor definido por operação.
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
      {calculatedItem && !calculatedItem.taxasPendentes && (
        <details className="bento-item !p-6 md:!p-8 bg-corp-blue text-white">
          <summary className="list-none cursor-pointer flex items-center gap-3 font-heading font-semibold text-sm">
            <TrendingUp size={18} className="text-corp-orange" />
            <span>Ver análise de custos</span>
          </summary>
          <div className="pt-5">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Custo Efetivo por CBM */}
            <div className="border border-white/15 rounded-lg p-4">
              <p className="text-[10px] font-semibold text-slate-300 mb-1">
                Custo por CBM
              </p>
              <p className="text-3xl font-black font-heading text-corp-orange">
                ${formatoMoeda(calculatedItem.custoPorCbmUsd)} USD
              </p>
              <p className="text-xs text-slate-300 mt-1">
                = {formatoMoeda(calculatedItem.custoPorCbmMzn)} MZN por m³
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300">
                Base: <strong className="text-white">{calculatedItem.volumeUtilizadoCbm} m³</strong> de {spec.capacidadeCbm} m³.
              </div>
            </div>

            {/* Taxa de Ocupação */}
            <div className="border border-white/15 rounded-lg p-4">
              <p className="text-[10px] font-semibold text-slate-300 mb-1">
                Ocupação do contentor
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
                    Ocupação abaixo de 40%; compare com uma cotação LCL.
                  </span>
                ) : (
                  <span className="text-emerald-300 font-semibold">
                    Percentagem calculada com o volume informado.
                  </span>
                )}
              </p>
            </div>

            {/* Comparativo Grupagem LCL */}
            <div className="border border-white/15 rounded-lg p-4">
              <p className="text-[10px] font-semibold text-slate-300 mb-1">
                Estimativa LCL · 380 USD/m³
              </p>
              <p className="text-2xl font-bold font-heading text-slate-200">
                ${formatoMoeda(calculatedItem.estimativaGrupagemLclUsd)} USD
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300">
                Referência para {calculatedItem.volumeUtilizadoCbm} m³; não é cotação.
              </div>
            </div>
          </div>

          {/* Divisão Visual das 4 Partes */}
          <div className="border-t border-white/15 pt-5">
            <h4 className="text-xs font-semibold text-white mb-4">
              Composição estimada dos custos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="border-l-2 border-amber-500/60 pl-3">
                <span className="text-[10px] font-semibold text-amber-400 block">1. Estado e alfândegas</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalAlfandegaMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Direitos ({exibirAliquota(currentContentor.direitosPerc)}) + ICE ({exibirAliquota(currentContentor.icePerc)}) + IVA ({exibirAliquota(currentContentor.ivaPerc)}) + TSA + JUE + Kudumba
                </span>
              </div>

              <div className="border-l-2 border-blue-500/60 pl-3">
                <span className="text-[10px] font-semibold text-blue-400 block">2. Porto e terminais</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalPortoTerminalMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  THC + ISPS + armazenagem
                </span>
              </div>

              <div className="border-l-2 border-indigo-500/60 pl-3">
                <span className="text-[10px] font-semibold text-indigo-400 block">3. Linha de navegação</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalLinhaNavegacaoMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Delivery Order + limpeza + caução
                </span>
              </div>

              <div className="border-l-2 border-emerald-500/60 pl-3">
                <span className="text-[10px] font-semibold text-emerald-400 block">4. Despacho e entrega</span>
                <span className="text-base font-bold text-white block mt-1">
                  {formatoMoeda(calculatedItem.subtotalLogisticaPrimewayMzn)} MZN
                </span>
                <span className="text-[10px] text-slate-400">
                  Despachante + camião + PrimeWay
                </span>
              </div>
            </div>
          </div>
          </div>
        </details>
      )}
    </div>
  );
};
