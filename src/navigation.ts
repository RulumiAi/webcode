import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Compass,
  Gift,
  Headphones,
  Heart,
  Film,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import type { NavTab } from './types';

export type NavigationPresentation = 'route' | 'dialog';
export type MobileNavigationPresentation = 'route' | 'page';
export type NavigationTarget = NavTab | 'profile' | 'upgrade';
export type NavigationGroup = 'primary' | 'community' | 'support' | 'account';

export interface NavigationItem {
  id: NavigationTarget;
  labelKey: string;
  icon: LucideIcon;
  group: NavigationGroup;
  presentation: NavigationPresentation;
  mobilePresentation?: MobileNavigationPresentation;
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
export const GENERATION_ENABLED = viteEnv?.VITE_GENERATION_ENABLED?.trim().toLowerCase() !== 'false';

export const ROUTE_NAVIGATION_ITEMS: Record<NavTab, NavigationItem> = {
  profile: {id:'profile',labelKey:'nav.profile',icon:User,group:'account',presentation:'route',mobilePresentation:'route'},
  explore: { id: 'explore', labelKey: 'nav.explore', icon: Compass, group: 'primary', presentation: 'route', mobilePresentation: 'route' },
  chat: { id: 'chat', labelKey: 'nav.chat', icon: MessageSquare, group: 'primary', presentation: 'route', mobilePresentation: 'route' },
  create: { id: 'create', labelKey: 'nav.create', icon: Plus, group: 'primary', presentation: 'route', mobilePresentation: 'page' },
  generate: { id: 'generate', labelKey: 'nav.generate', icon: Sparkles, group: 'primary', presentation: 'route', mobilePresentation: 'page' },
  'my-ai': { id: 'my-ai', labelKey: 'nav.myCharacters', icon: Bot, group: 'primary', presentation: 'route', mobilePresentation: 'route' },
  feed: { id: 'feed', labelKey: 'nav.feed', icon: Film, group: 'community', presentation: 'route', mobilePresentation: 'route' },
  community: { id: 'community', labelKey: 'nav.community', icon: Users, group: 'community', presentation: 'route', mobilePresentation: 'route' },
  referral: { id: 'referral', labelKey: 'nav.referral', icon: Gift, group: 'support', presentation: 'route', mobilePresentation: 'route' },
  help: { id: 'help', labelKey: 'nav.help', icon: Headphones, group: 'support', presentation: 'route', mobilePresentation: 'route' },
  safety: { id: 'safety', labelKey: 'nav.safety', icon: ShieldCheck, group: 'support', presentation: 'route', mobilePresentation: 'route' },
};

export const UTILITY_NAVIGATION_ITEMS: Record<'profile' | 'upgrade', NavigationItem> = {
  profile: { id: 'profile', labelKey: 'nav.profile', icon: User, group: 'account', presentation: 'dialog' },
  upgrade: { id: 'upgrade', labelKey: 'nav.upgrade', icon: Heart, group: 'account', presentation: 'dialog' },
};

export const PRIMARY_MOBILE_TABS: NavTab[] = ['explore','community','create','chat','profile'];

export const DESKTOP_MAIN_TABS: NavTab[] = ['explore', 'chat', ...(GENERATION_ENABLED ? ['generate' as const] : []), 'my-ai', 'feed', 'community'];
export const DESKTOP_SECONDARY_TABS: NavTab[] = ['help', 'safety'];

export const MOBILE_DRAWER_GROUPS: Array<{ id: NavigationGroup; labelKey: string; items: NavigationItem[] }> = [
  {
    id: 'primary',
    labelKey: 'mobile.navigationPrimary',
    items: PRIMARY_MOBILE_TABS.map((id) => ROUTE_NAVIGATION_ITEMS[id]),
  },
  {
    id: 'community',
    labelKey: 'mobile.navigationCommunity',
    items: [ROUTE_NAVIGATION_ITEMS.feed, ROUTE_NAVIGATION_ITEMS.community],
  },
  {
    id: 'support',
    labelKey: 'mobile.navigationSupport',
    items: [ROUTE_NAVIGATION_ITEMS.help, ROUTE_NAVIGATION_ITEMS.safety],
  },
  {
    id: 'account',
    labelKey: 'mobile.navigationAccount',
    items: [],
  },
];

export function isRouteTarget(target: NavigationTarget): target is NavTab {
  return target in ROUTE_NAVIGATION_ITEMS;
}
