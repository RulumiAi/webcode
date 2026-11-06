# Rulumi v0.20

## Changes
- Fixed-size circular video close, previous/next and mute controls (34px with centered 18px SVGs), plus settings close. Removed the legacy settings wallet balance badge.
- Role profile photos and videos open a shared touch/keyboard viewer supporting left/right navigation across free and locked items. Existing unlock confirmation and server access flags remain authoritative; preview unlocks use the browser wallet. Authentication overlays sit above the media viewer.
- Cleared presentation-level interactive/design-preview labels from listings, rankings, worldbooks, events, rewards, wallet and the global notice. Checkout and unavailable-model dialogs retain their truthful non-live integration explanations.
- Coins and subscription pages fill the viewport without the top account toolbar. Removed pricing header/intro text and reduced top spacing.
- Removed chat search. Homepage search is an icon between wallet and language, opening a full-screen page with search input, popular keywords and recommended characters. Search supports creator/name/text/tag matches and keyword aliases; submitting returns to character results.
- Reworked personal page around an illustrated cover, UID, avatar, edit/settings entry, factual work/save/chat counts, horizontal wallet/VIP/reward/creator links and all four owned media categories. Reworked public creator card styling while retaining its loaded content and follow actions.
- Reworked chat visual layout with a translucent character introduction/album card, background artwork, plum message surfaces and compact actions/composer. Existing message, voice, regeneration and media flows retained. H5 bottom navigation uses a rounded floating layout.

## Validation
TypeScript passed. All 14 existing catalog, wallet and comic tests passed after removing obsolete rendered presentation copy while preserving the translation catalog completeness contract.
Browser checks at 390px and 320px: header search location/no overlap, search filtering and recommendation page, personal header/assets/work tabs, settings without balance and 34px close, chat list without search, sending a sample message and receiving sample reply, photo viewer next/locked/confirm/unlock behavior, shared wallet change 150 to 130, circular video controls, and pricing fullscreen at top 0 with viewport height 885px. Native touch gesture handlers are implemented; navigation buttons exercised the same item state transitions in the cloud browser.

Models, real checkout and persistent production media remain the existing integration boundaries. No user account credentials were entered; testing used the product's local demo-session button and demo wallet.
