# Deploy DevMind to Vercel with Custom Domain

This guide will help you deploy DevMind to Vercel and connect it to your domain `usedevmind.com`.

## Prerequisites

- GitHub account with this repository
- Vercel account (sign up at https://vercel.com)
- Domain `usedevmind.com` with DNS access

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dashboard/dist`
   - **Install Command**: `cd dashboard && npm install --legacy-peer-deps`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add these variables:
     - `VITE_SUPABASE_URL` = `https://srrgniyqyuiqheqdefop.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmduaXlxeXVpcWhlcWRlZm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTY2MzcsImV4cCI6MjA3ODM5MjYzN30.387glgltQUpUTBgdeqziEv0LVnDxw1NrkQlqq6T5OHs`

6. Click "Deploy"

## Step 3: Connect Your Custom Domain

1. After deployment, go to your project dashboard
2. Click on "Settings" → "Domains"
3. Add your domain: `usedevmind.com`
4. Vercel will provide DNS records to add

### DNS Configuration

Add these DNS records in your domain registrar (where you bought usedevmind.com):

**For root domain (usedevmind.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**Alternative (recommended):**
If your DNS provider supports ANAME/ALIAS records:
- Type: `ANAME` or `ALIAS`
- Name: `@`
- Value: `cname.vercel-dns.com`

5. Wait for DNS propagation (can take up to 48 hours, usually minutes)
6. Vercel will automatically provision SSL certificates

## Step 4: Update Supabase Settings

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "Authentication" → "URL Configuration"
4. Add your domain to allowed URLs:
   - Site URL: `https://usedevmind.com`
   - Redirect URLs: Add `https://usedevmind.com/**`

## Verification

Once DNS propagates:
- Visit https://usedevmind.com
- Your app should load with SSL
- Test authentication to ensure everything works

## Continuous Deployment

Every push to your main branch will automatically deploy to Vercel.

## Troubleshooting

### Build fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify the build command is correct

### Domain not connecting
- Verify DNS records are correct
- Wait for DNS propagation (use https://dnschecker.org)
- Check Vercel domain settings

### Authentication issues
- Verify Supabase URL configuration
- Check environment variables in Vercel
- Ensure redirect URLs are whitelisted in Supabase

## Support

- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
