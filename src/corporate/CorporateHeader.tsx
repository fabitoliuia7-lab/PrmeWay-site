import { useEffect, useRef, useState } from 'react';
import type { SiteAccount, SiteNavigate, SiteView } from './types';
import { COMPANY, QUOTATION_URL } from './types';
import './shell.css';

interface CorporateHeaderProps {
  activeView: SiteView;
  onNavigate: SiteNavigate;
  isAuthReady: boolean;
  user: SiteAccount | null;
  isAdmin: boolean;
  quoteCount: number;
  onLogin: () => void;
  onProfile: () => void;
  onHistory: () => void;
  onLogout: () => void;
  onSupplierCheck: () => void;
}

const Arrow = () => (
  <svg aria-hidden="true" className="pw-header-arrow" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
  </svg>
);

const Chevron = () => (
  <svg aria-hidden="true" className="pw-header-chevron" viewBox="0 0 12 12" fill="none">
    <path d="m2.25 4.25 3.75 3.5 3.75-3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="square" />
  </svg>
);

export function CorporateHeader({
  activeView,
  onNavigate,
  isAuthReady,
  user,
  isAdmin,
  quoteCount,
  onLogin,
  onProfile,
  onHistory,
  onLogout,
  onSupplierCheck,
}: CorporateHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const toolsMenuId = 'pw-header-tools-menu';

  useEffect(() => {
    if (!mobileOpen && !toolsOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMobileOpen(false);
        setToolsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const trigger = mobileOpen ? menuToggleRef.current : headerRef.current?.querySelector<HTMLButtonElement>('.pw-header-tools-trigger');
        setMobileOpen(false);
        setToolsOpen(false);
        trigger?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, toolsOpen]);

  const navigate = (view: SiteView, section?: string) => {
    if (mobileOpen) menuToggleRef.current?.focus();
    setMobileOpen(false);
    setToolsOpen(false);
    onNavigate(view, section);
  };

  const isToolActive = (view: SiteView) => activeView === view;

  const runAccountAction = (action: () => void) => {
    if (mobileOpen) menuToggleRef.current?.focus();
    setMobileOpen(false);
    setToolsOpen(false);
    action();
  };

  const handleSupplierCheck = () => {
    if (mobileOpen) menuToggleRef.current?.focus();
    setMobileOpen(false);
    setToolsOpen(false);
    onSupplierCheck();
  };

  const mainNavigation = (
    <>
      <button type="button" className="pw-header-nav-link" onClick={() => navigate('landing', 'serviços')}>
        Serviços
      </button>
      <button type="button" className="pw-header-nav-link" onClick={() => navigate('landing', 'como-funciona')}>
        Como funciona
      </button>
      <button type="button" className="pw-header-nav-link" onClick={() => navigate('landing', 'a-empresa')}>
        A empresa
      </button>
    </>
  );

  const toolsNavigation = (mobile = false) => (
    <div className={`pw-header-tools ${toolsOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="pw-header-nav-link pw-header-tools-trigger"
        aria-expanded={toolsOpen}
        aria-controls={mobile ? `${toolsMenuId}-mobile` : `${toolsMenuId}-desktop`}
        onClick={() => setToolsOpen((open) => !open)}
      >
        Ferramentas
        <Chevron />
      </button>
      <div
        id={mobile ? `${toolsMenuId}-mobile` : `${toolsMenuId}-desktop`}
        className="pw-header-tools-panel"
        hidden={!toolsOpen}
      >
        <button type="button" className={`pw-header-tool-link ${isToolActive('simulador') ? 'is-current' : ''}`} aria-current={isToolActive('simulador') ? 'page' : undefined} onClick={() => navigate('simulador')}>
          Simular custos
          <Arrow />
        </button>
        <button type="button" className={`pw-header-tool-link is-emphasis ${isToolActive('rastreio') ? 'is-current' : ''}`} aria-current={isToolActive('rastreio') ? 'page' : undefined} onClick={() => navigate('rastreio')}>
          Rastrear encomenda
          <Arrow />
        </button>
        <button type="button" className={`pw-header-tool-link ${isToolActive('sourcing') ? 'is-current' : ''}`} aria-current={isToolActive('sourcing') ? 'page' : undefined} onClick={() => navigate('sourcing')}>
          Sourcing
          <Arrow />
        </button>
        <button type="button" className={`pw-header-tool-link ${isToolActive('cursos') ? 'is-current' : ''}`} aria-current={isToolActive('cursos') ? 'page' : undefined} onClick={() => navigate('cursos')}>
          Cursos
          <Arrow />
        </button>
        <button type="button" className="pw-header-tool-link" onClick={handleSupplierCheck}>
          Verificação de fornecedores
          <Arrow />
        </button>
      </div>
    </div>
  );

  const accountActions = (mobile = false) => {
    if (!isAuthReady) {
      return <span className="pw-header-account-status" aria-busy="true">A carregar conta</span>;
    }

    if (!user) {
      return (
        <button type="button" className="pw-header-account-login" onClick={() => runAccountAction(onLogin)}>
          Área do cliente
          <Arrow />
        </button>
      );
    }

    return (
      <div className={`pw-header-account ${mobile ? 'pw-header-account--mobile' : ''}`}>
        <button type="button" className="pw-header-account-name" onClick={() => runAccountAction(onProfile)}>
          <span className="pw-header-account-avatar" aria-hidden="true">
            {(user.displayName || user.email || 'P').slice(0, 1).toUpperCase()}
          </span>
          <span className="pw-header-account-copy">
            <span>{user.displayName || user.email || 'Área do cliente'}</span>
            {isAdmin && <small>Administração</small>}
          </span>
        </button>
        <div className="pw-header-account-links">
          <button type="button" onClick={() => runAccountAction(onProfile)}>Perfil</button>
          <button type="button" onClick={() => runAccountAction(onHistory)}>
            Histórico
            {quoteCount > 0 && <span className="pw-header-count" aria-label={`${quoteCount} cotações`}>{quoteCount}</span>}
          </button>
          <button type="button" onClick={() => runAccountAction(onLogout)}>Sair</button>
        </div>
      </div>
    );
  };

  return (
    <header ref={headerRef} className="pw-header">
      <div className="pw-header-topstrip">
        <div className="pw-container pw-header-topstrip-inner">
          <span>Maputo · Moçambique</span>
          <div className="pw-header-topstrip-contact">
            <a href={COMPANY.phoneHref}>{COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </div>
        </div>
      </div>

      <div className="pw-container pw-header-main">
        <a className="pw-header-brand" href="/" aria-label="PrimeWay — página inicial" onClick={(event) => { event.preventDefault(); navigate('landing'); }}>
          <img src="/IMG-20260215-WA0003.jpg" alt="" width="44" height="44" />
          <span className="pw-header-wordmark">
            <strong>PRIMEWAY</strong>
            <small>Invest &amp; Logística</small>
          </span>
        </a>

        <nav className="pw-header-desktop-nav" aria-label="Navegação principal">
          {mainNavigation}
          {toolsNavigation()}
        </nav>

        <div className="pw-header-desktop-actions">
          {accountActions()}
          <a className="pw-primary pw-header-quote" href={QUOTATION_URL} target="_blank" rel="noopener noreferrer">
            Pedir cotação
          </a>
        </div>

        <button
          type="button"
          ref={menuToggleRef}
          className="pw-header-menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="pw-header-mobile-panel"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div id="pw-header-mobile-panel" className={`pw-header-mobile-panel ${mobileOpen ? 'is-open' : ''}`} hidden={!mobileOpen}>
        <nav className="pw-container pw-header-mobile-nav" aria-label="Navegação móvel">
          {mainNavigation}
          {toolsNavigation(true)}
          <div className="pw-header-mobile-account">{accountActions(true)}</div>
          <a className="pw-secondary pw-header-mobile-quote" href={QUOTATION_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
            Pedir cotação
          </a>
        </nav>
      </div>
    </header>
  );
}
