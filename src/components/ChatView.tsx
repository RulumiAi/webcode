import React from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Character } from '../types';
import { useLocale } from '../i18n';

interface ChatViewProps {
  character: Character;
  onBack: () => void;
  onToggleFavorite: (characterId: string, e: React.MouseEvent) => void;
  onOpenUpgradeModal: () => void;
}

/**
 * Legacy chat entry kept for compatibility with older imports.
 * The mounted chat experience is ChatPage, which is backed by Django threads.
 */
export const ChatView: React.FC<ChatViewProps> = ({ character, onBack }) => {
  const { t } = useLocale();
  return <div className="flex-1 flex flex-col items-center justify-center bg-[#0f0f16] text-zinc-300 gap-4">
    <MessageSquare className="w-8 h-8 text-pink-400" />
    <p className="text-sm">{t('chat.disabled')}</p>
    <button
      type="button"
      onClick={onBack}
      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{character.name ? t('chat.backExplore') : t('common.back')}</span>
    </button>
  </div>;
};
