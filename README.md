# ReistoOQ Core - Sistema de Gestão de E-commerce

## 📋 Visão Geral

O ReistoOQ Core é um sistema completo de gestão para e-commerce, com foco na integração com Mercado Livre e outras plataformas. O sistema oferece gerenciamento de pedidos, estoque, devoluções e relatórios em tempo real.

## 🚀 Funcionalidades Principais

### 📦 Gestão de Pedidos
- Sincronização automática com Mercado Livre
- Dashboard unificado de pedidos
- Filtros avançados e busca inteligente
- Atualizações em tempo real via webhooks
- Suporte a múltiplas plataformas

### 📊 Controle de Estoque
- Monitoramento em tempo real
- Alertas de estoque baixo
- Gestão de composições de produtos
- Movimentações detalhadas
- SKU mapping automático

### 🔄 Gestão de Devoluções
- Rastreamento completo de claims
- Integração com mediações ML
- Dashboard de devoluções
- Análise de motivos e padrões
- Comunicação automatizada

### 📈 Relatórios e Analytics
- Dashboard executivo
- Métricas de performance
- Relatórios customizáveis
- Exportação de dados
- Monitoramento de saúde do sistema

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **Zustand** para gerenciamento de estado
- **React Query** para cache e sincronização
- **React Router** para navegação

### Backend
- **Supabase** como BaaS (Backend as a Service)
- **Edge Functions** para lógica serverless
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança

### Integrações
- **Mercado Livre API** para pedidos e produtos
- **Webhooks** para atualizações em tempo real
- **OAuth 2.0** para autenticação segura

## 📱 Mobile & Responsividade

O sistema é totalmente responsivo e otimizado para dispositivos móveis:
- Layout adaptativo para tablet e smartphone
- Menu hambúrguer para navegação móvel
- Componentes touch-friendly
- Performance otimizada para conexões lentas

## 🔧 Configuração do Ambiente

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Supabase
- Credenciais Mercado Livre (opcional para desenvolvimento)

### Instalação

1. Clone o repositório:
```bash
git clone [repository-url]
cd reistooq-core
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Configure o Supabase:
- Crie um projeto no Supabase
- Configure as credenciais no arquivo de configuração
- Execute as migrações de banco

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🏗️ Arquitetura do Sistema

### Estrutura de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base (shadcn)
│   ├── mobile/         # Componentes otimizados para mobile
│   ├── pedidos/        # Componentes específicos de pedidos
│   └── monitoring/     # Componentes de monitoramento
├── features/           # Features organizadas por domínio
├── hooks/              # Custom hooks
├── services/           # Serviços de API e integrações
├── stores/             # Stores Zustand
├── utils/              # Utilitários e helpers
├── contexts/           # Contexts React
└── integrations/       # Configurações de integrações
```

### Fluxo de Dados

1. **Webhooks ML** → Edge Functions → Database
2. **Frontend** → React Query → Edge Functions → APIs Externas
3. **Tempo Real** → Supabase Realtime → Frontend Updates

## 🔒 Segurança

### Autenticação e Autorização
- JWT tokens via Supabase Auth
- Row Level Security (RLS) no banco
- Sistema de permissões granulares
- Controle de acesso baseado em organizações

### Proteção de Dados
- Criptografia de dados sensíveis
- Mascaramento de informações pessoais
- Logs de auditoria completos
- Rate limiting nas APIs

## 📊 Monitoramento e Observabilidade

### Métricas de Performance
- Tempo de resposta das APIs
- Taxa de sucesso/erro
- Métricas de usuário
- Saúde do sistema

### Error Tracking
- Captura automática de erros
- Rastreamento de erros de API
- Alertas proativos
- Logs estruturados

### Dashboard de Saúde
- Status em tempo real
- Métricas de performance
- Alertas e notificações
- Exportação de dados

## 🧪 Testes

### Estratégia de Testes
- **Unit Tests**: Funções utilitárias e lógica de negócio
- **Integration Tests**: APIs e serviços
- **Component Tests**: Componentes React críticos
- **E2E Tests**: Fluxos principais (planejado)

### Executar Testes
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

## 🚀 Deploy

### Ambiente de Produção
O sistema pode ser deployado em:
- **Vercel** (recomendado)
- **Netlify**
- **Supabase Hosting**

### CI/CD
- Deploy automático via GitHub Actions
- Testes automatizados no pipeline
- Validação de segurança
- Rollback automático em caso de falha

## 📝 Guias de Desenvolvimento

### Convenções de Código
- **ESLint** + **Prettier** para formatação
- **TypeScript** estrito habilitado
- Convenção de nomenclatura camelCase
- Componentes em PascalCase

### Git Workflow
- Feature branches a partir de `main`
- Pull requests obrigatórios
- Commits convencionais
- Squash merge recomendado

### Contribuição
1. Fork o projeto
2. Crie uma feature branch
3. Faça commit das mudanças
4. Abra um Pull Request
5. Aguarde review e merge

## 🛠️ Troubleshooting

### Problemas Comuns

**Error: Failed to fetch orders**
- Verifique se o token ML está válido
- Confirme se a conta de integração está ativa
- Verifique os logs das Edge Functions

**Build Error: Module not found**
- Execute `npm install` para instalar dependências
- Verifique se os imports estão corretos
- Limpe o cache: `npm run build:clean`

**Database Connection Error**
- Verifique as credenciais do Supabase
- Confirme se as migrações foram executadas
- Verifique se o projeto Supabase está ativo

### Logs e Debug
- Logs do cliente: Console do navegador
- Logs do servidor: Supabase Edge Functions
- Logs de banco: Supabase Dashboard

## 📚 Documentação Adicional

- [API Reference](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Integration Guide](./docs/integrations.md)
- [Security Guidelines](./docs/security.md)

## 🤝 Suporte

Para suporte técnico:
- Abra uma issue no GitHub
- Consulte a documentação completa
- Entre em contato com a equipe de desenvolvimento

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

**ReistoOQ Core** - Desenvolvido com ❤️ para simplificar a gestão de e-commerce.
