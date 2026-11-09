# PrimeWay — redesenho corporativo

## Âmbito aprovado

Redesenhar a apresentação da empresa para parecer um site profissional de logística, preservando calculadora, rastreio, sourcing, cursos, conta, histórico, documentos, PWA e correções de segurança. Trabalhar apenas na branch `design/primeway-corporativo`, baseada em `2a9a93d`. O utilizador autorizou o commit e push desta branch para avaliação no Vercel em 9 de novembro de 2026. Sem merge na main, deploy Firebase ou alterações a dados de produção. Não acrescentar requisitos LMS nem funcionalidades de cálculo: esses interesses anteriores não fazem parte deste pedido.

## Direção visual

Estética editorial corporativa aplicada à logística. Princípios: hierarquia clara, linguagem concreta, confiança baseada em informação e espaço negativo. Azul-marinho #16263c como cor principal, branco quente #f7f7f3 para superfícies e laranja #d56a34 apenas para ações comerciais e pequenos destaques. Conservar o símbolo original da PrimeWay, sem trocar a marca.

A composição evita uma página de cartões iguais: hero assimétrico com texto e fotografia; linha horizontal de serviços; lista editorial numerada de modalidades; processo explicado por etapas; bloco da empresa e contactos legíveis. Fotografia portuária real já usada no site, contextual, nunca apresentada como operação ou instalações próprias. Não gerar imagens de equipa nem alegar clientes, parceiros, métricas, atendimento 24/7 ou garantias não comprovadas.

Tipografia: Inter para interfaces e Manrope para títulos, com pesos moderados, títulos em frase em vez de maiúsculas generalizadas, largura de leitura controlada e escalas responsivas. A marca transmite clareza, proximidade e competência. Posicionamento: importação e logística entre a China e Moçambique para pessoas e empresas que precisam de organizar compras e transporte. Microcopy: “Importação e logística entre a China e Moçambique.” e “Conte-nos o que pretende importar.” CTAs “Pedir cotação” e “Simular custos”.

Interações discretas: alterações de cor e linhas de foco, sem cartões a saltar, animações de escala ou vídeo autoplay. Respeitar prefers-reduced-motion e navegação por teclado. Menu mobile claro, ferramentas num dropdown acessível, contactos reais com tel/mailto/WhatsApp. Manter a instalação PWA no rodapé, sem um segundo botão flutuante a competir com o contacto.

## Implementação

Reutilizar React/TypeScript, Vite, Firebase e Express existentes. Não substituir infraestrutura por um novo projeto nem alterar o backend. Os novos componentes de marca são `src/corporate/CorporateHeader.tsx`, `CorporateLanding.tsx` e `CorporateFooter.tsx`; `src/corporate/types.ts` define as vistas e ações partilhadas; `src/corporate/corporate.css` contém estilos isolados. `src/App.tsx` continua a guardar todo o estado de cálculo, autenticação, cursos e rastreio e injeta callbacks nos componentes corporativos. `src/index.css` mantém o sistema de controlos das ferramentas, com tipografia e decoração mais contidas. `public/images` conserva a imagem contextual local e o logótipo original é reutilizado. `index.html` carrega fontes e mantém metadados/manifest existentes, com zoom mobile acessível.

Separar as vistas comerciais e de trabalho: `landing`, `simulador`, `rastreio`, `sourcing` e `cursos`. Conservar as ligações existentes `#simulador` e `#rastreio`, e os callbacks que enviam produtos do sourcing à calculadora. Cabeçalho: Serviços, Como funciona, A empresa, Ferramentas e contacto comercial. Ferramentas: calculadora, rastreio, sourcing, cursos e verificação de fornecedores. Sessão, perfil, histórico e logout continuam disponíveis, com autorização administrativa a vir do servidor.

A pré-visualização reutiliza o servidor existente na porta 3000. Como este repositório não tem um Resource Webdev ligado, não inicializar nem adivinhar identifiers de attach; usar os diagnósticos TypeScript locais se o registo host estiver indisponível.
