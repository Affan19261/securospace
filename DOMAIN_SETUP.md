# SecuroSpace Custom Domain & DNS Configuration Guide

This guide provides the complete DNS configuration, certificate provisioning, and domain verification steps for **`securospace.com`**.

---

## 1. Domain Architecture Overview

- **Root Domain (Apex):** `securospace.com` (served via GitHub Pages edge IP addresses)
- **Subdomain:** `www.securospace.com` (CNAME redirect to `securospace.com`)
- **Hosting Target:** GitHub Pages (`Affan19261/securospace`)
- **SSL/TLS:** Free automated Let's Encrypt certificates provisioned by GitHub Pages with HSTS enforcement

---

## 2. Required DNS Records (Domain Registrar / DNS Provider)

Log in to your DNS provider dashboard (e.g. Cloudflare, Namecheap, GoDaddy, Google Domains / Squarespace, Porkbun) and configure the following records for `securospace.com`:

### A. Apex Domain (Root: `@` or `securospace.com`)

Add the four official GitHub Pages Anycast IPv4 `A` records:

| Type | Host / Name | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` (or leave blank) | `185.199.108.153` | Automatic or 3600 (1 hr) |
| **A** | `@` (or leave blank) | `185.199.109.153` | Automatic or 3600 (1 hr) |
| **A** | `@` (or leave blank) | `185.199.110.153` | Automatic or 3600 (1 hr) |
| **A** | `@` (or leave blank) | `185.199.111.153` | Automatic or 3600 (1 hr) |

### B. IPv6 Support (Recommended)

Add the four GitHub Pages `AAAA` records:

| Type | Host / Name | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **AAAA** | `@` | `2606:50c0:8000::153` | Automatic or 3600 |
| **AAAA** | `@` | `2606:50c0:8001::153` | Automatic or 3600 |
| **AAAA** | `@` | `2606:50c0:8002::153` | Automatic or 3600 |
| **AAAA** | `@` | `2606:50c0:8003::153` | Automatic or 3600 |

### C. Subdomain (`www`)

Configure `www.securospace.com` to point to your GitHub Pages endpoint:

| Type | Host / Name | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `Affan19261.github.io` | Automatic or 3600 |

> [!NOTE]
> If you manage your DNS on **Cloudflare**, set the proxy status for the root `A` records and `CNAME` to **DNS Only (Grey Cloud)** during initial certificate verification so GitHub Pages can issue the Let's Encrypt certificate directly.

---

## 3. GitHub Pages Repository Settings

1. Open your repository on GitHub: [Affan19261/securospace](https://github.com/Affan19261/securospace).
2. Click **Settings** (top navigation tab).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Verify the following:
   - **Source:** *Deploy from a branch* or *GitHub Actions* (the included `.github/workflows/static.yml` handles automated deployments on push to `main`).
   - **Custom domain:** Ensure `securospace.com` is entered and saved (this matches the `CNAME` file in the repository root).
   - **DNS check:** GitHub will show a green checkmark saying *"DNS check successful"*.
   - **Enforce HTTPS:** Check the **Enforce HTTPS** box once the SSL certificate status turns green (this usually takes 5 to 30 minutes after DNS records propagate).

---

## 4. Email Setup for `hello@securospace.com` & `security@securospace.com`

The website includes contact links for:
- `hello@securospace.com`
- `security@securospace.com`
- `privacy@securospace.com`

To receive emails sent to these addresses:

### Option A: Free Cloudflare Email Routing
If you use Cloudflare DNS:
1. In Cloudflare, navigate to **Email Routing**.
2. Add custom addresses (`hello@securospace.com`, `security@securospace.com`, `privacy@securospace.com`).
3. Set their destination to your personal inbox (e.g., your Gmail or ProtonMail).
4. Cloudflare will automatically inject the required `MX` and `TXT` (SPF) records into your DNS.

### Option B: Google Workspace or ProtonMail
Add the respective `MX` and `TXT` (DKIM/DMARC) records supplied by your email provider.

---

## 5. DNS Verification Commands

You can verify whether your DNS records have propagated using PowerShell or terminal commands:

### In PowerShell (Windows):
```powershell
# Check A records
Resolve-DnsName -Name securospace.com -Type A

# Check CNAME record for www
Resolve-DnsName -Name www.securospace.com -Type CNAME
```

### In bash / macOS / Linux:
```bash
# Check A records
dig +noall +answer securospace.com A

# Check CNAME record
dig +noall +answer www.securospace.com CNAME
```

Expected result for `securospace.com`:
```text
securospace.com.    3600    IN    A    185.199.108.153
securospace.com.    3600    IN    A    185.199.109.153
securospace.com.    3600    IN    A    185.199.110.153
securospace.com.    3600    IN    A    185.199.111.153
```

---

## 6. Live Website Verification

Once DNS propagation completes:
- Visiting `http://securospace.com/` automatically redirects to `https://securospace.com/`.
- Visiting `https://www.securospace.com/` redirects to `https://securospace.com/`.
- The live Web App is accessible directly at `https://securospace.com/app.html`.
- Technical Security Whitepaper: `https://securospace.com/security.html`.
- Privacy Policy: `https://securospace.com/privacy.html`.
- Terms of Service: `https://securospace.com/terms.html`.
