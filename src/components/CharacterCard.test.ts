import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.join(import.meta.dirname, 'CharacterCard.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(import.meta.dirname, '..', 'index.css'), 'utf8');

test('explore card keeps compact summary and core stats', () => {
  assert.match(source, /mobilePresentation === 'explore' \? 'truncate' : 'line-clamp-2'/);
  assert.match(source, /mobile-explore-card-description[^\n]*mobilePresentation === 'explore'/);
  assert.match(styles, /\.mobile-explore-card-description \{\s*min-height: 1\.25em;\s*-webkit-line-clamp: 1;/);
  assert.match(source, /formatNumber\(character\.likes\)/);
  assert.match(source, /formatNumber\(character\.chatCount\)/);
  assert.match(source, /character\.ageStatus/);
  assert.doesNotMatch(source, /mobile-explore-card-tags/);
  assert.doesNotMatch(source, /mobile-explore-comment-stat/);
  assert.doesNotMatch(source, /summarizeCreateStepFourDisplayTags/);
});

test('card uses article with sibling native controls instead of nested interactive content', () => {
  assert.match(source, /<article\s/);
  assert.doesNotMatch(source, /role="button"/);
  assert.doesNotMatch(source, /tabIndex=\{0\}/);
  assert.match(source, /<button[\s\S]*?aria-label=\{`\$\{t\('detail\.profile'\)\}: \$\{character\.name\}`\}/);
  assert.match(source, /title=\{deleteTitle \|\| t\('card\.removeCharacter'\)\}/);
  assert.match(source, /title=\{character\.isFavorite \? t\('card\.removeFavorite'\) : t\('card\.addFavorite'\)\}/);
});

test('thumbnail failure falls back to the original image without srcSet', () => {
  assert.match(source, /const \[useOriginalImage, setUseOriginalImage\] = useState\(false\)/);
  assert.match(source, /src=\{useOriginalImage \? character\.avatar/);
  assert.match(source, /srcSet=\{!useOriginalImage && character\.avatarThumbnailLarge/);
  assert.match(source, /if \(!useOriginalImage && character\.avatar\) setUseOriginalImage\(true\)/);
});

test('hover video mounts only for an interacted visible card and resets on leave', () => {
  assert.match(source, /const cardRef = useRef<HTMLElement>\(null\)/);
  assert.match(source, /new IntersectionObserver\(\(\[entry\]\) => \{[\s\S]*?setIsCardVisible\(entry\.isIntersecting\)/);
  assert.match(source, /\{isHovered && isCardVisible && videoPreviewUrl && \(/);
  assert.match(source, /preload="auto"/);
  assert.match(source, /poster=\{character\.videos\?\.\[0\]\?\.coverUrl \|\| character\.avatarThumbnailLarge/);
  assert.match(source, /video\.pause\(\);\s*video\.removeAttribute\('src'\);\s*video\.load\(\);/);
  assert.doesNotMatch(source, /autoPlay/);
  assert.doesNotMatch(source, /video\.currentTime = 0;\s*void video\.play/);
});

test('hover does not add a colored card border or shadow', () => {
  assert.match(source, /border border-zinc-800\/80/);
  assert.doesNotMatch(source, /hover:border-pink-500/);
  assert.doesNotMatch(source, /hover:shadow-pink-500/);
  assert.match(source, /focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-\[#13131a\]/);
});
