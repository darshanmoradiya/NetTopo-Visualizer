# Development Setup Guide

This guide helps you set up the NetTopo Visualizer for local development.

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy sample data for dev mode
cp sample_data.json public/data/raw_data_complete.json

# 3. Start dev server
npm run dev
```

Visit http://localhost:5173 - you should see the network topology visualization with sample data.

## ⚠️ Cross-Platform Development (Windows + Ubuntu VM)

**IMPORTANT:** VMware/VirtualBox shared folders (HGFS, vboxsf) do not support symlinks, which npm requires. You **cannot run `npm install` in a shared folder**.

**Solution: Work from Linux native filesystem**

```bash
# Copy project to Linux home directory
cp -r /mnt/hgfs/sharedfolder/shared\ net\ topo/NetTopo-Visualizer ~/NetTopo-Visualizer
cd ~/NetTopo-Visualizer

# Remove any existing node_modules (to avoid conflicts)
rm -rf node_modules package-lock.json

# Install dependencies (will use package.json versions)
npm install

# Copy sample data
cp sample_data.json public/data/raw_data_complete.json

# Run dev server
npm run dev
```

**Recommended Development Workflow:**

1. **Edit Code:** Windows (VS Code) → Shared folder
2. **Sync to Linux:** Use one of these methods:
   - **Git:** Commit from Windows, pull on Linux
   - **Rsync:** `rsync -av --exclude node_modules /mnt/hgfs/.../NetTopo-Visualizer/ ~/NetTopo-Visualizer/`
   - **Watch script:** Set up file watcher to auto-sync
3. **Run Dev Server:** Linux native filesystem (`~/NetTopo-Visualizer`)
4. **Access App:** Browser on Windows: `http://<ubuntu-ip>:5173`

**Alternative: Develop directly on Ubuntu**
```bash
# Clone to Linux
cd ~
git clone <your-repo-url>
cd NetTopo-Visualizer
npm install
cp sample_data.json public/data/raw_data_complete.json
npm run dev
```

Then use VS Code Remote-SSH extension to edit files directly on the Ubuntu VM.

## What Was Fixed

### Issue 1: JSON File Not Found in Dev Mode
**Problem:** Vite dev server was returning HTML instead of JSON for `/data/raw_data_complete.json`

**Solution:** Created `public/data/` folder and copied sample data there. Vite serves everything in `public/` at the root path.

### Issue 2: Tailwind CDN Warning
**Problem:** Using `<script src="https://cdn.tailwindcss.com"></script>` is not recommended for production

**Solution:** 
- Installed Tailwind CSS via npm as a PostCSS plugin
- Created `tailwind.config.js` and `postcss.config.js`
- Created `src/index.css` with Tailwind directives
- Imported CSS in `index.tsx`
- Removed CDN script from `index.html`

### Issue 3: CORS Errors from External URLs
**Problem:** Trying to fetch from `http://127.0.0.1/...` caused CORS errors

**Solution:** In dev mode, use local paths (`/data/...`) which are served by Vite without CORS issues. External URLs are only needed in production when Nginx serves the app.

## Dev vs Production Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| **Data Location** | `public/data/raw_data_complete.json` | `/var/www/reactapp/data/raw_data_complete.json` (Nginx) |
| **Server** | Vite dev server (port 5173) | Nginx (port 80/443) |
| **Tailwind** | PostCSS build step | PostCSS build step (same) |
| **URL Fallback** | First tries `/data/...`, then `/raw_data_complete.json` | Tries all URLs including external nginx endpoints |

## Updating Sample Data

To test with different network topologies:

```bash
# Edit sample_data.json with your test data
vim sample_data.json

# Copy to public folder
cp sample_data.json public/data/raw_data_complete.json

# Dev server will auto-reload
```

## Production Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full production setup with Nginx.

Quick deploy:
```bash
npm run build
./deploy.sh  # Copies dist/ to /var/www/reactapp
```
