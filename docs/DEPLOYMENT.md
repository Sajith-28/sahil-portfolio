# Deployment Guide

This guide covers deploying the Sahil Portfolio website to various hosting platforms.

## Quick Links

- [Railway.app](#railwayapp) ⭐ **Recommended - Easiest**
- [Render.com](#rendercom)
- [Heroku](#heroku-legacy)
- [Azure App Service](#azure-app-service)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables-reference)

---

## Railway.app

**Why Railway?** Simplest setup, free tier available, auto-deploys on git push.

### Step 1: Connect Repository

1. Go to [Railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub**
3. Authorize Railway and select this repository

### Step 2: Add Environment Variables

1. Click **Variables** (or go to project settings)
2. Add each variable from your `.env`:

```
MONGODB_URI=mongodb+srv://...
DB_NAME=sahil_portfolio
SECRET_KEY=your-secret-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
ENVIRONMENT=production
```

### Step 3: Deploy

1. Click **Deploy Now**
2. Railway auto-builds from Dockerfile
3. Click **View Logs** to watch deployment
4. Once complete, Railway provides a public URL

### Step 4: Configure Custom Domain (Optional)

1. Go to **Settings** → **Custom Domain**
2. Enter your domain (e.g., `sahil.com`)
3. Update DNS records (Railway provides instructions)

---

## Render.com

**Why Render?** Generous free tier, easy GitHub integration.

### Step 1: Connect Repository

1. Go to [Render.com](https://render.com)
2. Click **+ New** → **Web Service**
3. Select **Connect your repo**
4. Choose this repository

### Step 2: Configure Service

- **Name:** `sahil-portfolio`
- **Environment:** `Docker`
- **Region:** Choose closest to users
- **Plan:** Free (or upgrade as needed)

### Step 3: Add Environment Variables

1. Click **Environment**
2. Add all variables from `.env.example`

### Step 4: Deploy

1. Click **Create Web Service**
2. Render deploys automatically
3. View logs in dashboard

---

## Heroku (Legacy)

⚠️ **Note:** Heroku discontinued free tier. May require payment.

### Prerequisites

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login
```

### Deployment Steps

```bash
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="your-uri" --app your-app-name
heroku config:set MAIL_PASSWORD="your-password" --app your-app-name
heroku config:set SECRET_KEY="your-key" --app your-app-name
# ... add other variables

# Deploy
git push heroku main
```

### View Logs
```bash
heroku logs --tail --app your-app-name
```

---

## Azure App Service

### Prerequisites

```bash
# Install Azure CLI
# https://docs.microsoft.com/cli/azure/install-azure-cli

az login
```

### Step 1: Create Resource Group

```bash
az group create \
  --name sahil-portfolio \
  --location eastus
```

### Step 2: Create App Service Plan

```bash
az appservice plan create \
  --name sahil-plan \
  --resource-group sahil-portfolio \
  --sku B1 \
  --is-linux
```

### Step 3: Create Web App

```bash
az webapp create \
  --resource-group sahil-portfolio \
  --plan sahil-plan \
  --name your-app-name \
  --runtime "PYTHON|3.10"
```

### Step 4: Configure Deployment

```bash
# Connect to your GitHub repo
az webapp deployment source config-zip \
  --resource-group sahil-portfolio \
  --name your-app-name \
  --src <zip-file>
```

### Step 5: Set Environment Variables

```bash
az webapp config appsettings set \
  --resource-group sahil-portfolio \
  --name your-app-name \
  --settings MONGODB_URI="your-uri" \
              MAIL_PASSWORD="your-password" \
              SECRET_KEY="your-key"
```

---

## Docker Deployment

### Build Image

```bash
docker build -t sahil-portfolio:latest .
```

### Run Locally

```bash
docker run -p 8000:8000 \
  -e MONGODB_URI="your-uri" \
  -e MAIL_PASSWORD="your-password" \
  sahil-portfolio:latest
```

### Using Docker Compose

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Push to Registry

```bash
# Docker Hub
docker login
docker tag sahil-portfolio:latest username/sahil-portfolio:latest
docker push username/sahil-portfolio:latest

# GitHub Container Registry
docker tag sahil-portfolio:latest ghcr.io/username/sahil-portfolio:latest
docker push ghcr.io/username/sahil-portfolio:latest
```

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `MONGODB_URI` | Yes | `mongodb+srv://...` | MongoDB Atlas connection string |
| `DB_NAME` | Yes | `sahil_portfolio` | Database name |
| `SECRET_KEY` | Yes | 32+ char string | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `MAIL_USERNAME` | Yes | `your-email@gmail.com` | Gmail address |
| `MAIL_PASSWORD` | Yes | 16-char string | Gmail App Password (not regular password) |
| `MAIL_FROM` | Yes | `your-email@gmail.com` | Sender email |
| `MAIL_SERVER` | Yes | `smtp.gmail.com` | SMTP server |
| `MAIL_PORT` | Yes | `587` | SMTP port |
| `ENVIRONMENT` | No | `production` | Set to `production` for production deployment |

---

## Post-Deployment Checklist

After deploying, verify:

- [ ] Health check passes (app responds to requests)
- [ ] Contact form sends emails successfully
- [ ] Static files (CSS, JS, images) load correctly
- [ ] Videos display properly
- [ ] No errors in logs
- [ ] Page loads within acceptable time (< 2s)
- [ ] HTTPS certificate is valid
- [ ] Custom domain is configured (if applicable)

### Test Contact Form

```bash
curl -X POST http://your-deployed-url/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "Test message"
  }'
```

---

## Troubleshooting

### App crashes on startup

Check logs:
```bash
# Railway
Check dashboard logs

# Render
Click "Logs" in dashboard

# Heroku
heroku logs --tail

# Docker
docker logs <container-id>
```

### Contact form not sending

1. Verify `MAIL_PASSWORD` is Gmail App Password, not regular password
2. Check email address in MAIL_USERNAME
3. Verify 2-Step Verification is enabled on Gmail
4. Check logs for SMTP errors

### MongoDB connection errors

1. Verify `MONGODB_URI` format
2. Check IP is whitelisted in MongoDB Atlas
3. Verify database user exists
4. Test connection locally first

### Static files not loading

1. Ensure `static/` directory is included in deployment
2. Check Docker volume mounts in compose file
3. Verify file paths are correct

---

## Monitoring & Logs

### Railway
- Dashboard → Deployments → click deployment → View Logs

### Render
- Click service name → Logs

### Heroku
```bash
heroku logs --tail --app your-app-name
```

### Azure
```bash
az webapp log tail --name your-app-name --resource-group sahil-portfolio
```

---

## Performance Optimization

- Enable gzip compression
- Optimize video sizes (see README.md)
- Use CDN for static assets (optional)
- Enable caching headers
- Monitor database query performance

---

## Security Reminders

1. ✅ Never commit `.env` file (it's in `.gitignore`)
2. ✅ Rotate credentials periodically
3. ✅ Use HTTPS only (all platforms provide free SSL)
4. ✅ Keep dependencies updated: `pip audit`
5. ✅ Monitor access logs for suspicious activity
6. ✅ Restrict MongoDB IP access in production

---

## Need Help?

- Check hosting platform documentation
- Review error logs
- Verify all environment variables are set
- Ensure `.env` credentials are correct
- Test locally before deploying

Good luck! 🚀
