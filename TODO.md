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
