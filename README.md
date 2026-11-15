# SecuroSpace | Privacy-First Life OS & Personal Vault

[![Deploy static content to Pages](https://github.com/Affan19261/securospace/actions/workflows/static.yml/badge.svg)](https://github.com/Affan19261/securospace/actions/workflows/static.yml)
[![Live Domain](https://img.shields.io/badge/domain-securospace.com-6ad7d6)](https://securospace.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**SecuroSpace** (`securospace.com`) is a privacy-first personal productivity platform that combines a **daily task planner**, **habit tracker**, **finance ledger**, and **zero-knowledge encrypted password vault** in one calm, secure home.

---

## 🌟 Key Features

1. **Focus & Task Planner (`app.html`)**:
   - Integrated Pomodoro focus sprint timer (25-minute intervals).
   - Priority tagging (High, Medium, Low) and categorization (Focus, Security, DevOps, Personal).
   - Filter by status (All, Active, Completed).
2. **Habit Momentum**:
   - Visual 7-day consistency tracker (Mon–Sun).
   - Streak counters with flame indicators 🔥.
   - Zero-shame mechanics with local storage persistence.
3. **Private Financial Ledger**:
   - Cashflow logging without linking bank logins or sharing credentials.
   - Automatic calculations for Net Balance, Total Inflow, and Total Outflow.
   - Clean tabular overview and category budgeting.
4. **Zero-Knowledge Encrypted Vault**:
   - Authenticated AES-256-GCM symmetric encryption.
   - Master Key derivation via PBKDF2 with 600,000 SHA-256 iterations.
   - Cryptographic strong password generator with custom length, symbols, and entropy scoring.
   - Automatic secret masking after 15 seconds.
5. **Data Sovereignty & Portability**:
   - 100% local-first architecture (Web Cryptography API & `localStorage`).
   - Export full workspace as a standard JSON backup snapshot.
   - Restore or import backups anytime.
   - One-click local data wipe.

---

## 📁 Repository Structure

```text
securospace/
├── .github/
│   └── workflows/
│       └── static.yml         # GitHub Actions deployment to Pages
├── assets/
│   ├── favicon.svg            # Official brand vector icon
│   └── og-preview.svg         # High-resolution social graph banner (1200x630)
├── 404.html                   # Custom branded 404 error page
├── app.html                   # Interactive in-browser Life OS Web App
├── app.js                     # Core application logic, Pomodoro, and state engine
├── CNAME                      # Custom domain mapping: securospace.com
├── DOMAIN_SETUP.md            # Detailed DNS and registrar configuration guide
├── index.html                 # Flagship showcase website & interactive demo
├── manifest.json              # Progressive Web App (PWA) manifest
├── privacy.html               # Plain-English privacy policy
├── README.md                  # Project documentation
├── robots.txt                 # Search crawler rules & sitemap reference
├── script.js                  # Marketing page interactions (tabs, pricing, FAQ, modal)
├── security.html              # Technical cryptography whitepaper & live REPL
├── sitemap.xml                # SEO XML sitemap with all canonical URLs
├── styles.css                 # Unified design system & responsive styling
└── terms.html                 # Terms of service
```

---

## 🚀 Running Locally

Start a local HTTP server from the repository root:

### Python 3:
```bash
python -m http.server 3000
```

Then open your browser to:
```text
http://localhost:3000
```
- Marketing showcase: `http://localhost:3000/`
- Full Web App: `http://localhost:3000/app.html`
- Security Whitepaper: `http://localhost:3000/security.html`

---

## 🌐 Custom Domain Setup (`securospace.com`)

The custom domain is configured via the root `CNAME` file pointing to `securospace.com`.

### Quick DNS Records Summary:
- **`A` Records (Root `@`):**
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- **`CNAME` Record (`www`):**
  - Points to `Affan19261.github.io`

For step-by-step registrar instructions, email routing, and DNS verification commands, consult **[DOMAIN_SETUP.md](DOMAIN_SETUP.md)**.

---

## 📄 License & Privacy

Built for personal sovereignty. All data entered into SecuroSpace remains encrypted on your local machine.
