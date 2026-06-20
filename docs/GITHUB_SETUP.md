# GitHub Setup Instructions

## Step 1: Initialize Git Repository Locally

Run these commands in your project directory:

```bash
# Initialize git
git init

# Configure git (use your own details)
git config user.name "Your Name"
git config user.email "your-email@github.com"

# Add all files (excluding .env via .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Production-ready portfolio website with FastAPI backend"

# Check status
git status
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub Web Interface (Easiest)

1. Go to [GitHub.com](https://github.com)
2. Click **+ New Repository** (top right)
3. Configure:
   - **Repository name:** `sahil-portfolio`
   - **Description:** "Premium portfolio website for Sahil Ahamed - Video Editor, Photographer & AI Creator"
   - **Visibility:** Public
   - **DO NOT initialize** with README (we already have one)
   - Click **Create repository**

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com

# Login to GitHub
gh auth login

# Create repository
gh repo create sahil-portfolio --public --source=. --remote=origin
```

## Step 3: Connect Local Repository to GitHub

```bash
# Add remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/sahil-portfolio.git

# Verify remote
git remote -v
```

## Step 4: Push Code to GitHub

```bash
# Push all branches
git push -u origin main

# Or if your branch is called master:
git push -u origin master
```

## Step 5: Verify on GitHub

1. Go to your repository on GitHub
2. Verify files are there (except `.env` - it should NOT be visible)
3. Check that all documentation is visible:
   - README.md ✓
   - .env.example ✓
   - Dockerfile ✓
   - requirements.txt ✓
   - docs/DEPLOYMENT.md ✓

## Optional: Set Up GitHub Pages

If you want to host on GitHub Pages (for static content only):

1. Go to repository **Settings**
2. Scroll to **Pages**
3. Select **main** branch
4. Your site will be available at `https://YOUR-USERNAME.github.io/sahil-portfolio/`

**Note:** This won't work for our FastAPI backend. Use Railway/Render/Heroku for the backend instead.

## Verify .env File is NOT Pushed

```bash
# Check if .env is in git (it should NOT be)
git ls-files | grep .env

# Should show only:
# .env.example ✓
# NOT .env ✗

# Check what will be pushed
git status
```

## Next Steps

1. ✅ Git initialized and pushed
2. 🔄 Choose deployment platform from docs/DEPLOYMENT.md
3. 🚀 Deploy to Railway/Render/Heroku
4. ✨ Share your live portfolio!

## Useful Git Commands

```bash
# See commit history
git log

# See changes since last commit
git status

# Add new changes
git add .
git commit -m "Your message"
git push

# Update from remote
git pull

# Create new branch for features
git checkout -b feature/new-feature
```

---

**Your GitHub repository is now production-ready!** 🎉
