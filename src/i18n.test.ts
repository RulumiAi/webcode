import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLocalePreference,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  initialLocale,
  normalizeLocale,
  persistLocale,
  formatRelativeTime,
  registerLocaleMessages,
  translate,
} from './i18n';
import {
  CREATE_CHARACTER_PRESET_MESSAGES,
  SHARED_CREATE_CHARACTER_PRESETS,
  getCreateArchetypeTranslationKey,
  getCreateTraitTranslationKey,
} from './data/createCharacterPresets';
import { CREATE_TAG_GROUPS } from './data/createCharacterTagCatalog';
import { CREATE_FLOW_TRANSLATIONS } from './data/createFlowTranslations';

registerLocaleMessages(CREATE_CHARACTER_PRESET_MESSAGES);
registerLocaleMessages(CREATE_FLOW_TRANSLATIONS);

function installStorage(values = new Map<string, string>()) {
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => { values.clear(); },
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  return values;
}

test('normalizes supported and browser locale variants', () => {
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('zh'), 'zh-CN');
  assert.equal(normalizeLocale('zh-TW'), 'zh-CN');
  assert.equal(normalizeLocale('ja-JP'), 'ja');
  assert.equal(normalizeLocale('ko-KR'), 'ko');
  assert.equal(normalizeLocale('es-MX'), 'es');
  assert.equal(normalizeLocale('pt-BR'), 'pt');
  assert.equal(normalizeLocale('fr-FR'), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(undefined), DEFAULT_LOCALE);
});

test('exposes complete Spanish and Portuguese homepage language copy', () => {
  for (const locale of ['es', 'pt'] as const) {
    for (const key of ['nav.upgrade', 'discover.title', 'profile.chooseLanguage', 'chat.placeholder', 'common.notifications']) {
      const value = translate(locale, key);
      assert.notEqual(value, key);
      assert.ok(value.trim());
    }
  }
});

test('restores persisted locales and defaults new visitors to English', () => {
  const values = installStorage();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { language: 'zh-CN' } });

  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(initialLocale(), 'en');
  for (const locale of SUPPORTED_LOCALES) {
    values.set(LOCALE_STORAGE_KEY, locale);
    assert.equal(initialLocale(), locale);
  }
  values.set(LOCALE_STORAGE_KEY, 'fr-FR');
  assert.equal(initialLocale(), 'en');
});

test('keeps the local locale when account synchronization fails', async () => {
  const values = installStorage();
  let activeLocale = DEFAULT_LOCALE;
  const synced = await applyLocalePreference(
    'es',
    (next) => {
      activeLocale = next;
      persistLocale(next);
    },
    async () => { throw new Error('network unavailable'); },
  );

  assert.equal(synced, false);
  assert.equal(activeLocale, 'es');
  assert.equal(values.get(LOCALE_STORAGE_KEY), 'es');
});

test('interpolates named variables and falls back to English', () => {
  assert.equal(translate('en', 'chat.thinking', { name: 'Nyx' }), 'Nyx is thinking...');
  assert.equal(translate('ja', 'common.signIn'), 'ログイン');
  assert.equal(translate('en', 'missing.translation.key'), 'missing.translation.key');
});

test('localizes chat image generation stages in every supported locale', () => {
  const expected = {
    en: ['Preparing the scene...', 'Creating the image...', 'Finishing the image...', 'Image not generated', 'Retry image'],
    'zh-CN': ['正在准备场景...', '正在生成图片...', '正在保存图片...', '图片未生成', '重新生成图片'],
    ja: ['シーンを準備しています...', '画像を生成しています...', '画像を仕上げています...', '画像を生成できませんでした', '画像を再生成'],
    ko: ['장면을 준비하는 중...', '이미지를 생성하는 중...', '이미지를 마무리하는 중...', '이미지가 생성되지 않았습니다', '이미지 다시 생성'],
  } as const;

  for (const [locale, labels] of Object.entries(expected)) {
    assert.deepEqual(
      ['chat.imagePreparing', 'chat.imageCreating', 'chat.imageSaving', 'chat.imageFailedTitle', 'chat.imageRetry'].map((key) => translate(locale as keyof typeof expected, key)),
      labels,
    );
  }
});

