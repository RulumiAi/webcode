# Rulumi v0.17

Includes the previously requested, unpublished H5 five-tab navigation (Home, Community, Feed, Chat, Mine), no drawer, Rulumi wordmark and compact wallet.

- Community starts directly with popular characters, stories, photos and videos. More opens its category ranking inside Community. Popular creators has the same four categories and opens creator rankings. Rankings no longer have a separate sidebar entry.
- Community images preserve portrait proportions and captions no longer overlap or crop the artwork. Existing preview catalogs supply sample entries; production ranking metrics still require the backend integration.
- Story listing introduction removed. Event workspace title removed; entry remains the event poster among homepage character cards, with the separate sidebar event link removed.
- Character detail favorite/close buttons are centered circles of 29px; follow height is 32px. Comment submit/sort controls are 28px.
- Chat recent/interacted headings removed. Delete control is hidden by default; a left touch swipe reveals the mobile delete action and suppresses accidental row navigation. Existing deletion confirmation is retained.
- Creation chooser close is a fixed circular button. Personal creation-format tabs are shorter; select heights match profile search and options have legible dark backgrounds. Ranking view/category/period controls are compact.
- Daily sign-in popup now requires an authenticated user on Web and H5, including when authentication changes while the page is mounted.

## Validation
TypeScript passes and 14 catalog/wallet/comic tests pass. Browser checks: H5 five tabs, no drawer trigger, category More opens correct story ranking, author More enters creator ranking, image and caption dimensions, 29px detail actions and 28px comment controls. Signed out in the preview app and confirmed zero check-in dialogs. Native touch-swipe behavior is implemented but not exercised on a physical phone in this environment.
