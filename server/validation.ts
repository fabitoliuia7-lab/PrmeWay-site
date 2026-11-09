import type { PautaItem } from '../src/pautaAduaneira';

export const CHAT_LIMITS = { messages: 20, userChars: 4000, assistantChars: 8000, totalChars: 24000 } as const;
export interface ChatPayload {
  messages: { role: 'user' | 'assistant' | 'model'; content: string }[];
  stream: boolean;
}

export function validateChatPayload(body: unknown): ChatPayload {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Pedido de chat inválido.');
  const { messages, stream = true } = body as Record<string, unknown>;
  if (typeof stream !== 'boolean') throw new Error('O parâmetro stream deve ser booleano.');
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > CHAT_LIMITS.messages) {
    throw new Error(`Envie entre 1 e ${CHAT_LIMITS.messages} mensagens por pedido.`);
  }
  let total = 0;
  const validated = messages.map((message): ChatPayload['messages'][number] => {
    if (!message || typeof message !== 'object' || Array.isArray(message)) throw new Error('Mensagem inválida.');
    const { role, content } = message;
    if (!['user', 'assistant', 'model'].includes(role) || typeof content !== 'string' || !content.trim()) {
      throw new Error('As mensagens devem ter texto e um papel válido (user/assistant).');
    }
    const maximum = role === 'user' ? CHAT_LIMITS.userChars : CHAT_LIMITS.assistantChars;
    if (content.length > maximum) throw new Error(`Cada mensagem ${role} pode ter até ${maximum} caracteres.`);
    total += content.length;
    return { role, content };
  });
  if (total > CHAT_LIMITS.totalChars) throw new Error('O histórico é demasiado longo. Reduza o número de mensagens.');
  if (validated.at(-1)?.role !== 'user') throw new Error('A última mensagem deve ser do utilizador.');
  return { messages: validated, stream };
}

function text(value: unknown, field: string, maximum: number, fallback?: string): string {
  const input = value === undefined ? fallback : value;
  if (typeof input !== 'string' || !input.trim() || input.length > maximum) {
    throw new Error(`${field}: indique texto com 1 a ${maximum} caracteres.`);
  }
  return input.trim();
}

function percentage(value: unknown, field: string, fallback?: number): number {
  const input = value === undefined ? fallback : value;
  if (typeof input !== 'number' || !Number.isFinite(input) || input < 0 || input > 100) {
    throw new Error(`${field}: indique um número entre 0 e 100.`);
  }
  return input;
}

export function validateCustomTariff(body: unknown): PautaItem {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Item pautal inválido.');
  const input = body as Record<string, unknown>;
  const rawCode = text(input.codigo, 'Código SH', 10);
  if (!/^(?:\d{8}|\d{4}\.\d{2}\.\d{2})$/.test(rawCode)) throw new Error('O código SH deve ter 8 dígitos (ex.: 8422.40.00).');
  const digits = rawCode.replace(/\./g, '');
  if (Number(digits.slice(0, 2)) < 1 || Number(digits.slice(0, 2)) > 97) throw new Error('Capítulo SH inválido.');
  const codigo = `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
  const tipoBem = input.tipoBem ?? 'capital';
  if (!['capital', 'intermediario', 'consumo', 'veiculo', 'isento', 'especial'].includes(tipoBem as string)) {
    throw new Error('Tipo de bem inválido.');
  }
  const descricao = text(input.descricao, 'Descrição', 500);
  return {
    codigo, shCapitulo: digits.slice(0, 2), shPosicao: digits.slice(0, 4), descricao,
    categoria: text(input.categoria, 'Categoria', 160, 'Personalizado Despachante'),
    tipoBem: tipoBem as PautaItem['tipoBem'],
    direitosPerc: percentage(input.direitosPerc, 'Direitos aduaneiros'),
    icePerc: percentage(input.icePerc, 'ICE', 0), ivaPerc: percentage(input.ivaPerc, 'IVA', 16),
    notas: input.notas === '' ? '' : text(input.notas, 'Notas', 2000, 'Registado por administrador autenticado.'),
    palavrasChave: [descricao.toLowerCase(), codigo]
  };
}
