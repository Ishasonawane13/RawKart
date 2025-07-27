# 🚀 RawKart Netlify Deployment Guide

## Quick Netlify Deployment (5-10 minutes)

### Step 1: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click "New site from Git"
4. Choose GitHub and select `Ishasonawane13/RawKart`
5. Select the `Isha` branch

### Step 2: Configure Build Settings
**Build command:** `cd frontend && npm install && npm run build`
**Publish directory:** `frontend/build`
**Node version:** `18`

### Step 3: Environment Variables
In Netlify dashboard, go to: **Site settings > Environment variables**

Add these variables:
```
REACT_APP_API_URL = https://your-backend-url.com
REACT_APP_SOCKET_URL = https://your-backend-url.com
```

### Step 4: Deploy Backend (Choose One)

#### Option A: Railway (Recommended - Free)
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy backend folder
4. Add environment variables from `.env`

#### Option B: Render (Free)
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && npm start`

#### Option C: Heroku (Paid)
1. Install Heroku CLI
2. `heroku create your-app-name`
3. Configure environment variables
4. Deploy backend

### Step 5: Update Frontend URLs
Once backend is deployed, update the environment variables in Netlify with your actual backend URL.

## What Gets Deployed

### Frontend (Netlify):
✅ React app with all components
✅ Authentication system
✅ Real-time chat interface
✅ AI ingredient generation
✅ Order management

### Backend (Separate Service):
✅ Node.js API server
✅ Socket.io for real-time chat
✅ MongoDB database connection
✅ Authentication middleware
✅ AI integration

## Expected Deployment Time:
- **Frontend on Netlify:** 3-5 minutes
- **Backend setup:** 5-10 minutes
- **Total:** 8-15 minutes

## Live URLs After Deployment:
- **Frontend:** `https://your-app-name.netlify.app`
- **Backend:** `https://your-backend-url.com`

---
**Note:** For demo purposes, you can start with just frontend deployment and use a public backend API later.
