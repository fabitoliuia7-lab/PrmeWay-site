# Correções locais de segurança

Commit e push autorizados exclusivamente para `fix/seguranca`, sem juntar à `main`, publicar ou executar deploy Firebase. Preservados o aspeto e a consulta pública da pauta.

- [x] Permitir alterações da pauta apenas a administradores autenticados, com validação dos dados; impedir que pesquisas públicas alterem a pauta global.
- [x] Restringir as regras Firestore da pauta e impedir privilégios administrativos por e-mail não verificado.
- [x] Limitar a frequência, o tamanho e o custo potencial dos pedidos de chat; manter o chat público com proteção contra abuso.
- [x] Adaptar as chamadas do cliente às permissões e limites, sem expor a chave Gemini no JavaScript; usar a autorização do servidor nos painéis administrativos.
- [x] Verificar TypeScript, compilação e testes locais de segurança, sem tocar nos dados de produção.

Evidência: 13 testes de API e 8 testes Firestore Emulator passaram; TypeScript e build passaram. Site local HTTP 200; operações administrativas anónimas HTTP 401. A aplicação em produção permanece por autorizar e executar; consultar SECURITY_CHANGES.md.
