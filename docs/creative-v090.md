# v0.9.0 — creation, missions and events

## Changed behavior

The sidebar no longer squeezes the recent-chat container while allowing children to paint outside it. Primary navigation, creation navigation and footer retain their heights. Recent conversations have a 150px scrolling area, fixed-height rows, non-shrinking avatars and clipped names. The compact sidebar has its own 112px recent area. Conversations are deduplicated by character. Short desktop windows scroll the whole sidebar as needed; nothing overlaps the creation entries.

Image and video creation now use `CreationStudio`, reached from desktop navigation, H5 navigation and the chat image button. Chat entry carries the current character into the request. Text and reference-image modes, validated uploads, character choice, three visual styles, ratios, image quantity, video duration/camera motion and optional exclusions are supported. The flow includes review, queued/generating/processing progress, cancellation, error/retry with settings preserved, results, download, reuse as reference and browser-local work history. On H5, review and result panels scroll into view. Navigation away aborts unfinished generation.

Every sample result is explicitly labeled: these are existing example images/videos, not new model outputs. No generation coins are charged. Requested ratios are presentation frames with `object-fit:contain`; existing examples are never stretched. Sample video is six seconds regardless of the requested future-model duration. Inputs are captured in the saved request for later integration.

Task Center is styled as a daily journal: a compact editorial banner, real daily progress, streak/earned summaries, seven-day rewards, quieter blue/green task cards and warm accent buttons. Existing once-per-day and once-per-code wallet rules remain.

Events are a separate editorial destination, not additional daily tasks. Three sample campaigns cover seasonal artwork, comics and an upcoming story collection. Users can filter ongoing/upcoming/participating events, see rules, join, navigate to the appropriate creation/chat flow, view actual local progress and collect a local commemorative stamp. Artwork and completed chat are required for the autumn stamp; a published comic is required for the comic stamp. Existing works count. These sample campaigns grant no money or coins and are not public submissions.

All new flows support English, Chinese, Japanese, Korean, Spanish and Portuguese. Motion uses short transitions, generation progress, small entrance movement and hover feedback; reduced-motion preferences disable decorative animation.

## Model integration seam

`src/creationJobs.ts` exports `CreationRequest`, `CreationResult`, `CreationStage` and `CreationAdapter`. Replace the `previewCreationAdapter` with a server implementation while retaining the UI contract:

1. POST a validated request to your own server, using an authenticated session and an idempotency key. Upload reference images to controlled storage and send their IDs rather than client data URLs in production.
2. The server validates ownership, content, price, account eligibility and model parameters. Keep vendor keys on the server.
3. Submit to your selected image/video provider and return a job ID. Poll or stream stage/progress updates through `onProgress`.
4. Honor `AbortSignal`; cancel server jobs where supported, distinguish client cancellation from provider completion, and settle/refund any coin reservation only on the server.
5. Return final downloadable asset URLs and persist work history server-side. Use signed URLs or an authorized download endpoint where needed. Change the sample-only result type/labels for a real result.
6. Supply UI errors for upload, insufficient balance, queue timeout, generation failure and storage errors; retry only with an explicit idempotency policy.

This preview does not call any image/video model, perform payment, verify age identity or publicly publish campaign submissions. Frontend storage is not authoritative for production rewards.

## Verification

TypeScript and the production preview build pass. Automated tests cover request validation, aborted jobs, ordered progress, media output existence, event progress/participation persistence, all six languages, runtime failure/retry and unmount cancellation. Existing discovery translator regression and wallet/media/preview API tests are retained. Browser QA includes multi-chat layout, image quantity/results/history, image-to-video flow, campaign joining/progress, task state, H5 width and navigation.
