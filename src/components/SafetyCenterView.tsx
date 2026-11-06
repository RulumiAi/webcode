import { useMemo, useState } from 'react';
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { getLegalPolicies, type LegalPolicy } from '../data/legalPolicies';
import { parseLegalDocument, renderInline, type LegalDocumentBlock } from '../utils/legalDocument';
import { useLocale } from '../i18n';

const POLICY_TITLE_KEYS: Record<LegalPolicy['id'], string> = {
  'community-guidelines': 'safety.policy.communityGuidelines',
  'complaint-policy': 'safety.policy.complaintPolicy',
  'content-moderation-policy': 'safety.policy.contentModerationPolicy',
  'content-removal-policy': 'safety.policy.contentRemovalPolicy',
  'pre-screening-and-post-screening-policy': 'safety.policy.preScreeningAndPostScreeningPolicy',
  'privacy-policy': 'safety.policy.privacyPolicy',
  'prohibited-content-policy': 'safety.policy.prohibitedContentPolicy',
  'refund-policy': 'safety.policy.refundPolicy',
  'sex-trafficking-policy': 'safety.policy.sexTraffickingPolicy',
  'terms-of-service': 'safety.policy.termsOfService',
  '18-us-c-2257-exemption': 'safety.policy.exemption2257',
  'aml-anti-fraud-policy': 'safety.policy.amlAntiFraudPolicy',
};

function PolicyBody({ policy }: { policy: LegalPolicy }) {
  const blocks = useMemo(
    () => parseLegalDocument(policy.content, policy.format),
    [policy.content, policy.format],
  );

  return (
    <div className="max-w-[78ch] space-y-5 text-[13px] leading-7 text-zinc-300 sm:text-sm">
      {blocks.map((block, index) => renderPolicyBlock(block, index, policy.id))}
    </div>
  );
}

function renderPolicyBlock(block: LegalDocumentBlock, index: number, policyId: string) {
  if (block.type === 'heading' && block.level === 1) return null;
  const key = `${policyId}-${block.type}-${index}`;

  switch (block.type) {
    case 'heading': {
      const Heading = block.level <= 2 ? 'h3' : 'h4';
      return (
        <Heading key={key} className={`${block.level <= 2 ? 'pt-3 text-lg sm:text-xl' : 'pt-1 text-base sm:text-lg'} font-black leading-tight text-white`}>
          {renderInline(block.text)}
        </Heading>
      );
    }
    case 'unordered-list':
      return (
        <ul key={key} className="list-disc space-y-2 pl-5 marker:text-pink-400">
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`} className="pl-1">{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'ordered-list':
      return (
        <ol key={key} className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-pink-300">
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`} className="pl-1">{renderInline(item)}</li>
          ))}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote key={key} className="border-l border-pink-500/50 pl-4 text-zinc-400">
          {block.lines.map((line, lineIndex) => (
            <div key={`${key}-${lineIndex}`}>{renderInline(line)}</div>
          ))}
        </blockquote>
      );
    case 'code':
      return (
        <pre key={key} className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs leading-6 text-zinc-300">
          <code>{block.lines.join('\n')}</code>
        </pre>
      );
    case 'paragraph':
      return (
        <p key={key} className={block.text.includes('\n') ? 'whitespace-pre-line' : undefined}>
          {renderInline(block.text)}
        </p>
      );
    default:
      return null;
  }
}

export const SafetyCenterView = () => {
  const { t, locale } = useLocale();
  const legalPolicies = useMemo(() => getLegalPolicies(locale), [locale]);
  const [activePolicyId, setActivePolicyId] = useState(legalPolicies[0]?.id ?? '');
  const activePolicy = legalPolicies.find((policy) => policy.id === activePolicyId) ?? legalPolicies[0];

  if (!activePolicy) return null;

  return (
    <div className="mobile-secondary-view mx-auto max-w-[1600px] space-y-6 pb-16 animate-in fade-in duration-300">
      <header className="border-b border-zinc-800 pb-5">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-pink-500/30 bg-pink-500/15 text-pink-300">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">{t('safety.title')}</h1>
              <span className="rounded-full border border-pink-500/30 bg-pink-950/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-300">
                {t('safety.badge')}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {t('safety.description')}
            </p>
          </div>
          <div className="ml-auto hidden shrink-0 items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-400 sm:flex">
            <FileText className="h-3.5 w-3.5 text-pink-400" aria-hidden="true" />
            {t('safety.policyCount', { count: legalPolicies.length })}
          </div>
        </div>
      </header>

      <div className="lg:hidden">
        <label className="block space-y-1.5 text-xs font-bold text-zinc-400" htmlFor="safety-policy-select">
          <span>{t('safety.selectPolicy')}</span>
          <select
            id="safety-policy-select"
            value={activePolicy.id}
            onChange={(event) => setActivePolicyId(event.target.value)}
            className="mobile-touch-target w-full rounded-xl border border-zinc-800 bg-[#111118] px-3.5 text-sm font-semibold text-zinc-200 focus:border-pink-500/60 focus:outline-none"
          >
            {legalPolicies.map((policy) => (
            <option key={policy.id} value={policy.id}>{t(POLICY_TITLE_KEYS[policy.id])}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <aside className="hidden space-y-4 rounded-3xl border border-zinc-800/80 bg-[#111118] p-4 shadow-xl lg:sticky lg:top-20 lg:col-span-3 lg:block">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-500">{t('safety.library')}</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">{legalPolicies.length}</span>
          </div>
          <nav aria-label={t('safety.navLabel')} className="space-y-1">
            {legalPolicies.map((policy) => {
              const isActive = policy.id === activePolicy.id;
              return (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => setActivePolicyId(policy.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`mobile-touch-target group flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all ${
                    isActive
                      ? 'border-pink-500/40 bg-gradient-to-r from-pink-950/80 to-purple-950/50 text-pink-200 shadow-md'
                      : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <span className="min-w-0 text-xs font-semibold leading-snug break-words">{t(POLICY_TITLE_KEYS[policy.id])}</span>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-pink-400' : 'text-zinc-700 opacity-0 group-hover:opacity-100'}`} aria-hidden="true" />
                </button>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0 rounded-3xl border border-zinc-800 bg-[#13131c] p-5 shadow-2xl sm:p-8 lg:col-span-9">
          <header className="mb-7 flex items-start gap-3 border-b border-zinc-800/80 pb-5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-500/25 bg-pink-500/10 text-pink-300">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="break-words text-xl font-black leading-tight text-white sm:text-2xl">{t(POLICY_TITLE_KEYS[activePolicy.id])}</h2>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-pink-400/80">{t('safety.officialDocument')}</p>
              {locale !== 'en' && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{t('safety.translationNotice')}</p>}
            </div>
          </header>
          <PolicyBody policy={activePolicy} />
        </article>
      </div>
    </div>
  );
};
