# v0.7.4 — Comics, media previews and motion

Added Comics after Story cards in the existing five-tab discovery workspace. Character/story catalogue sizing and worldbook detail are preserved.

Design preview: six sample collections. Comics have three image groups, the first free, subsequent groups 20 demo coins each. Photo albums have six images, the first two free; one 30-demo-coin purchase unlocks all six. Video collections have four motion-preview clips, the first free, subsequent clips 20 demo coins each. Prices are sample configuration, not final commercial pricing.

Confirmation precedes each simulated deduction. The demo starts with 100 coins. A separate browser-local ledger records balance and entitlements; revisiting purchased content does not charge again. Purchases re-read the latest local state before deduction and reject insufficient funds or invalid costs. This is a preview ledger separate from the production wallet. Real paid access requires server-authorized pricing, atomic wallet deduction, durable purchase records and signed/authorized asset delivery. Browser-local entitlements are not production content security. Existing production API contracts remain unchanged.

Comics use existing original illustrations composed into sample panels and captions. Videos reuse the four existing six-second motion-preview files; they are not newly generated story films.

Desktop and H5 header: notification precedes the anime avatar, with the profile action at the far right. Avatar links to the existing profile entry.

Motion: catalogue hover lift, gentle cover zoom, tab-panel entrance, dialog entrance, press feedback, unlock-content reveal, and avatar hover. New motion respects prefers-reduced-motion and does not change the grid geometry.

Validation: TypeScript, free-preview boundary tests, album entitlement scope, per-group/video scope, idempotent deduction, insufficient funds, corrupt-state recovery, and six-language copy. Desktop/H5 UI reviewed, including locked video having no video element and a 358px reader without horizontal overflow.

## v0.7.5 corrections

Comics use an original-ratio poster inside the cropped catalogue frame, preserving the centering translation during hover zoom. Removed catalogue policy banners, free-preview card badges and reader-header policy copy; unlock details remain at locked content and confirmation. Category changes clear detail selection and story details render only in the story category. Discovery tab animation is scoped and opacity-only. Desktop and H5 category round trips, independent filters, correct detail surfaces and 3:5 cover geometry verified. Preview boundary and purchase tests still pass.

## v0.7.6 — Reproduced DOM mutation crash

The preceding fixes did not address the fatal error when external translation wraps React-owned text nodes. The discovery count combined a conditional bare text node (story count) and the category label. In a JSDOM React DOM regression test, wrapping those nodes like a browser translator reproduced both exact failure directions: stories → comics threw `NotFoundError: The node to be removed is not a child of this node`; comics → stories threw `NotFoundError: The child can not be found in the parent`. The unhandled commit error unmounted the React application.

The counter now uses stable separate element containers. The product declares its built-in multilingual interface as notranslate, preventing automatic translation from rewriting these controls. Scoped and root error boundaries retain a retryable interface if any other render failure occurs; the last error message and component stack are saved locally, without network transmission.

Added `npm run test:discovery-runtime`: ten directional/locale DOM tests (including real text-node wrapping in English, Chinese, Japanese and Korean) plus one boundary isolation/retry test. Before the fix both mutation cases failed; after the fix all eleven pass. Nine existing catalogue/entitlement tests and TypeScript also pass.

Browser validation this time uses the actual built static output, not the Vite development server: verified hashed production script, six alternating desktop selections and four mobile selections, each retaining six cards and zero recovery fallbacks. This verifies the built output in the QA browser; the user's exact browser extension/translation configuration is not directly observable.
