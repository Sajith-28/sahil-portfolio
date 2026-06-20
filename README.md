# Sahil Ahamed — Portfolio Website

A premium, ethereal portfolio website for **Sahil Ahamed** — Video Editor, Photographer, Videographer & AI Video Creator.

Built with FastAPI + MongoDB Atlas + Three.js + GSAP.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ installed
- MongoDB Atlas account (free tier works)
- Git (optional)

### 1. Clone / Download the Project
```bash
cd sahil-portfolio
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
# Copy the example .env file
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# Replace the placeholder values with your actual MongoDB URI
```

### 5. Run the Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: **http://localhost:8000**

---

## 🗄️ MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Click **Connect** → **Connect your application**
6. Copy the connection string
7. Paste it into your `.env` file as `MONGODB_URI`

Example:
```
MONGODB_URI=mongodb+srv://sahil:mypassword123@cluster0.abc123.mongodb.net/sahil_portfolio?retryWrites=true&w=majority
DB_NAME=sahil_portfolio
```

> **Note:** The website will fully function without MongoDB — you just won't be able to save contact form submissions.

---

## 🎬 Adding Videos (Portfolio)

Drop your video files (`.mp4`, `.mov`, `.webm`) into the appropriate category folders:

```
static/videos/
├── doctors/            ← Reels for doctor/healthcare clients
├── entrepreneurs/      ← Reels for entrepreneur clients  
├── content_creators/   ← Reels for content creators/influencers
├── retail_shops/       ← Reels for retail/shop clients
├── parlours/           ← Reels for parlour/beauty clients
└── long_form/          ← Long-form video samples (YouTube, brand films)
```

**The website automatically detects new files** — no code changes needed. Just drop files and refresh the page.

### Supported Video Formats
- `.mp4` (recommended for web)
- `.mov`
- `.webm`
- `.avi`

### Best Practices for Videos
- **Reels/Shorts**: 1080×1920 (9:16 aspect ratio), under 30MB each
- **Long Form**: 1920×1080 (16:9), under 100MB each
- Compress videos with HandBrake for faster loading
- Name files descriptively: `dr_skin_clinic_reel_01.mp4`

---

## 🖼️ Adding Images

### Thumbnails
Drop thumbnail designs into:
```
static/images/thumbnails/
```

### Photography Portfolio
Drop photography work into:
```
static/images/photography/
```

### Profile Photo
Replace the placeholder with your photo:
```
static/images/profile/sahil.jpg
```
Then update the `<img>` src in `templates/index.html` (search for "about__image").

### Supported Image Formats
- `.jpg` / `.jpeg`
- `.png`
- `.webp` (recommended for web)

---

## 📁 Project Structure

```
sahil-portfolio/
├── main.py                     # FastAPI app entry point
├── database.py                 # MongoDB Atlas connection (Motor)
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
├── README.md                   # This file
├── models/
│   ├── __init__.py
│   ├── contact.py              # Contact form Pydantic model
│   └── portfolio.py            # Portfolio item Pydantic model
├── routes/
│   ├── __init__.py
│   ├── contact.py              # POST /api/contact
│   └── portfolio.py            # GET /api/videos, /api/images
├── templates/
│   └── index.html              # Main HTML template (Jinja2)
└── static/
    ├── css/
    │   └── style.css           # Complete stylesheet
    ├── js/
    │   ├── main.js             # Three.js + GSAP animations
    │   └── portfolio.js        # Video gallery + filtering
    ├── videos/                 # Video files by category
    │   ├── doctors/
    │   ├── entrepreneurs/
    │   ├── content_creators/
    │   ├── retail_shops/
    │   ├── parlours/
    │   └── long_form/
    └── images/
        ├── thumbnails/         # Thumbnail designs
        ├── photography/        # Photography portfolio
        └── profile/            # Profile photo
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serves the main HTML page |
| GET | `/api/videos/{category}` | Returns video filenames for a category |
| GET | `/api/videos/all` | Returns all videos grouped by category |
| GET | `/api/images/thumbnails` | Returns thumbnail image filenames |
| GET | `/api/images/photography` | Returns photography image filenames |
| POST | `/api/contact` | Saves contact form submission to MongoDB |

### Example API Response
```json
// GET /api/videos/doctors
{
  "category": "doctors",
  "files": ["dr_skin_reel_01.mp4", "dr_dental_reel_02.mp4"]
}
```

---

## 🎨 Font Substitutions

The design uses these Google Font alternatives (original custom fonts noted):

| Original Font | Google Font Substitute | Usage |
|--------------|----------------------|-------|
| Bellisia | Playfair Display | Hero heading, display text |
| Havena | Cormorant Garamond | Elegant accents, taglines |
| Eugen | Italiana | Section headings |
| Bostime | DM Serif Display | Card titles, accent headings |

To use the original fonts: place `.woff2` files in `/static/fonts/` and update the `@font-face` declarations in `style.css`.

---

## 🚀 Hosting & Deployment

This project is configured as a production-grade containerized web app, ready to be deployed to any modern cloud hosting provider.

### Environment Variables
For security, credentials must not be stored in git. Configure the following environment variables in your hosting provider's dashboard or a local `.env` file:

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `MONGODB_URI` | MongoDB Atlas Connection string (Optional) | `mongodb+srv://...` |
| `MAIL_USERNAME` | SMTP/Gmail email address for contact submissions | `user@gmail.com` |
| `MAIL_PASSWORD` | SMTP password or Google App Password | `abcd efgh ijkl mnop` |
| `MAIL_FROM` | Email address shown in the "From" header | `user@gmail.com` |
| `MAIL_SERVER` | SMTP Mail Server Host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP Port | `587` |

---

### Method 1: Render Blueprint (Recommended)
This repo includes a `render.yaml` blueprint for one-click setup:
1. Push this repository to GitHub.
2. Go to **Render.com** and click **Blueprints**.
3. Connect your repository. Render will automatically detect the blueprint and provision the FastAPI web service with Python 3.11 and Gunicorn.

---

### Method 2: Docker Compose (Local & Production Hosting)
To run the full stack (FastAPI web server + local MongoDB instance) in containerized mode:
1. Ensure Docker and Docker Compose are installed.
2. Run:
   ```bash
   docker-compose up --build -d
   ```
3. Visit `http://localhost:8000`.

---

### Method 3: Standard Docker container
To build and run just the FastAPI app container:
```bash
# Build
docker build -t sahil-portfolio .

# Run
docker run -d -p 8000:8000 --env-file .env sahil-portfolio
```

---

### Method 4: Traditional Hosting (Heroku, Render, VPS)
To deploy manually on platforms that support Python buildpacks:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`


---

## 📝 Updating Content

### Text Content
Edit `templates/index.html` — all text content is in the HTML file, clearly commented by section.

### Colors & Theme
Edit CSS custom properties at the top of `static/css/style.css` in the `:root` block.

### Social Links
Search for `sahilkutty92@gmail.com`, `8122915414`, and the instagram link in `index.html` to update.

---

## 📄 License

© 2025 Sahil Ahamed — All Rights Reserved.

Built with ❤️ using FastAPI, Three.js, and GSAP.
