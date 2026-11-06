import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const app = fs.readFileSync(path.join(import.meta.dirname, 'App.tsx'), 'utf8');
const chatPage = fs.readFileSync(path.join(import.meta.dirname, 'components', 'ChatPage.tsx'), 'utf8');

test('chat chunk preload shares a retryable loader with React.lazy', () => {
  const loader = app.slice(
    app.indexOf('let chatPageModulePromise'),
    app.indexOf("const CreateCharacterSurface"),
  );

  assert.match(loader, /let chatPageModulePromise:[^=]+\| null = null/);
  assert.match(loader, /function loadChatPageModule\(\)/);
  assert.match(loader, /chatPageModulePromise = import\('\.\/components\/ChatPage'\)\.catch/);
  assert.match(loader, /chatPageModulePromise = null;\s*throw reason/);
  assert.match(loader, /lazy\(\(\) => loadChatPageModule\(\)/);
  assert.match(app, /if \(!currentUser \|\| activeTab !== 'explore' \|\| discoveryLoading \|\| chatBootRequested\) return/);
  assert.match(app, /const schedule = window\.requestIdleCallback/);
  assert.match(app, /setChatBootRequested\(true\);\s*void loadChatPageModule\(\)\.catch\(\(\) => undefined\)/);
  assert.match(app, /window\.cancelIdleCallback/);
});

test('thread cache restore does not delay server thread loading', () => {
  const loader = app.slice(
    app.indexOf('const loadServerThreads = async () =>'),
    app.indexOf('// This is the single initial loader.'),
  );

  assert.match(loader, /const serverThreads = loadServerThreads\(\);\s*void readCachedThreads\(userId\)/);
  assert.match(loader, /void serverThreads\s*\.then\(\(loaded\)/);
  assert.doesNotMatch(loader, /await readCachedThreads\(userId\)/);
  assert.match(app, /const chatThreadsRef = useRef<ApiChatThread\[\]>\(\[\]\)/);
  assert.match(loader, /const inFlightThreads = chatThreadsRef\.current/);
  assert.match(loader, /loaded\.filter\(\(thread\) => !inFlightThreads\.some\(\(item\) => item\.id === thread\.id\)\)/);
});

test('recent chat prefetch is immediate, deduplicated, and limited to three threads', () => {
  const preload = app.slice(
    app.indexOf('const prefetchThreads = chatThreads.slice(0, 3)'),
    app.indexOf('// Handle selecting character to chat'),
  );

  assert.match(preload, /const prefetchThreads = chatThreads\.slice\(0, 3\)/);
  assert.match(preload, /const recentThread = prefetchThreads\[0\]/);
  assert.match(preload, /getChatPrefetch\(userId, thread\)/);
  assert.match(preload, /for \(const thread of prefetchThreads\)/);
  assert.match(preload, /Promise\.allSettled\(\[prefetch\.messages, prefetch\.character, prefetch\.background\]\)/);
  assert.doesNotMatch(preload, /requestIdleCallback|api\.chat\.voices|api\.generation|api\.chat\.threads\.list/);
});

test('selected new character keeps chat shell visible before thread creation finishes', () => {
  assert.match(chatPage, /if \(threadLoading && !selectedCharacter\) return <ChatLoadingShell/);
  assert.match(chatPage, /if \(isAuthenticated === false\) return \(\) => \{ cancelled = true; \};/);
  assert.doesNotMatch(chatPage, /if \(isAuthenticated === false \|\| threadLoading\) return/);
  assert.match(chatPage, /void ensureThread\(selectedCharacter\.id\)\.then/);
  assert.match(chatPage, /const activeTimelineReady = Boolean\(activeThread && timelineSynced\[activeThread\.id\]\)/);
  assert.match(chatPage, /const characterId = activeCharacter\.id/);
  assert.match(chatPage, /const backgroundUrl = activeChatBg/);
  assert.match(chatPage, /preloadChatBackground\(cacheUserId, characterId, backgroundUrl\)/);
  assert.match(chatPage, /const \[loadedChatBgs, setLoadedChatBgs\] = useState<Record<string, string>>\(\{\}\)/);
  assert.match(chatPage, /setLoadedChatBgs\(\(current\) => current\[characterId\] === backgroundUrl/);
  assert.match(chatPage, /const activeChatFallback = activeCharacter\?\.avatarThumbnailLarge \|\| activeCharacter\?\.avatar \|\| ''/);
  assert.match(chatPage, /const loadedChatBg = activeCharacter && loadedChatBgs\[activeCharacter\.id\] === activeChatBg/);
  assert.match(chatPage, /loadedChatBg \|\| activeChatBg \|\| activeChatFallback/);
  assert.match(chatPage, /const matchingResolvedCharacter = resolvedCharacter\?\.id === targetCharacterId \? resolvedCharacter : null/);
  assert.doesNotMatch(chatPage, /const renderedChatBg = activeChatBg \? loadedChatBg \|\| activeChatBg : ''/);
  assert.match(chatPage, /backgroundImage: renderedChatBg \?/);
});

test('chat thread summaries preserve character source for detail loading', () => {
  assert.match(app, /source: thread\.character\.source \|\| known\.source/);
  assert.match(app, /source: thread\.character\.source \|\| 'api'/);
  assert.match(chatPage, /source: thread\.character\.source \|\| 'api'/);
  assert.match(chatPage, /api\.createdCharacters\.get\(characterId, controller\.signal\)/);
  assert.match(chatPage, /api\.characters\.get\(characterId, controller\.signal\)/);
  assert.match(chatPage, /controller\.abort\(\)/);
});

test('chat remains mounted after first visit and is cleared on logout', () => {
  assert.match(app, /const \[chatRouteVisited, setChatRouteVisited\] = useState\(false\)/);
  assert.match(app, /currentUser && \(chatRouteVisited \|\| activeTab === 'chat'\)/);
  assert.match(app, /className=\{isChatRouteActive \? 'chat-workspace-page mx-auto flex h-full min-h-0 w-full max-w-\[1700px\]' : 'hidden'\}/);
  assert.match(app, /<ChatPage\s+isActive=\{isChatRouteActive\}/);
  assert.match(app, /const handleLogout = async \(\) => \{[\s\S]*?setChatRouteVisited\(false\)/);
});

test('chat shows workspace shell while thread history is loading', () => {
  const loadingBranchStart = chatPage.indexOf('if (threadLoading && !selectedCharacter) return');
  const loadingBranchEnd = chatPage.indexOf('\n  if (!activeCharacter)', loadingBranchStart);
  const loadingBranch = chatPage.slice(loadingBranchStart, loadingBranchEnd);

  assert.ok(loadingBranchStart >= 0);
  assert.match(loadingBranch, /ChatLoadingShell/);
  assert.doesNotMatch(loadingBranch, /onSubmit|sendMessage/);
  assert.match(chatPage, /className="chat-loading-shell/);
});

test('chat background stays fixed to the chat viewport while messages scroll', () => {
  assert.match(chatPage, /absolute inset-0 h-full w-full bg-cover bg-center transition-opacity/);
  assert.doesNotMatch(chatPage, /absolute inset-0 bg-cover bg-center transition-all/);
  assert.match(chatPage, /min-h-0 flex-1 overflow-y-auto overscroll-contain/);
  assert.match(chatPage, /mobile-scroll-strip relative z-20 flex shrink-0/);
  assert.match(chatPage, /chat-composer-safe relative z-20 shrink-0/);
});

test('chat background picker exposes selected background and opacity states', () => {
  assert.match(chatPage, /const selected = activeChatBg === url/);
  assert.match(chatPage, /aria-pressed=\{selected\}/);
  assert.match(chatPage, /border-pink-500 ring-2 ring-pink-400\/70/);
  assert.match(chatPage, /const selected = bgOpacity === opacity/);
  assert.match(chatPage, /bg-pink-500\/25 text-white ring-1 ring-pink-400\/70/);
  assert.match(chatPage, /setBackground\(url\)/);
  assert.match(chatPage, /setBgOpacity\(opacity\)/);
});

test('chat background keeps user override or character cover stable', () => {
  const backgroundStart = chatPage.indexOf('const activeChatBg');
  const backgroundEnd = chatPage.indexOf('const selectedChatCharacterId', backgroundStart);
  const backgroundSource = chatPage.slice(backgroundStart, backgroundEnd);

  assert.match(backgroundSource, /chatBgMap\[activeCharacter\.id\] \|\| activeCharacter\.avatar/);
  assert.doesNotMatch(backgroundSource, /photos\?\.\[0\]\?\.url/);
  assert.match(chatPage, /loadedChatBgs\[activeCharacter\.id\] === activeChatBg/);
});

test('inactive chat closes transient UI without aborting generation', () => {
  const inactiveEffectStart = chatPage.indexOf("useEffect(() => {\n    if (isActive) return;\n    stopAudio();");
  const inactiveEffectEnd = chatPage.indexOf('\n\n  useEffect(() => {', inactiveEffectStart + 1);
  const inactiveEffect = chatPage.slice(inactiveEffectStart, inactiveEffectEnd);

  assert.ok(inactiveEffectStart >= 0);
  assert.match(inactiveEffect, /setShowBgSelector\(false\)/);
  assert.match(inactiveEffect, /setPreviewImage\(null\)/);
  assert.match(inactiveEffect, /setShowDetailDrawer\(false\)/);
  assert.doesNotMatch(inactiveEffect, /abortAllStreams|controller\.abort/);
});

test('chat timeline restores cached data without clearing it during refresh', () => {
  const timelineLoader = chatPage.slice(
    chatPage.indexOf('const loadThreadTimeline'),
    chatPage.indexOf('const pendingImageJobIds'),
  );

  assert.match(timelineLoader, /const messagesPromise = loadMessages\(threadId, excludedMessageId, true\)/);
  assert.match(timelineLoader, /const imageJobsPromise = loadImageJobs\(threadId, true\)/);
  assert.match(timelineLoader, /await Promise\.all\(\[messagesPromise, imageJobsPromise\]\)/);
  assert.match(chatPage, /readCachedTimeline\(cacheUserId, thread\.id\)/);
  assert.match(chatPage, /const activeTimelineReady = Boolean\(activeThread && timelineSynced\[activeThread\.id\]\)/);
  assert.doesNotMatch(timelineLoader, /setMessages\(\[\]\)|setImageJobs\(\[\]\)/);
  assert.match(chatPage, /timelineCacheRef\.current\[thread\.id\]/);
});

test('new thread opening message renders before timeline requests finish', () => {
  const activation = chatPage.slice(
    chatPage.indexOf('const activateThread'),
    chatPage.indexOf('const abortAllStreams'),
  );
  const timelineLoader = chatPage.slice(
    chatPage.indexOf('const loadThreadTimeline'),
    chatPage.indexOf('const pendingImageJobIds'),
  );

  assert.match(activation, /thread\.messageCount === 1/);
  assert.match(activation, /thread\.lastMessage\?\.role === 'assistant'/);
  assert.match(activation, /setMessages\(\[uiMessage\(thread\.lastMessage, locale\)\]\)/);
  assert.match(timelineLoader, /const messagesPromise = loadMessages/);
  assert.match(timelineLoader, /const imageJobsPromise = loadImageJobs/);
  assert.match(timelineLoader, /if \(hasOpeningMessage\) \{[\s\S]*?setTimelineSynced/);
  assert.match(timelineLoader, /await Promise\.all\(\[messagesPromise, imageJobsPromise\]\)/);
});

test('hidden chat does not run scroll measurement work', () => {
  const scrolling = chatPage.slice(
    chatPage.indexOf('useLayoutEffect(() => {'),
    chatPage.indexOf('const runGeneration'),
  );

  assert.match(scrolling, /useLayoutEffect\(\(\) => \{\s*if \(!isActive\) return/);
  assert.match(scrolling, /useEffect\(\(\) => \{\s*if \(!isActive\) return;[\s\S]*?new ResizeObserver/);
  assert.match(scrolling, /\[isActive, activeThread\?\.id, messages, timelineTailKey, isLoading\]/);
  assert.match(scrolling, /\[isActive, activeThread\?\.id, threadLoading\]/);
});
