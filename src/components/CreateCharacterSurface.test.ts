import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const surface = fs.readFileSync(path.join(root, 'components', 'CreateCharacterSurface.tsx'), 'utf8');
const modal = fs.readFileSync(path.join(root, 'components', 'CreateCharacterModal.tsx'), 'utf8');
const app = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');

test('create surface switches at the V2 1024px breakpoint', () => {
  assert.match(surface, /breakpoint = 1024/);
  assert.match(surface, /max-width: \${breakpoint - 1}px/);
  assert.match(surface, /presentation=\{isMobile \? 'page' : 'workspace'\}/);
});

test('V2 workspace is routed through the app host', () => {
  assert.match(app, /CreateCharacterSurface/);
  assert.match(app, /create-workspace-main/);
  assert.match(app, /createRouteVisited && activeTab === 'create'/);
});

test('Create keeps click intent until authentication bootstrap resolves', () => {
  const createHandler = app.match(/const openCreateSurface = \(\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(createHandler, /if \(!authReady\) \{\s*setPendingCreate\(true\);\s*return;/);
  assert.doesNotMatch(createHandler, /if \(!authReady\)[\s\S]{0,100}openAuth/);
  assert.match(app, /if \(!authReady \|\| !pendingCreate\) return;/);
  assert.match(app, /if \(!currentUser\) \{\s*openAuth\('login'\);/);
  assert.match(app, /setCreateRouteVisited\(true\);\s*setActiveTab\('create'\);/);
});

test('portrait completion opens showcase before ST card finishes', () => {
  assert.match(modal, /job\.status === 'complete' && job\.designProfileStatus === 'complete' && portrait/);
  assert.match(modal, /showCreatedCharacter\(completed\)/);
  assert.match(modal, /const pollStCard = async \(\) =>/);
  assert.match(modal, /createdCharacter\.stCard\?\.status === 'complete'/);
  assert.match(modal, /setCreatedCharacter\(character\)/);
  assert.match(modal, /portrait-placeholder\.jpg/);
  assert.equal(fs.existsSync(path.join(root, '..', 'public', 'create-character', 'portrait-placeholder.jpg')), true);
});

test('each new standard character receives one stable random age from 18 through 35', () => {
  assert.match(modal, /useState<number>\(\(\) => getRandomCreateCharacterAge\(\)\)/);
  assert.match(modal, /setAge\(getRandomCreateCharacterAge\(\)\)/);
  assert.match(modal, /age: Math\.max\(18, Number\(age\) \|\| 18\)/);
  assert.doesNotMatch(modal, /useState<number>\(22\)|setAge\(22\)/);
});

test('portrait generation shows only image shimmer and an accessible progress bar', () => {
  assert.match(modal, /animate-pulse bg-pink-300\/10 motion-reduce:animate-none/);
  assert.match(modal, /role="progressbar"/);
  assert.match(modal, /aria-valuenow=\{portraitGenerationProgress\}/);
  assert.match(modal, /style=\{\{ width: `\$\{portraitGenerationProgress\}%` \}\}/);
  assert.doesNotMatch(modal, /\{portraitGenerationProgress\}%<\/span>/);
  assert.doesNotMatch(modal, /showPortraitProgress \? t\('create\.generating'\)/);
});

test('standard ST failure retries the card without regenerating the portrait', () => {
  assert.match(modal, /api\.createdCharacters\.retryStCard\(createdCharacterId\)/);
  assert.match(modal, /if \(character\.stCard\?\.status === 'complete'\) return;/);
  assert.match(modal, /const pollStCard = async \(\) =>/);
  assert.match(modal, /delayedPollTimerRef\.current = window\.setTimeout/);
  assert.doesNotMatch(modal, /setGenerationError\(localizeCreateFlowError\(reason, t, 'generator\.errorRetry'\)\)/);
});

test('standard retry surfaces only insufficient credits', () => {
  assert.match(modal, /reason\.code === 'INSUFFICIENT_CREDITS'/);
  assert.match(modal, /localizeCreateFlowErrorCode\(reason\.code, t, 'create\.generationError'\)/);
  assert.doesNotMatch(modal, /setGenerationError\(localizeCreateFlowError\(reason, t, 'generator\.errorRetry'\)\)/);
});

test('created character showcase is a centered modal and does not navigate early', () => {
  assert.match(modal, /absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black\/70/);
  assert.match(modal, /aria-labelledby="created-character-title"/);
  assert.match(modal, /id="created-character-title"/);
  const handler = app.match(/const handleCreateCharacter = \(newChar: Character\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(handler, /setCharacters/);
  assert.doesNotMatch(handler, /setActiveTab/);
  assert.doesNotMatch(modal, /onSelectCharacterToChat\?\.\(createdCharacter\);\s*onClose\(\)/);
});

test('created character showcase exposes localized VIP public publishing action', () => {
  assert.match(modal, /api\.createdCharacters\.publish\(createdCharacterId\)/);
  assert.match(modal, /const reconcilePublicState = async \(\) =>/);
  assert.match(modal, /api\.createdCharacters\.get\(createdCharacterId\)/);
  assert.match(modal, /if \(await reconcilePublicState\(\)\) return/);
  assert.match(modal, /<Crown className="h-5 w-5 shrink-0" \/>/);
  assert.match(modal, /t\('create\.publishToCommunity'\)/);
  assert.match(modal, /t\('create\.publishPending'\)/);
  assert.match(modal, /t\('create\.publishApproved'\)/);
  assert.match(modal, /onOpenUpgradeModal\?\.\(\)/);
});

test('created character showcase resolves localized tags instead of rendering raw API tags', () => {
  assert.match(modal, /getCreateCharacterShowcaseTags\(/);
  assert.match(modal, /showcaseTags\.map\(\(tg, idx\)/);
  assert.doesNotMatch(modal, /createdCharacter\.tags\.slice\(0, 7\)/);
});

test('H5 wizard keeps the new visual interaction structure', () => {
  assert.match(modal, /ImageChoiceOverlay/);
  assert.match(modal, /DIALOG_IMAGE_OPTION_GRID/);
  assert.match(modal, /mobileQuestionTitle/);
  assert.match(modal, /void navigateToStep\(step\.step\)/);
});

test('step 5 matches the H5 two-column story layout without changing mobile questions', () => {
  assert.match(modal, /lg:grid-cols-\[minmax\(0,\.9fr\)_minmax\(0,1\.1fr\)\]/);
  assert.match(modal, /min-h-\[5\.25rem\]/);
  assert.match(modal, /rows=\{isPage \? 5 : 7\}/);
  assert.match(modal, /t\('create\.archetypeHelper'\)/);
  assert.match(modal, /5: \[t\('create\.archetypeHint'\), t\('create\.name'\)\]/);
  assert.doesNotMatch(modal, /rows=\{isPage \? 5 : 2\}/);
});

test('step 5 profile fields stay optional and are submitted only at final generation', () => {
  const nextQuestion = modal.match(/const handleNextWizardQuestion = \(\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(nextQuestion, /void navigateToStep\(currentStep \+ 1\)/);
  assert.doesNotMatch(nextQuestion, /wizardGenerate|subtitle|description|greeting/);
  const stepNavigation = modal.match(/const navigateToStep = async \(step: number\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(stepNavigation, /step === 6 && currentStep === 5/);
  assert.match(stepNavigation, /snapshotProfileInputs\(\)/);
  assert.doesNotMatch(stepNavigation, /wizardGenerate/);
  const finalGeneration = modal.match(/const handleGenerateAiImage = async \(\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(finalGeneration, /const profileInputs = snapshotProfileInputs\(\)/);
  assert.match(finalGeneration, /subtitle: profileInputs\.subtitle/);
  assert.match(finalGeneration, /backgroundStory: profileInputs\.backgroundStory/);
  assert.match(finalGeneration, /firstMessage: profileInputs\.firstMessage/);
  assert.doesNotMatch(finalGeneration, /if \(!subtitle\.trim\(\)|if \(!description\.trim\(\)|if \(!greeting\.trim\(\)/);
});

test('steps 1 and 2 use the original create-character media manifest', () => {
  assert.match(modal, /asset=\{stylePreviewMedia\.anime\}/);
  assert.match(modal, /asset=\{stylePreviewMedia\.realistic\}/);
  assert.match(modal, /getCreateCharacterOptionAsset\(gender, artStyle, 'race', race\.id\)/);
  assert.match(modal, /getCreateCharacterFantasySpeciesAsset\(gender, artStyle, spec\.id\)/);
  assert.doesNotMatch(modal, /mainPreviewAsset/);
});

test('step 3 uses versioned option assets from the shared manifest', () => {
  const visualAsset = modal.match(/const visualAsset = \(category: CreateCharacterOptionCategory, id: string\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(visualAsset, /return getCreateCharacterOptionAsset\(gender, artStyle, category, id\);/);
  assert.doesNotMatch(modal, /\/create-character\/options\//);
  assert.doesNotMatch(modal, /STATIC_HAIR_IMAGE_IDS/);
});

test('step 2 uses one shared selection with European heritage as the default', () => {
  assert.match(modal, /const \[selectedRace, setSelectedRace\] = useState<string>\('caucasian'\)/);
  assert.match(modal, /const \[selectedSpecies, setSelectedSpecies\] = useState<string>\('human'\)/);
  assert.match(modal, /const handleRaceSelection = \(raceId: string\) => \{[\s\S]*?setSelectedRace\(raceId\);[\s\S]*?setSelectedSpecies\('human'\)/);
  assert.match(modal, /const handleSpeciesSelection = \(speciesId: string\) => \{[\s\S]*?setSelectedRace\(''\);[\s\S]*?setSelectedSpecies\(speciesId\)/);
  assert.match(modal, /role="radiogroup"[\s\S]*?aria-label=\{t\('create\.stepTitle2'\)\}/);
  assert.match(modal, /const isSelected = selectedSpecies === 'human' && selectedRace === race\.id/);
  assert.match(modal, /onClick=\{\(\) => handleRaceSelection\(race\.id\)\}/);
  assert.match(modal, /onClick=\{\(\) => handleSpeciesSelection\(spec\.id\)\}/);
  assert.match(modal, /setSelectedRace\('caucasian'\);[\s\S]*?setSelectedSpecies\('human'\)/);
});

test('H5 visual migration preserves creation business contracts', () => {
  assert.match(modal, /wizardNameAvailability/);
  assert.match(modal, /wizardGenerate/);
  assert.match(modal, /createFromGeneratedImage/);
  assert.match(modal, /retryStCard/);
  assert.match(modal, /flowMode === 'generatedImagePrototype'/);
});

test('H5 eye and hair color assets are available locally', () => {
  const assets = [
    ...['emerald', 'ruby', 'amber', 'sapphire', 'heterochromia', 'amethyst']
      .map((name) => path.join('assets', 'v5', 'options', 'female', 'anime', 'eye', `${name}-384.webp`)),
    ...['realistic', 'anime'].flatMap((style) =>
      ['blonde', 'pink', 'black', 'silver', 'brown', 'purple']
        .map((name) => path.join('hair-color', style, `${name}.jpg`)),
    ),
  ];
  assets.forEach((asset) => {
    assert.equal(fs.existsSync(path.join(root, '..', 'public', 'create-character', asset)), true, asset);
  });
});

test('create surface uses localized copy, prompts, and failure messages', () => {
  assert.doesNotMatch(modal, /角色创作空间|让想象，成为你的|选择角色最终呈现的视觉语言|奇幻血统\s*</);
  assert.doesNotMatch(modal, /\{t\('create\.greeting'\)\}\s*\(Greeting\)/);
  assert.match(modal, /buildCreateCharacterImagePromptDocument/);
  assert.match(modal, /isPromptManuallyEdited/);
  assert.match(modal, /automaticImagePrompt\.segments\.map/);
  assert.match(modal, /PROMPT_SEGMENT_CLASSES/);
  assert.match(modal, /auto-rows-min grid-cols-2 content-start/);
  assert.match(modal, /line-clamp-2/);
  assert.match(modal, /localizeCreateFlowErrorCode\(job\.failureCode/);
  assert.match(modal, /localizeCreateFlowErrorCode\(character\.stCard\?\.errorCode/);
  assert.doesNotMatch(modal, /reason instanceof ApiError \? reason\.message/);
  assert.doesNotMatch(modal, /job\.failureMessage \|\|/);
  assert.doesNotMatch(modal, /stCard\?\.errorMessage \|\|/);
});

test('creation preview videos load only after interaction', () => {
  assert.match(modal, /const showVideo = Boolean\(asset\.video && playing && !videoFailed\)/);
  assert.match(modal, /preload="none"/);
  assert.doesNotMatch(modal, /autoPlay=\{!isPage\}/);
});
