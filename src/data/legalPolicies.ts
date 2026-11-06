import type { Locale } from '../types';
import { legalPolicyMetadata, type LegalPolicyId, type LegalPolicyMetadata } from './legalPolicyMetadata';

export type LegalPolicy = LegalPolicyMetadata & { content: string };

const policyModules = import.meta.glob('./legal-policies/*/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export function getLegalPolicies(locale: Locale): LegalPolicy[] {
  return legalPolicyMetadata.map((metadata) => {
    const key = `./legal-policies/${locale}/${metadata.sourceName}`;
    const content = policyModules[key];
    if (!content) throw new Error(`Missing legal policy document: ${key}`);
    return { ...metadata, content };
  });
}

export const legalPolicies = getLegalPolicies('en');
