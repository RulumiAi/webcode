# Rulumi 0.10 UI update

Brand: Rulumi, intended domain rulumi.ai. The custom domain has not been configured by this change. Existing preview hosting remains owner-private. Existing browser storage identifiers and API endpoints remain compatible.

- Language selection appears on discovery home only. Removed duplicate selectors from business workspaces, profile account settings and entry preferences. Content authoring language is retained as content metadata.
- Removed desktop Notifications and Task Center sidebar rows. Notifications remain in the header and personal center. Tasks open from the home rewards cards.
- Home reward cards support browser-local check-in, daily conversation reward, once-per-day status and shared wallet synchronization. This remains explicitly a design preview, not a production reward service.
- Role tags remain grouped by personality, identity, relationship and theme. Story (31), comic (29), photo (30) and video (28) tag lists are independent and localized. Filters match curated catalog metadata; a category with no examples shows the existing empty state. Fixed pointer selection displacement caused by dropdown focus scrolling.
- Redesigned profile: blue identity banner, gold coin card, violet membership card and quieter collection/history stats.
- Redesigned coin shop: differentiated balances, first-purchase offer, 3-column desktop / 2-column mobile packs, selected pack and explicit confirmation. Demo checkout is unchanged and performs no actual payment.
- Sidebar now uses consistent Lucide line icons with restrained per-feature colors.

Validation: TypeScript check and design build passed. Twelve targeted wallet/catalog/taxonomy tests passed. Existing filterTags test has an external Python fixture dependency absent in this standalone source checkout; its other five assertions passed. Browser checks covered desktop and 390px mobile, home reward claim, category switching, photo tag click filtering, personal center, coin pack selection and absence of language selectors in those workspaces.
