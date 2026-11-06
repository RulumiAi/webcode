import {api, ApiError, type ApiGenerationJob} from '../api';

type Listener = (job: ApiGenerationJob) => void;
type MissingListener = (jobId: string) => void;

const TERMINAL = new Set<ApiGenerationJob['status']>(['complete', 'failed', 'canceled']);
const ERROR_DELAYS = [2000, 4000, 8000, 15000] as const;

export function generationPollDelay(elapsedMs: number) {
  if (elapsedMs < 10_000) return 1000;
  if (elapsedMs < 60_000) return 2000;
  return 5000;
}

class GenerationPollingCoordinator {
  private listeners = new Map<string, Set<Listener>>();
  private missingListeners = new Map<string, Set<MissingListener>>();
  private startedAt = new Map<string, number>();
  private timer: number | null = null;
  private controller: AbortController | null = null;
  private polling = false;
  private failures = 0;

  constructor() {
    if (typeof window === 'undefined') return;
    document.addEventListener('visibilitychange', this.resume);
    window.addEventListener('online', this.resume);
    window.addEventListener('offline', this.pause);
  }

  subscribe(ids: string[], listener: Listener, onMissing?: MissingListener) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const now = Date.now();
    for (const id of uniqueIds) {
      const listeners = this.listeners.get(id) || new Set<Listener>();
      listeners.add(listener);
      this.listeners.set(id, listeners);
      if (onMissing) {
        const missing = this.missingListeners.get(id) || new Set<MissingListener>();
        missing.add(onMissing);
        this.missingListeners.set(id, missing);
      }
      if (!this.startedAt.has(id)) this.startedAt.set(id, now);
    }
    this.schedule(0);
    return () => {
      for (const id of uniqueIds) {
        const listeners = this.listeners.get(id);
        listeners?.delete(listener);
        const missing = this.missingListeners.get(id);
        if (onMissing) missing?.delete(onMissing);
        if (!listeners?.size) {
          this.listeners.delete(id);
          this.missingListeners.delete(id);
          this.startedAt.delete(id);
        }
      }
      if (!this.listeners.size) this.pause();
    };
  }

  private pause = () => {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.controller?.abort();
    this.controller = null;
  };

  private resume = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) this.schedule(0);
  };

  private schedule(delay: number) {
    if (!this.listeners.size || document.visibilityState === 'hidden' || !navigator.onLine) return;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.timer = null;
      void this.poll();
    }, delay);
  }

  private async poll() {
    if (this.polling || !this.listeners.size) return;
    this.polling = true;
    this.controller = new AbortController();
    try {
      const ids = [...this.listeners.keys()];
      for (let index = 0; index < ids.length; index += 20) {
        const result = await api.generation.jobs.status(ids.slice(index, index + 20), this.controller.signal);
        for (const job of result.items) {
          for (const listener of this.listeners.get(job.id) || []) listener(job);
          if (TERMINAL.has(job.status)) {
            this.listeners.delete(job.id);
            this.missingListeners.delete(job.id);
            this.startedAt.delete(job.id);
          }
        }
        for (const jobId of result.missingIds) {
          for (const listener of this.missingListeners.get(jobId) || []) listener(jobId);
          this.listeners.delete(jobId);
          this.missingListeners.delete(jobId);
          this.startedAt.delete(jobId);
        }
      }
      this.failures = 0;
      const oldest = Math.min(...this.startedAt.values());
      this.schedule(this.listeners.size ? generationPollDelay(Date.now() - oldest) : 0);
    } catch (reason) {
      if ((reason as {name?: string})?.name !== 'AbortError') {
        const delay = ERROR_DELAYS[Math.min(this.failures, ERROR_DELAYS.length - 1)];
        this.failures += 1;
        this.schedule(delay);
      }
    } finally {
      this.polling = false;
      this.controller = null;
      if (
        this.listeners.size
        && this.timer === null
        && document.visibilityState === 'visible'
        && navigator.onLine
      ) {
        this.schedule(0);
      }
    }
  }
}

export const generationPolling = new GenerationPollingCoordinator();

export function waitForGenerationJob(
  jobId: string,
  onUpdate?: (job: ApiGenerationJob) => void,
  signal?: AbortSignal,
) {
  return new Promise<ApiGenerationJob>((resolve, reject) => {
    let unsubscribe = () => undefined;
    const abort = () => {
      unsubscribe();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    unsubscribe = generationPolling.subscribe(
      [jobId],
      (job) => {
        onUpdate?.(job);
        if (!TERMINAL.has(job.status)) return;
        signal?.removeEventListener('abort', abort);
        unsubscribe();
        resolve(job);
      },
      () => {
        signal?.removeEventListener('abort', abort);
        unsubscribe();
        reject(new ApiError('GENERATION_NOT_FOUND', 'Generation task is unavailable.', 404));
      },
    );
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, {once: true});
  });
}
