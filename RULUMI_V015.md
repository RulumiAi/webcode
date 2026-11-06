# Rulumi v0.15

Fixes and restored platform behavior:
- Reduced the desktop Chat-to-creation navigation gap to six pixels between navigation groups.
- Desktop role cards open chat immediately; phone/tablet cards preserve the role information screen and Start chat confirmation.
- Global sidebar collapses only for chat. Switching to another tab, business page or membership screen expands it again.
- Corrected desktop fixed-header offsets to the actual 240/72px sidebar widths. Chat's own header starts below global chrome. Role information/auth overlays stack above global controls.
- H5 restores Discover / Chat / Create bottom navigation, a single-row brand header, compact in-content home search, and a small wallet menu containing the newer coin/membership/earnings entries.
- Phone chat uses the screen for the conversation and composer, hides global chrome and bottom tabs, and returns to the recent chat list normally.
- Mobile Create opens a four-format bottom sheet (character, comic, image, video) before entering each existing workflow. Authentication is requested when a creation type is used, rather than for opening the chooser.
- Mobile role details and media/comic creation occupy the viewport without a hidden header reserving space.

Verification: TypeScript noEmit; Vite design build; 14 catalog/wallet tests. Browser checks: desktop card-to-chat without profile modal, chat header bounds, sidebar restoration, H5 initial information view then chat, immersive conversation and return, all four creation choices, 390px and 320px layout.

Existing boundaries unchanged: generated content and financial actions in this preview are simulations; production model/payment/payout adapters require integration.
