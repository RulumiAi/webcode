# Rulumi v0.13

Changes requested in this iteration:
- Unified brand/header background and brand lettering; toned search and account controls into the same palette.
- Fixed the compact sidebar expand control, previously hidden by a legacy selector. Added an accessible button label.
- Removed the sidebar recent-chat dropdown. The Chat navigation now opens the existing chat workspace directly.
- Moved character, image, video and comic creation into a single + menu beside the home language icon. Removed duplicate sidebar/drawer creation navigation; H5 bottom tabs now Discover / Chat / Community.
- Added reusable dimensional SVG currency tokens and gold/silver/bronze ribbon medals, including rewards, checkout, media unlock and wallet screens.
- Removed both the leaderboard's own search input and the shared header search while viewing the leaderboard.
- Replaced the inline Discord text card with a portrait event poster: angled dimensional lettering, warm campaign palette, treasure tokens, sparkle accents and an event CTA. Uses original Rulumi artwork and links to the event center; no invented reward amount or countdown.
- Restored individual Discord, X, Instagram and YouTube icons in the sidebar and mobile drawer. Official outbound URLs are still pending configuration.

Validation: TypeScript noEmit; Vite design build; 14 targeted catalog/wallet tests; browser review of sidebar collapse/expand, merged creation menu, event CTA, no-search leaderboard and 320/390px H5 layout.

Existing preview boundaries remain: simulated chat/payment, demo balances, creator payout settlement not connected, extra-language long-form content fallback to English.
