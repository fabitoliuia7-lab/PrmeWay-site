export type SiteView = 'landing' | 'simulador' | 'rastreio' | 'sourcing' | 'cursos';
export type SiteNavigate = (view: SiteView, section?: string) => void;
export type LegalTopic = 'termos' | 'privacidade' | 'compliance';

export interface SiteAccount {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export const COMPANY = {
  name: 'PrimeWay Invest & Logística, SU, Lda.',
  email: 'comercial@primewayinvest.com',
  phone: '+258 84 291 4655',
  phoneHref: 'tel:+258842914655',
  secondPhone: '+258 82 692 1467',
  secondPhoneHref: 'tel:+258826921467',
  address: 'Bairro Matola A, Quarteirão 17, Casa Nº 38, Cidade da Matola, Maputo — Moçambique',
  nuit: '402119357',
} as const;

export const QUOTATION_URL = 'https://wa.me/258842914655?text=' + encodeURIComponent('Olá, gostaria de pedir uma cotação de importação.');

export function resolveSiteView(view: SiteView, section?: string): SiteView {
  if (view === 'landing' && section === 'simulador') return 'simulador';
  if (view === 'landing' && section === 'rastreio') return 'rastreio';
  return view;
}

export function siteViewFromHash(hash: string): SiteView {
  const view = hash.replace(/^#/, '');
  if (view === 'calculator') return 'simulador';
  if (view === 'tracking') return 'rastreio';
  return ['simulador', 'rastreio', 'sourcing', 'cursos'].includes(view) ? view as SiteView : 'landing';
}
