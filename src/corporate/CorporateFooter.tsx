import type { LegalTopic, SiteNavigate } from './types';
import { COMPANY, QUOTATION_URL } from './types';
import './shell.css';

interface CorporateFooterProps {
  onNavigate: SiteNavigate;
  onLegal: (topic: LegalTopic) => void;
  onSupplierCheck: () => void;
  onInstall: () => void;
  showInstall: boolean;
}

export function CorporateFooter({ onNavigate, onLegal, onSupplierCheck, onInstall, showInstall }: CorporateFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="pw-footer">
      <div className="pw-container pw-footer-main">
        <div className="pw-footer-intro">
          <p className="pw-eyebrow">PrimeWay</p>
          <h2 className="pw-title">Excelência em cada importação.</h2>
          <a className="pw-link pw-footer-contact-link" href={`mailto:${COMPANY.email}`}>
            Falar com a equipa <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="pw-footer-nav-column">
          <h3>Serviços</h3>
          <nav aria-label="Serviços">
            <button type="button" onClick={() => onNavigate('landing', 'serviços')}>Serviços</button>
            <button type="button" onClick={() => onNavigate('landing', 'como-funciona')}>Como funciona</button>
            <button type="button" onClick={() => onNavigate('landing', 'a-empresa')}>A empresa</button>
            <button type="button" onClick={() => onNavigate('simulador')}>Simular custos</button>
          </nav>
        </div>

        <div className="pw-footer-nav-column">
          <h3>Ferramentas</h3>
          <nav aria-label="Ferramentas">
            <button type="button" onClick={() => onNavigate('rastreio')}>Rastrear encomenda</button>
            <button type="button" onClick={() => onNavigate('sourcing')}>Sourcing</button>
            <button type="button" onClick={() => onNavigate('cursos')}>Cursos</button>
            <button type="button" onClick={onSupplierCheck}>Verificar fornecedor</button>
          </nav>
        </div>

        <div className="pw-footer-nav-column">
          <h3>Empresa</h3>
          <address>
            <span>{COMPANY.name}</span>
            <span>NUIT {COMPANY.nuit}</span>
            <span>{COMPANY.address}</span>
          </address>
          <div className="pw-footer-contact-list">
            <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>
            <a href={COMPANY.secondPhoneHref}>{COMPANY.secondPhone}</a>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            <a href={QUOTATION_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>

      <div className="pw-container pw-footer-lower">
        <div className="pw-footer-legal">
          <span>© {year} PrimeWay</span>
          <button type="button" onClick={() => onLegal('termos')}>Termos</button>
          <button type="button" onClick={() => onLegal('privacidade')}>Privacidade</button>
          <button type="button" onClick={() => onLegal('compliance')}>Compliance</button>
          <a href="https://www.at.gov.mz/por/Alfandeagas/Pauta-Aduaneira" target="_blank" rel="noopener noreferrer">Pauta Aduaneira</a>
        </div>
        <div className="pw-footer-actions">
          {showInstall && (
            <button type="button" className="pw-footer-install" onClick={onInstall}>Instalar aplicação</button>
          )}
          <button type="button" className="pw-footer-top" aria-label="Voltar ao topo" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>↑</button>
        </div>
      </div>
    </footer>
  );
}
