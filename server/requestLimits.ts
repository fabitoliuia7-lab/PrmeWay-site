import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

export function createIpLimiter(limit: number, windowMs = 60_000): RequestHandler {
  return rateLimit({
    windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    // trust proxy is explicitly configured by the application; untrusted forwarding is ignored.
    validate: { xForwardedForHeader: false },
    message: { error: 'Demasiados pedidos. Aguarde antes de tentar novamente.' }
  });
}

// These budgets intentionally apply even to the local knowledge-engine fallback. They bound
// work per server process, not across replicas; distributed deployments need a shared store.
export function createChatBudget({ maximum = 120, concurrent = 4, windowMs = 3_600_000, now = Date.now } = {}): RequestHandler {
  let windowStart = now();
  let requests = 0;
  let active = 0;
  return (_req, res, next) => {
    const current = now();
    if (current - windowStart >= windowMs) { windowStart = current; requests = 0; }
    if (requests >= maximum || active >= concurrent) {
      res.setHeader('Retry-After', active >= concurrent ? 10 : Math.max(1, Math.ceil((windowMs - (current - windowStart)) / 1000)));
      res.status(429).json({ error: 'O assistente atingiu o limite de utilização. Tente novamente mais tarde.' });
      return;
    }
    requests += 1;
    active += 1;
    let released = false;
    const release = () => { if (!released) { active -= 1; released = true; } };
    res.once('finish', release);
    res.once('close', release);
    next();
  };
}

export function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error('Invalid positive integer configuration.');
  return number;
}
