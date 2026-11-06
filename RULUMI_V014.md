# Rulumi v0.14

- Restored character/image/video/comic creation to the left navigation (mobile drawer included), removed the top + creation menu.
- Removed the homepage activity banner; retained the separate inline portrait event card.
- Removed the Rewards discovery category beside Videos.
- Removed the leaderboard title, eyebrow and promotional heading; kept ranking controls and results.
- Automatically collapses the global left sidebar when entering chat, with manual expansion retained.
- Avatar dropdown removes coin, subscription and chat history shortcuts; adds My creations, opening the profile creations tab even if another profile tab was previously selected.
- Topic chips are a flat, compact list without personality/theme headings. Collapsed view is exactly one row plus More; expanded view wraps all tags. Selected tags only change color, with no check icon. English control is More / Less.

Validation: TypeScript noEmit and Vite design build. Browser checks cover no banner / no Rewards tab, restored creation entries, flat tag expansion, selected-chip absence of SVG, avatar menu, empty leaderboard heading set, automatic chat sidebar collapse, English More and H5 single-row tag layout.
