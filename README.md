# Smart Employee Tracker

> **Next-Generation Enterprise Employee Productivity, Activity Tracking & Proof of Work SaaS Platform**  
> **Author:** [Rsm Monaem](https://www.linkedin.com/in/rsm-monaem/)  
> **LinkedIn:** [https://www.linkedin.com/in/rsm-monaem/](https://www.linkedin.com/in/rsm-monaem/)  
> **Documentation:** [Complete Installation & Setup Guide (INSTALLATION.md)](file:///Users/rsmmonaem/Downloads/smart-employee-tracker/INSTALLATION.md)

---

## 🚀 Latest Release: v1.1.0 (Released: October 24, 2026)

We are thrilled to introduce **Smart Employee Tracker v1.1.0** with major architectural enhancements focused on extreme storage efficiency, on-demand visual extraction, and automated cross-platform updates.

### 🌟 What's New in v1.1.0:
- **🗜️ Ultra-Compressed WebP Screenshot Engine:**
  - Screen captures are now automatically converted to optimized WebP format before storage upload.
  - **75% to 85% storage & bandwidth reduction** (slashing typical screenshot sizes from ~450 KB down to ~55 KB) while preserving crystal-clear text and window clarity.
- **⚡ On-Demand Decompression & Streaming Proxy (`/api/admin/screenshots/view`):**
  - Instant on-the-fly image extraction and streaming with multi-tenant security verification and immutable browser caching (`Cache-Control: public, max-age=31536000`).
  - Seamless backward compatibility: legacy uncompressed `.jpg` and `.png` files remain 100% viewable without manual intervention.
- **🖥️ 4K / 5K / Retina Display Downscaling:**
  - High-resolution displays (>1920px) are automatically downscaled to crisp 1080p, preventing massive 10 MB raw bitmaps from filling server disks.
- **🔄 1-Click In-App Auto-Updater (Windows & macOS):**
  - Existing installed desktop clients automatically detect `v1.1.0` and can update with a single click inside the app—no manual reinstall required!
- **🤖 Automated GitHub Actions CI/CD Pipeline (`.github/workflows/build-desktop.yml`):**
  - Compile production Windows (`.exe` / `.msi`) and macOS (`.dmg`) desktop installers directly inside GitHub Actions.
- **🛠️ Storage Maintenance & Lifecycle Management:**
  - Automated retention cleanup policies to keep database and disk storage lean and efficient.
- **📘 Marketplace-Ready Installation Documentation (`INSTALLATION.md`):**
  - Complete, step-by-step installation guide for CodeCanyon, Codester, and private VPS deployments covering Node.js, Supabase, PM2, Nginx, CyberPanel, and SSL.

---

## Overview

**Smart Employee Tracker** is a complete multi-tenant SaaS ecosystem and desktop agent designed for organizations to monitor team productivity, capture verified visual proof of work, track active applications, and streamline billing and attendance.

Built with a high-performance Rust backend, a modern Next.js 14 cloud management portal, and a native Tauri 2 cross-platform desktop tracking agent.

---

## Key Features

- **Automated Screen Capture**: Configurable 1-minute and 10-minute HD screenshot intervals with privacy-compliant activity logging.
- **Input & Keyboard Tracking**: Telemetry measuring keystroke velocity (KPM), mouse click intensity, and active work ratios without storing sensitive keystroke characters.
- **My Team & Live Dashboard**: Color-coded member state telemetry (Working, In Break, Stopped Work, On Leave, App Not Installed, Yet To Start).
- **Pro Tier Feature Gating**: Multiple bulk screenshot deletion, 1-year data retention, and custom screenshot capture frequency gated to PRO accounts.
- **Multi-Currency Localized Billing**:
  - **bKash MFS Direct Checkout** (Bangladesh Mobile Financial Services)
  - **merchant.eps.com.bd** (Electronic Payment System — Visa/Mastercard/Amex/Internet Banking)
  - **Stripe Elements** (International credit/debit cards)
  - Dual Currency support: **BDT (৳)** and **USD ($)** with monthly & annual discount cycles.
- **Native Windows Executable (`.exe`)**: Production-ready, optimized desktop client agent compiled for Windows (`x86_64-pc-windows-gnu`).
- **SuperAdmin Command Center**: Tenant management, subscription quota enforcement, dynamic package pricing, revenue analytics, and platform controls.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Author** | **Rsm Monaem** ([LinkedIn](https://www.linkedin.com/in/rsm-monaem/)) |
| **Frontend Web** | Next.js 14 (App Router, React 18, TypeScript, Tailwind CSS) |
| **Desktop Client** | Tauri 2 + Rust + Vite + React (`Smart-Employee-Tracker.exe`) |
| **Backend REST API** | Rust (Axum 0.7 + Tokio + SQLx 0.7) |
| **Database & Auth** | Supabase (PostgreSQL 15 + RLS + JWT Auth) |
| **Payment Gateways** | bKash, EPS (merchant.eps.com.bd), Stripe |

---

## Desktop Agent Executable (`.exe`)

The Windows executable is pre-compiled and available in:
- **`dist-windows/Smart-Employee-Tracker.exe`** (31 MB optimized release binary)

To recompile the Windows executable on any system with the MinGW-w64 toolchain:
```bash
cargo build --release --target x86_64-pc-windows-gnu --manifest-path apps/desktop-agent/src-tauri/Cargo.toml
```

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Rust stable (1.78+)
- Supabase account or local CLI

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Run Web Application
```bash
cd apps/web
npm install
npm run dev
# Accessible at http://localhost:3000
```

### 4. Run Desktop Agent (Dev)
```bash
cd apps/desktop-agent
npm install
npm run tauri dev
```

---

## Access & Roles

- **Platform SuperAdmin**: `/superadmin` (Requires `SUPER_ADMIN` role)
- **Tenant Client Admin**: `/admin/dashboard` (Requires `TENANT_ADMIN` role)
- **Team Management**: `/my-teams` & `/admin/employees`
- **Activity & Input Reports**: `/reports` & `/admin/reports`
- **Screenshots Proof of Work**: `/admin/screenshots`

---

## Author & Credits

- **Creator & Lead Engineer**: **Rsm Monaem**
- **LinkedIn**: [https://www.linkedin.com/in/rsm-monaem/](https://www.linkedin.com/in/rsm-monaem/)
- **License**: MIT
