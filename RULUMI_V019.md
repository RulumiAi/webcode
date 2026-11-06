# Rulumi v0.19

- Popular-content destination renamed Trending (人气 / 人気). Removed its internal Popular/Community switch and sharing subpage. Category More ranking flow remains intact.
- Category sections have 11px mobile / 13px desktop gaps, with compact headings and no extra carousel bottom spacing.
- Character profile order: photos, videos, introduction/settings, reviews. Both media strips scroll horizontally with snap alignment and small portrait covers (96px mobile / 110px desktop), retaining one free item and existing paid-lock flow. Reviews are last.
- Preview video strip has four items so horizontal overflow is visible at typical phone widths. Native horizontal scrollbars are hidden.

## Validation
TypeScript passed. Browser checked absence of inner community tabs, five bottom navigation items and Trending label, 11px measured category gap, portrait media cover width of 96px, horizontal overflow, and media sections above introduction. Backend/payment/model integration limits remain as documented in v0.18.
