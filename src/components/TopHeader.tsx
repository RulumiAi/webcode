import React, { useEffect, useRef, useState } from 'react';
import { UserRound, ArrowDownUp, Search, ChevronDown, ChevronUp, Bell, Check, Globe2, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { FilterState, GenderType, ArtStyleType, SortOption, type Locale } from '../types';
import type { ApiUser } from '../api';
import {referenceCopy} from '../referenceCopy';
import { applyLocalePreference, LOCALE_LABELS, SUPPORTED_LOCALES, useLocale } from '../i18n';

interface TopHeaderProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenNotificationModal?: () => void;
  onOpenProfile?: () => void;
  onLocaleChange?: (locale: Locale) => void | Promise<void>;
  unreadNotificationsCount?: number;
  user?: ApiUser | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  filterState,
  setFilterState,
  onOpenNotificationModal,
  onOpenProfile,
  onLocaleChange,
  unreadNotificationsCount = 0,
  user,
}) => {
  const { locale, setLocale, t } = useLocale();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = [
    filterState.gender !== 'all',
    filterState.artStyle !== 'all',
    filterState.ageGroup !== 'all',
  ].filter(Boolean).length;

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      filtersTriggerRef.current?.focus();
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!languageOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLanguageOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) setLanguageOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [languageOpen]);

  const handleLocaleSelect = async (next: Locale) => {
    if (next === locale || savingLanguage) {
      setLanguageOpen(false);
      return;
    }
    setLanguageError(false);
    setLanguageOpen(false);
    setSavingLanguage(true);
    const synced = await applyLocalePreference(next, setLocale, onLocaleChange);
    if (!synced) {
      setLanguageError(true);
      setLanguageOpen(true);
    }
    setSavingLanguage(false);
  };

  const selectClass = 'mobile-touch-target w-full appearance-none rounded-xl border border-zinc-800 bg-[#15151c] px-3.5 pr-10 text-sm font-medium text-zinc-200 focus:border-pink-500/60 focus:outline-none';
  const openFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
    filtersTriggerRef.current = event.currentTarget;
    setFiltersOpen(true);
  };
  const renderFilterFields = () => (
    <div className="mobile-modal-scroll flex-1 space-y-3 overflow-y-auto p-4">
      <label className="block space-y-1.5 text-xs font-bold text-zinc-400">
        <span>{t('discover.gender')}</span>
        <div className="relative">
          <select value={filterState.gender} onChange={(e) => setFilterState((prev) => ({ ...prev, gender: e.target.value as GenderType }))} className={selectClass}>
            <option value="all">{t('discover.genderAllShort')}</option>
            <option value="female">{t('discover.femaleShort')}</option>
            <option value="male">{t('discover.maleShort')}</option>
            <option value="nonbinary">{t('discover.nonbinaryShort')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </label>
      <label className="block space-y-1.5 text-xs font-bold text-zinc-400">
        <span>{t('discover.style')}</span>
        <div className="relative">
          <select value={filterState.artStyle} onChange={(e) => setFilterState((prev) => ({ ...prev, artStyle: e.target.value as ArtStyleType }))} className={selectClass}>
            <option value="all">{t('discover.styleAll')}</option>
            <option value="anime">{t('discover.anime')}</option>
            <option value="realistic">{t('discover.realistic')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </label>
      <label className="block space-y-1.5 text-xs font-bold text-zinc-400">
        <span>{t('discover.age')}</span>
        <div className="relative">
          <select value={filterState.ageGroup} onChange={(e) => setFilterState((prev) => ({ ...prev, ageGroup: e.target.value as FilterState['ageGroup'] }))} className={selectClass}>
            <option value="all">{t('discover.anyAgeShort')}</option>
            
            <option value="young">{t('discover.ageYoung')}</option>
            <option value="adult">{t('discover.ageAdult')}</option>
            <option value="mature">{t('discover.ageMatureShort')}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </label>
    </div>
  );

  return (
    <div className="mio-top-header w-full space-y-3 pb-2 pt-0 sm:space-y-4">

      {/* Top Navbar Header */}
      <div className="mio-top-title-row flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="hidden min-w-0 lg:block">
          <div className="text-xs font-semibold text-pink-500 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> {t('discover.eyebrow')}
          </div>
          <h1 className="mobile-landscape-heading flex flex-col gap-1 text-2xl font-extrabold text-white lg:flex-row lg:items-baseline lg:gap-3 lg:text-3xl">
            <span>{t('dense.title')}</span>
            <span className="text-xs font-normal leading-relaxed text-zinc-400">
              {t('discover.subtitle')}
            </span>
          </h1>
        </div>

        {/* Right CTA / User controls */}
        <div className="hidden w-full items-center justify-end gap-1.5 lg:flex lg:gap-3 xl:w-auto">
          <div className="hidden items-center gap-1.5 lg:flex lg:gap-3">
            <div ref={languageRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => { setLanguageError(false); setLanguageOpen((open) => !open); }}
                className={`mobile-touch-target flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-xs font-bold transition-colors sm:text-sm ${languageOpen ? 'border-pink-500/80 bg-[#1b1825] text-white' : 'border-zinc-800 bg-[#151520] text-zinc-200 hover:border-pink-500/50 hover:bg-zinc-800'}`}
                aria-haspopup="menu"
                aria-expanded={languageOpen}
                aria-controls="homepage-language-menu"
                title={t('profile.chooseLanguage')}
              >
                <Globe2 className="h-4 w-4 text-pink-400" aria-hidden="true" />
                <span className="hidden min-[1280px]:inline">{LOCALE_LABELS[locale]}</span>
                {languageOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-zinc-400" aria-hidden="true" />}
              </button>
              {languageOpen && (
                <div id="homepage-language-menu" role="menu" aria-label={t('profile.chooseLanguage')} className="absolute right-0 top-[calc(100%+0.75rem)] z-[65] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-700/80 bg-[#171722] p-2 shadow-2xl shadow-black/50">
                  {SUPPORTED_LOCALES.map((option) => {
                    const selected = option === locale;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        disabled={savingLanguage}
                        onClick={() => void handleLocaleSelect(option)}
                        className={`flex min-h-12 w-full items-center gap-2 rounded-2xl px-4 text-left text-sm font-bold text-white transition-colors disabled:cursor-wait disabled:opacity-60 ${selected ? 'border border-pink-500/60 bg-pink-500/15' : 'border border-transparent hover:bg-white/6'}`}
                      >
                        <span className="min-w-0 flex-1 truncate">{LOCALE_LABELS[option]}</span>
                        {selected && <Check className="h-5 w-5 shrink-0 text-pink-400" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {languageError && <p className="absolute right-0 top-[calc(100%+20rem)] z-[66] w-64 rounded-xl border border-rose-500/40 bg-rose-950/95 px-3 py-2 text-[11px] font-medium text-rose-100 shadow-xl" role="alert">{t('errors.localeNetwork')}</p>}
            </div>
          </div>


          {/* Bell Notification Button */}
          <button
            onClick={onOpenNotificationModal}
            className="mobile-touch-target group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-[#151520] text-zinc-300 shadow-sm transition-all hover:border-pink-500/50 hover:bg-zinc-800 hover:text-white"
            title={t('common.notifications')}
            aria-label={t('common.notifications')}
          >
            <Bell className={`w-4 h-4 transition-transform group-hover:scale-110 ${unreadNotificationsCount > 0 ? 'text-pink-400 animate-pulse' : ''}`} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#0c0c10] shadow-md shadow-pink-500/40">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
<button className="mio-header-profile mio-anime-avatar" aria-label={t('nav.profile')} title={t('nav.profile')} onClick={onOpenProfile}><img src="/mio/fresh-anime/nao.webp" alt=""/></button>

        </div>
      </div>

      {/* Mobile controls keep search and sort visible; secondary filters live in a bottom sheet. */}
      <div className="mobile-explore-controls grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2 lg:hidden">
        <div className="relative rounded-xl focus-within:ring-2 focus-within:ring-pink-500/60">
          <div className="mobile-touch-target flex items-center justify-center rounded-xl border border-white/10 bg-[#181820] text-zinc-300" aria-hidden="true">
            <ArrowDownUp className="h-[18px] w-[18px]" />
          </div>
          <select
            aria-label={t('discover.sortLabel')}
            value={filterState.sortBy}
            onChange={(e) => setFilterState((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            <option value="trending">{t('discover.sort.trending')}</option>
            <option value="newest">{t('discover.sort.newest')}</option>
            <option value="popular">{t('discover.sort.popular')}</option>
          </select>
        </div>
        <label className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            aria-label={t('discover.searchLabel')}
            type="search"
            value={filterState.searchQuery}
            onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder={referenceCopy(locale)[13]}
            className="mobile-touch-target w-full min-w-0 rounded-xl border border-white/10 bg-[#181820] pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-pink-500/70 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={openFilters}
          className="mobile-touch-target relative flex items-center justify-center rounded-xl border border-white/10 bg-[#181820] text-zinc-300"
          aria-label={t('discover.moreFilters')}
          title={t('discover.moreFilters')}
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-black text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop primary controls */}
      <div className="mio-desktop-search-row hidden grid-cols-1 items-center gap-3 lg:grid lg:grid-cols-12">
        {/* Sort Dropdown */}
        <div className="md:col-span-3 lg:col-span-2">
          <div className="relative">
            <select
              aria-label={t('discover.sortLabel')}
              value={filterState.sortBy}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  sortBy: e.target.value as SortOption,
                }))
              }
              className="w-full appearance-none bg-[#15151c] hover:bg-[#1a1a24] text-zinc-200 text-sm font-medium py-2.5 pl-3.5 pr-8 rounded-xl border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:border-pink-500/60 transition-colors cursor-pointer"
            >
              <option value="trending">{t('discover.sort.trending')}</option>
              <option value="newest">{t('discover.sort.newest')}</option>
              <option value="popular">{t('discover.sort.popular')}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="md:col-span-9 lg:col-span-5">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  searchQuery: e.target.value,
                }))
              }
              placeholder={referenceCopy(locale)[13]}
              className="w-full bg-[#15151c] hover:bg-[#1a1a24] text-white placeholder-zinc-500 text-sm py-2.5 pl-10 pr-10 rounded-xl border border-zinc-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
              /
            </div>
          </div>
        </div>

        {/* Secondary filters */}
        <div className="md:col-span-12 lg:col-span-5 lg:flex lg:justify-end">
          <button
            type="button"
            onClick={openFilters}
            className="mobile-touch-target relative flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#15151c] px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-pink-500/50 hover:bg-[#1a1a24] lg:w-auto lg:min-w-40"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal className="h-4 w-4 text-pink-400" aria-hidden="true" />
            <span>{t('discover.moreFilters')}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-[10px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[55] flex items-end lg:items-center lg:justify-center" role="presentation">
          <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} aria-label={t('common.closeFilter')} />
          <section id="explore-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="relative z-10 flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-zinc-800 bg-[#12121a] shadow-2xl safe-area-bottom lg:max-h-[min(34rem,calc(100dvh-3rem))] lg:w-[min(32rem,calc(100vw-3rem))] lg:rounded-3xl lg:border-b lg:border-zinc-800">
            <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <h2 id="mobile-filter-title" className="text-base font-extrabold text-white">{t('discover.filterCharacters')}</h2>
                <p className="text-xs text-zinc-400">{t('discover.filterHint')}</p>
              </div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="mobile-touch-target flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white" aria-label={t('common.closeFilter')}>
                <X className="h-5 w-5" />
              </button>
            </header>

            {renderFilterFields()}

            <footer className="flex shrink-0 gap-2 border-t border-zinc-800 bg-[#101017] p-3">
              <button type="button" onClick={() => setFilterState((prev) => ({ ...prev, gender: 'all', artStyle: 'all', ageGroup: 'all' }))} className="mobile-touch-target flex-1 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-300 hover:bg-zinc-800">{t('common.clearFilters')}</button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="mobile-touch-target flex-1 rounded-xl bg-pink-500 text-sm font-bold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-400">{t('common.applyFilters')}</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
