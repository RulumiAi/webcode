import {SearchPage} from './components/SearchPage';
import {r12Copy} from './r12Text';
import {Search} from 'lucide-react';
import {MobileCreateChooser} from './components/MobileCreateChooser';
import {CommunityLanding} from './components/CommunityLanding';
import {RulumiChrome} from './components/RulumiChrome';
import {DailyCheckIn} from './components/DailyCheckIn';
import {useMature} from './components/MatureToggle';
import {isMaturePreviewCharacter} from './matureCatalog';
import {HomeMissions} from './components/HomeMissions';
import {EntryOnboarding} from './components/EntryOnboarding';
import {readPreferences} from './entryPreferences';
import {DESIGN_PREVIEW, previewCharacters} from './previewApi';
import {DEMO_THEMES, demoThemeLabel, isSensitiveDemoQuery, selectionMatches, splitThemeChips, stripNsfwThemes, visibleDemoThemes} from './demoThemes';
import {BusinessWorkspace} from './components/BusinessWorkspace';
import type {BusinessView} from './businessCopy';
import {RuntimeBoundary} from './components/RuntimeBoundary';
import {PersonalCenter} from './components/PersonalCenter';
import {DiscoveryHub} from './components/DiscoveryHub';
import type {ContentKind} from './discoveryCatalog';
import { ReferencePhotoGallery } from './components/ReferencePhotoGallery';
import { DiscoverySpotlight } from './components/DiscoverySpotlight';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { lazy, Suspense } from 'react';
import { Character, CharacterFilterTag, FilterState, NavTab, type Locale } from './types';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { TagCarousel } from './components/TagCarousel';
import { CharacterGrid } from './components/CharacterGrid';
import { MobileNavigation } from './components/MobileNavigation';
import { AlertCircle, Heart, Compass, LoaderCircle, Sparkles } from 'lucide-react';
import { AppNotification } from './types';
import { api, ApiError, patchCharacterPersonalization, type ApiUser, type ApiMedia, type ApiChatThread, type ApiNotification, type ApiFeedPost, type CharacterFilters, type CreatorProfile, type FavoriteResult, type ApiFollowingCreator } from './api';
import { loadAllFavoriteCharacters } from './favorites';
import { useLocale } from './i18n';
import { GENERATION_ENABLED, ROUTE_NAVIGATION_ITEMS } from './navigation';
import { clearPaymentReturnQuery, paymentReturnReference as readPaymentReturnReference, type BillingCycle, type MembershipPlanId, type PaymentAccount } from './data/membershipProducts';
import { userErrorMessage } from './utils/userError';
import { getLocalWizardNickname } from './utils/wizardNickname';
import { clearChatCache, readCachedThreads, writeCachedThreads } from './chatTimelineCache';
import { clearChatPrefetches, getChatPrefetch } from './chatPrefetch';
import { applySeoMetadata, createSeoMetadata, getPathForCharacter, getPathForTab, getRouteFromPath, type AppRoute } from './seo';
import { pageDataCacheKey, readPageDataSnapshot, writePageDataSnapshot } from './pageDataCache';

let chatPageModulePromise: Promise<typeof import('./components/ChatPage')> | null = null;

function loadChatPageModule() {
  if (!chatPageModulePromise) {
    chatPageModulePromise = import('./components/ChatPage').catch((reason) => {
      chatPageModulePromise = null;
      throw reason;
    });
  }
  return chatPageModulePromise;
}

