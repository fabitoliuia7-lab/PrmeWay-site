import fs from 'fs';
import path from 'path';
import https from 'https';

export interface ATTariffItem {
  cap: string;           // ex: "84"
  capDesc: string;       // ex: "Reactores nucleares, caldeiras..."
  subcap: string;        // ex: "8422"
  subcapDesc: string;    // ex: "MÁQUINAS DE LAVAR LOUÇA, MÁQUINAS E APARELHOS..."
  codigo: string;        // ex: "84224000"
  descricao: string;     // ex: "- OUTRAS MÁQUINAS E APARELHOS PARA EMPACOTAR OU EMBALAR..."
  unidade: string;       // ex: "Peça", "Quilograma"
  direitos: number;      // ex: 5, 20, 0
  ice: number | null;    // ex: null ou taxa
  iva: number | null;    // ex: 16 ou null (isento)
}

let cachedATItems: ATTariffItem[] = [];
let lastSyncTimestamp = new Date().toISOString();
let isSyncing = false;

// Função para formatar código numérico a 8 dígitos (84224000 -> 8422.40.00)
export function formatarCodigoSH(codigo: string): string {
  const digits = codigo.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.00`;
  }
  if (digits.length === 4) {
    return `${digits}.00.00`;
  }
  return codigo;
}

// Normalizador de texto para pesquisa
function normalizar(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Carregar itens em memória
export function loadATDatabase(): ATTariffItem[] {
  if (cachedATItems.length > 0) {
    return cachedATItems;
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'pauta_aduaneira_at_oficial.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      cachedATItems = JSON.parse(raw);
      console.log(`[AT Pauta Service] Carregados ${cachedATItems.length} itens oficiais da Autoridade Tributária de Moçambique.`);
    }
  } catch (err) {
    console.warn('[AT Pauta Service] Erro ao carregar base local:', err);
  }

  return cachedATItems;
}

// Obter status de sincronização
export function getATSyncStatus() {
  return {
    totalItens: cachedATItems.length || loadATDatabase().length,
    ultimaSincronizacao: lastSyncTimestamp,
    fonteOficial: 'Autoridade Tributária de Moçambique (AT)',
    urlPortal: 'https://www.at.gov.mz/servicos/pauta-aduaneira',
    status: cachedATItems.length > 0 ? 'sincronizado_ativo' : 'carregando'
  };
}

// Buscar item específico por código (ex: "8422.40.00", "84224000" ou "8422")
export function findATItemByCode(code: string): ATTariffItem | null {
  const items = loadATDatabase();
  const digits = code.replace(/\D/g, '');

  if (!digits) return null;

  // 1. Tentar correspondência exata a 8 dígitos
  const exact = items.find(i => i.codigo === digits);
  if (exact) return exact;

  // 2. Tentar por prefixo de código
  if (digits.length >= 4) {
    const startsWith = items.filter(i => i.codigo.startsWith(digits));
    if (startsWith.length > 0) {
      // Se houver um item preferencial como .00 ou o primeiro
      return startsWith[0];
    }
  }

  return null;
}

// Pesquisa dinâmica em tempo real na tabela da AT
export function searchATDatabase(
  termo: string, 
  options?: { cap?: string; limit?: number; page?: number }
): {
  items: (ATTariffItem & { codigoFormatado: string; totalTaxasPct: number })[];
  total: number;
  fonte: string;
  urlOficial: string;
} {
  const all = loadATDatabase();
  const limit = options?.limit || 25;
  const page = options?.page || 1;
  const termoNorm = normalizar(termo);
  const termoDigits = termo.replace(/\D/g, '');

  let filtered = all;

  // Filtro de capítulo se fornecido
  if (options?.cap) {
    const capPad = options.cap.padStart(2, '0');
    filtered = filtered.filter(i => i.cap === capPad);
  }

  if (termoNorm) {
    filtered = filtered.filter(item => {
      const codDigits = item.codigo;
      const descNorm = normalizar(item.descricao);
      const subcapNorm = normalizar(item.subcapDesc);
      const capNorm = normalizar(item.capDesc);

      // Correspondência por código numérico
      if (termoDigits.length >= 2 && codDigits.startsWith(termoDigits)) {
        return true;
      }
      if (termoDigits.length >= 4 && item.subcap === termoDigits.slice(0, 4)) {
        return true;
      }

      // Correspondência por texto
      if (descNorm.includes(termoNorm)) return true;
      if (subcapNorm.includes(termoNorm)) return true;
      if (capNorm.includes(termoNorm)) return true;

      // Correspondência por tokens de palavras
      const tokens = termoNorm.split(/\s+/).filter(t => t.length >= 3);
      if (tokens.length > 1) {
        return tokens.every(tok => descNorm.includes(tok) || subcapNorm.includes(tok));
      }

      return false;
    });

    // Ordenar: primeiro correspondência exata de código, depois código inicial, depois descrição
    filtered.sort((a, b) => {
      if (termoDigits) {
        if (a.codigo === termoDigits) return -1;
        if (b.codigo === termoDigits) return 1;
        if (a.codigo.startsWith(termoDigits) && !b.codigo.startsWith(termoDigits)) return -1;
        if (!a.codigo.startsWith(termoDigits) && b.codigo.startsWith(termoDigits)) return 1;
      }
      return 0;
    });
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const pageItems = filtered.slice(offset, offset + limit).map(item => {
    const da = item.direitos || 0;
    const ice = item.ice || 0;
    const iva = item.iva || 0;
    return {
      ...item,
      codigoFormatado: formatarCodigoSH(item.codigo),
      totalTaxasPct: Math.round((da + ice + iva) * 10) / 10
    };
  });

  return {
    items: pageItems,
    total,
    fonte: 'Tabela Oficial da Pauta Aduaneira da Autoridade Tributária de Moçambique (AT)',
    urlOficial: 'https://www.at.gov.mz/servicos/pauta-aduaneira'
  };
}

// Sincronização ao vivo com o website da AT
export async function syncLiveFromAT(): Promise<{ success: boolean; total: number; message: string }> {
  if (isSyncing) {
    return { success: true, total: cachedATItems.length, message: 'Sincronização já em curso...' };
  }

  isSyncing = true;
  return new Promise((resolve) => {
    https.get('https://www.at.gov.mz/assets/index-Bb4FUmWy.js', { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        isSyncing = false;
        const startStr = 'const WK=[';
        const startIdx = data.indexOf(startStr);
        if (startIdx === -1) {
          return resolve({ 
            success: false, 
            total: cachedATItems.length, 
            message: 'Não foi possível localizar array WK no bundle atual da AT' 
          });
        }
        try {
          const arrayStart = startIdx + 'const WK='.length;
          let depth = 0;
          let endIdx = arrayStart;
          for (let i = arrayStart; i < data.length; i++) {
            if (data[i] === '[') depth++;
            else if (data[i] === ']') {
              depth--;
              if (depth === 0) {
                endIdx = i + 1;
                break;
              }
            }
          }
          const jsonStr = data.slice(arrayStart, endIdx);
          const items: ATTariffItem[] = eval(jsonStr);
          cachedATItems = items;
          lastSyncTimestamp = new Date().toISOString();

          // Salvar em disco
          const filePath = path.join(process.cwd(), 'src', 'data', 'pauta_aduaneira_at_oficial.json');
          fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');

          resolve({
            success: true,
            total: items.length,
            message: `Sincronizados com sucesso ${items.length} códigos pautais diretamente da AT!`
          });
        } catch (e: any) {
          resolve({ success: false, total: cachedATItems.length, message: e.message });
        }
      });
    }).on('error', (err) => {
      isSyncing = false;
      resolve({ success: false, total: cachedATItems.length, message: err.message });
    });
  });
}
