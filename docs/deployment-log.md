# Deployment Log

## 2026-02-17 — Firebase Hosting Migration

**Project:** text-the-check
**Firebase Project ID:** text-the-check
**Live URL:** https://textthecheck.app
**Previous hosting:** viaje-grupo Firebase project

### What was done

- Migrated hosting from the `viaje-grupo` Firebase project to a dedicated `text-the-check` project
- Connected custom domain `textthecheck.app` to Firebase Hosting
- Static site generated with Nuxt (`npm run generate`) and deployed via `firebase deploy --only hosting`
- DNS configured with A records pointing to Firebase Hosting IPs

### Backup

- Previous deployment was under the `viaje-grupo` Firebase project (still accessible if needed)
