import React, { useState } from 'react';
import { 
  Heart, 
  Plus, 
  Trash2, 
  Sparkles, 
  UserCheck, 
  AlertTriangle,
  X
} from 'lucide-react';
import { Character } from '../types';
import { CharacterCard } from './CharacterCard';
import { useLocale } from '../i18n';

interface MyCharactersViewProps {
  characters: Character[];
  favoriteCharacters: Character[];
  favoritesLoading: boolean;
  onSelectCharacter: (char: Character) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDeleteCreatedCharacter: (id: string) => void;
  onOpenCreateCharacterModal: () => void;
  onOpenExplore: () => void;
}

export const MyCharactersView: React.FC<MyCharactersViewProps> = ({
  characters,
  favoriteCharacters,
  favoritesLoading,
  onSelectCharacter,
  onToggleFavorite,
  onDeleteCreatedCharacter,
  onOpenCreateCharacterModal,
  onOpenExplore,
}) => {
  const { t } = useLocale();
  const [activeSubTab, setActiveSubTab] = useState<'created' | 'favorite'>('created');
  
  // Custom confirmation modal state
  const [deletingChar, setDeletingChar] = useState<{
    char: Character;
    action: 'delete_created';
  } | null>(null);

  const createdCharacters = characters.filter((c) => c.author === '@you');


  const displayedList = activeSubTab === 'created' ? createdCharacters : favoriteCharacters;

  const handleConfirmDelete = () => {
    if (!deletingChar) return;
    if (deletingChar.action === 'delete_created') {
      onDeleteCreatedCharacter(deletingChar.char.id);
    }
    setDeletingChar(null);
  };

  return (
    <div className="mobile-secondary-view space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Top Welcome Header */}
      <div className="relative flex min-h-48 flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-r from-pink-950/60 via-[#151522] to-purple-950/60 p-6 shadow-2xl sm:p-8 md:flex-row md:items-center">
        <div className="z-10 min-w-0 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('my.eyebrow')}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {t('my.title')}
          </h1>
          <p className="max-w-prose text-sm leading-relaxed text-zinc-300">
            {t('my.description')}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateCharacterModal}
          className="z-10 flex min-h-11 w-full max-w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-pink-500/30 transition-all hover:brightness-110 active:scale-95 md:w-auto"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{t('my.create')}</span>
        </button>
      </div>

      {/* SubTab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-[#12121a] p-2.5 custom-scrollbar">
        
        {/* SubTab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('created')}
            className={`min-h-11 shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'created'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('my.created')}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/40 text-pink-200">
              {createdCharacters.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('favorite')}
            className={`min-h-11 shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'favorite'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
            }`}
          >
            <Heart className="w-4 h-4 fill-current text-pink-300" />
            <span>{t('my.favorites')}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/40 text-pink-200">
              {favoriteCharacters.length}
            </span>
          </button>

        </div>
      </div>

      {/* Main Grid Content or Empty State */}
      {activeSubTab === 'favorite' && favoritesLoading ? (
        <div className="py-16 text-center bg-[#12121a] rounded-3xl border border-zinc-800/80 p-8 max-w-2xl mx-auto shadow-xl">
          <span className="text-xs text-zinc-400">{t('common.loading')}</span>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-[#12121a] rounded-3xl border border-zinc-800/80 p-8 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto text-2xl font-bold">
            {activeSubTab === 'created' ? (
              <UserCheck className="w-8 h-8 text-pink-400" />
            ) : (
              <Heart className="w-8 h-8 text-pink-400" />
            )}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">
              {activeSubTab === 'created'
                 ? t('my.emptyCreated')
                : t('my.emptyFavorites')}
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {activeSubTab === 'created'
                 ? t('my.hintCreated')
                : t('my.hintFavorites')}
            </p>
          </div>

          <div className="pt-2">
            {activeSubTab === 'created' ? (
              <button
                onClick={onOpenCreateCharacterModal}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-pink-500/30 hover:brightness-110 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                 <span>{t('my.generate')}</span>
              </button>
            ) : (
              <button
                onClick={onOpenExplore}
                className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-pink-400" />
                 <span>{t('my.explore')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Render Character List Cards */
        <div className="grid grid-cols-1 gap-3 pb-12 min-[360px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedList.map((char) => {
            const isCreatedByMe = char.author === '@you' || activeSubTab === 'created';

            const handleDelete = isCreatedByMe
              ? (id: string, e: React.MouseEvent) => {
                  e.stopPropagation();
                  setDeletingChar({ char, action: 'delete_created' });
                }
              : undefined;

            const deleteTitle = t('my.deleteCreated');

            return (
              <CharacterCard
                key={char.id}
                character={char}
                onSelectCharacter={onSelectCharacter}
                onToggleFavorite={onToggleFavorite}
                onDelete={handleDelete}
                deleteTitle={deleteTitle}
              />
            );
          })}
        </div>
      )}

      {/* Custom Styled Delete Confirmation Modal */}
      {deletingChar && (
        <div className="mobile-touch-modal safe-area-top fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-md animate-in fade-in duration-200 safe-area-bottom sm:p-4">
          <div className="relative w-full max-w-md bg-[#161622] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-white overflow-hidden">
            
            {/* Header with Warning Icon */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                     {t('my.confirmDelete')}
                  </h3>
                   <p className="text-xs text-rose-400 font-medium">{t('my.warning')}</p>
                </div>
              </div>

              <button
                onClick={() => setDeletingChar(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Character Preview Snippet */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <img
                src={deletingChar.char.avatarThumbnail || deletingChar.char.avatar}
                onError={(event) => {
                  if (event.currentTarget.src !== deletingChar.char.avatar) event.currentTarget.src = deletingChar.char.avatar;
                }}
                alt={deletingChar.char.name}
                className="w-14 h-14 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
              <div className="space-y-0.5 overflow-hidden">
                <h4 className="font-extrabold text-sm text-white truncate">
                  {deletingChar.char.name}
                </h4>
                <p className="text-xs text-zinc-400 truncate">
                  {deletingChar.char.subtitle}
                </p>
                <span className="inline-block text-[10px] text-pink-400 bg-pink-950/80 px-2 py-0.5 rounded-md border border-pink-500/20 font-mono">
                  {deletingChar.char.category}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-xs text-rose-100 leading-relaxed bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
              {t('my.confirmDelete')}
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingChar(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                {t('my.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                 <span>{t('my.confirmDeleteButton')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
