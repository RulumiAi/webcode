export type LegalPolicyFormat = 'markdown';

export type LegalPolicyId =
  | 'community-guidelines'
  | 'complaint-policy'
  | 'content-moderation-policy'
  | 'content-removal-policy'
  | 'pre-screening-and-post-screening-policy'
  | 'privacy-policy'
  | 'prohibited-content-policy'
  | 'refund-policy'
  | 'sex-trafficking-policy'
  | 'terms-of-service'
  | '18-us-c-2257-exemption'
  | 'aml-anti-fraud-policy';

export interface LegalPolicyMetadata {
  id: LegalPolicyId;
  title: string;
  sourceName: string;
  format: LegalPolicyFormat;
}

export const legalPolicyMetadata: LegalPolicyMetadata[] = [
  { id: 'community-guidelines', title: 'Community Guidelines', sourceName: '01-community-guidelines.md', format: 'markdown' },
  { id: 'complaint-policy', title: 'Complaint Policy', sourceName: '02-complaint-policy.md', format: 'markdown' },
  { id: 'content-moderation-policy', title: 'Content Moderation Policy', sourceName: '03-content-moderation-policy.md', format: 'markdown' },
  { id: 'content-removal-policy', title: 'Content Removal Policy', sourceName: '04-content-removal-policy.md', format: 'markdown' },
  { id: 'pre-screening-and-post-screening-policy', title: 'Pre-Screening and Post-Screening Policy', sourceName: '05-pre-screening-and-post-screening-policy.md', format: 'markdown' },
  { id: 'privacy-policy', title: 'Privacy Policy', sourceName: '06-privacy-policy.md', format: 'markdown' },
  { id: 'prohibited-content-policy', title: 'Prohibited Content Policy', sourceName: '07-prohibited-content-policy.md', format: 'markdown' },
  { id: 'refund-policy', title: 'Refund Policy', sourceName: '08-refund-policy.md', format: 'markdown' },
  { id: 'sex-trafficking-policy', title: 'Sex Trafficking and Sexual Exploitation Policy', sourceName: '09-sex-trafficking-policy.md', format: 'markdown' },
  { id: 'terms-of-service', title: 'Terms of Service', sourceName: '10-terms-of-service.md', format: 'markdown' },
  { id: '18-us-c-2257-exemption', title: '18 U.S.C. Sections 2257 and 2257A Notice', sourceName: '11-18-usc-2257-notice.md', format: 'markdown' },
  { id: 'aml-anti-fraud-policy', title: 'Payments Integrity and Anti-Fraud Policy', sourceName: '12-payments-integrity-and-anti-fraud-policy.md', format: 'markdown' },
];
