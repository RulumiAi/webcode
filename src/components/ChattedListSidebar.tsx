import {previewCharacters,DESIGN_PREVIEW} from '../previewApi';
import {r12Copy} from '../r12Text';
import React, { memo, useMemo, useState, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Compass, 
  Trash2, 
  Sparkles, 
  User, 
  ChevronRight,
  Heart,
  X
} from 'lucide-react';
import { Character } from '../types';
import { useLocale } from '../i18n';

export interface RecentChatInfo {
  characterId: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount?: number;
}

interface ChattedListSidebarProps {
  chattedCharacters: Character[];
  selectedCharacterId: string | null;
  recentChatsMap: Record<string, RecentChatInfo>;
  onSelectCharacter: (char: Character) => void;
  onDeleteChatHistory: (characterId: string, characterName: string, e: React.MouseEvent) => void;
  onGoToExplore: () => void;
  onOpenCreateModal: () => void;
  onClose?: () => void;
}

export const ChattedListSidebar = memo(({
  chattedCharacters,
  selectedCharacterId,
  recentChatsMap,
  onSelectCharacter,
  onDeleteChatHistory,
  onGoToExplore,
  onOpenCreateModal,
  onClose,
}: ChattedListSidebarProps) => {
  const { t,locale } = useLocale();const c=r12Copy(locale);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');

  const filteredCharacters = useMemo(() => chattedCharacters.filter((char) => {
    if (filterType === 'favorites' && !char.isFavorite) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = char.name.toLowerCase().includes(q);
      const matchSubtitle = char.subtitle.toLowerCase().includes(q);
      const matchTag = char.tags.some((t) => t.toLowerCase().includes(q));
      const recent = recentChatsMap[char.id];
      const matchLastMsg = recent?.lastMessage.toLowerCase().includes(q);
      return matchName || matchSubtitle || matchTag || matchLastMsg;
    }
    return true;
  }), [chattedCharacters, filterType, recentChatsMap, searchQuery]);

  const [swipedId,setSwipedId]=useState<string|null>(null);
  const touchStart=useRef<{x:number;y:number}|null>(null);
  const suppressClick=useRef(false);
  return (
    <aside className="r12-chat-list w-full md:w-72 lg:w-80 bg-[#12121a] border-r border-zinc-800/80 flex flex-col h-full overflow-hidden shrink-0">
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800/80 bg-[#161622] flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>


            </div>
          </div>

          <div className="flex items-center gap-1">
            {onClose && (
               <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" aria-label={t('chat.closeRecent')}>
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {DESIGN_PREVIEW&&<div className="r12-chat-recommendations r16-desktop-recommendations"><span>{locale==='ja'?'おすすめのキャラ':locale==='zh-CN'?'你可能喜欢':'You may like'}</span><div>{previewCharacters().slice(0,6).map(person=><button key={person.id} onClick={onGoToExplore}><img src={person.cardPreview.image?.url||''} alt=""/><small>{person.name.split(' · ')[0].split(' ― ')[0]}</small></button>)}</div></div>}


        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0e0e15] p-1 rounded-lg border border-zinc-800/60 text-[11px] font-bold">
          <button
            onClick={() => setFilterType('all')}
            className={`min-h-11 flex-1 rounded-md transition-all ${
              filterType === 'all'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
             {t('common.all')} {t('common.characters')} ({chattedCharacters.length})
          </button>
          <button
            onClick={() => setFilterType('favorites')}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md transition-all ${
              filterType === 'favorites'
                ? 'bg-zinc-800 text-pink-400 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3 h-3 fill-pink-400/20 text-pink-400" />
             <span>{t('chat.favorites')}</span>
          </button>
        </div>
      </div>

      {/* Chatted Characters List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredCharacters.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <User className="w-8 h-8 text-zinc-600 mb-2" />
             <p className="text-xs text-zinc-400 font-medium">{t('chat.noHistory')}</p>
            <button
              onClick={onGoToExplore}
              className="mt-3 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-500/40 transition-all flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
               <span>{t('chat.chooseLobby')}</span>
            </button>
          </div>
        ) : (
          filteredCharacters.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            const recent = recentChatsMap[char.id];
            const lastMsg = recent?.lastMessage || char.greeting;
             const timeStr = recent?.lastTimestamp || t('common.justNow');

            return (
              <div
                key={char.id}
                onTouchStart={e=>{touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY};suppressClick.current=false}}
                onTouchEnd={e=>{const start=touchStart.current;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){setSwipedId(dx<0?char.id:null);suppressClick.current=true}touchStart.current=null}}
                onClick={() => {if(suppressClick.current){suppressClick.current=false;return}if(swipedId){setSwipedId(null);return}onSelectCharacter(char)}}
                className={`r17-chat-row ${swipedId===char.id?'swiped':''} group relative p-2.5 rounded-xl transition-all cursor-pointer border flex items-center gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-transparent border-pink-500/40 text-white shadow-md'
                    : 'bg-[#161622]/60 hover:bg-[#1a1a29] border-transparent hover:border-zinc-800 text-zinc-300'
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative shrink-0">
                  {char.avatar ? (
                    <img
                      src={char.avatarThumbnail || char.avatar}
                      onError={(event) => {
                        if (event.currentTarget.src !== char.avatar) event.currentTarget.src = char.avatar;
                      }}
                      alt={char.name}
                      className={`w-11 h-11 rounded-2xl object-cover ring-1 ${
                        isSelected ? 'ring-pink-500' : 'ring-zinc-700/80 group-hover:ring-zinc-600'
                      }`}
                    />
                  ) : (
                    <div className={`w-11 h-11 rounded-2xl bg-zinc-800 flex items-center justify-center ring-1 ${
                      isSelected ? 'ring-pink-500' : 'ring-zinc-700/80 group-hover:ring-zinc-600'
                    }`}>
                      <MessageSquare className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#12121a]" />
                </div>

                {/* Info & Last Message Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className={`font-bold text-xs truncate ${isSelected ? 'text-pink-300' : 'text-zinc-100'}`}>
                        {char.name}
                      </h3>
                      {char.isFavorite && (
                        <Heart className="w-3 h-3 text-pink-400 fill-pink-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                      {timeStr}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 truncate font-normal leading-tight">
                    {lastMsg}
                  </p>
                </div>

                {/* Actions on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChatHistory(char.id, char.name, e);
                  }}
                  className="r17-chat-delete"
                   aria-label={t('chat.deleteConversation')} title={t('chat.deleteConversation')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer CTA: Explore More Characters */}
      <div className="p-3 bg-[#161622] border-t border-zinc-800/80 shrink-0">
        <button
          onClick={onGoToExplore}
          className="mobile-touch-target w-full rounded-xl border border-zinc-700/50 bg-zinc-800/80 px-3 text-xs font-bold text-zinc-200 transition-all hover:bg-zinc-700/80 hover:text-white flex items-center justify-center gap-2 group"
        >
          <Compass className="w-4 h-4 text-pink-400 group-hover:rotate-45 transition-transform duration-300" />
           <span>{t('chat.browseLobby')}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    </aside>
  );
});