test('localizes chat audio actions in every supported locale', () => {
  const expected = {
    en: ['Read aloud', 'Stop reading aloud'],
    'zh-CN': ['语音朗读', '停止朗读'],
    ja: ['読み上げ', '読み上げを停止'],
    ko: ['읽어주기', '읽어주기 중지'],
  } as const;

  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    assert.deepEqual(
      ['chat.readAloud', 'chat.stopReading'].map((key) => translate(locale, key)),
      expected[locale],
    );
  }
});

test('keeps implementation details out of user-facing status copy', () => {
  const keys = [
    'chat.session', 'chat.disabled', 'chat.publicOnly', 'chat.imageSensitiveFailure', 'errors.charactersService',
    'panel.voiceApi', 'panel.voiceCatalog', 'panel.voiceHint', 'panel.voiceUnavailable',
    'detail.prompt', 'detail.noPrompt', 'detail.stCardFailed', 'profile.readOnly', 'profile.sessionRestored',
    'generator.queued', 'generator.rendering', 'generator.modeUnavailable', 'generator.submit',
    'generator.retrying', 'generator.subtitle', 'generator.task', 'generator.managed',
    'generator.stageTitle', 'generator.liveResult', 'generator.engine', 'generator.videoRendering',
  ];
  const implementationTerms = /Django|SillyTavern|Atlas|backend|后端|Thread|System Prompt|系统提示|live generation endpoint|接口只读/i;

  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const message = translate(locale, key);
      assert.notEqual(message, key);
      assert.doesNotMatch(message, implementationTerms, `${locale}:${key}`);
    }
  }
});

test('localizes the unified explore and generator filters in every supported locale', () => {
  const expected = {
    en: ['All', 'Female', 'Male', 'Non-binary', 'All styles', 'Anime', 'Realistic', 'Any age', 'Teen', 'Young', 'Adult', 'Mature'],
    'zh-CN': ['全部', '女性', '男性', '非二元', '全部画风', '二次元', '写实', '任意年龄', '青少年', '青年', '成人', '成熟'],
    ja: ['すべて', '女性', '男性', 'ノンバイナリー', 'すべての画風', 'アニメ', '写実', 'すべての年齢', 'ティーン', '若者', '成人', '熟年'],
    ko: ['전체', '여성', '남성', '논바이너리', '모든 화풍', '애니메이션', '실사', '모든 연령', '청소년', '청년', '성인', '장년'],
  } as const;
  for (const [locale, labels] of Object.entries(expected) as Array<[keyof typeof expected, readonly string[]]>) {
    const keys = [
      'discover.genderAllShort', 'discover.femaleShort', 'discover.maleShort', 'discover.nonbinaryShort',
      'discover.styleAll', 'discover.anime', 'discover.realistic', 'discover.anyAgeShort',
      'discover.ageTeen', 'discover.ageYoung', 'discover.ageAdult', 'discover.ageMatureShort',
    ];
    assert.deepEqual(keys.map((key) => translate(locale, key)), labels);
  }
});

test('localizes homepage tag groups in every supported locale', () => {
  const expected = {
    en: ['Browse tags', 'Filter tags', 'Choose one tag to filter characters', 'Current filter', 'Clear', 'All tags', 'Personality', 'Identity', 'Relationship', 'Interaction preferences'],
    'zh-CN': ['按标签筛选', '筛选标签', '选择一个标签筛选角色', '当前筛选', '清除', '全部标签', '人格', '身份', '关系', '互动偏好'],
    ja: ['タグで絞り込む', 'タグで絞り込む', 'タグを1つ選んでキャラクターを絞り込みます', '現在の絞り込み', '解除', 'すべてのタグ', '人格', '身分', '関係', '交流の好み'],
    ko: ['태그로 필터링', '태그 필터', '태그 하나를 선택해 캐릭터를 필터링하세요', '현재 필터', '해제', '모든 태그', '성격', '정체성', '관계', '상호작용 선호'],
  } as const;
  const keys = [
    'tags.select', 'tags.dialog.title', 'tags.dialog.description', 'tags.dialog.current',
    'tags.dialog.clear', 'tags.dialog.allTags', 'tags.group.personality', 'tags.group.identity',
    'tags.group.relationship', 'tags.group.interaction',
  ];
  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    assert.deepEqual(keys.map((key) => translate(locale, key)), expected[locale]);
  }
});

