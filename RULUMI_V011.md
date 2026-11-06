# Rulumi 0.11

## Navigation and entry
Rewards is a separate discovery tab immediately after Videos. It uses long horizontal cards, stacked vertically, on desktop and mobile. Recent chats has its own accessible disclosure; collapsing the sidebar and reopening the chat disclosure restores the list. Standalone My profile links were removed from desktop sidebar and mobile navigation. Header avatar still opens profile or authentication.

First entry collects only age range and optional gender preference. Completion does not open authentication. Public browsing remains available. Creation, chat, favorites, profile and account-specific actions retain authentication boundaries. The design adapter now starts as guest and offers an explicit local demo session. Creation requested by a guest resumes after demo sign-in.

## NSFW preference
The switch defaults off, persists locally and requires completed adult age preferences. In this design preview it controls the six editorial character samples and their photo collections. Off-state filtering occurs before preview pagination, with separate page-cache keys; turning it off also hides cached mature character cards immediately. This is a mature-theme preference, not server authorization or identity verification. Production integration must use backend content ratings and server-side age/access checks; no production NSFW catalog contract was available in this source.

## Discord promotion
A labeled PR card appears after the third character in the discovery grid. It uses the same VITE_SOCIAL_DISCORD setting as the other community links. No actual owned invitation URL was supplied. Until configured, the card truthfully shows an invitation-pending message instead of redirecting to another server.

## Editorial assets
Six original adult fashion portraits (ages 28–32) are saved under public/rulumi/editorial/: velvet.webp, moonlit.webp, sakura.webp, noir.webp, coast.webp, starlight.webp. Added to the character catalog, mature photo examples and image/video creation reference gallery; character creation has a selectable preset gallery in design mode. Existing demonstration videos remain motion samples, not newly generated video output.

Created with built-in image generation. Final prompt per image: “Original premium Japanese anime fashion editorial portrait, vertical 2:3 composition, one clearly grown adult, natural proportions, head to mid-thigh.” Subject briefs: 29-year-old auburn-haired woman in opaque burgundy off-shoulder knit dress at evening cafe; 30-year-old silver-bobbed woman in tailored navy gown on moonlit rooftop; 28-year-old black-haired woman in neatly wrapped lavender kimono in lantern street; 32-year-old black-haired man in dark open-collar shirt at jazz cafe; 29-year-old chestnut-haired man in ivory linen shirt on sunset seaside terrace; 31-year-old honey-blonde woman in opaque black cocktail dress and cream blazer at art gallery. Shared finish: “Elegant confident smile, rich cinematic light and finely detailed fabric. All clothing fully opaque, polished fashion magazine styling, relaxed standing pose. No lettering or watermark.”

## Validation
TypeScript, production preview build, and 14 targeted wallet/catalog/asset tests. Browser verification covers guest browsing, conditional auth prompt and local demo entry, chat disclosure, Rewards tab and CTA, NSFW switching, editorial reference selection, and mobile layout. Existing backend and real payment/model integrations were not changed.
