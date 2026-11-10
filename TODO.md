# PrimeWay — resultados do trabalho

## Segurança preservada

- [x] Escritas administrativas da pauta protegidas por token Firebase e permissões reais, pesquisa pública sem alterar dados globais e regras Firestore restritas.
- [x] Chat público com validação e limites; chave Gemini exclusivamente no servidor; permissões da aplicação verificadas pelo servidor.

## Redesenho corporativo aprovado

- [x] Página comercial com hero assimétrico, título concreto sobre China–Moçambique, CTAs “Pedir cotação” e “Simular custos”, serviços, etapas do processo, empresa e contactos; sem métricas, testemunhos ou imagens empresariais inventados.
- [x] Cabeçalho mais simples e menu de ferramentas com calculadora, rastreio, sourcing, cursos e verificação de fornecedores; preservadas entrada, perfil, histórico e logout, incluindo no telemóvel.
- [x] Calculadora e rastreio em vistas próprias, preservando estado, callbacks de sourcing, funcionalidades e ligações #simulador/#rastreio; a página comercial deixa de mostrar formulários longos por defeito. Atalhos PWA modernos e antigos compatíveis.
- [x] Visual sóbrio com azul-marinho, branco quente e laranja pontual, títulos em frase, tipografia legível, espaços consistentes, menos sombras/gradientes/animações, logótipo existente e fotografia contextual real.
- [x] Rodapé com dados comerciais existentes, telefone/e-mail/WhatsApp acionáveis, termos/privacidade/compliance, pauta AT e instalação PWA; retirado o botão flutuante de instalação redundante.
- [x] Experiência responsiva e navegação por teclado, menus identificados, foco visível, movimento reduzido e zoom mobile permitido; TypeScript, build e testes de segurança sem regressões.

## Evidência

Passaram 9 testes do redesenho, 13 testes da API, TypeScript, build e git diff --check. A verificação pontual no navegador confirmou ausência de overflow horizontal a 320, 390, 768, 1024 e 1440 px, menu móvel e retorno de foco, preservação de estado da calculadora entre vistas, botão de topo sem alterar a vista e skip link a focar o main real. Nenhuma exceção de página. Chamadas ao Firebase de produção foram bloqueadas durante esta verificação; não houve gravações de produção.

O backend, regras Firestore, helpers de autorização e módulos de cálculo de contentores não têm alterações. O sourcing recebeu somente id/tabIndex no seu main para acessibilidade. Permanece o aviso de bundle JavaScript grande, já existente; não impede a compilação e não foi introduzida uma otimização de infraestrutura neste âmbito.

Branch `design/primeway-corporativo`, baseada em `2a9a93d`. O utilizador autorizou o commit e push desta branch para avaliação no Vercel em 9 de novembro de 2026. Sem merge na main, deploy Firebase ou alterações a dados de produção. Ver plan.md para a direção aprovada. Imagens da proposta guardadas em /home/ubuntu/primeway-review/primeway-redesenho-desktop.png e primeway-redesenho-mobile.png.

## Ajuste do slogan e da consulta HS — 10 de novembro de 2026

- [x] Manter “Excelência em cada importação.” no site com a apresentação corporativa atual. Redação também uniformizada nos documentos existentes.
- [x] No simulador de contentores, retirar atalhos rápidos de categorias, botões repetidos e pesquisa duplicada da Parte 1, deixando uma secção de impostos mais simples com detalhes manuais recolhíveis.
- [x] Ao introduzir o código nacional HS de oito dígitos, preencher automaticamente descrição e alíquotas DA/ICE/IVA numéricas disponíveis a partir de correspondência exata na base pautal; aceitar pontos/espaços/hífen, mostrar estado da consulta e não depender de um clique num botão. Códigos de quatro/seis dígitos pedem a seleção da subposição; nenhum prefixo ou estimativa aplica a primeira tarifa arbitrariamente. As exceções são os campos em branco e ICE por medida/fórmula mista, explicitamente “A confirmar”, nunca percentagens inventadas.
- [x] A consulta reutiliza a API própria e tem fallback estático da base completa para Vercel sem Express, cache e pré-carregamento; respostas antigas não sobrescrevem outro código, edição manual ou contentor. Não afirmar taxas atuais oficiais/sincronização em tempo real quando apenas há uma cópia disponível.
- [x] IVA igual a zero mantém-se zero no cálculo; taxas em branco têm tratamento explícito e TSA/MCNET/Kudumba continuam independentes do HS. Preservar quantidades, totais, dados guardados, exportação e segurança. Enquanto faltar confirmar uma alíquota, não mostrar total/comparação estratégica como concluídos nem permitir proforma/nota de débito. Resumo de custos usa a alíquota real, sem IVA 16% fixo.

