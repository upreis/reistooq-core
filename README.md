# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/258a105b-decd-40ba-b5d1-b7ec18beb5b0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/258a105b-decd-40ba-b5d1-b7ec18beb5b0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/258a105b-decd-40ba-b5d1-b7ec18beb5b0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## MercadoLibre Integration Setup

### 1. Cadastrar Aplicação no MercadoLibre

1. Acesse [MercadoLibre Developers](https://developers.mercadolibre.com/)
2. Faça login e crie uma nova aplicação
3. Configure as URLs de redirecionamento:
   - **URL de callback**: `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service`
4. Anote o `CLIENT_ID` e `CLIENT_SECRET`

### 2. Configurar Secrets no Supabase

Acesse [Edge Functions Secrets](https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/settings/functions) e configure:

```
ML_CLIENT_ID = seu_client_id_aqui
ML_CLIENT_SECRET = seu_client_secret_aqui  
ML_REDIRECT_URI = https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service
ML_SITE_ID = MLB
APP_ENCRYPTION_KEY = sua_chave_de_criptografia_segura
```

### 3. Testar a Integração

Execute o script de teste:
```bash
node scripts/test-mercadolivre-integration.js
```

### 4. Fluxo de Uso

**Iniciar OAuth:**
```bash
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/hyper-function \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"usePkce": true}'
```

**Renovar Token:**
```bash
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smart-responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"integration_account_id": "uuid-here"}'
```

**Buscar Pedidos:**
```bash
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/rapid-responder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "integration_account_id": "uuid-here",
    "seller_id": 123456789,
    "date_from": "2024-01-01T00:00:00.000Z",
    "date_to": "2024-12-31T23:59:59.999Z",
    "order_status": "paid",
    "limit": 50
  }'
```

### 5. URLs das Funções

- **OAuth Start**: `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/hyper-function`
- **OAuth Callback**: `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smooth-service`
- **Token Refresh**: `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/smart-responder`
- **Orders API**: `https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/rapid-responder`
