# PrimeWay — correções locais de segurança

## Estado

Alterações preparadas a partir do commit `2f5edb7`. O utilizador autorizou o commit e o push exclusivamente para a branch `fix/seguranca`, sem juntar à `main`, publicar ou executar deploy das regras Firebase. Não foram alterados dados de produção. A aplicação destas correções ao site publicado e às regras Firestore permanece uma operação separada, por autorizar.

## Proteções implementadas

As operações `POST /api/pauta/custom` e `POST /api/pauta/at-sync` exigem um ID token Firebase no cabeçalho `Authorization: Bearer`. O servidor usa Firebase Admin para verificar assinatura, expiração, emissor e projeto. A identidade e as permissões nunca são obtidas de campos enviados pelo cliente. `GET /api/admin/session` permite ao cliente consultar as suas permissões.

Um administrador é reconhecido por custom claim `admin: true`, por um dos dois e-mails administrativos existentes **verificado pelo Firebase**, ou pelo seu documento `users/{uid}` com `role: admin`. A leitura deste último usa o token do próprio utilizador e respeita as regras Firestore. Se não for possível verificar a autorização, a operação é recusada. Tokens válidos mantêm a duração normal do Firebase; a verificação de revogação imediata não foi adicionada.

As regras `firestore.rules` mantêm a pauta disponível para leitura pública, mas reservam criação, atualização e eliminação a administradores. Os dados escritos são validados por campos, tipos, formato SH, taxas e comprimentos. Um cliente não pode promover o seu próprio perfil a administrador. E-mails administrativos não verificados deixaram de conceder privilégios por si só.

A consulta pública `GET /api/pauta/realtime-lookup` deixou de adicionar pesquisas à pauta global em memória. As estimativas geradas por esta rota são identificadas como não verificadas. A classificação tarifária e a legislação não foram auditadas nesta tarefa.

O chat continua público, mas passou a ter validação de mensagens, limite de corpo JSON, frequência, concorrência, utilização e geração. O cliente envia apenas o histórico recente permitido e mostra erros de autorização ou de limites. A configuração Vite deixou de inserir `GEMINI_API_KEY` no JavaScript do navegador; a chave pertence exclusivamente ao servidor.

## Limites predefinidos

| Controlo | Limite |
|---|---|
| Pedidos a `/api`, por IP | 120 por minuto |
| Pedidos administrativos, por IP | 20 por minuto |
| Sincronização AT, por IP administrativo | 2 em 10 minutos |
| Pedidos de chat, por IP | 12 por minuto |
| Pedidos de chat, por processo | 120 por hora |
| Gerações de chat simultâneas, por processo | 4 |
| Corpo JSON | 128 KB |
| Histórico de chat | 20 mensagens / 24.000 caracteres |
| Mensagem do utilizador | 4.000 caracteres |
| Mensagem do assistente | 8.000 caracteres |
| Geração Gemini | 1.500 tokens de saída / prazo de 30 segundos |
| Pesquisa pautal | 256 caracteres |

`CHAT_GLOBAL_MAX_PER_HOUR` pode ajustar o limite horário. Os contadores estão em memória: reinícios repõem-nos e réplicas não partilham o orçamento. **Isto não constitui um teto financeiro global.** Para produção com várias instâncias, usar um contador partilhado e configurar quotas/orçamentos no fornecedor da IA.

O servidor não confia em `X-Forwarded-For` por predefinição. Configurar `TRUSTED_PROXY_CIDRS` com os endereços ou redes reais dos proxies controlados, separados por vírgulas. Não usar confiança irrestrita: um cabeçalho controlado por terceiros não pode permitir contornar os limites. Sem esta configuração, utilizadores atrás do mesmo proxy podem partilhar o limite.

## Testes executados

A suite da API passou 13 testes de autorização, recusa de tokens inválidos, validação, corpo JSON, consulta pública sem escrita, limites por IP, utilização e concorrência. As permissões positivas do middleware foram testadas com verificadores injetados; não foi utilizada uma sessão administrativa real nem feita chamada de IA paga.

As regras passaram 8 testes contra o Firestore Emulator, com o projeto isolado `demo-primeway-security`, sem ligação à base de dados real. A verificação TypeScript e a compilação Vite passaram. Permanecem os avisos anteriores de importação CSS das fontes e de tamanho do bundle JavaScript, fora do âmbito destas correções.

Para repetir a verificação da API e a compilação:

```bash
npm ci
npm run test:security
npm run lint
npm run build
```

Para repetir as regras, instalar Java e utilizar o Firestore Emulator, nunca o projeto de produção:

```bash
npx --yes firebase-tools@15.35.0 emulators:exec \
  --only firestore \
  --project demo-primeway-security \
  --config firebase.security-test.json \
  "npm run test:rules"
```

## Antes de aplicar em produção

Aplicar o código e as regras Firestore ao projeto e à base de dados corretos somente após autorização. A publicação do frontend não aplica as regras Firestore automaticamente. Confirmar o acesso dos administradores com e-mail verificado e rever perfis `users` já marcados como `admin`: alterações antigas indevidas não são removidas por este patch.

Caso uma versão publicada anteriormente tenha sido compilada com a chave Gemini disponível no frontend, considerar essa chave exposta e substituí-la no fornecedor antes da nova publicação. Esta tarefa não consultou nem alterou chaves reais.

O rastreio individual por código continua público, conforme o comportamento existente; não foi bloqueado porque isso alteraria a funcionalidade comercial. Deve ser objeto de uma revisão de privacidade separada, incluindo códigos não previsíveis e dados mínimos apresentados. Os códigos pautais personalizados continuam em memória do servidor, como antes; não foi introduzida persistência nova.