const ChatPage = lazy(() => loadChatPageModule().then((module) => ({ default: module.ChatPage })));
const CreateCharacterSurface = lazy(() => import('./components/CreateCharacterSurface').then((module) => ({ default: module.CreateCharacterSurface })));
const UpgradeModal = lazy(() => import('./components/UpgradeModal').then((module) => ({ default: module.UpgradeModal })));
const AIGeneratorModal = lazy(() => import('./components/AIGeneratorModal').then((module) => ({ default: module.AIGeneratorModal })));
const CommunityPlazaView = lazy(() => import('./components/CommunityPlazaView').then((module) => ({ default: module.CommunityPlazaView })));
const CharacterFeedView = lazy(() => import('./components/CharacterFeedView').then((module) => ({ default: module.CharacterFeedView })));
const MyCharactersView = lazy(() => import('./components/MyCharactersView').then((module) => ({ default: module.MyCharactersView })));
const HelpView = lazy(() => import('./components/HelpView').then((module) => ({ default: module.HelpView })));
const SafetyCenterView = lazy(() => import('./components/SafetyCenterView').then((module) => ({ default: module.SafetyCenterView })));
const ReferralView = lazy(() => import('./components/ReferralView').then((module) => ({ default: module.ReferralView })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then((module) => ({ default: module.UserProfileModal })));
const CharacterDetailModal = lazy(() => import('./components/CharacterDetailModal').then((module) => ({ default: module.CharacterDetailModal })));
const CreatorProfileModal = lazy(() => import('./components/CreatorProfileModal').then((module) => ({ default: module.CreatorProfileModal })));
const NotificationModal = lazy(() => import('./components/NotificationModal').then((module) => ({ default: module.NotificationModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then((module) => ({ default: module.AuthModal })));
type AuthIntent = import('./components/AuthModal').AuthIntent;

const PAYMENT_PRESENTATION_KEY = 'soulmingle:payment-presentation';
const UPGRADE_RETURN_SNAPSHOT_KEY = 'soulmingle:upgrade-return:v1';
const DISCOVERY_PAGE_SIZE = 20;
const MOBILE_DISCOVERY_PAGE_SIZE = 8;
type DiscoverySnapshot = { items: Character[]; page: number; total: number };

type UpgradeReturnSnapshot = {
  version: 1;
  activeTab: NavTab;
  selectedCharacterId: string | null;
  selectedDetailCharacterId: string | null;
  viewingCreatorId: string | null;
  viewingCreatorAuthor: string | null;
  createRouteVisited: boolean;
  mobileGenerateVisited: boolean;
  isMobileGenerateSecondaryView: boolean;
  isProfileModalOpen: boolean;
  isNotificationModalOpen: boolean;
  isMobileNavigationOpen: boolean;
};

function readUpgradeReturnSnapshot() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(UPGRADE_RETURN_SNAPSHOT_KEY) || 'null') as Partial<UpgradeReturnSnapshot> | null;
    if (!parsed || parsed.version !== 1 || typeof parsed.activeTab !== 'string' || !(parsed.activeTab in ROUTE_NAVIGATION_ITEMS)) return null;
    return {
      version: 1,
      activeTab: parsed.activeTab as NavTab,
      selectedCharacterId: typeof parsed.selectedCharacterId === 'string' ? parsed.selectedCharacterId : null,
      selectedDetailCharacterId: typeof parsed.selectedDetailCharacterId === 'string' ? parsed.selectedDetailCharacterId : null,
      viewingCreatorId: typeof parsed.viewingCreatorId === 'string' ? parsed.viewingCreatorId : null,
      viewingCreatorAuthor: typeof parsed.viewingCreatorAuthor === 'string' ? parsed.viewingCreatorAuthor : null,
      createRouteVisited: Boolean(parsed.createRouteVisited),
      mobileGenerateVisited: Boolean(parsed.mobileGenerateVisited),
      isMobileGenerateSecondaryView: Boolean(parsed.isMobileGenerateSecondaryView),
      isProfileModalOpen: Boolean(parsed.isProfileModalOpen),
      isNotificationModalOpen: Boolean(parsed.isNotificationModalOpen),
      isMobileNavigationOpen: Boolean(parsed.isMobileNavigationOpen),
    };
  } catch {
    localStorage.removeItem(UPGRADE_RETURN_SNAPSHOT_KEY);
    return null;
  }
}

function writeUpgradeReturnSnapshot(snapshot: UpgradeReturnSnapshot) {
  try {
    localStorage.setItem(UPGRADE_RETURN_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Private browsing may disable storage; the in-memory snapshot remains usable.
  }
}

function clearUpgradeReturnSnapshot() {
  try {
    localStorage.removeItem(UPGRADE_RETURN_SNAPSHOT_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function RouteLoadingFallback({ label }: { label: string }) {
  return (
    <div
      className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-[1600px] px-3 py-2 sm:px-4 lg:min-h-[calc(100dvh-1.5rem)] lg:px-0 lg:py-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-5 flex h-11 items-center gap-3 rounded-lg border border-zinc-800/80 bg-[#12121a] px-4 text-sm text-zinc-300">
        <LoaderCircle className="h-4 w-4 animate-spin text-pink-400 motion-reduce:animate-none" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-hidden="true">
        <div className="h-24 rounded-lg bg-zinc-900/80" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="aspect-[3/4] rounded-lg bg-zinc-900/80" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModalLoadingFallback({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-h-20 min-w-40 items-center justify-center gap-3 rounded-lg bg-[#181820] px-5 text-sm text-zinc-200 shadow-2xl">
        <LoaderCircle className="h-5 w-5 animate-spin text-pink-400 motion-reduce:animate-none" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

function LazyModalBoundary({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={active ? <ModalLoadingFallback label={label} /> : null}>
      {children}
    </Suspense>
  );
}

function mapNotification(item: ApiNotification, locale: Locale): AppNotification {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    content: item.content,
    time: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt)),
    isRead: item.isRead,
    authorId: item.actor?.id,
    authorName: item.actor?.handle || item.actor?.displayName,
    authorAvatar: item.actor?.avatar?.url,
    characterId: item.character?.id,
    characterName: item.character?.name,
    characterAvatar: item.character?.image?.url,
    actionType: item.actionType,
  };
}



async function loadAllFollowingCreators() {
  const items: ApiFollowingCreator[] = [];
  let page = 1;
  while (true) {
    const result = await api.creators.following(page, 100);
    items.push(...result.items);
    if (items.length >= result.total || result.items.length === 0) return items;
    page += 1;
  }
}

async function loadAllNotifications(locale: Locale) {
  const items: AppNotification[] = [];
  let cursor: string | undefined;
  let unreadCount = 0;
  do {
    const result = await api.notifications.list(cursor, 100);
    items.push(...result.items.map((item) => mapNotification(item, locale)));
    unreadCount = result.unreadCount;
    cursor = result.nextCursor || undefined;
    if (!result.hasMore) break;
  } while (cursor);
  return { items, unreadCount };
}

async function loadUnreadNotifications() {
  const result = await api.notifications.list(undefined, 1, true);
  return result.unreadCount;
}


export default function App() {
  useEffect(()=>{const close=(e:PointerEvent)=>{document.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(d=>{if(!d.contains(e.target as Node))d.open=false})};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')document.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(d=>d.open=false)};document.addEventListener('pointerdown',close);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',esc)}},[]);

  const { locale, t } = useLocale();
  const [characters, setCharacters] = useState<Character[]>([]);

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window === 'undefined') return 'explore';
    const route = getRouteFromPath(window.location.pathname);
    return route.kind === 'tab' ? route.tab : 'explore';
  });
  const [pendingStory,setPendingStory]=useState<string|null>(null);
  const matureEnabled=useMature();
  const [entryFlow,setEntryFlow]=useState<'initial'|'edit'|null>(()=>DESIGN_PREVIEW||readPreferences()?null:'initial');
  const [adultNotice,setAdultNotice]=useState('');
  const [businessView,setBusinessView]=useState<BusinessView|null>(null);const [pendingBusiness,setPendingBusiness]=useState<BusinessView|null>(null);
  const [discoveryKind,setDiscoveryKind]=useState<ContentKind>('characters');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [creationsRequest,setCreationsRequest]=useState(0);


  // Detail Modal & Creator Profile Modal States
  const [selectedDetailCharacter, setSelectedDetailCharacter] = useState<Character | null>(null);
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<string, number>>({});
  const [viewingCreatorAuthor, setViewingCreatorAuthor] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [creatorProfileLoading, setCreatorProfileLoading] = useState(false);
  const [creatorProfileError, setCreatorProfileError] = useState<string | null>(null);
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);
  const creatorRequestRef = useRef(0);
  const [creatorCharacters, setCreatorCharacters] = useState<Character[]>([]);
  const [creatorCharactersTotal, setCreatorCharactersTotal] = useState(0);
  const [creatorCharactersPage, setCreatorCharactersPage] = useState(0);
  const [creatorCharactersLoading, setCreatorCharactersLoading] = useState(false);
  const [creatorCharactersError, setCreatorCharactersError] = useState<string | null>(null);
  const [creatorDynamics, setCreatorDynamics] = useState<ApiFeedPost[]>([]);
  const [creatorDynamicsTotal, setCreatorDynamicsTotal] = useState(0);
  const [creatorDynamicsPage, setCreatorDynamicsPage] = useState(0);
  const [creatorDynamicsLoading, setCreatorDynamicsLoading] = useState(false);
  const [creatorDynamicsError, setCreatorDynamicsError] = useState<string | null>(null);
  const creatorDynamicLikeBusyRef = useRef(new Set<string>());
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestRef = useRef(0);

  // Followed Creators / Authors State
  const [followingCreators, setFollowingCreators] = useState<ApiFollowingCreator[]>([]);
  const followBusyRef = useRef(new Set<string>());
  const followingLoadPromiseRef = useRef<Promise<ApiFollowingCreator[]> | null>(null);
  const followedAuthors = useMemo(() => followingCreators.map((creator) => creator.handle), [followingCreators]);

  // Chatted characters list state

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await api.notifications.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (reason) {
      setGlobalError(userErrorMessage(reason, t, 'errors.notifications'));
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.notifications.clear();
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (reason) {
      setGlobalError(userErrorMessage(reason, t, 'errors.notifications'));
    }
  };

  const handleMarkNotificationAsRead = async (id: string) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.isRead) return;
    try {
      await api.notifications.read(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadNotificationsCount((count) => Math.max(0, count - 1));
    } catch (reason) {
      setGlobalError(userErrorMessage(reason, t, 'errors.notifications'));
    }
  };

  // Modals

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  useEffect(()=>{setSidebarCollapsed(activeTab==='chat'&&!businessView&&!isUpgradeModalOpen)},[activeTab,businessView,isUpgradeModalOpen]);
  const [mobileCreateChooser,setMobileCreateChooser]=useState(false);
  const [upgradeInitialSection, setUpgradeInitialSection] = useState<'plans' | 'recharge'>('plans');
  const [upgradeNotice, setUpgradeNotice] = useState('');
  const [isQuickUpgradeModalOpen, setIsQuickUpgradeModalOpen] = useState(false);
  const [quickUpgradeNotice, setQuickUpgradeNotice] = useState('');
  const [quickUpgradeFeature, setQuickUpgradeFeature] = useState('');
  const [upgradeInitialSelection, setUpgradeInitialSelection] = useState<{ planId: MembershipPlanId; billingCycle: BillingCycle } | null>(null);
  const upgradeReturnSnapshotRef = useRef<UpgradeReturnSnapshot | null>(null);
  const upgradeReturnDetailRef = useRef<Character | null>(null);
  const captureUpgradeReturnSnapshot = () => {
    if (upgradeReturnSnapshotRef.current || isUpgradeModalOpen || isQuickUpgradeModalOpen) return;
    const snapshot: UpgradeReturnSnapshot = {
      version: 1,
      activeTab,
      selectedCharacterId: selectedCharacter?.id || null,
      selectedDetailCharacterId: selectedDetailCharacter?.id || null,
      viewingCreatorId,
      viewingCreatorAuthor,
      createRouteVisited,
      mobileGenerateVisited,
      isMobileGenerateSecondaryView,
      isProfileModalOpen,
      isNotificationModalOpen,
      isMobileNavigationOpen,
    };
    upgradeReturnSnapshotRef.current = snapshot;
    upgradeReturnDetailRef.current = selectedDetailCharacter;
    writeUpgradeReturnSnapshot(snapshot);
  };
  const prepareUpgradePage = () => {
    captureUpgradeReturnSnapshot();
    setSelectedDetailCharacter(null);
    setViewingCreatorAuthor(null);
    setIsProfileModalOpen(false);
    setIsNotificationModalOpen(false);
    setIsMobileNavigationOpen(false);
  };
  const openUpgradeModal = (notice = '', selection?: { planId: MembershipPlanId; billingCycle: BillingCycle }) => {
    prepareUpgradePage();
    setIsQuickUpgradeModalOpen(false);
    setQuickUpgradeNotice('');
    setQuickUpgradeFeature('');
    setUpgradeInitialSection('plans');
    setUpgradeNotice(notice);
    setUpgradeInitialSelection(selection || null);
    setIsUpgradeModalOpen(true);
  };
  const openUpgradeEntry = () => {
    setBusinessView(null);
    prepareUpgradePage();
    setIsQuickUpgradeModalOpen(false);
    setQuickUpgradeNotice('');
    setQuickUpgradeFeature('');
    setUpgradeNotice('');
    setUpgradeInitialSelection(null);
    setUpgradeInitialSection(membershipTier ? 'recharge' : 'plans');
    setIsUpgradeModalOpen(true);
  };
  const openRechargeEntry = () => {
    if(DESIGN_PREVIEW){setBusinessView('coins');return}
    prepareUpgradePage();
    setIsQuickUpgradeModalOpen(false);
    setQuickUpgradeNotice('');
    setQuickUpgradeFeature('');
    setUpgradeNotice('');
    setUpgradeInitialSelection(null);
    setUpgradeInitialSection('recharge');
    setIsUpgradeModalOpen(true);
  };
  const openQuickUpgradeModal = (notice = '', featureLabel = '') => {
    captureUpgradeReturnSnapshot();
    setIsUpgradeModalOpen(false);
    setUpgradeNotice('');
    setUpgradeInitialSelection(null);
    setUpgradeInitialSection('plans');
    setQuickUpgradeNotice(notice);
    setQuickUpgradeFeature(featureLabel);
    setIsQuickUpgradeModalOpen(true);
  };
  const [paymentReturnReference, setPaymentReturnReference] = useState(() => {
    if (typeof window === 'undefined') return '';
    return readPaymentReturnReference(
      window.location.search,
      localStorage.getItem('soulmingle:payment-reference') || localStorage.getItem('soulmingle:paybao-reference') || '',
    );
  });
  const [communityReloadKey, setCommunityReloadKey] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
  ));
  const discoveryPageSize = isMobileViewport ? MOBILE_DISCOVERY_PAGE_SIZE : DISCOVERY_PAGE_SIZE;
  const [createRouteVisited, setCreateRouteVisited] = useState(false);
  const [chatRouteVisited, setChatRouteVisited] = useState(false);
  const [mobileGenerateVisited, setMobileGenerateVisited] = useState(false);
  const [isMobileGenerateSecondaryView, setIsMobileGenerateSecondaryView] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>('login');
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipPlanId | null>(null);
  const [membershipFeatureKeys, setMembershipFeatureKeys] = useState<string[]>([]);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [pendingChatCharacterId, setPendingChatCharacterId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [favoriteCharacters, setFavoriteCharacters] = useState<Character[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const favoriteBusyRef = useRef(new Set<string>());
  const favoritesRequestRef = useRef(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);
  const [wizardNickname, setWizardNickname] = useState<{ nickname: string; locale: Locale } | null>(null);
  const [wizardNicknameLoading, setWizardNicknameLoading] = useState(false);
  const [wizardNicknameError, setWizardNicknameError] = useState<string | null>(null);
  const [createSessionKey, setCreateSessionKey] = useState(0);
  const [pendingCreate, setPendingCreate] = useState(false);
  const nicknameConsumedRef = useRef(false);
  const nicknameRequestRef = useRef(0);
  const nicknameConsumePromiseRef = useRef<Promise<boolean> | null>(null);
  const nicknameLoadPromiseRef = useRef<{ key: string; requestId: number; promise: Promise<void> } | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);
  const initialDiscoveryLoadRef = useRef(true);
  const discoverySortRef = useRef<FilterState['sortBy'] | null>(null);
  const emailVerificationCompletedRef = useRef(false);
  const currentUserRef = useRef<ApiUser | null>(null);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const previousActiveTabRef = useRef<NavTab>(activeTab);
  const chatPrefetchKeyRef = useRef<string | null>(null);
  const initialRouteHandledRef = useRef(false);
  const initialPrivateRouteHandledRef = useRef(false);

  const updateBrowserPath = (path: string, replace = false) => {
    if (typeof window === 'undefined' || window.location.pathname === path) return;
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', path);
  };

  const navigateToTab = (tab: NavTab, replace = false) => {
    updateBrowserPath(getPathForTab(tab), replace);
    setActiveTab(tab);
  };

  const requireNicknameAuthentication = () => {
    setCurrentUser(null);
    setPendingCreate(true);
    setAuthIntent('login');
    setIsAuthModalOpen(true);
  };

  const consumeWizardNickname = (): Promise<boolean> => {
    nicknameConsumedRef.current = true;
    setWizardNickname(null);
    if (nicknameConsumePromiseRef.current) return nicknameConsumePromiseRef.current;
    const request = api.createdCharacters.wizardNickname.consume()
      .then(() => true)
      .catch((reason) => {
        if (reason instanceof ApiError && reason.status === 401) requireNicknameAuthentication();
        setWizardNicknameError(t('create.nicknameError'));
        return false;
      })
      .finally(() => { nicknameConsumePromiseRef.current = null; });
    nicknameConsumePromiseRef.current = request;
    return request;
  };

  const loadWizardNickname = (targetLocale: Locale, requireFresh = false): Promise<void> => {
    const key = `${targetLocale}:${requireFresh ? 'fresh' : 'reuse'}`;
    if (nicknameLoadPromiseRef.current?.key === key) return nicknameLoadPromiseRef.current.promise;

    const requestId = ++nicknameRequestRef.current;
    setWizardNicknameLoading(true);
    setWizardNicknameError(null);
    const promise = (async () => {
      try {
        if (requireFresh) {
          const consumed = await (nicknameConsumePromiseRef.current || consumeWizardNickname());
          if (!consumed) throw new Error('nickname consume failed');
        }
        const result = await api.createdCharacters.wizardNickname.get(targetLocale);
        if (nicknameRequestRef.current !== requestId) return;
        nicknameConsumedRef.current = false;
        setWizardNickname(result);
      } catch (reason) {
        if (nicknameRequestRef.current !== requestId) return;
        if (reason instanceof ApiError && reason.status === 401) {
          requireNicknameAuthentication();
          return;
        }
        nicknameConsumedRef.current = false;
        setWizardNickname({ nickname: getLocalWizardNickname(targetLocale), locale: targetLocale });
        setWizardNicknameError(t('create.nicknameError'));
      } finally {
        if (nicknameRequestRef.current === requestId) setWizardNicknameLoading(false);
        if (nicknameLoadPromiseRef.current?.requestId === requestId) nicknameLoadPromiseRef.current = null;
      }
    })();
    nicknameLoadPromiseRef.current = { key, requestId, promise };
    return promise;
  };

  const startNextCreateSession = () => {
    setCreateSessionKey((value) => value + 1);
    void loadWizardNickname(locale, true);
  };

  const refreshFavoriteCharacters = async (signal?: AbortSignal) => {
    const requestId = ++favoritesRequestRef.current;
    setFavoritesLoading(true);
    try {
      const items = await loadAllFavoriteCharacters(signal);
      if (signal?.aborted || favoritesRequestRef.current !== requestId) return;
      setFavoriteCharacters(items);
      setFavoriteIds(new Set(items.map((character) => character.id)));
    } catch (reason) {
      if (!signal?.aborted && favoritesRequestRef.current === requestId && !(reason instanceof ApiError && reason.status === 401)) {
        setGlobalError(userErrorMessage(reason, t, 'errors.favoriteFailed'));
      }
    } finally {
      if (!signal?.aborted && favoritesRequestRef.current === requestId) setFavoritesLoading(false);
    }
  };

  const ensureFollowingCreators = useCallback(async () => {
    if (!currentUser) return [];
    if (!followingLoadPromiseRef.current) {
      followingLoadPromiseRef.current = loadAllFollowingCreators()
        .then((items) => {
          setFollowingCreators(items);
          return items;
        })
        .catch((reason) => {
          setGlobalError(userErrorMessage(reason, t, 'errors.notifications'));
          throw reason;
        })
        .finally(() => { followingLoadPromiseRef.current = null; });
    }
    return followingLoadPromiseRef.current;
  }, [currentUser, t]);

  const openAuth = (intent: AuthIntent = 'login') => {
    setAuthIntent(intent);
    setIsAuthModalOpen(true);
  };

  useEffect(()=>{if(currentUser&&pendingBusiness){setBusinessView(pendingBusiness);setPendingBusiness(null)}},[currentUser,pendingBusiness]);
  const openBusinessView=(view:BusinessView)=>{if(['image-create','video-create','comic-create'].includes(view)&&!currentUser){setPendingBusiness(view);openAuth('login');return}setBusinessView(view)};
  const [discoveryCharacters, setDiscoveryCharacters] = useState<Character[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryLoadingMore, setDiscoveryLoadingMore] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryLoadMoreError, setDiscoveryLoadMoreError] = useState<string | null>(null);
  const [discoveryReloadKey, setDiscoveryReloadKey] = useState(0);
  const [discoveryPage, setDiscoveryPage] = useState(0);
  const [discoveryTotal, setDiscoveryTotal] = useState(0);
  const discoveryRequestRef = useRef(0);
  const discoveryPageAbortRef = useRef<AbortController | null>(null);
  const discoveryLoadingMoreRef = useRef(false);
  const discoveryRefreshingRef = useRef(false);
  const [filterTagOptions, setFilterTagOptions] = useState<CharacterFilterTag[]>([]);
  const [chatThreads, setChatThreads] = useState<ApiChatThread[]>([]);
  const [chatThreadsLoading, setChatThreadsLoading] = useState(false);
  const [chatThreadsError, setChatThreadsError] = useState<string | null>(null);
  const [chatThreadsReady, setChatThreadsReady] = useState(false);
  const [chatThreadsReadyUserId, setChatThreadsReadyUserId] = useState<string | null>(null);
  const [chatBootRequested, setChatBootRequested] = useState(false);
  const chatThreadsRef = useRef<ApiChatThread[]>([]);

  useEffect(() => {
    chatThreadsRef.current = chatThreads;
  }, [chatThreads]);

  const refreshDiscoveryPersonalization = async (items: Character[], signal?: AbortSignal) => {
    const userId = currentUserRef.current?.id;
    const ids = [...new Set(items.map((item) => item.id))];
    if (!userId || ids.length === 0) return;
    try {
      const responses = await Promise.all(
        Array.from({ length: Math.ceil(ids.length / discoveryPageSize) }, (_, index) => (
          api.characters.personalization(ids.slice(index * discoveryPageSize, (index + 1) * discoveryPageSize), signal)
        )),
      );
      if (signal?.aborted || currentUserRef.current?.id !== userId) return;
      const patches = new Map(responses.flatMap((response) => response.items).map((item) => [item.id, item]));
      setDiscoveryCharacters((previous) => previous.map((character) => {
        const patch = patches.get(character.id);
        return patch ? patchCharacterPersonalization(character, patch) : character;
      }));
    } catch (reason) {
      if (signal?.aborted || reason instanceof ApiError && reason.status === 401) return;
    }
  };

  const getDiscoveryFilters = (): CharacterFilters => ({
    query: filterState.searchQuery.trim() || undefined,
    style: filterState.artStyle === 'all' ? undefined : filterState.artStyle as CharacterFilters['style'],
    gender: filterState.gender === 'all' ? undefined : filterState.gender as CharacterFilters['gender'],
    ageGroup: filterState.ageGroup === 'all' ? undefined : filterState.ageGroup as CharacterFilters['ageGroup'],
    tag: filterState.categoryTag === 'all' || filterState.categoryTag === 'following' ? undefined : filterState.categoryTag,
    sort: filterState.sortBy as CharacterFilters['sort'],
  });

  const threadCharacters = useMemo(() => chatThreads.map((thread) => {
    const known = discoveryCharacters.find((character) => character.id === thread.character.id);
    if (known) return { ...known, source: thread.character.source || known.source, chatCount: thread.character.chatCount ?? known.chatCount };
    const favorite = favoriteCharacters.find((character) => character.id === thread.character.id);
    if (favorite) return { ...favorite, source: thread.character.source || favorite.source, chatCount: thread.character.chatCount ?? favorite.chatCount };
    const snapshot = characters.find((character) => character.id === thread.character.id);
    if (snapshot) return { ...snapshot, source: thread.character.source || snapshot.source, chatCount: thread.character.chatCount ?? snapshot.chatCount };
    return {
      id: thread.character.id, name: thread.character.name, age: null, subtitle: '', description: '',
      avatar: thread.character.imageUrl || '', author: '', likes: 0, chatCount: thread.character.chatCount ?? 0, commentCount: commentCountOverrides[thread.character.id] ?? 0, tags: [], gender: null,
      artStyle: null, category: '', systemInstruction: '', greeting: '', voiceStyle: thread.voice.name,
      isFavorite: false, photos: [], videos: [], scenarios: [], source: thread.character.source || 'api', galleryLoaded: false,
    };
  }), [chatThreads, discoveryCharacters, favoriteCharacters, characters, commentCountOverrides]);
  const chatPageCharacters = useMemo(() => {
    const merged = [...discoveryCharacters, ...threadCharacters];
    return merged.filter((character, index) => merged.findIndex((item) => item.id === character.id) === index);
  }, [discoveryCharacters, threadCharacters]);
  const charactersWithChats = useMemo(() => {
    const merged = [...characters, ...threadCharacters];
    return merged.filter((character, index) => merged.findIndex((item) => item.id === character.id) === index);
  }, [characters, threadCharacters]);

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    gender: 'all',
    artStyle: 'all',
    ageGroup: 'all',
    categoryTag: 'all',
    sortBy: 'newest',
  });
  useEffect(() => {
    const onAdult = (event: Event) => {
      const enabled = Boolean((event as CustomEvent<{enabled?: boolean}>).detail?.enabled);
      if (enabled) return;
      setSelectedDetailCharacter((current) => current && isMaturePreviewCharacter(current.id) ? null : current);
      setSelectedCharacter((current) => current && isMaturePreviewCharacter(current.id) ? null : current);
      setFilterState((previous) => {
        const sensitive = isSensitiveDemoQuery(previous.searchQuery);
        if (sensitive) setAdultNotice(locale === 'ja' ? '検索条件を更新しました。' : 'The search was reset.');
        return {...previous, categoryTag: stripNsfwThemes(previous.categoryTag), searchQuery: sensitive ? '' : previous.searchQuery};
      });
    };
    window.addEventListener('rulumi-adult-visibility', onAdult);
    return () => window.removeEventListener('rulumi-adult-visibility', onAdult);
  }, [locale]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 1023px)');
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);
    syncViewport();
    mobileQuery.addEventListener('change', syncViewport);
    return () => mobileQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => () => {
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
  }, []);

  useEffect(() => {
    if (filterTagOptions.length > 0 || (discoveryLoading && discoveryCharacters.length === 0)) return;
    const controller = new AbortController();
    const load = () => void api.characters.filterTags(controller.signal)
      .then((tags) => setFilterTagOptions(tags))
      .catch(() => undefined);
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: {timeout: number}) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const handle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(load, {timeout: 3000})
      : window.setTimeout(load, 1000);
    return () => {
      controller.abort();
      if (idleWindow.cancelIdleCallback && idleWindow.requestIdleCallback) idleWindow.cancelIdleCallback(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, [discoveryCharacters.length, discoveryLoading, filterTagOptions.length]);
  useEffect(() => {
    let active = true;
    void api.auth.bootstrap()
      .then(({ user }) => {
        if (!active) return;
        setCurrentUser(user && emailVerificationCompletedRef.current ? { ...user, emailVerified: true } : user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('verifyEmail');
    if (!token) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('verifyEmail');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    let active = true;
    void api.auth.confirmEmailVerification(token)
      .then(() => {
        if (!active) return;
        emailVerificationCompletedRef.current = true;
        setCurrentUser((user) => user ? { ...user, emailVerified: true } : user);
        setGlobalNotice(t('profile.verificationComplete'));
      })
      .catch(() => {
        if (active) setGlobalError(t('profile.verificationFailed'));
      });
    return () => { active = false; };
  }, [t]);

  useEffect(() => {
    if (!paymentReturnReference) return;
    if (!upgradeReturnSnapshotRef.current) {
      upgradeReturnSnapshotRef.current = readUpgradeReturnSnapshot();
    }
    const presentation = localStorage.getItem(PAYMENT_PRESENTATION_KEY);
    if (presentation === 'quick') {
      // Legacy quick-checkout returns now land on the full native purchase page.
      setIsQuickUpgradeModalOpen(false);
      setQuickUpgradeNotice('');
      setQuickUpgradeFeature('');
      setUpgradeInitialSection('plans');
      setIsUpgradeModalOpen(true);
    } else {
      setIsUpgradeModalOpen(true);
    }
  }, [paymentReturnReference]);

  useEffect(() => {
    if (!currentUser) {
      setMembershipTier(null);
      setMembershipFeatureKeys([]);
      setPaymentAccount(null);
      return;
    }
    if (activeTab !== 'chat' && activeTab !== 'profile' && activeTab !== 'create' && activeTab !== 'generate' && !isUpgradeModalOpen && !isQuickUpgradeModalOpen && !isProfileModalOpen) return;
    const controller = new AbortController();
    void api.payments.account(controller.signal)
      .then((account) => {
        setPaymentAccount(account);
        setMembershipTier(account.membership?.tier ?? null);
        setMembershipFeatureKeys(account.membership?.featureKeys ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMembershipTier(null);
          setMembershipFeatureKeys([]);
          setPaymentAccount(null);
        }
      });
    return () => controller.abort();
  }, [activeTab, currentUser?.id, isProfileModalOpen, isQuickUpgradeModalOpen, isUpgradeModalOpen]);

  const handlePaymentAccountChange = (account: PaymentAccount) => {
    setPaymentAccount(account);
    setMembershipTier(account.membership?.tier ?? null);
    setMembershipFeatureKeys(account.membership?.featureKeys ?? []);
  };

  useEffect(() => {
    if (!currentUser) {
      favoritesRequestRef.current += 1;
      setFavoriteCharacters([]);
      setFavoriteIds(new Set());
      setFavoritesLoading(false);
      return;
    }
    if (activeTab !== 'my-ai' && activeTab !== 'profile') return;
    const controller = new AbortController();
    void refreshFavoriteCharacters(controller.signal);
    return () => controller.abort();
  }, [currentUser?.id, activeTab]);

  useEffect(() => {
    currentUserRef.current = currentUser;
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && !currentUser) {
      setDiscoveryReloadKey((value) => value + 1);
      void clearChatCache(previousUserId);
      clearChatPrefetches(previousUserId);
    }
    if (!currentUser) setChatBootRequested(false);
    previousUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

  useEffect(() => {
    if (previousActiveTabRef.current === activeTab) return;
    previousActiveTabRef.current = activeTab;
    if (activeTab === 'explore') setDiscoveryReloadKey((value) => value + 1);
  }, [activeTab]);

  useEffect(() => {
    if (!currentUser || activeTab !== 'explore' || discoveryLoading || chatBootRequested) return;
    const schedule = window.requestIdleCallback;
    const start = () => {
      setChatBootRequested(true);
      void loadChatPageModule().catch(() => undefined);
    };
    const idleId = schedule ? schedule(start, { timeout: 2000 }) : window.setTimeout(start, 500);
    return () => {
      if (schedule) window.cancelIdleCallback(idleId as number);
      else window.clearTimeout(idleId as number);
    };
  }, [activeTab, chatBootRequested, currentUser?.id, discoveryLoading]);

  useEffect(() => {
    if (currentUser && activeTab === 'chat') setChatRouteVisited(true);
  }, [activeTab, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();
    void refreshDiscoveryPersonalization(discoveryCharacters, controller.signal);
    return () => controller.abort();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) {
      followingLoadPromiseRef.current = null;
      setFollowingCreators([]);
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    if (activeTab === 'feed' || activeTab === 'community' || viewingCreatorAuthor || selectedDetailCharacter) {
      void ensureFollowingCreators().catch(() => undefined);
    }
  }, [activeTab, currentUser?.id, ensureFollowingCreators, selectedDetailCharacter, viewingCreatorAuthor]);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const refreshUnreadNotifications = () => {
      if (document.visibilityState !== 'visible') return;
      void loadUnreadNotifications().then((unreadCount) => {
        if (!active) return;
        setUnreadNotificationsCount(unreadCount);
      }).catch(() => undefined);
    };
    refreshUnreadNotifications();
    const intervalId = window.setInterval(refreshUnreadNotifications, 30_000);
    document.addEventListener('visibilitychange', refreshUnreadNotifications);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshUnreadNotifications);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || !isNotificationModalOpen) return;
    let active = true;
    void loadAllNotifications(locale).then((result) => {
      if (!active) return;
      setNotifications(result.items);
      setUnreadNotificationsCount(result.unreadCount);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [currentUser?.id, isNotificationModalOpen, locale]);

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setCharacters((previous) => previous.filter((character) => character.source !== 'created'));
      return () => { active = false; };
    }
    if (activeTab !== 'my-ai' && activeTab !== 'profile' && activeTab !== 'create' && activeTab !== 'generate' && activeTab !== 'chat') return () => { active = false; };
    void api.createdCharacters.list({ page: 1, pageSize: 100 })
      .then((result) => {
        if (!active) return;
        setCharacters((previous) => {
          const local = previous.filter((character) => character.source !== 'created');
          const created = result.items;
          return [...created, ...local];
        });
      })
      .catch((reason) => {
        if (active && !(reason instanceof ApiError && reason.status === 401)) {
          setGlobalError(userErrorMessage(reason, t, 'errors.createdLoad'));
        }
      });
    return () => { active = false; };
  }, [currentUser?.id, activeTab]);

  useEffect(() => {
    if (!globalError) return;
    const timer = window.setTimeout(() => setGlobalError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [globalError]);

  useEffect(() => {
    if (!globalNotice) return;
    const timer = window.setTimeout(() => setGlobalNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [globalNotice]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++discoveryRequestRef.current;
    discoveryPageAbortRef.current?.abort();
    discoveryPageAbortRef.current = null;
    discoveryLoadingMoreRef.current = false;
    discoveryRefreshingRef.current = true;
    setDiscoveryLoading(true);
    const filters = getDiscoveryFilters();
    const discoveryCacheKey = pageDataCacheKey(
      'discovery',
      locale,
      JSON.stringify({ ...filters, matureEnabled, pageSize: discoveryPageSize }),
    );
    const cached = readPageDataSnapshot<DiscoverySnapshot>(discoveryCacheKey);
    if (cached) {
      setDiscoveryCharacters(cached.items);
      setDiscoveryPage(cached.page);
      setDiscoveryTotal(cached.total);
      void refreshDiscoveryPersonalization(cached.items, controller.signal);
    } else {
      setDiscoveryPage(0);
      setDiscoveryTotal(0);
    }
    const isSortChange = discoverySortRef.current !== null
      && discoverySortRef.current !== filterState.sortBy;
    discoverySortRef.current = filterState.sortBy;
    const delay = initialDiscoveryLoadRef.current || isSortChange ? 0 : 300;
    initialDiscoveryLoadRef.current = false;
    const timer = window.setTimeout(async () => {
      setDiscoveryLoadingMore(false);
      setDiscoveryError(null);
      setDiscoveryLoadMoreError(null);
      try {
        const result = await api.characters.discovery(filters, 1, discoveryPageSize, controller.signal);
        if (controller.signal.aborted || discoveryRequestRef.current !== requestId) return;
        setDiscoveryCharacters(result.items);
        setDiscoveryPage(1);
        setDiscoveryTotal(result.total);
        writePageDataSnapshot(discoveryCacheKey, { items: result.items, page: 1, total: result.total }, ['characters']);
        setDiscoveryLoading(false);
        void refreshDiscoveryPersonalization(result.items, controller.signal);
      } catch (reason) {
        if (!controller.signal.aborted && discoveryRequestRef.current === requestId) {
          const message = userErrorMessage(reason, t, 'errors.charactersService');
          setDiscoveryError(message);
        }
      } finally {
        if (!controller.signal.aborted && discoveryRequestRef.current === requestId) {
          discoveryRefreshingRef.current = false;
          setDiscoveryLoading(false);
        }
      }
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      discoveryPageAbortRef.current?.abort();
    };
  }, [filterState.searchQuery, filterState.gender, filterState.artStyle, filterState.ageGroup, filterState.categoryTag, filterState.sortBy, discoveryPageSize, discoveryReloadKey, matureEnabled, locale, t]);

  useEffect(() => {
    if (!currentUser) {
      chatThreadsRef.current = [];
      setChatThreads([]);
      setChatThreadsError(null);
      setChatThreadsLoading(false);
      setChatThreadsReady(false);
      setChatThreadsReadyUserId(null);
      return;
    }
    if (!chatBootRequested && activeTab !== 'chat' && activeTab !== 'profile') return;
    const userId = currentUser.id;
    let active = true;
    chatThreadsRef.current = [];
    setChatThreads([]);
    setChatThreadsError(null);
    setChatThreadsLoading(true);
    setChatThreadsReady(false);
    setChatThreadsReadyUserId(null);
    const loadServerThreads = async () => {
      const loaded: ApiChatThread[] = [];
      let cursor: string | undefined;
      do {
        const page = await api.chat.threads.list(cursor, 100);
        loaded.push(...page.items);
        cursor = page.nextCursor || undefined;
        if (!page.hasMore) break;
      } while (cursor);
      return loaded;
    };
    const serverThreads = loadServerThreads();
    void readCachedThreads(userId)
      .then((cached) => {
        if (active && cached) {
          chatThreadsRef.current = cached;
          setChatThreads(cached);
          setChatThreadsError(null);
          setChatThreadsLoading(false);
          setChatThreadsReady(true);
          setChatThreadsReadyUserId(userId);
        }
      })
      .catch(() => {
        // IndexedDB failure must not block the server refresh.
      });
    void serverThreads
      .then((loaded) => {
        if (!active) return;
        const inFlightThreads = chatThreadsRef.current;
        const merged = [
          ...inFlightThreads,
          ...loaded.filter((thread) => !inFlightThreads.some((item) => item.id === thread.id)),
        ];
        chatThreadsRef.current = merged;
        setChatThreads(merged);
        setChatThreadsError(null);
        void writeCachedThreads(userId, merged);
      })
      .catch((reason) => {
        if (!active) return;
        setChatThreadsError(userErrorMessage(reason, t, 'errors.chatLoad'));
      })
      .finally(() => {
        if (!active) return;
        setChatThreadsLoading(false);
        setChatThreadsReady(true);
        setChatThreadsReadyUserId(userId);
      });
    return () => { active = false; };
  // This is the single initial loader. Locale changes reuse its cache.
  }, [activeTab, chatBootRequested, currentUser?.id]);

  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) {
      chatPrefetchKeyRef.current = null;
      return;
    }
    if (!chatThreadsReady || chatThreadsReadyUserId !== userId) return;
    const prefetchThreads = chatThreads.slice(0, 3);
    const recentThread = prefetchThreads[0];
    if (!recentThread) return;
    const prefetchKey = `${userId}:${prefetchThreads.map((thread) => thread.id).join(',')}`;
    if (chatPrefetchKeyRef.current === prefetchKey) return;

    chatPrefetchKeyRef.current = prefetchKey;
    const preload = () => {
      for (const thread of prefetchThreads) {
        const prefetch = getChatPrefetch(userId, thread);
        void Promise.allSettled([prefetch.messages, prefetch.character, prefetch.background]);
      }
    };
    preload();
  }, [currentUser?.id, chatThreadsReady, chatThreadsReadyUserId, chatThreads]);

  // Handle selecting character to chat
  const handleSelectCharacterToChat = (char: Character) => {
    setSelectedDetailCharacter(null);
    if (!currentUser) {
      setPendingChatCharacterId(char.id);
      openAuth('login');
      return;
    }
    setSelectedDetailCharacter(null);
    setBusinessView(null);
    setSelectedCharacter(char);
    navigateToTab('chat');
  };

  const handleDeleteChatHistory = (characterId: string) => {
    if (selectedCharacter && selectedCharacter.id === characterId) {
      setSelectedCharacter(null);
    }
  };

  const handleChatThreadListChange = (threads: ApiChatThread[]) => {
    chatThreadsRef.current = threads;
    setChatThreads(threads);
    setChatThreadsError(null);
    if (currentUser?.id) void writeCachedThreads(currentUser.id, threads);
  };

  const updateApiFavorite = (characterId: string, result: FavoriteResult) => {
    const update = (character: Character) => character.id === characterId
      ? { ...character, isFavorite: result.favorited, likes: result.favoriteCount }
      : character;
    setDiscoveryCharacters((prev) => prev.map(update));
    setSelectedCharacter((prev) => prev && prev.id === characterId && prev.source === 'api' ? update(prev) : prev);
    setSelectedDetailCharacter((prev) => prev ? update(prev) : null);
    setCreatorProfile((prev) => prev ? { ...prev, characters: prev.characters?.map(update) } : null);
    setFavoriteCharacters((prev) => result.favorited
      ? prev.map(update)
      : prev.filter((character) => character.id !== characterId));
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (result.favorited) next.add(characterId);
      else next.delete(characterId);
      return next;
    });
  };

  const handleCommentCountChange = useCallback((characterId: string, count: number) => {
    const update = (character: Character) => character.id === characterId ? { ...character, commentCount: count } : character;
    setCommentCountOverrides((prev) => prev[characterId] === count ? prev : { ...prev, [characterId]: count });
    setCharacters((prev) => prev.map(update));
    setDiscoveryCharacters((prev) => prev.map(update));
    setFavoriteCharacters((prev) => prev.map(update));
    setSelectedCharacter((prev) => prev ? update(prev) : null);
    setSelectedDetailCharacter((prev) => prev ? update(prev) : null);
    setCreatorProfile((prev) => prev ? { ...prev, characters: prev.characters?.map(update) } : null);
  }, []);

  const performApiFavorite = async (characterId: string, shouldFavorite: boolean) => {
    if (favoriteBusyRef.current.has(characterId)) return;
    favoriteBusyRef.current.add(characterId);
    try {
      const result = shouldFavorite
        ? await api.characters.favorite(characterId)
        : await api.characters.unfavorite(characterId);
      updateApiFavorite(characterId, result);
      void refreshFavoriteCharacters();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setCurrentUser(null);
        setPendingFavoriteId(characterId);
        openAuth('login');
      } else {
        setGlobalError(userErrorMessage(reason, t, 'errors.favoriteFailed'));
      }
    } finally {
      favoriteBusyRef.current.delete(characterId);
    }
  };

  // Favorite toggle handler
  const handleToggleFavorite = (characterId: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const apiCharacter = discoveryCharacters.find((character) => character.id === characterId)
      || favoriteCharacters.find((character) => character.id === characterId)
      || threadCharacters.find((character) => character.id === characterId)
      || creatorProfile?.characters?.find((character) => character.id === characterId)
      || (selectedDetailCharacter?.id === characterId && selectedDetailCharacter.source === 'api' ? selectedDetailCharacter : undefined);
    if (apiCharacter) {
      if (!currentUser) {
        setPendingFavoriteId(characterId);
        openAuth('login');
        return;
      }
      void performApiFavorite(characterId, !apiCharacter.isFavorite);
      return;
    }
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
    if (selectedCharacter && selectedCharacter.id === characterId) {
      setSelectedCharacter((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
    if (selectedDetailCharacter && selectedDetailCharacter.id === characterId) {
      setSelectedDetailCharacter((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
  };

  const handleAuthenticated = async (user: ApiUser) => {
    setAuthReady(true);
    setCurrentUser(user);
    if (pendingCreate) {
      setPendingCreate(false);
      const needsFreshNickname = nicknameConsumedRef.current;
      if (needsFreshNickname) setCreateSessionKey((value) => value + 1);
      void loadWizardNickname(locale, needsFreshNickname);
      setCreateRouteVisited(true);
      navigateToTab('create');
    }
    try {
      if (pendingChatCharacterId) {
        const pendingId = pendingChatCharacterId;
        setPendingChatCharacterId(null);
        const pendingCharacter = discoveryCharacters.find((character) => character.id === pendingId)
          || threadCharacters.find((character) => character.id === pendingId)
          || favoriteCharacters.find((character) => character.id === pendingId)
          || characters.find((character) => character.id === pendingId);
        if (pendingCharacter) {
          setSelectedCharacter(pendingCharacter);
          navigateToTab('chat');
        }
      }
      if (pendingFavoriteId) {
        const id = pendingFavoriteId;
        setPendingFavoriteId(null);
        await performApiFavorite(id, true);
      }
      setDiscoveryReloadKey((value) => value + 1);
    } catch (reason) {
      setGlobalError(userErrorMessage(reason, t, 'common.unknownError'));
    }
  };

  const handleOpenProfile = () => {
    setBusinessView(null);
    const userId = currentUser?.id;
    if (!userId) {
      openAuth('login');
      return;
    }
    setIsMobileNavigationOpen(false);
    setIsUpgradeModalOpen(false);
    navigateToTab('profile');
  };

  const openCreateSurface = () => {
    setBusinessView(null);
    setIsMobileNavigationOpen(false);
    if (!authReady) {
      setPendingCreate(true);
      return;
    }
    if (!currentUser) {
      setPendingCreate(true);
      openAuth('login');
      return;
    }
    const needsFreshNickname = nicknameConsumedRef.current;
    if (needsFreshNickname) setCreateSessionKey((value) => value + 1);
    if (needsFreshNickname || !wizardNickname || wizardNickname.locale !== locale) {
      void loadWizardNickname(locale, needsFreshNickname || Boolean(wizardNickname && wizardNickname.locale !== locale));
    }
    setCreateRouteVisited(true);
    navigateToTab('create');
  };

  useEffect(() => {
    if (!authReady || !pendingCreate) return;
    if (!currentUser) {
      openAuth('login');
      return;
    }
    setPendingCreate(false);
    const needsFreshNickname = nicknameConsumedRef.current;
    if (needsFreshNickname) setCreateSessionKey((value) => value + 1);
    if (needsFreshNickname || !wizardNickname || wizardNickname.locale !== locale) {
      void loadWizardNickname(locale, needsFreshNickname || Boolean(wizardNickname && wizardNickname.locale !== locale));
    }
    setCreateRouteVisited(true);
    navigateToTab('create');
  }, [authReady, pendingCreate, currentUser, locale, wizardNickname]);

  const openGenerateSurface = () => {
    if(!currentUser){openAuth('login');return}if(DESIGN_PREVIEW){setBusinessView('image-create');setIsMobileNavigationOpen(false);return;}
    setBusinessView(null);
    if (!GENERATION_ENABLED) return;
    setIsMobileNavigationOpen(false);
    if (isMobileViewport) {
      setIsMobileGenerateSecondaryView(false);
      setMobileGenerateVisited(true);
      navigateToTab('generate');
      return;
    }
    navigateToTab('generate');
  };

  const dismissUpgradeForNavigation = () => {
    if (!isUpgradeModalOpen) return;
    setIsUpgradeModalOpen(false);
    setUpgradeNotice('');
    setUpgradeInitialSelection(null);
    clearUpgradeReturnState();
  };

  const handleNavigate = (tab: NavTab) => {
    setBusinessView(null);
    dismissUpgradeForNavigation();
    if (tab === 'chat' && !currentUser) {
      openAuth('login');
      return;
    }
    if (tab === 'chat') setChatBootRequested(true);
    if (tab === 'create') {
      if(isMobileViewport){setIsMobileNavigationOpen(false);setMobileCreateChooser(true);return}
      openCreateSurface();
      return;
    }
    if (tab === 'generate') {
      if (!GENERATION_ENABLED) return;
      openGenerateSurface();
      return;
    }
    if (tab === 'chat' && isMobileViewport) setSelectedCharacter(null);
    navigateToTab(tab);
    setIsMobileNavigationOpen(false);
  };

  const handleOpenHome = () => {
    setIsUpgradeModalOpen(false);
    setIsQuickUpgradeModalOpen(false);
    setQuickUpgradeNotice('');
    clearUpgradeReturnState();
    handleNavigate('explore');
  };

  const handleLogout = async () => {
    await api.auth.logout();
    favoritesRequestRef.current += 1;
    setCurrentUser(null);
    setDiscoveryCharacters([]);
    setDiscoveryLoading(true);
    setWizardNickname(null);
    setWizardNicknameLoading(false);
    setWizardNicknameError(null);
    nicknameConsumedRef.current = false;
    nicknameRequestRef.current += 1;
    nicknameConsumePromiseRef.current = null;
    nicknameLoadPromiseRef.current = null;
    setPendingCreate(false);

    setCreateRouteVisited(false);
    setChatRouteVisited(false);
    setCharacters((previous) => previous.filter((character) => character.source !== 'created'));
    setFavoriteCharacters([]);
    setFavoriteIds(new Set());
    setFavoritesLoading(false);
    setChatThreads([]);
    setChatThreadsReady(false);
    setChatThreadsReadyUserId(null);
    setSelectedCharacter(null);
    navigateToTab('explore');
    setIsProfileModalOpen(false);
    clearUpgradeReturnState();
    setDiscoveryReloadKey((value) => value + 1);
  };

  const handleLocaleChange = async (next: Locale) => {
    const updated = await api.users.me.updateLocale(next);
    setCurrentUser((user) => user?.id === updated.id ? { ...user, locale: updated.locale } : updated);
    if (wizardNickname && !nicknameConsumedRef.current && wizardNickname.locale !== updated.locale) {
      void loadWizardNickname(updated.locale, true);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const previousAvatar = currentUser.avatar;
    const previewUrl = URL.createObjectURL(file);
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
    avatarPreviewUrlRef.current = previewUrl;
    const previewAvatar: ApiMedia = {
      id: `local-avatar-${Date.now()}`,
      url: previewUrl,
      mediaType: 'image',
      mimeType: file.type || 'image/webp',
      width: null,
      height: null,
      durationSeconds: null,
      sizeBytes: file.size,
      moderationStatus: 'pending',
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser((user) => user?.id === userId ? { ...user, avatar: previewAvatar } : user);
    try {
      const updated = await api.users.me.updateAvatar(file);
      setCurrentUser((user) => user?.id === userId ? { ...user, avatar: updated.avatar } : user);
    } catch (error) {
      setCurrentUser((user) => user?.id === userId ? { ...user, avatar: previousAvatar } : user);
      throw error;
    } finally {
      if (avatarPreviewUrlRef.current === previewUrl) avatarPreviewUrlRef.current = null;
      window.setTimeout(() => URL.revokeObjectURL(previewUrl), 0);
    }
  };

  const handleOpenCharacterDetail = (character: Character) => {
    updateBrowserPath(getPathForCharacter(character.id));
    setSelectedDetailCharacter(character);
    setDetailError(null);
    if (character.source === 'created') {
      const requestId = ++detailRequestRef.current;
      setDetailLoading(true);
      void api.createdCharacters.get(character.id)
        .then((detail) => {
          if (detailRequestRef.current === requestId) setSelectedDetailCharacter(detail);
        })
        .catch((reason) => {
          if (detailRequestRef.current === requestId) {
            setDetailError(reason instanceof ApiError && reason.status === 404
              ? t('errors.characterUnavailable')
              : userErrorMessage(reason, t, 'errors.characterDetails'));
          }
        })
        .finally(() => {
          if (detailRequestRef.current === requestId) setDetailLoading(false);
        });
      return;
    }
    if (character.source !== 'api') return;
    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    void api.characters.get(character.id)
      .then((detail) => {
        if (detailRequestRef.current === requestId) setSelectedDetailCharacter(detail);
      })
      .catch((reason) => {
        if (detailRequestRef.current === requestId) {
          setDetailError(reason instanceof ApiError && reason.status === 404
            ? t('errors.characterUnavailable')
            : userErrorMessage(reason, t, 'errors.characterDetails'));
        }
      })
      .finally(() => {
          if (detailRequestRef.current === requestId) setDetailLoading(false);
        });
  };

  const handleOpenCharacterDetailById = async (characterId: string) => {
    updateBrowserPath(getPathForCharacter(characterId));
    const known = discoveryCharacters.find((character) => character.id === characterId)
      || characters.find((character) => character.id === characterId)
      || creatorProfile?.characters?.find((character) => character.id === characterId);
    if (known) {
      handleOpenCharacterDetail(known);
      return;
    }
    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await api.characters.get(characterId);
      if (detailRequestRef.current === requestId) setSelectedDetailCharacter(detail);
    } catch (reason) {
      if (detailRequestRef.current === requestId) {
        setGlobalError(userErrorMessage(reason, t, 'errors.characterDetails'));
      }
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  };

  useEffect(() => {
    const syncRouteState = () => {
      const route = getRouteFromPath(window.location.pathname);
      if (route.kind === 'character') {
        setActiveTab('explore');
        void handleOpenCharacterDetailById(route.characterId);
        return;
      }
      detailRequestRef.current += 1;
      setSelectedDetailCharacter(null);
      setDetailError(null);
      setActiveTab(route.tab);
      if (route.tab === 'create') setCreateRouteVisited(true);
      if (route.tab === 'generate') setMobileGenerateVisited(true);
      if (route.tab === 'chat') setChatBootRequested(true);
    };

    const initialRoute = getRouteFromPath(window.location.pathname);
    if (!initialRouteHandledRef.current) {
      initialRouteHandledRef.current = true;
      if (initialRoute.kind === 'character') void handleOpenCharacterDetailById(initialRoute.characterId);
    }
    window.addEventListener('popstate', syncRouteState);
    return () => window.removeEventListener('popstate', syncRouteState);
  }, []);

  useEffect(() => {
    if (!authReady || initialPrivateRouteHandledRef.current) return;
    initialPrivateRouteHandledRef.current = true;
    const route = getRouteFromPath(window.location.pathname);
    if (route.kind !== 'tab') return;
    if (route.tab === 'create') {
      if (currentUser) setCreateRouteVisited(true);
      else {
        setPendingCreate(true);
        openAuth('login');
      }
    } else if (route.tab === 'chat') {
      if (!currentUser) openAuth('login');
      else setChatBootRequested(true);
    } else if (route.tab === 'generate') {
      setMobileGenerateVisited(true);
    }
  }, [authReady, currentUser]);

  useEffect(() => {
    const route: AppRoute = getRouteFromPath(window.location.pathname);
    const character = route.kind === 'character' && selectedDetailCharacter?.id === route.characterId
      ? selectedDetailCharacter
      : null;
    let pageTitle: string;
    let description: string;
    if (route.kind === 'character') {
      pageTitle = character?.name || t('detail.profile');
      description = character?.displayDescription || character?.description || character?.subtitle || t('discover.subtitle');
    } else {
      switch (route.tab) {
        case 'feed':
          pageTitle = t('nav.feed');
          description = `${t('nav.feed')} · ${t('feed.generatedVideo')}`;
          break;
        case 'community':
          pageTitle = t('community.heading');
          description = t('community.description');
          break;
        case 'help':
          pageTitle = t('help.heroTitle');
          description = t('help.heroDescription');
          break;
        case 'safety':
          pageTitle = t('safety.title');
          description = t('safety.description');
          break;
        case 'chat':
          pageTitle = t('nav.chat');
          description = t('chat.session');
          break;
        case 'create':
          pageTitle = t('nav.create');
          description = t('create.descriptionPlaceholder');
          break;
        case 'generate':
          pageTitle = t('nav.generate');
          description = t('generator.createdCharacters');
          break;
        case 'my-ai':
          pageTitle = t('my.title');
          description = t('my.description');
          break;
        case 'referral':
          pageTitle = t('referral.title');
          description = t('referral.linkTitle');
          break;
        case 'explore':
        default:
          pageTitle = t('discover.title');
          description = t('discover.subtitle');
          break;
      }
    }
    applySeoMetadata(createSeoMetadata({
      route,
      title: `${pageTitle} | mio`,
      description,
      character,
    }));
  }, [activeTab, locale, selectedDetailCharacter, t]);

  const handleSelectCharacterToChatById = async (characterId: string) => {
    setBusinessView(null);
    const known = discoveryCharacters.find((character) => character.id === characterId)
      || characters.find((character) => character.id === characterId);
    if (known) {
      handleSelectCharacterToChat(known);
      return;
    }
    try {
      handleSelectCharacterToChat(await api.characters.get(characterId));
    } catch (reason) {
      setGlobalError(userErrorMessage(reason, t, 'errors.characterUnavailable'));
    }
  };

  const handleToggleFollowAuthor = async (authorName: string, creatorId?: string) => {
    if (!currentUser) {
      openAuth('login');
      return;
    }
    const resolvedId = creatorId
      || (creatorProfile?.handle === authorName ? creatorProfile.id : undefined)
      || followingCreators.find((creator) => creator.handle === authorName)?.id
      || discoveryCharacters.find((character) => character.author === authorName)?.creatorId;
    if (!resolvedId || followBusyRef.current.has(resolvedId)) {
      if (!resolvedId) setGlobalError(t('errors.followUnavailable'));
      return;
    }
    followBusyRef.current.add(resolvedId);
    const currentlyFollowing = followingCreators.some((creator) => creator.id === resolvedId)
      || (creatorProfile?.id === resolvedId && creatorProfile.followedByMe);
    try {
      const result = currentlyFollowing
        ? await api.creators.unfollow(resolvedId)
        : await api.creators.follow(resolvedId);
      const refreshed = await loadAllFollowingCreators();
      setFollowingCreators(refreshed);
      setCreatorProfile((profile) => profile?.id === resolvedId ? {
        ...profile,
        followedByMe: result.following,
        followerCount: result.followerCount,
      } : profile);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setCurrentUser(null);
        openAuth('login');
      } else {
        setGlobalError(userErrorMessage(reason, t, 'errors.followFailed'));
      }
    } finally {
      followBusyRef.current.delete(resolvedId);
    }
  };

  const handleToggleCreatorDynamicLike = async (post: ApiFeedPost) => {
    if (!currentUser) {
      openAuth('login');
      return;
    }
    if (creatorDynamicLikeBusyRef.current.has(post.id)) return;
    creatorDynamicLikeBusyRef.current.add(post.id);
    try {
      const result = post.likedByMe ? await api.feed.unlike(post.id) : await api.feed.like(post.id);
      const delta = result.likeCount - post.likeCount;
      setCreatorDynamics((previous) => previous.map((item) => item.id === post.id
        ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
        : item));
      setCreatorProfile((profile) => profile ? { ...profile, likeCount: Math.max(0, profile.likeCount + delta) } : profile);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setCurrentUser(null);
        openAuth('login');
      } else {
        setGlobalError(userErrorMessage(reason, t, 'community.likeFailed'));
      }
    } finally {
      creatorDynamicLikeBusyRef.current.delete(post.id);
    }
  };

  const loadCreatorCharacters = (creatorId: string, page: number, append = false, requestId = creatorRequestRef.current) => {
    setCreatorCharactersLoading(true);
    setCreatorCharactersError(null);
    void api.creators.characters(creatorId, page).then((result) => {
      if (creatorRequestRef.current !== requestId) return;
      setCreatorCharacters((previous) => append
        ? [...previous, ...result.items.filter((item) => !previous.some((character) => character.id === item.id))]
        : result.items);
      setCreatorCharactersTotal(result.total);
      setCreatorCharactersPage(result.page);
    }).catch((reason) => {
      if (creatorRequestRef.current === requestId) {
        setCreatorCharactersError(userErrorMessage(reason, t, 'errors.profileLoad'));
      }
    }).finally(() => {
      if (creatorRequestRef.current === requestId) setCreatorCharactersLoading(false);
    });
  };

  const loadCreatorDynamics = (creatorId: string, page: number, append = false, requestId = creatorRequestRef.current) => {
    setCreatorDynamicsLoading(true);
    setCreatorDynamicsError(null);
    void api.creators.dynamics(creatorId, page).then((result) => {
      if (creatorRequestRef.current !== requestId) return;
      setCreatorDynamics((previous) => append
        ? [...previous, ...result.items.filter((item) => !previous.some((post) => post.id === item.id))]
        : result.items);
      setCreatorDynamicsTotal(result.total);
      setCreatorDynamicsPage(result.page);
    }).catch((reason) => {
      if (creatorRequestRef.current === requestId) {
        setCreatorDynamicsError(userErrorMessage(reason, t, 'errors.profileLoad'));
      }
    }).finally(() => {
      if (creatorRequestRef.current === requestId) setCreatorDynamicsLoading(false);
    });
  };

  const handleOpenCreatorProfile = (authorName: string, creatorId?: string) => {
    if (!creatorId || currentUser?.id === creatorId) return;
    const requestId = ++creatorRequestRef.current;
    setViewingCreatorAuthor(authorName);
    setViewingCreatorId(creatorId);
    setCreatorProfile(null);
    setCreatorProfileError(null);
    setCreatorCharacters([]);
    setCreatorCharactersTotal(0);
    setCreatorCharactersPage(0);
    setCreatorCharactersError(null);
    setCreatorDynamics([]);
    setCreatorDynamicsTotal(0);
    setCreatorDynamicsPage(0);
    setCreatorDynamicsError(null);
    setCreatorProfileLoading(true);
    void api.creators.get(creatorId)
      .then((profile) => { if (creatorRequestRef.current === requestId) setCreatorProfile(profile); })
      .catch((reason) => {
        if (creatorRequestRef.current === requestId) {
          setCreatorProfileError(userErrorMessage(reason, t, 'errors.profileLoad'));
        }
      })
      .finally(() => { if (creatorRequestRef.current === requestId) setCreatorProfileLoading(false); });
    loadCreatorCharacters(creatorId, 1, false, requestId);
    loadCreatorDynamics(creatorId, 1, false, requestId);
  };

  const clearUpgradeReturnState = () => {
    upgradeReturnSnapshotRef.current = null;
    upgradeReturnDetailRef.current = null;
    clearUpgradeReturnSnapshot();
  };

  const closeQuickUpgradeModal = () => {
    setIsQuickUpgradeModalOpen(false);
    setQuickUpgradeNotice('');
    setQuickUpgradeFeature('');
    clearUpgradeReturnState();
  };

  const closeUpgradePage = () => {
    const snapshot = upgradeReturnSnapshotRef.current || readUpgradeReturnSnapshot();
    const detailCharacter = upgradeReturnDetailRef.current;
    setIsUpgradeModalOpen(false);
    setUpgradeNotice('');
    setUpgradeInitialSelection(null);
    if (snapshot) {
      navigateToTab(snapshot.activeTab, true);
      setCreateRouteVisited(snapshot.createRouteVisited);
      setMobileGenerateVisited(snapshot.mobileGenerateVisited);
      setIsMobileGenerateSecondaryView(snapshot.isMobileGenerateSecondaryView);
      setIsProfileModalOpen(snapshot.isProfileModalOpen);
      setIsNotificationModalOpen(snapshot.isNotificationModalOpen);
      setIsMobileNavigationOpen(snapshot.isMobileNavigationOpen);

      if (snapshot.selectedCharacterId) {
        const knownCharacter = chatPageCharacters.find((character) => character.id === snapshot.selectedCharacterId)
          || characters.find((character) => character.id === snapshot.selectedCharacterId);
        if (knownCharacter) setSelectedCharacter(knownCharacter);
        else if (snapshot.activeTab === 'chat' && currentUser) void handleSelectCharacterToChatById(snapshot.selectedCharacterId);
      } else {
        setSelectedCharacter(null);
      }

      if (snapshot.selectedDetailCharacterId) {
        const knownDetail = detailCharacter?.id === snapshot.selectedDetailCharacterId
          ? detailCharacter
          : chatPageCharacters.find((character) => character.id === snapshot.selectedDetailCharacterId)
            || characters.find((character) => character.id === snapshot.selectedDetailCharacterId);
        if (knownDetail) {
          setSelectedDetailCharacter(knownDetail);
          setDetailError(null);
        }
        else void handleOpenCharacterDetailById(snapshot.selectedDetailCharacterId);
      }

      if (snapshot.viewingCreatorId && snapshot.viewingCreatorAuthor) {
        if (creatorProfile?.id === snapshot.viewingCreatorId) {
          setViewingCreatorId(snapshot.viewingCreatorId);
          setViewingCreatorAuthor(snapshot.viewingCreatorAuthor);
        } else {
          handleOpenCreatorProfile(snapshot.viewingCreatorAuthor, snapshot.viewingCreatorId);
        }
      }
    }
    clearUpgradeReturnState();
  };

  // Create character handler
  const handleCreateCharacter = (newChar: Character) => {
    setCharacters((prev) => [newChar, ...prev.filter((character) => character.id !== newChar.id)]);
  };

  const handleGeneratedCharacterCreated = (newChar: Character) => {
    setCharacters((prev) => [newChar, ...prev.filter((character) => character.id !== newChar.id)]);
  };

  const handleDeleteCreatedCharacter = async (characterId: string) => {
    const character = characters.find((item) => item.id === characterId);
    try {
      if (character?.source === 'created') await api.createdCharacters.delete(characterId);
      setCharacters((previous) => previous.filter((item) => item.id !== characterId));
      if (selectedCharacter?.id === characterId) setSelectedCharacter(null);
      } catch (reason) {
        setGlobalError(userErrorMessage(reason, t, 'common.unknownError'));
    }
  };

  // Filtered & Sorted Character List for pages not connected in this phase.
  const filteredCharacters = useMemo(() => {
    return characters
      .filter((char) => {
        // Tab filter: 'my-ai' only shows favorites or created
        if (activeTab === 'my-ai' && !char.isFavorite && char.author !== '@you') {
          return false;
        }

        // Search query
        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.toLowerCase();
          const matchName = char.name.toLowerCase().includes(q);
          const matchSub = char.subtitle.toLowerCase().includes(q);
          const matchDesc = char.description.toLowerCase().includes(q);
          const matchTag = char.tags.some((t) => t.toLowerCase().includes(q));
          const matchAuthor = char.author.toLowerCase().includes(q);
          if (!matchName && !matchSub && !matchDesc && !matchTag && !matchAuthor) {
            return false;
          }
        }

        // Category Tag
        if (filterState.categoryTag === 'following') {
          if (!followedAuthors.includes(char.author) && char.author !== '@you') {
            return false;
          }
        } else if (filterState.categoryTag !== 'all') {
          const matchCategory = char.category === filterState.categoryTag;
          const matchTag = char.tags.includes(filterState.categoryTag);
          if (!matchCategory && !matchTag) return false;
        }

        // Gender
        if (filterState.gender !== 'all' && char.gender !== filterState.gender) {
          return false;
        }

        // Art Style
        if (filterState.artStyle !== 'all' && char.artStyle !== filterState.artStyle) {
          return false;
        }

        // Age Range
        if (filterState.ageGroup !== 'all') {
          if (char.age == null) return false;
          if (filterState.ageGroup === 'teen' && (char.age < 18 || char.age > 20)) return false;
          if (filterState.ageGroup === 'young' && (char.age < 21 || char.age > 25)) return false;
          if (filterState.ageGroup === 'adult' && (char.age < 26 || char.age > 29)) return false;
          if (filterState.ageGroup === 'mature' && char.age < 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filterState.sortBy === 'trending' || filterState.sortBy === 'hot_month') {
          return (b.likes + b.chatCount) - (a.likes + a.chatCount);
        }
        if (filterState.sortBy === 'hot_week') {
          return b.chatCount - a.chatCount;
        }
        if (filterState.sortBy === 'popular' || filterState.sortBy === 'top_rated') {
          return b.likes - a.likes;
        }
        if (filterState.sortBy === 'newest') {
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        }
        return 0;
      });
  }, [characters, filterState, activeTab]);

  const favoriteCount = currentUser ? favoriteIds.size : 0;
  const loadMoreDiscovery = async () => {
    if (discoveryRefreshingRef.current || discoveryLoadingMoreRef.current || discoveryCharacters.length >= discoveryTotal || discoveryPage < 1) return;
    const requestId = discoveryRequestRef.current;
    const nextPage = discoveryPage + 1;
    const discoveryCacheKey = pageDataCacheKey(
      'discovery',
      locale,
      JSON.stringify({ ...getDiscoveryFilters(), matureEnabled, pageSize: discoveryPageSize }),
    );
    const controller = new AbortController();
    discoveryPageAbortRef.current?.abort();
    discoveryPageAbortRef.current = controller;
    discoveryLoadingMoreRef.current = true;
    setDiscoveryLoadingMore(true);
    setDiscoveryLoadMoreError(null);
    try {
      const result = await api.characters.discovery(getDiscoveryFilters(), nextPage, discoveryPageSize, controller.signal);
      if (controller.signal.aborted || discoveryRequestRef.current !== requestId) return;
      setDiscoveryCharacters((previous) => {
        const existing = new Set(previous.map((character) => character.id));
        const merged = [...previous, ...result.items.filter((character) => !existing.has(character.id))];
        writePageDataSnapshot(discoveryCacheKey, { items: merged, page: nextPage, total: result.total }, ['characters']);
        return merged;
      });
      setDiscoveryPage(nextPage);
      setDiscoveryTotal(result.total);
      void refreshDiscoveryPersonalization(result.items, controller.signal);
    } catch (reason) {
      if (!controller.signal.aborted && discoveryRequestRef.current === requestId) {
        setDiscoveryLoadMoreError(userErrorMessage(reason, t, 'errors.charactersService'));
      }
    } finally {
      if (discoveryPageAbortRef.current === controller) discoveryPageAbortRef.current = null;
      if (discoveryRequestRef.current === requestId) {
        discoveryLoadingMoreRef.current = false;
        setDiscoveryLoadingMore(false);
      }
    }
  };
  const resetFilters = () => {
    setFilterState((previous) => ({
      ...previous,
      gender: 'all',
      artStyle: 'all',
      ageGroup: 'all',
      categoryTag: 'all',
      sortBy: 'newest',
    }));
  };
  const isMobilePageTab = isMobileViewport && ROUTE_NAVIGATION_ITEMS[activeTab].mobilePresentation === 'page';
  const isCreateRoute = createRouteVisited && activeTab === 'create';
  const isDesktopCreateWorkspace = isCreateRoute && !isMobileViewport;
  const isDesktopGenerateWorkspace = activeTab === 'generate' && !isMobileViewport;
  const isDesktopChatWorkspace = activeTab === 'chat' && !isMobileViewport;
  const isWorkspaceRoute = activeTab === 'generate' || activeTab === 'chat';
  const isMobileCreatePage = isMobileViewport && activeTab === 'create';
  const isUpgradePage = isUpgradeModalOpen;
  const isChatRouteActive = activeTab === 'chat' && !isUpgradePage;
  const isMobileChatConversation = isMobileViewport && activeTab === 'chat' && selectedCharacter !== null;
  const hideMobileNavigation = isMobileViewport && (
    isMobileCreatePage
    || isMobileChatConversation
    || (activeTab === 'generate' && isMobileGenerateSecondaryView)
    || isUpgradePage
    || isQuickUpgradeModalOpen
  );

  const mobileImmersive=isMobileViewport&&(isUpgradePage||isMobileChatConversation||isMobileCreatePage||['image-create','video-create','comic-create','events','ranking','coins'].includes(businessView||''));
  return (
    <div className={`app-shell ${mobileImmersive?'r15-immersive':''} ${isWorkspaceRoute ? 'workspace-route-shell' : ''} flex min-h-dvh bg-[#15151b] font-sans text-white antialiased selection:bg-pink-500 selection:text-white`}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        workspace={businessView} onOpenWorkspace={openBusinessView}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        threads={chatThreads.filter((thread) => matureEnabled || !isMaturePreviewCharacter(thread.character.id))}
        onOpenRecentCharacter={(id) => void handleSelectCharacterToChatById(id)}
        onOpenCoins={openRechargeEntry}
        activeTab={activeTab}
        upgradeActive={isUpgradePage}
        setActiveTab={handleNavigate}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onOpenHome={handleOpenHome}
        onOpenCreateModal={() => {
          dismissUpgradeForNavigation();
          openCreateSurface();
        }}
        onOpenUpgradeModal={openUpgradeEntry}
        onOpenGenerateModal={() => {
          dismissUpgradeForNavigation();
          openGenerateSurface();
        }}
        onOpenLogin={() => openAuth('login')}
        onOpenRegister={() => openAuth('register')}
        onOpenProfileModal={handleOpenProfile}
        favoriteCount={favoriteCount}
        user={currentUser}
        membershipTier={membershipTier}
      />

      {!mobileImmersive&&<RulumiChrome onOpenSearch={()=>setSearchOpen(true)} hideSearch={businessView==='ranking'} home={activeTab==='explore'&&!businessView&&!isUpgradeModalOpen} collapsed={sidebarCollapsed} user={currentUser} balance={paymentAccount?.wallet.balance} member={membershipTier} query={filterState.searchQuery} onSearch={query=>{setFilterState(p=>({...p,searchQuery:query}));handleNavigate('explore')}} onMenu={()=>setIsMobileNavigationOpen(true)} onCoins={openRechargeEntry} onSubscription={openUpgradeEntry} onEarnings={()=>openBusinessView('earnings')} onNotification={()=>setIsNotificationModalOpen(true)} onProfile={handleOpenProfile} onCreations={()=>{setCreationsRequest(n=>n+1);handleOpenProfile()}} onSettings={()=>setIsProfileModalOpen(true)} onHistory={()=>handleNavigate('chat')} onSaved={()=>handleNavigate('my-ai')} onHelp={()=>handleNavigate('help')} onLogout={()=>void handleLogout()} onLogin={()=>openAuth('login')} unread={unreadNotificationsCount}/>}
      {/* Main Content View Container */}
      <main
        className={`app-main min-w-0 flex-1 overflow-x-clip transition-none lg:transition-[margin-left] lg:duration-300 ${
          isUpgradePage
            ? 'upgrade-workspace-main !px-0 !py-0'
            : isMobileCreatePage
            ? 'mobile-create-route-main px-0'
            : isDesktopCreateWorkspace
              ? 'create-workspace-main'
              : isDesktopGenerateWorkspace
                ? 'generate-workspace-main'
              : isDesktopChatWorkspace
                ? 'chat-workspace-main'
              : activeTab === 'chat' || isMobilePageTab
            ? `mobile-route-main px-0 lg:px-6 lg:pb-6 lg:pt-3 ${hideMobileNavigation ? 'mobile-route-main-immersive' : ''}`
            : 'mobile-app-content px-3 pt-2 sm:px-4 md:px-6 lg:px-6 lg:pb-6 lg:pt-3'
        } ${
          sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-60'
        } ${
          activeTab === 'explore' ? 'mobile-explore-main' : ''
        }`}
      >
        <Suspense fallback={<RouteLoadingFallback label={t('common.loading')} />}>
        {isUpgradePage && (
          <div className={isMobileViewport ? 'mobile-route-page h-full' : 'upgrade-workspace-page h-full min-h-0'}>
            <UpgradeModal
              isOpen
              presentation="page"
              initialSection={upgradeInitialSection}
              isMobile={isMobileViewport}
              initialPlan={upgradeInitialSelection?.planId}
              initialBillingCycle={upgradeInitialSelection?.billingCycle}
              onClose={closeUpgradePage}
              currentUser={currentUser}
              onAccountChange={handlePaymentAccountChange}
              onRequireAuth={() => openAuth('login')}
              notice={upgradeNotice}
              returnReference={paymentReturnReference}
              onReturnHandled={() => {
                const nextUrl = clearPaymentReturnQuery(new URL(window.location.href));
                window.history.replaceState(window.history.state, '', nextUrl);
                setPaymentReturnReference('');
              }}
            />
          </div>
        )}

        {isQuickUpgradeModalOpen && <LazyModalBoundary active label={t('common.loading')}>
          <UpgradeModal
            isOpen={isQuickUpgradeModalOpen}
            presentation="modal"
            variant="quick"
            isMobile={isMobileViewport}
            onClose={closeQuickUpgradeModal}
            featureLabel={quickUpgradeFeature}
            onOpenFullUpgrade={(selection, notice) => openUpgradeModal(notice, selection)}
            currentUser={currentUser}
            onAccountChange={handlePaymentAccountChange}
            onRequireAuth={() => openAuth('login')}
            notice={quickUpgradeNotice}
            returnReference={paymentReturnReference}
            onReturnHandled={() => {
              const nextUrl = clearPaymentReturnQuery(new URL(window.location.href));
              window.history.replaceState(window.history.state, '', nextUrl);
              setPaymentReturnReference('');
            }}
          />
        </LazyModalBoundary>}

        {!isUpgradePage && createRouteVisited && activeTab === 'create' && (
          <CreateCharacterSurface
            key={createSessionKey}
            onClose={() => handleNavigate('explore')}
            onCreateCharacter={handleCreateCharacter}
            onOpenUpgradeModal={openUpgradeModal}
            onOpenQuickUpgradeModal={openQuickUpgradeModal}
            membershipFeatureKeys={membershipFeatureKeys}
            walletBalance={paymentAccount?.wallet.balance}
            onOpenRechargeModal={openRechargeEntry}
            onSelectCharacterToChat={handleSelectCharacterToChat}
            onOpenCharacterDetail={handleOpenCharacterDetail}
            onRequireAuth={() => { setPendingCreate(true); openAuth('login'); }}
            wizardNickname={wizardNickname}
            nicknameLoading={wizardNicknameLoading}
            nicknameError={wizardNicknameError}
            onRetryNickname={() => void loadWizardNickname(locale)}
            onConsumeNickname={() => { void consumeWizardNickname(); }}
            onStartNextCharacter={startNextCreateSession}
          />
        )}

        {!isUpgradePage && isMobileViewport && mobileGenerateVisited && (
          <div className={activeTab === 'generate' ? 'mobile-route-page h-full' : 'hidden'}>
            <AIGeneratorModal
              isOpen={activeTab === 'generate'}
              presentation="page"
              isAuthenticated={Boolean(currentUser)}
              onClose={() => handleNavigate('explore')}
              onRequireAuth={() => openAuth('login')}
              onOpenUpgradeModal={openUpgradeModal}
              onOpenRechargeModal={openRechargeEntry}
              onOpenQuickUpgradeModal={openQuickUpgradeModal}
              membershipFeatureKeys={membershipFeatureKeys}
              publicCharacters={discoveryCharacters}
              onCharacterCreated={handleGeneratedCharacterCreated}
              onOpenCharacterDetail={handleOpenCharacterDetail}
              onCommunityPublished={() => setCommunityReloadKey((key) => key + 1)}
              onMobileSecondaryViewChange={setIsMobileGenerateSecondaryView}
            />
          </div>
        )}

        {!isUpgradePage && isDesktopGenerateWorkspace && (
          <AIGeneratorModal
            isOpen
            presentation="workspace"
            isAuthenticated={Boolean(currentUser)}
            onClose={() => handleNavigate('explore')}
            onRequireAuth={() => openAuth('login')}
            onOpenUpgradeModal={openUpgradeModal}
            onOpenRechargeModal={openRechargeEntry}
            onOpenQuickUpgradeModal={openQuickUpgradeModal}
            membershipFeatureKeys={membershipFeatureKeys}
            publicCharacters={discoveryCharacters}
            onCharacterCreated={handleGeneratedCharacterCreated}
            onOpenCharacterDetail={handleOpenCharacterDetail}
            onCommunityPublished={() => setCommunityReloadKey((key) => key + 1)}
          />
        )}

        {currentUser && (chatRouteVisited || activeTab === 'chat') && (
          <div
            className={isChatRouteActive ? 'chat-workspace-page mx-auto flex h-full min-h-0 w-full max-w-[1700px]' : 'hidden'}
            aria-hidden={!isChatRouteActive}
          >
            <ChatPage onOpenCreatorProfile={handleOpenCreatorProfile}
              onOpenCreation={DESIGN_PREVIEW?()=>openBusinessView('image-create'):undefined}
              isActive={isChatRouteActive}
              characters={chatPageCharacters}
              selectedCharacter={selectedCharacter}
              onSelectCharacter={(char) => setSelectedCharacter(char)}
              onDeleteChatHistory={handleDeleteChatHistory}
              onToggleFavorite={handleToggleFavorite}
              onGoToExplore={() => {
                navigateToTab('explore');
              }}
              onOpenUpgradeModal={openUpgradeModal}
              onOpenQuickUpgradeModal={openQuickUpgradeModal}
              onOpenCreateModal={openCreateSurface}
              onRequireAuth={() => openAuth('login')}
              isAuthenticated
              membershipTier={membershipTier}
              membershipFeatureKeys={membershipFeatureKeys}
              walletBalance={paymentAccount?.wallet.balance}
              freeChatImagesRemaining={paymentAccount?.welcome?.chatFreeImagesRemaining}
              onOpenRechargeModal={openRechargeEntry}
              userAvatar={currentUser.avatar?.url || null}
              onCommentCountChange={handleCommentCountChange}
              initialThreads={chatThreads}
              initialThreadsReady={chatThreadsReady && chatThreadsReadyUserId === currentUser.id}
              initialThreadsLoading={chatThreadsLoading}
              initialThreadsError={chatThreadsError}
              isAppNavigationOpen={isMobileNavigationOpen}
              isMobileViewport={isMobileViewport}
              onBackToList={() => setSelectedCharacter(null)}
              onThreadListChange={handleChatThreadListChange}
              cacheUserId={currentUser.id}
            />
          </div>
        )}

        {!isUpgradePage && activeTab !== 'chat' && !isMobilePageTab && !isCreateRoute && !isDesktopGenerateWorkspace && (
          <>
        {activeTab === 'my-ai' ? (
          <MyCharactersView
            characters={charactersWithChats}
            favoriteCharacters={favoriteCharacters}
            favoritesLoading={favoritesLoading}
            onSelectCharacter={isMobileViewport?handleOpenCharacterDetail:handleSelectCharacterToChat}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCreatedCharacter={(id) => { void handleDeleteCreatedCharacter(id); }}
            onOpenCreateCharacterModal={openCreateSurface}
            onOpenExplore={() => navigateToTab('explore')}
          />
        ) : activeTab === 'profile' ? (
          <PersonalCenter onTasks={()=>openBusinessView('tasks')} onEarnings={()=>openBusinessView('earnings')} onCreateKind={kind=>{if(kind==='character')openCreateSurface();else openBusinessView(kind==='image'?'image-create':kind==='video'?'video-create':'comic-create')}} creationsRequest={creationsRequest} onEditPreferences={()=>setEntryFlow('edit')} onOpenStory={id=>{setPendingStory(id);setDiscoveryKind('stories');handleNavigate('explore')}} user={currentUser} balance={paymentAccount?.wallet.balance} member={membershipTier} favorites={favoriteCharacters} created={characters.filter(c=>c.source==='created')} threads={chatThreads.filter((thread) => matureEnabled || !isMaturePreviewCharacter(thread.character.id))} onOpenSettings={()=>setIsProfileModalOpen(true)} onUpgrade={openUpgradeEntry} onCoins={openRechargeEntry} onCreate={openCreateSurface} onSafety={()=>handleNavigate('safety')} onNotifications={()=>setIsNotificationModalOpen(true)} onOpenCharacter={isMobileViewport?handleOpenCharacterDetail:handleSelectCharacterToChat} onOpenThread={id=>void handleSelectCharacterToChatById(id)} onToggleFavorite={handleToggleFavorite} onRequireAuth={()=>openAuth('login')}/>
        ) : activeTab === 'referral' ? (
            <ReferralView isMember={Boolean(membershipTier)} onOpenUpgradeModal={openUpgradeEntry} />
        ) : activeTab === 'safety' ? (
          <SafetyCenterView />
        ) : activeTab === 'help' ? (
          <HelpView
            user={currentUser}
            onRequireAuth={() => openAuth('login')}
            onOpenUpgradeModal={openUpgradeEntry}
            onOpenCreateModal={openCreateSurface}
          />
        ) : activeTab === 'feed' ? (
          isMobileViewport ? <CommunityPlazaView onOpenGenerateModal={()=>openBusinessView('image-create')} followedAuthors={followedAuthors} onToggleFollowAuthor={handleToggleFollowAuthor} onOpenCreatorProfile={handleOpenCreatorProfile} onRequireAuth={()=>openAuth('login')} /> : <ReferencePhotoGallery onBack={() => handleNavigate('explore')} />
        ) : activeTab === 'community' ? (
          <CommunityLanding characters={discoveryCharacters} onCharacter={id=>{const person=discoveryCharacters.find(p=>p.id===id);if(person){isMobileViewport?handleOpenCharacterDetail(person):handleSelectCharacterToChat(person)}else void handleSelectCharacterToChatById(id)}} onCreator={handleOpenCreatorProfile} onDiscover={kind=>{setDiscoveryKind(kind);handleNavigate('explore')}} onCreate={openCreateSurface} onFollow={handleToggleFollowAuthor} followed={followedAuthors}/>
        ) : (
          /* Explore & Gallery Grid View */
          <div className="mobile-explore-page mx-auto max-w-lg space-y-3 md:max-w-6xl lg:max-w-none lg:space-y-4">
            {DESIGN_PREVIEW && <p className="demo-banner">デモ · デザインプレビュー · サンプルデータ · 課金なし · 既存素材（仮）</p>}
            {adultNotice && <p className="demo-neutral" role="status">{adultNotice}</p>}
            {/* Top Search & Filter Header */}
            <TopHeader
              filterState={filterState}
              setFilterState={setFilterState}
              onOpenLogin={() => openAuth('login')}
              onOpenRegister={() => openAuth('register')}
              onOpenProfile={handleOpenProfile}
              onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
              onLocaleChange={currentUser ? handleLocaleChange : undefined}
              unreadNotificationsCount={unreadNotificationsCount}
              user={currentUser}
            />



            <RuntimeBoundary scope="discovery"><DiscoveryHub onActivityCreate={openCreateSurface} onCommunity={()=>handleNavigate('community')} rewards={onChat=><HomeMissions loggedIn={!!currentUser} onRequireAuth={()=>openAuth('login')} onTasks={()=>setBusinessView('tasks')} onChat={onChat}/>} openStoryId={pendingStory} onStoryOpened={()=>setPendingStory(null)} kind={discoveryKind} onKindChange={setDiscoveryKind} filters={filterState} setFilters={setFilterState} characters={discoveryCharacters.filter(c=>matureEnabled||!isMaturePreviewCharacter(c.id))} onSelectCharacter={isMobileViewport?handleOpenCharacterDetail:handleSelectCharacterToChat} onStartCharacterChat={handleSelectCharacterToChat}>
            {/* Horizontal Category Pill Carousel */}
            <TagCarousel
              resetKey={discoveryKind}
              primaryCount={(() => {
                if (!DESIGN_PREVIEW) return 6;
                const people = previewCharacters().filter((person) => matureEnabled || !isMaturePreviewCharacter(person.id));
                const visible = visibleDemoThemes('characters', {mature: matureEnabled, hasContent: (theme) => people.some((person) => {
                  if (filterState.gender !== 'all' && person.gender !== filterState.gender) return false;
                  if (filterState.artStyle !== 'all' && person.style !== filterState.artStyle) return false;
                  const query = filterState.searchQuery.trim().toLowerCase();
                  if (query && !`${person.name} ${person.bio}`.toLowerCase().includes(query)) return false;
                  return selectionMatches(person.tags, theme.id, DEMO_THEMES.characters);
                })});
                return splitThemeChips(visible).primary.length;
              })()}
              selectedCategory={filterState.categoryTag}
              tags={DESIGN_PREVIEW ? (() => {
                const people = previewCharacters().filter((person) => matureEnabled || !isMaturePreviewCharacter(person.id));
                const visible = visibleDemoThemes('characters', {mature: matureEnabled, hasContent: (theme) => people.some((person) => {
                  if (filterState.gender !== 'all' && person.gender !== filterState.gender) return false;
                  if (filterState.artStyle !== 'all' && person.style !== filterState.artStyle) return false;
                  const query = filterState.searchQuery.trim().toLowerCase();
                  if (query && !`${person.name} ${person.bio}`.toLowerCase().includes(query)) return false;
                  return selectionMatches(person.tags, theme.id, DEMO_THEMES.characters);
                })});
                const chips = splitThemeChips(visible);
                return [...chips.primary, ...chips.extra].map((theme) => ({slug: theme.id, label: demoThemeLabel(theme.id, locale, 'characters')}));
              })() : filterTagOptions.filter(tag=>!['identity_teenager','identity_student','theme_school','theme_coming_of_age','user_relationship_classmate'].includes(tag.slug))}
              labelForTag={DESIGN_PREVIEW ? (tag) => demoThemeLabel(tag.slug, locale, 'characters') || tag.label : undefined}
              onSelectCategory={(cat) =>
                setFilterState((prev) => ({ ...prev, categoryTag: cat }))
              }
            />

            {/* View Header Info */}
            <div className={`mio-grid-heading ${activeTab === 'my-ai' ? 'is-collection' : ''} flex items-center justify-between pb-1 pt-0 lg:pt-2`}>
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
                {activeTab === 'my-ai' ? (
                  <>
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span>{t('discover.myCollection')} ({favoriteCount})</span>
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-pink-400 text-pink-400 lg:hidden">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <Compass className="hidden h-4 w-4 text-pink-400 lg:block" />
                    <span>{t('discover.featured')}</span>
                  </>
                )}
              </div>

              {(filterState.searchQuery || filterState.categoryTag !== 'all' || filterState.gender !== 'all' || filterState.artStyle !== 'all' || filterState.ageGroup !== 'all' || filterState.sortBy !== 'newest') && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-pink-400 hover:text-pink-300 font-medium"
                >
                  {t('discover.clearFilters')}
                </button>
              )}
            </div>

            {/* Character Gallery Grid */}
            <CharacterGrid onOpenEvent={()=>openBusinessView('events')}
              characters={discoveryCharacters.filter(c=>matureEnabled||!isMaturePreviewCharacter(c.id))}
              onSelectCharacter={isMobileViewport?handleOpenCharacterDetail:handleSelectCharacterToChat}
              onToggleFavorite={handleToggleFavorite}
              onResetFilters={resetFilters}
              onClearSearch={() => setFilterState((previous) => ({...previous, searchQuery: ''}))}
              hasQuery={Boolean(filterState.searchQuery)}
              loading={discoveryLoading}
              loadingMore={discoveryLoadingMore}
              hasMore={discoveryCharacters.length < discoveryTotal}
              error={discoveryError}
              loadMoreError={discoveryLoadMoreError}
              onRetry={() => setDiscoveryReloadKey((value) => value + 1)}
              onLoadMore={() => void loadMoreDiscovery()}
              onRetryLoadMore={() => void loadMoreDiscovery()}
              mobilePresentation="explore"
            />
            </DiscoveryHub></RuntimeBoundary>
          </div>
        )}
          </>
        )}
        </Suspense>
      </main>

      {!hideMobileNavigation && (
        <MobileNavigation
          onLocaleChange={currentUser?handleLocaleChange:undefined}
          onOpenWorkspace={view=>{setIsMobileNavigationOpen(false);openBusinessView(view)}}
          activeTab={activeTab}
          hideHeader={true}
          user={currentUser}
          isDrawerOpen={isMobileNavigationOpen}
          onDrawerOpenChange={setIsMobileNavigationOpen}
          onNavigate={handleNavigate}
          onOpenUpgrade={openUpgradeEntry}
          membershipTier={membershipTier}
          onOpenLogin={() => openAuth('login')}
          onOpenRegister={() => openAuth('register')}
          onOpenProfile={handleOpenProfile}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      )}

      {searchOpen&&<SearchPage characters={discoveryCharacters.filter(c=>matureEnabled||!isMaturePreviewCharacter(c.id))} onClose={()=>setSearchOpen(false)} onSearch={query=>{setFilterState(p=>({...p,searchQuery:query}));setDiscoveryKind('characters');setSearchOpen(false);handleNavigate('explore')}} onSelect={person=>{setSearchOpen(false);isMobileViewport?handleOpenCharacterDetail(person):handleSelectCharacterToChat(person)}} onFavorite={handleToggleFavorite}/>}
      {businessView&&<RuntimeBoundary key={businessView} scope="business"><BusinessWorkspace creationCharacterId={selectedCharacter?.id} onNavigate={openBusinessView} view={businessView} onClose={()=>setBusinessView(null)} onDiscover={(kind,id)=>{setBusinessView(null);setDiscoveryKind(kind);if(kind==='stories'&&id)setPendingStory(id);handleNavigate('explore');if(kind==='characters'&&id)void handleSelectCharacterToChatById(id)}}/></RuntimeBoundary>}
      {mobileCreateChooser&&<MobileCreateChooser onClose={()=>setMobileCreateChooser(false)} onSelect={kind=>{setMobileCreateChooser(false);if(kind==='character')openCreateSurface();else openBusinessView(kind)}}/>}
      <DailyCheckIn ready={!!currentUser&&!entryFlow&&!isAuthModalOpen&&activeTab==='explore'&&!businessView} loggedIn={!!currentUser} onLogin={()=>openAuth('login')}/>
      {entryFlow&&<EntryOnboarding editing={entryFlow==='edit'} onClose={()=>setEntryFlow(null)} onComplete={()=>setEntryFlow(null)}/>}
      {/* Modals */}
      {selectedDetailCharacter && (
        <LazyModalBoundary active label={t('common.loading')}>
          <CharacterDetailModal
            key={selectedDetailCharacter.id}
            character={selectedDetailCharacter.source === 'api'
              ? discoveryCharacters.find((c) => c.id === selectedDetailCharacter.id && c.galleryLoaded) || selectedDetailCharacter
              : characters.find((c) => c.id === selectedDetailCharacter.id) || selectedDetailCharacter}
            followedAuthors={followedAuthors}
            onToggleFollowAuthor={handleToggleFollowAuthor}
            onToggleDynamicLike={handleToggleCreatorDynamicLike}
            loading={detailLoading}
            error={detailError}
            onRetry={() => handleOpenCharacterDetail(selectedDetailCharacter)}
            onClose={() => {
              detailRequestRef.current += 1;
              navigateToTab(activeTab, true);
              setSelectedDetailCharacter(null);
              setDetailError(null);
            }}
            onStartChat={(char) => {
              setSelectedDetailCharacter(null);
              handleSelectCharacterToChat(char);
            }}
            onOpenCreatorProfile={(author, creatorId) => {
              navigateToTab(activeTab, true);
              setSelectedDetailCharacter(null);
              handleOpenCreatorProfile(author, creatorId);
            }}
            onToggleFavorite={handleToggleFavorite}
            isAuthenticated={Boolean(currentUser)}
            onRequireAuth={() => openAuth('login')}
            onOpenUpgradeModal={openUpgradeModal}
            onCommentCountChange={handleCommentCountChange}
            onRetryStCard={selectedDetailCharacter.source === 'created' ? (id) => {
              void api.createdCharacters.retryStCard(id).then(async () => {
                const detail = await api.createdCharacters.get(id);
                setSelectedDetailCharacter(detail);
              }).catch((reason) => setDetailError(userErrorMessage(reason, t, 'common.unknownError')));
            } : undefined}
          />
        </LazyModalBoundary>
      )}

      {viewingCreatorAuthor && (
        <LazyModalBoundary active label={t('common.loading')}>
          <CreatorProfileModal
            authorName={viewingCreatorAuthor}
            creatorProfile={creatorProfile}
            loading={creatorProfileLoading}
            error={creatorProfileError}
            onRetry={() => viewingCreatorId && handleOpenCreatorProfile(viewingCreatorAuthor, viewingCreatorId)}
            characters={creatorCharacters}
            characterTotal={creatorCharactersTotal}
            charactersLoading={creatorCharactersLoading}
            charactersError={creatorCharactersError}
            onLoadMoreCharacters={() => viewingCreatorId && loadCreatorCharacters(viewingCreatorId, creatorCharactersPage + 1, true)}
            onRetryCharacters={() => viewingCreatorId && loadCreatorCharacters(viewingCreatorId, 1)}
            dynamics={creatorDynamics}
            dynamicsTotal={creatorDynamicsTotal}
            dynamicsLoading={creatorDynamicsLoading}
            dynamicsError={creatorDynamicsError}
            onLoadMoreDynamics={() => viewingCreatorId && loadCreatorDynamics(viewingCreatorId, creatorDynamicsPage + 1, true)}
            onRetryDynamics={() => viewingCreatorId && loadCreatorDynamics(viewingCreatorId, 1)}
            followedAuthors={followedAuthors}
            onToggleFollowAuthor={handleToggleFollowAuthor}
            onClose={() => { creatorRequestRef.current += 1; setViewingCreatorAuthor(null); setViewingCreatorId(null); setCreatorProfile(null); }}
            onSelectCharacter={isMobileViewport?handleOpenCharacterDetail:handleSelectCharacterToChat}
            onToggleFavorite={handleToggleFavorite}
          />
        </LazyModalBoundary>
      )}

      {isProfileModalOpen && <LazyModalBoundary active label={t('common.loading')}>
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={currentUser}
          onLogout={handleLogout}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenUpgradeModal={openUpgradeEntry}
          onOpenReferral={() => navigateToTab('referral')}
          onOpenSafetyCenter={() => navigateToTab('safety')}
          onLocaleChange={handleLocaleChange}
          onAvatarChange={handleAvatarChange}
          walletBalance={paymentAccount?.wallet.balance}
        />
      </LazyModalBoundary>}

      {isAuthModalOpen && <LazyModalBoundary active label={t('common.loading')}>
        <AuthModal
          isOpen={isAuthModalOpen}
          initialIntent={authIntent}
          onClose={() => { setIsAuthModalOpen(false); setPendingFavoriteId(null); setPendingChatCharacterId(null); setPendingCreate(false); }}
          onAuthenticated={handleAuthenticated}
          onOpenTerms={() => navigateToTab('safety')}
        />
      </LazyModalBoundary>}

      {globalError && (
        <div className="fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] mx-auto max-w-sm rounded-xl bg-rose-950 border border-rose-500/40 px-4 py-3 text-xs text-rose-100 shadow-2xl flex items-start gap-2 sm:left-auto sm:right-5 sm:top-5 sm:mx-0" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {globalNotice && (
        <div className="fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] mx-auto max-w-sm rounded-xl border border-emerald-500/40 bg-emerald-950 px-4 py-3 text-xs text-emerald-100 shadow-2xl sm:left-auto sm:right-5 sm:top-5 sm:mx-0" role="status">
          {globalNotice}
        </div>
      )}

      {isNotificationModalOpen && <LazyModalBoundary active label={t('common.loading')}>
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAll={handleClearAllNotifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onSelectCharacterToChat={(id) => { void handleSelectCharacterToChatById(id); }}
          onOpenCharacterDetail={(id) => { void handleOpenCharacterDetailById(id); }}
          onOpenCreatorProfile={handleOpenCreatorProfile}
        />
      </LazyModalBoundary>}
    </div>
  );
}
