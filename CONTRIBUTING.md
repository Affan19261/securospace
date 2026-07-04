# Contributing to SecuroSpace

Thank you for your interest in contributing! SecuroSpace is a security-focused project, so contributions are especially valued and carefully reviewed.

## Getting Started

1. **Fork** this repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/securospace.git`
3. Create a feature branch: `git checkout -b feat/your-feature-name`

## Development Setup

### Web App
No build step needed — it's pure HTML/CSS/JS.
```bash
cd securospace
python -m http.server 8000
# Open http://localhost:8000
```

### Android App
1. Install **Android Studio Hedgehog** or newer
2. Open `android/` as a project
3. Sync Gradle and run on device or emulator (API 26+)
4. Before building, run `android/sync-assets.bat` to copy web files

## Commit Convention

We use **Conventional Commits**:

```
feat: add biometric unlock support
fix: resolve WebView memory leak on rotation
docs: update security architecture diagram
chore: bump AGP to 8.2.2
security: patch XSS vector in vault render
```

| Prefix     | Use for                                   |
|------------|-------------------------------------------|
| `feat`     | New features                              |
| `fix`      | Bug fixes                                 |
| `docs`     | Documentation only                        |
| `style`    | CSS/formatting, no logic change           |
| `refactor` | Code restructure without behavior change  |
| `security` | Security patches or hardening             |
| `chore`    | Build config, dependencies, etc.          |

## Pull Request Checklist

- [ ] Feature branch named `feat/`, `fix/`, or `security/`
- [ ] Commits follow convention
- [ ] No new external dependencies without justification
- [ ] Security-sensitive changes include explanation of threat model
- [ ] README updated if user-facing behavior changes

## Code Style

### JavaScript / Web
- ES2020+ features (supported by all modern browsers and WebView API 26+)
- No external libraries — keep it dependency-free
- Prefer `async/await` over `.then()` chains
- Use `window.crypto.subtle` for all cryptographic operations

### Kotlin / Android
- Follow [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use ViewBinding over `findViewById`
- Document all `@JavascriptInterface` methods

## Security Contributions

Security fixes get highest priority. When submitting a security patch:
1. Reference the private advisory or CVE in the PR
2. Include a description of the vulnerability class
3. Add regression notes explaining what was broken

## Questions?

Open a Discussion (not an Issue) for general questions about architecture or development.
