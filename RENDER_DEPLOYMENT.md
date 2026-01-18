# Render Deployment Guide

This guide will help you deploy the Textile QC System to Render.

## Prerequisites

1. A GitHub account with your repository pushed
2. A Render account (sign up at https://render.com)

## Step-by-Step Deployment Instructions

### 1. Push Your Code to GitHub

All necessary files have been created and pushed to your repository:
- `render.yaml` - Render configuration file
- `Procfile` - Process file for Render
- `requirements.txt` - Updated with gunicorn
- `runtime.txt` - Python version specification
- `app.py` - Updated to use PORT environment variable

### 2. Create a Render Account

1. Go to https://render.com
2. Sign up for a free account (or log in if you already have one)
3. Connect your GitHub account when prompted

### 3. Create a New Web Service

1. **Click "New +"** button in the Render dashboard
2. **Select "Web Service"**
3. **Connect your GitHub repository:**
   - If not connected, click "Connect account" and authorize Render
   - Find and select your repository: `algamel98/SPECTRAMATCH`
   - Click "Connect"

### 4. Configure Your Service

Fill in the following settings:

- **Name:** `textile-qc-system` (or any name you prefer)
- **Region:** Choose the closest region to your users
- **Branch:** `main` (or `master` if that's your default branch)
- **Root Directory:** Leave empty (root of repository)
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`

### 5. Environment Variables (Optional)

You can add environment variables if needed:
- `FLASK_DEBUG`: Set to `False` for production (default)
- `PORT`: Automatically set by Render (don't override)

### 6. Deploy

1. **Click "Create Web Service"**
2. Render will start building your application
3. Wait for the build to complete (usually 5-10 minutes)
4. Once deployed, you'll get a URL like: `https://textile-qc-system.onrender.com`

### 7. Verify Deployment

1. Visit your Render URL
2. Test the application:
   - Upload images
   - Run analysis
   - Download reports

## Important Notes

### Free Tier Limitations

- **Spinning down:** Free tier services spin down after 15 minutes of inactivity
- **Cold starts:** First request after spin-down may take 30-60 seconds
- **Build time:** Free tier builds may take longer

### Upgrading (Optional)

If you need:
- No spin-downs
- Faster builds
- More resources
- Custom domains

Consider upgrading to a paid plan.

## Troubleshooting

### Build Fails

1. Check build logs in Render dashboard
2. Verify all dependencies in `requirements.txt`
3. Ensure Python version matches `runtime.txt`

### Application Crashes

1. Check runtime logs in Render dashboard
2. Verify `gunicorn` is installed (check `requirements.txt`)
3. Ensure `app.py` has the Flask app instance named `app`

### Static Files Not Loading

1. Verify static files are in the `static/` directory
2. Check Flask static folder configuration in `app.py`

## Updating Your Application

1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically detect changes and redeploy
4. Or manually trigger a deploy from Render dashboard

## Support

- Render Documentation: https://render.com/docs
- Render Support: https://render.com/docs/support

---

**Your application will be live at:** `https://your-service-name.onrender.com`
