# v0.8.0 — Coins, ranking, tasks and comic creation

The second supplied reference is the coin page; the first is a task-center page. Both were implemented in the existing violet workspace. A separate leaderboard has five content categories and weekly/monthly/all-time sample views, podium cards and content navigation.

Coins: available balance and cumulative earned/purchased amounts, first-purchase reward banner, six reference-priced sample packages, order review and explicitly labeled demo recharge. No real payment request is made. The 1500-coin first purchase adds 1500 bonus once. The banner disappears after redemption. Existing media entitlements preserve reward activity fields.

Tasks: seven-day check-in (50/60/80/50/50/50/100), duplicate-claim prevention, demo code DEMO50 redeemed once, daily conversation reward claimable only after sending a sample chat message, community placeholder and sample invitation code. No real Discord verification, referral attribution or external reward service is connected.

Comic studio: work title/description/language/cover and genre tags; cast selection and style metadata; grouped images (upload JPG/PNG/WebP, up to 8MB each, up to 12 images/group), image and group reordering/deletion, first group free, subsequent group price, review and preview publication. Drafts and uploaded image data are stored in IndexedDB in this browser. Published preview comics appear in the Comics catalogue and use the existing demo-coin ledger for subsequent-group access. This is a browser-local authoring workflow, not a connected AI image generator or online UGC/moderation backend.

Desktop sidebar and H5 navigation include Coins, Leaderboard, Task center and Create comic. Six-language interface labels are included. Real payments, account-synced storage, upload storage, moderation, server-authorized rewards and leaderboard aggregation still require backend integration. Example rankings and prices are design content, not live operational facts.

Validation: TypeScript and build; 28 distinct related tests, including media gating, activity preservation, once-per-day rewards, first-purchase bonus, comic validation/reordering and the previous translation-DOM crash regression. Browser checks used production build output: demo recharge, check-in, draft save/reopen, two groups, pricing, preview publish, catalogue appearance and paid-group unlock. H5 entry points and form widths verified, and an actual local image uploaded through the file chooser. Fixed missing crypto.randomUUID on non-secure QA origins with an ID fallback.

## v0.8.1 — entry and visual polish

- First visit opens a two-step age/gender panel in all six languages. Under-18 cannot continue; gender includes non-disclosure. Selection is saved in this browser and editable from Personal Center. This is a declaration UI, not verified age identity.
- Sign-in uses the same anime artwork and purple palette. The preview offers an explicitly labeled demo session, with no real password required. Google is visibly unconnected in this preview; existing production auth flows are retained.
- Ranking podium adds gold/silver/bronze laurels, rank labels, rotating rays, trophy float and staggered entrance on category/period changes.
- Personal Center adds an anime fallback avatar, constellation banner, activity-based milestones, preferences editing, login preview and published local comics under creations. Coin balance follows the shared wallet.
- Coins page adds floating ornaments, balance feedback, package ribbons and restrained shine. No real payments are processed.
- Motion is disabled when the browser prefers reduced motion. H5 uses compact single-column entry and profile layouts.
- Validation: TypeScript, entry preference tests, wallet/media/preview API tests and discovery translation regression. Browser QA covers age blocking, opt-out gender, demo entry, ranking, profile and mobile layout.
