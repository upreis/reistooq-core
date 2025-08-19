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

## MercadoLibre API - Scripts Curl

### OAuth Flow
```bash
# 1. Iniciar OAuth
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolivre-oauth-start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"organization_id": "current"}'

# 2. Refresh Token
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolivre-refresh-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"integration_account_id": "ACCOUNT_ID"}'
```

### Orders API
```bash
# 3. Buscar Pedidos (com paginação)
curl -X POST https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/mercadolivre-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "integration_account_id": "ACCOUNT_ID",
    "limit": 50,
    "offset": 0,
    "date_created_from": "2024-01-01T00:00:00.000-00:00",
    "sort": "date_created",
    "order": "desc"
  }'
```