test('localizes voice style names and catalog metadata in every supported locale', () => {
  const keys = [
    'voice.style.femaleGirl', 'voice.style.femaleWarm',
    'voice.style.femaleCoolLady', 'voice.style.femaleDeepCeo',
    'voice.style.maleWarm', 'voice.style.maleCalm',
    'voice.style.maleTipsy', 'voice.style.maleMagnetic',
    'voice.gender.female', 'voice.gender.male',
    'voice.language.multilingual', 'voice.language.zhCN',
  ];
  const expected = {
    en: ['Girl Voice', 'Warm Voice', 'Cool Lady', 'Deep CEO', 'Warm Voice', 'Calm Voice', 'Tipsy Voice', 'Magnetic Voice', 'Female', 'Male', 'Multilingual', 'Simplified Chinese'],
    'zh-CN': ['少女音', '温柔暖声', '高冷御姐音', '深沉霸总音', '温暖音', '沉稳音', '微醺音', '磁性音', '女性', '男性', '多语言', '简体中文'],
    ja: ['少女ボイス', '優しい声', 'クールお姉さん', '低音社長', '温もりボイス', '落ち着いた声', 'ほろ酔いボイス', '魅惑の声', '女性', '男性', '多言語', '中国語（簡体字）'],
    ko: ['소녀 보이스', '따뜻한 목소리', '시크한 언니', '중후한 CEO', '따뜻한 목소리', '차분한 목소리', '살짝 취한 목소리', '매력적인 목소리', '여성', '남성', '다국어', '중국어(간체)'],
    es: ['Voz juvenil', 'Voz cálida', 'Dama fría', 'CEO de voz grave', 'Voz cálida', 'Voz serena', 'Voz embriagada', 'Voz magnética', 'Female', 'Male', 'Multilingual', 'Simplified Chinese'],
    pt: ['Voz jovem', 'Voz calorosa', 'Dama fria', 'CEO de voz grave', 'Voz calorosa', 'Voz serena', 'Voz embriagada', 'Voz magnética', 'Female', 'Male', 'Multilingual', 'Simplified Chinese'],
  } as const;
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(keys.map((key) => translate(locale, key)), expected[locale]);
  }
});

test('localizes the compact premium voice unlock action', () => {
  const expected = {
    en: 'Unlock',
    'zh-CN': '解锁',
    ja: '解除',
    ko: '잠금 해제',
    es: 'Desbloquear',
    pt: 'Desbloquear',
  } as const;

  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(translate(locale, 'panel.unlockVoiceShort'), expected[locale]);
  }
});

test('keeps payment provider names out of checkout copy', () => {
  const keys = [
    'upgrade.description', 'upgrade.checkoutReady', 'upgrade.hostedCheckoutNote',
    'upgrade.creatingOrder', 'upgrade.rechargeHint', 'upgrade.return.checking',
  ];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      assert.doesNotMatch(translate(locale, key), /paybao|zeffra/i, `${locale}:${key}`);
    }
  }
});

test('localizes every stable display tag in every supported locale', () => {
  const keys = [
    'tags.display.domme', 'tags.display.sub', 'tags.display.ntr', 'tags.display.seductress',
    'tags.display.contrast', 'tags.display.yandere', 'tags.display.onee_san', 'tags.display.sweet_pure',
  ];
  const expected = {
    en: ['Queen Domme', 'Submissive Slave', 'Betrayal / NTR', 'Insatiable Succubus', 'Stern Contrast', 'Dark Obsessive Love', 'Tipsy Onee-san', 'Devoted Pure Love'],
    'zh-CN': ['女王支配型', '顺从奴隶型', '背叛绿奴 / NTR', '索求无度魅魔', '严厉反差破防', '病态黑化狂爱', '醉意微醺御姐', '专一极致纯爱'],
    ja: ['女王様支配型', '従順な奴隷型', '裏切り・NTR', '貪欲なサキュバス', '厳格なギャップ崩壊', '病み堕ち狂愛', 'ほろ酔いお姉さん', '一途な極上純愛'],
    ko: ['여왕 지배형', '순종 노예형', '배신·NTR', '끝없는 욕망의 서큐버스', '엄격한 반전 매력', '병든 흑화 광애', '살짝 취한 연상녀', '한 사람만을 향한 극진한 순애'],
  } as const;
  for (const [locale, labels] of Object.entries(expected) as Array<[keyof typeof expected, readonly string[]]>) {
    assert.deepEqual(keys.map((key) => translate(locale, key)), labels);
  }
});

