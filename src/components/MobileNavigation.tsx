import {creativeCopy} from '../creativeCopy';
import {businessCopy,type BusinessView} from '../businessCopy';
import React, { useEffect, useRef } from 'react';
import {
  Globe2,
  Bell,
  Bot,
  Crown,
  Gem,
  Heart,
  Home,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ApiUser } from '../api';
import type { MembershipPlanId } from '../data/membershipProducts';
import {
  MOBILE_DRAWER_GROUPS,
  PRIMARY_MOBILE_TABS,
  ROUTE_NAVIGATION_ITEMS,
  isRouteTarget,
  type NavigationItem,
} from '../navigation';
import type { NavTab } from '../types';
import {useLocale,applyLocalePreference,LOCALE_LABELS,SUPPORTED_LOCALES} from '../i18n';
import type {Locale} from '../types';
import { BrandLogo } from './BrandLogo';
import {SocialLinks} from './SocialLinks';

interface MobileNavigationProps {
  onOpenWorkspace?:(view:BusinessView)=>void;
  onLocaleChange?:(locale:Locale)=>void|Promise<void>;
  activeTab: NavTab;
  hideHeader?: boolean;
  user: ApiUser | null;
  isDrawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenUpgrade: () => void;
  membershipTier?: MembershipPlanId | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

const MOBILE_TAB_ICONS: Partial<Record<NavTab, LucideIcon>> = {
  explore: Home,
  chat: MessageSquare,
  create: Sparkles,
  generate: Bot,
  'my-ai': UserRound,
  profile: UserRound,
};

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  onOpenWorkspace,
  onLocaleChange,
  activeTab,
  hideHeader = false,
  user,
  isDrawerOpen,
  onDrawerOpenChange,
  onNavigate,
  onOpenUpgrade,
  membershipTier = null,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const {t,locale,setLocale}=useLocale();const biz=businessCopy(locale);const cc=creativeCopy(locale);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const currentItem = ROUTE_NAVIGATION_ITEMS[activeTab];
  const upgradeLabel = membershipTier ? t('nav.buyDiamonds') : t('nav.upgrade');
  const UpgradeIcon = membershipTier ? Gem : Crown;

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirstItem = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDrawerOpenChange(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable: HTMLElement[] = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) || []) as HTMLElement[];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusFirstItem);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [isDrawerOpen, onDrawerOpenChange]);

  const activateItem = (item: NavigationItem) => {
    onDrawerOpenChange(false);
    if (item.id === 'profile') {
      onOpenProfile();
      return;
    }
    if (isRouteTarget(item.id)) {
      onNavigate(item.id);
      return;
    }
    onOpenUpgrade();
  };

  const renderDrawerItem = (item: NavigationItem) => {
    const Icon = item.id === 'upgrade' ? UpgradeIcon : item.icon;
    const label = item.id === 'upgrade' ? upgradeLabel : t(item.labelKey);
    const active = isRouteTarget(item.id) && item.id === activeTab;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => activateItem(item)}
        className={`mobile-touch-target flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold transition-colors ${
          active
            ? 'bg-pink-500/15 text-white ring-1 ring-inset ring-pink-500/30'
            : 'text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-pink-400' : 'text-zinc-400'}`} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
    );
  };

  return (
    <>
      {!hideHeader && (
      <header className="mobile-app-header fixed inset-x-0 top-0 z-30 border-b border-zinc-800/90 bg-[#0c0c10]/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-2.5">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => onDrawerOpenChange(true)}
            className="mobile-touch-target flex min-w-0 items-center gap-2 rounded-lg px-2 text-left text-zinc-100 transition-colors hover:bg-zinc-800 active:bg-zinc-700"
            aria-label={t('mobile.openNavigation')}
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <Menu className="h-5 w-5 shrink-0 text-pink-400" />
            <span className="mio-mobile-wordmark">rulumi<span>.ai</span></span>
          </button>

          <div className="mio-mobile-header-actions flex shrink-0 items-center gap-1">{activeTab==='explore'&&<label className="mio-mobile-header-language"><Globe2 size={17} aria-hidden="true"/><select aria-label={t('profile.chooseLanguage')} value={locale} onChange={e=>void applyLocalePreference(e.target.value as Locale,setLocale,onLocaleChange)}>{SUPPORTED_LOCALES.map(code=><option key={code} value={code}>{LOCALE_LABELS[code]}</option>)}</select></label>}
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="mobile-touch-target flex h-11 items-center gap-1.5 rounded-xl border border-pink-400/25 bg-pink-500/15 px-2.5 text-xs font-extrabold text-pink-200 transition-colors active:bg-pink-500/25"
              aria-label={upgradeLabel}
            >
              <UpgradeIcon className="h-4 w-4 fill-current" />
              <span className="max-w-24 truncate max-[359px]:sr-only">{upgradeLabel}</span>
            </button>
            <button
              type="button"
              onClick={onOpenNotifications}
              className="mobile-touch-target relative flex items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
              aria-label={t('common.notifications')}
              title={t('common.notifications')}
            >
              <Bell className={`h-5 w-5 ${unreadNotificationsCount > 0 ? 'text-pink-400' : ''}`} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-pink-500 px-1 text-center text-[10px] font-black leading-4 text-white ring-2 ring-[#0c0c10]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button className="mio-header-profile mio-anime-avatar mobile-touch-target" onClick={onOpenProfile} aria-label={t('nav.profile')} title={t('nav.profile')}><img src="/mio/fresh-anime/nao.webp" alt=""/></button>
          </div>
        </div>
      </header>
      )}

      <nav
        className="mobile-nav-bar fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800/90 bg-[#0c0c10]/95 backdrop-blur-xl safe-area-bottom lg:hidden"
        aria-label={t('mobile.mainNavigation')}
      >
        <div className="mio-mobile-nav-items mx-auto grid h-16 w-full max-w-2xl px-1.5 md:px-4" style={{gridTemplateColumns:`repeat(${PRIMARY_MOBILE_TABS.length},minmax(0,1fr))`}}>
          {PRIMARY_MOBILE_TABS.map((id) => {
            const item = ROUTE_NAVIGATION_ITEMS[id];
            const Icon = MOBILE_TAB_ICONS[id] || item.icon;
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`mobile-touch-target flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold transition-colors active:bg-zinc-800/80 ${
                  active ? 'text-pink-400' : 'text-zinc-400'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-0.5">{id==='explore'?(locale==='zh-CN'?'首页':locale==='ja'?'ホーム':locale==='en'?'Home':t(item.labelKey)):id==='feed'?(locale==='zh-CN'?'动态':locale==='ja'?'タイムライン':locale==='en'?'Feed':t(item.labelKey)):id==='profile'&&locale==='zh-CN'?'我的':t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => onDrawerOpenChange(false)}
            aria-label={t('mobile.closeNavigation')}
          />
          <section
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="mobile-navigation-drawer safe-area-top safe-area-bottom relative flex h-[100dvh] w-[86vw] max-w-80 flex-col border-r border-zinc-800 bg-[#12121a] shadow-2xl sm:w-[22rem]"
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
              <div className="flex min-w-0 items-center gap-2.5">
                {user?.avatar?.url && <img src={user.avatar.url} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0">
                  <h2 id="mobile-navigation-title" className="flex items-center gap-1.5 text-base font-extrabold text-white">
                    <Heart className="h-7 w-7 shrink-0 text-pink-400"/>
                    <span className="truncate">rulumi.ai</span>
                  </h2>
                  {user ? (
                    <p className="truncate text-xs text-zinc-400">{user.displayName}</p>
                  ) : (
                    <p className="truncate text-xs text-zinc-400">{t('mobile.navigation')}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDrawerOpenChange(false)}
                className="mobile-touch-target flex items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={t('mobile.closeNavigation')}
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar">
              {MOBILE_DRAWER_GROUPS.filter(group=>group.items.some(item=>item.id!=='create'&&item.id!=='profile')).map((group, index) => (
                <section key={group.id} className={index === 0 ? '' : 'mt-4 border-t border-zinc-800 pt-4'} aria-label={t(group.labelKey)}>
                  <h3 className="mb-1 px-2 text-[10px] font-extrabold uppercase text-zinc-500">{t(group.labelKey)}</h3>
                  <div className="space-y-1">{group.items.filter(item=>item.id!=='create'&&item.id!=='profile').map(renderDrawerItem)}</div>
                </section>
              ))}

              <button className="r16-drawer-create" onClick={()=>{onDrawerOpenChange(false);onNavigate('create')}}><Sparkles size={19}/>{t('nav.create')}</button><div className="mio-mobile-business">{(['events','ranking'] as BusinessView[]).map(view=><button key={view} onClick={()=>onOpenWorkspace?.(view)}>{view==='image-create'?cc.image:view==='video-create'?cc.video:view==='events'?cc.events:biz[view==='comic-create'?'create':view]}</button>)}</div>
              <div className="mio-mobile-social"><SocialLinks/></div>
              {!user && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-4">
                  <button type="button" onClick={() => { onDrawerOpenChange(false); onOpenLogin(); }} className="mobile-touch-target rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800">
                    {t('common.signIn')}
                  </button>
                  <button type="button" onClick={() => { onDrawerOpenChange(false); onOpenRegister(); }} className="mobile-touch-target rounded-lg bg-pink-500 px-3 text-xs font-bold text-white hover:bg-pink-400">
                    {t('common.joinFree')}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
