# v0.7.3 — Anime covers and worldbook detail

Built-in image generation mode; original illustration-story assets. No competitor images were copied. Existing Lurova six-world cover sheet is retained. No backend story engine or shared memory is represented as connected.

## Saved assets and final prompt set

Portrait outputs: `/workspace/sites/mio-preview/public/mio/fresh-anime/{nao,hina,sora,aoi,yuna,itsuki}.webp`.

Common portrait prompt: Original Japanese 2D anime illustration, portrait composition 3:4. Unambiguously adult character with mature adult face and proportions, fully clothed. Crisp delicate anime line art, hand-painted cel shading, beautiful illustrated eyes, soft fresh pastel colors, airy slice-of-life visual novel key art, charming relaxed expression, waist-up character centered with breathing room. Strictly illustrated anime, never a photograph, never photorealism, no 3D render. No text, watermark, logos, collage or frame.

| File | Subject appended to common prompt |
| --- | --- |
| nao.webp | 27-year-old adult woman Nao, black bob haircut, ivory blouse and light blue skirt, walking down a Kamakura lane filled with blue hydrangeas, soft early summer light |
| hina.webp | 28-year-old adult woman Hina, long chestnut hair, cream linen blouse, at a sunny Japanese cafe window with a teacup, green trees outside |
| sora.webp | 29-year-old adult man Sora, short dark hair, pale blue overshirt, holding a bicycle on a seaside Enoshima road, ocean and sky behind |
| aoi.webp | 26-year-old adult woman Aoi, shoulder-length dark hair, pale yellow cardigan, standing inside a cozy Japanese bookshop, sunbeams on books |
| yuna.webp | 30-year-old adult woman Yuna, dark braided hair, white blouse and olive apron, at a small Japanese flower shop with daisies and greenery |
| itsuki.webp | 31-year-old adult man Itsuki, glasses and dark hair, beige overshirt and film camera, a quiet Japanese countryside railway station in summer |

Scene outputs: `/workspace/sites/mio-preview/public/mio/worlds/`.

Common scene prompt: Original Japanese 2D anime background art, wide landscape 3:2 composition. Richly detailed hand-painted environment from an elegant anime visual novel, clean delicate linework, luminous color, cinematic depth, tasteful purple accents. No photograph, no photorealism, no 3D render, no text, no watermark, no collage. No people.

| File | Scene prompt |
| --- | --- |
| campus.webp | Sunlit Japanese university courtyard in spring, mature cherry trees, modern library and quiet pathways |
| manor.webp | Mysterious European manor hall, sweeping staircase, candlelit chandeliers, purple twilight through tall windows |
| eldria.webp | Magnificent fantasy city beside a river, distant white castle, gardens and glowing magical trees, blue mountains |
| neon.webp | Rainy futuristic Japanese city street at blue hour, luminous cyan and magenta storefronts, elevated railway, no readable letters |
| dollhouse.webp | Elegant antique dollhouse mansion interior, vintage parlor with tiny porcelain dolls on a shelf, moonlit windows, gentle eerie atmosphere |
| cafe.webp | Warm airy Japanese cafe interior with a wooden counter, large windows, plants, coffee cups and morning sun |
| campus-terrace.webp | Quiet terrace outside a Japanese university library, wooden benches and books, cherry blossom shadows, green campus courtyard in distance, sunlit glass doors |
| manor-gallery.webp | Mysterious manor portrait gallery, oil portraits in gold frames, damaged family crest above a locked double door, rich violet twilight, candle sconces |
| eldria-garden.webp | Luminous enchanted fantasy garden, giant ancient white tree with purple glowing leaves, broken royal seal sculpture, stream and stone footbridge, no city skyline |
| neon-platform.webp | Rain-soaked elevated train station platform above a futuristic Japanese city, teal train entering, cyan and magenta lights, night sky, no readable signs |
| dollhouse-window.webp | Moonlit window alcove in an antique mansion, large old wooden window, mysterious formal garden visible outside, old clock and velvet seat indoors, porcelain doll on sill |
| cafe-table.webp | Close view of a long wooden table beside a Japanese cafe's large open window, chairs, pastries, flower vase, notebook, green neighborhood street outside, warm morning sun |

Second scene set prompt suffix: Detailed hand-painted visual novel environment, clean delicate linework, luminous atmospheric colors, sophisticated composition. No people, no text or watermark, not a photograph, not photorealistic, not 3D.

WebP conversion uses FFmpeg solely for resizing/encoding: portraits 720px wide, scenes 960px wide, quality 85. Original PNG files remain untouched.

## UI behavior

- Full worldbook workspace preserves desktop sidebar; left poster + chat button, right title/author, metrics, expandable summary, numbered lore sections.
- All six worlds have complete NPC role mappings, two distinct location images, three chronological events, and two world-rule entries. Counts agree with actual entries.
- English, Chinese, Japanese, Korean, Spanish and Portuguese labels and sample entries.
- NPC identities expand inline; locations and events disclose descriptions; world saving uses the existing local collection.
- Start chat opens NPC selection and then the existing sample character chat. Shared world memory is explicitly unavailable.
- H5 uses a compact cover/title header, full-width chat action, horizontally scrollable NPC avatars, two-column scenes, and single-column events. Catalogue retains compact cards and seven columns on desktop.

Packaging: removed four obsolete embedded SVG portraits (IDs 0–3 already use anime WebP) and the six superseded photography assets. All eighteen current character covers remain available. This reduces the expanded deployment below the hosting limit without dropping any active feature assets.
