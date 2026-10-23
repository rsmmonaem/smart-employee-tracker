# Smart Employee Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Latest Release](https://img.shields.io/badge/Release-v1.1.0-emerald.svg)](https://github.com/rsmmonaem/smart-employee-tracker/releases)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg?logo=next.js)](https://nextjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-orange.svg?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.78+-red.svg?logo=rust)](https://www.rust-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![WhatsApp Support](https://img.shields.io/badge/WhatsApp-Support-25D366.svg?logo=whatsapp)](https://wa.me/message/rsmmonaemwp)

**Smart Employee Tracker** is an enterprise-grade, self-hosted **Employee Tracker** and workforce productivity monitoring platform. It combines a multi-tenant cloud management portal with native cross-platform desktop tracking agents for **Windows** and **macOS**.

Whether you manage an in-office team, remote contractors, or hybrid staff, Smart Employee Tracker provides verifiable visual proof of work, automated time tracking, application telemetry, and payroll-ready timesheets without third-party vendor lock-in.

---

## ⚡ Key Highlights

- **Desktop Tracking Agent (macOS & Windows):** Native client built with Tauri 2 and Rust for lightweight memory footprint (<30 MB RAM) and background execution.
- **Ultra-Efficient Screen Capture:** Automatic WebP compression engine reducing screenshot storage by **up to 85%** (50–70 KB per capture) while maintaining crisp text clarity.
- **On-Demand Screenshot Streaming:** Secure proxied image streaming with tenant isolation and immutable browser caching.
- **Active Window & URL Telemetry:** Real-time logging of active applications and website domains without capturing sensitive keystroke contents.
- **Attendance & Timesheets:** Automatic shift tracking, breaks, clock-in/out, and exportable timesheets.
- **1-Click Web-Based Installer (`/install`):** Browser-based setup wizard that runs database migrations, creates storage buckets, and configures administrator accounts with zero manual SQL.
- **Built-in Auto Updater:** In-app updates for desktop clients on macOS and Windows with native process restart.
- **Multi-Tenant Architecture:** Multi-organization support with Row-Level Security (RLS) and SuperAdmin management portal.

---

## 🖥️ Desktop Agent Downloads

| Platform | Latest Release | Previous Release | Notes |
|---|---|---|---|
| **macOS (Apple Silicon M1–M4)** | [v1.1.0 Beta (.dmg)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-AppleSilicon.dmg) | [v1.0.0 Stable (.dmg)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-macOS-v1.0.0.dmg) | Native ARM64 build |
| **macOS (Intel / Universal)** | [v1.1.0 Beta (.dmg)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-macOS.dmg) | [v1.0.0 Stable (.dmg)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-macOS-v1.0.0.dmg) | x86_64 compatible |
| **Windows 10 / 11 (64-bit)** | [v1.1.0 Beta (.exe)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker.exe) | [v1.0.0 Stable (.exe)](https://app.tracmatrix.com/downloads/Smart-Employee-Tracker-v1.0.0.exe) | Portable & Installer |
| **Android (Mobile)** | *Coming Soon* | — | Mobile attendance tracking |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│             Web Dashboard & SuperAdmin                 │
│         Next.js 14 (App Router, Tailwind CSS)          │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│   PostgreSQL / Supabase   │ │ Native Desktop Agents    │
│  - RLS Tenant Isolation   │ │ - macOS (.dmg)           │
│  - Storage (Screenshots)  │ │ - Windows (.exe)         │
│  - Timesheet & Telemetry  │ │ - Rust + Tauri v2 Engine │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 🚀 Quick Setup & Installation

Smart Employee Tracker supports both automated 1-click web installation and standard manual deployments.

### Option 1: 1-Click Web Installer (Recommended)
1. Deploy the web application to your server (VPS, cPanel, or Docker).
2. Visit `https://your-domain.com/install` in your browser.
3. Follow the 3-step setup wizard:
   - System environment check
   - Automated database migration & Supabase bucket initialization
   - SuperAdmin profile provisioning
4. Your complete employee tracking system is live and secured!

### Option 2: Step-by-Step Manual Deployment
For complete deployment guides including **cPanel Setup**, **Ubuntu VPS Setup**, **PM2 Configuration**, and **Nginx Reverse Proxy**, see:  
👉 **[Read Full Installation Guide (INSTALLATION.md)](INSTALLATION.md)**

---

## 🛠️ Tech Stack

- **Web Application:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Desktop Client:** Tauri 2, Rust, Vite, React
- **Database & Storage:** PostgreSQL 15, Supabase Storage (WebP screenshots)
- **Image Processing:** Sharp (high-performance WebP encoder)
- **Deployment Targets:** Linux VPS (Ubuntu/Debian), cPanel with Node.js selector, CyberPanel, Docker

---

## 🔐 Security & Privacy

- **Row-Level Security (RLS):** Strict multi-tenant data separation enforced at the database level.
- **Privacy-Compliant Telemetry:** Tracks app titles and activity levels without recording private keystrokes or sensitive input.
- **Quarantine & Gatekeeper Support:** Self-contained bundles with clear permission guidelines for macOS Screen Recording and Accessibility.

---

## 👨‍💻 Author & Support

- **Author & Architect:** **Rsm Monaem** ([LinkedIn Profile](https://www.linkedin.com/in/rsm-monaem/))
- **Direct WhatsApp Support:** **[@rsmmonaemwp](https://wa.me/message/rsmmonaemwp)** (`@rsmmonaemwp`)
- **Issues & Contributions:** Open a ticket on GitHub or reach out via WhatsApp for onboarding and deployment support.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
