# GitHub Auto-Deployment Setup

This guide will help you set up automatic deployment from GitHub to your hosting platform.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right, select "New repository"
3. Name your repository (e.g., "devmind")
4. Keep it Private or Public (your choice)
5. Do NOT initialize with README (we already have files)
6. Click "Create repository"

## Step 2: Push Code to GitHub

Open a terminal and run these commands:

```bash
cd /path/to/devmind
git init
git add .
git commit -m "Initial commit: DevMind AI Platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your actual GitHub username and repository name.

## Step 3: Deploy to Vercel (Recommended)

### Why Vercel?
- Free tier available
- Automatic deployments from GitHub
- Built-in SSL certificates
- Global CDN
- Perfect for React/Vite apps

### Setup Steps:

1. Go to [Vercel](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Click "Import Project" or "Add New Project"
5. Select your DevMind repository
6. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
7. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from your `dashboard/.env` file:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_OPENAI_API_KEY`
8. Click "Deploy"

### After First Deploy:

Your app is now live! Vercel will give you a URL like: `https://devmind.vercel.app`

**Auto-Deploy is Active**: Every time you push to the `main` branch, Vercel automatically deploys the changes.

## Step 4: Update from Here (This Environment)

After your initial setup, here's your workflow:

1. Make changes here in this environment
2. Test your changes locally if needed
3. Run `npm run build` to ensure everything builds
4. Push to GitHub:
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push
   ```
5. Vercel automatically deploys (takes 1-2 minutes)
6. Check your live site to see the changes

## Alternative: Deploy to Netlify

If you prefer Netlify:

1. Go to [Netlify](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub and select your repository
5. Configure:
   - **Base directory**: `dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dashboard/dist`
6. Add environment variables (same as Vercel)
7. Click "Deploy site"

## Custom Domain (Optional)

### On Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### On Netlify:
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions

## Important Notes

### What Gets Deployed:
- Only files in `dashboard/dist` after build
- Environment variables from hosting platform (not `.env` file)

### What Stays Private:
- `.env` files (excluded by `.gitignore`)
- `node_modules/` (excluded by `.gitignore`)
- Terraform state files (excluded by `.gitignore`)

### Database Updates:
- Supabase database is separate from your deployment
- Database changes apply immediately to live app
- No need to redeploy for database schema changes

## Troubleshooting

### Build Fails on Vercel/Netlify:
1. Check that all environment variables are set correctly
2. Verify the root directory is set to `dashboard`
3. Check build logs for specific errors

### Changes Not Showing:
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check deployment status on Vercel/Netlify dashboard
3. Verify changes were pushed to GitHub

### Environment Variables Not Working:
1. Make sure they're added to Vercel/Netlify (not just `.env` file)
2. Redeploy after adding/changing environment variables
3. Variable names must start with `VITE_` to be accessible in the app

## Quick Reference

**Make changes here → Build → Push to GitHub → Auto-deploy to Vercel/Netlify**

```bash
# Standard workflow
npm run build
git add .
git commit -m "Your update message"
git push
```

That's it! Your changes will be live in 1-2 minutes.
