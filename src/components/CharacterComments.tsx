import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  CornerDownRight,
  Flame,
  Heart,
  LoaderCircle,
  MessageSquare,
  Send,
  Trash2,
} from 'lucide-react';
import { ApiCharacterComment, ApiError, api } from '../api';
import { useLocale } from '../i18n';
import { userErrorMessage } from '../utils/userError';

interface CharacterCommentsProps {
  characterId: string;
  characterName: string;
  commentCount: number;
  isAuthenticated: boolean;
  onRequireAuth?: () => void;
  onCommentCountChange: (characterId: string, count: number) => void;
}

type CommentSort = 'hot' | 'newest';

const mergeReplies = (...groups: ApiCharacterComment[][]) => {
  const byId = new Map<string, ApiCharacterComment>();
  groups.flat().forEach((comment) => byId.set(comment.id, comment));
  return Array.from(byId.values()).sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
};

export const CharacterComments: React.FC<CharacterCommentsProps> = ({
  characterId,
  characterName,
  commentCount,
  isAuthenticated,
  onRequireAuth,
  onCommentCountChange,
}) => {
  const { t, formatNumber, formatRelativeTime } = useLocale();
  const [sort, setSort] = useState<CommentSort>('hot');
  const [comments, setComments] = useState<ApiCharacterComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(commentCount);
  const [input, setInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, ApiCharacterComment[]>>({});
  const [replyCursors, setReplyCursors] = useState<Record<string, string | null>>({});
  const [replyHasMore, setReplyHasMore] = useState<Record<string, boolean>>({});
  const [loadedReplies, setLoadedReplies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [replyLoadErrors, setReplyLoadErrors] = useState<Record<string, string>>({});
  const [replySubmitErrors, setReplySubmitErrors] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => setDisplayCount(commentCount), [commentCount]);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    let active = true;
    setLoading(true);
    setError(null);
    setComments([]);
    setNextCursor(null);
    setHasMore(false);
    setLoadingMore(false);
    setReplies({});
    setReplyCursors({});
    setReplyHasMore({});
    setLoadedReplies(new Set());
    setExpandedReplies(new Set());
    setLoadingReplies(new Set());
    setReplyLoadErrors({});
    setReplySubmitErrors({});
    void api.comments.list(characterId, sort).then((result) => {
      if (!active || requestId.current !== currentRequest) return;
      setComments(result.items);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      if (typeof result.commentCount === 'number') {
        setDisplayCount(result.commentCount);
        onCommentCountChange(characterId, result.commentCount);
      }
    }).catch((reason) => {
      if (active && requestId.current === currentRequest) setError(userErrorMessage(reason, t, 'comments.loadFailed'));
    }).finally(() => {
      if (active && requestId.current === currentRequest) setLoading(false);
    });
    return () => { active = false; };
  }, [characterId, sort, reloadKey, onCommentCountChange, t]);

  const updateComment = (commentId: string, updater: (comment: ApiCharacterComment) => ApiCharacterComment) => {
    setComments((items) => items.map((item) => item.id === commentId ? updater(item) : item));
    setReplies((groups) => (Object.entries(groups) as Array<[string, ApiCharacterComment[]]>).reduce<Record<string, ApiCharacterComment[]>>((next, [parentId, items]) => {
      next[parentId] = items.map((item) => item.id === commentId ? updater(item) : item);
      return next;
    }, {}));
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const currentRequest = requestId.current;
    setLoadingMore(true);
    try {
      const result = await api.comments.list(characterId, sort, nextCursor);
      if (requestId.current !== currentRequest) return;
      setComments((items) => Array.from(new Map([...items, ...result.items].map((item) => [item.id, item])).values()));
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (reason) {
      if (requestId.current === currentRequest) setError(userErrorMessage(reason, t, 'comments.loadFailed'));
    } finally {
      if (requestId.current === currentRequest) setLoadingMore(false);
    }
  };

  const loadReplies = async (comment: ApiCharacterComment, cursor?: string | null) => {
    const isMore = Boolean(cursor);
    if (!isMore && loadedReplies.has(comment.id)) return;
    const currentRequest = requestId.current;
    setLoadingReplies((items) => new Set(items).add(comment.id));
    setReplyLoadErrors((items) => ({ ...items, [comment.id]: '' }));
    try {
      const result = await api.comments.replies(comment.id, cursor);
      if (requestId.current !== currentRequest) return;
      setReplies((groups) => ({
        ...groups,
        [comment.id]: isMore
          ? mergeReplies(groups[comment.id] || [], result.items)
          : mergeReplies(result.items, groups[comment.id] || []),
      }));
      setReplyCursors((items) => ({ ...items, [comment.id]: result.nextCursor }));
      setReplyHasMore((items) => ({ ...items, [comment.id]: result.hasMore }));
      if (!isMore) setLoadedReplies((items) => new Set(items).add(comment.id));
    } catch (reason) {
      if (requestId.current === currentRequest) {
        setReplyLoadErrors((items) => ({ ...items, [comment.id]: userErrorMessage(reason, t, 'comments.replyLoadFailed') }));
      }
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoadingReplies((items) => {
        const next = new Set(items);
        next.delete(comment.id);
        return next;
      });
    }
  };

  const toggleReplies = (comment: ApiCharacterComment) => {
    const shouldExpand = !expandedReplies.has(comment.id);
    setExpandedReplies((items) => {
      const next = new Set(items);
      if (next.has(comment.id)) next.delete(comment.id);
      else next.add(comment.id);
      return next;
    });
    if (shouldExpand) void loadReplies(comment);
  };

  const requireAuth = () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return false;
    }
    return true;
  };

  const submitComment = async () => {
    if (!requireAuth() || submitting || !input.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.comments.create(characterId, input.trim());
      setInput('');
      setDisplayCount(result.commentCount);
      onCommentCountChange(characterId, result.commentCount);
      setSort('newest');
      setReloadKey((value) => value + 1);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'comments.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (parent: ApiCharacterComment) => {
    if (!requireAuth() || replySubmitting || !replyInput.trim()) return;
    setReplySubmitting(true);
    setReplySubmitErrors((items) => ({ ...items, [parent.id]: '' }));
    try {
      const result = await api.comments.create(characterId, replyInput.trim(), parent.id);
      setReplyInput('');
      setReplyingTo(null);
      setReplies((groups) => ({ ...groups, [parent.id]: mergeReplies(groups[parent.id] || [], [result.comment]) }));
      setExpandedReplies((items) => new Set(items).add(parent.id));
      updateComment(parent.id, (item) => ({ ...item, replyCount: result.replyCount }));
      if (!loadedReplies.has(parent.id)) void loadReplies(parent);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setReplySubmitErrors((items) => ({ ...items, [parent.id]: userErrorMessage(reason, t, 'comments.replyFailed') }));
    } finally {
      setReplySubmitting(false);
    }
  };

  const toggleLike = async (comment: ApiCharacterComment) => {
    if (!requireAuth() || liking.has(comment.id)) return;
    setLiking((items) => new Set(items).add(comment.id));
    try {
      const result = comment.likedByMe ? await api.comments.unlike(comment.id) : await api.comments.like(comment.id);
      updateComment(comment.id, (item) => ({ ...item, likedByMe: result.liked, likeCount: result.likeCount }));
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) onRequireAuth?.();
      else setError(userErrorMessage(reason, t, 'comments.likeFailed'));
    } finally {
      setLiking((items) => {
        const next = new Set(items);
        next.delete(comment.id);
        return next;
      });
    }
  };

  const removeComment = async (comment: ApiCharacterComment) => {
    if (!requireAuth() || deleting.has(comment.id)) return;
    setDeleting((items) => new Set(items).add(comment.id));
    try {
      const result = await api.comments.remove(comment.id);
      if (comment.parentId) {
        setReplies((groups) => ({ ...groups, [comment.parentId as string]: (groups[comment.parentId as string] || []).filter((item) => item.id !== comment.id) }));
        updateComment(comment.parentId, (item) => ({ ...item, replyCount: result.replyCount }));
      } else {
        setComments((items) => items.filter((item) => item.id !== comment.id));
        setDisplayCount(result.commentCount);
        onCommentCountChange(characterId, result.commentCount);
      }
      setConfirmingDelete(null);
    } catch (reason) {
      setError(userErrorMessage(reason, t, 'comments.deleteFailed'));
    } finally {
      setDeleting((items) => {
        const next = new Set(items);
        next.delete(comment.id);
        return next;
      });
    }
  };

  const sortButtons = useMemo(() => [
    { value: 'hot' as const, label: t('comments.hot'), Icon: Flame },
    { value: 'newest' as const, label: t('comments.newest'), Icon: Clock3 },
  ], [t]);

  const renderReply = (reply: ApiCharacterComment) => (
    <div key={reply.id} className="rounded-xl border border-zinc-800/80 bg-[#10101a] p-3 sm:p-3.5">
      <div className="flex items-start gap-2.5">
        <Avatar comment={reply} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold text-zinc-100">{reply.author.displayName || reply.author.handle}</span>
            <span className="shrink-0 text-[10px] text-zinc-500">{formatRelativeTime(reply.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-300">{reply.content}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={() => setReplyingTo(reply.parentId)} className="mobile-touch-target inline-flex items-center gap-1 text-[11px] font-semibold text-pink-400 transition-colors hover:text-pink-300" aria-label={t('comments.replyTo', { name: reply.author.displayName || reply.author.handle })}>
              <CornerDownRight className="h-3.5 w-3.5" />
              <span>{t('comments.replyToShort')}</span>
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void toggleLike(reply)} disabled={liking.has(reply.id)} className={`mobile-touch-target inline-flex items-center gap-1 rounded-full px-2 text-[11px] transition-colors ${reply.likedByMe ? 'text-pink-300' : 'text-zinc-500 hover:text-pink-300'}`} aria-label={reply.likedByMe ? t('comments.unlike') : t('comments.like')}>
                <Heart className={`h-3.5 w-3.5 ${reply.likedByMe ? 'fill-current' : ''}`} />
                <span>{formatNumber(reply.likeCount)}</span>
              </button>
              {reply.isMine && <button type="button" onClick={() => setConfirmingDelete(reply.id)} className="mobile-touch-target inline-flex items-center justify-center rounded-full px-2 text-zinc-500 transition-colors hover:text-rose-300" aria-label={t('comments.delete')}><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
          {confirmingDelete === reply.id && <DeleteConfirm loading={deleting.has(reply.id)} onCancel={() => setConfirmingDelete(null)} onConfirm={() => void removeComment(reply)} t={t} />}
        </div>
      </div>
    </div>
  );

  const renderComment = (comment: ApiCharacterComment) => {
    const commentReplies = replies[comment.id] || [];
    const isExpanded = expandedReplies.has(comment.id);
    const isLoadingReplies = loadingReplies.has(comment.id);
    return (
      <article key={comment.id} className="rounded-2xl border border-pink-500/30 bg-[#1a1928] p-4 shadow-lg shadow-pink-950/10 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar comment={comment} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{comment.author.displayName || comment.author.handle}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{formatRelativeTime(comment.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void toggleLike(comment)} disabled={liking.has(comment.id)} className={`mobile-touch-target inline-flex items-center gap-1.5 rounded-full border px-3 text-xs transition-colors ${comment.likedByMe ? 'border-pink-500/50 bg-pink-500/15 text-pink-300' : 'border-zinc-700 bg-zinc-800/70 text-white/80 hover:border-pink-500/50 hover:text-pink-300'}`} aria-label={comment.likedByMe ? t('comments.unlike') : t('comments.like')}>
                  <Heart className={`h-4 w-4 ${comment.likedByMe ? 'fill-current' : ''}`} />
                  <span>{formatNumber(comment.likeCount)}</span>
                </button>
                {comment.isMine && <button type="button" onClick={() => setConfirmingDelete(comment.id)} className="mobile-touch-target inline-flex items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-rose-300" aria-label={t('comments.delete')}><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">{comment.content}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
              <button type="button" onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyInput(''); }} className="mobile-touch-target inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 transition-colors hover:text-pink-300">
                <CornerDownRight className="h-4 w-4" />
                <span>{t('comments.reply')}</span>
              </button>
              {comment.replyCount > 0 && <button type="button" onClick={() => toggleReplies(comment)} className="mobile-touch-target inline-flex items-center gap-1.5 text-xs text-cyan-300 transition-colors hover:text-cyan-200" aria-expanded={isExpanded}>
                <MessageSquare className="h-4 w-4" />
                <span>{isExpanded ? t('comments.collapseReplies') : t('comments.expandReplies', { count: comment.replyCount })}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>}
            </div>
            {confirmingDelete === comment.id && <DeleteConfirm loading={deleting.has(comment.id)} onCancel={() => setConfirmingDelete(null)} onConfirm={() => void removeComment(comment)} t={t} />}
            {replyingTo === comment.id && <>
              <ReplyComposer value={replyInput} onChange={setReplyInput} onSubmit={() => void submitReply(comment)} loading={replySubmitting} label={t('comments.replyTo', { name: comment.author.displayName || comment.author.handle })} placeholder={t('comments.replyPlaceholder')} submitLabel={t('comments.reply')} t={t} />
              {replySubmitErrors[comment.id] && <p className="mt-2 text-xs text-rose-200" role="alert">{replySubmitErrors[comment.id]}</p>}
            </>}
            {isExpanded && <div className="mt-3 space-y-2 border-l border-pink-500/30 pl-3 sm:pl-5">
              {isLoadingReplies && <div className="flex items-center gap-2 py-3 text-xs text-zinc-400"><LoaderCircle className="h-4 w-4 animate-spin text-cyan-400" />{t('comments.loading')}</div>}
              {replyLoadErrors[comment.id] && <div className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-200" role="alert"><span>{replyLoadErrors[comment.id]}</span><button type="button" onClick={() => void loadReplies(comment)} className="mobile-touch-target inline-flex items-center font-bold text-pink-300">{t('common.retry')}</button></div>}
              {commentReplies.map(renderReply)}
              {replyHasMore[comment.id] && <button type="button" onClick={() => void loadReplies(comment, replyCursors[comment.id])} disabled={isLoadingReplies} className="mobile-touch-target w-full text-center text-xs font-semibold text-pink-300 disabled:opacity-60">{t('comments.expandMoreReplies')}</button>}
            </div>}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section data-r17-comments="true" className="space-y-4" aria-labelledby={`comments-title-${characterId}`}>
      <div className="rounded-2xl border border-zinc-800/80 bg-[#181826] p-4 sm:p-5">
        <label htmlFor={`comment-input-${characterId}`} className="sr-only">{t('comments.writeFor', { name: characterName })}</label>
        <textarea
          id={`comment-input-${characterId}`}
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, 1000))}
          onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void submitComment(); }}
          rows={3}
          maxLength={1000}
          placeholder={t('comments.writeFor', { name: characterName })}
          className="w-full resize-y rounded-xl border border-pink-500/60 bg-[#0e0e17] p-3 text-sm leading-relaxed text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[10px] text-zinc-500">{input.length}/1000</span>
          <button type="button" onClick={() => void submitComment()} disabled={submitting || !input.trim()} className="mobile-touch-target inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 text-xs font-black text-white shadow-lg shadow-pink-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{t('comments.publish')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`comments-title-${characterId}`} className="flex items-center gap-2 text-base font-black text-white"><MessageSquare className="h-5 w-5 text-pink-400" />{t('comments.all', { count: formatNumber(displayCount) })}</h3>
        <div className="flex items-center rounded-xl border border-zinc-800 bg-[#161622] p-1" role="group" aria-label={t('comments.sortLabel')}>
          {sortButtons.map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => setSort(value)} aria-pressed={sort === value} className={`mobile-touch-target inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${sort === value ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/50' : 'text-white/60 hover:text-white'}`}><Icon className="h-4 w-4" /><span>{label}</span></button>)}
        </div>
      </div>

      {error && <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2.5 text-xs text-rose-200" role="alert"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mobile-touch-target inline-flex items-center font-bold text-pink-300">{t('common.retry')}</button></div>}
      {loading && <div className="space-y-3" aria-live="polite"><CommentSkeleton /><CommentSkeleton /></div>}
      {!loading && !comments.length && !error && <div className="rounded-2xl border border-dashed border-zinc-700 bg-[#151520] px-5 py-12 text-center text-sm text-zinc-400"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-600" /><p>{t('comments.noComments')}</p></div>}
      {!loading && comments.length > 0 && <div className="space-y-3">{comments.map(renderComment)}</div>}
      {hasMore && <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className="mobile-touch-target w-full rounded-xl border border-zinc-700 bg-zinc-900/60 text-xs font-bold text-zinc-300 transition-colors hover:border-pink-500/50 hover:text-pink-300 disabled:opacity-60">{loadingMore ? t('comments.loading') : t('comments.loadMore')}</button>}
    </section>
  );
};

