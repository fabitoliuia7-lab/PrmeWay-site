import './landing.css';
import { COMPANY, QUOTATION_URL, type SiteNavigate } from './types';

type CorporateLandingProps = { onNavigate: SiteNavigate };

const services = [
  { number: '01', title: 'Importação assistida', text: 'Para quem já encontrou o produto e precisa de organizar a receção na China, a consolidação, o transporte e o desembaraço conforme a origem.' },
  { number: '02', title: 'Importação completa', text: 'Acompanhamos a compra desde a busca e negociação até ao pagamento internacional, embalagem e logística de entrega.' },
];

const steps = [
  ['01', 'Produto e fornecedor', 'Partilhe o que pretende importar e os dados do fornecedor, se já os tiver.'],
  ['02', 'Proposta e planeamento', 'Analisamos o pedido, alinhamos a rota e enviamos uma cotação para confirmação.'],
  ['03', 'Embarque e acompanhamento', 'Organizamos o transporte e mantemos a informação da operação acessível.'],
  ['04', 'Despacho e entrega', 'A operação segue para despacho e entrega de acordo com o serviço confirmado.'],
];

export function CorporateLanding({ onNavigate }: CorporateLandingProps) {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="pw-landing">

      <section id="inicio" className="pw-landing__hero" aria-labelledby="hero-title">
        <div className="pw-landing__hero-copy">
          <p className="pw-landing__brand">PrimeWay <span>Invest &amp; Logística</span></p>
          <p className="pw-eyebrow">China <span aria-hidden="true">↔</span> Moçambique</p>
          <h1 id="hero-title" className="pw-title">Importação e logística entre a China e Moçambique.</h1>
          <p className="pw-landing__intro">Organizamos compras, transporte e entrega para pessoas e empresas que precisam de importar com mais clareza em cada etapa.</p>
          <div className="pw-landing__actions">
            <a className="pw-primary" href={QUOTATION_URL} target="_blank" rel="noreferrer">Pedir cotação <span aria-hidden="true">↗</span></a>
            <button className="pw-secondary" type="button" onClick={() => onNavigate('simulador')}>Simular custos <span aria-hidden="true">→</span></button>
          </div>
        </div>
        <figure className="pw-landing__hero-media">
          <img src="/images/operacao-portuaria.jpg" alt="Navio de carga e gruas num terminal portuário" />
          <figcaption>Transporte marítimo · Imagem ilustrativa</figcaption>
        </figure>
      </section>

      <section className="pw-landing__route-line" aria-label="Serviços e rotas">
        <div className="pw-container pw-landing__route-inner">
          <p><span>01</span> Frete marítimo</p>
          <p><span>02</span> Frete aéreo</p>
          <p><span>03</span> Apoio à importação</p>
        </div>
      </section>

      <section id="serviços" className="pw-landing__section pw-landing__services" aria-labelledby="services-title">
        <div className="pw-container">
          <div className="pw-landing__section-head">
            <p className="pw-eyebrow">Serviços</p>
            <h2 id="services-title" className="pw-title">A rota certa depende do que vai importar.</h2>
            <p>Escolha o nível de apoio de que precisa. Em ambos os casos, começamos por perceber o produto, a origem e o destino antes de propor o próximo passo.</p>
          </div>
          <div className="pw-landing__service-list">
            {services.map((service) => (
              <article className="pw-landing__service-row" key={service.number}>
                <span className="pw-landing__service-number">{service.number}</span>
                <div>
                  <h3 className="pw-title">{service.title}</h3>
                  <p>{service.text}</p>
                </div>
                <a className="pw-link" href={QUOTATION_URL} target="_blank" rel="noreferrer">Pedir cotação <span aria-hidden="true">↗</span></a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="pw-landing__section pw-landing__process" aria-labelledby="process-title">
        <div className="pw-container">
          <div className="pw-landing__section-head pw-landing__section-head--process">
            <p className="pw-eyebrow">Como funciona</p>
            <h2 id="process-title" className="pw-title">Uma operação, quatro momentos claros.</h2>
          </div>
          <div className="pw-landing__steps">
            {steps.map(([number, title, text]) => (
              <article className="pw-landing__step" key={number}>
                <span>{number}</span>
                <h3 className="pw-title">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="pw-landing__note">Cada operação é confirmada por cotação.</p>
        </div>
      </section>

      <section id="a-empresa" className="pw-landing__section pw-landing__company" aria-labelledby="company-title">
        <div className="pw-container pw-landing__company-grid">
          <div>
            <p className="pw-eyebrow">A empresa</p>
            <h2 id="company-title" className="pw-title">Importar pode ser mais simples quando o caminho está organizado.</h2>
          </div>
          <div className="pw-landing__company-copy">
            <p>A {COMPANY.name} apoia clientes em Moçambique na coordenação de compras e transporte a partir da China. O nosso trabalho é tornar cada decisão mais compreensível: o que comprar, como transportar e o que acontece depois.</p>
            <p>Trabalhamos a partir da Matola, com atenção ao contexto de cada carga e ao serviço confirmado na cotação.</p>
            <dl className="pw-landing__details">
              <div><dt>Localização</dt><dd>Matola, Maputo — Moçambique</dd></div>
              <div><dt>NUIT</dt><dd>{COMPANY.nuit}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="pw-landing__tools" aria-labelledby="tools-title">
        <div className="pw-container pw-landing__tools-inner">
          <div>
            <p className="pw-eyebrow">Ferramentas</p>
            <h2 id="tools-title" className="pw-title">Tenha o próximo passo à mão.</h2>
          </div>
          <nav className="pw-landing__tool-links" aria-label="Ferramentas PrimeWay">
            <button type="button" onClick={() => onNavigate('simulador')}><span>Calculadora</span><small>Estimar custos</small><b aria-hidden="true">→</b></button>
            <button type="button" onClick={() => onNavigate('rastreio')}><span>Rastreio</span><small>Consultar operação</small><b aria-hidden="true">→</b></button>
            <button type="button" onClick={() => onNavigate('sourcing')}><span>Sourcing</span><small>Encontrar produtos</small><b aria-hidden="true">→</b></button>
            <button type="button" onClick={() => onNavigate('cursos')}><span>Cursos</span><small>Aprender a importar</small><b aria-hidden="true">→</b></button>
          </nav>
        </div>
      </section>

      <section id="contactos" className="pw-landing__contact" aria-labelledby="contact-title">
        <div className="pw-container pw-landing__contact-inner">
          <div>
            <p className="pw-eyebrow">Contactos</p>
            <h2 id="contact-title" className="pw-title">Conte-nos o que pretende importar.</h2>
          </div>
          <div className="pw-landing__contact-links">
            <a className="pw-primary" href={QUOTATION_URL} target="_blank" rel="noreferrer">Falar no WhatsApp <span aria-hidden="true">↗</span></a>
            <a className="pw-link" href={`mailto:${COMPANY.email}`}>{COMPANY.email} <span aria-hidden="true">↗</span></a>
            <a className="pw-link" href={COMPANY.phoneHref}>{COMPANY.phone}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
