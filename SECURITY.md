# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in **Quant Market Sentiment Engine**, please report it responsibly:

1. **Do NOT file a public GitHub issue** for undisclosed vulnerabilities.
2. Submit a private report via GitHub Security Advisories (`Security -> Advisories -> Report a vulnerability`) including:
   - Affected endpoint, module, or container layer.
   - Steps to reproduce or minimal proof-of-concept.
   - Potential impact and suggested mitigation.
3. Initial acknowledgement will be provided within **48 hours**.

## Security Controls

- **API Key & Bearer Token Auth**: Optional `X-API-Key` / `Authorization: Bearer` enforcement on `/predict`.
- **Rate Limiting & Payload Bounds**: Input text bounded strictly to 1–2000 characters with per-minute rate throttling.
- **Zero Hardcoded Secrets**: `.env` files are excluded via `.gitignore`; all tests use non-secret placeholder fixtures.
- **Automated Scanning**: Dependabot weekly alerts, Semgrep SAST, and Trivy Docker image scanning run in GitHub Actions CI.
