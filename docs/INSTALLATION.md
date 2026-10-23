# 📘 Smart Employee Tracker — Complete Installation & Server Setup Guide

> **Enterprise Employee Productivity, Activity Telemetry & Proof-of-Work Platform**  
> **Author:** [Rsm Monaem](https://www.linkedin.com/in/rsm-monaem/)  
> **Software Version:** v1.1.0  
> **Platform Support:** Web Portal (Next.js 14) + Desktop Agent (Windows .exe & macOS .dmg) + Mobile App (Android)

---

## ⚡ 1-Click Fast Installation (Web Wizard)

Smart Employee Tracker includes an interactive, browser-based web installer at **`/install`**!

1. Clone or extract the source code on your server.
2. Run `npm install` and start the server:
   ```bash
   npm run build:web
   node apps/web/server.js
   ```
3. Open your browser and navigate to:
   ```text
   http://your-server-ip:3000/install  (or https://yourdomain.com/install)
   ```
4. Follow the 3-step visual wizard:
   - **Step 1:** System health & Node.js verification
   - **Step 2:** Paste your Database connection string (Postgres / Supabase) and click **"Test Connection"**
   - **Step 3:** Enter your SuperAdmin email & password and click **"Install Database & Launch Platform"**
5. The installer automatically migrates all tables, sets up RLS policies, creates the `screenshots` storage bucket, provisions your SuperAdmin account, and locks the installer!

---

## 📋 Table of Contents
1. [System Requirements & Prerequisites](#1-system-requirements--prerequisites)
2. [Database Setup (Supabase / PostgreSQL)](#2-database-setup-supabase--postgresql)
3. [Environment Configuration (.env)](#3-environment-configuration-env)
4. [Installing Dependencies & Building Web Portal](#4-installing-dependencies--building-web-portal)
5. [Process Management with PM2](#5-process-management-with-pm2)
6. [Web Server & Reverse Proxy Configuration](#6-web-server--reverse-proxy-configuration)
   - [Option A: Nginx (Ubuntu / Debian / CentOS)](#option-a-nginx-recommended)
   - [Option B: CyberPanel / OpenLiteSpeed](#option-b-cyberpanel--openlitespeed)
   - [Option C: Apache / cPanel](#option-c-apache--cpanel)
7. [SuperAdmin Account Initialization & Roles](#7-superadmin-account-initialization--roles)
8. [Desktop Tracking Agent Setup (Windows & Mac)](#8-desktop-tracking-agent-setup-windows--mac)
9. [Screenshot Storage Optimization & Migration](#9-screenshot-storage-optimization--migration)
10. [Troubleshooting & Common Questions](#10-troubleshooting--common-questions)

---

## 1. System Requirements & Prerequisites

### 🖥️ Recommended Server Specifications
| Component | Minimum Requirements | Recommended (Production) |
|---|---|---|
| **Operating System** | Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11/12 | Ubuntu 22.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU or higher |
| **RAM (Memory)** | 2 GB RAM | 4 GB RAM |
| **Disk Storage** | 20 GB SSD | 50+ GB NVMe SSD |
| **Node.js** | Node.js v18.x or v20.x LTS | Node.js v20.x LTS |
| **Package Manager**| npm v9+ or yarn v1.22+ | npm v10+ |
| **Database** | PostgreSQL 15+ / Supabase Cloud or Self-Hosted | Supabase Cloud (Free / Pro) |

### 🛠️ Quick System Tool Installation (Ubuntu/Debian)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should output v20.x.x
npm -v    # Should output v10.x.x

# Install PM2 globally for background process supervision
sudo npm install -g pm2
```

---

## 2. Database Setup (Supabase / PostgreSQL)

Smart Employee Tracker uses **Supabase** (PostgreSQL 15 with Row-Level Security and Storage Buckets).

### Step 2.1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create an account or sign in.
2. Click **"New Project"**, select your preferred region, and set a strong database password.

### Step 2.2: Execute Database Migrations
1. In your Supabase Dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Open the file `supabase/complete_schema.sql` located inside the project source code.
3. Copy all contents and paste them into the Supabase SQL Editor.
4. Click **Run** (green button).  
   *This single SQL script automatically creates all required tables (`users`, `tenants`, `screenshots`, `time_entries`, `activity_events`, `subscriptions`, `teams`, `leave_requests`), enables Row Level Security (RLS), and sets up productivity rules.*

### Step 2.3: Verify Storage Buckets
1. In your Supabase Dashboard, click **Storage**.
2. Ensure the bucket **`screenshots`** is created and set to **Public**.
   - If not created yet, click **New bucket** ➔ Name: `screenshots` ➔ Toggle **Public bucket** to `ON` ➔ Save.
3. (Optional) Create bucket **`avatars`** (Public).

---

## 3. Environment Configuration (.env)

Navigate to the project root directory and configure environment variables.

```bash
cd /path/to/smart-employee-tracker
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env` and `apps/web/.env.local` using `nano`:
```bash
nano apps/web/.env.local
```

### 🔑 Environment Variable Reference Guide

| Variable Name | Description | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project API URL | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client anon key | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin secret service role key (kept secure on server) | `eyJhbGciOiJIUzI1...` |
| `NEXT_PUBLIC_APP_URL` | Public web address of your application | `https://app.yourdomain.com` |
| `PORT` | Local web port for Next.js HTTP server | `3000` |
| `SMTP_HOST` | Outgoing SMTP mail server | `mail.yourdomain.com` |
| `SMTP_PORT` | SMTP Port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | SMTP Username/Email | `noreply@yourdomain.com` |
| `SMTP_PASSWORD` | SMTP Password | `YourSecureEmailPassword` |
| `STRIPE_SECRET_KEY` | (Optional) Stripe Secret Key for payments | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | (Optional) Stripe Webhook Secret | `whsec_...` |
| `BKASH_APP_KEY` | (Optional) bKash Payment Gateway Key | `your_bkash_key` |

---

## 4. Installing Dependencies & Building Web Portal

Run the following commands from the project root directory:

```bash
# 1. Install root workspace dependencies
npm install

# 2. Build the Next.js 14 Web Portal
npm run build:web
```

When completed, Next.js will display:
```text
✓ Compiled successfully
✓ Generating static pages (40/40)
✓ Finalizing page optimization
```

---

## 5. Process Management with PM2

PM2 ensures the server stays running 24/7 and restarts automatically if the server reboots.

### Step 5.1: Start the Application with PM2
```bash
# Start using the included production ecosystem config
pm2 start ecosystem.config.js

# Or start directly with:
# pm2 start apps/web/server.js --name "tracmatrix-app"
```

### Step 5.2: Configure Auto-Start on System Boot
```bash
pm2 save
pm2 startup
# (Run the command displayed by pm2 startup to finalize systemd integration)
```

### Handy PM2 Commands:
- `pm2 status` — Check service health
- `pm2 logs tracmatrix-app` — View live real-time server logs
- `pm2 restart tracmatrix-app` — Restart the application

---

## 6. Web Server & Reverse Proxy Configuration

Your web application runs locally on `http://127.0.0.1:3000`. Use a reverse proxy to route public domain traffic with SSL.

### Option A: Nginx (Recommended)

1. Create a new Nginx virtual host configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/tracmatrix.conf
   ```

2. Paste the following configuration (replace `app.yourdomain.com` with your real domain):
   ```nginx
   server {
       listen 80;
       server_name app.yourdomain.com;

       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tracmatrix.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Install Free SSL with Let's Encrypt Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d app.yourdomain.com
   ```

---

### Option B: CyberPanel / OpenLiteSpeed

1. In CyberPanel, go to **Websites** ➔ **Create Website** (e.g. `app.yourdomain.com`).
2. Go to **Websites** ➔ **List Websites** ➔ Click **Manage** next to your domain ➔ **vHost Conf**.
3. Add the OpenLiteSpeed reverse proxy context:
   ```apache
   context / {
     type                    proxy
     handler                 tracmatrix-proxy
     addDefaultCharset       off
   }
   ```
4. Define the external application in OpenLiteSpeed WebAdmin:
   - Type: `Web Server`
   - Name: `tracmatrix-proxy`
   - Address: `http://127.0.0.1:3000`
5. Restart OpenLiteSpeed.

---

### Option C: cPanel Hosting (Step-by-Step with "Setup Node.js App")

Over 60% of buyers deploy on cPanel (Namecheap, Hostinger, Bluehost, GoDaddy, or any CloudLinux cPanel). Follow these simple steps:

#### Step 1: Upload & Extract via File Manager
1. Log in to your **cPanel Dashboard**.
2. Open **File Manager** and navigate to your home directory or domain root (e.g., `/home/username/smart-employee-tracker`).
3. Upload the project zip and click **Extract**.

#### Step 2: Create Node.js Application in cPanel
1. In cPanel, search for and open **"Setup Node.js App"** (under the Software section).
2. Click the **"Create Application"** button:
   - **Node.js version:** Select **`20.x`** (or `18.x LTS`).
   - **Application mode:** Select **`Production`**.
   - **Application root:** Enter `smart-employee-tracker` (the folder where files were extracted).
   - **Application URL:** Select your domain or subdomain (e.g., `app.yourdomain.com`).
   - **Application startup file:** Enter `apps/web/server.js` (or `server.js`).
3. Click **Create** (top right).

#### Step 3: Install NPM Packages
1. Once created, in the application details page, click **"Run NPM Install"** (or open cPanel **Terminal** and run `npm install`).
2. Click **"Restart"** application.

#### Step 4: Run the 1-Click Automated Web Installer
1. Open your browser and visit:
   ```text
   https://app.yourdomain.com/install
   ```
2. The visual wizard will test your database, automatically create all tables and storage buckets, provision your SuperAdmin, and launch the platform!

#### Step 5: Enable Free SSL in cPanel
1. In cPanel, search for **"SSL/TLS Status"**.
2. Select your domain and click **"Run AutoSSL"**. In 1–2 minutes, your domain gets a free, auto-renewing SSL certificate.

---

## 7. SuperAdmin Account Initialization & Roles

### Step 7.1: Create Your First Account
1. Open your browser and navigate to `https://app.yourdomain.com/register`.
2. Register your admin account with your preferred email and password.

### Step 7.2: Grant SuperAdmin Privileges
To elevate your account to `SUPER_ADMIN`:
1. In Supabase Dashboard, open **SQL Editor**.
2. Run this quick query replacing your registered email:
   ```sql
   UPDATE users 
   SET role = 'SUPER_ADMIN' 
   WHERE email = 'your-email@example.com';
   ```
3. Refresh your browser. You can now access the full SuperAdmin Command Center at:
   - `https://app.yourdomain.com/superadmin`

---

## 8. Desktop Tracking Agent Setup (Windows & Mac)

The Desktop Tracking Agent records visual proof of work (screenshots), keyboard/mouse activity metrics, and active window titles.

### 📦 Pre-Built Downloads
Pre-compiled production binaries are bundled inside `apps/web/public/downloads/`:
- **Windows:** `Smart-Employee-Tracker.exe`
- **macOS (Apple Silicon & Intel):** `Smart-Employee-Tracker-macOS.dmg`

Employees can download the installer directly from their user dashboard!

### 🔄 In-App One-Click Auto-Updater (v1.1.0)
The desktop client features an integrated auto-updater:
- When a new version is released on your server, agents immediately see:
  `🎉 Update v1.1.0 is available!`
- Users simply click **Update Now** to update without reinstalling.

### 🛠️ Building Custom Branded Desktop Client (Optional)
If you wish to rebrand or compile from source:
1. Trigger the automated GitHub Action:
   - Go to your GitHub repository ➔ **Actions** ➔ **Build Desktop Agent** ➔ Click **Run workflow**.
   - GitHub builds both Windows `.exe` and macOS `.dmg` automatically!
2. Or compile locally via Tauri CLI:
   ```bash
   cd apps/desktop-agent
   npm install
   npm run tauri build
   ```

---

## 9. Screenshot Storage Optimization

Smart Employee Tracker **v1.1.0** features an integrated Ultra-Compressed WebP Screenshot Engine.

### 💡 Benefits:
- Automatically reduces screenshot storage size by **75% to 85%** (from ~450 KB down to ~55 KB).
- On-Demand Decompression Proxy (`/api/admin/screenshots/view`) serves images instantaneously with immutable browser caching.
- Retina and 4K displays (>1920px) are automatically optimized to prevent oversized images from filling server disks.

---

## 10. Troubleshooting & Common Questions

#### Q1: "Database error: relation 'users' does not exist"
- **Solution:** You haven't imported the database schema yet. Follow [Step 2.2](#step-22-execute-database-migrations) and run `supabase/complete_schema.sql` in your Supabase SQL Editor.

#### Q2: "Screenshots fail to upload or show broken image"
- **Solution:** Verify that the bucket `screenshots` is created in Supabase Storage and set to **Public**. Follow [Step 2.3](#step-23-verify-storage-buckets).

#### Q3: "Next.js memory usage is high during build"
- **Solution:** Building Next.js requires temporary RAM. If on a 1 GB or 2 GB VPS, create a swapfile:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  ```

#### Q4: "Where are default credentials?"
- **Solution:** To prevent security vulnerabilities, no hardcoded passwords exist. Follow [Step 7](#7-superadmin-account-initialization--roles) to register and assign your account as `SUPER_ADMIN`.

---

## 📞 Support & Direct Inquiries
Need installation assistance, custom server deployment help, or encounter any issues? Contact the lead developer directly:
- **WhatsApp:** **[@rsmmonaemwp](https://wa.me/message/rsmmonaemwp)** (`@rsmmonaemwp`)
- **LinkedIn Profile:** [https://www.linkedin.com/in/rsm-monaem/](https://www.linkedin.com/in/rsm-monaem/)
- **Repository Support:** Submit an Issue or Pull Request on GitHub.
