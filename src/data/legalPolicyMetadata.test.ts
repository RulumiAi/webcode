import assert from 'node:assert/strict';
import test from 'node:test';
import { legalPolicyMetadata } from './legalPolicyMetadata';
import { parseLegalDocument } from '../utils/legalDocument';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('lists all legal policies in the requested order', () => {
  assert.equal(legalPolicyMetadata.length, 12);
  assert.deepEqual(
    legalPolicyMetadata.map((policy) => policy.title),
    [
      'Community Guidelines',
      'Complaint Policy',
      'Content Moderation Policy',
      'Content Removal Policy',
      'Pre-Screening and Post-Screening Policy',
      'Privacy Policy',
      'Prohibited Content Policy',
      'Refund Policy',
      'Sex Trafficking and Sexual Exploitation Policy',
      'Terms of Service',
      '18 U.S.C. Sections 2257 and 2257A Notice',
      'Payments Integrity and Anti-Fraud Policy',
    ],
  );
  assert.equal(new Set(legalPolicyMetadata.map((policy) => policy.id)).size, 12);
});

test('keeps text policies readable when the source has no blank lines', () => {
  const blocks = parseLegalDocument([
    'Community Guidelines',
    'Last Modified: June 28, 2026',
    'Prohibited Content and Conduct',
    'The following categories are prohibited:',
    'First prohibited item;',
    'Second prohibited item;',
    'Contact Us',
    'LUDORIA STUDIO PTE. LTD.',
  ].join('\n'), 'text');

  assert.deepEqual(
    blocks.map((block) => block.type),
    ['heading', 'paragraph', 'heading', 'paragraph', 'unordered-list', 'heading', 'paragraph'],
  );
});

test('ships twelve markdown policies for every supported locale', () => {
  const policyDirectory = resolve(process.cwd(), 'src/data/legal-policies');
  const locales = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'];
  const legacyCompanyPattern = new RegExp(['dig', 'sure', ' limited'].join(''), 'i');
  for (const locale of locales) {
    const policyFiles = readdirSync(resolve(policyDirectory, locale)).filter((file) => /\.md$/i.test(file));
    assert.equal(policyFiles.length, 12, locale);
    for (const file of policyFiles) {
      const source = readFileSync(resolve(policyDirectory, locale, file), 'utf8');
      assert.ok(source.trim(), `${locale}/${file}`);
      assert.doesNotMatch(source, legacyCompanyPattern, `${locale}/${file}`);
      assert.match(source, /LUDORIA STUDIO PTE\. LTD\./, `${locale}/${file}`);
      assert.match(source, /2026/, `${locale}/${file}`);
    }
  }
});

test('uses the same English policy body for every locale', () => {
  const policyDirectory = resolve(process.cwd(), 'src/data/legal-policies');
  const englishDirectory = resolve(policyDirectory, 'en');
  const locales = ['zh-CN', 'ja', 'ko', 'es', 'pt'];
  for (const file of readdirSync(englishDirectory).filter((name) => name.endsWith('.md'))) {
    const english = readFileSync(resolve(englishDirectory, file), 'utf8');
    for (const locale of locales) {
      assert.equal(readFileSync(resolve(policyDirectory, locale, file), 'utf8'), english, `${locale}/${file}`);
    }
  }
});

test('English policy set uses supplied September 1, 2026 documents', () => {
  const policyDirectory = resolve(process.cwd(), 'src/data/legal-policies/en');
  for (const file of readdirSync(policyDirectory).filter((name) => name.endsWith('.md'))) {
    assert.match(readFileSync(resolve(policyDirectory, file), 'utf8'), /Last updated:\s*September 1, 2026/i, file);
  }
});
