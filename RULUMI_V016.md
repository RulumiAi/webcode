# Rulumi v0.16

- Personal center now offers created characters, images, videos and comics, with actual browser-local work counts, search, owner previews and downloads. Removed its separate chat history tab.
- Header dropdowns, expanded tags and native details close on outside pointer actions; Escape closes header/details menus.
- H5 bottom navigation restored to Home, Chat, Create and Mine. Drawer keeps one creation chooser and removes individual duplicate creation links and empty groups.
- Compact mobile wallet, aligned More tag chip, smaller profile/chat search and stable UID copy button. Mobile chat no longer shows recommendations.
- Mobile inline event posters use the exact character tile dimensions. Confirmed at 390px: character and event cards are both 172 x 310px.
- Mobile character creation occupies the full viewport (top 0, height 885px in the QA viewport). Image/video generation removes promotional headings, descriptions and empty output decoration while preserving form controls and review/result states.

## Validation

TypeScript checked; 14 existing catalog, wallet and comic tests passed. Browser checked Web outside-dismiss and image generation/save/profile/view flow; H5 four bottom tabs, creation chooser, full-screen character creator, profile format tabs, compact video form, hidden chat recommendations and drawer creation deduplication.

Generated media, payments and identity remain preview adapters; model/backend integration is unchanged. Owned media and comic drafts are read from existing browser-local stores.
