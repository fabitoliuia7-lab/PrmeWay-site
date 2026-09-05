import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  Globe2, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  FileText
} from 'lucide-react';
import { Quotation, SourcingOrder, Supplier, ProductItem, SourcingClient, SourcingSettings } from '../types';

interface CommercialProposalModalProps {
  isOpen: boolean;
  order: SourcingOrder;
  quote: Quotation;
  supplier?: Supplier;
  product?: ProductItem;
  client?: SourcingClient;
  settings: SourcingSettings;
  onClose: () => void;
}

export const CommercialProposalModal: React.FC<CommercialProposalModalProps> = ({
  isOpen,
  order,
  quote,
  supplier,
  product,
  client,
  settings,
  onClose
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const exchangeRate = settings.exchangeRates.USD_TO_MZN || 64;
  const totalMerchandiseUSD = quote.totalMerchandise || ((quote.unitPrice || 0) * (quote.quotedQuantity ?? quote.quantity ?? 1));
  const freightUSD = quote.estimatedFreightUSD || 0;
  const insuranceUSD = quote.estimatedInsuranceUSD || 0;
  const estimatedCifUSD = totalMerchandiseUSD + freightUSD + insuranceUSD;
  const estimatedCifMZN = estimatedCifUSD * exchangeRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-4xl w-full shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto print:m-0 print:p-8 print:shadow-none print:max-w-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-corp-blue">
              Documento Oficial de Sourcing & Importação
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-corp-blue text-white rounded-xl text-xs font-bold hover:bg-corp-blue-light transition-colors shadow cursor-pointer"
            >
              <Printer size={14} /> Imprimir / Salvar em PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Proposta Layout - Print Ready */}
        <div className="space-y-8 text-slate-800 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-3">
              <img 
                src="/IMG-20260215-WA0003.jpg" 
                alt="PrimeWay Logistics" 
                className="w-14 h-14 rounded-xl object-contain border border-slate-200 shadow-sm"
              />
              <div>
                <h1 className="font-heading font-black text-2xl tracking-tight text-slate-900">
                  PRIMEWAY LOGISTICS
                </h1>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sourcing Internacional China ➔ Moçambique
                </p>
                <p className="text-[11px] text-slate-400">
                  Maputo, Moçambique • Guangzhou, China
                </p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs font-mono font-bold text-slate-500">
                PROPOSTA N.º <span className="text-slate-900 text-sm">PROP-{quote.id.replace('COT-', '')}-{new Date().getFullYear()}</span>
              </div>
              <div className="text-xs text-slate-600">
                Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
              <div className="text-xs text-amber-600 font-semibold">
                Validade: até {quote.validityDate || '15 dias'}
              </div>
            </div>
          </div>

          {/* Dados do Cliente & Pedido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-corp-blue block mb-1">
                Cliente Solicitante (Moçambique)
              </span>
              <div className="font-bold text-base text-slate-900">{client?.company || client?.name || 'Cliente'}</div>
              {client?.nuit && <div className="text-xs text-slate-600">NUIT: <span className="font-mono font-semibold">{client.nuit}</span></div>}
              {client?.city && <div className="text-xs text-slate-600">Cidade: {client.city}, Moçambique</div>}
              {client?.phone && <div className="text-xs text-slate-600 font-mono">Telefone: {client.phone}</div>}
              {client?.email && <div className="text-xs text-slate-600">Email: {client.email}</div>}
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-corp-blue block mb-1">
                Parâmetros do Pedido de Sourcing
              </span>
              <div className="text-xs text-slate-700 space-y-1">
                <div>Pedido Ref.: <strong className="font-mono">{order.id}</strong></div>
                <div>Destino Aduaneiro: <strong>{order.mozambiqueDestination}</strong></div>
                <div>Prazo Alvo do Cliente: <strong>{order.deadline || 'Conforme cronograma padrão'}</strong></div>
                <div>Responsável Técnico: <strong>{order.assignedTo}</strong></div>
              </div>
            </div>
          </div>

          {/* Especificação do Produto Selecionado */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <FileText size={15} className="text-corp-blue" />
              1. Mercadoria Selecionada na China
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 border border-slate-200">Ref / Item</th>
                    <th className="py-2.5 px-3 border border-slate-200">Descrição Técnica & Dimensões</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-center">Código HS</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-center">Quantidade</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-right">Preço Unit. (FOB)</th>
                    <th className="py-2.5 px-3 border border-slate-200 text-right">Total Mercadoria</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3 border border-slate-200 font-mono font-bold align-top">
                      {product?.id || 'PROD-001'}
                    </td>
                    <td className="py-3 px-3 border border-slate-200 align-top space-y-1">
                      <strong className="text-slate-900 block">{product?.namePt || order.requestedProduct}</strong>
                      <p className="text-slate-500 text-[11px]">{product?.description || order.description}</p>
                      {product?.dimensions?.cbmUnit && (
                        <span className="inline-block text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                          Vol. Unitário: {product.dimensions.cbmUnit} m³ • Peso: {product.weightKg || 0} kg
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 border border-slate-200 text-center font-mono align-top">
                      {product?.hsCode || 'N/D'}
                    </td>
                    <td className="py-3 px-3 border border-slate-200 text-center font-bold align-top font-mono">
                      {(quote.quotedQuantity ?? quote.quantity ?? 1).toLocaleString('pt-BR')} un
                    </td>
                    <td className="py-3 px-3 border border-slate-200 text-right font-mono font-bold align-top">
                      {quote.currency} ${quote.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 border border-slate-200 text-right font-mono font-extrabold text-emerald-700 align-top">
                      {quote.currency} ${totalMerchandiseUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro & Logístico Estimado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Logística Internacional */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                Condições Logísticas & Prazos
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Incoterm Acordado:</span>
                <strong className="text-slate-900">{quote.incoterm}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Porto de Origem (China):</span>
                <strong className="text-slate-900">{quote.loadingPort}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Porto de Destino:</span>
                <strong className="text-slate-900">{quote.destinationPort}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prazo de Produção:</span>
                <strong className="text-slate-900">{quote.leadTimeDays} dias</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trânsito Marítimo Est.:</span>
                <strong className="text-slate-900">{quote.estimatedDeliveryDays} dias</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pagamento ao Fabricante:</span>
                <span className="text-slate-900 font-semibold">{quote.paymentTerms}</span>
              </div>
            </div>

            {/* Total Estimado CIF */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 text-xs space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-corp-blue block mb-1">
                  Resumo de Custos Estimados (Origem + Frete)
                </span>
                <div className="flex justify-between py-1 border-b border-blue-200/50">
                  <span className="text-slate-600">Valor da Mercadoria (FOB):</span>
                  <strong className="font-mono text-slate-900">USD ${totalMerchandiseUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-blue-200/50">
                  <span className="text-slate-600">Frete Marítimo Estimado:</span>
                  <strong className="font-mono text-slate-900">USD ${freightUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Seguro Internacional:</span>
                  <strong className="font-mono text-slate-900">USD ${insuranceUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-corp-blue/30 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-corp-blue uppercase">Valor CIF Estimado (USD):</span>
                  <span className="text-lg font-mono font-black text-corp-blue">
                    USD ${estimatedCifUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-500">Equivalente em Meticais (Câmbio {exchangeRate.toFixed(2)} MT/$):</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {estimatedCifMZN.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MZN
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Termos e Assinatura */}
          <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 space-y-4">
            <p>
              * Os impostos aduaneiros moçambicanos (Direitos Aduaneiros, IVA 16%, Taxa de Serviços Aduaneiros TSA) e despesas portuárias no terminal (Cornelder / Maputo Port) podem ser simulados na Calculadora Aduaneira PrimeWay ou apurados conforme despacho aduaneiro final.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-8">
              <div className="text-center border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-800 block text-xs">Pela PrimeWay Logistics</span>
                <span className="text-slate-500 text-[10px]">Departamento de Sourcing & Importação</span>
              </div>

              <div className="text-center border-t border-slate-400 pt-2">
                <span className="font-bold text-slate-800 block text-xs">Pelo Cliente / Importador</span>
                <span className="text-slate-500 text-[10px]">Aceitação & Autorização de Pedido</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