test('localizes the simplified character details labels in every supported locale', () => {
  const expected = {
    en: ['Details', 'No details provided.', 'View more', 'Collapse'],
    'zh-CN': ['\u8be6\u7ec6\u8d44\u6599', '\u6682\u65e0\u8be6\u7ec6\u8d44\u6599\u3002', '\u67e5\u770b\u66f4\u591a', '\u6536\u8d77'],
    ja: ['\u8a73\u7d30\u8cc7\u6599', '\u80cc\u666f\u30fb\u8a73\u7d30\u306f\u3042\u308a\u307e\u305b\u3093\u3002', '\u3082\u3063\u3068\u898b\u308b', '\u9589\u3058\u308b'],
    ko: ['\uc0c1\uc138 \uc815\ubcf4', '\uc0c1\uc138 \uc815\ubcf4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.', '\ub354 \ubcf4\uae30', '\uc811\uae30'],
  } as const;
  for (const [locale, labels] of Object.entries(expected) as Array<[keyof typeof expected, readonly string[]]>) {
    assert.deepEqual(['detail.info', 'detail.noDetails', 'detail.viewMore', 'detail.collapse'].map((key) => translate(locale, key)), labels);
  }
});

test('persists the selected locale', () => {
  const values = installStorage();
  persistLocale('ko');
  assert.equal(values.get(LOCALE_STORAGE_KEY), 'ko');
});

test('formats relative times with the active locale', () => {
  const now = Date.UTC(2026, 0, 2, 12, 0, 0);
  assert.equal(formatRelativeTime(now - 86_400_000, 'en', now), 'yesterday');
  assert.equal(formatRelativeTime(now + 120_000, 'en', now), 'in 2 minutes');
  assert.match(formatRelativeTime(now - 86_400_000, 'ja', now), /前|昨日/);
});

test('localizes the character review surface in every supported locale', () => {
  const keys = [
    'comments.tab',
    'comments.writeFor',
    'comments.publish',
    'comments.hot',
    'comments.newest',
    'comments.reply',
    'comments.deleteConfirm',
  ];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) assert.notEqual(translate(locale, key, { name: 'Nyx' }), key);
  }
});

test('localizes male archetypes in every supported locale', () => {
  const ids = ['dominant_alpha', 'wolf_puppy', 'stoic_scholar', 'loyal_guard', 'yandere_dominant', 'bad_boy_seduction', 'tsundere_rival', 'submissive_male'] as const;
  const expectedNames = {
    en: ['Dominant Alpha', 'Wolf & Puppy', 'Stoic Scholar', 'Loyal Guard', 'Yandere Dominant', 'Bad Boy Seduction', 'Tsundere Rival', 'Submissive Male'],
    'zh-CN': ['霸道总裁 / 强势掌控', '忠犬狼狗 / 奶狗弟弟', '禁欲高冷 / 教授医师', '忠诚保镖 / 誓死守护', '偏执病娇 / 独占黑化', '痞帅浪子 / 邪魅坏男人', '傲娇竹马 / 宿敌死对头', '顺从小奶狗 / 爱虐臣服'],
    ja: ['支配的なアルファ', '狼系ワイルド男子 / 甘えん坊', '禁欲的な知識人', '忠実な護衛', 'ヤンデレ独占支配', '悪い男の誘惑', 'ツンデレの宿敵', '従順な年下男子'],
    ko: ['지배적인 알파', '늑대남 / 응석받이 강아지', '금욕적인 학자', '충직한 경호원', '얀데레 독점 지배', '나쁜 남자의 유혹', '츤데레 라이벌', '순종적인 연하 남자'],
  } as const;
  const locales = ['en', 'zh-CN', 'ja', 'ko'] as const;
  for (const locale of locales) {
    assert.deepEqual(
      ids.map((id) => translate(locale, `create.preset.archetype.${id}.name`)),
      expectedNames[locale],
    );
    for (const id of ids) {
      const description = translate(locale, `create.preset.archetype.${id}.desc`);
      assert.notEqual(description, `create.preset.archetype.${id}.desc`);
      assert.notEqual(description, '');
    }
  }
  const chinese = expectedNames['zh-CN'].join(' ');
  assert.doesNotMatch(chinese, /Dominant Alpha|Wolf & Puppy/);
  assert.doesNotMatch(expectedNames.ja.join(' '), /霸道总裁|Dominant Alpha/);
  assert.doesNotMatch(expectedNames.ko.join(' '), /霸道总裁|Dominant Alpha/);
  assert.equal(translate('en', 'create.archetypeHint'), 'Story tropes (choose one)');
  assert.equal(translate('zh-CN', 'create.archetypeHint'), '剧情定位（选择一种）');
  assert.equal(translate('ja', 'create.archetypeHint'), '物語の展開タイプ（1つ選択）');
  assert.equal(translate('ko', 'create.archetypeHint'), '스토리 전개 유형 (하나 선택)');
});