const Avatar: React.FC<{ comment: ApiCharacterComment }> = ({ comment }) => (
  comment.author.avatar?.url ? <img src={comment.author.avatar.url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-pink-500/40" loading="lazy" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-xs font-bold text-white ring-1 ring-pink-500/40">{(comment.author.displayName || comment.author.handle || '?').slice(0, 1).toUpperCase()}</div>
);

const ReplyComposer: React.FC<{ value: string; onChange: (value: string) => void; onSubmit: () => void; loading: boolean; label: string; placeholder: string; submitLabel: string; t: (key: string) => string }> = ({ value, onChange, onSubmit, loading, label, placeholder, submitLabel, t }) => (
  <div className="mt-3 rounded-xl border border-zinc-800 bg-[#11111b] p-3">
    <label className="block"><span className="sr-only">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value.slice(0, 1000))} rows={2} maxLength={1000} placeholder={placeholder} className="w-full resize-y rounded-lg border border-zinc-700 bg-[#0e0e17] p-2.5 text-xs leading-relaxed text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/20" /></label>
    <div className="mt-2 flex justify-end"><button type="button" onClick={onSubmit} disabled={loading || !value.trim()} className="mobile-touch-target inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-3 text-[11px] font-bold text-white transition-opacity disabled:opacity-50">{loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{submitLabel}</button></div>
  </div>
);

const DeleteConfirm: React.FC<{ loading: boolean; onCancel: () => void; onConfirm: () => void; t: (key: string) => string }> = ({ loading, onCancel, onConfirm, t }) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { confirmRef.current?.focus(); }, []);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-100" role="alertdialog" aria-label={t('comments.deleteConfirm')}>
      <span>{t('comments.deleteConfirm')}</span>
      <span className="flex items-center gap-2"><button type="button" onClick={onCancel} className="mobile-touch-target px-2 text-rose-100/80">{t('common.cancel')}</button><button ref={confirmRef} type="button" onClick={onConfirm} disabled={loading} className="mobile-touch-target rounded-full bg-rose-500/80 px-3 font-bold text-white disabled:opacity-50">{loading ? t('comments.loading') : t('comments.deleteAction')}</button></span>
    </div>
  );
};

const CommentSkeleton: React.FC = () => <div className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-[#181826]" aria-hidden="true" />;
