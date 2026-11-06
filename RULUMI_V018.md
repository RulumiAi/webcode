# Rulumi v0.18

- H5 bottom navigation: Home / Community / Create / Chat / Mine. Community sharing is named Community and accessible within the community area alongside popular content. Compact top spacing and smaller section gaps.
- Events and rankings occupy the full viewport. Event hero reduced to 145px on mobile, 185px on desktop. Ranking back/content gap reduced and media category filters use the same segmented style as time filters.
- Removed the chat-list creation button.
- Removed the free subscription card and presentation preview labels from recharge/subscription surfaces. Kept the checkout dialog truthful about the unconnected sample payment adapter. Reduced plan, wallet, pack and checkout dimensions.
- Character details show introduction, photos, videos and reviews in one scroll area. Preview photos/videos each have one free item and blurred paid items. Unlock uses the existing confirmation and shared browser wallet, with header updates. Production media still honors server access flags and server unlock API; production one-free-item policy must be configured there.
- Video collection detail is a fullscreen vertical scroll-snap reader, with one clip per screen, active-only playback, mute control, next/previous controls and locked video unlock states. Generic API video detail opens at the selected item. Preview uses bundled sample clips, not newly generated media.

## Checks
TypeScript and 14 existing catalog, wallet and comic tests passed. Browser checked five bottom tabs with Create centered, compact community, full-screen category rankings, full-screen event center, contiguous character profile sections with one free image/video, vertical video next-screen transition (883px steps), blurred locked screen, and three paid subscription cards with no free card or pricing-preview labels. Real models, media storage, payment and authentication adapters remain unconnected preview integrations as before.