Âmbito atual exclusivamente local na branch `fix/contentor-hs-automatico`, baseada em `910c05d`. A autorização de push anterior respeitava ao redesenho já enviado; não implica deploy/merge destas novas alterações.

Verificação pontual no navegador concluída: slogan original, preenchimento de código exato, zeros e confirmação manual, mesmo código com outra formatação, códigos inexistentes, seleção de subposição, resposta antiga ao mudar código/contentor ou editar manualmente, ausência de overflow a 320/390/768 px e fallback estático sem Express. Nenhuma exceção de página. Chamadas Firebase de produção bloqueadas e nenhum botão de gravação/exportação acionado. Evidência em `/home/ubuntu/primeway-review/primeway-hs-verificacao.json` e imagens `primeway-hs-desktop.png` / `primeway-hs-mobile.png`. Ver `PAUTA_HS_NOTES.md` para fonte e limitações.

## Limpeza dos cartões do simulador e do sourcing

- [x] Simulador com títulos curtos, acesso discreto ao sourcing e menos cartões/textos explicativos repetidos; ações principais, seleção de modalidade, quantidades e cálculos preservados.
- [x] Cartões FCL mostram valores essenciais e avisos necessários; especificações e análise/comparação secundárias ficam recolhíveis, sem promessas promocionais de economia/rentabilidade. Preservar HS automático, alíquotas por confirmar e guardas de proforma. Seleção de contentor/veículo disponível por teclado e avisos de peso/volume excedido apenas quando aplicáveis.
- [x] Aba de sourcing com navegação e painel mais simples, sem banner explicativo longo nem selos decorativos repetidos; preservar todas as abas e os atalhos funcionais do painel. “Comparar” abre o pedido clicado; o acesso ao catálogo é corretamente rotulado “Ver catálogo”.
- [x] Cartões de produto com nome/foto/preço/moeda/unidade/mínimo/fornecedor e ação de simulação visíveis; detalhes técnicos e nomes alternativos recolhíveis. Preservar pesquisa/filtros, edição de preço/MOQ, produto/fornecedores e envio de dados à calculadora. Fornecedor em falta fica “Por definir”; ausência/erro de fotografia usa um cabeçalho compacto, sem inventar imagens. “Simular” abre carga geral, onde o produto enviado está disponível, mesmo vindo de FCL/veículos.

Alterações de apresentação apenas, mantendo slogan, dados guardados, quantidade/CBM/peso, cálculos, segurança e estado local anterior. Sem envio ao GitHub nem publicação neste pedido.

Verificação: 5 testes de sourcing, 25 testes HS/cálculo/FCL, 9 testes corporativos e TypeScript passaram. No navegador isolado, validaram-se modos, HS, análise recolhível, as nove abas, comparação do pedido selecionado, detalhes/filtros/edição de preço (sem guardar) e envio à modalidade correta. Sem overflow a 320/390/768/1440 px nem exceções de página; Firebase bloqueado durante a verificação. Os hashes dos módulos de cálculo, HS, backend, regras e persistência são idênticos aos anteriores à limpeza. Evidência em `/home/ubuntu/primeway-review/primeway-cleanup-verificacao.json`. Permanecem avisos de bundle grande já existentes, sem introduzir nova infraestrutura.

Compilação final concluída com sucesso após o ajuste de imagens indisponíveis; `git diff --check` passou. Versão permanece local, sem commit, push, merge ou deploy destas alterações.

## Envio autorizado — 10 de novembro de 2026

O utilizador autorizou agora commit e push do conjunto de alterações (slogan, HS automático e limpeza do simulador/sourcing) para `fix/contentor-hs-automatico`. Esta autorização substitui o estado exclusivamente local indicado nas fases anteriores. Não fazer merge na `main`, deploy Firebase ou publicação manual. As verificações anteriores e os dados de produção permanecem preservados.
