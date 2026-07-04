# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes     |

## Security Architecture

SecuroSpace is built on a **zero-knowledge, client-side-only** security model:

- **No server, no backend** — all data stays on your device
- **PBKDF2** key derivation with SHA-256, 100,000 iterations, 16-byte random salt
- **AES-GCM 256-bit** authenticated encryption for all persistent data
- **Web Crypto API** — native browser/OS cryptographic primitives only
- All keys are ephemeral — cleared from memory on lock or app close
- No analytics, no telemetry, no network requests of any kind

## Reporting a Vulnerability

If you discover a security vulnerability in SecuroSpace, **please do NOT open a public issue.**

Instead, report it responsibly:

1. **Email**: Create a GitHub private security advisory at  
   `Security` → `Report a vulnerability` tab on this repository.

2. **Include**:
   - A clear description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Optional: suggested fix or mitigation

3. **Response time**: We aim to acknowledge reports within **48 hours** and provide a fix within **14 days** for critical issues.

4. **Credit**: Responsible disclosers will be credited in release notes (if desired).

## Out of Scope

- Vulnerabilities that require physical access to an already-unlocked device
- Social engineering attacks
- Attacks requiring the master password to already be known
- Issues in dependencies that have already been patched upstream

Thank you for helping keep SecuroSpace secure.