test('localizes the step 5 archetype helper in every supported locale', () => {
  const expected = {
    en: "Choose the character's core relationship dynamic.",
    'zh-CN': '选择角色关系中的核心表现方式',
    ja: 'キャラクター関係の中心的な表現スタイルを選択',
    ko: '캐릭터 관계의 핵심 표현 방식을 선택하세요',
    es: 'Elige la dinámica central de la relación del personaje.',
    pt: 'Escolha a dinâmica central da relação do personagem.',
  } as const;

  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(translate(locale, 'create.archetypeHelper'), expected[locale]);
  }
});

test('localizes every new wizard step 4 and step 5 preset', () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const presets of [SHARED_CREATE_CHARACTER_PRESETS]) {
      for (const group of CREATE_TAG_GROUPS) {
        for (const preset of presets[group]) {
          const key = getCreateTraitTranslationKey(preset);
          const value = translate(locale, key);
          assert.notEqual(value, key);
          assert.ok(value.trim());
        }
      }
      for (const preset of presets.archetypes) {
        for (const field of ['name', 'desc'] as const) {
          const key = getCreateArchetypeTranslationKey(preset, field);
          const value = translate(locale, key);
          assert.notEqual(value, key);
          assert.ok(value.trim());
        }
      }
    }
  }
  assert.equal(translate('zh-CN', getCreateArchetypeTranslationKey(SHARED_CREATE_CHARACTER_PRESETS.archetypes[0], 'name')), '强势掌控（Dominant）');
});


