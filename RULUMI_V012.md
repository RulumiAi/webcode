# Rulumi v0.12

The main Rulumi Web/H5 app; separate from the Limiro landing page.

Implemented:
- Single age and gender onboarding card, adult resort pool illustration, no automatic login.
- Compact grouped wrapping tags, per-category tags retained, expanded inline groups.
- Notification drawer with system/interaction tabs, reward filters, mark all read and keyboard support.
- Shared top coin, membership and creator earnings entries; money entries removed from sidebar.
- Four subscription comparison cards in design mode (free + three existing sample tiers), purchase packs alongside reward actions.
- Character/creator leaderboard with weekly/monthly/rising controls, 2/1/3 podium and compact list.
- Daily check-in auto-dialog, per-day claim protection and no automatic reopening after dismissal within the mounted session.
- Chat recommendation rail, stable multiple recent chats, collapse/reopen control; removed a legacy rule that hid the first chat child.
- Consolidated social menu; avatar account dropdown; language icon on home only.
- Twelve interface language options; original six language catalog preserved, six added languages translate shared controls with English fallback for untranslated content.
- Simplified profile, community sections inspired by Ourdream (characters, creators, collections, comics).
- Four horizontal activity banners with swipe/scroll, dots, arrows, pause and reduced-motion support.

Integration boundaries:
- Current preview uses local sample content and simulated payments; it is not a production financial ledger.
- Creator earnings, exchange and payout are presentation-only with zero balance and disabled settlement. No competitor revenue share or exchange rate was adopted.
- Actual payout service, business rules, production payment catalog and image/video model adapters must be provided by the product team.
- Social URLs remain unconfigured until official account links are provided.
- Extra-language long-form content falls back to English.

Validation: TypeScript noEmit, Vite design build, 14 targeted tests for catalog/taxonomy/mature samples/wallet once-per-day and unlock rules; browser review on desktop and 320/390/768px, notifications, avatar menu, onboarding, multiple chat threads and chat collapse/reopen.

Asset delivery: compressed 110 short creation preview videos to 320px/12fps and eight embedded cover rasters to WebP while preserving URLs and SVG view boxes, reducing the old media payload.
