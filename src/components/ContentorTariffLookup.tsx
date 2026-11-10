import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, LoaderCircle, Search } from 'lucide-react';
import { lookupHsCode, normalizeHsCode, preloadHsCatalog } from '../services/hsTariffLookup';
import { formatHsCode, type HsLookup, type HsLookupResult, type HsTariff } from '../services/hsTariffTypes';

interface ContentorTariffLookupProps {
  contentorId: string;
  codigo: string;
  manual: boolean;
  onCodigoChange: (value: string) => void;
  onTariff: (tariff: HsTariff) => void;
  onPending: () => void;
  onUnavailable: () => void;
  lookup?: HsLookup;
}

type Phase = 'editing' | 'loading' | 'ready' | 'choices' | 'not_found' | 'invalid' | 'error' | 'manual';

export function ContentorTariffLookup({
  contentorId, codigo, manual, onCodigoChange, onTariff, onPending, onUnavailable,
  lookup = lookupHsCode,
}: ContentorTariffLookupProps) {
  const [phase, setPhase] = useState<Phase>('editing');
  const [result, setResult] = useState<HsLookupResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const callbacks = useRef({ onTariff, onPending, onUnavailable });
  callbacks.current = { onTariff, onPending, onUnavailable };
  const current = useRef({ contentorId, code: normalizeHsCode(codigo), manual });
  current.current = { contentorId, code: normalizeHsCode(codigo), manual };
  const applied = useRef('');
  const requestVersion = useRef(0);
  const code = normalizeHsCode(codigo);
  const inputId = `hs-code-${contentorId}`;
  const choicesId = `hs-choices-${contentorId}`;

  useEffect(() => { preloadHsCatalog().catch(() => {}); }, []);

  useEffect(() => {
    const version = ++requestVersion.current;
    const key = `${contentorId}:${code}`;
    setDismissed(false);
    if (manual) {
      applied.current = '';
      setPhase('manual');
      return;
    }
    if (applied.current === key) return;
    setResult(null);
    if (code && !/^\d+$/.test(code)) {
      setPhase('invalid');
      callbacks.current.onUnavailable();
      return;
    }
    if (!codigo.trim() || code.length < 4) {
      setPhase('editing');
      return;
    }
    const controller = new AbortController();
    setPhase('loading');
    callbacks.current.onPending();
    const timer = window.setTimeout(async () => {
      try {
        const response = await lookup(codigo, { signal: controller.signal });
        if (controller.signal.aborted || version !== requestVersion.current || current.current.contentorId !== contentorId || current.current.code !== code || current.current.manual) return;
        setResult(response);
        if (response.kind === 'match') {
          applied.current = `${contentorId}:${normalizeHsCode(response.tariff.codigo)}`;
          setPhase('ready');
          callbacks.current.onTariff(response.tariff);
        } else if (response.kind === 'choices') {
          setPhase('choices');
        } else if (response.kind === 'incomplete') {
          setPhase('editing');
        } else {
          setPhase(response.kind);
          callbacks.current.onUnavailable();
        }
      } catch {
        if (controller.signal.aborted || version !== requestVersion.current || current.current.manual) return;
        setPhase('error');
        callbacks.current.onUnavailable();
      }
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [contentorId, codigo, code, manual, lookup]);

  const selectTariff = (tariff: HsTariff) => {
    ++requestVersion.current;
    applied.current = `${contentorId}:${normalizeHsCode(tariff.codigo)}`;
    setResult({ kind: 'match', tariff });
    setPhase('ready');
    setDismissed(true);
    callbacks.current.onTariff(tariff);
  };

  const hasChoices = result?.kind === 'choices' && !dismissed;
  const tariff = result?.kind === 'match' ? result.tariff : null;
  const missing = tariff && [tariff.direitosPerc, tariff.icePerc, tariff.ivaPerc].some(rate => rate === null);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={inputId} className="label-corp">Código pautal / HS</label>
        <div className="relative max-w-xl">
          <Search size={17} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" />
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            maxLength={24}
            value={codigo}
            onChange={event => {
              ++requestVersion.current;
              applied.current = '';
              onCodigoChange(event.target.value);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') event.preventDefault();
              if (event.key === 'Escape') setDismissed(true);
            }}
            aria-describedby={`${inputId}-help ${inputId}-status`}
            aria-expanded={hasChoices || false}
            aria-controls={hasChoices ? choicesId : undefined}
            className="input-modern !pl-10 !pr-11 font-mono"
            placeholder="Ex.: 8422.40.00"
          />
          {phase === 'loading' && <LoaderCircle size={17} aria-hidden="true" className="absolute right-3 top-3.5 text-slate-500 animate-spin" />}
        </div>
        <p id={`${inputId}-help`} className="text-[11px] text-slate-500 mt-2">O código de 8 dígitos preenche as alíquotas automaticamente. Com 4 ou 6 dígitos, escolha a subposição.</p>
      </div>

      {hasChoices && result?.kind === 'choices' && (
        <div id={choicesId} className="max-w-3xl border border-slate-200 rounded-md overflow-hidden">
          <p className="px-3 py-2 bg-slate-50 text-xs text-slate-600">Escolha o produto correspondente. {result.total} subposições na base disponível.</p>
          <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {result.items.map(item => (
              <li key={item.codigo}>
                <button type="button" onClick={() => selectTariff(item)} className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-2 cursor-pointer">
                  <span className="font-mono text-xs font-semibold text-corp-blue shrink-0">{formatHsCode(item.codigo)}</span>
                  <span className="text-xs text-slate-600 leading-relaxed">{item.descricao}</span>
                </button>
              </li>
            ))}
          </ul>
          {result.total > result.items.length && <p className="px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100">Introduza mais dígitos para reduzir os resultados.</p>}
        </div>
      )}

      <div id={`${inputId}-status`} role="status" aria-live="polite" className="text-xs leading-relaxed min-h-5">
        {phase === 'loading' && <p className="text-slate-500">A consultar o código…</p>}
        {phase === 'editing' && <p className="text-slate-500">Introduza o código da mercadoria.</p>}
        {phase === 'invalid' && <p className="text-amber-800 flex items-start gap-2"><AlertCircle size={15} aria-hidden="true" className="shrink-0 mt-0.5" />Use apenas números, pontos, espaços ou hífen. O código nacional tem 8 dígitos.</p>}
        {phase === 'not_found' && <p className="text-amber-800 flex items-start gap-2"><AlertCircle size={15} aria-hidden="true" className="shrink-0 mt-0.5" />Código não encontrado. Confirme a subposição ou introduza as taxas manualmente nos detalhes.</p>}
        {phase === 'error' && <p className="text-amber-800 flex items-start gap-2"><AlertCircle size={15} aria-hidden="true" className="shrink-0 mt-0.5" />Não foi possível consultar a pauta. As taxas não foram preenchidas; pode confirmá-las manualmente.</p>}
        {phase === 'manual' && <p className="text-slate-600">Taxas editadas manualmente. A consulta automática não altera estes valores.</p>}
        {phase === 'ready' && tariff && (
          <div className="space-y-1.5">
            <p className="text-slate-700 flex items-start gap-2"><CheckCircle2 size={15} aria-hidden="true" className="text-corp-blue shrink-0 mt-0.5" /><span><strong className="font-mono font-semibold">{formatHsCode(tariff.codigo)}</strong> · {tariff.descricao}</span></p>
            <p className="text-[11px] text-slate-500">{tariff.source === 'api' ? 'Consulta à base pautal do servidor.' : 'Cópia da base pautal disponível; não é uma consulta em direto à AT.'} Confirme a classificação e eventuais exceções antes do despacho.</p>
            {tariff.iceRule && <p className="text-amber-800">ICE específico: {tariff.iceRule}. Confirme este cálculo nos detalhes; a regra não foi convertida numa percentagem.</p>}
            {missing && !tariff.iceRule && <p className="text-amber-800">Há alíquotas em branco na base. Confirme-as nos detalhes antes de exportar a proforma; não foram presumidas isenções nem taxas padrão.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
