import React from 'react';
import { Boxes, Anchor, Landmark, Ship, Truck } from 'lucide-react';
import { ContentorCalculatedItem } from './contentorTypes';

interface ContentorProformaPrintProps {
  itemsCalculated: ContentorCalculatedItem[];
  totalGeralMzn: number;
  totalGeralUsd: number;
  cambio: number;
  moeda: string;
  formatoMoeda: (v: number) => string;
  totalFinal: number;
}

export const ContentorProformaPrint: React.FC<ContentorProformaPrintProps> = ({
  itemsCalculated,
  totalGeralMzn,
  totalGeralUsd,
  cambio,
  moeda,
  formatoMoeda,
  totalFinal
}) => {
  return (
    <div className="space-y-12">
      {itemsCalculated.map((c, idx) => (
        <div key={c.item.id || idx} className="space-y-6 pb-8 border-b border-[#cbd5e1] last:border-b-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A284F] uppercase tracking-wider flex items-center gap-2">
              <Boxes size={18} className="text-[#1A284F]" /> Contentor #{idx + 1}: {c.spec.nome} (Qtd: {c.qty})
            </h3>
            <span className="text-xs font-semibold text-[#64748b]">
              Capacidade: {c.spec.capacidadeCbm} m³ | Volume Faturado: {c.volumeUtilizadoCbm} m³
            </span>
          </div>

          {/* Container Spec Summary Card */}
          <div className="bg-[#f8fafc] rounded-2xl p-6 border border-[#e2e8f0] flex flex-row gap-6 items-center">
            <div className="w-40 h-28 bg-[#1A284F] text-white rounded-xl flex flex-col items-center justify-center p-3 text-center shrink-0 shadow-sm">
              <Boxes size={36} className="text-amber-400 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{c.spec.nome}</span>
              <span className="text-[9px] text-slate-300">{c.spec.dimensoesInternas}</span>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#1A284F] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  MODALIDADE FCL (FULL CONTAINER LOAD)
                </span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  CÓDIGO PAUTAL: {c.item.codigoPautal || 'NÃO ESPECIFICADO'}
                </span>
              </div>
              <h4 className="text-lg font-bold text-[#0f172a]">{c.item.descricaoCarga || 'Mercadoria Geral'}</h4>
              <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-[#334155]">
                <div><span className="text-[#94a3b8] block text-[9px] uppercase">Porto Origem:</span> {c.item.portoOrigem}</div>
                <div><span className="text-[#94a3b8] block text-[9px] uppercase">Porto Destino:</span> {c.item.portoDestino}</div>
                <div><span className="text-[#94a3b8] block text-[9px] uppercase">Peso Bruto:</span> {(c.pesoTotalKg / 1000).toFixed(2)} Toneladas</div>
                <div><span className="text-[#94a3b8] block text-[9px] uppercase">Taxa Ocupação:</span> {c.taxaOcupacaoPerc.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Full Mozambican Customs & Port Breakdown Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="bg-[#0f172a] text-[#ffffff] text-[10px] uppercase tracking-widest">
                <th className="py-4 px-6 font-semibold">Componente Oficial de Importação FCL (Moçambique)</th>
                <th className="py-4 px-6 font-semibold text-center">Referência / Taxa</th>
                <th className="py-4 px-6 font-semibold text-right">Valor em MZN</th>
                <th className="py-4 px-6 font-semibold text-right">Valor em USD</th>
              </tr>
            </thead>
            <tbody className="text-[#334155] text-sm">
              {/* Secção A: Valor Aduaneiro CIF */}
              <tr className="bg-[#f8fafc] font-bold text-[#0f172a] border-b border-[#cbd5e1]">
                <td colSpan={4} className="py-2.5 px-6 text-xs uppercase tracking-wider text-[#1A284F]">
                  A. Valor Aduaneiro da Mercadoria (CIF Porto Moçambique)
                </td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6 font-semibold text-[#0f172a]">01. Valor da Carga (FOB Fornecedor China)</td>
                <td className="py-3 px-6 text-center text-xs">FOB China</td>
                <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.fobUsdSingle * c.qty * cambio)} MZN</td>
                <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.fobUsdSingle * c.qty)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6 font-semibold text-[#0f172a]">02. Frete Marítimo Internacional FCL</td>
                <td className="py-3 px-6 text-center text-xs">{c.spec.nome}</td>
                <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.freteUsdSingle * c.qty * cambio)} MZN</td>
                <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.freteUsdSingle * c.qty)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6 font-semibold text-[#0f172a]">03. Seguro Marítimo Internacional</td>
                <td className="py-3 px-6 text-center text-xs">Apólice Marítima</td>
                <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.seguroUsdSingle * c.qty * cambio)} MZN</td>
                <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.seguroUsdSingle * c.qty)} USD</td>
              </tr>
              <tr className="bg-blue-50 font-bold border-b border-[#e2e8f0]">
                <td className="py-2.5 px-6 text-xs text-[#1A284F]">Total Valor Aduaneiro (CIF)</td>
                <td className="py-2.5 px-6 text-center text-[10px] text-[#1A284F]">Base de Cálculo Aduaneiro</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#1A284F]">{formatoMoeda(c.cifMznTotal)} MZN</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#1A284F]">${formatoMoeda(c.cifUsdTotal)} USD</td>
              </tr>

              {/* Secção B: Parte 1 - Alfândegas / Estado */}
              <tr className="bg-[#f8fafc] font-bold text-[#0f172a] border-b border-[#cbd5e1]">
                <td colSpan={4} className="py-2.5 px-6 text-xs uppercase tracking-wider text-[#b45309]">
                  B. Impostos Aduaneiros e Taxas do Estado (DU Oficial de Moçambique)
                </td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">04. Direitos Aduaneiros (DA)</td>
                <td className="py-3 px-6 text-center text-xs">{c.item.direitosPerc}% do CIF</td>
                <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.direitosMzn)} MZN</td>
                <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.direitosMzn / cambio)} USD</td>
              </tr>
              {c.iceMzn > 0 && (
                <tr className="border-b border-[#f1f5f9]">
                  <td className="py-3 px-6">05. ICE - Imposto sobre Consumos Específicos</td>
                  <td className="py-3 px-6 text-center text-xs">{c.item.icePerc}%</td>
                  <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.iceMzn)} MZN</td>
                  <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.iceMzn / cambio)} USD</td>
                </tr>
              )}
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">06. IVA Alfandegário</td>
                <td className="py-3 px-6 text-center text-xs">{c.item.ivaPerc}% s/ (CIF + DA + ICE)</td>
                <td className="py-3 px-6 text-right font-medium">{formatoMoeda(c.ivaMzn)} MZN</td>
                <td className="py-3 px-6 text-right font-medium">${formatoMoeda(c.ivaMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">07. TSA - Taxa de Serviços Aduaneiros</td>
                <td className="py-3 px-6 text-center text-xs">Alfândegas de Moçambique</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.tsaMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.tsaMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">08. MCNET (Janela Única Eletrónica - JUE)</td>
                <td className="py-3 px-6 text-center text-xs">Processamento JUE/DU</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.mcnetMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.mcnetMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">09. Kudumba (Scanner de Inspeção Não Intrusiva FCL)</td>
                <td className="py-3 px-6 text-center text-xs">Scanner por Contentor</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.kudumbaMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.kudumbaMzn / cambio)} USD</td>
              </tr>
              <tr className="bg-amber-50/70 font-bold border-b border-[#e2e8f0]">
                <td className="py-2.5 px-6 text-xs text-[#b45309]">Subtotal Impostos & Alfândegas (Estado)</td>
                <td className="py-2.5 px-6 text-center text-[10px] text-[#b45309]">Paga ao Tesouro Público / DU</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#b45309]">{formatoMoeda(c.subtotalAlfandegaMzn)} MZN</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#b45309]">${formatoMoeda(c.subtotalAlfandegaUsd)} USD</td>
              </tr>

              {/* Secção C: Parte 2 - Porto & Terminais */}
              <tr className="bg-[#f8fafc] font-bold text-[#0f172a] border-b border-[#cbd5e1]">
                <td colSpan={4} className="py-2.5 px-6 text-xs uppercase tracking-wider text-[#1e40af]">
                  C. Taxas Portuárias e Terminais de Contentores (DP World / Cornelder)
                </td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">10. THC Portuário (Terminal Handling Charges)</td>
                <td className="py-3 px-6 text-center text-xs">Movimentação e Descarga</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.thcMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.thcMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">11. Segurança Portuária & Liberação ISPS</td>
                <td className="py-3 px-6 text-center text-xs">Port Security Release</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.segurancaPortoMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.segurancaPortoMzn / cambio)} USD</td>
              </tr>
              {c.armazenagemMzn > 0 && (
                <tr className="border-b border-[#f1f5f9]">
                  <td className="py-3 px-6">12. Armazenagem Terminal Prevista</td>
                  <td className="py-3 px-6 text-center text-xs">Excesso de Dias Livres</td>
                  <td className="py-3 px-6 text-right">{formatoMoeda(c.armazenagemMzn)} MZN</td>
                  <td className="py-3 px-6 text-right">${formatoMoeda(c.armazenagemMzn / cambio)} USD</td>
                </tr>
              )}
              <tr className="bg-blue-50/70 font-bold border-b border-[#e2e8f0]">
                <td className="py-2.5 px-6 text-xs text-[#1e40af]">Subtotal Porto & Terminais</td>
                <td className="py-2.5 px-6 text-center text-[10px] text-[#1e40af]">Terminal Portuário</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#1e40af]">{formatoMoeda(c.subtotalPortoTerminalMzn)} MZN</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#1e40af]">${formatoMoeda(c.subtotalPortoTerminalUsd)} USD</td>
              </tr>

              {/* Secção D: Parte 3 - Linha de Navegação */}
              <tr className="bg-[#f8fafc] font-bold text-[#0f172a] border-b border-[#cbd5e1]">
                <td colSpan={4} className="py-2.5 px-6 text-xs uppercase tracking-wider text-[#4338ca]">
                  D. Despesas da Linha de Navegação & Agência Marítima
                </td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">13. Delivery Order (D.O. / Ordem de Entrega B/L)</td>
                <td className="py-3 px-6 text-center text-xs">Agente de Navegação</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.deliveryOrderMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.deliveryOrderMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">14. Limpeza & Desmagnetização de Contentor</td>
                <td className="py-3 px-6 text-center text-xs">Container Cleaning Fee</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.limpezaMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.limpezaMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">15. Caução / Seguro Devolução Contentor Vazio</td>
                <td className="py-3 px-6 text-center text-xs">Garantia Demurrage</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.caucaoMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.caucaoMzn / cambio)} USD</td>
              </tr>
              <tr className="bg-indigo-50/70 font-bold border-b border-[#e2e8f0]">
                <td className="py-2.5 px-6 text-xs text-[#4338ca]">Subtotal Linha de Navegação</td>
                <td className="py-2.5 px-6 text-center text-[10px] text-[#4338ca]">Shipping Agency Charges</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#4338ca]">{formatoMoeda(c.subtotalLinhaNavegacaoMzn)} MZN</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#4338ca]">${formatoMoeda(c.subtotalLinhaNavegacaoUsd)} USD</td>
              </tr>

              {/* Secção E: Parte 4 - Despachante & Terrestre & PrimeWay */}
              <tr className="bg-[#f8fafc] font-bold text-[#0f172a] border-b border-[#cbd5e1]">
                <td colSpan={4} className="py-2.5 px-6 text-xs uppercase tracking-wider text-[#047857]">
                  E. Despachante Aduaneiro, Transporte Terrestre Porta-Contentores & PrimeWay
                </td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">16. Honorários do Despachante Aduaneiro Oficial</td>
                <td className="py-3 px-6 text-center text-xs">DU & Desembaraço Completo</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.despachanteMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.despachanteMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">17. Pastas Aduaneiras, Expediente & Arquivo Fiscal</td>
                <td className="py-3 px-6 text-center text-xs">Documentação Oficial</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.documentacaoMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.documentacaoMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9]">
                <td className="py-3 px-6">18. Transporte Terrestre Porta-Contentor (Inland Haulage)</td>
                <td className="py-3 px-6 text-center text-xs">Porto → Armazém Destino</td>
                <td className="py-3 px-6 text-right">{formatoMoeda(c.transporteInlandMzn)} MZN</td>
                <td className="py-3 px-6 text-right">${formatoMoeda(c.transporteInlandMzn / cambio)} USD</td>
              </tr>
              <tr className="border-b border-[#f1f5f9] bg-emerald-50/50">
                <td className="py-3 px-6 font-bold text-[#047857]">19. Assessoria & Agenciamento PrimeWay</td>
                <td className="py-3 px-6 text-center text-xs font-bold text-[#047857]">
                  {c.item.tipoHonorariosPrimeway === 'percentual' ? `${c.item.honorariosPrimewayPerc}% sobre CIF` : 'Honorários Acordados'}
                </td>
                <td className="py-3 px-6 text-right font-bold text-[#047857]">{formatoMoeda(c.honorariosPrimewayMzn)} MZN</td>
                <td className="py-3 px-6 text-right font-bold text-[#047857]">${formatoMoeda(c.honorariosPrimewayMzn / cambio)} USD</td>
              </tr>
              <tr className="bg-emerald-50/70 font-bold border-b border-[#e2e8f0]">
                <td className="py-2.5 px-6 text-xs text-[#047857]">Subtotal Logística Terrestre & PrimeWay</td>
                <td className="py-2.5 px-6 text-center text-[10px] text-[#047857]">Despacho + Inland + Agenciamento</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#047857]">{formatoMoeda(c.subtotalLogisticaPrimewayMzn)} MZN</td>
                <td className="py-2.5 px-6 text-right text-xs text-[#047857]">${formatoMoeda(c.subtotalLogisticaPrimewayUsd)} USD</td>
              </tr>
            </tbody>
          </table>

          {/* Subtotal do Contentor */}
          <div className="flex justify-end">
            <div className="bg-[#f8fafc] border border-[#cbd5e1] p-3 px-6 rounded-xl text-right font-bold text-xs text-[#1A284F]">
              Subtotal Contentor #{idx + 1}: MZN {formatoMoeda(c.totalImportacaoMzn)} | USD ${formatoMoeda(c.totalImportacaoUsd)}
            </div>
          </div>
        </div>
      ))}

      {/* Totais Gerais Consolidados */}
      <div className="flex justify-end mb-12 pt-6">
        <div className="w-full max-w-md space-y-3">
          <div className="bg-[#1A284F] text-[#ffffff] p-6 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-bold uppercase tracking-widest text-xs">TOTAL ESTIMADO GERAL (FCL):</span>
            <span className="text-2xl font-black break-words">{moeda} {formatoMoeda(totalFinal)}</span>
          </div>
          <p className="text-[10px] text-[#64748b] text-right font-semibold">
            Equivalente a: MZN {formatoMoeda(totalGeralMzn)} | USD ${formatoMoeda(totalGeralUsd)} (Câmbio: 1 USD = {cambio} MZN)
          </p>
        </div>
      </div>
    </div>
  );
};