test('localizes male archetype display filters in every supported locale', () => {
  const ids = ['dominant_alpha', 'wolf_puppy', 'stoic_scholar', 'loyal_guard', 'yandere_dominant', 'bad_boy_seduction', 'tsundere_rival', 'submissive_male'] as const;
  const expected = {
    en: ['Dominant Alpha', 'Wolf & Puppy', 'Stoic Scholar', 'Loyal Guard', 'Yandere Dominant', 'Bad Boy Seduction', 'Tsundere Rival', 'Submissive Male'],
    'zh-CN': ['霸道总裁 / 强势掌控', '忠犬狼狗 / 奶狗弟弟', '禁欲高冷 / 教授医师', '忠诚保镖 / 誓死守护', '偏执病娇 / 独占黑化', '痞帅浪子 / 邪魅坏男人', '傲娇竹马 / 宿敌死对头', '顺从小奶狗 / 爱虐臣服'],
    ja: ['支配的なアルファ', '狼系ワイルド男子 / 甘えん坊', '禁欲的な知識人', '忠実な護衛', 'ヤンデレ独占支配', '悪い男の誘惑', 'ツンデレの宿敵', '従順な年下男子'],
    ko: ['지배적인 알파', '늑대남 / 응석받이 강아지', '금욕적인 학자', '충직한 경호원', '얀데레 독점 지배', '나쁜 남자의 유혹', '츤데레 라이벌', '순종적인 연하 남자'],
  } as const;
  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    assert.deepEqual(ids.map((id) => translate(locale, `tags.display.${id}`)), expected[locale]);
  }
});
test('localizes wizard nickname states in every supported locale', () => {
  const expected = {
    en: ['Generating a nickname...', 'Could not generate a nickname. Try again or enter one yourself.', 'Retry nickname', 'A nickname was generated for you. You can edit it.', 'Name will be checked again when you generate the character.'],
    'zh-CN': ['正在为角色生成昵称...', '昵称生成失败，请重试或直接输入角色名。', '重试昵称', '已自动填入昵称，你仍可自由修改。', '生成角色时会再次检查名称是否重复。'],
    ja: ['ニックネームを生成中...', 'ニックネームを生成できませんでした。再試行するか、名前を入力してください。', 'ニックネームを再生成', 'ニックネームを自動入力しました。自由に編集できます。', 'キャラクター生成時に名前の重複をもう一度確認します。'],
    ko: ['닉네임 생성 중...', '닉네임을 생성하지 못했습니다. 다시 시도하거나 직접 입력하세요.', '닉네임 다시 시도', '닉네임이 자동으로 입력되었습니다. 자유롭게 수정할 수 있습니다.', '캐릭터를 생성할 때 이름 중복을 다시 확인합니다.'],
  } as const;
  const keys = ['create.nicknameLoading', 'create.nicknameError', 'create.retryNickname', 'create.nicknameAutoFilled', 'create.nameCheckWarning'];
  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    assert.deepEqual(keys.map((key) => translate(locale, key)), expected[locale]);
  }
});
test('localizes portrait progress and image recovery states in every supported locale', () => {
  const keys = ['create.imageReadyProfileGenerating', 'create.imageLoadError', 'create.retryImage'];
  for (const locale of ['en', 'zh-CN', 'ja', 'ko'] as const) {
    const values = keys.map((key) => translate(locale, key));
    assert.equal(values.length, 3);
    values.forEach((value, index) => {
      assert.notEqual(value, keys[index]);
      assert.notEqual(value, '');
    });
  }
});

test('localizes membership product copy in every supported locale', () => {
  const keys = [
    'upgrade.planSenior', 'upgrade.planDeluxe', 'upgrade.checkoutReady', 'upgrade.plansTitle',
    'upgrade.feature.imageAllowance', 'upgrade.feature.videoAllowance', 'upgrade.feature.voiceAllowance',
    'upgrade.feature.unlimitedMessages', 'upgrade.feature.advancedModels', 'upgrade.feature.chatVoiceStyles', 'upgrade.rechargeTitle',
    'upgrade.rechargeBase', 'upgrade.rechargeBonus', 'upgrade.consumptionTitle', 'upgrade.ruleVideo',
    'upgrade.rewardsTitle', 'upgrade.rewardFriendPurchase', 'upgrade.rewardsUnavailable',
    'upgrade.confirmTitle', 'upgrade.fullName', 'upgrade.phone', 'upgrade.hostedCheckoutNote',
    'upgrade.creatingOrder', 'upgrade.return.waiting', 'upgrade.return.success', 'upgrade.return.fail',
    'upgrade.amountLimit', 'upgrade.amountLimitHint', 'upgrade.amountLimitError',
    'upgrade.orderHistory', 'upgrade.merchantReference', 'upgrade.paybaoReference',
    'upgrade.orderStatus.created', 'upgrade.orderStatus.waiting', 'upgrade.orderStatus.success', 'upgrade.orderStatus.fail',
  ];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const value = translate(locale, key, { id: 'senior', amount: 'US$120.00', count: 1000 });
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
});

