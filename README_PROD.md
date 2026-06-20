# Sahil Ahamed — Premium Portfolio Website

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-13AA52?logo=mongodb)](https://www.mongodb.com/atlas)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A premium, ethereal portfolio website for **Sahil Ahamed** — Video Editor, Photographer, Videographer & AI Video Creator.

**Live Features:**
- ✨ Three.js particle animations with GSAP scroll transitions
- 📧 Contact form with Gmail SMTP integration
- 🎬 Dynamic portfolio with categorized video galleries
- 🗄️ MongoDB Atlas backend (works without DB too)
- 📱 Fully responsive design
- ⚡ Production-ready FastAPI backend

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Deployment Guides](#deployment-guides)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- MongoDB Atlas account (free tier available)
- Gmail account with App Password (for contact form)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/sahil-portfolio.git
cd sahil-portfolio
```

### 2. Create & Activate Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
# See Environment Setup section below
```

### 5. Run Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: **http://localhost:8000**

---

## 🔧 Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and fill in the following:

#### MongoDB Configuration
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sahil_portfolio?retryWrites=true&w=majority
DB_NAME=sahil_portfolio
```

**Get MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster (free tier available)
3. Create database user: Database Users → Add New Database User
4. Click Connect → Connect your application
5. Copy the connection string and replace credentials

#### Gmail SMTP Configuration
```env
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_FROM=your-gmail@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Generate Gmail App Password:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Go to: https://myaccount.google.com/apppasswords
3. Select Mail & Windows Computer (or your device)
4. Copy the 16-character password (remove spaces)
5. Paste into `.env` as `MAIL_PASSWORD`

#### Secret Key
```env
SECRET_KEY=your-secret-key-here
```

Generate a secure key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Free Cluster:**
   - Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create M0 cluster (free, shared)

2. **Create Database User:**
   - Security → Database Access
   - Add new database user
   - Choose "Password" and save credentials

3. **Set Network Access:**
   - Security → Network Access
   - Add IP Address
   - For production: Add specific IPs
   - For development: Use `0.0.0.0/0` (not recommended for production)

4. **Get Connection String:**
   - Click Connect → Connect your application
   - Copy MongoDB URI
   - Update `MONGODB_URI` in `.env`

### Without Database

The site functions fully without MongoDB — contact form submissions simply won't be persisted.

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t sahil-portfolio:latest .
```

### Run with Docker Compose

```bash
# Development
docker-compose -f docker-compose.yml up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Push to Docker Registry

```bash
docker tag sahil-portfolio:latest your-registry/sahil-portfolio:latest
docker push your-registry/sahil-portfolio:latest
```

---

## 🚀 Deployment Guides

### Railway.app (Recommended - Free to Start)

1. **Connect Repository:**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Authorize and select this repository

2. **Configure Environment:**
   - Project settings → Variables
   - Add all variables from `.env.example`:
     - `MONGODB_URI`
     - `MAIL_USERNAME`
     - `MAIL_PASSWORD`
     - `SECRET_KEY`

3. **Deploy:**
   - Railway auto-deploys on git push
   - View logs in dashboard

### Heroku (Legacy - May Require Payment)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="your-uri" --app your-app-name
heroku config:set MAIL_PASSWORD="your-password" --app your-app-name

# Deploy
git push heroku main
```

### Render.com

1. Go to [Render.com](https://render.com)
2. Connect GitHub account
3. Create New Web Service
4. Select repository
5. Set environment variables
6. Deploy

### Azure App Service

```bash
# Install Azure CLI
az login

# Create resource group
az group create --name portfolio --location eastus

# Create App Service plan
az appservice plan create --name portfolio-plan --resource-group portfolio --sku B1 --is-linux

# Deploy
az webapp create --resource-group portfolio --plan portfolio-plan --name your-app --runtime "PYTHON|3.10"
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guides.

---

## 🎬 Adding Videos to Portfolio

Drop video files into these directories:

```
static/videos/
├── doctors/            # Healthcare/medical reels
├── entrepreneurs/      # Business/startup reels
├── content_creators/   # Influencer/creator content
├── retail_shops/       # Retail/commerce reels
├── parlours/          # Beauty/salon reels
└── long_form/         # YouTube/long-form content
```

**Automatic Detection:** Simply drop files and refresh — no code changes needed.

### Video Guidelines

| Type | Resolution | Aspect Ratio | Max Size | Format |
|------|-----------|-------------|----------|--------|
| Reels/Shorts | 1080×1920 | 9:16 | 30 MB | .mp4 |
| Long Form | 1920×1080 | 16:9 | 100 MB | .mp4 |

**Compression (using HandBrake):**
```bash
# Recommended settings
Codec: H.264
Bitrate: 2-4 Mbps
Frame Rate: 24 or 30 fps
Quality: RF 18-22
```

---

## 📊 Project Structure

```
sahil-portfolio/
├── main.py                 # FastAPI entry point
├── database.py            # MongoDB connection
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
│
├── models/               # Pydantic data models
│   ├── contact.py        # Contact form schema
│   └── portfolio.py      # Portfolio schema
│
├── routes/               # API endpoints
│   ├── contact.py        # Contact form API
│   └── portfolio.py      # Portfolio API
│
├── templates/            # HTML templates
│   └── index.html        # Main page
│
├── static/               # Assets
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   ├── images/           # Photos/thumbnails
│   └── videos/           # Video galleries
│
└── docs/                 # Documentation
    └── DEPLOYMENT.md     # Deployment guides
```

---

## ✅ Production Checklist

- [ ] MongoDB Atlas cluster created and secured
- [ ] Gmail App Password generated and configured
- [ ] Secret key generated and set
- [ ] Environment variables configured on hosting platform
- [ ] `.env` file added to `.gitignore` (it is by default)
- [ ] CORS settings reviewed and restricted to your domain
- [ ] Email SMTP tested with test submission
- [ ] Videos optimized and compressed
- [ ] SSL/HTTPS enabled on hosting platform
- [ ] Domain configured and pointing to app
- [ ] Monitoring/logging set up
- [ ] Backup strategy configured (especially for MongoDB)
- [ ] Rate limiting configured for contact form
- [ ] Security headers added to responses

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** — it's in `.gitignore`
2. **Rotate credentials regularly** — especially Gmail App Password
3. **Use strong SECRET_KEY** — minimum 32 characters
4. **Restrict MongoDB IP access** — use specific IPs in production
5. **Enable HTTPS** — all hosting platforms provide free SSL
6. **Validate user input** — all inputs are validated via Pydantic
7. **Rate limit contact form** — prevents spam/abuse
8. **Monitor error logs** — track issues in production

---

## 🛠️ Development

### Run Tests (if added)
```bash
pytest
```

### Format Code
```bash
black .
flake8 .
```

### Check Dependencies
```bash
pip audit  # Check for security vulnerabilities
pip list
```

---

## 🐛 Troubleshooting

### Contact Form Not Sending
- Verify Gmail App Password (not regular password)
- Ensure 2-Step Verification is enabled
- Check `MAIL_USERNAME` and `MAIL_PASSWORD` in `.env`
- Test with `curl` command (see DEPLOYMENT.md)

### MongoDB Connection Failed
- Verify `MONGODB_URI` format is correct
- Check your IP is whitelisted in MongoDB Atlas
- Ensure database user exists and password is correct
- For development, use `0.0.0.0/0` in network access

### Videos Not Loading
- Check file format (MP4 recommended)
- Verify file is in correct `/static/videos/` subdirectory
- Check file permissions
- Refresh browser cache (Ctrl+Shift+Del)

### Port Already in Use
```bash
# Kill process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :8000
kill -9 <PID>
```

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Railway Deployment](https://docs.railway.app)
- [Render Deployment](https://render.com/docs)

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT.md](docs/DEPLOYMENT.md)
2. Review error logs
3. Check `.env` configuration
4. Verify all credentials are correct

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by Sahil Ahamed**

*Last updated: 2025-06-20*
