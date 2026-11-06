# Rulumi Web/H5 demo

Isolated design preview of the sanitized Rulumi v0.22 source. This repository is a runnable local demo, not the production site.

- Provenance of the unsanitized release tree: `f7ee03fbaa3a82242c1e35d87be66488e3d7c3c4` (not a git remote to fetch).
- Preview: `npm run dev:preview` or `npm run build:preview` (Vite mode `design`).
- Design mode uses local fixtures. Login, recharge, subscription, and generation stay on the device and do not call a live account, payment, or model API.
- Visible copy defaults to Japanese. Adult content stays off until the age demo and the `成人向けコンテンツ` switch are both on. That switch mixes ordinary and clearly adult, non-explicit samples. It is not age verification.
- Cover crops already in this tree are existing product assets and are labeled `既存素材（仮）`. They are not an approved four-character cover pack.

Do not deploy this branch to production, and do not point it at rulumi.ai.