test('localizes the complete create flow in all six supported locales', () => {
  const keys = [
    'create.mobileEyebrow', 'create.mobileHeroPrefix', 'create.mobileHeroAccent',
    'create.styleSectionHint', 'create.genderSectionHint', 'create.raceSectionHint',
    'create.speciesSectionHint', 'create.fantasyBadge', 'create.creatorHandle',
    'create.step1', 'create.step2', 'create.step3', 'create.step4', 'create.step5', 'create.step6',
    'create.artStyle', 'create.gender', 'create.humanRaces', 'create.fantasySpecies',
    'create.skinTone', 'create.bodyBuild', 'create.faceShape', 'create.hairStyle', 'create.eyeColor',
    'create.personalityHint', 'create.occupationHint', 'create.relationshipHint', 'create.fetishHint',
    'create.name', 'create.greeting', 'create.promptLabel', 'create.generate', 'create.voiceHint',
    'create.fromImageTitle', 'create.fromImageDraftHint', 'create.fromImageCreateError',
    'create.prompt.template', 'create.prompt.unspecified', 'create.prompt.style.anime',
    'create.prompt.gender.female', 'create.prompt.field.skin', 'create.prompt.quality',
    'create.nameCheckError', 'create.errorValidation', 'create.errorUpstreamTimeout',
    'voice.style.femaleGirl', 'voice.style.maleMagnetic',
  ];

  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const value = translate(locale, key);
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }

  for (const locale of ['es', 'pt'] as const) {
    for (const key of keys.filter((key) => key !== 'create.prompt.style.anime')) {
      assert.notEqual(translate(locale, key), translate('en', key), `${locale}:${key}`);
    }
  }
});

test('keeps fixed step-four tags and image-prototype copy localized in Spanish and Portuguese', () => {
  for (const locale of ['es', 'pt'] as const) {
    for (const group of CREATE_TAG_GROUPS) {
      for (const preset of SHARED_CREATE_CHARACTER_PRESETS[group]) {
        const key = getCreateTraitTranslationKey(preset);
        assert.notEqual(translate(locale, key), key, `${locale}:${key}`);
      }
    }
    for (const key of ['create.fromImageTitle', 'create.fromImageRandomize', 'create.fromImageRetrySt']) {
      assert.notEqual(translate(locale, key), translate('en', key), `${locale}:${key}`);
    }
  }
});

test('keeps quick upgrade compact copy localized', () => {
  const keys = [
    'upgrade.quickTitleCompact',
    'generator.vipRequiredTitleCompact',
    'generator.vipRequiredDescriptionCompact',
    'generator.vipPlansTitleCompact',
    'generator.vipIncludedTitleCompact',
    'generator.keepCreatingCompact',
    'generator.upgradeToUnlockCompact',
  ];
  for (const locale of ['en', 'ja', 'ko', 'es', 'pt'] as const) {
    for (const key of keys) {
      const value = translate(locale, key);
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
  assert.notEqual(translate('zh-CN', 'generator.vipRequiredDescription'), 'generator.vipRequiredDescription');
});

test('localizes profile diamond balance in every supported locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const value = translate(locale, 'profile.diamondBalance', { count: '1,234' });
    assert.notEqual(value, 'profile.diamondBalance');
    assert.match(value, /1,234/);
  }
});

test('localizes email verification states in every supported locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of [
      'profile.verificationPending',
      'profile.resendVerification',
      'profile.resendVerificationCountdown',
      'profile.verificationEmailSent',
      'profile.verificationComplete',
      'profile.verificationFailed',
    ]) {
      const value = translate(locale, key);
      assert.notEqual(value, key);
      assert.ok(value.trim());
    }
  }
});

test('localizes public character publishing states in every supported locale', () => {
  const keys = ['create.publishToCommunity', 'create.publishSubmitting', 'create.publishPending', 'create.publishApproved', 'create.publishResubmit', 'create.publishError', 'create.publishMembershipRequired'];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const value = translate(locale, key);
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
  for (const locale of ['es', 'pt'] as const) {
    for (const key of keys) assert.notEqual(translate(locale, key), translate('en', key), `${locale}:${key}`);
  }
});

test('localizes paid Showcase media states in every supported locale', () => {
  const keys = [
    'mediaUnlock.view', 'mediaUnlock.diamonds', 'mediaUnlock.confirmTitle',
    'mediaUnlock.confirmBody', 'mediaUnlock.confirm', 'mediaUnlock.unlocking',
    'mediaUnlock.failed', 'mediaUnlock.insufficient',
  ];
  for (const locale of SUPPORTED_LOCALES) {
    for (const key of keys) {
      const value = translate(locale, key, { cost: 10, required: 10, current: 2 });
      assert.notEqual(value, key, `${locale}:${key}`);
      assert.ok(value.trim(), `${locale}:${key}`);
    }
  }
});
