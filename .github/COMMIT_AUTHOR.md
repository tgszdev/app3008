# Git Commit Author Configuration

## Correct Configuration
- **Name**: tgszdev
- **Email**: tgszdev@gmail.com

## Why This Matters
Vercel requires that the commit author email matches a GitHub account email for proper deployment attribution and integration.

## How to Fix
```bash
git config user.name "tgszdev"
git config user.email "tgszdev@gmail.com"
```

## Verification
```bash
git config user.name
git config user.email
```

The email should match the primary or verified email address associated with your GitHub account.