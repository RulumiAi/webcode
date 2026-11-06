import {EXTRA_LANGUAGE_KEY,extraLegacy} from './r12Text';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from './types';
import { CHARACTER_FILTER_TAG_SLUGS } from './filterTags';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt'];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'soulmingle-locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English (US)',
  'zh-CN': '中文 (简体)',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  pt: 'Português',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '/flags/us.svg',
  'zh-CN': '/flags/cn.svg',
  ja: '/flags/jp.svg',
  ko: '/flags/kr.svg',
  es: '/flags/es.svg',
  pt: '/flags/br.svg',
};

type MessageMap = Record<string, string>;
export type TranslationParams = Record<string, string | number>;
export type DateValue = string | number | Date;

const en: MessageMap = {
  'create.nameTaken': 'This character name is already in use. Please choose another.',
  'create.nameCheckWarning': 'Name will be checked again when you generate the character.',
  'brand.tagline': 'Stories that answer back.',
  'nav.explore': 'Explore', 'nav.chat': 'Chat', 'nav.generate': 'Generate', 'nav.myCharacters': 'My characters',
  'nav.feed': 'Feed', 'nav.community': 'Trending', 'nav.referral': 'Rewards', 'nav.help': 'Help', 'nav.safety': 'Safety',
  'nav.create': 'Create', 'nav.more': 'More', 'nav.profile': 'Profile & settings', 'nav.upgrade': 'Upgrade VIP', 'nav.buyDiamonds': 'Buy diamonds',
  'nav.hot': 'HOT', 'nav.new': 'NEW', 'nav.gems': 'Gems',
  'common.signIn': 'Sign in', 'common.joinFree': 'Join free', 'common.close': 'Close', 'common.cancel': 'Cancel',
  'common.save': 'Save', 'common.clear': 'Clear', 'common.reset': 'Reset filters', 'common.retry': 'Retry',
  'common.loading': 'Loading', 'common.send': 'Send', 'common.apply': 'Apply', 'common.back': 'Back', 'common.next': 'Next',
  'common.all': 'All', 'common.yes': 'Yes', 'common.no': 'No', 'common.done': 'Done', 'common.delete': 'Delete',
  'common.search': 'Search', 'common.selected': 'Selected', 'common.none': 'None', 'common.online': 'Online',
  'common.justNow': 'Just now', 'common.follow': 'Follow', 'common.following': 'Following', 'common.like': 'Like', 'common.liked': 'Liked',
  'common.account': 'Account', 'common.unknownError': 'Something went wrong. Please try again.',
  'discover.eyebrow': 'Character library', 'discover.title': 'Discover characters',
  'discover.subtitle': 'Find intriguing characters and continue your story at your own pace.',
  'discover.search': 'Search names, descriptions, moods, or scenarios...', 'discover.featured': 'Featured characters',
  'discover.myCollection': 'My favorites & creations', 'discover.clearFilters': 'Clear current filters',
  'discover.sort.trending': '🔥 Trending', 'discover.sort.newest': '✨ Newest', 'discover.sort.popular': '⭐ Most popular',
  'discover.gender': 'Gender', 'discover.genderAll': 'All genders', 'discover.female': 'Female', 'discover.male': 'Male',
  'discover.nonbinary': 'Non-binary', 'discover.style': 'Style', 'discover.styleAll': 'All styles', 'discover.anime': 'Anime',
  'discover.realistic': 'Realistic', 'discover.age': 'Age', 'discover.anyAge': 'Any age',
  'discover.ageTeen': '18 - 20', 'discover.ageYoung': '21 - 25', 'discover.ageAdult': '26 - 29', 'discover.ageMature': '30+',
  'discover.filterCharacters': 'Filter characters', 'discover.moreFilters': 'More filters', 'discover.filterHint': 'Choose conditions to update the list.',
  'discover.noResults': 'No characters match those filters.', 'discover.noResultsHint': 'Try another keyword or reset the filters.',
  'discover.loadingCharacters': 'Loading characters', 'discover.loadingHint': 'Reading public content from the character library...',
  'discover.loadFailed': 'Unable to load characters', 'discover.reload': 'Reload',
  'chat.conversations': 'Conversations', 'chat.new': 'Choose a character to start a new story.', 'chat.placeholder': 'Write your reply...',
  'chat.thinking': '{{name}} is thinking...', 'chat.clear': 'Clear conversation', 'chat.clearConfirm': 'Clear this conversation?',
  'chat.noMessages': 'No messages yet.', 'chat.session': 'Django chat session', 'chat.unavailable': 'This character is unavailable.',
  'chat.regenerate': 'Regenerate response', 'chat.continue': 'Continue with next reply',
  'chat.regenerateError': 'Could not regenerate this reply. Please try again.', 'chat.regenerateEmptyError': 'Regeneration returned no content. The original reply was kept. Please try again.', 'chat.continueError': 'Could not generate the next reply. Please try again.',
  'profile.title': 'Profile & settings', 'profile.overview': 'Profile overview', 'profile.accountLogin': 'Account & login',
  'profile.language': 'Language preference', 'profile.terms': 'Legal terms', 'profile.accountStatus': 'Account status',
  'profile.visibility': 'Profile visibility', 'profile.private': 'Private', 'profile.public': 'Public',
  'profile.notifications': 'Notifications', 'profile.enabled': 'Enabled', 'profile.disabled': 'Disabled',
  'profile.readOnly': 'This setting is currently read-only.', 'profile.credentials': 'Login credentials', 'profile.sessionRestored': 'Session restored',
  'profile.currentLanguage': 'Current language', 'profile.chooseLanguage': 'Choose interface language',
  'profile.languageHint': 'The interface changes immediately. Your choice is saved on this device and synced to your account.',
  'profile.languageSaved': 'Language preference saved.', 'profile.languageSaveFailed': 'Saved on this device, but could not sync to your account.',
  'profile.notSet': 'Not set', 'profile.logout': 'Sign out securely', 'profile.loggingOut': 'Signing out...',
  'profile.logoutFailed': 'Sign out failed. Please try again.', 'profile.close': 'Close profile', 'profile.legalCenter': 'mio Trust & Safety Center',
  'profile.changeAvatar': 'Change profile picture', 'profile.avatarUploading': 'Uploading profile picture...',
  'profile.avatarTypeError': 'Choose a valid JPG, PNG, or WebP image.', 'profile.avatarSizeError': 'Profile picture must be 10 MB or smaller.',
  'profile.avatarDimensionsError': 'Profile picture dimensions cannot exceed 8192 pixels.', 'profile.avatarUploadFailed': 'Could not update the profile picture. Please try again.',
  'auth.welcome': 'Welcome back', 'auth.register': 'Join mio', 'auth.reset': 'Reset password',
  'auth.registerHint': 'Create an account to keep your favorites and chats.', 'auth.email': 'Email address', 'auth.password': 'Password',
  'auth.displayName': 'Display name', 'auth.continue': 'Continue', 'auth.login': 'Sign in', 'auth.join': 'Join free',
  'auth.google': 'Continue with Google', 'auth.terms': 'By continuing, you agree to the Terms and Privacy Policy.',
  'mobile.moreTitle': 'More features', 'mobile.moreHint': 'Access all mio features', 'mobile.mainNavigation': 'Mobile main navigation',
  'mobile.closeMore': 'Close more menu', 'mobile.openProfile': 'Open profile, account, and language settings',
  'tags.following': 'Following', 'tags.all': 'All',
  'generator.close': 'Close generator', 'generator.leftTemplate': 'Switch template left', 'generator.rightTemplate': 'Switch template right',
  'generator.left': 'Previous', 'generator.right': 'Next', 'generator.searchCharacter': 'Search character cards',
  'generator.allCharacters': 'All characters', 'generator.createdCharacters': 'Created', 'generator.likedCharacters': 'Liked',
  'generator.loadedAll': 'All character cards loaded', 'generator.noImage': 'No cover image available',
  'create.namePlaceholder': 'Enter a character name', 'create.subtitlePlaceholder': 'A short character hook...',
  'create.descriptionPlaceholder': 'Describe the character background, desires, and setting...', 'create.greetingPlaceholder': 'The opening message for the first chat...',
  'create.retryVoices': 'Retry', 'create.loadingVoices': 'Loading voice catalog...', 'create.noSummary': 'One-line description...',
  'notification.all': 'All ({{count}})', 'notification.markAllRead': 'Mark all as read', 'notification.clearAll': 'Clear all notifications',
  'feed.myFollowing': '❤️ Following ({{count}})', 'community.all': '🌟 All featured works', 'community.myFollowing': '❤️ Following ({{count}})',
  'errors.followUnavailable': 'This creator cannot be followed right now.', 'errors.followFailed': 'Follow action failed. Please try again.',
  'errors.characterUnavailable': 'This character is unavailable.', 'errors.characterDetails': 'Character details could not be loaded.',
  'errors.profilePrivate': 'This creator profile is private or unavailable.', 'errors.profileLoad': 'Creator profile could not be loaded.',
  'errors.favoriteFailed': 'Favorite action failed. Please try again.', 'errors.notifications': 'Notification update failed. Please try again.',
  'errors.charactersService': 'Unable to connect to the character service. Check that Django is running.',
  'errors.chatLoad': 'Unable to load chat sessions.', 'errors.createdLoad': 'Unable to load your characters.',
  'errors.localeNetwork': 'Language saved on this device, but could not sync to your account.',
  'safety.title': 'Trust & Safety', 'safety.center': 'Safety Center', 'safety.policies': 'Safety policies',
  'help.title': 'How can we help?', 'community.title': 'Creator community', 'referral.title': 'Rewards',
  'common.scrollLeft': 'Scroll left', 'common.scrollRight': 'Scroll right', 'common.expandSidebar': 'Expand sidebar', 'common.collapseSidebar': 'Collapse sidebar',
};

const zh: MessageMap = {
  'create.nameTaken': '这个角色名字已存在，请修改后再继续。',
  'create.nameCheckWarning': '生成角色时会再次检查名称是否重复。',
  'chat.regenerate': '重新发送', 'chat.continue': '继续下一条',
  'chat.regenerateError': '重新生成失败，请重试。', 'chat.regenerateEmptyError': '重新生成未返回内容，已保留原回复，请重试。', 'chat.continueError': '生成下一条失败，请重试。',
  'brand.tagline': '让故事回应你。',
  'nav.explore': '探索', 'nav.chat': '聊天', 'nav.generate': '生成', 'nav.myCharacters': '我的角色', 'nav.feed': '动态广场',
  'nav.community': '人气', 'nav.referral': '推荐有礼', 'nav.help': '帮助台', 'nav.safety': '安全中心', 'nav.create': '创建',
  'nav.more': '更多', 'nav.profile': '个人资料与设置', 'nav.upgrade': '升级 VIP', 'nav.buyDiamonds': '购买钻石', 'nav.hot': '热门', 'nav.new': '最新', 'nav.gems': '宝石',
  'common.signIn': '登录', 'common.joinFree': '免费加入', 'common.close': '关闭', 'common.cancel': '取消', 'common.save': '保存',
  'common.clear': '清除', 'common.reset': '重置筛选', 'common.retry': '重试', 'common.loading': '加载中', 'common.send': '发送',
  'common.apply': '应用筛选', 'common.back': '返回', 'common.next': '下一步', 'common.all': '全部', 'common.yes': '是', 'common.no': '否',
  'common.done': '完成关闭', 'common.delete': '删除', 'common.search': '搜索', 'common.selected': '已选择', 'common.none': '未选择',
  'common.online': '在线中', 'common.justNow': '刚刚', 'common.follow': '关注', 'common.following': '已关注', 'common.like': '点赞', 'common.liked': '已赞',
  'common.account': '账户', 'common.unknownError': '操作失败，请稍后重试。',
  'discover.eyebrow': '角色库', 'discover.title': '发现角色', 'discover.subtitle': '找到感兴趣的角色，按自己的节奏继续故事。',
  'discover.search': '搜索角色名称、描述、氛围或场景...', 'discover.featured': '热门推介角色', 'discover.myCollection': '我的收藏与创作',
  'discover.clearFilters': '清除当前筛选', 'discover.sort.trending': '🔥 热门趋势', 'discover.sort.newest': '✨ 最新发布', 'discover.sort.popular': '⭐ 最受欢迎',
  'discover.gender': '性别', 'discover.genderAll': '全部性别', 'discover.female': '女性', 'discover.male': '男性', 'discover.nonbinary': '非二元',
  'discover.style': '画风', 'discover.styleAll': '全部画风', 'discover.anime': '二次元', 'discover.realistic': '写实画风',
  'discover.age': '年龄', 'discover.anyAge': '任意年龄', 'discover.ageTeen': '18 - 20 岁', 'discover.ageYoung': '21 - 25 岁', 'discover.ageAdult': '26 - 29 岁', 'discover.ageMature': '30 岁及以上',
  'discover.filterCharacters': '筛选角色', 'discover.moreFilters': '更多筛选', 'discover.filterHint': '选择条件后立即更新角色列表。', 'discover.noResults': '未找到匹配的角色',
  'discover.noResultsHint': '尝试调整搜索关键词、分类标签或筛选条件。', 'discover.loadingCharacters': '正在加载角色', 'discover.loadingHint': '正在从角色库读取公开内容...',
  'discover.loadFailed': '角色加载失败', 'discover.reload': '重新加载',
  'chat.conversations': '聊天会话', 'chat.new': '选择一个角色，开始新的故事。', 'chat.placeholder': '写下你的回复...', 'chat.thinking': '{{name}} 正在思考回复...',
  'chat.clear': '清空聊天', 'chat.clearConfirm': '确定清空这段聊天吗？', 'chat.noMessages': '还没有消息。', 'chat.session': 'Django 聊天会话', 'chat.unavailable': '该角色当前不可用。',
  'profile.title': '个人资料与设置', 'profile.overview': '个人概览', 'profile.accountLogin': '账户与登录方式', 'profile.language': '语言偏好', 'profile.terms': '法律条款',
  'profile.accountStatus': '账号状态', 'profile.visibility': '资料可见性', 'profile.private': '私密', 'profile.public': '公开', 'profile.notifications': '通知设置',
  'profile.enabled': '已开启', 'profile.disabled': '已关闭', 'profile.readOnly': '当前接口只读显示。', 'profile.credentials': '登录凭证', 'profile.sessionRestored': 'Session 已恢复',
  'profile.currentLanguage': '当前语言偏好', 'profile.chooseLanguage': '选择界面语言', 'profile.languageHint': '界面会立即切换，选择会保存在此设备，并同步到当前账户。',
  'profile.languageSaved': '语言偏好已保存。', 'profile.languageSaveFailed': '语言已保存在此设备，但未能同步到当前账户。', 'profile.notSet': '未设置',
  'profile.logout': '安全退出登录', 'profile.loggingOut': '正在退出...', 'profile.logoutFailed': '退出登录失败，请稍后重试。', 'profile.close': '关闭个人资料', 'profile.legalCenter': 'mio 社区信任与安全中心',
  'profile.changeAvatar': '修改头像', 'profile.avatarUploading': '正在上传头像...',
  'profile.avatarTypeError': '请选择有效的 JPG、PNG 或 WebP 图片。', 'profile.avatarSizeError': '头像文件不能超过 10 MB。',
  'profile.avatarDimensionsError': '头像图片边长不能超过 8192 像素。', 'profile.avatarUploadFailed': '头像修改失败，请重试。',
  'auth.welcome': '欢迎回来', 'auth.register': '加入 mio', 'auth.reset': '重置密码', 'auth.registerHint': '创建账号，保存你的收藏与聊天记录。',
  'auth.email': '邮箱地址', 'auth.password': '密码', 'auth.displayName': '显示名称', 'auth.continue': '继续', 'auth.login': '登录', 'auth.join': '免费加入', 'auth.google': '使用 Google 继续',
  'auth.terms': '继续即表示你同意服务条款和隐私政策。',
  'mobile.moreTitle': '更多功能', 'mobile.moreHint': '访问全部 mio 功能', 'mobile.mainNavigation': '移动端主导航', 'mobile.closeMore': '关闭更多菜单', 'mobile.openProfile': '点击查看个人资料、账号与语言设置',
  'tags.following': '我的关注', 'tags.all': '全部', 'generator.close': '关闭生成器', 'generator.leftTemplate': '向左切换模板', 'generator.rightTemplate': '向右切换模板',
  'generator.left': '向左切换', 'generator.right': '向右切换', 'generator.searchCharacter': '搜索角色卡', 'generator.allCharacters': '全部角色', 'generator.createdCharacters': '已创建', 'generator.likedCharacters': '已点赞',
  'generator.loadedAll': '已加载全部角色卡', 'generator.noImage': '无可用主图', 'create.namePlaceholder': '请输入角色名', 'create.subtitlePlaceholder': '例如：锁紧卧室大门的黑丝女仆，今晚只为你一人服务...',
  'create.descriptionPlaceholder': '描述角色的过去故事、隐秘欲望与沉浸式背景...', 'create.greetingPlaceholder': '例如：*轻将卧室门上锁，红润的唇靠近你耳边* “主人...今晚没有我的允许，你哪里都不准去哦~”',
  'create.retryVoices': '重试', 'create.loadingVoices': '正在加载语音目录...', 'create.noSummary': '一句话简介...', 'notification.all': '全部 ({{count}})', 'notification.markAllRead': '标记全部已读', 'notification.clearAll': '清空所有通知',
  'feed.myFollowing': '❤️ 我的关注 ({{count}})', 'community.all': '🌟 全部推荐作品', 'community.myFollowing': '❤️ 我的关注 ({{count}})',
  'errors.followUnavailable': '该创作者当前不可关注。', 'errors.followFailed': '关注操作失败，请稍后重试。', 'errors.characterUnavailable': '该角色当前不可用。',
  'errors.characterDetails': '角色详情加载失败，请稍后重试。', 'errors.profilePrivate': '该创作者资料为私密状态或当前不可用。', 'errors.profileLoad': '创作者资料加载失败，请稍后重试。',
  'errors.favoriteFailed': '收藏操作失败，请稍后重试。', 'errors.notifications': '通知状态更新失败，请稍后重试。', 'errors.charactersService': '无法连接到角色服务，请检查 Django 是否已启动。',
  'errors.chatLoad': '无法加载聊天会话。', 'errors.createdLoad': '我的角色加载失败，请稍后重试。', 'errors.localeNetwork': '语言已保存在此设备，但未能同步到当前账户。',
  'safety.title': '信任与安全', 'safety.center': '安全中心', 'safety.policies': '安全政策', 'help.title': '需要什么帮助？', 'community.title': '创作者社区', 'referral.title': '推荐有礼',
  'common.scrollLeft': '向左滚动', 'common.scrollRight': '向右滚动', 'common.expandSidebar': '展开侧边栏', 'common.collapseSidebar': '折叠侧边栏',
};

const ja: MessageMap = {
  'create.nameTaken': 'このキャラクター名は既に使われています。別の名前を入力してください。',
  'create.nameCheckWarning': 'キャラクター生成時に名前の重複をもう一度確認します。',
  'chat.regenerate': '返信を再生成', 'chat.continue': '次の返信を続ける',
  'chat.regenerateError': '返信を再生成できませんでした。もう一度お試しください。', 'chat.regenerateEmptyError': '再生成された内容が返されなかったため、元の返信を保持しました。もう一度お試しください。', 'chat.continueError': '次の返信を生成できませんでした。もう一度お試しください。',
  'brand.tagline': '物語が、あなたに応える。', 'nav.explore': '探索', 'nav.chat': 'チャット', 'nav.generate': '生成', 'nav.myCharacters': 'マイキャラクター',
  'nav.feed': 'フィード', 'nav.community': '人気', 'nav.referral': '特典', 'nav.help': 'ヘルプ', 'nav.safety': '安全センター', 'nav.create': '作成', 'nav.more': 'その他', 'nav.profile': 'プロフィール設定', 'nav.upgrade': 'VIPにアップグレード', 'nav.buyDiamonds': 'ジェムを購入', 'nav.hot': '人気', 'nav.new': '新着', 'nav.gems': 'ジェム',
  'common.signIn': 'ログイン', 'common.joinFree': '無料登録', 'common.close': '閉じる', 'common.cancel': 'キャンセル', 'common.save': '保存', 'common.clear': 'クリア', 'common.reset': 'フィルターをリセット', 'common.retry': '再試行', 'common.loading': '読み込み中', 'common.send': '送信', 'common.apply': '適用', 'common.back': '戻る', 'common.next': '次へ', 'common.all': 'すべて', 'common.yes': 'はい', 'common.no': 'いいえ', 'common.done': '完了', 'common.delete': '削除', 'common.search': '検索', 'common.selected': '選択済み', 'common.none': '未選択', 'common.online': 'オンライン', 'common.justNow': 'たった今', 'common.follow': 'フォロー', 'common.following': 'フォロー中', 'common.like': 'いいね', 'common.liked': 'いいね済み', 'common.account': 'アカウント', 'common.unknownError': '問題が発生しました。もう一度お試しください。',
  'discover.eyebrow': 'キャラクターライブラリ', 'discover.title': 'キャラクターを探す', 'discover.subtitle': 'お気に入りのキャラクターと、自分のペースで物語を続けましょう。', 'discover.search': '名前、説明、雰囲気、シーンを検索...', 'discover.featured': 'おすすめキャラクター', 'discover.myCollection': 'お気に入りと作成したキャラクター', 'discover.clearFilters': '現在のフィルターをクリア', 'discover.sort.trending': '🔥 人気トレンド', 'discover.sort.newest': '✨ 新着', 'discover.sort.popular': '⭐ 人気順', 'discover.gender': '性別', 'discover.genderAll': 'すべての性別', 'discover.female': '女性', 'discover.male': '男性', 'discover.nonbinary': 'ノンバイナリー', 'discover.style': '画風', 'discover.styleAll': 'すべての画風', 'discover.anime': 'アニメ風', 'discover.realistic': 'リアル', 'discover.fantasy': 'ファンタジー', 'discover.age': '年齢', 'discover.anyAge': 'すべての年齢', 'discover.ageTeen': '18〜20歳', 'discover.ageYoung': '21〜25歳', 'discover.ageAdult': '26〜29歳', 'discover.ageMature': '30歳以上', 'discover.filterCharacters': 'キャラクターを絞り込む', 'discover.moreFilters': 'その他の絞り込み', 'discover.filterHint': '条件を選ぶと一覧が更新されます。', 'discover.noResults': '条件に一致するキャラクターがありません', 'discover.noResultsHint': 'キーワードを変えるか、フィルターをリセットしてください。', 'discover.loadingCharacters': 'キャラクターを読み込み中', 'discover.loadingHint': '公開コンテンツを読み込んでいます...', 'discover.loadFailed': 'キャラクターを読み込めませんでした', 'discover.reload': '再読み込み',
  'chat.conversations': 'チャット', 'chat.new': 'キャラクターを選んで新しい物語を始めましょう。', 'chat.placeholder': '返信を書く...', 'chat.thinking': '{{name}} が返信を考えています...', 'chat.clear': 'チャットを消去', 'chat.clearConfirm': 'このチャットを消去しますか？', 'chat.noMessages': 'まだメッセージはありません。', 'chat.session': 'Djangoチャットセッション', 'chat.unavailable': 'このキャラクターは利用できません。',
  'profile.title': 'プロフィールと設定', 'profile.overview': 'プロフィール概要', 'profile.accountLogin': 'アカウントとログイン', 'profile.language': '言語設定', 'profile.terms': '法的情報', 'profile.accountStatus': 'アカウント状態', 'profile.visibility': 'プロフィール公開設定', 'profile.private': '非公開', 'profile.public': '公開', 'profile.notifications': '通知設定', 'profile.enabled': 'オン', 'profile.disabled': 'オフ', 'profile.readOnly': 'この設定は現在読み取り専用です。', 'profile.credentials': 'ログイン情報', 'profile.sessionRestored': 'セッションを復元しました', 'profile.currentLanguage': '現在の言語', 'profile.chooseLanguage': '表示言語を選択', 'profile.languageHint': '画面はすぐに切り替わり、選択はこの端末に保存され、アカウントにも同期されます。', 'profile.languageSaved': '言語設定を保存しました。', 'profile.languageSaveFailed': 'この端末には保存されましたが、アカウントに同期できませんでした。', 'profile.notSet': '未設定', 'profile.logout': '安全にログアウト', 'profile.loggingOut': 'ログアウト中...', 'profile.logoutFailed': 'ログアウトに失敗しました。もう一度お試しください。', 'profile.close': 'プロフィールを閉じる', 'profile.legalCenter': 'mio Trust & Safety Center',
  'profile.changeAvatar': 'プロフィール画像を変更', 'profile.avatarUploading': 'プロフィール画像をアップロード中...',
  'profile.avatarTypeError': '有効な JPG、PNG、WebP 画像を選択してください。', 'profile.avatarSizeError': 'プロフィール画像は 10 MB 以下にしてください。',
  'profile.avatarDimensionsError': 'プロフィール画像の辺は 8192 ピクセル以下にしてください。', 'profile.avatarUploadFailed': 'プロフィール画像を更新できませんでした。もう一度お試しください。',
  'auth.welcome': 'おかえりなさい', 'auth.register': 'mioに登録', 'auth.reset': 'パスワードをリセット', 'auth.registerHint': 'お気に入りとチャット履歴を保存するアカウントを作成します。', 'auth.email': 'メールアドレス', 'auth.password': 'パスワード', 'auth.displayName': '表示名', 'auth.continue': '続ける', 'auth.login': 'ログイン', 'auth.join': '無料登録', 'auth.google': 'Googleで続ける', 'auth.terms': '続行すると利用規約とプライバシーポリシーに同意したことになります。',
  'mobile.moreTitle': 'その他の機能', 'mobile.moreHint': 'mioの全機能にアクセス', 'mobile.mainNavigation': 'モバイルメインナビゲーション', 'mobile.closeMore': 'メニューを閉じる', 'mobile.openProfile': 'プロフィール、アカウント、言語設定を開く', 'tags.following': 'フォロー中', 'tags.all': 'すべて',
  'generator.close': '生成画面を閉じる', 'generator.leftTemplate': 'テンプレートを左へ', 'generator.rightTemplate': 'テンプレートを右へ', 'generator.left': '前へ', 'generator.right': '次へ', 'generator.searchCharacter': 'キャラクターカードを検索', 'generator.allCharacters': 'すべてのキャラクター', 'generator.createdCharacters': '作成済み', 'generator.likedCharacters': 'いいね済み', 'generator.loadedAll': 'すべてのカードを読み込みました', 'generator.noImage': '画像なし', 'create.namePlaceholder': 'キャラクター名を入力', 'create.subtitlePlaceholder': 'キャラクターの短い紹介...', 'create.descriptionPlaceholder': 'キャラクターの背景、望み、舞台を説明...', 'create.greetingPlaceholder': '最初のチャットに表示するメッセージ...', 'create.retryVoices': '再試行', 'create.loadingVoices': '音声カタログを読み込み中...', 'create.noSummary': '一言紹介...', 'notification.all': 'すべて ({{count}})', 'notification.markAllRead': 'すべて既読にする', 'notification.clearAll': '通知をすべて消去', 'feed.myFollowing': '❤️ フォロー中 ({{count}})', 'community.all': '🌟 おすすめ作品', 'community.myFollowing': '❤️ フォロー中 ({{count}})', 'errors.followUnavailable': 'このクリエイターは現在フォローできません。', 'errors.followFailed': 'フォローに失敗しました。もう一度お試しください。', 'errors.characterUnavailable': 'このキャラクターは利用できません。', 'errors.characterDetails': 'キャラクター詳細を読み込めませんでした。', 'errors.profilePrivate': 'このクリエイタープロフィールは非公開または利用できません。', 'errors.profileLoad': 'クリエイタープロフィールを読み込めませんでした。', 'errors.favoriteFailed': 'お気に入りの更新に失敗しました。', 'errors.notifications': '通知の更新に失敗しました。', 'errors.charactersService': 'キャラクターサービスに接続できません。Djangoが起動中か確認してください。', 'errors.chatLoad': 'チャットセッションを読み込めませんでした。', 'errors.createdLoad': '作成したキャラクターを読み込めませんでした。', 'errors.localeNetwork': 'この端末には保存されましたが、アカウントに同期できませんでした。', 'safety.title': 'Trust & Safety', 'safety.center': '安全センター', 'safety.policies': '安全ポリシー', 'help.title': 'どのようなサポートが必要ですか？', 'community.title': 'クリエイターコミュニティ', 'referral.title': '特典', 'common.scrollLeft': '左へスクロール', 'common.scrollRight': '右へスクロール', 'common.expandSidebar': 'サイドバーを展開', 'common.collapseSidebar': 'サイドバーを折りたたむ',
};

const ko: MessageMap = {
  'create.nameTaken': '이 캐릭터 이름은 이미 사용 중입니다. 다른 이름을 입력하세요.',
  'create.nameCheckWarning': '캐릭터를 생성할 때 이름 중복을 다시 확인합니다.',
  'chat.regenerate': '답변 다시 생성', 'chat.continue': '다음 답변 계속하기',
  'chat.regenerateError': '답변을 다시 생성하지 못했습니다. 다시 시도해 주세요.', 'chat.regenerateEmptyError': '다시 생성된 내용이 없어 원래 답변을 유지했습니다. 다시 시도해 주세요.', 'chat.continueError': '다음 답변을 생성하지 못했습니다. 다시 시도해 주세요.',
  'brand.tagline': '이야기가 당신에게 답합니다.', 'nav.explore': '탐색', 'nav.chat': '채팅', 'nav.generate': '생성', 'nav.myCharacters': '내 캐릭터', 'nav.feed': '피드', 'nav.community': '커뮤니티', 'nav.referral': '추천 혜택', 'nav.help': '도움말', 'nav.safety': '안전 센터', 'nav.create': '만들기', 'nav.more': '더보기', 'nav.profile': '프로필 및 설정', 'nav.upgrade': 'VIP 업그레이드', 'nav.buyDiamonds': '보석 구매', 'nav.hot': '인기', 'nav.new': '신규', 'nav.gems': '보석',
  'common.signIn': '로그인', 'common.joinFree': '무료 가입', 'common.close': '닫기', 'common.cancel': '취소', 'common.save': '저장', 'common.clear': '지우기', 'common.reset': '필터 초기화', 'common.retry': '다시 시도', 'common.loading': '로드 중', 'common.send': '보내기', 'common.apply': '적용', 'common.back': '뒤로', 'common.next': '다음', 'common.all': '전체', 'common.yes': '예', 'common.no': '아니요', 'common.done': '완료', 'common.delete': '삭제', 'common.search': '검색', 'common.selected': '선택됨', 'common.none': '선택 없음', 'common.online': '온라인', 'common.justNow': '방금 전', 'common.follow': '팔로우', 'common.following': '팔로잉', 'common.like': '좋아요', 'common.liked': '좋아요함', 'common.account': '계정', 'common.unknownError': '문제가 발생했습니다. 다시 시도해 주세요.',
  'discover.eyebrow': '캐릭터 라이브러리', 'discover.title': '캐릭터 탐색', 'discover.subtitle': '마음에 드는 캐릭터와 원하는 속도로 이야기를 이어가세요.', 'discover.search': '이름, 설명, 분위기 또는 장면 검색...', 'discover.featured': '추천 캐릭터', 'discover.myCollection': '내 즐겨찾기와 창작 캐릭터', 'discover.clearFilters': '현재 필터 지우기', 'discover.sort.trending': '🔥 인기 트렌드', 'discover.sort.newest': '✨ 최신순', 'discover.sort.popular': '⭐ 인기순', 'discover.gender': '성별', 'discover.genderAll': '모든 성별', 'discover.female': '여성', 'discover.male': '남성', 'discover.nonbinary': '논바이너리', 'discover.style': '화풍', 'discover.styleAll': '모든 화풍', 'discover.anime': '애니메이션', 'discover.realistic': '실사풍', 'discover.fantasy': '판타지', 'discover.age': '연령', 'discover.anyAge': '모든 연령', 'discover.ageTeen': '18~20세', 'discover.ageYoung': '21~25세', 'discover.ageAdult': '26~29세', 'discover.ageMature': '30세 이상', 'discover.filterCharacters': '캐릭터 필터', 'discover.moreFilters': '추가 필터', 'discover.filterHint': '조건을 선택하면 목록이 바로 업데이트됩니다.', 'discover.noResults': '조건에 맞는 캐릭터가 없습니다', 'discover.noResultsHint': '검색어를 바꾸거나 필터를 초기화해 보세요.', 'discover.loadingCharacters': '캐릭터 로드 중', 'discover.loadingHint': '캐릭터 라이브러리에서 공개 콘텐츠를 읽는 중...', 'discover.loadFailed': '캐릭터를 불러오지 못했습니다', 'discover.reload': '다시 불러오기',
  'chat.conversations': '채팅', 'chat.new': '캐릭터를 선택해 새로운 이야기를 시작하세요.', 'chat.placeholder': '답장을 입력하세요...', 'chat.thinking': '{{name}} 님이 답변을 생각 중...', 'chat.clear': '대화 삭제', 'chat.clearConfirm': '이 대화를 삭제할까요?', 'chat.noMessages': '아직 메시지가 없습니다.', 'chat.session': 'Django 채팅 세션', 'chat.unavailable': '이 캐릭터는 사용할 수 없습니다.',
  'profile.title': '프로필 및 설정', 'profile.overview': '프로필 개요', 'profile.accountLogin': '계정 및 로그인', 'profile.language': '언어 설정', 'profile.terms': '법률 정보', 'profile.accountStatus': '계정 상태', 'profile.visibility': '프로필 공개 설정', 'profile.private': '비공개', 'profile.public': '공개', 'profile.notifications': '알림 설정', 'profile.enabled': '켜짐', 'profile.disabled': '꺼짐', 'profile.readOnly': '이 설정은 현재 읽기 전용입니다.', 'profile.credentials': '로그인 인증 수단', 'profile.sessionRestored': '세션 복원됨', 'profile.currentLanguage': '현재 언어', 'profile.chooseLanguage': '인터페이스 언어 선택', 'profile.languageHint': '화면은 즉시 바뀌며 선택한 언어는 이 기기에 저장되고 계정에도 동기화됩니다.', 'profile.languageSaved': '언어 설정이 저장되었습니다.', 'profile.languageSaveFailed': '이 기기에는 저장되었지만 계정에 동기화하지 못했습니다.', 'profile.notSet': '설정되지 않음', 'profile.logout': '안전하게 로그아웃', 'profile.loggingOut': '로그아웃 중...', 'profile.logoutFailed': '로그아웃에 실패했습니다. 다시 시도해 주세요.', 'profile.close': '프로필 닫기', 'profile.legalCenter': 'mio 신뢰 및 안전 센터',
  'profile.changeAvatar': '프로필 이미지 변경', 'profile.avatarUploading': '프로필 이미지 업로드 중...',
  'profile.avatarTypeError': '올바른 JPG, PNG 또는 WebP 이미지를 선택하세요.', 'profile.avatarSizeError': '프로필 이미지는 10 MB 이하여야 합니다.',
  'profile.avatarDimensionsError': '프로필 이미지의 변 길이는 8192픽셀 이하여야 합니다.', 'profile.avatarUploadFailed': '프로필 이미지를 변경하지 못했습니다. 다시 시도해 주세요.',
  'auth.welcome': '다시 오신 것을 환영합니다', 'auth.register': 'mio 가입', 'auth.reset': '비밀번호 재설정', 'auth.registerHint': '즐겨찾기와 채팅 기록을 저장할 계정을 만드세요.', 'auth.email': '이메일 주소', 'auth.password': '비밀번호', 'auth.displayName': '표시 이름', 'auth.continue': '계속', 'auth.login': '로그인', 'auth.join': '무료 가입', 'auth.google': 'Google로 계속', 'auth.terms': '계속하면 이용약관 및 개인정보 처리방침에 동의하는 것입니다.',
  'mobile.moreTitle': '더 많은 기능', 'mobile.moreHint': 'mio의 모든 기능에 접근', 'mobile.mainNavigation': '모바일 메인 탐색', 'mobile.closeMore': '더보기 메뉴 닫기', 'mobile.openProfile': '프로필, 계정 및 언어 설정 열기', 'tags.following': '팔로잉', 'tags.all': '전체', 'generator.close': '생성기 닫기', 'generator.leftTemplate': '템플릿 왼쪽으로', 'generator.rightTemplate': '템플릿 오른쪽으로', 'generator.left': '이전', 'generator.right': '다음', 'generator.searchCharacter': '캐릭터 카드 검색', 'generator.allCharacters': '전체 캐릭터', 'generator.createdCharacters': '내가 만든 캐릭터', 'generator.likedCharacters': '좋아요한 캐릭터', 'generator.loadedAll': '모든 캐릭터 카드를 불러왔습니다', 'generator.noImage': '사용 가능한 대표 이미지 없음', 'create.namePlaceholder': '캐릭터 이름을 입력하세요', 'create.subtitlePlaceholder': '캐릭터를 한 줄로 소개하세요...', 'create.descriptionPlaceholder': '캐릭터의 배경, 욕망과 세계관을 설명하세요...', 'create.greetingPlaceholder': '첫 채팅에 표시될 시작 메시지...', 'create.retryVoices': '다시 시도', 'create.loadingVoices': '음성 목록을 불러오는 중...', 'create.noSummary': '한 줄 소개...', 'notification.all': '전체 ({{count}})', 'notification.markAllRead': '모두 읽음으로 표시', 'notification.clearAll': '알림 모두 삭제', 'feed.myFollowing': '❤️ 팔로잉 ({{count}})', 'community.all': '🌟 추천 작품 전체', 'community.myFollowing': '❤️ 팔로잉 ({{count}})', 'errors.followUnavailable': '현재 이 크리에이터를 팔로우할 수 없습니다.', 'errors.followFailed': '팔로우에 실패했습니다. 다시 시도해 주세요.', 'errors.characterUnavailable': '이 캐릭터는 사용할 수 없습니다.', 'errors.characterDetails': '캐릭터 상세 정보를 불러오지 못했습니다.', 'errors.profilePrivate': '이 크리에이터 프로필은 비공개이거나 사용할 수 없습니다.', 'errors.profileLoad': '크리에이터 프로필을 불러오지 못했습니다.', 'errors.favoriteFailed': '즐겨찾기 업데이트에 실패했습니다.', 'errors.notifications': '알림 업데이트에 실패했습니다.', 'errors.charactersService': '캐릭터 서비스에 연결할 수 없습니다. Django가 실행 중인지 확인하세요.', 'errors.chatLoad': '채팅 세션을 불러오지 못했습니다.', 'errors.createdLoad': '내 캐릭터를 불러오지 못했습니다.', 'errors.localeNetwork': '이 기기에는 저장되었지만 계정에 동기화하지 못했습니다.', 'safety.title': '신뢰 및 안전', 'safety.center': '안전 센터', 'safety.policies': '안전 정책', 'help.title': '무엇을 도와드릴까요?', 'community.title': '크리에이터 커뮤니티', 'referral.title': '추천 혜택', 'common.scrollLeft': '왼쪽으로 스크롤', 'common.scrollRight': '오른쪽으로 스크롤', 'common.expandSidebar': '사이드바 펼치기', 'common.collapseSidebar': '사이드바 접기',
};

const supplemental: Record<string, MessageMap> = {
  en: {
    'upgrade.rulePublish': 'Publish character card',
    'profile.emailVerified': 'Verified', 'profile.emailUnverified': 'Not verified', 'profile.assetsUnavailable': 'Membership and asset data unavailable', 'profile.accountSecurityDescription': 'Sessions, email sign-in and registration, Google sign-in, password reset, and secure sign-out are connected.', 'community.viewProfile': 'View profile', 'community.aiVideo': 'AI video', 'community.aiImage': 'AI image', 'create.presetFallback': 'Preset option',
    'common.notifications': 'Notifications', 'common.openProfile': 'Open profile and account settings', 'common.filter': 'Filter', 'common.sort': 'Sort', 'common.closeFilter': 'Close filters', 'common.clearFilters': 'Clear filters', 'common.applyFilters': 'Apply filters', 'common.createCharacter': 'Create character', 'common.character': 'Character', 'common.characters': 'Characters', 'common.play': 'plays',
    'discover.total': '{{count}} characters', 'discover.sortLabel': 'Sort characters', 'discover.searchLabel': 'Search characters', 'discover.genderLabel': 'Gender', 'discover.styleLabel': 'Style', 'discover.ageLabel': 'Age', 'discover.genderAllShort': 'All', 'discover.femaleShort': 'Female', 'discover.maleShort': 'Male', 'discover.nonbinaryShort': 'Non-binary', 'discover.anyAgeShort': 'Any age', 'discover.ageMatureShort': '30+',
    'auth.lastUsed': 'Last used', 'auth.emailContinue': 'Continue with email', 'auth.emailPlaceholder': 'Your email address', 'auth.passwordPlaceholder': 'Enter your password', 'auth.displayNamePlaceholder': 'Display name', 'auth.createPasswordPlaceholder': 'Create a password', 'auth.passwordHint': 'At least 10 characters and meet account security requirements.', 'auth.forgotPassword': 'Forgot password?', 'auth.legalAge': 'By continuing, you confirm that you are 18 or older and agree to the', 'auth.termsLink': 'Platform terms', 'auth.switchRegister': "Don't have an account? Sign up free", 'auth.switchLogin': 'Already have an account? Sign in', 'auth.resetHint': 'Enter your registration email and we will send a one-time token valid for 30 minutes.', 'auth.sendReset': 'Send reset token', 'auth.resetTokenPlaceholder': 'Reset token from email', 'auth.newPasswordPlaceholder': 'Create a new password', 'auth.updatePassword': 'Update password', 'auth.submitting': 'Submitting...', 'auth.loggingIn': 'Signing in...', 'auth.creating': 'Creating account...', 'auth.sending': 'Sending...', 'auth.updated': 'Password updated. Sign in with your new password.', 'auth.resetSent': 'If the email is registered, a reset token has been sent. Check your inbox and enter it below.', 'auth.close': 'Close authentication dialog', 'auth.back': 'Back', 'auth.invalidCredentials': 'Email or password is incorrect.', 'auth.accountSuspended': 'This account is unavailable. Contact support.', 'auth.emailExists': 'This email is already registered. Try signing in.', 'auth.weakPassword': 'Password does not meet security requirements.', 'auth.googleTokenInvalid': 'Google sign-in expired. Choose an account again.', 'auth.googleEmailUnverified': 'This Google email is not verified.', 'auth.accountLinkRequired': 'This email uses password sign-in. Use email login instead.', 'auth.adultRequired': 'You must confirm that you are 18 or older.', 'auth.resetTokenInvalid': 'The reset token is invalid or expired.', 'auth.csrfFailed': 'Request verification expired. Try again.', 'auth.throttled': 'Too many attempts. Try again later.', 'auth.networkError': 'Unable to connect to authentication services.', 'auth.googleUnavailable': 'Google sign-in is unavailable. Continue with email.', 'auth.serviceUnavailable': 'Authentication service is temporarily unavailable.', 'auth.failed': 'Authentication failed. Try again.',
  },
  'zh-CN': {
    'upgrade.rulePublish': '发布角色卡',
    'profile.emailVerified': '已验证', 'profile.emailUnverified': '未验证', 'profile.assetsUnavailable': '会员与资产数据未提供', 'profile.accountSecurityDescription': 'Session、邮箱登录与注册、Google 登录、密码重置和安全退出均已接入。', 'community.viewProfile': '查看档案', 'community.aiVideo': 'AI 视频', 'community.aiImage': 'AI 图片', 'create.presetFallback': '预设选项',
    'common.notifications': '通知', 'common.openProfile': '打开个人资料与账号设置', 'common.filter': '筛选', 'common.sort': '排序', 'common.closeFilter': '关闭筛选', 'common.clearFilters': '清除筛选', 'common.applyFilters': '应用筛选', 'common.createCharacter': '创建角色', 'common.character': '角色', 'common.characters': '角色', 'common.play': '播放',
    'discover.total': '{{count}} 个角色', 'discover.sortLabel': '排序方式', 'discover.searchLabel': '搜索角色', 'discover.genderLabel': '性别', 'discover.styleLabel': '画风', 'discover.ageLabel': '年龄', 'discover.genderAllShort': '全部', 'discover.femaleShort': '女性', 'discover.maleShort': '男性', 'discover.nonbinaryShort': '非二元', 'discover.anyAgeShort': '任意年龄', 'discover.ageMatureShort': '30岁以上',
    'auth.lastUsed': '上次使用', 'auth.emailContinue': '使用邮箱继续', 'auth.emailPlaceholder': '你的邮箱地址', 'auth.passwordPlaceholder': '输入密码', 'auth.displayNamePlaceholder': '显示名称', 'auth.createPasswordPlaceholder': '创建密码', 'auth.passwordHint': '至少 10 个字符，并符合账号安全要求。', 'auth.forgotPassword': '忘记密码？', 'auth.legalAge': '继续即表示你确认已年满 18 岁并同意', 'auth.termsLink': '平台条款', 'auth.switchRegister': '没有账号？免费注册', 'auth.switchLogin': '已有账号？登录', 'auth.resetHint': '输入注册邮箱，我们会发送一个 30 分钟内有效的一次性 token。', 'auth.sendReset': '发送重置 token', 'auth.resetTokenPlaceholder': '邮件中的重置 token', 'auth.newPasswordPlaceholder': '创建新密码', 'auth.updatePassword': '更新密码', 'auth.submitting': '正在提交...', 'auth.loggingIn': '正在登录...', 'auth.creating': '正在创建账号...', 'auth.sending': '正在发送...', 'auth.updated': '密码已更新，请使用新密码登录。', 'auth.resetSent': '如果该邮箱已注册，重置 token 已发送。请查看邮件并在下方输入。', 'auth.close': '关闭认证窗口', 'auth.back': '返回上一步', 'auth.invalidCredentials': '邮箱或密码不正确，请重新输入。', 'auth.accountSuspended': '此账号当前不可用，请联系支持团队。', 'auth.emailExists': '该邮箱已经注册，请改用登录。', 'auth.weakPassword': '密码不符合安全要求，请更换后重试。', 'auth.googleTokenInvalid': 'Google 登录凭证已失效，请重新选择账号。', 'auth.googleEmailUnverified': '该 Google 邮箱尚未完成验证。', 'auth.accountLinkRequired': '该邮箱已使用邮箱密码注册，请改用邮箱登录。', 'auth.adultRequired': '继续前必须确认已年满 18 岁。', 'auth.resetTokenInvalid': '重置 token 无效或已过期，请重新申请。', 'auth.csrfFailed': '请求验证已过期，请重试。', 'auth.throttled': '操作过于频繁，请稍后重试。', 'auth.networkError': '无法连接到认证服务，请检查网络后重试。', 'auth.googleUnavailable': 'Google 登录暂时不可用，请使用邮箱继续。', 'auth.serviceUnavailable': '认证服务暂时不可用，请稍后重试。', 'auth.failed': '认证失败，请重试。',
  },
  ja: {
    'upgrade.rulePublish': 'キャラクターカードを公開',
    'create.preset.race.east_asian.desc': '東アジアらしい端正で柔らかな顔立ち。', 'create.preset.race.caucasian.desc': '立体的でコントラストのある顔立ち。', 'create.preset.race.latina.desc': '温かな肌色とエネルギッシュなシルエット。', 'create.preset.race.black.desc': '深い肌色と自信に満ちたシルエット。', 'create.preset.race.middle_eastern.desc': '印象的な瞳とミステリアスな雰囲気。', 'create.preset.race.south_asian.desc': 'ブロンズの温かさと個性的な優雅さ。', 'create.preset.species.succubus.desc': 'ハート形のしっぽを持つ魅惑的な悪魔。', 'create.preset.species.elf.desc': '純潔と堕落のギャップを持つ優雅なエルフ。', 'create.preset.species.beastkin.desc': '敏感な耳と遊び心のある動物の気質。', 'create.preset.species.vampire.desc': '夜を好む高貴なヴァンパイア。', 'create.preset.species.angel.desc': '神聖さの中に反抗的な一面を持つ存在。', 'create.preset.species.slime_tentacle.desc': '流動的で異世界的な形を持つ幻想生物。', 'create.preset.face.v_line.desc': 'すっきりしたシャープな輪郭。', 'create.preset.face.oval.desc': '柔らかくバランスのよい上品さ。', 'create.preset.face.chubby.desc': '若々しく優しい表情。', 'create.preset.face.sculpted.desc': '際立つ頬骨と力強い存在感。', 'create.preset.body.curvy.badge': '引き締まったウエスト', 'create.preset.body.slim.badge': '軽やかで小柄', 'create.preset.body.athletic.badge': '鍛えた体幹', 'create.preset.body.tall_model.badge': '長い脚', 'create.preset.chest.flat.badge': '小柄', 'create.preset.chest.natural.badge': '自然な形', 'create.preset.chest.full.badge': '印象的な存在感', 'create.preset.chest.voluptuous.badge': '豊かなボリューム', 'create.preset.hip.compact.badge': '弾むライン', 'create.preset.hip.peach.badge': '柔らかく豊か', 'create.preset.hip.hourglass.badge': '美しい比率', 'create.preset.archetype.domme.desc': '自信を持って場を導き、境界線を大切にします。', 'create.preset.archetype.sub.desc': '信頼を軸にした、身を委ねる関係性。', 'create.preset.archetype.ntr.desc': '感情の緊張感を含むドラマチックな裏切り。', 'create.preset.archetype.seductress.desc': '会話に軽やかな誘惑と緊張感を添えます。', 'create.preset.archetype.contrast.desc': '外では冷静、二人きりでは柔らかい一面。', 'create.preset.archetype.yandere.desc': '強い愛情に執着のニュアンスを加えます。', 'create.preset.archetype.onee_san.desc': '温かくお茶目で、夜には少しほろ酔い。', 'create.preset.archetype.sweet_pure.desc': '一人に向けた優しく一途な愛情。',
    'profile.emailVerified': '認証済み', 'profile.emailUnverified': '未認証', 'profile.assetsUnavailable': '会員・資産データは利用できません', 'profile.accountSecurityDescription': 'セッション、メール登録とログイン、Googleログイン、パスワードリセット、安全なログアウトに対応しています。', 'community.viewProfile': 'プロフィールを見る', 'community.aiVideo': 'AI動画', 'community.aiImage': 'AI画像', 'create.presetFallback': 'プリセット項目',
    'common.notifications': '通知', 'common.openProfile': 'プロフィールとアカウント設定を開く', 'common.filter': '絞り込み', 'common.sort': '並べ替え', 'common.closeFilter': '絞り込みを閉じる', 'common.clearFilters': '絞り込みをクリア', 'common.applyFilters': '絞り込みを適用', 'common.createCharacter': 'キャラクターを作成', 'common.character': 'キャラクター', 'common.characters': 'キャラクター', 'common.play': '再生',
    'discover.total': '{{count}}人のキャラクター', 'discover.sortLabel': '並べ替え', 'discover.searchLabel': 'キャラクターを検索', 'discover.genderLabel': '性別', 'discover.styleLabel': '画風', 'discover.ageLabel': '年齢', 'discover.genderAllShort': 'すべて', 'discover.femaleShort': '女性', 'discover.maleShort': '男性', 'discover.nonbinaryShort': 'ノンバイナリー', 'discover.anyAgeShort': 'すべての年齢', 'discover.ageMatureShort': '30歳以上',
    'auth.lastUsed': '前回使用', 'auth.emailContinue': 'メールで続ける', 'auth.emailPlaceholder': 'メールアドレス', 'auth.passwordPlaceholder': 'パスワードを入力', 'auth.displayNamePlaceholder': '表示名', 'auth.createPasswordPlaceholder': 'パスワードを作成', 'auth.passwordHint': '10文字以上で、アカウントの安全要件を満たしてください。', 'auth.forgotPassword': 'パスワードを忘れた場合', 'auth.legalAge': '続行すると、18歳以上であることを確認し、次に同意したことになります：', 'auth.termsLink': 'プラットフォーム規約', 'auth.switchRegister': 'アカウントがありませんか？無料登録', 'auth.switchLogin': 'アカウントをお持ちですか？ログイン', 'auth.resetHint': '登録メールアドレスを入力すると、30分間有効なトークンを送信します。', 'auth.sendReset': 'リセットトークンを送信', 'auth.resetTokenPlaceholder': 'メールのリセットトークン', 'auth.newPasswordPlaceholder': '新しいパスワードを作成', 'auth.updatePassword': 'パスワードを更新', 'auth.submitting': '送信中...', 'auth.loggingIn': 'ログイン中...', 'auth.creating': 'アカウント作成中...', 'auth.sending': '送信中...', 'auth.updated': 'パスワードを更新しました。新しいパスワードでログインしてください。', 'auth.resetSent': '登録済みの場合、リセットトークンを送信しました。メールを確認して下に入力してください。', 'auth.close': '認証ダイアログを閉じる', 'auth.back': '前に戻る', 'auth.invalidCredentials': 'メールアドレスまたはパスワードが正しくありません。', 'auth.accountSuspended': 'このアカウントは利用できません。サポートに連絡してください。', 'auth.emailExists': 'このメールアドレスは登録済みです。ログインしてください。', 'auth.weakPassword': 'パスワードが安全要件を満たしていません。', 'auth.googleTokenInvalid': 'Googleログインの有効期限が切れました。再度選択してください。', 'auth.googleEmailUnverified': 'このGoogleメールは未確認です。', 'auth.accountLinkRequired': 'このメールはパスワードログインを使用しています。メールログインを選択してください。', 'auth.adultRequired': '18歳以上であることを確認してください。', 'auth.resetTokenInvalid': 'リセットトークンが無効または期限切れです。', 'auth.csrfFailed': 'リクエストの確認期限が切れました。もう一度お試しください。', 'auth.throttled': '試行回数が多すぎます。後でもう一度お試しください。', 'auth.networkError': '認証サービスに接続できません。', 'auth.googleUnavailable': 'Googleログインを利用できません。メールで続けてください。', 'auth.serviceUnavailable': '認証サービスは一時的に利用できません。', 'auth.failed': '認証に失敗しました。もう一度お試しください。',
  },
  ko: {
    'upgrade.rulePublish': '캐릭터 카드 게시',
    'create.preset.race.east_asian.desc': '동아시아 특유의 단정하고 부드러운 이목구비.', 'create.preset.race.caucasian.desc': '입체적이고 대비감 있는 얼굴.', 'create.preset.race.latina.desc': '따뜻한 피부톤과 활기찬 실루엣.', 'create.preset.race.black.desc': '깊은 피부톤과 자신감 있는 실루엣.', 'create.preset.race.middle_eastern.desc': '인상적인 눈빛과 신비로운 분위기.', 'create.preset.race.south_asian.desc': '브론즈 톤의 따뜻함과 독특한 우아함.', 'create.preset.species.succubus.desc': '하트 모양 꼬리를 가진 매혹적인 악마.', 'create.preset.species.elf.desc': '순수함과 타락의 대비를 지닌 우아한 엘프.', 'create.preset.species.beastkin.desc': '민감한 귀와 장난기 있는 동물의 기질.', 'create.preset.species.vampire.desc': '밤을 사랑하는 고귀한 뱀파이어.', 'create.preset.species.angel.desc': '신성함 속에 반항적인 면을 지닌 존재.', 'create.preset.species.slime_tentacle.desc': '유동적이고 이세계적인 형태의 판타지 생물.', 'create.preset.face.v_line.desc': '깔끔하고 선명한 턱선.', 'create.preset.face.oval.desc': '부드럽고 균형 잡힌 우아함.', 'create.preset.face.chubby.desc': '어리고 부드러운 표정.', 'create.preset.face.sculpted.desc': '돋보이는 광대와 강한 존재감.', 'create.preset.body.curvy.badge': '잘록한 허리', 'create.preset.body.slim.badge': '가볍고 아담한 체형', 'create.preset.body.athletic.badge': '탄탄한 코어', 'create.preset.body.tall_model.badge': '긴 다리', 'create.preset.chest.flat.badge': '아담한 사이즈', 'create.preset.chest.natural.badge': '자연스러운 형태', 'create.preset.chest.full.badge': '강한 존재감', 'create.preset.chest.voluptuous.badge': '풍부한 볼륨', 'create.preset.hip.compact.badge': '탄력 있는 라인', 'create.preset.hip.peach.badge': '풍부하고 부드러운 형태', 'create.preset.hip.hourglass.badge': '선명한 비율', 'create.preset.archetype.domme.desc': '자신 있게 장면을 이끌며 명확한 경계를 존중합니다.', 'create.preset.archetype.sub.desc': '신뢰를 바탕으로 한 순종 중심의 관계.', 'create.preset.archetype.ntr.desc': '감정적 긴장감이 있는 극적인 배신 테마.', 'create.preset.archetype.seductress.desc': '대화에 가벼운 유혹과 긴장감을 더합니다.', 'create.preset.archetype.contrast.desc': '밖에서는 침착하고 둘만 있을 때 부드러운 면.', 'create.preset.archetype.yandere.desc': '집착의 결을 가진 강렬한 헌신.', 'create.preset.archetype.onee_san.desc': '따뜻하고 장난스럽고, 밤에는 살짝 취한 분위기.', 'create.preset.archetype.sweet_pure.desc': '한 사람에게 향하는 다정하고 한결같은 애정.',
    'profile.emailVerified': '인증됨', 'profile.emailUnverified': '미인증', 'profile.assetsUnavailable': '멤버십 및 자산 데이터 없음', 'profile.accountSecurityDescription': '세션, 이메일 가입 및 로그인, Google 로그인, 비밀번호 재설정과 안전한 로그아웃을 지원합니다.', 'community.viewProfile': '프로필 보기', 'community.aiVideo': 'AI 동영상', 'community.aiImage': 'AI 이미지', 'create.presetFallback': '프리셋 항목',
    'common.notifications': '알림', 'common.openProfile': '프로필 및 계정 설정 열기', 'common.filter': '필터', 'common.sort': '정렬', 'common.closeFilter': '필터 닫기', 'common.clearFilters': '필터 지우기', 'common.applyFilters': '필터 적용', 'common.createCharacter': '캐릭터 만들기', 'common.character': '캐릭터', 'common.characters': '캐릭터', 'common.play': '재생',
    'discover.total': '캐릭터 {{count}}개', 'discover.sortLabel': '캐릭터 정렬', 'discover.searchLabel': '캐릭터 검색', 'discover.genderLabel': '성별', 'discover.styleLabel': '화풍', 'discover.ageLabel': '연령', 'discover.genderAllShort': '전체', 'discover.femaleShort': '여성', 'discover.maleShort': '남성', 'discover.nonbinaryShort': '논바이너리', 'discover.anyAgeShort': '모든 연령', 'discover.ageMatureShort': '30세 이상',
    'auth.lastUsed': '최근 사용', 'auth.emailContinue': '이메일로 계속', 'auth.emailPlaceholder': '이메일 주소', 'auth.passwordPlaceholder': '비밀번호 입력', 'auth.displayNamePlaceholder': '표시 이름', 'auth.createPasswordPlaceholder': '비밀번호 만들기', 'auth.passwordHint': '10자 이상이며 계정 보안 요구사항을 충족해야 합니다.', 'auth.forgotPassword': '비밀번호를 잊으셨나요?', 'auth.legalAge': '계속하면 만 18세 이상임을 확인하고 다음에 동의하는 것입니다:', 'auth.termsLink': '플랫폼 약관', 'auth.switchRegister': '계정이 없나요? 무료 가입', 'auth.switchLogin': '이미 계정이 있나요? 로그인', 'auth.resetHint': '가입한 이메일을 입력하면 30분 동안 유효한 일회용 토큰을 보내드립니다.', 'auth.sendReset': '재설정 토큰 보내기', 'auth.resetTokenPlaceholder': '이메일의 재설정 토큰', 'auth.newPasswordPlaceholder': '새 비밀번호 만들기', 'auth.updatePassword': '비밀번호 업데이트', 'auth.submitting': '제출 중...', 'auth.loggingIn': '로그인 중...', 'auth.creating': '계정 생성 중...', 'auth.sending': '전송 중...', 'auth.updated': '비밀번호가 업데이트되었습니다. 새 비밀번호로 로그인하세요.', 'auth.resetSent': '등록된 이메일이라면 재설정 토큰을 보냈습니다. 받은 편지를 확인하고 아래에 입력하세요.', 'auth.close': '인증 창 닫기', 'auth.back': '이전 단계로', 'auth.invalidCredentials': '이메일 또는 비밀번호가 올바르지 않습니다.', 'auth.accountSuspended': '이 계정을 사용할 수 없습니다. 지원팀에 문의하세요.', 'auth.emailExists': '이미 등록된 이메일입니다. 로그인해 주세요.', 'auth.weakPassword': '비밀번호가 보안 요구사항을 충족하지 않습니다.', 'auth.googleTokenInvalid': 'Google 로그인 세션이 만료되었습니다. 계정을 다시 선택하세요.', 'auth.googleEmailUnverified': 'Google 이메일이 인증되지 않았습니다.', 'auth.accountLinkRequired': '이 이메일은 비밀번호 로그인 계정입니다. 이메일 로그인을 사용하세요.', 'auth.adultRequired': '만 18세 이상임을 확인해야 합니다.', 'auth.resetTokenInvalid': '재설정 토큰이 유효하지 않거나 만료되었습니다.', 'auth.csrfFailed': '요청 확인이 만료되었습니다. 다시 시도해 주세요.', 'auth.throttled': '시도가 너무 많습니다. 잠시 후 다시 시도하세요.', 'auth.networkError': '인증 서비스에 연결할 수 없습니다.', 'auth.googleUnavailable': 'Google 로그인을 사용할 수 없습니다. 이메일로 계속하세요.', 'auth.serviceUnavailable': '인증 서비스를 일시적으로 사용할 수 없습니다.', 'auth.failed': '인증에 실패했습니다. 다시 시도해 주세요.',
  },
};
const uiSupplemental: Record<string, MessageMap> = {
  en: {
    'notification.mobileHint': 'Updates and notices', 'notification.creatorsShort': 'Creators', 'notification.systemShort': 'System',
    'notification.title': 'Notifications', 'notification.unread': '{{count}} unread', 'notification.hint': 'Creator updates and new mio features', 'notification.creators': 'Creator updates', 'notification.system': 'System notices', 'notification.allReadShort': 'All read', 'notification.empty': 'No notifications here', 'notification.emptyHint': 'Updates appear here when followed creators publish or the system has news.', 'notification.followerWork': 'New work from a followed creator', 'notification.systemBadge': 'System notice', 'notification.openStory': 'Open story', 'notification.chatNow': 'Chat now', 'notification.creatorProfile': 'Creator profile', 'notification.viewDetails': 'View details', 'notification.markRead': 'Mark as read', 'notification.footerHint': 'Follow creators you love to receive story updates.',
    'chat.recent': 'Recent conversations', 'chat.interacted': '{{count}} characters', 'chat.createCustom': 'Create a custom character', 'chat.closeRecent': 'Close recent conversations', 'chat.searchRecent': 'Search chatted characters or messages...', 'chat.favorites': 'Favorites', 'chat.noHistory': 'No conversations yet', 'chat.chooseLobby': 'Choose a character from Explore', 'chat.deleteConversation': 'Delete conversation', 'chat.browseLobby': 'Browse more characters',
    'card.livePreview': 'Live preview', 'card.removeCharacter': 'Delete character', 'card.removeFavorite': 'Remove favorite', 'card.addFavorite': 'Add favorite',
    'community.eyebrow': 'AI creator community', 'community.heading': 'Community creations and character sharing', 'community.description': 'Discover videos, rendered artwork, and original character cards shared by creators. Copy prompts, like a work, or start chatting.', 'community.shareWork': 'Generate and share your own work', 'community.tabAll': 'Featured works', 'community.tabFollowing': 'Following ({{count}})', 'community.tabVideo': 'AI videos', 'community.tabImage': 'AI images', 'community.noFollowing': 'No works from followed creators yet', 'community.noFollowingHint': 'Follow creators from Explore or their profiles to see new work here.', 'community.exploreWorks': 'Explore featured works', 'community.loading': 'Loading community works...', 'community.empty': 'No public community works yet.', 'community.reload': 'Reload', 'community.generatedWork': 'Community creation', 'community.followed': 'Following', 'community.follow': '+ Follow', 'community.workNote': 'Work description', 'community.copyPrompt': 'Copy prompt', 'community.copied': 'Copied', 'community.noCaption': 'The author did not add a work description.', 'community.remix': 'Generate in this style', 'community.characters': 'Shared characters', 'community.viewProfile': 'View profile', 'community.feedLoadFailed': 'Community feed could not be loaded.', 'community.likeFailed': 'Like action failed.',
    'feed.loading': 'Loading videos', 'feed.loadFailed': 'Feed could not be loaded', 'feed.empty': 'No videos in this category', 'feed.followingEmpty': 'Creators you follow have not posted a video yet.', 'feed.genericEmpty': 'No more character videos found.', 'feed.generatedVideo': 'Generated video', 'feed.reload': 'Reload', 'feed.hot': 'Hot picks', 'feed.following': 'Following ({{count}})', 'feed.new': 'Latest', 'feed.swipe': 'Swipe left or right', 'feed.previous': 'Previous video', 'feed.next': 'Next video', 'feed.profile': 'Character profile', 'feed.soundOn': 'Turn sound on', 'feed.soundOff': 'Mute', 'feed.followCreator': 'Follow creator', 'feed.followedCreator': 'Following creator', 'feed.share': 'Share', 'feed.shared': 'Shared', 'feed.like': 'Like', 'feed.liked': 'Liked', 'feed.openChat': 'Start chat', 'feed.openDetails': 'View details',
    'detail.close': 'Close character details', 'detail.unavailable': 'Character details unavailable', 'detail.profile': 'Character profile', 'detail.favorite': 'Favorite character', 'detail.likes': 'likes', 'detail.chats': 'chats', 'detail.creator': 'Creator: {{name}}', 'detail.openCreator': 'Open creator profile and works', 'detail.info': 'Persona details', 'detail.photos': 'Photos ({{count}})', 'detail.videos': 'Video theater ({{count}})', 'detail.loading': 'Loading complete character details...', 'detail.background': 'Background and personality', 'detail.noBackground': 'No background story provided.', 'detail.greeting': 'Opening message', 'detail.tags': 'Attributes', 'detail.noTags': 'No public tags', 'detail.prompt': 'System prompt overview', 'detail.noPrompt': 'The system prompt is not public.', 'detail.noPhotos': 'No public images for this character.', 'detail.noVideos': 'No public videos for this character.', 'detail.privateChat': 'Start a private immersive chat with {{name}}', 'detail.startChat': 'Start chatting',
    'panel.title': 'Character dossier', 'panel.close': 'Close panel', 'panel.author': 'Author', 'panel.chats': 'chats', 'panel.intro': 'One-line impression', 'panel.scenes': 'Limited interaction theater', 'panel.sceneCount': '{{count}} story scenes', 'panel.sceneHint': 'The default opening scene is free; VIP unlocks exclusive scripts.', 'panel.unlockStory': 'Unlock {{name}} exclusive story', 'panel.background': 'Background and setup', 'panel.voice': 'AI voice style', 'panel.voiceApi': 'Django available', 'panel.voiceCatalog': 'Server catalog', 'panel.voiceHint': 'Voice catalog is provided by Django and saved to this thread after switching.', 'panel.voiceUnavailable': 'This character is not connected to the Django voice catalog.', 'panel.unlock': 'Unlock', 'panel.previewing': 'Previewing...', 'panel.used': 'In use', 'panel.switch': 'Switch', 'panel.hiddenPrompt': 'Not public', 'panel.photosCount': '{{count}} high-resolution photos', 'panel.photoHint': 'Click a photo to preview or set it as a background', 'panel.currentBackground': 'Current background', 'panel.setBackground': 'Set background', 'panel.videosCount': 'Video clips ({{count}})', 'panel.videoHint': 'Click a video to play', 'panel.play': 'Play', 'panel.likes': 'likes', 'panel.unlockVideo': 'Unlock {{name}} exclusive interaction story', 'panel.setChatBackground': 'Set as chat background', 'panel.chatBackgroundSet': '✓ Chat background set', 'panel.videoUnsupported': 'Your browser does not support video playback.', 'panel.videoClip': '{{name}} exclusive video clip', 'panel.duration': 'Duration', 'panel.views': 'Views', 'panel.download': 'Download HD original',
    'creator.bioEmpty': 'This creator has not added a public bio.', 'creator.close': 'Close page', 'creator.verified': 'Verified creator', 'creator.followed': 'Following', 'creator.follow': '+ Follow creator', 'creator.followers': 'Followers', 'creator.loading': 'Loading creator profile...', 'creator.reload': 'Reload', 'creator.characters': '{{name}} character list', 'creator.noCharacters': 'This creator has no public characters yet.', 'creator.videos': '{{name}} public videos', 'creator.noVideos': 'This creator has no public videos yet.', 'creator.loadMore': 'Load more',
    'my.title': 'My characters', 'my.eyebrow': 'Personal character space', 'my.description': 'Manage your characters and favorites, and continue your stories anytime.', 'my.create': 'Create character', 'my.created': 'My characters', 'my.favorites': 'My favorites', 'my.chatting': 'In conversation', 'my.search': 'Search my characters...', 'my.emptyCreated': 'You have not created any characters', 'my.emptyFavorites': 'No favorite character cards', 'my.emptyChatting': 'No active chats', 'my.hintCreated': 'Use the AI character studio to create a companion and its story.', 'my.hintFavorites': 'Tap the heart on a character card in Explore to save it.', 'my.hintChatting': 'Choose a character to start a conversation; it will appear here.', 'my.generate': 'Generate character image & background', 'my.explore': 'Explore characters', 'my.deleteCreated': 'Delete created character', 'my.clearChat': 'Clear conversation', 'my.confirmDelete': 'Delete this character?', 'my.confirmClear': 'Clear conversation history?', 'my.warning': 'This action cannot be undone.', 'my.cancel': 'Cancel', 'my.confirmDeleteButton': 'Delete permanently', 'my.confirmClearButton': 'Clear',
    'chat.disabled': 'This chat entry is disabled. Choose an available character from Explore.', 'chat.backExplore': 'Back to Explore',
  },
  'zh-CN': {
    'notification.mobileHint': '作品更新与系统提示', 'notification.creatorsShort': '创作者', 'notification.systemShort': '系统',
    'notification.title': '消息提醒中心', 'notification.unread': '{{count}} 条未读', 'notification.hint': '关注创作者新角色推送与系统最新功能提示', 'notification.creators': '关注人角色', 'notification.system': '系统公告', 'notification.allReadShort': '全已读', 'notification.empty': '暂无相关提示消息', 'notification.emptyHint': '当您关注的创作者发布新角色或系统有更新时，会在此处推送。', 'notification.followerWork': '关注者新作', 'notification.systemBadge': '系统通知', 'notification.openStory': '开启剧情体验', 'notification.chatNow': '立即聊天', 'notification.creatorProfile': '创作者主页', 'notification.viewDetails': '查看详情', 'notification.markRead': '标为已读', 'notification.footerHint': '关注喜欢的 AI 角色创作者，及时接收作品更新与独家故事推送。',
    'chat.recent': '最近对话', 'chat.interacted': '已互动 ({{count}}) 位 AI 角色', 'chat.createCustom': '自定义新角色', 'chat.closeRecent': '关闭最近对话', 'chat.searchRecent': '搜索聊过天的角色或记录...', 'chat.favorites': '我的收藏', 'chat.noHistory': '暂无对话记录', 'chat.chooseLobby': '去大厅选择角色聊天', 'chat.deleteConversation': '删除对话', 'chat.browseLobby': '浏览更多角色大厅',
    'card.livePreview': '动态展示', 'card.removeCharacter': '删除角色', 'card.removeFavorite': '取消收藏', 'card.addFavorite': '加入收藏',
    'community.eyebrow': 'AI 创作者互动交流广场', 'community.heading': '社区创作与角色分享广场', 'community.description': '展示用户通过 AI 视觉工坊生成的动态视频、渲染美图与独创角色卡。一键复制 Prompt、互动点赞或直接开启聊天。', 'community.shareWork': '我也要生成作品并分享', 'community.tabAll': '🌟 全部推荐作品', 'community.tabFollowing': '❤️ 我的关注 ({{count}})', 'community.tabVideo': '📹 AI 动态视频', 'community.tabImage': '🖼️ 高清美图', 'community.noFollowing': '暂无关注创作者的作品', 'community.noFollowingHint': '您还没有关注任何创作者，或者您关注的创作者尚未发布新的动态。', 'community.exploreWorks': '去探索热门作品', 'community.loading': '正在加载社区作品...', 'community.empty': '暂无公开社区作品。', 'community.reload': '重新加载', 'community.generatedWork': '社区生成作品', 'community.followed': '已关注', 'community.follow': '+ 关注', 'community.workNote': '作品说明', 'community.copyPrompt': '复制 Prompt', 'community.copied': '已复制', 'community.noCaption': '作者未填写作品说明。', 'community.remix': '同款同风格生成', 'community.characters': '分享角色卡', 'community.viewProfile': '查看档案', 'community.feedLoadFailed': '社区动态加载失败，请稍后重试。', 'community.likeFailed': '点赞失败，请稍后重试。',
    'feed.loading': '正在加载动态视频', 'feed.loadFailed': '动态加载失败', 'feed.empty': '暂无该分类的动态视频', 'feed.followingEmpty': '您关注的创作者暂时还没有发布动态小视频。', 'feed.genericEmpty': '暂时没有找到更多角色小视频。', 'feed.generatedVideo': '生成的视频', 'feed.reload': '重新加载', 'feed.hot': '🔥 热门推荐', 'feed.following': '❤️ 我的关注 ({{count}})', 'feed.new': '✨ 最新动态', 'feed.swipe': '左右滑动切换', 'feed.previous': '上一个角色动态', 'feed.next': '下一个角色动态', 'feed.profile': '角色档案', 'feed.soundOn': '开启声音', 'feed.soundOff': '静音', 'feed.followCreator': '关注创作者', 'feed.followedCreator': '已关注创作者', 'feed.share': '分享', 'feed.shared': '已分享', 'feed.like': '点赞', 'feed.liked': '已点赞', 'feed.openChat': '开始聊天', 'feed.openDetails': '查看详情',
    'detail.close': '关闭角色详情', 'detail.unavailable': '角色详情不可用', 'detail.profile': '角色档案介绍', 'detail.favorite': '收藏角色', 'detail.likes': '喜欢', 'detail.chats': '次对话', 'detail.creator': '创建者：{{name}}', 'detail.openCreator': '点击查看创作者主页与发布作品', 'detail.info': '详细人设资料', 'detail.photos': '精彩写真 ({{count}})', 'detail.videos': '动态剧场 ({{count}})', 'detail.loading': '正在加载完整角色资料...', 'detail.background': '背景故事与性格', 'detail.noBackground': '该角色暂未提供背景故事。', 'detail.greeting': '聊天开场白', 'detail.tags': '属性标签', 'detail.noTags': '暂无公开标签', 'detail.prompt': '人设 System Prompt 指导概览', 'detail.noPrompt': '后端未公开该角色的 System Prompt。', 'detail.noPhotos': '该角色暂无公开图片。', 'detail.noVideos': '该角色暂无公开视频。', 'detail.privateChat': '和 {{name}} 展开一对一私人沉浸对话', 'detail.startChat': '开启对话聊天',
    'panel.title': '角色详细档案', 'panel.close': '关闭面板', 'panel.author': '作者', 'panel.chats': '对话', 'panel.intro': '一句话印象', 'panel.scenes': '限定互动故事剧场', 'panel.sceneCount': '{{count}} 个故事场景', 'panel.sceneHint': '默认开场场景免费开放，VIP 解锁专属限定剧本', 'panel.unlockStory': '解锁/查看【{{name}}】限定故事', 'panel.background': '角色背景与设定', 'panel.voice': 'AI 音色风格切换', 'panel.voiceApi': 'Django 可用', 'panel.voiceCatalog': '后端目录', 'panel.voiceHint': '声线目录由 Django 提供，切换后保存到当前 Thread', 'panel.voiceUnavailable': '当前角色未连接 Django 声线目录', 'panel.unlock': '解锁', 'panel.previewing': '试听中...', 'panel.used': '已使用', 'panel.switch': '切换', 'panel.hiddenPrompt': '未公开', 'panel.photosCount': '共 {{count}} 张高清写真照片', 'panel.photoHint': '点击照片可预览或设为背景', 'panel.currentBackground': '当前背景', 'panel.setBackground': '设为背景', 'panel.videosCount': '动态视频与剧场片段 ({{count}})', 'panel.videoHint': '点击播放视频', 'panel.play': '播放', 'panel.likes': '赞', 'panel.unlockVideo': '解锁 {{name}} 的限定互动故事', 'panel.setChatBackground': '设为聊天背景', 'panel.chatBackgroundSet': '✓ 已设为聊天背景', 'panel.videoUnsupported': '您的浏览器暂不支持视频播放。', 'panel.videoClip': '{{name}} 专属视频片段', 'panel.duration': '时长', 'panel.views': '播放量', 'panel.download': '高清原画下载',
    'creator.bioEmpty': '该创作者暂未提供公开个人简介。', 'creator.close': '关闭页面', 'creator.verified': '认证创作者', 'creator.followed': '已关注', 'creator.follow': '+ 关注创作者', 'creator.followers': '粉丝', 'creator.loading': '正在加载创作者资料...', 'creator.reload': '重新加载', 'creator.characters': '{{name}} 发布的角色列表', 'creator.noCharacters': '该创作者暂时还没有发布公开角色。', 'creator.videos': '{{name}} 发布的公开视频', 'creator.noVideos': '该创作者暂时还没有发布公开视频。', 'creator.loadMore': '加载更多',
    'my.title': '我的角色', 'my.eyebrow': '专属角色空间', 'my.description': '管理专属角色与收藏，随时继续属于你们的故事。', 'my.create': '创建角色', 'my.created': '我的角色', 'my.favorites': '我的收藏', 'my.chatting': '正在聊的角色', 'my.search': '在我的角色中搜索...', 'my.emptyCreated': '您还没有创建任何角色', 'my.emptyFavorites': '暂无收藏的角色卡', 'my.emptyChatting': '暂无正在进行的聊天', 'my.hintCreated': '使用 AI 角色工坊生成角色形象，创建专属背景故事。', 'my.hintFavorites': '在探索大厅点击角色卡右上角的心形按钮即可收藏。', 'my.hintChatting': '挑选一位 AI 角色开始对话，记录会自动保存在这里。', 'my.generate': '立即生成角色的形象与背景', 'my.explore': '去探索广场挑选角色', 'my.deleteCreated': '删除已创建角色', 'my.clearChat': '清除互动对话', 'my.confirmDelete': '确定删除该角色？', 'my.confirmClear': '清除对话记录？', 'my.warning': '警告：此操作不可撤销', 'my.cancel': '取消', 'my.confirmDeleteButton': '确认永久删除', 'my.confirmClearButton': '确认清除',
    'chat.disabled': '此聊天入口已停用，请从发现页进入可用角色。', 'chat.backExplore': '返回发现',
  },
  ja: {
    'notification.mobileHint': '更新とお知らせ', 'notification.creatorsShort': '作成者', 'notification.systemShort': 'システム',
    'notification.title': '通知', 'notification.unread': '{{count}}件未読', 'notification.hint': 'フォロー中のクリエイター更新と新機能のお知らせ', 'notification.creators': 'クリエイター更新', 'notification.system': 'システム告知', 'notification.allReadShort': 'すべて既読', 'notification.empty': '通知はありません', 'notification.emptyHint': 'フォロー中のクリエイターやシステムの更新がここに表示されます。', 'notification.followerWork': 'フォロー中のクリエイターの新作', 'notification.systemBadge': 'システム通知', 'notification.openStory': 'ストーリーを開く', 'notification.chatNow': '今すぐチャット', 'notification.creatorProfile': 'クリエイタープロフィール', 'notification.viewDetails': '詳細を見る', 'notification.markRead': '既読にする', 'notification.footerHint': '好きなクリエイターをフォローして更新を受け取りましょう。',
    'chat.recent': '最近のチャット', 'chat.interacted': '{{count}}人のキャラクター', 'chat.createCustom': 'カスタムキャラクターを作成', 'chat.closeRecent': '最近のチャットを閉じる', 'chat.searchRecent': 'チャットしたキャラクターやメッセージを検索...', 'chat.favorites': 'お気に入り', 'chat.noHistory': 'チャット履歴はありません', 'chat.chooseLobby': '探索からキャラクターを選択', 'chat.deleteConversation': 'チャットを削除', 'chat.browseLobby': 'キャラクターをもっと見る',
    'card.livePreview': 'ライブプレビュー', 'card.removeCharacter': 'キャラクターを削除', 'card.removeFavorite': 'お気に入りから削除', 'card.addFavorite': 'お気に入りに追加',
    'community.eyebrow': 'AIクリエイターコミュニティ', 'community.heading': 'コミュニティ作品とキャラクター共有', 'community.description': 'クリエイターが共有した動画、作品画像、オリジナルキャラクターカードを見つけましょう。プロンプトのコピーやいいね、チャットもできます。', 'community.shareWork': '作品を生成して共有', 'community.tabAll': '🌟 おすすめ作品', 'community.tabFollowing': '❤️ フォロー中 ({{count}})', 'community.tabVideo': '📹 AI動画', 'community.tabImage': '🖼️ AI画像', 'community.noFollowing': 'フォロー中のクリエイターの作品はありません', 'community.noFollowingHint': '探索やプロフィールからクリエイターをフォローすると、ここに新作が表示されます。', 'community.exploreWorks': 'おすすめ作品を見る', 'community.loading': 'コミュニティ作品を読み込み中...', 'community.empty': '公開された作品はまだありません。', 'community.reload': '再読み込み', 'community.generatedWork': 'コミュニティ作品', 'community.followed': 'フォロー中', 'community.follow': '+ フォロー', 'community.workNote': '作品説明', 'community.copyPrompt': 'プロンプトをコピー', 'community.copied': 'コピー済み', 'community.noCaption': '作品説明はありません。', 'community.remix': 'このスタイルで生成', 'community.characters': '共有キャラクター', 'community.viewProfile': 'プロフィールを見る', 'community.feedLoadFailed': 'コミュニティを読み込めませんでした。', 'community.likeFailed': 'いいねに失敗しました。',
    'feed.loading': '動画を読み込み中', 'feed.loadFailed': 'フィードを読み込めませんでした', 'feed.empty': 'このカテゴリの動画はありません', 'feed.followingEmpty': 'フォロー中のクリエイターはまだ動画を投稿していません。', 'feed.genericEmpty': 'キャラクター動画はありません。', 'feed.generatedVideo': '生成動画', 'feed.reload': '再読み込み', 'feed.hot': '🔥 人気', 'feed.following': '❤️ フォロー中 ({{count}})', 'feed.new': '✨ 最新', 'feed.swipe': '左右にスワイプ', 'feed.previous': '前の動画', 'feed.next': '次の動画', 'feed.profile': 'キャラクタープロフィール', 'feed.soundOn': '音声をオン', 'feed.soundOff': 'ミュート', 'feed.followCreator': 'フォロー', 'feed.followedCreator': 'フォロー中', 'feed.share': '共有', 'feed.shared': '共有済み', 'feed.like': 'いいね', 'feed.liked': 'いいね済み', 'feed.openChat': 'チャットを開始', 'feed.openDetails': '詳細を見る',
    'detail.close': 'キャラクター詳細を閉じる', 'detail.unavailable': 'キャラクター詳細を利用できません', 'detail.profile': 'キャラクタープロフィール', 'detail.favorite': 'お気に入り', 'detail.likes': 'いいね', 'detail.chats': 'チャット', 'detail.creator': '作成者：{{name}}', 'detail.openCreator': 'クリエイターのプロフィールと作品を見る', 'detail.info': 'プロフィール詳細', 'detail.photos': '写真 ({{count}})', 'detail.videos': '動画 ({{count}})', 'detail.loading': 'キャラクター詳細を読み込み中...', 'detail.background': '背景と性格', 'detail.noBackground': '背景ストーリーはありません。', 'detail.greeting': 'チャットの最初のメッセージ', 'detail.tags': '属性タグ', 'detail.noTags': '公開タグはありません', 'detail.prompt': 'システムプロンプト概要', 'detail.noPrompt': 'システムプロンプトは公開されていません。', 'detail.noPhotos': '公開画像はありません。', 'detail.noVideos': '公開動画はありません。', 'detail.privateChat': '{{name}}と一対一のチャットを始める', 'detail.startChat': 'チャットを開始',
    'panel.title': 'キャラクター詳細', 'panel.close': 'パネルを閉じる', 'panel.author': '作者', 'panel.chats': 'チャット', 'panel.intro': '一言紹介', 'panel.scenes': '限定インタラクション', 'panel.sceneCount': '{{count}}個のシーン', 'panel.sceneHint': 'デフォルトのオープニングは無料、VIPで限定脚本を解放できます。', 'panel.unlockStory': '{{name}}の限定ストーリーを開く', 'panel.background': '背景と設定', 'panel.voice': 'AI音声スタイル', 'panel.voiceApi': 'Django接続済み', 'panel.voiceCatalog': 'サーバーカタログ', 'panel.voiceHint': '音声カタログはDjangoから提供され、切り替えるとスレッドに保存されます。', 'panel.voiceUnavailable': 'このキャラクターはDjango音声カタログに接続されていません。', 'panel.unlock': '解放', 'panel.previewing': '試聴中...', 'panel.used': '使用中', 'panel.switch': '切り替え', 'panel.hiddenPrompt': '非公開', 'panel.photosCount': '{{count}}枚の写真', 'panel.photoHint': '写真をクリックしてプレビューまたは背景に設定', 'panel.currentBackground': '現在の背景', 'panel.setBackground': '背景に設定', 'panel.videosCount': '動画 ({{count}})', 'panel.videoHint': 'クリックして再生', 'panel.play': '再生', 'panel.likes': 'いいね', 'panel.unlockVideo': '{{name}}の限定ストーリーを解放', 'panel.setChatBackground': 'チャット背景に設定', 'panel.chatBackgroundSet': '✓ 背景に設定済み', 'panel.videoUnsupported': 'お使いのブラウザは動画再生に対応していません。', 'panel.videoClip': '{{name}}専用動画', 'panel.duration': '長さ', 'panel.views': '再生数', 'panel.download': 'HD原画をダウンロード',
    'creator.bioEmpty': 'このクリエイターは公開プロフィールを設定していません。', 'creator.close': 'ページを閉じる', 'creator.verified': '認証済みクリエイター', 'creator.followed': 'フォロー中', 'creator.follow': '+ クリエイターをフォロー', 'creator.followers': 'フォロワー', 'creator.loading': 'クリエイタープロフィールを読み込み中...', 'creator.reload': '再読み込み', 'creator.characters': '{{name}}のキャラクター', 'creator.noCharacters': '公開キャラクターはまだありません。', 'creator.videos': '{{name}}の公開動画', 'creator.noVideos': '公開動画はまだありません。', 'creator.loadMore': 'さらに読み込む',
    'my.title': 'マイキャラクター', 'my.eyebrow': '専用キャラクタースペース', 'my.description': 'キャラクターとお気に入りを管理し、いつでも物語を続けられます。', 'my.create': 'キャラクターを作成', 'my.created': 'マイキャラクター', 'my.favorites': 'お気に入り', 'my.chatting': 'チャット中', 'my.search': 'マイキャラクターを検索...', 'my.emptyCreated': '作成したキャラクターはありません', 'my.emptyFavorites': 'お気に入りはありません', 'my.emptyChatting': '進行中のチャットはありません', 'my.hintCreated': 'AIスタジオでキャラクターと物語を作りましょう。', 'my.hintFavorites': '探索でカードのハートを押すとお気に入りに追加できます。', 'my.hintChatting': 'キャラクターを選んで会話を始めると、ここに表示されます。', 'my.generate': 'キャラクターの画像と背景を生成', 'my.explore': 'キャラクターを探す', 'my.deleteCreated': '作成したキャラクターを削除', 'my.clearChat': 'チャットを消去', 'my.confirmDelete': 'このキャラクターを削除しますか？', 'my.confirmClear': 'チャット履歴を消去しますか？', 'my.warning': 'この操作は取り消せません。', 'my.cancel': 'キャンセル', 'my.confirmDeleteButton': '完全に削除', 'my.confirmClearButton': '消去', 'chat.disabled': 'このチャット入口は無効です。探索から利用可能なキャラクターを選んでください。', 'chat.backExplore': '探索に戻る',
  },
  ko: {
    'notification.mobileHint': '업데이트 및 알림', 'notification.creatorsShort': '크리에이터', 'notification.systemShort': '시스템',
    'notification.title': '알림 센터', 'notification.unread': '{{count}}개 읽지 않음', 'notification.hint': '팔로우한 크리에이터 업데이트 및 새 기능 안내', 'notification.creators': '크리에이터 업데이트', 'notification.system': '시스템 공지', 'notification.allReadShort': '모두 읽음', 'notification.empty': '알림이 없습니다', 'notification.emptyHint': '팔로우한 크리에이터나 시스템의 새 소식이 여기에 표시됩니다.', 'notification.followerWork': '팔로우한 크리에이터의 새 작품', 'notification.systemBadge': '시스템 알림', 'notification.openStory': '스토리 열기', 'notification.chatNow': '지금 채팅', 'notification.creatorProfile': '크리에이터 프로필', 'notification.viewDetails': '상세 보기', 'notification.markRead': '읽음으로 표시', 'notification.footerHint': '좋아하는 크리에이터를 팔로우하고 새 소식을 받아보세요.',
    'chat.recent': '최근 대화', 'chat.interacted': '상호작용한 캐릭터 {{count}}명', 'chat.createCustom': '커스텀 캐릭터 만들기', 'chat.closeRecent': '최근 대화 닫기', 'chat.searchRecent': '대화한 캐릭터나 메시지 검색...', 'chat.favorites': '즐겨찾기', 'chat.noHistory': '대화 기록이 없습니다', 'chat.chooseLobby': '탐색에서 캐릭터 선택', 'chat.deleteConversation': '대화 삭제', 'chat.browseLobby': '캐릭터 더 보기',
    'card.livePreview': '라이브 미리보기', 'card.removeCharacter': '캐릭터 삭제', 'card.removeFavorite': '즐겨찾기 삭제', 'card.addFavorite': '즐겨찾기 추가',
    'community.eyebrow': 'AI 크리에이터 커뮤니티', 'community.heading': '커뮤니티 창작물과 캐릭터 공유', 'community.description': '크리에이터가 공유한 영상, 렌더링 이미지와 오리지널 캐릭터 카드를 만나보세요. 프롬프트를 복사하고 좋아요를 누르거나 바로 채팅할 수 있습니다.', 'community.shareWork': '작품을 생성하고 공유하기', 'community.tabAll': '🌟 추천 작품', 'community.tabFollowing': '❤️ 팔로잉 ({{count}})', 'community.tabVideo': '📹 AI 동영상', 'community.tabImage': '🖼️ AI 이미지', 'community.noFollowing': '팔로우한 크리에이터의 작품이 없습니다', 'community.noFollowingHint': '탐색이나 프로필에서 크리에이터를 팔로우하면 새 작품이 여기에 표시됩니다.', 'community.exploreWorks': '추천 작품 탐색', 'community.loading': '커뮤니티 작품을 불러오는 중...', 'community.empty': '공개 커뮤니티 작품이 없습니다.', 'community.reload': '다시 불러오기', 'community.generatedWork': '커뮤니티 생성 작품', 'community.followed': '팔로잉', 'community.follow': '+ 팔로우', 'community.workNote': '작품 설명', 'community.copyPrompt': '프롬프트 복사', 'community.copied': '복사됨', 'community.noCaption': '작성자가 작품 설명을 입력하지 않았습니다.', 'community.remix': '같은 스타일로 생성', 'community.characters': '공유 캐릭터', 'community.viewProfile': '프로필 보기', 'community.feedLoadFailed': '커뮤니티 피드를 불러오지 못했습니다.', 'community.likeFailed': '좋아요에 실패했습니다.',
    'feed.loading': '동영상 로드 중', 'feed.loadFailed': '피드를 불러오지 못했습니다', 'feed.empty': '이 카테고리의 동영상이 없습니다', 'feed.followingEmpty': '팔로우한 크리에이터가 아직 동영상을 올리지 않았습니다.', 'feed.genericEmpty': '더 많은 캐릭터 동영상이 없습니다.', 'feed.generatedVideo': '생성 동영상', 'feed.reload': '다시 불러오기', 'feed.hot': '🔥 인기 추천', 'feed.following': '❤️ 팔로잉 ({{count}})', 'feed.new': '✨ 최신 동영상', 'feed.swipe': '좌우로 넘기기', 'feed.previous': '이전 동영상', 'feed.next': '다음 동영상', 'feed.profile': '캐릭터 프로필', 'feed.soundOn': '소리 켜기', 'feed.soundOff': '음소거', 'feed.followCreator': '크리에이터 팔로우', 'feed.followedCreator': '팔로잉 중', 'feed.share': '공유', 'feed.shared': '공유됨', 'feed.like': '좋아요', 'feed.liked': '좋아요함', 'feed.openChat': '채팅 시작', 'feed.openDetails': '상세 보기',
    'detail.close': '캐릭터 상세 닫기', 'detail.unavailable': '캐릭터 상세를 사용할 수 없습니다', 'detail.profile': '캐릭터 프로필', 'detail.favorite': '캐릭터 즐겨찾기', 'detail.likes': '좋아요', 'detail.chats': '채팅', 'detail.creator': '제작자: {{name}}', 'detail.openCreator': '크리에이터 프로필과 작품 보기', 'detail.info': '페르소나 상세', 'detail.photos': '사진 ({{count}})', 'detail.videos': '동영상 ({{count}})', 'detail.loading': '캐릭터 상세 정보를 불러오는 중...', 'detail.background': '배경과 성격', 'detail.noBackground': '배경 이야기가 없습니다.', 'detail.greeting': '채팅 시작 메시지', 'detail.tags': '속성 태그', 'detail.noTags': '공개 태그 없음', 'detail.prompt': '시스템 프롬프트 개요', 'detail.noPrompt': '시스템 프롬프트가 공개되지 않았습니다.', 'detail.noPhotos': '공개 이미지가 없습니다.', 'detail.noVideos': '공개 동영상이 없습니다.', 'detail.privateChat': '{{name}}와 1:1 몰입형 채팅 시작', 'detail.startChat': '채팅 시작',
    'panel.title': '캐릭터 상세 프로필', 'panel.close': '패널 닫기', 'panel.author': '작성자', 'panel.chats': '채팅', 'panel.intro': '한 줄 인상', 'panel.scenes': '한정 인터랙션 스토리', 'panel.sceneCount': '스토리 장면 {{count}}개', 'panel.sceneHint': '기본 오프닝은 무료이며 VIP로 전용 대본을 잠금 해제할 수 있습니다.', 'panel.unlockStory': '{{name}} 한정 스토리 열기', 'panel.background': '캐릭터 배경 및 설정', 'panel.voice': 'AI 음성 스타일', 'panel.voiceApi': 'Django 사용 가능', 'panel.voiceCatalog': '서버 목록', 'panel.voiceHint': '음성 목록은 Django에서 제공하며 변경 후 현재 Thread에 저장됩니다.', 'panel.voiceUnavailable': '이 캐릭터는 Django 음성 목록에 연결되지 않았습니다.', 'panel.unlock': '잠금 해제', 'panel.previewing': '미리 듣는 중...', 'panel.used': '사용 중', 'panel.switch': '변경', 'panel.hiddenPrompt': '비공개', 'panel.photosCount': '고화질 사진 {{count}}장', 'panel.photoHint': '사진을 눌러 미리 보거나 배경으로 설정', 'panel.currentBackground': '현재 배경', 'panel.setBackground': '배경으로 설정', 'panel.videosCount': '동영상 ({{count}})', 'panel.videoHint': '동영상을 재생하려면 클릭', 'panel.play': '재생', 'panel.likes': '좋아요', 'panel.unlockVideo': '{{name}} 한정 인터랙션 스토리 열기', 'panel.setChatBackground': '채팅 배경으로 설정', 'panel.chatBackgroundSet': '✓ 채팅 배경으로 설정됨', 'panel.videoUnsupported': '브라우저가 동영상 재생을 지원하지 않습니다.', 'panel.videoClip': '{{name}} 전용 동영상', 'panel.duration': '길이', 'panel.views': '조회수', 'panel.download': 'HD 원본 다운로드',
    'creator.bioEmpty': '이 크리에이터는 공개 소개를 작성하지 않았습니다.', 'creator.close': '페이지 닫기', 'creator.verified': '인증된 크리에이터', 'creator.followed': '팔로잉', 'creator.follow': '+ 크리에이터 팔로우', 'creator.followers': '팔로워', 'creator.loading': '크리에이터 프로필 로드 중...', 'creator.reload': '다시 불러오기', 'creator.characters': '{{name}}의 캐릭터 목록', 'creator.noCharacters': '공개 캐릭터가 아직 없습니다.', 'creator.videos': '{{name}}의 공개 동영상', 'creator.noVideos': '공개 동영상이 아직 없습니다.', 'creator.loadMore': '더 불러오기',
    'my.title': '내 캐릭터', 'my.eyebrow': '나만의 캐릭터 공간', 'my.description': '내 캐릭터와 즐겨찾기를 관리하고 언제든 이야기를 이어가세요.', 'my.create': '캐릭터 만들기', 'my.created': '내 캐릭터', 'my.favorites': '즐겨찾기', 'my.chatting': '대화 중', 'my.search': '내 캐릭터 검색...', 'my.emptyCreated': '만든 캐릭터가 없습니다', 'my.emptyFavorites': '즐겨찾기한 캐릭터가 없습니다', 'my.emptyChatting': '진행 중인 채팅이 없습니다', 'my.hintCreated': 'AI 스튜디오에서 캐릭터와 이야기를 만들어 보세요.', 'my.hintFavorites': '탐색에서 캐릭터 카드의 하트를 누르면 저장됩니다.', 'my.hintChatting': '캐릭터를 골라 대화를 시작하면 여기에 표시됩니다.', 'my.generate': '캐릭터 이미지와 배경 생성', 'my.explore': '탐색에서 캐릭터 선택', 'my.deleteCreated': '만든 캐릭터 삭제', 'my.clearChat': '대화 지우기', 'my.confirmDelete': '이 캐릭터를 삭제할까요?', 'my.confirmClear': '대화 기록을 지울까요?', 'my.warning': '이 작업은 되돌릴 수 없습니다.', 'my.cancel': '취소', 'my.confirmDeleteButton': '영구 삭제', 'my.confirmClearButton': '지우기', 'chat.disabled': '이 채팅 입구는 비활성화되었습니다. 탐색에서 사용할 수 있는 캐릭터를 선택하세요.', 'chat.backExplore': '탐색으로 돌아가기',
  },
};

const extendedSupplemental: Record<string, MessageMap> = {
  en: {
    'chat.errorHistory': 'Unable to load chat history. Please try again.', 'chat.errorMessages': 'Unable to load chat messages. Please try again.', 'chat.errorCharacterDetails': 'Character details could not be loaded. Please try again.', 'chat.disabled': 'This character is not connected to Django chat. Choose a public character from Explore.', 'chat.messageTooLong': 'Messages must be 8,000 characters or fewer.', 'chat.incomplete': 'The chat connection ended unexpectedly. Chat history was reloaded.', 'chat.errorSend': 'Message could not be sent. Please try again.', 'chat.errorStop': 'Stopping generation failed. Please try again.', 'chat.readAloudUnavailable': 'Only completed character replies can be read aloud.', 'chat.errorVoice': 'Voice generation failed. Please try again.', 'chat.voiceGenerating': 'Voice is still generating. Try playback again shortly.', 'chat.voiceReady': 'Voice is ready. Click play again.', 'chat.voicePlayback': 'Voice playback failed. Please try again.', 'chat.voiceRead': 'Voice could not be loaded. Please try again.', 'chat.errorHistoryAction': 'Chat history action failed. Please try again.', 'chat.noActive': 'No active conversation', 'chat.noActiveHint': 'Choose an AI character from Explore to start talking.', 'chat.exploreLobby': 'Explore characters', 'chat.unavailableTitle': 'Character unavailable for chat', 'chat.publicOnly': 'Django chat is available for public characters from Explore.', 'chat.recentDialog': 'Recent conversations', 'chat.closeRecent': 'Close recent conversations', 'chat.openRecent': 'Open recent conversations', 'chat.backExplore': 'Back to Explore', 'chat.openDetails': 'Open character details', 'chat.session': 'Django chat session', 'chat.selectBackground': 'Choose chat background', 'chat.cancelFavorite': 'Remove favorite', 'chat.favorite': 'Favorite character', 'chat.clearHistory': 'Clear chat history', 'chat.backgroundTitle': 'Custom chat background', 'chat.closeBackground': 'Close background picker', 'chat.backgroundOption': 'Chat background option', 'chat.resetBackground': 'Reset background', 'chat.playing': 'Playing...', 'chat.readAloud': 'Read aloud', 'chat.stopReading': 'Stop reading aloud', 'chat.messageFailed': 'Generation failed', 'chat.messageCanceled': 'Canceled', 'chat.thinking': '{{name}} is thinking...', 'chat.quickTopics': 'Quick topics:', 'chat.inputPlaceholder': 'Message {{name}}...', 'chat.stopGeneration': 'Stop generation', 'chat.sendMessage': 'Send message', 'chat.characterDetails': 'Character details', 'chat.clearHistoryTitle': 'Clear chat history', 'chat.removeRecentTitle': 'Remove recent conversation', 'chat.confirmClearText': 'Clear chat messages and chat images with {{name}}? Images already in the character gallery will remain, and any image still generating will be canceled.', 'chat.confirmDeleteText': 'Handle the conversation with {{name}}?', 'chat.confirm': 'Confirm',
    'generator.errorTargetLoad': 'Character cards could not be loaded. Please try again.', 'generator.errorUpload': 'Image upload failed. Please try again.', 'generator.errorTargetImage': 'This character card has no usable cover image.', 'generator.justNow': 'Just now', 'generator.complete': 'Generation complete', 'generator.cancelled': 'Generation canceled', 'generator.failed': 'Generation failed', 'generator.queued': 'Job queued...', 'generator.rendering': 'Atlas is rendering your image...', 'generator.errorFailed': 'Image generation failed. Please try again.', 'generator.modeUnavailable': 'This mode is not connected to a live generation endpoint yet.', 'generator.referenceRequired': 'Upload a reference image or choose a character card first.', 'generator.submit': 'Submitting image generation job...', 'generator.errorRequest': 'Image generation request failed. Please try again.', 'generator.cancel': 'Cancel generation', 'generator.errorCancel': 'Canceling generation failed.', 'generator.retrying': 'Retrying generation...', 'generator.errorRetry': 'Retrying generation failed. Please try again.', 'generator.shareRequiresCharacter': 'Sharing requires a readable public character, but none is available.', 'generator.shareSubmitted': 'Work submitted for community review.', 'generator.errorShare': 'Sharing the work failed. Please try again.', 'generator.generatedName': 'AI-generated character', 'generator.generatedSubtitle': 'Private character created by the AI visual generator', 'generator.errorCreate': 'Character creation failed. Please try again.', 'generator.title': 'AI visual & video workshop', 'generator.pro': 'Pro high-definition rendering', 'generator.subtitle': 'Customize pose, outfit, and scene presets. Django returns the job status and results.', 'generator.task': 'Generation task', 'generator.credits': '{{count}} free credits', 'generator.close': 'Close generator', 'generator.imageMode': 'Image mode', 'generator.videoMode': 'Video mode', 'generator.textToImage': 'Text to image', 'generator.imageToImage': 'Image to image', 'generator.textToVideo': 'Text to video', 'generator.imageToVideo': 'Image to video', 'generator.extendVideo': 'Extend', 'generator.uploadReference': 'Upload or choose a reference image', 'generator.supportedFormats': 'JPG / PNG / WEBP supported', 'generator.uploadLocal': 'Upload local image', 'generator.selectCharacter': 'Choose character card', 'generator.clear': 'Clear', 'generator.referenceCharacter': 'Character card: {{name}}', 'generator.localImage': 'Local image selected', 'generator.referenceRequiredShort': 'Image-to-image needs a reference image', 'generator.presetLibrary': 'Preset library (pose / outfit / scene)', 'generator.pose': 'Pose', 'generator.outfit': 'Outfit', 'generator.scene': 'Scene', 'generator.selected': 'selected', 'generator.unselected': 'not selected', 'generator.category': 'Category:', 'generator.switchLeft': 'Switch template left', 'generator.switchRight': 'Switch template right', 'generator.style': 'Image style', 'generator.anime': 'Anime illustration', 'generator.realistic': 'Photorealistic', 'generator.animeDesc': 'Japanese anime illustration with vivid detail', 'generator.realisticDesc': 'Cinematic portrait with realistic camera detail', 'generator.customDetails': 'Custom details', 'generator.randomInspiration': 'Random inspiration', 'generator.prompt': 'Prompt:', 'generator.dialogue': 'AI dialogue and lip-sync', 'generator.dialoguePlaceholder': 'What should the character say?', 'generator.renderSettings': 'Render & quality settings', 'generator.renderHint': 'Set output resolution, aspect ratio, duration, and quantity', 'generator.priority': 'Priority compute', 'generator.quality': 'Image / video quality', 'generator.lite': 'Lite sizing', 'generator.duration': 'Video duration (5s - 15s)', 'generator.resolution': 'Render resolution', 'generator.aspectRatio': 'Aspect ratio', 'generator.countImage': 'Image quantity', 'generator.countVideo': 'Video quantity', 'generator.singleOnly': 'One per job', 'generator.videoSingle': '1 video per job', 'generator.fixedSeed': 'Fixed seed', 'generator.locked': 'Locked', 'generator.random': 'Random', 'generator.generating': 'Rendering...', 'generator.generateImage': 'Generate image', 'generator.generateVideo': 'Generate video', 'generator.cost': 'Estimated cost: {{count}} free credits', 'generator.managed': 'Managed by Django', 'generator.stageTitle': 'Generated results', 'generator.liveResult': 'Live render result', 'generator.engine': 'Spicy Engine rendering...', 'generator.resultVideo': 'AI motion video', 'generator.resultImage': 'AI HD image', 'generator.shareDone': 'Shared to Community ✓', 'generator.share': 'Share work to Community', 'generator.download': 'Download', 'generator.setBackground': 'Set chat background', 'generator.makeCharacter': 'Make character', 'generator.history': 'Workshop history ({{count}})', 'generator.historyHint': 'Click an item to preview', 'generator.video': 'Video', 'generator.image': 'Image', 'generator.noHistory': 'No generation history', 'generator.characterPickerTitle': 'Character card source', 'generator.characterPickerHint': 'Choose a public character image as the reference', 'generator.scope': 'Scope', 'generator.created': 'Created', 'generator.liked': 'Liked', 'generator.gender': 'Gender', 'generator.anyGender': 'Any gender', 'generator.woman': 'Woman', 'generator.man': 'Man', 'generator.nonbinary': 'Non-binary', 'generator.styleFilter': 'Style', 'generator.anyStyle': 'Any style', 'generator.age': 'Age', 'generator.anyAge': 'Any age', 'generator.teen': '18 - 20', 'generator.young': '21 - 25', 'generator.adult': '26 - 29', 'generator.mature': '30+', 'generator.search': 'Search character cards', 'generator.noImage': 'No cover image', 'generator.loadingCards': 'Loading character cards...', 'generator.noCards': 'No matching character cards', 'generator.loadedCards': 'All character cards loaded',
    'create.voiceCatalogError': 'Voice catalog failed to load. Please try again.', 'create.generationError': 'Character generation failed. Please try again.', 'create.generationStatusError': 'Generation status could not be loaded. Please try again.', 'create.nameRequired': 'Enter a character name before generating.', 'create.nicknameLoading': 'Generating a nickname...', 'create.nicknameError': 'Could not generate a nickname. Try again or enter one yourself.', 'create.retryNickname': 'Retry nickname', 'create.nicknameAutoFilled': 'A nickname was generated for you. You can edit it.', 'create.voiceLoading': 'Voice catalog is loading. Please wait.', 'create.voiceRequired': 'Choose an available voice.', 'create.saveError': 'Character profile could not be saved. Please try again.', 'create.title': 'Adult AI character studio', 'create.step': 'Step {{current}} / 6', 'create.summary': 'Review the setup, then generate the character portrait.', 'create.generating': 'Generating character...', 'create.saved': 'Character saved to My characters', 'create.saveLatest': 'Save latest profile', 'create.viewCard': 'View character card', 'create.next': 'Next step', 'create.back': 'Previous step', 'create.cancel': 'Cancel', 'create.finish': 'Finish', 'create.step1': 'Art style & gender', 'create.step2': 'Race & species', 'create.step3': 'Appearance details', 'create.step4': 'Personality & tags', 'create.step5': 'Adult story', 'create.step6': 'Review & generate', 'create.stepHint': 'Complete the details and story, then generate a custom AI portrait.', 'create.artStyle': 'Art style', 'create.gender': 'Gender', 'create.race': 'Race & lineage', 'create.appearance': 'Visual details', 'create.personality': 'Personality & interests', 'create.story': 'Story and opening', 'create.preview': 'Preview', 'create.anime': 'Anime', 'create.realistic': 'Photorealistic', 'create.female': 'Female', 'create.male': 'Male', 'create.nonbinary': 'Non-binary', 'create.description': 'Background description', 'create.greeting': 'Opening message', 'create.voice': 'Voice', 'create.age': 'Age', 'create.tags': 'Tags',
    'help.heroBadge': 'Help desk & official support', 'help.heroTitle': 'Need help or want to share an idea?', 'help.heroDescription': 'Browse common questions, send feedback, join our Discord community, or read the safety guide.', 'help.discordCta': 'Join official Discord', 'help.discordMeta': '50,000+ players sharing ideas and rewards', 'help.tabFaq': 'FAQ', 'help.tabFeedback': 'Feedback', 'help.tabDiscord': 'Discord community', 'help.tabGuide': 'Guide & safety', 'help.tabPayPal': 'PayPal complaints', 'help.paypalComplaint.heroBadge': 'PayPal payment support', 'help.paypalComplaint.heroTitle': 'PayPal payment complaint channel', 'help.paypalComplaint.heroDescription': 'Use this secure mio channel to report a problem with a PayPal payment. Have your transaction details ready.', 'help.paypalComplaint.heroMeta': 'Secure payment complaint intake', 'help.paypalComplaint.sideTitle': 'Payment complaint', 'help.paypalComplaint.sideDescription': 'Tell us what happened with your PayPal payment so our team can review the transaction context.', 'help.paypalComplaint.prepareTransaction': 'Keep your PayPal transaction ID, payment date, amount, and currency nearby.', 'help.paypalComplaint.neverShare': 'Never enter a PayPal password, card number, CVV, or security code.', 'help.paypalComplaint.contactHint': 'Use an email address where our team can reach you about this complaint.', 'help.paypalComplaint.signInTitle': 'Sign in to submit a complaint', 'help.paypalComplaint.signInDescription': 'This channel is available to registered mio users so each complaint can be linked to an account.', 'help.paypalComplaint.signInButton': 'Sign in securely', 'help.paypalComplaint.formTitle': 'Submit payment complaint', 'help.paypalComplaint.formDescription': 'Provide the transaction details and describe the issue clearly. Fields marked with * are required.', 'help.paypalComplaint.transactionSection': 'Transaction details', 'help.paypalComplaint.complaintSection': 'Complaint details', 'help.paypalComplaint.transactionId': 'PayPal transaction ID', 'help.paypalComplaint.transactionIdHint': 'This is usually a 17-character ID shown in your PayPal activity or receipt.', 'help.paypalComplaint.paymentDate': 'Payment date', 'help.paypalComplaint.amount': 'Amount', 'help.paypalComplaint.currency': 'Currency code', 'help.paypalComplaint.complaintType': 'What went wrong?', 'help.paypalComplaint.desiredResolution': 'Preferred resolution', 'help.paypalComplaint.contactEmail': 'Contact email', 'help.paypalComplaint.details': 'What happened?', 'help.paypalComplaint.detailsPlaceholder': 'Describe what happened, including any relevant timing or context.', 'help.paypalComplaint.detailsHint': 'Do not include passwords or card security details.', 'help.paypalComplaint.selectPlaceholder': 'Select an option', 'help.paypalComplaint.typeServiceNotReceived': 'Service not received', 'help.paypalComplaint.typeDuplicateCharge': 'Duplicate charge', 'help.paypalComplaint.typeIncorrectAmount': 'Incorrect amount', 'help.paypalComplaint.typeRefundNotReceived': 'Refund not received', 'help.paypalComplaint.typeUnauthorizedTransaction': 'Unauthorized transaction', 'help.paypalComplaint.typeOther': 'Other payment issue', 'help.paypalComplaint.resolutionRefund': 'Refund', 'help.paypalComplaint.resolutionCorrection': 'Correct the charge', 'help.paypalComplaint.resolutionDelivery': 'Deliver the service', 'help.paypalComplaint.resolutionExplanation': 'Explain the transaction', 'help.paypalComplaint.resolutionOther': 'Other outcome', 'help.paypalComplaint.required': 'This field is required.', 'help.paypalComplaint.dateFuture': 'Payment date cannot be in the future.', 'help.paypalComplaint.amountInvalid': 'Enter an amount greater than zero.', 'help.paypalComplaint.currencyInvalid': 'Use a three-letter currency code, such as USD.', 'help.paypalComplaint.emailInvalid': 'Enter a valid email address.', 'help.paypalComplaint.validationError': 'Check the highlighted fields and try again.', 'help.paypalComplaint.invalidField': 'Check this field and try again.', 'help.paypalComplaint.error': 'The complaint could not be submitted. Please try again.', 'help.paypalComplaint.submit': 'Submit PayPal complaint', 'help.paypalComplaint.submitting': 'Submitting securely...', 'help.paypalComplaint.successTitle': 'Complaint received', 'help.paypalComplaint.successDescription': 'Your PayPal payment complaint has been recorded for review.', 'help.faqHeading': 'Popular questions', 'help.createTitle': 'Start creating your character', 'help.createDescription': 'Give a character a soul and a signature look.', 'help.createButton': 'Create a character', 'help.vipTitle': 'Explore VIP status', 'help.vipDescription': 'Learn what is and is not available in the current build.', 'help.vipButton': 'View VIP status', 'help.feedbackTitle': 'Send feedback', 'help.feedbackDescription': 'Your feedback helps the mio team improve.', 'help.feedbackReceived': 'Feedback received', 'help.feedbackThanks': 'Thank you. Our product and engineering teams will review it.', 'help.feedbackType': 'Feedback type', 'help.feedbackSuggestion': 'Feature suggestion', 'help.feedbackBug': 'Bug report', 'help.feedbackRole': 'Character / generation', 'help.feedbackBilling': 'VIP / billing', 'help.feedbackOther': 'Other question', 'help.rating': 'Overall satisfaction', 'help.ratingGreat': 'Very satisfied 🌟', 'help.feedbackDetails': 'Describe your idea or issue', 'help.feedbackEmail': 'Contact email (optional)', 'help.feedbackSubmit': 'Submit feedback', 'help.submitting': 'Submitting securely...', 'help.feedbackError': 'Feedback submission failed. Please try again.', 'help.discordTitle': 'Join the official mio Discord', 'help.discordDescription': 'Meet AI character creators and players from around the world.', 'help.discordJoin': 'Join official Discord server', 'help.guideTitle': 'Content safety and usage guide', 'help.guideDescription': 'Please follow these guidelines to keep interactions safe and respectful.', 'help.copyright': 'Copyright and original work', 'help.privacy': 'Private data encryption',
    'safety.badge': 'Safety Center', 'safety.description': 'Official policies and safety standards for Rulumi.', 'safety.policyCount': '{{count}} policies', 'safety.selectPolicy': 'Select a policy', 'safety.library': 'Policy library', 'safety.navLabel': 'Safety policies', 'safety.officialDocument': 'Official policy document', 'safety.translationNotice': 'Translations are provided for convenience. The English version controls in case of conflict.',
    'referral.status': 'Referral status', 'referral.title': 'Rewards', 'referral.intro': 'Referral rewards are not available in this build.', 'referral.notAvailable': 'Not available', 'referral.share': 'Share mio', 'referral.shareHint': 'Referral links and rewards are not enabled.', 'referral.noPaid': 'Paid features are not available', 'referral.noPaidHint': 'This page does not create payments, orders, memberships, or balances.', 'referral.linkTitle': 'Referral link', 'referral.linkUnavailable': 'Referral API is not available, so there is no link to copy.', 'referral.copy': 'Copy link', 'referral.copied': 'Copied', 'referral.daily': 'Daily reward', 'referral.dailyHint': 'The backend does not provide a daily reward endpoint.', 'referral.guide': 'Referral rules', 'referral.noRelations': 'Referral relations are not enabled', 'referral.noRelationsHint': 'No referral relation or reward will be created.', 'referral.noBilling': 'Paid and membership APIs are undefined', 'referral.noBillingHint': 'No recharge, order, subscription, or membership activation occurs.', 'referral.creditHint': 'Free credits come from the credits API and cannot be purchased or transferred.', 'referral.paymentTitle': 'Payment is not available', 'referral.paymentHint': 'There is no payment interface.', 'referral.cancel': 'Cancel', 'referral.confirm': 'Payment is not available', 'referral.history': 'Referral history', 'referral.noHistory': 'No records available', 'referral.noPayment': 'There is no payment interface for QR or simulated recharge.',
    'upgrade.status': 'Membership & paid feature status', 'upgrade.title': 'Membership, recharge, and order features are not available', 'upgrade.description': 'This build does not create memberships, orders, payments, or paid balances. Generation uses free credits from the backend.', 'upgrade.monthly': 'Monthly', 'upgrade.annual': 'Annual', 'upgrade.save50': 'Save 50%', 'upgrade.seniorUnavailable': 'Senior plan unavailable', 'upgrade.deluxeUnavailable': 'Deluxe plan unavailable', 'upgrade.noPlan': 'No plan available', 'upgrade.perMonth': '/ month', 'upgrade.paymentUnavailable': 'Paid interface unavailable', 'upgrade.noBenefits': 'No membership benefits are available', 'upgrade.creditHint': 'Use free credits from the backend generation API', 'upgrade.capabilities': 'Current capabilities: no membership benefits', 'upgrade.noSubscriptions': 'No subscription, order, or payment records are created', 'upgrade.noGiftCredits': 'No gifted or paid balance is issued', 'upgrade.serverCost': 'Image cost comes from server generation options', 'upgrade.videoContract': 'Video remains in the backend contract and is not enabled here', 'upgrade.noTransfer': 'Free credits cannot be recharged or transferred here', 'upgrade.subscribeUnavailable': 'Membership features are not available', 'upgrade.rechargeTitle': 'Recharge and order features are not available', 'upgrade.noPayment': 'No payment interface', 'upgrade.unavailableBalance': 'Paid balance unavailable', 'upgrade.unavailable': 'Unavailable', 'upgrade.capabilityTitle': 'Current capability notes', 'upgrade.noPaid': 'Membership, payment, recharge, order, and paid credit features are not available.', 'upgrade.costFromApi': 'Image job cost comes from server options and the credits API.', 'upgrade.balanceReject': 'The backend rejects jobs when credits are insufficient.', 'upgrade.videoImageOnly': 'Video remains in the backend contract; this build submits image text-to-image only.', 'upgrade.noPaymentEntry': 'There is no payment method or order entry.',
  },
  'zh-CN': {
    'chat.errorHistory': '无法加载聊天记录，请稍后重试。', 'chat.errorMessages': '无法加载聊天消息，请稍后重试。', 'chat.errorCharacterDetails': '角色详情加载失败，请稍后重试。', 'chat.disabled': '该角色尚未接入 Django 聊天服务，请从发现页选择公开角色。', 'chat.messageTooLong': '消息长度不能超过 8000 个字符。', 'chat.incomplete': '聊天连接返回了不完整状态，已重新加载聊天记录。', 'chat.errorSend': '消息发送失败，请稍后重试。', 'chat.errorStop': '停止生成失败，请稍后重试。', 'chat.readAloudUnavailable': '只有已完成的角色回复可以朗读。', 'chat.errorVoice': '语音生成失败，请稍后重试。', 'chat.voiceGenerating': '语音仍在生成，请稍后再次点击播放。', 'chat.voiceReady': '语音已生成，请再次点击播放。', 'chat.voicePlayback': '语音播放失败，请稍后重试。', 'chat.voiceRead': '语音读取失败，请稍后重试。', 'chat.errorHistoryAction': '聊天记录操作失败，请稍后重试。', 'chat.noActive': '暂无活动聊天', 'chat.noActiveHint': '在探索页选择一位 AI 角色开始倾诉吧。', 'chat.exploreLobby': '探索角色大厅', 'chat.unavailableTitle': '角色暂不可聊天', 'chat.publicOnly': 'Django 聊天仅支持发现页中的公开角色。', 'chat.recentDialog': '最近对话', 'chat.closeRecent': '关闭最近对话', 'chat.openRecent': '打开最近对话', 'chat.backExplore': '返回探索', 'chat.openDetails': '打开角色详情', 'chat.session': 'Django 聊天会话', 'chat.selectBackground': '选择聊天背景', 'chat.cancelFavorite': '取消收藏', 'chat.favorite': '收藏角色', 'chat.clearHistory': '清空聊天记录', 'chat.backgroundTitle': '自定义聊天背景图', 'chat.closeBackground': '关闭背景选择', 'chat.backgroundOption': '聊天背景选项', 'chat.resetBackground': '恢复默认背景', 'chat.playing': '播放中...', 'chat.readAloud': '语音朗读', 'chat.stopReading': '停止朗读', 'chat.messageFailed': '生成失败', 'chat.messageCanceled': '已取消', 'chat.thinking': '{{name}} 正在思考回复...', 'chat.quickTopics': '快捷话题:', 'chat.inputPlaceholder': '给 {{name}} 发送消息...', 'chat.stopGeneration': '停止生成', 'chat.sendMessage': '发送消息', 'chat.characterDetails': '角色详细档案', 'chat.clearHistoryTitle': '清空聊天记录', 'chat.removeRecentTitle': '移除最近对话', 'chat.confirmClearText': '确定清空与 {{name}} 的聊天文字和聊天内图片吗？精彩写真会保留，正在生成的聊天图片将取消。', 'chat.confirmDeleteText': '确定要处理与 {{name}} 的对话吗？', 'chat.confirm': '确认',
    'generator.errorTargetLoad': '角色卡加载失败，请稍后重试。', 'generator.errorUpload': '图片上传失败，请重试。', 'generator.errorTargetImage': '该角色卡没有可用主图，不能作为原图。', 'generator.justNow': '刚刚', 'generator.complete': '生成完成', 'generator.cancelled': '已取消生成', 'generator.failed': '生成失败', 'generator.queued': '任务排队中...', 'generator.rendering': 'Atlas 正在生成图片...', 'generator.errorFailed': '图片生成失败，请稍后重试。', 'generator.modeUnavailable': '当前模式暂未接入真实生成接口。', 'generator.referenceRequired': '请先上传原图或选择角色卡生成。', 'generator.submit': '正在提交图片生成任务...', 'generator.errorRequest': '图片生成请求失败，请稍后重试。', 'generator.cancel': '取消生成', 'generator.errorCancel': '取消生成失败。', 'generator.retrying': '正在重试生成任务...', 'generator.errorRetry': '重试生成失败，请稍后重试。', 'generator.shareRequiresCharacter': '分享动态需要关联一个可读取的公共角色，当前没有可用角色。', 'generator.shareSubmitted': '作品已提交社区审核，审核通过后将公开展示。', 'generator.errorShare': '作品分享失败，请稍后重试。', 'generator.generatedName': 'AI 生成新人设', 'generator.generatedSubtitle': '由 AI 视觉生成器创建的私有角色', 'generator.errorCreate': '角色创建失败，请稍后重试。', 'generator.title': 'AI 视觉与视频创作工坊', 'generator.pro': 'Pro 极速高清渲染', 'generator.subtitle': '姿势、服装、场景模板可定制，生成状态与成果由 Django 返回。', 'generator.task': '任务生成', 'generator.credits': '{{count}} 免费积分', 'generator.close': '关闭生成器', 'generator.imageMode': '图片模式', 'generator.videoMode': '视频模式', 'generator.textToImage': '文字转图片', 'generator.imageToImage': '图片转图片', 'generator.textToVideo': '文字转视频', 'generator.imageToVideo': '图片转视频', 'generator.extendVideo': '延长', 'generator.uploadReference': '上传或选择参考基准原图', 'generator.supportedFormats': '支持 JPG/PNG/WEBP', 'generator.uploadLocal': '上传本地图片', 'generator.selectCharacter': '角色卡生成', 'generator.clear': '清除', 'generator.referenceCharacter': '角色卡：{{name}}', 'generator.localImage': '已选择本地原图', 'generator.referenceRequiredShort': '图片转图片需要一张原图', 'generator.presetLibrary': '模板预选库 (选姿势/服装/场景)', 'generator.pose': '姿势', 'generator.outfit': '服装', 'generator.scene': '场景', 'generator.selected': '已选', 'generator.unselected': '未选', 'generator.category': '分类筛选:', 'generator.switchLeft': '向左切换模板', 'generator.switchRight': '向右切换模板', 'generator.style': '生成画风类型', 'generator.anime': '二次元动漫', 'generator.realistic': '写实摄影', 'generator.animeDesc': '日系二次元 · 精美动漫立绘', 'generator.realisticDesc': '写实画风 · 拟真单反画质', 'generator.customDetails': '自定义细节补充', 'generator.randomInspiration': '随机优美灵感', 'generator.prompt': '拼接 Prompt:', 'generator.dialogue': 'AI 台词与驱动口型配音', 'generator.dialoguePlaceholder': '输入想让他们说的话...', 'generator.renderSettings': '渲染与画质参数设置', 'generator.renderHint': '设定输出分辨率、比例、时长与生成数量', 'generator.priority': '优先加急算力', 'generator.quality': '生图 / 视频画质', 'generator.lite': 'Lite 比例尺寸', 'generator.duration': '视频时长 (5s ~ 15s)', 'generator.resolution': '绘制清晰度', 'generator.aspectRatio': '画面宽高比例', 'generator.countImage': '图片生成数量', 'generator.countVideo': '视频生成数量', 'generator.singleOnly': '单次仅限1个', 'generator.videoSingle': '1个视频 / 次', 'generator.fixedSeed': '固定 Seed 种子', 'generator.locked': '已锁定', 'generator.random': '随机', 'generator.generating': 'AI 正在全力渲染生成中...', 'generator.generateImage': '立即生成图片', 'generator.generateVideo': '立即生成视频', 'generator.cost': '本次预计消耗 {{count}} 免费积分', 'generator.managed': '任务由 Django 管理', 'generator.stageTitle': '渲染生成成果主展台', 'generator.liveResult': '实时渲染结果', 'generator.engine': 'Spicy Engine 高清渲染中...', 'generator.resultVideo': 'AI 动态视频', 'generator.resultImage': 'AI 高清图片', 'generator.shareDone': '已分享至社区广场 ✓', 'generator.share': '🌐 一键分享作品到社区广场', 'generator.download': '下载保存', 'generator.setBackground': '设聊天背景', 'generator.makeCharacter': '化为角色', 'generator.history': '我的工坊生成历史 ({{count}})', 'generator.historyHint': '点击切换查看', 'generator.video': '视频', 'generator.image': '图', 'generator.noHistory': '暂无生成记录', 'generator.characterPickerTitle': '角色卡生成', 'generator.characterPickerHint': '选择一张真实角色主图作为原图', 'generator.scope': '范围', 'generator.created': '已创建', 'generator.liked': '已点赞', 'generator.gender': '性别', 'generator.anyGender': '任意性别', 'generator.woman': '女', 'generator.man': '男', 'generator.nonbinary': '非二元', 'generator.styleFilter': '风格', 'generator.anyStyle': '任意风格', 'generator.age': '年龄', 'generator.anyAge': '任意年龄', 'generator.teen': '青少年', 'generator.young': '青年', 'generator.adult': '成人', 'generator.mature': '成熟', 'generator.search': '搜索角色卡', 'generator.noImage': '无可用主图', 'generator.loadingCards': '正在加载角色卡...', 'generator.noCards': '没有符合条件的角色卡', 'generator.loadedCards': '已加载全部角色卡',
    'create.voiceCatalogError': '语音目录加载失败，请稍后重试。', 'create.generationError': '角色生成失败，请重试。', 'create.generationStatusError': '生成状态读取失败，请重试。', 'create.nameRequired': '请输入角色名后再生成。', 'create.nicknameLoading': '正在为角色生成昵称...', 'create.nicknameError': '昵称生成失败，请重试或直接输入角色名。', 'create.retryNickname': '重试昵称', 'create.nicknameAutoFilled': '已自动填入昵称，你仍可自由修改。', 'create.voiceLoading': '语音目录加载中，请稍候。', 'create.voiceRequired': '请选择一个可用的专属配音音色。', 'create.saveError': '角色资料保存失败，请重试。', 'create.title': '成人 AI 角色全套设计流程', 'create.step': '步骤 {{current}} / 6', 'create.summary': '设定细节与性格故事后，在最终步骤生成专属 AI 立绘。', 'create.generating': '正在生成角色...', 'create.saved': '角色制作完成！已保存到我的角色', 'create.saveLatest': '保存最新资料', 'create.viewCard': '查看角色全貌卡片', 'create.next': '下一步', 'create.back': '上一步', 'create.cancel': '取消', 'create.finish': '完成', 'create.step1': '画风与性别', 'create.step2': '种族与血统', 'create.step3': '视觉外在细节', 'create.step4': '性格癖好属性', 'create.step5': '成人风格故事', 'create.step6': '方案汇总与立绘生成', 'create.stepHint': '设置完毕细节与性格故事后，将在最终步骤汇总生成专属 AI 立绘。', 'create.artStyle': '艺术画风类型', 'create.gender': '角色性别设定', 'create.race': '种族与血统', 'create.appearance': '视觉外在细节', 'create.personality': '性格癖好属性', 'create.story': '成人风格故事', 'create.preview': '预览', 'create.anime': '二次元动漫', 'create.realistic': '极致写实真人', 'create.female': '女性角色', 'create.male': '男性角色', 'create.nonbinary': '非二元 / 中性', 'create.description': '背景故事', 'create.greeting': '开场白', 'create.voice': '专属音色', 'create.age': '设定年龄', 'create.tags': '标签',
    'help.heroBadge': '帮助台 & 官方支持中心', 'help.heroTitle': '需要帮助，或者有想法想反馈给团队？', 'help.heroDescription': '这里包含常见问题解答、官方意见反馈通道，以及我们的官方 Discord 社区入口。', 'help.discordCta': '加入官方 Discord 社区', 'help.discordMeta': '50,000+ 玩家在线交流灵感与福利', 'help.tabFaq': '常见问题 FAQ', 'help.tabFeedback': '问题与意见反馈', 'help.tabDiscord': 'Discord 社区群组', 'help.tabGuide': '使用指南与安全说明', 'help.tabPayPal': 'PayPal 支付投诉', 'help.paypalComplaint.heroBadge': 'PayPal 支付支持', 'help.paypalComplaint.heroTitle': 'PayPal 支付投诉通道', 'help.paypalComplaint.heroDescription': '通过这个安全的 mio 通道报告 PayPal 支付问题。提交前请准备好交易信息。', 'help.paypalComplaint.heroMeta': '安全记录支付投诉', 'help.paypalComplaint.sideTitle': '支付投诉', 'help.paypalComplaint.sideDescription': '请说明 PayPal 支付发生了什么，方便团队核对交易上下文。', 'help.paypalComplaint.prepareTransaction': '请准备 PayPal 交易号、支付日期、金额和币种。', 'help.paypalComplaint.neverShare': '请勿填写 PayPal 密码、卡号、CVV 或安全验证码。', 'help.paypalComplaint.contactHint': '请填写团队可以联系到您的邮箱。', 'help.paypalComplaint.signInTitle': '登录后提交投诉', 'help.paypalComplaint.signInDescription': '该通道仅面向已注册的 mio 用户，投诉会关联到您的账号。', 'help.paypalComplaint.signInButton': '安全登录', 'help.paypalComplaint.formTitle': '提交支付投诉', 'help.paypalComplaint.formDescription': '填写交易信息并清晰描述问题，带 * 的字段为必填。', 'help.paypalComplaint.transactionSection': '交易信息', 'help.paypalComplaint.complaintSection': '投诉内容', 'help.paypalComplaint.transactionId': 'PayPal 交易号', 'help.paypalComplaint.transactionIdHint': '通常是 PayPal 账单或交易记录中显示的 17 位编号。', 'help.paypalComplaint.paymentDate': '支付日期', 'help.paypalComplaint.amount': '金额', 'help.paypalComplaint.currency': '币种代码', 'help.paypalComplaint.complaintType': '遇到的问题', 'help.paypalComplaint.desiredResolution': '期望处理方式', 'help.paypalComplaint.contactEmail': '联系邮箱', 'help.paypalComplaint.details': '发生了什么？', 'help.paypalComplaint.detailsPlaceholder': '请描述经过，并补充相关时间或上下文。', 'help.paypalComplaint.detailsHint': '请勿填写密码或银行卡安全信息。', 'help.paypalComplaint.selectPlaceholder': '请选择', 'help.paypalComplaint.typeServiceNotReceived': '未收到服务', 'help.paypalComplaint.typeDuplicateCharge': '重复扣款', 'help.paypalComplaint.typeIncorrectAmount': '扣款金额不符', 'help.paypalComplaint.typeRefundNotReceived': '退款未到账', 'help.paypalComplaint.typeUnauthorizedTransaction': '未经授权的交易', 'help.paypalComplaint.typeOther': '其他支付问题', 'help.paypalComplaint.resolutionRefund': '退款', 'help.paypalComplaint.resolutionCorrection': '纠正扣款', 'help.paypalComplaint.resolutionDelivery': '补交服务', 'help.paypalComplaint.resolutionExplanation': '说明交易情况', 'help.paypalComplaint.resolutionOther': '其他处理方式', 'help.paypalComplaint.required': '请填写此字段。', 'help.paypalComplaint.dateFuture': '支付日期不能晚于今天。', 'help.paypalComplaint.amountInvalid': '请输入大于零的金额。', 'help.paypalComplaint.currencyInvalid': '请输入三位币种代码，例如 USD。', 'help.paypalComplaint.emailInvalid': '请输入有效的邮箱地址。', 'help.paypalComplaint.validationError': '请检查标记的字段后重试。', 'help.paypalComplaint.invalidField': '请检查此字段后重试。', 'help.paypalComplaint.error': '投诉提交失败，请稍后重试。', 'help.paypalComplaint.submit': '提交 PayPal 投诉', 'help.paypalComplaint.submitting': '正在安全提交...', 'help.paypalComplaint.successTitle': '投诉已收到', 'help.paypalComplaint.successDescription': '您的 PayPal 支付投诉已记录，等待团队处理。', 'help.faqHeading': '热门常见疑问解答', 'help.createTitle': '开始创作属于您的角色', 'help.createDescription': '赋予角色灵魂与专属照片，随时沉浸在专属于您的对话世界。', 'help.createButton': '立即创建专属角色', 'help.vipTitle': '解锁 VIP 会员权益', 'help.vipDescription': '无限对话次数、解禁生图高级模型与视频专属效果。', 'help.vipButton': '查看 VIP 专属套餐', 'help.feedbackTitle': '问题与建议在线提交', 'help.feedbackDescription': '您的反馈是 lurova.ai 持续进化的最大动力。', 'help.feedbackReceived': '反馈已被成功接收！', 'help.feedbackThanks': '非常感谢您的宝贵建议！我们的团队会尽快评估。', 'help.feedbackType': '选择反馈类型', 'help.feedbackSuggestion': '功能建议', 'help.feedbackBug': 'Bug 报错', 'help.feedbackRole': '角色/生图', 'help.feedbackBilling': 'VIP账单', 'help.feedbackOther': '其他疑问', 'help.rating': '整体满意度评分', 'help.ratingGreat': '极其满意 🌟', 'help.feedbackDetails': '详细描述您的建议或遇到的问题', 'help.feedbackEmail': '联系邮箱 (选填，方便我们答复您)', 'help.feedbackSubmit': '确认提交反馈', 'help.submitting': '正在安全提交...', 'help.feedbackError': '反馈提交失败，请稍后重试。', 'help.discordTitle': '加入 lurova.ai 官方 Discord 频道', 'help.discordDescription': '汇聚全球 AI 角色创作者与玩家。', 'help.discordJoin': '点击跳转加入 Discord 官方服务器', 'help.guideTitle': '内容安全准则与用户使用须知', 'help.guideDescription': '为了给全体玩家营造和谐、有趣、安全的 AI 交互环境，请遵守以下安全准则。', 'help.copyright': '版权与原创保护', 'help.privacy': '隐私数据加密',
    'safety.badge': '安全中心', 'safety.description': 'mio 平台的官方政策与安全标准。', 'safety.policyCount': '{{count}} 项政策', 'safety.selectPolicy': '选择政策', 'safety.library': '政策目录', 'safety.navLabel': '安全政策', 'safety.officialDocument': '官方政策文档', 'safety.translationNotice': '译文仅供便利；如有冲突，以英文版本为准。',
    'referral.status': '推荐功能状态', 'referral.title': '推荐有礼', 'referral.intro': '分享 lurova.ai，推荐奖励功能暂未开放。', 'referral.notAvailable': '暂不可用', 'referral.share': '分享 mio', 'referral.shareHint': '邀请奖励、充值、会员和付费余额功能均未开放。', 'referral.noPaid': '付费功能暂未开放', 'referral.noPaidHint': '当前页面不会创建支付、订单、会员或付费余额。', 'referral.linkTitle': '推荐邀请链接', 'referral.linkUnavailable': '推荐邀请接口暂未开放，因此当前没有可用链接。', 'referral.copy': '复制链接', 'referral.copied': '已复制成功', 'referral.daily': '每日奖励功能暂未开放', 'referral.dailyHint': '后端尚未提供每日奖励接口。', 'referral.guide': '推荐收益细则指南', 'referral.noRelations': '邀请关系接口暂未开放', 'referral.noRelationsHint': '当前不会创建邀请关系或发放奖励。', 'referral.noBilling': '付费与会员接口未定义', 'referral.noBillingHint': '不会执行充值、订单、订阅或会员激活。', 'referral.creditHint': '免费积分只通过积分 API 返回，不能在此页面兑换、购买或转赠。', 'referral.paymentTitle': '付费功能暂未开放', 'referral.paymentHint': '暂无支付接口。', 'referral.cancel': '取消', 'referral.confirm': '支付功能暂未开放', 'referral.history': '推荐功能记录', 'referral.noHistory': '暂无可用记录', 'referral.noPayment': '当前没有支付接口，不能通过二维码或模拟操作充值。',
    'upgrade.status': '会员与付费功能状态', 'upgrade.title': '会员、充值和订单功能暂未开放', 'upgrade.description': '当前不创建会员、订单、支付或付费余额；生成能力只使用后端免费积分 API。', 'upgrade.monthly': '按月续订', 'upgrade.annual': '按年计费', 'upgrade.save50': '立省 50%', 'upgrade.seniorUnavailable': '高级会员功能暂未开放', 'upgrade.deluxeUnavailable': '豪华会员功能暂未开放', 'upgrade.noPlan': '暂无套餐', 'upgrade.perMonth': '/ 每月', 'upgrade.paymentUnavailable': '付费接口暂未开放', 'upgrade.noBenefits': '当前可用能力：无会员权益', 'upgrade.creditHint': '生成额度请使用后端免费积分 API', 'upgrade.capabilities': '当前可用能力：无会员权益', 'upgrade.noSubscriptions': '不创建订阅、订单或支付记录', 'upgrade.noGiftCredits': '不发放会员赠送额度或付费余额', 'upgrade.serverCost': '图像生成成本由服务端积分选项返回', 'upgrade.videoContract': '视频能力保留在后端契约，当前前端不启用', 'upgrade.noTransfer': '免费积分不能在此页面充值或转赠', 'upgrade.subscribeUnavailable': '会员功能暂未开放', 'upgrade.rechargeTitle': '充值和订单功能暂未开放', 'upgrade.noPayment': '暂无支付接口', 'upgrade.unavailableBalance': '付费余额不可用', 'upgrade.unavailable': '暂不可用', 'upgrade.capabilityTitle': '当前能力说明', 'upgrade.noPaid': '会员、支付、充值、订单和付费积分功能暂未开放。', 'upgrade.costFromApi': '图像任务成本由服务端生成选项和积分接口返回。', 'upgrade.balanceReject': '余额不足时后端拒绝创建任务，前端不会伪造成功结果。', 'upgrade.videoImageOnly': '视频能力保留在后端契约，本阶段前端只提交 image text-to-image。', 'upgrade.noPaymentEntry': '当前没有支付方式或订单入口。',
  },
  ja: {
    'chat.errorHistory': 'チャット履歴を読み込めませんでした。もう一度お試しください。', 'chat.errorMessages': 'メッセージを読み込めませんでした。', 'chat.errorCharacterDetails': 'キャラクター詳細を読み込めませんでした。', 'chat.disabled': 'このキャラクターはDjangoチャットに接続されていません。探索から公開キャラクターを選んでください。', 'chat.messageTooLong': 'メッセージは8,000文字以内にしてください。', 'chat.incomplete': 'チャット接続が途中で終了したため、履歴を再読み込みしました。', 'chat.errorSend': 'メッセージを送信できませんでした。', 'chat.errorStop': '生成の停止に失敗しました。', 'chat.readAloudUnavailable': '読み上げできるのは完了した返信だけです。', 'chat.errorVoice': '音声生成に失敗しました。', 'chat.voiceGenerating': '音声を生成中です。少し待ってから再生してください。', 'chat.voiceReady': '音声が準備できました。もう一度再生してください。', 'chat.voicePlayback': '音声再生に失敗しました。', 'chat.voiceRead': '音声を読み込めませんでした。', 'chat.errorHistoryAction': 'チャット履歴の操作に失敗しました。', 'chat.noActive': 'アクティブなチャットはありません', 'chat.noActiveHint': '探索からAIキャラクターを選んで会話を始めましょう。', 'chat.exploreLobby': 'キャラクターを探す', 'chat.unavailableTitle': 'このキャラクターはチャットできません', 'chat.publicOnly': 'Djangoチャットは探索の公開キャラクターに対応しています。', 'chat.recentDialog': '最近のチャット', 'chat.closeRecent': '最近のチャットを閉じる', 'chat.openRecent': '最近のチャットを開く', 'chat.backExplore': '探索に戻る', 'chat.openDetails': 'キャラクター詳細を開く', 'chat.session': 'Djangoチャットセッション', 'chat.selectBackground': 'チャット背景を選択', 'chat.cancelFavorite': 'お気に入りから削除', 'chat.favorite': 'お気に入りに追加', 'chat.clearHistory': 'チャット履歴を消去', 'chat.backgroundTitle': 'カスタムチャット背景', 'chat.closeBackground': '背景選択を閉じる', 'chat.backgroundOption': 'チャット背景候補', 'chat.resetBackground': '背景をリセット', 'chat.playing': '再生中...', 'chat.readAloud': '読み上げ', 'chat.stopReading': '読み上げを停止', 'chat.messageFailed': '生成に失敗', 'chat.messageCanceled': 'キャンセル済み', 'chat.thinking': '{{name}}が考えています...', 'chat.quickTopics': 'クイックトピック:', 'chat.inputPlaceholder': '{{name}}にメッセージ...', 'chat.stopGeneration': '生成を停止', 'chat.sendMessage': 'メッセージを送信', 'chat.characterDetails': 'キャラクター詳細', 'chat.clearHistoryTitle': 'チャット履歴を消去', 'chat.removeRecentTitle': '最近のチャットを削除', 'chat.confirmClearText': '{{name}}とのチャットメッセージとチャット内画像を消去しますか？キャラクター写真は保持され、生成中の画像はキャンセルされます。', 'chat.confirmDeleteText': '{{name}}とのチャットを処理しますか？', 'chat.confirm': '確認',
    'generator.errorTargetLoad': 'キャラクターカードを読み込めませんでした。', 'generator.errorUpload': '画像のアップロードに失敗しました。', 'generator.errorTargetImage': 'このカードには利用できる画像がありません。', 'generator.justNow': 'たった今', 'generator.complete': '生成完了', 'generator.cancelled': '生成をキャンセルしました', 'generator.failed': '生成に失敗', 'generator.queued': 'タスクを待機中...', 'generator.rendering': 'Atlasが画像を生成中...', 'generator.errorFailed': '画像生成に失敗しました。', 'generator.modeUnavailable': 'このモードはまだ接続されていません。', 'generator.referenceRequired': '参照画像をアップロードするかカードを選択してください。', 'generator.submit': '画像生成タスクを送信中...', 'generator.errorRequest': '画像生成リクエストに失敗しました。', 'generator.cancel': '生成をキャンセル', 'generator.errorCancel': 'キャンセルに失敗しました。', 'generator.retrying': '生成を再試行中...', 'generator.errorRetry': '再試行に失敗しました。', 'generator.shareRequiresCharacter': '共有には公開キャラクターが必要です。', 'generator.shareSubmitted': '作品をコミュニティ審査に送信しました。', 'generator.errorShare': '作品の共有に失敗しました。', 'generator.generatedName': 'AI生成キャラクター', 'generator.generatedSubtitle': 'AIビジュアルジェネレーターで作成した非公開キャラクター', 'generator.errorCreate': 'キャラクター作成に失敗しました。', 'generator.title': 'AIビジュアル＆動画スタジオ', 'generator.pro': 'Pro高解像度レンダリング', 'generator.subtitle': 'ポーズ、衣装、シーンをカスタマイズできます。結果はDjangoから返されます。', 'generator.task': '生成タスク', 'generator.credits': '{{count}}無料クレジット', 'generator.close': 'ジェネレーターを閉じる', 'generator.imageMode': '画像モード', 'generator.videoMode': '動画モード', 'generator.textToImage': 'テキストから画像', 'generator.imageToImage': '画像から画像', 'generator.textToVideo': 'テキストから動画', 'generator.imageToVideo': '画像から動画', 'generator.extendVideo': '延長', 'generator.uploadReference': '参照画像をアップロードまたは選択', 'generator.supportedFormats': 'JPG / PNG / WEBP対応', 'generator.uploadLocal': 'ローカル画像をアップロード', 'generator.selectCharacter': 'キャラクターカードを選択', 'generator.clear': 'クリア', 'generator.referenceCharacter': 'カード：{{name}}', 'generator.localImage': 'ローカル画像を選択済み', 'generator.referenceRequiredShort': '画像変換には参照画像が必要です', 'generator.presetLibrary': 'プリセット（ポーズ・衣装・シーン）', 'generator.pose': 'ポーズ', 'generator.outfit': '衣装', 'generator.scene': 'シーン', 'generator.selected': '選択済み', 'generator.unselected': '未選択', 'generator.category': 'カテゴリ:', 'generator.switchLeft': 'テンプレートを左へ', 'generator.switchRight': 'テンプレートを右へ', 'generator.style': '画風', 'generator.anime': 'アニメ', 'generator.realistic': 'リアル', 'generator.animeDesc': '日本のアニメ風イラスト', 'generator.realisticDesc': '映画的なリアルポートレート', 'generator.customDetails': 'カスタム詳細', 'generator.randomInspiration': 'ランダムなインスピレーション', 'generator.prompt': 'プロンプト:', 'generator.dialogue': 'AIセリフとリップシンク', 'generator.dialoguePlaceholder': 'キャラクターに何を話させますか？', 'generator.renderSettings': 'レンダー設定', 'generator.renderHint': '解像度、比率、長さ、数量を設定', 'generator.priority': '優先処理', 'generator.quality': '画質', 'generator.lite': 'Liteサイズ', 'generator.duration': '動画時間 (5〜15秒)', 'generator.resolution': '解像度', 'generator.aspectRatio': 'アスペクト比', 'generator.countImage': '画像枚数', 'generator.countVideo': '動画数', 'generator.singleOnly': '1回1個', 'generator.videoSingle': '1動画 / 回', 'generator.fixedSeed': '固定Seed', 'generator.locked': '固定', 'generator.random': 'ランダム', 'generator.generating': 'レンダリング中...', 'generator.generateImage': '画像を生成', 'generator.generateVideo': '動画を生成', 'generator.cost': '予想コスト：{{count}}無料クレジット', 'generator.managed': 'Djangoが管理', 'generator.stageTitle': '生成結果', 'generator.liveResult': 'リアルタイム結果', 'generator.engine': 'Spicy Engineでレンダリング中...', 'generator.resultVideo': 'AI動画', 'generator.resultImage': 'AI高画質画像', 'generator.shareDone': 'コミュニティに共有済み ✓', 'generator.share': '作品をコミュニティに共有', 'generator.download': 'ダウンロード', 'generator.setBackground': 'チャット背景に設定', 'generator.makeCharacter': 'キャラクター化', 'generator.history': '生成履歴 ({{count}})', 'generator.historyHint': 'クリックして表示', 'generator.video': '動画', 'generator.image': '画像', 'generator.noHistory': '生成履歴はありません', 'generator.characterPickerTitle': 'キャラクターカード', 'generator.characterPickerHint': '参照画像を選択', 'generator.scope': '範囲', 'generator.created': '作成済み', 'generator.liked': 'いいね済み', 'generator.gender': '性別', 'generator.anyGender': 'すべて', 'generator.woman': '女性', 'generator.man': '男性', 'generator.nonbinary': 'ノンバイナリー', 'generator.styleFilter': '画風', 'generator.anyStyle': 'すべて', 'generator.age': '年齢', 'generator.anyAge': 'すべて', 'generator.teen': '18〜20', 'generator.young': '21〜25', 'generator.adult': '26〜29', 'generator.mature': '30+', 'generator.search': 'カードを検索', 'generator.noImage': '画像なし', 'generator.loadingCards': 'カードを読み込み中...', 'generator.noCards': '一致するカードはありません', 'generator.loadedCards': 'すべてのカードを読み込みました',
    'create.voiceCatalogError': '音声カタログを読み込めませんでした。', 'create.generationError': 'キャラクター生成に失敗しました。', 'create.generationStatusError': '生成状態を読み込めませんでした。', 'create.nameRequired': '生成前にキャラクター名を入力してください。', 'create.nicknameLoading': 'ニックネームを生成中...', 'create.nicknameError': 'ニックネームを生成できませんでした。再試行するか、名前を入力してください。', 'create.retryNickname': 'ニックネームを再生成', 'create.nicknameAutoFilled': 'ニックネームを自動入力しました。自由に編集できます。', 'create.voiceLoading': '音声カタログを読み込み中です。', 'create.voiceRequired': '利用できる音声を選択してください。', 'create.saveError': 'キャラクターを保存できませんでした。', 'create.title': 'AIキャラクター作成フロー', 'create.step': 'ステップ {{current}} / 6', 'create.summary': '設定を確認して、カスタムポートレートを生成します。', 'create.generating': 'キャラクターを生成中...', 'create.saved': 'キャラクターを保存しました', 'create.saveLatest': 'プロフィールを保存', 'create.viewCard': 'キャラクターカードを見る', 'create.next': '次へ', 'create.back': '戻る', 'create.cancel': 'キャンセル', 'create.finish': '完了', 'create.step1': '画風と性別', 'create.step2': '種族と血統', 'create.step3': '外見の詳細', 'create.step4': '性格とタグ', 'create.step5': 'ストーリー', 'create.step6': '確認と生成', 'create.stepHint': '詳細とストーリーを設定してポートレートを生成します。', 'create.artStyle': '画風', 'create.gender': '性別', 'create.race': '種族と血統', 'create.appearance': '外見', 'create.personality': '性格と趣味', 'create.story': 'ストーリー', 'create.preview': 'プレビュー', 'create.anime': 'アニメ', 'create.realistic': 'リアル', 'create.female': '女性', 'create.male': '男性', 'create.nonbinary': 'ノンバイナリー', 'create.description': '背景説明', 'create.greeting': '開始メッセージ', 'create.voice': '音声', 'create.age': '年齢', 'create.tags': 'タグ',
    'help.heroBadge': 'ヘルプ＆公式サポート', 'help.heroTitle': 'サポートが必要ですか？', 'help.heroDescription': 'よくある質問、フィードバック、Discord、セーフティガイドをご覧ください。', 'help.discordCta': '公式Discordに参加', 'help.discordMeta': '50,000人以上のユーザー', 'help.tabFaq': 'FAQ', 'help.tabFeedback': 'フィードバック', 'help.tabDiscord': 'Discord', 'help.tabGuide': 'ガイドと安全', 'help.tabPayPal': 'PayPal 支払いの苦情', 'help.paypalComplaint.heroBadge': 'PayPal 支払いサポート', 'help.paypalComplaint.heroTitle': 'PayPal 支払いに関する苦情窓口', 'help.paypalComplaint.heroDescription': 'PayPal 支払いの問題を安全に報告できます。送信前に取引情報をご用意ください。', 'help.paypalComplaint.heroMeta': '安全な支払い苦情受付', 'help.paypalComplaint.sideTitle': '支払いに関する苦情', 'help.paypalComplaint.sideDescription': 'PayPal 支払いで起きたことをお知らせください。取引の確認に使用します。', 'help.paypalComplaint.prepareTransaction': 'PayPal の取引 ID、支払日、金額、通貨をご用意ください。', 'help.paypalComplaint.neverShare': 'PayPal のパスワード、カード番号、CVV、セキュリティコードは入力しないでください。', 'help.paypalComplaint.contactHint': 'チームが連絡できるメールアドレスを入力してください。', 'help.paypalComplaint.signInTitle': 'ログインして苦情を送信', 'help.paypalComplaint.signInDescription': 'この窓口は登録済みの mio ユーザー向けです。苦情をアカウントに紐づけて確認します。', 'help.paypalComplaint.signInButton': '安全にログイン', 'help.paypalComplaint.formTitle': '支払いに関する苦情を送信', 'help.paypalComplaint.formDescription': '取引情報と問題の内容を入力してください。* は必須項目です。', 'help.paypalComplaint.transactionSection': '取引情報', 'help.paypalComplaint.complaintSection': '苦情の内容', 'help.paypalComplaint.transactionId': 'PayPal 取引 ID', 'help.paypalComplaint.transactionIdHint': '通常は PayPal の利用履歴や領収書に表示される ID です。', 'help.paypalComplaint.paymentDate': '支払日', 'help.paypalComplaint.amount': '金額', 'help.paypalComplaint.currency': '通貨コード', 'help.paypalComplaint.complaintType': '問題の種類', 'help.paypalComplaint.desiredResolution': '希望する対応', 'help.paypalComplaint.contactEmail': '連絡先メール', 'help.paypalComplaint.details': '何が起きましたか？', 'help.paypalComplaint.detailsPlaceholder': '経緯や関連する日時を詳しく入力してください。', 'help.paypalComplaint.detailsHint': 'パスワードやカードのセキュリティ情報は入力しないでください。', 'help.paypalComplaint.selectPlaceholder': '選択してください', 'help.paypalComplaint.typeServiceNotReceived': 'サービスが届かない', 'help.paypalComplaint.typeDuplicateCharge': '二重請求', 'help.paypalComplaint.typeIncorrectAmount': '請求額が違う', 'help.paypalComplaint.typeRefundNotReceived': '返金が届かない', 'help.paypalComplaint.typeUnauthorizedTransaction': '身に覚えのない取引', 'help.paypalComplaint.typeOther': 'その他の支払い問題', 'help.paypalComplaint.resolutionRefund': '返金', 'help.paypalComplaint.resolutionCorrection': '請求額の修正', 'help.paypalComplaint.resolutionDelivery': 'サービスの提供', 'help.paypalComplaint.resolutionExplanation': '取引の説明', 'help.paypalComplaint.resolutionOther': 'その他', 'help.paypalComplaint.required': '入力してください。', 'help.paypalComplaint.dateFuture': '支払日に未来の日付は使えません。', 'help.paypalComplaint.amountInvalid': '0 より大きい金額を入力してください。', 'help.paypalComplaint.currencyInvalid': 'USD など3文字の通貨コードを入力してください。', 'help.paypalComplaint.emailInvalid': '有効なメールアドレスを入力してください。', 'help.paypalComplaint.validationError': '入力内容を確認してもう一度お試しください。', 'help.paypalComplaint.invalidField': 'この項目を確認してください。', 'help.paypalComplaint.error': '送信できませんでした。もう一度お試しください。', 'help.paypalComplaint.submit': 'PayPal 苦情を送信', 'help.paypalComplaint.submitting': '安全に送信中...', 'help.paypalComplaint.successTitle': '苦情を受け付けました', 'help.paypalComplaint.successDescription': 'PayPal 支払いの苦情を記録しました。チームが確認します。', 'help.faqHeading': 'よくある質問', 'help.createTitle': 'キャラクターを作成', 'help.createDescription': 'キャラクターに魂と個性を与えましょう。', 'help.createButton': 'キャラクターを作る', 'help.vipTitle': 'VIPステータス', 'help.vipDescription': '現在利用できる機能を確認できます。', 'help.vipButton': 'VIPステータスを見る', 'help.feedbackTitle': 'フィードバックを送信', 'help.feedbackDescription': 'ご意見がmioの改善に役立ちます。', 'help.feedbackReceived': 'フィードバックを受け取りました', 'help.feedbackThanks': 'ありがとうございます。チームが確認します。', 'help.feedbackType': '種類を選択', 'help.feedbackSuggestion': '機能提案', 'help.feedbackBug': 'バグ報告', 'help.feedbackRole': 'キャラクター / 生成', 'help.feedbackBilling': 'VIP / 請求', 'help.feedbackOther': 'その他', 'help.rating': '満足度', 'help.ratingGreat': 'とても満足 🌟', 'help.feedbackDetails': '内容を入力', 'help.feedbackEmail': '連絡先メール（任意）', 'help.feedbackSubmit': '送信', 'help.submitting': '安全に送信中...', 'help.feedbackError': '送信に失敗しました。', 'help.discordTitle': 'mio公式Discord', 'help.discordDescription': '世界中のAIキャラクター制作者と交流できます。', 'help.discordJoin': '公式サーバーに参加', 'help.guideTitle': '安全ガイド', 'help.guideDescription': '安全で楽しい交流のためにルールを守ってください。', 'help.copyright': '著作権とオリジナル作品', 'help.privacy': 'プライベートデータの暗号化',
    'safety.badge': '安全センター', 'safety.description': 'mioの公式ポリシーと安全基準。', 'safety.policyCount': '{{count}}件のポリシー', 'safety.selectPolicy': 'ポリシーを選択', 'safety.library': 'ポリシー一覧', 'safety.navLabel': '安全ポリシー', 'safety.officialDocument': '公式ポリシー文書', 'safety.translationNotice': 'この翻訳は便宜のために提供されます。矛盾がある場合は英語版が優先されます。',
    'referral.status': '紹介ステータス', 'referral.title': '特典', 'referral.intro': '紹介報酬はこのビルドでは利用できません。', 'referral.notAvailable': '利用不可', 'referral.share': 'mioを共有', 'referral.shareHint': '紹介リンクと報酬は有効化されていません。', 'referral.noPaid': '有料機能は利用できません', 'referral.noPaidHint': '支払い、注文、会員、残高は作成されません。', 'referral.linkTitle': '紹介リンク', 'referral.linkUnavailable': '紹介APIがないためリンクはありません。', 'referral.copy': 'リンクをコピー', 'referral.copied': 'コピーしました', 'referral.daily': 'デイリー報酬', 'referral.dailyHint': 'デイリー報酬APIはありません。', 'referral.guide': '紹介ルール', 'referral.noRelations': '紹介関係は有効ではありません', 'referral.noRelationsHint': '紹介関係や報酬は作成されません。', 'referral.noBilling': '決済・会員APIは未定義です', 'referral.noBillingHint': 'チャージ、注文、購読、会員有効化は行いません。', 'referral.creditHint': '無料クレジットはAPIから返され、購入や譲渡はできません。', 'referral.paymentTitle': '決済は利用できません', 'referral.paymentHint': '決済インターフェースはありません。', 'referral.cancel': 'キャンセル', 'referral.confirm': '決済は利用できません', 'referral.history': '紹介履歴', 'referral.noHistory': '記録はありません', 'referral.noPayment': 'QRや模擬操作によるチャージはできません。',
    'upgrade.status': '会員・有料機能の状態', 'upgrade.title': '会員、チャージ、注文機能は利用できません', 'upgrade.description': '会員・注文・決済・有料残高は作成されません。生成はバックエンドの無料クレジットを使用します。', 'upgrade.monthly': '月額', 'upgrade.annual': '年額', 'upgrade.save50': '50%オフ', 'upgrade.seniorUnavailable': 'シニアプランは利用できません', 'upgrade.deluxeUnavailable': 'デラックスプランは利用できません', 'upgrade.noPlan': 'プランなし', 'upgrade.perMonth': '/ 月', 'upgrade.paymentUnavailable': '有料インターフェースなし', 'upgrade.noBenefits': '会員特典はありません', 'upgrade.creditHint': 'バックエンドの無料クレジットを使用してください', 'upgrade.capabilities': '現在の機能：会員特典なし', 'upgrade.noSubscriptions': '購読、注文、決済記録は作成されません', 'upgrade.noGiftCredits': '付与残高や有料残高は発行されません', 'upgrade.serverCost': '画像コストはサーバーの生成オプションから返されます', 'upgrade.videoContract': '動画はバックエンド契約に残り、ここでは有効化されません', 'upgrade.noTransfer': '無料クレジットのチャージや譲渡はできません', 'upgrade.subscribeUnavailable': '会員機能は利用できません', 'upgrade.rechargeTitle': 'チャージと注文は利用できません', 'upgrade.noPayment': '決済インターフェースなし', 'upgrade.unavailableBalance': '有料残高は利用できません', 'upgrade.unavailable': '利用不可', 'upgrade.capabilityTitle': '現在の機能メモ', 'upgrade.noPaid': '会員、決済、チャージ、注文、有料クレジットは利用できません。', 'upgrade.costFromApi': '画像コストはサーバーとクレジットAPIから返されます。', 'upgrade.balanceReject': '残高不足の場合、バックエンドがタスクを拒否します。', 'upgrade.videoImageOnly': '動画は契約に残りますが、このビルドは画像のみ送信します。', 'upgrade.noPaymentEntry': '決済方法や注文入口はありません。',
  },
  ko: {
    'chat.errorHistory': '채팅 기록을 불러오지 못했습니다. 다시 시도해 주세요.', 'chat.errorMessages': '채팅 메시지를 불러오지 못했습니다.', 'chat.errorCharacterDetails': '캐릭터 상세 정보를 불러오지 못했습니다.', 'chat.disabled': '이 캐릭터는 Django 채팅에 연결되지 않았습니다. 탐색에서 공개 캐릭터를 선택하세요.', 'chat.messageTooLong': '메시지는 8,000자 이하여야 합니다.', 'chat.incomplete': '채팅 연결이 예상치 않게 종료되어 기록을 다시 불러왔습니다.', 'chat.errorSend': '메시지를 보내지 못했습니다.', 'chat.errorStop': '생성 중지에 실패했습니다.', 'chat.readAloudUnavailable': '완료된 캐릭터 답변만 읽어줄 수 있습니다.', 'chat.errorVoice': '음성 생성에 실패했습니다.', 'chat.voiceGenerating': '음성을 생성 중입니다. 잠시 후 다시 재생하세요.', 'chat.voiceReady': '음성이 준비되었습니다. 다시 재생하세요.', 'chat.voicePlayback': '음성 재생에 실패했습니다.', 'chat.voiceRead': '음성을 불러오지 못했습니다.', 'chat.errorHistoryAction': '채팅 기록 작업에 실패했습니다.', 'chat.noActive': '활성 채팅 없음', 'chat.noActiveHint': '탐색에서 AI 캐릭터를 선택해 대화를 시작하세요.', 'chat.exploreLobby': '캐릭터 탐색', 'chat.unavailableTitle': '채팅할 수 없는 캐릭터', 'chat.publicOnly': 'Django 채팅은 탐색의 공개 캐릭터를 지원합니다.', 'chat.recentDialog': '최근 대화', 'chat.closeRecent': '최근 대화 닫기', 'chat.openRecent': '최근 대화 열기', 'chat.backExplore': '탐색으로 돌아가기', 'chat.openDetails': '캐릭터 상세 열기', 'chat.session': 'Django 채팅 세션', 'chat.selectBackground': '채팅 배경 선택', 'chat.cancelFavorite': '즐겨찾기 삭제', 'chat.favorite': '캐릭터 즐겨찾기', 'chat.clearHistory': '채팅 기록 지우기', 'chat.backgroundTitle': '사용자 지정 채팅 배경', 'chat.closeBackground': '배경 선택 닫기', 'chat.backgroundOption': '채팅 배경 옵션', 'chat.resetBackground': '배경 초기화', 'chat.playing': '재생 중...', 'chat.readAloud': '읽어주기', 'chat.stopReading': '읽어주기 중지', 'chat.messageFailed': '생성 실패', 'chat.messageCanceled': '취소됨', 'chat.thinking': '{{name}} 생각 중...', 'chat.quickTopics': '빠른 주제:', 'chat.inputPlaceholder': '{{name}}에게 메시지 보내기...', 'chat.stopGeneration': '생성 중지', 'chat.sendMessage': '메시지 보내기', 'chat.characterDetails': '캐릭터 상세', 'chat.clearHistoryTitle': '채팅 기록 지우기', 'chat.removeRecentTitle': '최근 대화 삭제', 'chat.confirmClearText': '{{name}}와의 채팅 메시지와 채팅 내 이미지를 지울까요? 캐릭터 화보는 유지되며 생성 중인 이미지는 취소됩니다.', 'chat.confirmDeleteText': '{{name}}와의 대화를 처리할까요?', 'chat.confirm': '확인',
    'generator.errorTargetLoad': '캐릭터 카드를 불러오지 못했습니다.', 'generator.errorUpload': '이미지 업로드에 실패했습니다.', 'generator.errorTargetImage': '이 카드에는 사용할 수 있는 대표 이미지가 없습니다.', 'generator.justNow': '방금', 'generator.complete': '생성 완료', 'generator.cancelled': '생성 취소됨', 'generator.failed': '생성 실패', 'generator.queued': '작업 대기 중...', 'generator.rendering': 'Atlas가 이미지를 생성 중...', 'generator.errorFailed': '이미지 생성에 실패했습니다.', 'generator.modeUnavailable': '이 모드는 아직 연결되지 않았습니다.', 'generator.referenceRequired': '참조 이미지를 업로드하거나 카드를 선택하세요.', 'generator.submit': '이미지 생성 작업 제출 중...', 'generator.errorRequest': '이미지 생성 요청에 실패했습니다.', 'generator.cancel': '생성 취소', 'generator.errorCancel': '취소에 실패했습니다.', 'generator.retrying': '생성 재시도 중...', 'generator.errorRetry': '재시도에 실패했습니다.', 'generator.shareRequiresCharacter': '공유하려면 공개 캐릭터가 필요합니다.', 'generator.shareSubmitted': '작품을 커뮤니티 검토에 제출했습니다.', 'generator.errorShare': '작품 공유에 실패했습니다.', 'generator.generatedName': 'AI 생성 캐릭터', 'generator.generatedSubtitle': 'AI 비주얼 생성기로 만든 비공개 캐릭터', 'generator.errorCreate': '캐릭터 생성에 실패했습니다.', 'generator.title': 'AI 비주얼 및 동영상 스튜디오', 'generator.pro': 'Pro 고화질 렌더링', 'generator.subtitle': '포즈, 의상과 장면을 설정하고 결과는 Django에서 받습니다.', 'generator.task': '생성 작업', 'generator.credits': '무료 크레딧 {{count}}개', 'generator.close': '생성기 닫기', 'generator.imageMode': '이미지 모드', 'generator.videoMode': '동영상 모드', 'generator.textToImage': '텍스트에서 이미지', 'generator.imageToImage': '이미지에서 이미지', 'generator.textToVideo': '텍스트에서 동영상', 'generator.imageToVideo': '이미지에서 동영상', 'generator.extendVideo': '연장', 'generator.uploadReference': '참조 이미지 업로드 또는 선택', 'generator.supportedFormats': 'JPG / PNG / WEBP 지원', 'generator.uploadLocal': '로컬 이미지 업로드', 'generator.selectCharacter': '캐릭터 카드 선택', 'generator.clear': '지우기', 'generator.referenceCharacter': '캐릭터 카드: {{name}}', 'generator.localImage': '로컬 이미지 선택됨', 'generator.referenceRequiredShort': '이미지 변환에는 참조 이미지가 필요합니다', 'generator.presetLibrary': '프리셋 (포즈 / 의상 / 장면)', 'generator.pose': '포즈', 'generator.outfit': '의상', 'generator.scene': '장면', 'generator.selected': '선택됨', 'generator.unselected': '선택 안 됨', 'generator.category': '카테고리:', 'generator.switchLeft': '템플릿 왼쪽으로', 'generator.switchRight': '템플릿 오른쪽으로', 'generator.style': '생성 화풍', 'generator.anime': '애니메이션', 'generator.realistic': '실사', 'generator.animeDesc': '선명한 일본 애니메이션 일러스트', 'generator.realisticDesc': '영화 같은 실사 인물', 'generator.customDetails': '사용자 지정 상세', 'generator.randomInspiration': '무작위 영감', 'generator.prompt': '프롬프트:', 'generator.dialogue': 'AI 대사 및 립싱크', 'generator.dialoguePlaceholder': '캐릭터가 말할 내용을 입력하세요', 'generator.renderSettings': '렌더링 및 화질 설정', 'generator.renderHint': '해상도, 비율, 길이와 수량 설정', 'generator.priority': '우선 처리', 'generator.quality': '이미지 / 동영상 화질', 'generator.lite': 'Lite 크기', 'generator.duration': '동영상 길이 (5~15초)', 'generator.resolution': '렌더링 해상도', 'generator.aspectRatio': '화면 비율', 'generator.countImage': '이미지 수량', 'generator.countVideo': '동영상 수량', 'generator.singleOnly': '작업당 1개', 'generator.videoSingle': '작업당 동영상 1개', 'generator.fixedSeed': '고정 Seed', 'generator.locked': '잠김', 'generator.random': '무작위', 'generator.generating': '렌더링 중...', 'generator.generateImage': '이미지 생성', 'generator.generateVideo': '동영상 생성', 'generator.cost': '예상 비용: 무료 크레딧 {{count}}개', 'generator.managed': 'Django에서 관리', 'generator.stageTitle': '생성 결과', 'generator.liveResult': '실시간 렌더링 결과', 'generator.engine': 'Spicy Engine 렌더링 중...', 'generator.resultVideo': 'AI 동영상', 'generator.resultImage': 'AI 고화질 이미지', 'generator.shareDone': '커뮤니티에 공유됨 ✓', 'generator.share': '작품을 커뮤니티에 공유', 'generator.download': '다운로드', 'generator.setBackground': '채팅 배경으로 설정', 'generator.makeCharacter': '캐릭터로 만들기', 'generator.history': '생성 기록 ({{count}})', 'generator.historyHint': '눌러서 미리보기', 'generator.video': '동영상', 'generator.image': '이미지', 'generator.noHistory': '생성 기록이 없습니다', 'generator.characterPickerTitle': '캐릭터 카드 소스', 'generator.characterPickerHint': '참조 이미지로 사용할 카드 선택', 'generator.scope': '범위', 'generator.created': '생성됨', 'generator.liked': '좋아요', 'generator.gender': '성별', 'generator.anyGender': '모든 성별', 'generator.woman': '여성', 'generator.man': '남성', 'generator.nonbinary': '논바이너리', 'generator.styleFilter': '화풍', 'generator.anyStyle': '모든 화풍', 'generator.age': '나이', 'generator.anyAge': '모든 연령', 'generator.teen': '18~20', 'generator.young': '21~25', 'generator.adult': '26~29', 'generator.mature': '30+', 'generator.search': '캐릭터 카드 검색', 'generator.noImage': '대표 이미지 없음', 'generator.loadingCards': '캐릭터 카드 로드 중...', 'generator.noCards': '조건에 맞는 카드 없음', 'generator.loadedCards': '모든 카드 로드됨',
    'create.voiceCatalogError': '음성 목록을 불러오지 못했습니다.', 'create.generationError': '캐릭터 생성에 실패했습니다.', 'create.generationStatusError': '생성 상태를 불러오지 못했습니다.', 'create.nameRequired': '생성 전에 캐릭터 이름을 입력하세요.', 'create.nicknameLoading': '닉네임 생성 중...', 'create.nicknameError': '닉네임을 생성하지 못했습니다. 다시 시도하거나 직접 입력하세요.', 'create.retryNickname': '닉네임 다시 시도', 'create.nicknameAutoFilled': '닉네임이 자동으로 입력되었습니다. 자유롭게 수정할 수 있습니다.', 'create.voiceLoading': '음성 목록을 불러오는 중입니다.', 'create.voiceRequired': '사용 가능한 음성을 선택하세요.', 'create.saveError': '캐릭터를 저장하지 못했습니다.', 'create.title': 'AI 캐릭터 제작 플로우', 'create.step': '단계 {{current}} / 6', 'create.summary': '설정을 확인하고 맞춤 캐릭터 이미지를 생성하세요.', 'create.generating': '캐릭터 생성 중...', 'create.saved': '캐릭터가 내 캐릭터에 저장되었습니다', 'create.saveLatest': '프로필 저장', 'create.viewCard': '캐릭터 카드 보기', 'create.next': '다음 단계', 'create.back': '이전 단계', 'create.cancel': '취소', 'create.finish': '완료', 'create.step1': '화풍 및 성별', 'create.step2': '종족 및 혈통', 'create.step3': '외형 상세', 'create.step4': '성격 및 태그', 'create.step5': '스토리', 'create.step6': '검토 및 생성', 'create.stepHint': '상세 설정과 이야기를 완성한 뒤 맞춤 이미지를 생성합니다.', 'create.artStyle': '화풍', 'create.gender': '성별', 'create.race': '종족 및 혈통', 'create.appearance': '외형', 'create.personality': '성격 및 취향', 'create.story': '스토리', 'create.preview': '미리보기', 'create.anime': '애니메이션', 'create.realistic': '실사', 'create.female': '여성', 'create.male': '남성', 'create.nonbinary': '논바이너리', 'create.description': '배경 설명', 'create.greeting': '시작 메시지', 'create.voice': '음성', 'create.age': '나이', 'create.tags': '태그',
    'help.heroBadge': '도움말 및 공식 지원', 'help.heroTitle': '도움이 필요하거나 아이디어가 있나요?', 'help.heroDescription': '자주 묻는 질문, 피드백, Discord와 안전 가이드를 확인하세요.', 'help.discordCta': '공식 Discord 가입', 'help.discordMeta': '50,000명 이상의 사용자', 'help.tabFaq': 'FAQ', 'help.tabFeedback': '피드백', 'help.tabDiscord': 'Discord', 'help.tabGuide': '가이드 및 안전', 'help.tabPayPal': 'PayPal 결제 신고', 'help.paypalComplaint.heroBadge': 'PayPal 결제 지원', 'help.paypalComplaint.heroTitle': 'PayPal 결제 불만 접수 채널', 'help.paypalComplaint.heroDescription': 'PayPal 결제 문제를 안전하게 신고하세요. 제출 전에 거래 정보를 준비해 주세요.', 'help.paypalComplaint.heroMeta': '안전한 결제 불만 접수', 'help.paypalComplaint.sideTitle': '결제 불만', 'help.paypalComplaint.sideDescription': 'PayPal 결제에서 발생한 일을 알려 주시면 거래 맥락을 확인하겠습니다.', 'help.paypalComplaint.prepareTransaction': 'PayPal 거래 ID, 결제일, 금액과 통화를 준비해 주세요.', 'help.paypalComplaint.neverShare': 'PayPal 비밀번호, 카드 번호, CVV 또는 보안 코드를 입력하지 마세요.', 'help.paypalComplaint.contactHint': '팀이 연락할 수 있는 이메일 주소를 입력해 주세요.', 'help.paypalComplaint.signInTitle': '로그인 후 신고 제출', 'help.paypalComplaint.signInDescription': '이 채널은 등록된 mio 사용자만 이용할 수 있으며 신고는 계정에 연결됩니다.', 'help.paypalComplaint.signInButton': '안전하게 로그인', 'help.paypalComplaint.formTitle': '결제 불만 제출', 'help.paypalComplaint.formDescription': '거래 정보와 문제를 정확히 설명해 주세요. * 표시는 필수 항목입니다.', 'help.paypalComplaint.transactionSection': '거래 정보', 'help.paypalComplaint.complaintSection': '불만 내용', 'help.paypalComplaint.transactionId': 'PayPal 거래 ID', 'help.paypalComplaint.transactionIdHint': 'PayPal 활동 내역이나 영수증에 표시된 거래 ID입니다.', 'help.paypalComplaint.paymentDate': '결제일', 'help.paypalComplaint.amount': '금액', 'help.paypalComplaint.currency': '통화 코드', 'help.paypalComplaint.complaintType': '문제 유형', 'help.paypalComplaint.desiredResolution': '원하는 처리 방식', 'help.paypalComplaint.contactEmail': '연락 이메일', 'help.paypalComplaint.details': '무슨 일이 있었나요?', 'help.paypalComplaint.detailsPlaceholder': '발생한 경위와 관련 시간 또는 맥락을 입력해 주세요.', 'help.paypalComplaint.detailsHint': '비밀번호나 카드 보안 정보를 입력하지 마세요.', 'help.paypalComplaint.selectPlaceholder': '선택하세요', 'help.paypalComplaint.typeServiceNotReceived': '서비스를 받지 못함', 'help.paypalComplaint.typeDuplicateCharge': '중복 청구', 'help.paypalComplaint.typeIncorrectAmount': '청구 금액 오류', 'help.paypalComplaint.typeRefundNotReceived': '환불 미수령', 'help.paypalComplaint.typeUnauthorizedTransaction': '승인하지 않은 거래', 'help.paypalComplaint.typeOther': '기타 결제 문제', 'help.paypalComplaint.resolutionRefund': '환불', 'help.paypalComplaint.resolutionCorrection': '청구 금액 수정', 'help.paypalComplaint.resolutionDelivery': '서비스 제공', 'help.paypalComplaint.resolutionExplanation': '거래 설명', 'help.paypalComplaint.resolutionOther': '기타 처리', 'help.paypalComplaint.required': '필수 항목입니다.', 'help.paypalComplaint.dateFuture': '결제일은 미래일 수 없습니다.', 'help.paypalComplaint.amountInvalid': '0보다 큰 금액을 입력하세요.', 'help.paypalComplaint.currencyInvalid': 'USD와 같은 3자리 통화 코드를 입력하세요.', 'help.paypalComplaint.emailInvalid': '유효한 이메일 주소를 입력하세요.', 'help.paypalComplaint.validationError': '강조된 항목을 확인하고 다시 시도하세요.', 'help.paypalComplaint.invalidField': '이 항목을 확인하고 다시 시도하세요.', 'help.paypalComplaint.error': '제출하지 못했습니다. 다시 시도해 주세요.', 'help.paypalComplaint.submit': 'PayPal 불만 제출', 'help.paypalComplaint.submitting': '안전하게 제출 중...', 'help.paypalComplaint.successTitle': '불만이 접수되었습니다', 'help.paypalComplaint.successDescription': 'PayPal 결제 불만이 기록되었습니다. 팀에서 검토하겠습니다.', 'help.faqHeading': '자주 묻는 질문', 'help.createTitle': '캐릭터 만들기 시작', 'help.createDescription': '캐릭터에 영혼과 개성을 더하세요.', 'help.createButton': '캐릭터 만들기', 'help.vipTitle': 'VIP 상태 보기', 'help.vipDescription': '현재 제공되는 기능을 확인하세요.', 'help.vipButton': 'VIP 상태 보기', 'help.feedbackTitle': '피드백 보내기', 'help.feedbackDescription': '의견이 mio을 개선합니다.', 'help.feedbackReceived': '피드백을 받았습니다', 'help.feedbackThanks': '감사합니다. 팀에서 검토하겠습니다.', 'help.feedbackType': '피드백 유형', 'help.feedbackSuggestion': '기능 제안', 'help.feedbackBug': '버그 신고', 'help.feedbackRole': '캐릭터 / 생성', 'help.feedbackBilling': 'VIP / 결제', 'help.feedbackOther': '기타 질문', 'help.rating': '전반적인 만족도', 'help.ratingGreat': '매우 만족 🌟', 'help.feedbackDetails': '내용 입력', 'help.feedbackEmail': '연락 이메일 (선택)', 'help.feedbackSubmit': '피드백 제출', 'help.submitting': '안전하게 제출 중...', 'help.feedbackError': '제출에 실패했습니다.', 'help.discordTitle': '공식 mio Discord', 'help.discordDescription': '전 세계 AI 캐릭터 제작자와 만나보세요.', 'help.discordJoin': '공식 서버 참여', 'help.guideTitle': '콘텐츠 안전 및 사용 가이드', 'help.guideDescription': '안전하고 즐거운 상호작용을 위해 지침을 지켜 주세요.', 'help.copyright': '저작권 및 창작물', 'help.privacy': '개인 데이터 암호화',
    'safety.badge': '안전 센터', 'safety.description': 'mio의 공식 정책 및 안전 기준입니다.', 'safety.policyCount': '정책 {{count}}개', 'safety.selectPolicy': '정책 선택', 'safety.library': '정책 목록', 'safety.navLabel': '안전 정책', 'safety.officialDocument': '공식 정책 문서', 'safety.translationNotice': '이 번역은 편의를 위한 것입니다. 충돌이 있을 경우 영어 버전이 우선합니다.',
    'referral.status': '추천 상태', 'referral.title': '추천 혜택', 'referral.intro': '추천 보상은 이 빌드에서 사용할 수 없습니다.', 'referral.notAvailable': '사용 불가', 'referral.share': 'mio 공유', 'referral.shareHint': '추천 링크와 보상은 활성화되지 않았습니다.', 'referral.noPaid': '유료 기능을 사용할 수 없습니다', 'referral.noPaidHint': '결제, 주문, 멤버십과 잔액은 생성되지 않습니다.', 'referral.linkTitle': '추천 링크', 'referral.linkUnavailable': '추천 API가 없어 링크를 만들 수 없습니다.', 'referral.copy': '링크 복사', 'referral.copied': '복사됨', 'referral.daily': '일일 보상', 'referral.dailyHint': '일일 보상 API가 제공되지 않습니다.', 'referral.guide': '추천 규정', 'referral.noRelations': '추천 관계를 사용할 수 없습니다', 'referral.noRelationsHint': '추천 관계나 보상이 생성되지 않습니다.', 'referral.noBilling': '결제 및 멤버십 API가 정의되지 않았습니다', 'referral.noBillingHint': '충전, 주문, 구독이나 멤버십 활성화가 실행되지 않습니다.', 'referral.creditHint': '무료 크레딧은 API에서 반환되며 구매하거나 양도할 수 없습니다.', 'referral.paymentTitle': '결제를 사용할 수 없습니다', 'referral.paymentHint': '결제 인터페이스가 없습니다.', 'referral.cancel': '취소', 'referral.confirm': '결제를 사용할 수 없습니다', 'referral.history': '추천 기록', 'referral.noHistory': '사용 가능한 기록 없음', 'referral.noPayment': 'QR이나 시뮬레이션으로 충전할 결제 인터페이스가 없습니다.',
    'upgrade.status': '멤버십 및 유료 기능 상태', 'upgrade.title': '멤버십, 충전 및 주문 기능을 사용할 수 없습니다', 'upgrade.description': '멤버십, 주문, 결제 또는 유료 잔액을 생성하지 않습니다. 생성은 백엔드 무료 크레딧을 사용합니다.', 'upgrade.monthly': '월간', 'upgrade.annual': '연간', 'upgrade.save50': '50% 절약', 'upgrade.seniorUnavailable': '시니어 플랜 사용 불가', 'upgrade.deluxeUnavailable': '디럭스 플랜 사용 불가', 'upgrade.noPlan': '사용 가능한 플랜 없음', 'upgrade.perMonth': '/ 월', 'upgrade.paymentUnavailable': '유료 인터페이스 없음', 'upgrade.noBenefits': '멤버십 혜택 없음', 'upgrade.creditHint': '백엔드 무료 크레딧을 사용하세요', 'upgrade.capabilities': '현재 기능: 멤버십 혜택 없음', 'upgrade.noSubscriptions': '구독, 주문 또는 결제 기록을 만들지 않습니다', 'upgrade.noGiftCredits': '선물 또는 유료 잔액을 지급하지 않습니다', 'upgrade.serverCost': '이미지 비용은 서버 생성 옵션에서 반환됩니다', 'upgrade.videoContract': '동영상은 백엔드 계약에 남으며 여기서는 활성화되지 않습니다', 'upgrade.noTransfer': '무료 크레딧은 충전하거나 양도할 수 없습니다', 'upgrade.subscribeUnavailable': '멤버십 기능을 사용할 수 없습니다', 'upgrade.rechargeTitle': '충전 및 주문 기능을 사용할 수 없습니다', 'upgrade.noPayment': '결제 인터페이스 없음', 'upgrade.unavailableBalance': '유료 잔액 사용 불가', 'upgrade.unavailable': '사용 불가', 'upgrade.capabilityTitle': '현재 기능 안내', 'upgrade.noPaid': '멤버십, 결제, 충전, 주문 및 유료 크레딧 기능을 사용할 수 없습니다.', 'upgrade.costFromApi': '이미지 비용은 서버 옵션과 크레딧 API에서 반환됩니다.', 'upgrade.balanceReject': '크레딧이 부족하면 백엔드가 작업을 거부합니다.', 'upgrade.videoImageOnly': '동영상은 계약에 남지만 이 빌드는 이미지만 제출합니다.', 'upgrade.noPaymentEntry': '결제 방법이나 주문 입구가 없습니다.',
  },
};
const membershipSupplemental: Record<string, MessageMap> = {
  en: {
    'upgrade.status': 'Membership plans & paid features', 'upgrade.title': 'Choose your mio plan', 'upgrade.description': 'Compare membership benefits, diamond bundles, and usage rules. Continue to the hosted checkout when you are ready.', 'upgrade.paymentPending': 'Payment pending integration', 'upgrade.planSenior': 'Heart VIP', 'upgrade.planDeluxe': 'Starlight VIP', 'upgrade.planId': 'Plan {{id}}', 'upgrade.bestValue': 'Best value', 'upgrade.planBadgeSenior': 'Popular choice', 'upgrade.planBadgeDeluxe': 'Flagship experience', 'upgrade.planTaglineSenior': 'For everyday chats, character creation, and image generation', 'upgrade.planTaglineDeluxe': 'More diamonds, longer memory, and priority generation for frequent creators', 'upgrade.includedDiamonds': '{{amount}} diamonds included', 'upgrade.monthlyBilling': 'Billed monthly', 'upgrade.billingCycle': 'Billing cycle', 'upgrade.monthly': 'Monthly', 'upgrade.annual': 'Annual', 'upgrade.save50': 'Save 50%', 'upgrade.perMonth': '/ month', 'upgrade.perMonthEquivalent': '/ month equivalent', 'upgrade.perYear': '/ year', 'upgrade.originalPrice': 'Original:', 'upgrade.saveAmount': 'Save {{amount}} / year', 'upgrade.plansTitle': 'Membership plans', 'upgrade.plansHint': 'Every plan includes the monthly diamond allowance shown below.', 'upgrade.currency': 'USD', 'upgrade.planBenefits': 'Included benefits', 'upgrade.creditsPerMonth': 'Diamonds / month', 'upgrade.imagesPerMonth': 'Images / month', 'upgrade.videosPerMonth': 'Videos / month', 'upgrade.voicePerMonth': 'Voice / month', 'upgrade.minutes': 'min', 'upgrade.diamonds': 'diamonds', 'upgrade.feature.unlimitedMessages': 'Unlimited AI character messages', 'upgrade.feature.unlimitedVoicePlayback': 'Unlimited voice message playback', 'upgrade.feature.imageVideoGeneration': 'Image and video generation access', 'upgrade.feature.publishCharacters': 'Publish and share original characters', 'upgrade.feature.advancedModels': 'Advanced AI model access', 'upgrade.feature.longerMemory': '3x longer chat memory', 'upgrade.feature.priorityRendering': 'Priority rendering queue', 'upgrade.subscribeUnavailable': 'Payment interface pending', 'upgrade.rechargeTitle': 'Diamond recharge', 'upgrade.rechargeHint': 'Select a bundle to continue to the hosted checkout.', 'upgrade.rechargeBase': 'Base {{amount}}', 'upgrade.rechargeBonus': '+{{amount}} bonus', 'upgrade.rechargeImages': '{{count}} images', 'upgrade.rechargeVideos': '{{count}} videos', 'upgrade.rechargeUnavailable': 'Recharge unavailable', 'upgrade.consumptionTitle': 'Usage costs', 'upgrade.consumptionHint': 'Reference costs; final charges must come from the server.', 'upgrade.ruleAiReply': 'AI reply', 'upgrade.rulePortrait': 'Create character portrait', 'upgrade.ruleImage': 'Image generation', 'upgrade.ruleVideo': 'Video generation', 'upgrade.perMessage': '/ message', 'upgrade.perUse': '/ use', 'upgrade.perImage': '/ image', 'upgrade.perVideo': '/ video', 'upgrade.rewardsTitle': 'Configured rewards', 'upgrade.rewardsHint': 'Reward values are shown for reference only.', 'upgrade.rewardDailyShare': 'Daily share reward', 'upgrade.rewardInvite': 'Invite a friend to register', 'upgrade.rewardFriendPurchase': 'Friend first subscription or recharge', 'upgrade.onceDaily': '/ day', 'upgrade.perPerson': '/ person', 'upgrade.perFriend': '/ friend', 'upgrade.rewardsUnavailable': 'Reward API is not connected. This page never changes balances.', 'upgrade.noPaymentEntry': 'No payment method, order, membership activation, or balance update is performed in this build.',
  },
  'zh-CN': {
    'upgrade.status': '会员套餐与付费权益', 'upgrade.title': '选择你的 mio 会员方案', 'upgrade.description': '查看会员权益、钻石充值档位和消费规则，准备好后可继续进入托管收银台。', 'upgrade.paymentPending': '支付接口待接入', 'upgrade.planSenior': '心动版 VIP', 'upgrade.planDeluxe': '星耀版 VIP', 'upgrade.planId': '套餐 {{id}}', 'upgrade.bestValue': '最划算', 'upgrade.planBadgeSenior': '人气之选', 'upgrade.planBadgeDeluxe': '旗舰体验', 'upgrade.planTaglineSenior': '适合日常聊天、角色创作与图片生成', 'upgrade.planTaglineDeluxe': '更多钻石、更长记忆与优先生成，适合高频创作', 'upgrade.includedDiamonds': '每月包含 {{amount}} 钻石', 'upgrade.monthlyBilling': '按月计费', 'upgrade.billingCycle': '计费周期', 'upgrade.monthly': '按月', 'upgrade.annual': '按年', 'upgrade.save50': '节省 50%', 'upgrade.perMonth': '/ 月', 'upgrade.perMonthEquivalent': '/ 月折合', 'upgrade.perYear': '/ 年', 'upgrade.originalPrice': '原价：', 'upgrade.saveAmount': '每年节省 {{amount}}', 'upgrade.plansTitle': '会员套餐', 'upgrade.plansHint': '每月赠送钻石和各项额度如下，具体扣费以服务端为准。', 'upgrade.currency': 'USD', 'upgrade.planBenefits': '包含权益', 'upgrade.creditsPerMonth': '每月钻石', 'upgrade.imagesPerMonth': '每月图片', 'upgrade.videosPerMonth': '每月视频', 'upgrade.voicePerMonth': '每月语音', 'upgrade.minutes': '分钟', 'upgrade.diamonds': '钻石', 'upgrade.feature.unlimitedMessages': '无限 AI 角色消息', 'upgrade.feature.unlimitedVoicePlayback': '无限语音消息播放', 'upgrade.feature.imageVideoGeneration': '开放图片与视频生成', 'upgrade.feature.publishCharacters': '发布和分享原创角色', 'upgrade.feature.advancedModels': '高级 AI 模型权限', 'upgrade.feature.longerMemory': '3 倍超长聊天记忆', 'upgrade.feature.priorityRendering': '优先渲染队列', 'upgrade.subscribeUnavailable': '支付接口待接入', 'upgrade.rechargeTitle': '钻石充值', 'upgrade.rechargeHint': '选择充值档位后可继续进入托管收银台。', 'upgrade.rechargeBase': '基础 {{amount}}', 'upgrade.rechargeBonus': '+{{amount}} 赠送', 'upgrade.rechargeImages': '{{count}} 次图片/立绘', 'upgrade.rechargeVideos': '{{count}} 次视频', 'upgrade.rechargeUnavailable': '充值暂不可用', 'upgrade.consumptionTitle': '消费规则', 'upgrade.consumptionHint': '以下为产品参考价格，最终扣费以服务端返回为准。', 'upgrade.ruleAiReply': 'AI 回复', 'upgrade.rulePortrait': '创建角色立绘', 'upgrade.ruleImage': '图片生成', 'upgrade.ruleVideo': '视频生成', 'upgrade.perMessage': '/ 条', 'upgrade.perUse': '/ 次', 'upgrade.perImage': '/ 张', 'upgrade.perVideo': '/ 个', 'upgrade.rewardsTitle': '关联奖励', 'upgrade.rewardsHint': '仅展示奖励配置，不会在前端直接修改余额。', 'upgrade.rewardDailyShare': '每日分享奖励', 'upgrade.rewardInvite': '邀请好友注册', 'upgrade.rewardFriendPurchase': '好友首次订阅或充值', 'upgrade.onceDaily': '/ 天', 'upgrade.perPerson': '/ 人', 'upgrade.perFriend': '/ 位好友', 'upgrade.rewardsUnavailable': '奖励接口暂未接入，本页面不会直接增加钻石余额。', 'upgrade.noPaymentEntry': '当前不会展示支付方式、创建订单、激活会员或修改余额。',
  },
  ja: {
    'upgrade.status': '会員プランと有料機能', 'upgrade.title': 'mio のプランを選択', 'upgrade.description': '会員特典、ジェムパック、利用コストを比較し、準備ができたら決済へ進めます。', 'upgrade.paymentPending': '決済接続待ち', 'upgrade.planSenior': 'ハート VIP', 'upgrade.planDeluxe': 'スター VIP', 'upgrade.planId': 'プラン {{id}}', 'upgrade.bestValue': 'おすすめ', 'upgrade.planBadgeSenior': '人気プラン', 'upgrade.planBadgeDeluxe': 'フラッグシップ', 'upgrade.planTaglineSenior': '日常のチャット、キャラクター作成、画像生成に', 'upgrade.planTaglineDeluxe': 'より多くのジェム、長い記憶、優先生成を利用', 'upgrade.includedDiamonds': '{{amount}} ジェムを毎月付与', 'upgrade.monthlyBilling': '月額請求', 'upgrade.billingCycle': '請求周期', 'upgrade.monthly': '月額', 'upgrade.annual': '年額', 'upgrade.save50': '50%節約', 'upgrade.perMonth': '/ 月', 'upgrade.perMonthEquivalent': '/ 月相当', 'upgrade.perYear': '/ 年', 'upgrade.originalPrice': '通常価格：', 'upgrade.saveAmount': '年間 {{amount}} お得', 'upgrade.plansTitle': '会員プラン', 'upgrade.plansHint': '毎月付与されるジェムと利用枠を確認できます。', 'upgrade.currency': 'USD', 'upgrade.planBenefits': '含まれる特典', 'upgrade.creditsPerMonth': '月間ジェム', 'upgrade.imagesPerMonth': '月間画像', 'upgrade.videosPerMonth': '月間動画', 'upgrade.voicePerMonth': '月間音声', 'upgrade.minutes': '分', 'upgrade.diamonds': 'ジェム', 'upgrade.feature.unlimitedMessages': 'AIキャラクターメッセージ無制限', 'upgrade.feature.unlimitedVoicePlayback': '音声メッセージ再生無制限', 'upgrade.feature.imageVideoGeneration': '画像・動画生成を利用可能', 'upgrade.feature.publishCharacters': 'オリジナルキャラクターを公開・共有', 'upgrade.feature.advancedModels': '高度なAIモデルへのアクセス', 'upgrade.feature.longerMemory': 'チャット記憶が3倍長い', 'upgrade.feature.priorityRendering': '優先レンダリングキュー', 'upgrade.subscribeUnavailable': '決済接続待ち', 'upgrade.rechargeTitle': 'ジェムチャージ', 'upgrade.rechargeHint': 'チャージ内容を選択して決済へ進めます。', 'upgrade.rechargeBase': '基本 {{amount}}', 'upgrade.rechargeBonus': '+{{amount}} ボーナス', 'upgrade.rechargeImages': '{{count}} 回の画像', 'upgrade.rechargeVideos': '{{count}} 回の動画', 'upgrade.rechargeUnavailable': 'チャージ不可', 'upgrade.consumptionTitle': '利用コスト', 'upgrade.consumptionHint': '参考値です。最終的な請求はサーバーに従います。', 'upgrade.ruleAiReply': 'AI返信', 'upgrade.rulePortrait': 'キャラクターポートレート作成', 'upgrade.ruleImage': '画像生成', 'upgrade.ruleVideo': '動画生成', 'upgrade.perMessage': '/ メッセージ', 'upgrade.perUse': '/ 回', 'upgrade.perImage': '/ 枚', 'upgrade.perVideo': '/ 本', 'upgrade.rewardsTitle': '設定済み報酬', 'upgrade.rewardsHint': '報酬値は参考表示のみです。', 'upgrade.rewardDailyShare': '毎日の共有報酬', 'upgrade.rewardInvite': '友達を登録に招待', 'upgrade.rewardFriendPurchase': '友達の初回購読またはチャージ', 'upgrade.onceDaily': '/ 日', 'upgrade.perPerson': '/ 人', 'upgrade.perFriend': '/ 人', 'upgrade.rewardsUnavailable': '報酬APIは未接続です。この画面は残高を変更しません。', 'upgrade.noPaymentEntry': '決済方法の表示、注文作成、会員有効化、残高変更は行いません。',
  },
  ko: {
    'upgrade.status': '멤버십 플랜 및 유료 기능', 'upgrade.title': 'mio 플랜 선택', 'upgrade.description': '멤버십 혜택, 보석 충전팩과 사용 비용을 비교하고 준비되면 결제로 진행하세요.', 'upgrade.paymentPending': '결제 연동 대기', 'upgrade.planSenior': '하트 VIP', 'upgrade.planDeluxe': '스타라이트 VIP', 'upgrade.planId': '플랜 {{id}}', 'upgrade.bestValue': '최고 혜택', 'upgrade.planBadgeSenior': '인기 플랜', 'upgrade.planBadgeDeluxe': '플래그십', 'upgrade.planTaglineSenior': '일상 대화, 캐릭터 창작과 이미지 생성에 적합', 'upgrade.planTaglineDeluxe': '더 많은 보석, 긴 기억과 우선 생성을 제공', 'upgrade.includedDiamonds': '매월 {{amount}} 보석 포함', 'upgrade.monthlyBilling': '월간 결제', 'upgrade.billingCycle': '결제 주기', 'upgrade.monthly': '월간', 'upgrade.annual': '연간', 'upgrade.save50': '50% 절약', 'upgrade.perMonth': '/ 월', 'upgrade.perMonthEquivalent': '/ 월 환산', 'upgrade.perYear': '/ 년', 'upgrade.originalPrice': '정가:', 'upgrade.saveAmount': '연간 {{amount}} 절약', 'upgrade.plansTitle': '멤버십 플랜', 'upgrade.plansHint': '매월 제공되는 보석과 사용 한도를 확인하세요.', 'upgrade.currency': 'USD', 'upgrade.planBenefits': '포함 혜택', 'upgrade.creditsPerMonth': '월간 보석', 'upgrade.imagesPerMonth': '월간 이미지', 'upgrade.videosPerMonth': '월간 동영상', 'upgrade.voicePerMonth': '월간 음성', 'upgrade.minutes': '분', 'upgrade.diamonds': '보석', 'upgrade.feature.unlimitedMessages': 'AI 캐릭터 메시지 무제한', 'upgrade.feature.unlimitedVoicePlayback': '음성 메시지 재생 무제한', 'upgrade.feature.imageVideoGeneration': '이미지 및 동영상 생성 이용', 'upgrade.feature.publishCharacters': '오리지널 캐릭터 공개 및 공유', 'upgrade.feature.advancedModels': '고급 AI 모델 이용', 'upgrade.feature.longerMemory': '3배 긴 채팅 기억', 'upgrade.feature.priorityRendering': '우선 렌더링 대기열', 'upgrade.subscribeUnavailable': '결제 연동 대기', 'upgrade.rechargeTitle': '보석 충전', 'upgrade.rechargeHint': '충전팩을 선택해 결제로 진행하세요。', 'upgrade.rechargeBase': '기본 {{amount}}', 'upgrade.rechargeBonus': '+{{amount}} 보너스', 'upgrade.rechargeImages': '{{count}}회 이미지', 'upgrade.rechargeVideos': '{{count}}회 동영상', 'upgrade.rechargeUnavailable': '충전 불가', 'upgrade.consumptionTitle': '사용 비용', 'upgrade.consumptionHint': '참고 비용이며 최종 차감은 서버 응답을 따릅니다.', 'upgrade.ruleAiReply': 'AI 답변', 'upgrade.rulePortrait': '캐릭터 이미지 만들기', 'upgrade.ruleImage': '이미지 생성', 'upgrade.ruleVideo': '동영상 생성', 'upgrade.perMessage': '/ 메시지', 'upgrade.perUse': '/ 회', 'upgrade.perImage': '/ 장', 'upgrade.perVideo': '/ 개', 'upgrade.rewardsTitle': '설정된 보상', 'upgrade.rewardsHint': '보상 수치는 참고용으로만 표시됩니다.', 'upgrade.rewardDailyShare': '매일 공유 보상', 'upgrade.rewardInvite': '친구 회원가입 초대', 'upgrade.rewardFriendPurchase': '친구의 첫 구독 또는 충전', 'upgrade.onceDaily': '/ 일', 'upgrade.perPerson': '/ 명', 'upgrade.perFriend': '/ 명', 'upgrade.rewardsUnavailable': '보상 API가 연결되지 않았습니다. 이 화면은 잔액을 변경하지 않습니다.', 'upgrade.noPaymentEntry': '결제 수단 표시, 주문 생성, 멤버십 활성화 또는 잔액 변경을 수행하지 않습니다.',
  },
};
const paymentSupplemental: Record<string, MessageMap> = {
  en: {
    'upgrade.description': 'Choose a membership or permanent diamond bundle. Checkout is completed securely on our hosted payment page.',
    'upgrade.checkoutReady': 'Checkout available', 'upgrade.checkoutUnavailableShort': 'Checkout unavailable',
    'upgrade.checkoutUnavailable': 'Checkout unavailable', 'upgrade.continueToCheckout': 'Continue to checkout',
    'upgrade.signInToCheckout': 'Sign in to continue', 'upgrade.loadingCatalog': 'Loading current plans...',
    'upgrade.catalogError': 'Current plans could not be loaded. Try again.', 'upgrade.accountError': 'Your membership and order details could not be loaded.',
    'upgrade.accountTitle': 'Your membership account', 'upgrade.membershipUntil': '{{plan}} active until {{date}}',
    'upgrade.noMembership': 'No active membership', 'upgrade.permanentBalance': 'Permanent diamonds',
    'upgrade.confirmTitle': 'Confirm checkout details', 'upgrade.fullName': 'Full name',
    'upgrade.tpayDetailsHint': 'Confirm your legal name and phone number. We use your account email automatically. Card and billing details are entered on the secure payment page after you continue.',
    'upgrade.checkoutStep': 'Secure checkout', 'upgrade.backToPlans': 'Back to plans', 'upgrade.checkoutDetailsHint': 'Enter the billing details used for this purchase. Card details are entered only after you continue.',
    'upgrade.fullNamePlaceholder': 'Name used for payment', 'upgrade.phone': 'Phone number',
    'upgrade.phonePlaceholder': '+1 415 555 0100', 'upgrade.accountEmail': 'Account email',
    'upgrade.hostedCheckoutNote': 'Card details are entered only on the secure hosted payment page. mio never asks for or stores your card number, expiry date, or CVV.',
    'upgrade.creatingOrder': 'Creating secure checkout...', 'upgrade.goToPaybao': 'Continue to payment',
    'upgrade.createOrderError': 'Checkout could not be created. Keep this form open and try again.', 'upgrade.paymentProviderRejected': 'Payment provider rejected the checkout',
    'upgrade.amountLimit': 'Unavailable above {{amount}} per transaction', 'upgrade.amountLimitHint': 'This option is above the current {{amount}} per-transaction limit.', 'upgrade.amountLimitError': 'This product exceeds the current per-transaction limit of {{amount}}. Choose another product.',
    'upgrade.nameError': 'Enter your full name.', 'upgrade.phoneError': 'Enter a valid phone number, including country code when applicable.',
    'upgrade.rechargeHint': 'Purchased diamonds are permanent and credited after payment is confirmed.',
    'upgrade.rechargeTotal': '{{amount}} diamonds total', 'upgrade.rechargeNow': 'Recharge diamonds',
    'upgrade.rewardsUnavailable': 'Reward issuing is not connected yet. This does not affect membership or diamond payments.',
    'upgrade.orderHistory': 'Order history', 'upgrade.refreshOrders': 'Refresh orders', 'upgrade.noOrders': 'No payment orders yet.',
    'upgrade.merchantReference': 'mio order', 'upgrade.paybaoReference': 'Payment transaction',
    'upgrade.copyReference': 'Copy mio order number', 'upgrade.copyTransaction': 'Copy payment transaction number',
    'upgrade.queryStatus': 'Check status',
    'upgrade.orderStatus.created': 'Created', 'upgrade.orderStatus.waiting': 'Waiting',
    'upgrade.orderStatus.success': 'Paid', 'upgrade.orderStatus.fail': 'Failed',
    'upgrade.return.idle': 'Preparing to verify payment...', 'upgrade.return.checking': 'Checking payment status...',
    'upgrade.return.waiting': 'Payment confirmation is still pending.', 'upgrade.return.success': 'Payment confirmed. Your account has been updated.',
    'upgrade.return.fail': 'Payment was not completed. No diamonds or membership were added.',
    'upgrade.return.delayed': 'Confirmation is delayed. Use Check status in order history shortly.',
  },
  'zh-CN': {
    'upgrade.description': '选择会员套餐或永久钻石包，付款将在安全托管收银台完成。',
    'upgrade.checkoutReady': '收银台可用', 'upgrade.checkoutUnavailableShort': '收银台不可用',
    'upgrade.checkoutUnavailable': '收银台暂不可用', 'upgrade.continueToCheckout': '继续开通',
    'upgrade.signInToCheckout': '登录后继续', 'upgrade.loadingCatalog': '正在加载最新套餐...',
    'upgrade.catalogError': '套餐加载失败，请重试。', 'upgrade.accountError': '会员账户和订单信息加载失败。',
    'upgrade.accountTitle': '我的会员账户', 'upgrade.membershipUntil': '{{plan}} 有效期至 {{date}}',
    'upgrade.noMembership': '当前无生效会员', 'upgrade.permanentBalance': '永久钻石',
    'upgrade.confirmTitle': '确认收银台信息', 'upgrade.fullName': '姓名',
    'upgrade.tpayDetailsHint': '请确认真实姓名和手机号，邮箱自动使用登录账号邮箱。点击继续后，在安全收银台填写银行卡及账单信息。',
    'upgrade.checkoutStep': '安全结账', 'upgrade.backToPlans': '返回套餐', 'upgrade.checkoutDetailsHint': '请填写本次购买使用的账单信息。点击继续后，卡片信息只会在安全托管收银台填写。',
    'upgrade.fullNamePlaceholder': '请输入付款人姓名', 'upgrade.phone': '手机号',
    'upgrade.phonePlaceholder': '+86 138 0000 0000', 'upgrade.accountEmail': '账号邮箱',
    'upgrade.hostedCheckoutNote': '卡片信息仅在安全托管收银台填写。mio 不会要求或保存卡号、有效期或 CVV。',
    'upgrade.creatingOrder': '正在创建安全收银台...', 'upgrade.goToPaybao': '继续付款',
    'upgrade.createOrderError': '收银台创建失败，请保留当前表单并重试。', 'upgrade.paymentProviderRejected': '支付服务商拒绝创建收银台',
    'upgrade.amountLimit': '超过 {{amount}} 单笔限额', 'upgrade.amountLimitHint': '该选项超过当前 {{amount}} 的单笔交易限额。', 'upgrade.amountLimitError': '该商品超过当前 {{amount}} 的单笔交易限额，请选择其他商品。',
    'upgrade.nameError': '请输入完整姓名。', 'upgrade.phoneError': '请输入有效手机号，必要时包含国际区号。',
    'upgrade.rechargeHint': '购买的钻石永久有效，支付确认后到账。',
    'upgrade.rechargeTotal': '到账共 {{amount}} 钻石', 'upgrade.rechargeNow': '立即充值',
    'upgrade.rewardsUnavailable': '奖励发放接口暂未接入，但不影响会员开通或钻石充值支付。',
    'upgrade.orderHistory': '订单历史', 'upgrade.refreshOrders': '刷新订单', 'upgrade.noOrders': '暂无支付订单。',
    'upgrade.merchantReference': 'mio 订单号', 'upgrade.paybaoReference': '支付流水号',
    'upgrade.copyReference': '复制 mio 订单号', 'upgrade.copyTransaction': '复制支付流水号',
    'upgrade.queryStatus': '查询状态',
    'upgrade.orderStatus.created': '已创建', 'upgrade.orderStatus.waiting': '等待支付',
    'upgrade.orderStatus.success': '支付成功', 'upgrade.orderStatus.fail': '支付失败',
    'upgrade.return.idle': '准备核验支付结果...', 'upgrade.return.checking': '正在查询支付结果...',
    'upgrade.return.waiting': '支付结果仍在确认中，请稍候。', 'upgrade.return.success': '支付已确认，会员账户已更新。',
    'upgrade.return.fail': '支付未完成，未增加会员或钻石。',
    'upgrade.return.delayed': '支付确认有延迟，请稍后在订单历史中点击“查询状态”。',
  },
  ja: {
    'upgrade.description': '会員プランまたは永久ジェムパックを選択してください。決済は安全なホスト画面で完了します。',
    'upgrade.checkoutReady': '決済利用可能', 'upgrade.checkoutUnavailableShort': '決済利用不可',
    'upgrade.checkoutUnavailable': '決済は現在利用できません', 'upgrade.continueToCheckout': '決済へ進む',
    'upgrade.signInToCheckout': 'ログインして続行', 'upgrade.loadingCatalog': '最新プランを読み込み中...',
    'upgrade.catalogError': 'プランを読み込めませんでした。再試行してください。', 'upgrade.accountError': '会員情報と注文履歴を読み込めませんでした。',
    'upgrade.accountTitle': '会員アカウント', 'upgrade.membershipUntil': '{{plan}} は {{date}} まで有効',
    'upgrade.noMembership': '有効な会員プランはありません', 'upgrade.permanentBalance': '永久ジェム',
    'upgrade.confirmTitle': '決済情報の確認', 'upgrade.fullName': '氏名',
    'upgrade.tpayDetailsHint': '本名と電話番号をご確認ください。メールアドレスはアカウントのものを使用します。続行後、安全な決済ページでカードと請求先情報をご入力ください。',
    'upgrade.fullNamePlaceholder': '支払者の氏名', 'upgrade.phone': '電話番号',
    'upgrade.phonePlaceholder': '+81 90 1234 5678', 'upgrade.accountEmail': 'アカウントメール',
    'upgrade.hostedCheckoutNote': 'カード情報は安全なホスト画面で入力します。mio がカード番号、有効期限、CVVを要求・保存することはありません。',
    'upgrade.creatingOrder': '安全な決済画面を作成中...', 'upgrade.goToPaybao': '支払いへ進む',
    'upgrade.createOrderError': '決済画面を作成できませんでした。フォームを閉じずに再試行してください。',
    'upgrade.amountLimit': '{{amount}} を超えるため利用不可', 'upgrade.amountLimitHint': 'この商品は現在の1回あたり {{amount}} の上限を超えています。', 'upgrade.amountLimitError': 'この商品は現在の1回あたり {{amount}} の上限を超えています。別の商品を選択してください。',
    'upgrade.nameError': '氏名を入力してください。', 'upgrade.phoneError': '必要に応じて国番号を含む有効な電話番号を入力してください。',
    'upgrade.rechargeHint': '購入したジェムに期限はなく、支払確認後に反映されます。',
    'upgrade.rechargeTotal': '合計 {{amount}} ジェム', 'upgrade.rechargeNow': 'ジェムをチャージ',
    'upgrade.rewardsUnavailable': '報酬付与機能は未接続ですが、会員プランやジェムの支払いには影響しません。',
    'upgrade.orderHistory': '注文履歴', 'upgrade.refreshOrders': '注文を更新', 'upgrade.noOrders': '支払注文はまだありません。',
    'upgrade.merchantReference': 'mio 注文番号', 'upgrade.paybaoReference': '決済取引番号',
    'upgrade.copyReference': 'mio 注文番号をコピー', 'upgrade.copyTransaction': '決済取引番号をコピー',
    'upgrade.queryStatus': '状態を確認',
    'upgrade.orderStatus.created': '作成済み', 'upgrade.orderStatus.waiting': '支払待ち',
    'upgrade.orderStatus.success': '支払済み', 'upgrade.orderStatus.fail': '失敗',
    'upgrade.return.idle': '支払確認を準備中...', 'upgrade.return.checking': '支払状況を確認中...',
    'upgrade.return.waiting': '支払確認を待っています。', 'upgrade.return.success': '支払を確認しました。アカウントを更新しました。',
    'upgrade.return.fail': '支払は完了していません。会員・ジェムは追加されていません。',
    'upgrade.return.delayed': '確認が遅れています。後ほど注文履歴の「状態を確認」を使用してください。',
  },
  ko: {
    'upgrade.description': '멤버십 또는 영구 보석 팩을 선택하세요. 결제는 안전한 호스팅 화면에서 완료됩니다.',
    'upgrade.checkoutReady': '결제 사용 가능', 'upgrade.checkoutUnavailableShort': '결제 사용 불가',
    'upgrade.checkoutUnavailable': '현재 결제할 수 없습니다', 'upgrade.continueToCheckout': '결제 계속하기',
    'upgrade.signInToCheckout': '로그인 후 계속', 'upgrade.loadingCatalog': '최신 플랜 불러오는 중...',
    'upgrade.catalogError': '플랜을 불러오지 못했습니다. 다시 시도하세요.', 'upgrade.accountError': '멤버십 및 주문 정보를 불러오지 못했습니다.',
    'upgrade.accountTitle': '내 멤버십 계정', 'upgrade.membershipUntil': '{{plan}} · {{date}}까지',
    'upgrade.noMembership': '활성 멤버십 없음', 'upgrade.permanentBalance': '영구 보석',
    'upgrade.confirmTitle': '결제 정보 확인', 'upgrade.fullName': '이름',
    'upgrade.tpayDetailsHint': '실명과 전화번호를 확인하세요. 이메일은 계정 이메일을 자동으로 사용합니다. 계속 진행하면 안전한 결제 페이지에서 카드 및 청구 정보를 입력합니다.',
    'upgrade.fullNamePlaceholder': '결제자 이름', 'upgrade.phone': '전화번호',
    'upgrade.phonePlaceholder': '+82 10 1234 5678', 'upgrade.accountEmail': '계정 이메일',
    'upgrade.hostedCheckoutNote': '카드 정보는 안전한 호스팅 화면에서 입력합니다. mio은 카드 번호, 유효기간 또는 CVV를 요청하거나 저장하지 않습니다.',
    'upgrade.creatingOrder': '안전한 결제 화면 생성 중...', 'upgrade.goToPaybao': '결제로 계속',
    'upgrade.createOrderError': '결제 화면을 만들지 못했습니다. 이 양식을 유지하고 다시 시도하세요.',
    'upgrade.amountLimit': '건당 {{amount}} 초과로 이용 불가', 'upgrade.amountLimitHint': '이 상품은 현재 건당 한도 {{amount}}를 초과합니다.', 'upgrade.amountLimitError': '이 상품은 현재 건당 한도 {{amount}}를 초과합니다. 다른 상품을 선택하세요.',
    'upgrade.nameError': '이름을 입력하세요.', 'upgrade.phoneError': '필요한 경우 국가 코드를 포함한 유효한 전화번호를 입력하세요.',
    'upgrade.rechargeHint': '구매한 보석은 만료되지 않으며 결제 확인 후 지급됩니다.',
    'upgrade.rechargeTotal': '총 {{amount}} 보석', 'upgrade.rechargeNow': '보석 충전',
    'upgrade.rewardsUnavailable': '보상 지급 기능은 아직 연결되지 않았지만 멤버십 또는 보석 결제에는 영향을 주지 않습니다.',
    'upgrade.orderHistory': '주문 내역', 'upgrade.refreshOrders': '주문 새로고침', 'upgrade.noOrders': '결제 주문이 없습니다.',
    'upgrade.merchantReference': 'mio 주문 번호', 'upgrade.paybaoReference': '결제 거래 번호',
    'upgrade.copyReference': 'mio 주문 번호 복사', 'upgrade.copyTransaction': '결제 거래 번호 복사',
    'upgrade.queryStatus': '상태 확인',
    'upgrade.orderStatus.created': '생성됨', 'upgrade.orderStatus.waiting': '결제 대기',
    'upgrade.orderStatus.success': '결제 완료', 'upgrade.orderStatus.fail': '실패',
    'upgrade.return.idle': '결제 확인 준비 중...', 'upgrade.return.checking': '결제 상태 확인 중...',
    'upgrade.return.waiting': '결제 확인을 기다리고 있습니다.', 'upgrade.return.success': '결제가 확인되어 계정이 업데이트되었습니다.',
    'upgrade.return.fail': '결제가 완료되지 않아 멤버십이나 보석이 추가되지 않았습니다.',
    'upgrade.return.delayed': '확인이 지연되고 있습니다. 잠시 후 주문 내역에서 상태 확인을 사용하세요.',
  },
  es: {
    'upgrade.rulePublish': 'Publicar tarjeta de personaje', 'upgrade.quickTitle': 'Desbloquea la generación premium', 'upgrade.quickDescription': 'Esta función requiere una membresía. El pago continúa de forma segura en nuestra página de pago.',
  },
  pt: {
    'upgrade.rulePublish': 'Publicar cartão de personagem', 'upgrade.quickTitle': 'Desbloqueie a geração premium', 'upgrade.quickDescription': 'Este recurso exige uma assinatura. O pagamento continua com segurança na nossa página de pagamento.',
  },
};
const finalSupplemental: Record<string, MessageMap> = {
  en: { 'chat.promptGreeting': 'Say hello 👋', 'chat.promptDay': 'What was interesting about your day?', 'chat.promptIntro': 'Could you introduce yourself? 💬', 'chat.promptSecret': 'Tell me one of your secrets... 🤫', 'chat.loadingHistory': 'Loading chat history...', 'chat.noMessages': 'No messages yet', 'create.ageUnit': ' years', 'help.faq1.q': 'How do I create my own AI character?', 'help.faq1.a': 'Open Create from the sidebar or My characters. Add a name, background, persona, and optional media, then save the character.', 'help.faq1.c': 'Character creation', 'help.faq2.q': 'How does AI generate a story and persona?', 'help.faq2.a': 'Enter a short idea in the creation flow and the AI fills in a background, opening line, and system instruction.', 'help.faq2.c': 'AI creation', 'help.faq3.q': 'What does VIP include?', 'help.faq3.a': 'The current build keeps membership and paid features unavailable. See the status page for the exact boundary.', 'help.faq3.c': 'Membership', 'help.faq4.q': 'How do I manage or delete characters and chats?', 'help.faq4.a': 'Use My characters to remove created characters or clear an active chat from the chat view.', 'help.faq4.c': 'Management & privacy', 'help.faq5.q': 'How are chat safety and privacy handled?', 'help.faq5.a': 'mio separates private content and does not publish your chats as community content.', 'help.faq5.c': 'Safety & privacy', 'help.faq6.q': 'What can I do when a reply misses the persona?', 'help.faq6.a': 'Retry the reply or refine the character system instruction and background.', 'help.faq6.c': 'Chat tips' },
  'zh-CN': { 'chat.promptGreeting': '打个招呼吧 👋', 'chat.promptDay': '今天遇到了什么有趣的事？', 'chat.promptIntro': '可以为我做个自我介绍吗？ 💬', 'chat.promptSecret': '告诉我你心里的秘密... 🤫', 'chat.loadingHistory': '正在加载聊天记录...', 'chat.noMessages': '暂无消息', 'create.ageUnit': '岁', 'help.faq1.q': '如何创建属于我自己的专属 AI 角色？', 'help.faq1.a': '打开侧边栏的“创建”或“我的角色”，填写姓名、背景、人设和媒体后保存即可。', 'help.faq1.c': '角色创建', 'help.faq2.q': 'AI 一键生成故事与对话人设是如何工作的？', 'help.faq2.a': '在创建流程中输入灵感词，AI 会补充背景故事、开场白和系统指令。', 'help.faq2.c': 'AI 创作', 'help.faq3.q': 'VIP 会员订阅包含哪些专属权益？', 'help.faq3.a': '当前版本不开放会员和付费功能，具体边界请查看状态页面。', 'help.faq3.c': '会员权益', 'help.faq4.q': '如何管理和删除我自己创建的角色或聊天记录？', 'help.faq4.a': '在我的角色中删除已创建角色，或在聊天页清空当前对话。', 'help.faq4.c': '管理与隐私', 'help.faq5.q': '对话消息安全与用户隐私如何保障？', 'help.faq5.a': 'mio 将私密内容与社区内容分开，不会把你的聊天公开为社区内容。', 'help.faq5.c': '安全与隐私', 'help.faq6.q': '遇到 AI 回复不理想或脱离人设怎么办？', 'help.faq6.a': '可以重试回复，或补充更具体的人设系统指令和背景描述。', 'help.faq6.c': '对话技巧' },
  ja: { 'chat.promptGreeting': '挨拶してみましょう 👋', 'chat.promptDay': '今日はどんな面白いことがありましたか？', 'chat.promptIntro': '自己紹介してくれますか？ 💬', 'chat.promptSecret': '秘密を一つ教えて...', 'chat.loadingHistory': 'チャット履歴を読み込み中...', 'chat.noMessages': 'メッセージはありません', 'create.ageUnit': '歳', 'help.faq1.q': '自分のAIキャラクターを作るには？', 'help.faq1.a': 'サイドバーの作成またはマイキャラクターから、名前や背景を入力して保存します。', 'help.faq1.c': 'キャラクター作成', 'help.faq2.q': 'AIは物語とペルソナをどう生成しますか？', 'help.faq2.a': '作成画面に短いアイデアを入力すると、背景や開始メッセージを補完します。', 'help.faq2.c': 'AI作成', 'help.faq3.q': 'VIPには何が含まれますか？', 'help.faq3.a': '現在のビルドでは会員・有料機能は利用できません。', 'help.faq3.c': '会員特典', 'help.faq4.q': 'キャラクターやチャットを管理・削除するには？', 'help.faq4.a': 'マイキャラクターまたはチャット画面から削除・消去できます。', 'help.faq4.c': '管理とプライバシー', 'help.faq5.q': 'チャットの安全とプライバシーは？', 'help.faq5.a': 'プライベート内容はコミュニティ公開コンテンツと分離されています。', 'help.faq5.c': '安全とプライバシー', 'help.faq6.q': '返信がペルソナから外れたら？', 'help.faq6.a': '再試行するか、システム指示と背景を詳しくしてください。', 'help.faq6.c': 'チャットのヒント' },
  ko: { 'chat.promptGreeting': '인사해 보세요 👋', 'chat.promptDay': '오늘 재미있었던 일은 무엇인가요?', 'chat.promptIntro': '자기소개를 해줄래요? 💬', 'chat.promptSecret': '비밀 하나를 알려줘...', 'chat.loadingHistory': '채팅 기록을 불러오는 중...', 'chat.noMessages': '메시지가 없습니다', 'create.ageUnit': '세', 'help.faq1.q': '나만의 AI 캐릭터를 어떻게 만드나요?', 'help.faq1.a': '사이드바의 만들기 또는 내 캐릭터에서 이름과 배경을 입력하고 저장하세요.', 'help.faq1.c': '캐릭터 만들기', 'help.faq2.q': 'AI는 스토리와 페르소나를 어떻게 생성하나요?', 'help.faq2.a': '제작 화면에 아이디어를 입력하면 배경과 시작 메시지를 채워 줍니다.', 'help.faq2.c': 'AI 제작', 'help.faq3.q': 'VIP에는 무엇이 포함되나요?', 'help.faq3.a': '현재 빌드에서는 멤버십과 유료 기능을 사용할 수 없습니다.', 'help.faq3.c': '멤버십', 'help.faq4.q': '캐릭터와 채팅을 관리하거나 삭제하려면?', 'help.faq4.a': '내 캐릭터 또는 채팅 화면에서 삭제와 기록 지우기를 사용할 수 있습니다.', 'help.faq4.c': '관리 및 개인정보', 'help.faq5.q': '채팅 안전과 개인정보는 어떻게 보호되나요?', 'help.faq5.a': '비공개 콘텐츠는 커뮤니티 공개 콘텐츠와 분리됩니다.', 'help.faq5.c': '안전 및 개인정보', 'help.faq6.q': '답변이 페르소나와 어긋나면 어떻게 하나요?', 'help.faq6.a': '답변을 재시도하거나 시스템 지침과 배경을 더 구체적으로 작성하세요.', 'help.faq6.c': '채팅 팁' },
};
const pageSupplemental: Record<string, MessageMap> = {
  en: { 'help.discordBullet1': 'Share inspiration and prompts', 'help.discordBullet1Hint': 'Exchange character prompts and visual generation tips.', 'help.discordBullet2': 'Early feature testing', 'help.discordBullet2Hint': 'Try the newest chat and video features first.', 'help.discordBullet3': 'Community rewards', 'help.discordBullet3Hint': 'Join creator events and community activities.', 'help.guideCopyrightHint': 'You own the characters you create. Check rights before publishing.', 'help.guidePrivacyHint': 'Private chats are protected and are not shown publicly.', 'safety.policy.communityGuidelines': 'Community Guidelines', 'safety.policy.complaintPolicy': 'Complaint Policy', 'safety.policy.contentModerationPolicy': 'Content Moderation Policy', 'safety.policy.contentRemovalPolicy': 'Content Removal Policy', 'safety.policy.preScreeningAndPostScreeningPolicy': 'Pre-Screening and Post-Screening Policy', 'safety.policy.privacyPolicy': 'Privacy Policy', 'safety.policy.prohibitedContentPolicy': 'Prohibited Content Policy', 'safety.policy.refundPolicy': 'Refund Policy', 'safety.policy.sexTraffickingPolicy': 'Sex Trafficking and Sexual Exploitation Policy', 'safety.policy.termsOfService': 'Terms of Service', 'safety.policy.exemption2257': '18 U.S.C. Sections 2257 and 2257A Notice', 'safety.policy.amlAntiFraudPolicy': 'Payments Integrity and Anti-Fraud Policy' },
  'zh-CN': { 'help.discordBullet1': '交流灵感 Prompt', 'help.discordBullet1Hint': '分享角色 Prompt、立绘生图词与性格设定技巧。', 'help.discordBullet2': '功能提前测试', 'help.discordBullet2Hint': '第一时间测试最新的对话引擎与视频生成功能。', 'help.discordBullet3': '社区专属福利', 'help.guideCopyrightHint': '玩家自己创建的角色归创作者所有，发布前请确认不侵犯他人权益。', 'help.guidePrivacyHint': '私密对话受保护，不会公开显示或交给第三方分析。', 'safety.policy.communityGuidelines': '社区准则', 'safety.policy.complaintPolicy': '投诉政策', 'safety.policy.contentModerationPolicy': '内容审核政策', 'safety.policy.contentRemovalPolicy': '内容移除政策', 'safety.policy.preScreeningAndPostScreeningPolicy': '发布前后审核政策', 'safety.policy.privacyPolicy': '隐私政策', 'safety.policy.prohibitedContentPolicy': '禁止内容政策', 'safety.policy.refundPolicy': '退款政策', 'safety.policy.sexTraffickingPolicy': '性贩运与性剥削政策', 'safety.policy.termsOfService': '服务条款', 'safety.policy.exemption2257': '《美国法典》第18编第2257和2257A条通知', 'safety.policy.amlAntiFraudPolicy': '支付诚信与反欺诈政策' },
  ja: { 'help.discordBullet1': 'アイデアとプロンプトを共有', 'help.discordBullet1Hint': 'キャラクタープロンプトや生成のコツを交換できます。', 'help.discordBullet2': '新機能を先行テスト', 'help.discordBullet2Hint': '最新のチャットと動画機能を先に試せます。', 'help.discordBullet3': 'コミュニティ特典', 'help.discordBullet3Hint': 'クリエイターイベントに参加できます。', 'help.guideCopyrightHint': '作成したキャラクターはあなたの作品です。公開前に権利を確認してください。', 'help.guidePrivacyHint': 'プライベートチャットは保護され、公開表示されません。', 'safety.policy.communityGuidelines': 'コミュニティガイドライン', 'safety.policy.complaintPolicy': '苦情ポリシー', 'safety.policy.contentModerationPolicy': 'コンテンツモデレーションポリシー', 'safety.policy.contentRemovalPolicy': 'コンテンツ削除ポリシー', 'safety.policy.preScreeningAndPostScreeningPolicy': '公開前後の審査ポリシー', 'safety.policy.privacyPolicy': 'プライバシーポリシー', 'safety.policy.prohibitedContentPolicy': '禁止コンテンツポリシー', 'safety.policy.refundPolicy': '返金ポリシー', 'safety.policy.sexTraffickingPolicy': '人身売買および性的搾取ポリシー', 'safety.policy.termsOfService': '利用規約', 'safety.policy.exemption2257': '米国法典第18編2257条および2257A条の通知', 'safety.policy.amlAntiFraudPolicy': '決済の完全性および不正防止ポリシー' },
  ko: { 'help.discordBullet1': '아이디어와 프롬프트 공유', 'help.discordBullet1Hint': '캐릭터 프롬프트와 생성 팁을 나눕니다.', 'help.discordBullet2': '신기능 사전 테스트', 'help.discordBullet2Hint': '최신 채팅과 동영상 기능을 먼저 사용합니다.', 'help.discordBullet3': '커뮤니티 혜택', 'help.discordBullet3Hint': '창작 이벤트와 커뮤니티 활동에 참여합니다.', 'help.guideCopyrightHint': '직접 만든 캐릭터는 창작자의 작품입니다. 공개 전 권리를 확인하세요.', 'help.guidePrivacyHint': '비공개 채팅은 보호되며 공개되지 않습니다.', 'safety.policy.communityGuidelines': '커뮤니티 가이드라인', 'safety.policy.complaintPolicy': '신고 처리 정책', 'safety.policy.contentModerationPolicy': '콘텐츠 검토 정책', 'safety.policy.contentRemovalPolicy': '콘텐츠 삭제 정책', 'safety.policy.preScreeningAndPostScreeningPolicy': '게시 전후 심사 정책', 'safety.policy.privacyPolicy': '개인정보 처리방침', 'safety.policy.prohibitedContentPolicy': '금지 콘텐츠 정책', 'safety.policy.refundPolicy': '환불 정책', 'safety.policy.sexTraffickingPolicy': '성매매 및 성적 착취 정책', 'safety.policy.termsOfService': '이용약관', 'safety.policy.exemption2257': '미국 법전 제18편 2257 및 2257A조 고지', 'safety.policy.amlAntiFraudPolicy': '결제 무결성 및 사기 방지 정책' },
};
pageSupplemental['zh-CN']['help.discordBullet3Hint'] = '参加角色创作活动与社区福利。';

const referralSupplemental: Record<string, MessageMap> = {
  en: { 'referral.totalEarned': 'Total referral earnings', 'referral.invitedCount': 'Friends invited', 'referral.dailyShare': 'Daily one-click share', 'referral.rechargeConfirm': 'Recharge package confirmation', 'referral.selectedAmount': 'Selected amount', 'referral.amountDue': 'Amount due', 'referral.paymentMethod': 'Payment method', 'referral.wechat': 'WeChat Pay', 'referral.alipay': 'Alipay', 'referral.card': 'Credit card', 'referral.bestValue': 'Best value', 'common.gems': 'gems', 'common.total': 'Total', 'common.buy': 'Buy now' },
  'zh-CN': { 'referral.totalEarned': '累计分享收益', 'referral.invitedCount': '成功邀请好友', 'referral.dailyShare': '每日一键分享', 'referral.rechargeConfirm': '充值宝石套餐确认', 'referral.selectedAmount': '已选充值额度', 'referral.amountDue': '应付金额', 'referral.paymentMethod': '选择支付方式', 'referral.wechat': '微信支付', 'referral.alipay': '支付宝', 'referral.card': '信用卡', 'referral.bestValue': '最划算', 'common.gems': '宝石', 'common.total': '可获得总计', 'common.buy': '立即购买' },
  ja: { 'referral.totalEarned': '紹介報酬合計', 'referral.invitedCount': '招待した友達', 'referral.dailyShare': 'デイリー共有', 'referral.rechargeConfirm': 'チャージパッケージ確認', 'referral.selectedAmount': '選択した金額', 'referral.amountDue': '支払額', 'referral.paymentMethod': '支払い方法', 'referral.wechat': 'WeChat Pay', 'referral.alipay': 'Alipay', 'referral.card': 'クレジットカード', 'referral.bestValue': 'お得', 'common.gems': 'ジェム', 'common.total': '合計', 'common.buy': '購入' },
  ko: { 'referral.totalEarned': '누적 추천 수익', 'referral.invitedCount': '초대한 친구', 'referral.dailyShare': '매일 한 번 공유', 'referral.rechargeConfirm': '충전 패키지 확인', 'referral.selectedAmount': '선택한 충전량', 'referral.amountDue': '결제 금액', 'referral.paymentMethod': '결제 수단', 'referral.wechat': '위챗페이', 'referral.alipay': '알리페이', 'referral.card': '신용카드', 'referral.bestValue': '최고 혜택', 'common.gems': '보석', 'common.total': '총', 'common.buy': '구매' },
};
const createPresetSupplemental: Record<string, MessageMap> = {
  en: {
    'create.preset.race.east_asian.name': 'East Asian', 'create.preset.race.caucasian.name': 'European', 'create.preset.race.latina.name': 'Latina', 'create.preset.race.black.name': 'Black', 'create.preset.race.middle_eastern.name': 'Middle Eastern', 'create.preset.race.south_asian.name': 'South Asian',
    'create.preset.race.east_asian.desc': 'Classic East Asian features and a clear, soft look.', 'create.preset.race.caucasian.desc': 'High-contrast features and a sculpted look.', 'create.preset.race.latina.desc': 'Warm skin tone and an energetic silhouette.', 'create.preset.race.black.desc': 'Rich dark skin and a confident silhouette.', 'create.preset.race.middle_eastern.desc': 'Striking eyes and an enigmatic presence.', 'create.preset.race.south_asian.desc': 'Bronzed warmth and distinctive elegance.',
    'create.preset.species.succubus.name': 'Succubus', 'create.preset.species.elf.name': 'Elf', 'create.preset.species.beastkin.name': 'Beastkin', 'create.preset.species.vampire.name': 'Vampire', 'create.preset.species.angel.name': 'Fallen angel', 'create.preset.species.slime_tentacle.name': 'Slime / tentacle',
    'create.preset.species.succubus.desc': 'A seductive demon with a heart-shaped tail.', 'create.preset.species.elf.desc': 'An elegant elf with a pure-to-fallen contrast.', 'create.preset.species.beastkin.desc': 'Sensitive ears and a playful animal spirit.', 'create.preset.species.vampire.desc': 'A noble vampire with a taste for midnight.', 'create.preset.species.angel.desc': 'A holy presence with a rebellious edge.', 'create.preset.species.slime_tentacle.desc': 'A fantastical creature with fluid, otherworldly forms.',
    'create.preset.skin.porcelain.label': 'Porcelain white', 'create.preset.skin.peach.label': 'Peach blush', 'create.preset.skin.olive_tan.label': 'Olive tan', 'create.preset.skin.ebony_black.label': 'Ebony black', 'create.preset.skin.anime_white.label': 'Anime cool white',
    'create.preset.eye.ruby.label': 'Ruby red', 'create.preset.eye.sapphire.label': 'Sapphire blue', 'create.preset.eye.amethyst.label': 'Amethyst violet', 'create.preset.eye.amber.label': 'Amber gold', 'create.preset.eye.emerald.label': 'Emerald green', 'create.preset.eye.heterochromia.label': 'Heterochromia',
    'create.preset.face.v_line.label': 'V-line', 'create.preset.face.oval.label': 'Classic oval', 'create.preset.face.chubby.label': 'Soft baby face', 'create.preset.face.sculpted.label': 'Sculpted model', 'create.preset.face.v_line.desc': 'A clean, tapered jawline.', 'create.preset.face.oval.desc': 'Soft, balanced, and elegant.', 'create.preset.face.chubby.desc': 'A youthful and gentle expression.', 'create.preset.face.sculpted.desc': 'Defined cheekbones and a strong presence.',
    'create.preset.hair.waves.label': 'Long waves', 'create.preset.hair.bob.label': 'Confident bob', 'create.preset.hair.twin_tails.label': 'Twin tails', 'create.preset.hair.hime_cut.label': 'Hime cut', 'create.preset.hair.wolf_cut.label': 'Wolf cut',
    'create.preset.hairColor.black.label': 'Jet black', 'create.preset.hairColor.silver.label': 'Silver white', 'create.preset.hairColor.blonde.label': 'Golden blonde', 'create.preset.hairColor.pink.label': 'Cherry pink', 'create.preset.hairColor.purple.label': 'Violet', 'create.preset.hairColor.brown.label': 'Chestnut brown',
    'create.preset.body.curvy.label': 'Curvy S-shape', 'create.preset.body.slim.label': 'Slim petite', 'create.preset.body.athletic.label': 'Fit and athletic', 'create.preset.body.tall_model.label': 'Tall model', 'create.preset.body.curvy.badge': 'Defined waist', 'create.preset.body.slim.badge': 'Light and petite', 'create.preset.body.athletic.badge': 'Toned core', 'create.preset.body.tall_model.badge': 'Long-legged',
    'create.preset.chest.flat.label': 'Small (A cup)', 'create.preset.chest.natural.label': 'Natural (B-C cup)', 'create.preset.chest.full.label': 'Full (D-E cup)', 'create.preset.chest.voluptuous.label': 'Voluptuous (G+ cup)', 'create.preset.chest.flat.badge': 'Petite', 'create.preset.chest.natural.badge': 'Natural shape', 'create.preset.chest.full.badge': 'Striking presence', 'create.preset.chest.voluptuous.badge': 'Dramatic volume',
    'create.preset.hip.compact.label': 'Compact and lifted', 'create.preset.hip.peach.label': 'Full peach shape', 'create.preset.hip.hourglass.label': 'Hourglass curve', 'create.preset.hip.compact.badge': 'Springy', 'create.preset.hip.peach.badge': 'Full and soft', 'create.preset.hip.hourglass.badge': 'Defined ratio',
    'create.preset.archetype.domme.name': 'Queen / domme', 'create.preset.archetype.sub.name': 'Submissive', 'create.preset.archetype.ntr.name': 'Betrayal / NTR', 'create.preset.archetype.seductress.name': 'Insatiable seductress', 'create.preset.archetype.contrast.name': 'Cold-to-soft contrast', 'create.preset.archetype.yandere.name': 'Obsessive love', 'create.preset.archetype.onee_san.name': 'Tipsy older-sister type', 'create.preset.archetype.sweet_pure.name': 'Pure devotion', 'create.preset.archetype.domme.desc': 'Commands the scene with confidence and clear boundaries.', 'create.preset.archetype.sub.desc': 'A willing, trust-based dynamic centered on surrender.', 'create.preset.archetype.ntr.desc': 'A dramatic betrayal trope with emotional tension.', 'create.preset.archetype.seductress.desc': 'A bold flirt who keeps the conversation charged.', 'create.preset.archetype.contrast.desc': 'Composed in public, unexpectedly soft in private.', 'create.preset.archetype.yandere.desc': 'Intense devotion with an obsessive edge.', 'create.preset.archetype.onee_san.desc': 'Warm, playful, and a little tipsy after hours.', 'create.preset.archetype.sweet_pure.desc': 'Tender, loyal affection focused on one person.',
    'create.preset.voice.v-1.name': 'Warm everyday voice', 'create.preset.voice.v-2.name': 'Pure anime girl voice', 'create.preset.voice.v-3.name': 'Cool alluring voice', 'create.preset.voice.v-4.name': 'Deep executive voice', 'create.preset.voice.v-5.name': 'Caring older-sister voice', 'create.preset.voice.v-6.name': 'Obsessive yandere voice', 'create.preset.voice.v-7.name': 'Whispering succubus voice', 'create.preset.voice.v-1.sample': 'Today was a long day... come here and let me massage your shoulders.', 'create.preset.voice.v-2.sample': 'You finally came to see me! I have been waiting for you~', 'create.preset.voice.v-3.sample': 'Come sit down... you may not leave tonight without my permission.', 'create.preset.voice.v-4.sample': 'The whole company is worth less than having you in my arms tonight.', 'create.preset.voice.v-5.sample': 'Tired? Rest your head on my lap... I will take care of you.', 'create.preset.voice.v-6.sample': 'If I keep you in this dark room, you will belong only to me forever~', 'create.preset.voice.v-7.sample': 'My gaze is almost through you... should I come a little closer?',
  },
  'zh-CN': {
    'create.preset.race.east_asian.name': '东方 / 亚洲绝色', 'create.preset.race.caucasian.name': '欧美 / 极致立体', 'create.preset.race.latina.name': '拉丁 / 热情热辣', 'create.preset.race.black.name': '黑人 / 巧克力黑曜美姬', 'create.preset.race.middle_eastern.name': '中东 / 阿拉伯异域', 'create.preset.race.south_asian.name': '南亚 / 异域古铜蜜姬',
    'create.preset.species.succubus.name': '魅魔', 'create.preset.species.elf.name': '纯洁 / 堕落精灵', 'create.preset.species.beastkin.name': '狐仙 / 猫娘兽人', 'create.preset.species.vampire.name': '吸血鬼贵族', 'create.preset.species.angel.name': '堕天圣天使', 'create.preset.species.slime_tentacle.name': '触手 / 史莱姆异种姬', 'create.preset.race.east_asian.desc': '经典东方五官，清透柔和。', 'create.preset.race.caucasian.desc': '立体高对比五官，轮廓鲜明。', 'create.preset.race.latina.desc': '温暖肤色与充满活力的身形。', 'create.preset.race.black.desc': '深色肌肤与自信有力的身形。', 'create.preset.race.middle_eastern.desc': '醒目的眼神与神秘气质。', 'create.preset.race.south_asian.desc': '古铜暖调与独特优雅。', 'create.preset.species.succubus.desc': '带有心形尾巴的魅惑恶魔。', 'create.preset.species.elf.desc': '纯洁与堕落反差并存的优雅精灵。', 'create.preset.species.beastkin.desc': '敏感兽耳与俏皮的动物灵性。', 'create.preset.species.vampire.desc': '沉迷午夜气息的贵族吸血鬼。', 'create.preset.species.angel.desc': '神圣外表下带着叛逆锋芒。', 'create.preset.species.slime_tentacle.desc': '形态流动、来自异世界的奇幻生物。',
    'create.preset.skin.porcelain.label': '冷白皮 / 珍珠纯白', 'create.preset.skin.peach.label': '蜜桃粉白 / 微醺泛红', 'create.preset.skin.olive_tan.label': '小麦色 / 健康蜜糖光泽', 'create.preset.skin.ebony_black.label': '巧克力黑曜皮 / 爆棚野性', 'create.preset.skin.anime_white.label': '二次元发光冷白',
    'create.preset.eye.ruby.label': '发情魅惑红瞳', 'create.preset.eye.sapphire.label': '深邃宝石蓝瞳', 'create.preset.eye.amethyst.label': '妖娆魅惑紫瞳', 'create.preset.eye.amber.label': '琥珀兽性金瞳', 'create.preset.eye.emerald.label': '翡翠清澈绿瞳', 'create.preset.eye.heterochromia.label': '异色双瞳',
    'create.preset.face.v_line.label': '精致瓜子脸', 'create.preset.face.oval.label': '经典鹅蛋脸', 'create.preset.face.chubby.label': '胶原婴儿肥', 'create.preset.face.sculpted.label': '欧美超模高颧骨', 'create.preset.face.v_line.desc': '下颌线利落流畅。', 'create.preset.face.oval.desc': '柔和、均衡而典雅。', 'create.preset.face.chubby.desc': '年轻柔软的表情。', 'create.preset.face.sculpted.desc': '高颧骨与强烈存在感。',
    'create.preset.hair.waves.label': '风情大波浪卷发', 'create.preset.hair.bob.label': '干练性感短发', 'create.preset.hair.twin_tails.label': '二次元双马尾', 'create.preset.hair.hime_cut.label': '姬发式黑长直', 'create.preset.hair.wolf_cut.label': '野性狼尾碎发',
    'create.preset.hairColor.black.label': '乌黑漆黑发', 'create.preset.hairColor.silver.label': '空灵银白发', 'create.preset.hairColor.blonde.label': '耀眼金发', 'create.preset.hairColor.pink.label': '樱花粉发', 'create.preset.hairColor.purple.label': '紫罗兰发', 'create.preset.hairColor.brown.label': '温柔栗棕发',
    'create.preset.body.curvy.label': '丰满 S 曲线', 'create.preset.body.slim.label': '纤细苗条', 'create.preset.body.athletic.label': '健美紧致', 'create.preset.body.tall_model.label': '高挑九头身', 'create.preset.body.curvy.badge': '极致腰臀', 'create.preset.body.slim.badge': '轻盈苗条', 'create.preset.body.athletic.badge': '马甲线拉满', 'create.preset.body.tall_model.badge': '九头身长腿',
    'create.preset.chest.flat.label': '秀气平胸（A 杯）', 'create.preset.chest.natural.label': '匀称挺拔（B-C 杯）', 'create.preset.chest.full.label': '傲人深沟（D-E 杯）', 'create.preset.chest.voluptuous.label': '爆乳巨乳（G 杯以上）', 'create.preset.chest.flat.badge': '娇小可人', 'create.preset.chest.natural.badge': '自然坚挺', 'create.preset.chest.full.badge': '存在感爆发', 'create.preset.chest.voluptuous.badge': '极致震撼',
    'create.preset.hip.compact.label': '紧致挺拔翘臀', 'create.preset.hip.peach.label': '性感饱满蜜桃臀', 'create.preset.hip.hourglass.label': '极致沙漏大观臀', 'create.preset.hip.compact.badge': '弹性爆发', 'create.preset.hip.peach.badge': '饱满柔和', 'create.preset.hip.hourglass.badge': '腰臀比炸裂',
    'create.preset.archetype.domme.name': '女王支配型', 'create.preset.archetype.sub.name': '顺从奴隶型', 'create.preset.archetype.ntr.name': '背叛绿奴 / NTR', 'create.preset.archetype.seductress.name': '索求无度魅魔', 'create.preset.archetype.contrast.name': '严厉反差破防', 'create.preset.archetype.yandere.name': '病态黑化狂爱', 'create.preset.archetype.onee_san.name': '醉意微醺御姐', 'create.preset.archetype.sweet_pure.name': '专一极致纯爱', 'create.preset.archetype.domme.desc': '自信主导场景，并重视清晰边界。', 'create.preset.archetype.sub.desc': '以信任为基础、专注于顺从的互动。', 'create.preset.archetype.ntr.desc': '充满情绪张力的戏剧化背叛主题。', 'create.preset.archetype.seductress.desc': '大胆撩拨，让对话保持暧昧张力。', 'create.preset.archetype.contrast.desc': '在外沉着克制，私下展现柔软一面。', 'create.preset.archetype.yandere.desc': '带有偏执色彩的强烈专一。', 'create.preset.archetype.onee_san.desc': '温暖俏皮，夜深时带一点微醺。', 'create.preset.archetype.sweet_pure.desc': '温柔忠贞，只把爱交给一个人。',
    'create.preset.voice.v-1.name': '温暖日常温柔音', 'create.preset.voice.v-2.name': '清纯二次元少女音', 'create.preset.voice.v-3.name': '御姐高冷魅惑音', 'create.preset.voice.v-4.name': '霸道总裁深沉音', 'create.preset.voice.v-5.name': '治愈系大姐姐音', 'create.preset.voice.v-6.name': '狂气病娇独占音', 'create.preset.voice.v-7.name': '黑丝魅魔附耳音', 'create.preset.voice.v-1.sample': '今天辛苦啦……过来，让我好好为你按按肩膀。', 'create.preset.voice.v-2.sample': '你终于来看我啦！人家等了你好久呢～', 'create.preset.voice.v-3.sample': '过来坐下……今晚没有我的允许，不准离开。', 'create.preset.voice.v-4.sample': '整个集团的资产，都不及今晚你躺在我怀里的滋味。', 'create.preset.voice.v-5.sample': '累了吗？把头靠在我腿上……姐姐会照顾你。', 'create.preset.voice.v-6.sample': '把你关在这间暗室里，你就永远只属于我了呢～', 'create.preset.voice.v-7.sample': '要被主人的视线看穿了呢，要不要更近一点？',
  },
  ja: {
    'create.preset.race.east_asian.name': '東アジア', 'create.preset.race.caucasian.name': 'ヨーロッパ系', 'create.preset.race.latina.name': 'ラテン系', 'create.preset.race.black.name': 'ブラック', 'create.preset.race.middle_eastern.name': '中東系', 'create.preset.race.south_asian.name': '南アジア系', 'create.preset.species.succubus.name': 'サキュバス', 'create.preset.species.elf.name': 'エルフ', 'create.preset.species.beastkin.name': '獣人', 'create.preset.species.vampire.name': '吸血鬼', 'create.preset.species.angel.name': '堕天使', 'create.preset.species.slime_tentacle.name': 'スライム／触手',
    'create.preset.skin.porcelain.label': '陶器の白肌', 'create.preset.skin.peach.label': 'ピーチの血色', 'create.preset.skin.olive_tan.label': 'オリーブタン', 'create.preset.skin.ebony_black.label': 'エボニーブラック', 'create.preset.skin.anime_white.label': 'アニメ系クールホワイト', 'create.preset.eye.ruby.label': 'ルビーレッド', 'create.preset.eye.sapphire.label': 'サファイアブルー', 'create.preset.eye.amethyst.label': 'アメジスト', 'create.preset.eye.amber.label': 'アンバーゴールド', 'create.preset.eye.emerald.label': 'エメラルド', 'create.preset.eye.heterochromia.label': 'オッドアイ',
    'create.preset.face.v_line.label': 'Vライン', 'create.preset.face.oval.label': 'クラシック卵型', 'create.preset.face.chubby.label': '柔らかなベビーフェイス', 'create.preset.face.sculpted.label': 'モデル風立体顔', 'create.preset.hair.waves.label': 'ロングウェーブ', 'create.preset.hair.bob.label': 'クールなボブ', 'create.preset.hair.twin_tails.label': 'ツインテール', 'create.preset.hair.hime_cut.label': '姫カット', 'create.preset.hair.wolf_cut.label': 'ウルフカット', 'create.preset.hairColor.black.label': '漆黒', 'create.preset.hairColor.silver.label': 'シルバーホワイト', 'create.preset.hairColor.blonde.label': 'ゴールドブロンド', 'create.preset.hairColor.pink.label': 'チェリーピンク', 'create.preset.hairColor.purple.label': 'バイオレット', 'create.preset.hairColor.brown.label': '栗色',
    'create.preset.body.curvy.label': '曲線的な体型', 'create.preset.body.slim.label': 'スリムで小柄', 'create.preset.body.athletic.label': '健康的でアスレチック', 'create.preset.body.tall_model.label': '長身モデル', 'create.preset.chest.flat.label': '小さめ（Aカップ）', 'create.preset.chest.natural.label': '自然なサイズ（B-Cカップ）', 'create.preset.chest.full.label': '豊かなサイズ（D-Eカップ）', 'create.preset.chest.voluptuous.label': 'グラマラス（Gカップ以上）', 'create.preset.hip.compact.label': '引き締まったヒップ', 'create.preset.hip.peach.label': 'ピーチヒップ', 'create.preset.hip.hourglass.label': '砂時計型',
    'create.preset.archetype.domme.name': '女王・ドム', 'create.preset.archetype.sub.name': '従順タイプ', 'create.preset.archetype.ntr.name': '裏切り／NTR', 'create.preset.archetype.seductress.name': '誘惑のサキュバス', 'create.preset.archetype.contrast.name': 'ギャップの魅力', 'create.preset.archetype.yandere.name': '病的な愛', 'create.preset.archetype.onee_san.name': 'ほろ酔いお姉さん', 'create.preset.archetype.sweet_pure.name': '一途な純愛', 'create.preset.voice.v-1.name': '温かい日常ボイス', 'create.preset.voice.v-2.name': '清純アニメ少女ボイス', 'create.preset.voice.v-3.name': 'クールで魅惑的な声', 'create.preset.voice.v-4.name': '低く落ち着いた声', 'create.preset.voice.v-5.name': '癒やし系お姉さんボイス', 'create.preset.voice.v-6.name': '独占欲の強い声', 'create.preset.voice.v-7.name': 'ささやくサキュバスボイス', 'create.preset.voice.v-1.sample': '今日はお疲れさま……こちらで肩を揉んであげます。', 'create.preset.voice.v-2.sample': 'やっと会いに来てくれた！ずっと待っていたよ～', 'create.preset.voice.v-3.sample': 'ここに座って……今夜は私の許可なく出られません。', 'create.preset.voice.v-4.sample': '今夜あなたを腕に抱くことは、会社の全資産より価値があります。', 'create.preset.voice.v-5.sample': '疲れましたか？膝に頭を預けて……私が癒やします。', 'create.preset.voice.v-6.sample': 'この暗い部屋に閉じ込めたら、永遠に私だけのものです。', 'create.preset.voice.v-7.sample': '私の視線に見透かされそう……もう少し近くに来ますか？',
  },
  ko: {
    'create.preset.race.east_asian.name': '동아시아', 'create.preset.race.caucasian.name': '유럽계', 'create.preset.race.latina.name': '라틴계', 'create.preset.race.black.name': '흑인', 'create.preset.race.middle_eastern.name': '중동계', 'create.preset.race.south_asian.name': '남아시아계', 'create.preset.species.succubus.name': '서큐버스', 'create.preset.species.elf.name': '엘프', 'create.preset.species.beastkin.name': '수인', 'create.preset.species.vampire.name': '뱀파이어', 'create.preset.species.angel.name': '타락 천사', 'create.preset.species.slime_tentacle.name': '슬라임 / 촉수',
    'create.preset.skin.porcelain.label': '도자기처럼 흰 피부', 'create.preset.skin.peach.label': '복숭아빛 홍조', 'create.preset.skin.olive_tan.label': '올리브 톤', 'create.preset.skin.ebony_black.label': '에보니 블랙', 'create.preset.skin.anime_white.label': '애니 쿨 화이트', 'create.preset.eye.ruby.label': '루비 레드', 'create.preset.eye.sapphire.label': '사파이어 블루', 'create.preset.eye.amethyst.label': '자수정 바이올렛', 'create.preset.eye.amber.label': '앰버 골드', 'create.preset.eye.emerald.label': '에메랄드 그린', 'create.preset.eye.heterochromia.label': '오드아이',
    'create.preset.face.v_line.label': 'V라인', 'create.preset.face.oval.label': '클래식 타원형', 'create.preset.face.chubby.label': '부드러운 베이비 페이스', 'create.preset.face.sculpted.label': '입체적인 모델형', 'create.preset.hair.waves.label': '긴 웨이브', 'create.preset.hair.bob.label': '세련된 단발', 'create.preset.hair.twin_tails.label': '트윈테일', 'create.preset.hair.hime_cut.label': '히메컷', 'create.preset.hair.wolf_cut.label': '울프컷', 'create.preset.hairColor.black.label': '칠흑색', 'create.preset.hairColor.silver.label': '실버 화이트', 'create.preset.hairColor.blonde.label': '골드 블론드', 'create.preset.hairColor.pink.label': '체리 핑크', 'create.preset.hairColor.purple.label': '바이올렛', 'create.preset.hairColor.brown.label': '밤색',
    'create.preset.body.curvy.label': '곡선형 체형', 'create.preset.body.slim.label': '슬림하고 아담한 체형', 'create.preset.body.athletic.label': '탄탄한 체형', 'create.preset.body.tall_model.label': '키 큰 모델형', 'create.preset.chest.flat.label': '작은 사이즈 (A컵)', 'create.preset.chest.natural.label': '자연스러운 사이즈 (B-C컵)', 'create.preset.chest.full.label': '풍만한 사이즈 (D-E컵)', 'create.preset.chest.voluptuous.label': '글래머러스 (G컵 이상)', 'create.preset.hip.compact.label': '탄탄하게 올라온 힙', 'create.preset.hip.peach.label': '복숭아 힙', 'create.preset.hip.hourglass.label': '모래시계 곡선',
    'create.preset.archetype.domme.name': '여왕 / 돔', 'create.preset.archetype.sub.name': '순종형', 'create.preset.archetype.ntr.name': '배신 / NTR', 'create.preset.archetype.seductress.name': '유혹적인 서큐버스', 'create.preset.archetype.contrast.name': '차가움과 부드러움의 대비', 'create.preset.archetype.yandere.name': '집착하는 사랑', 'create.preset.archetype.onee_san.name': '취한 누님 타입', 'create.preset.archetype.sweet_pure.name': '한결같은 순애', 'create.preset.voice.v-1.name': '따뜻한 일상 목소리', 'create.preset.voice.v-2.name': '순수한 애니 소녀 목소리', 'create.preset.voice.v-3.name': '차갑고 매혹적인 목소리', 'create.preset.voice.v-4.name': '낮고 깊은 목소리', 'create.preset.voice.v-5.name': '다정한 누나 목소리', 'create.preset.voice.v-6.name': '집착적인 얀데레 목소리', 'create.preset.voice.v-7.name': '속삭이는 서큐버스 목소리', 'create.preset.voice.v-1.sample': '오늘도 수고했어요... 이리 와서 어깨를 주물러 줄게요.', 'create.preset.voice.v-2.sample': '드디어 만나러 왔구나! 오래 기다렸어~', 'create.preset.voice.v-3.sample': '여기 앉아... 오늘 밤은 내 허락 없이 나갈 수 없어.', 'create.preset.voice.v-4.sample': '오늘 밤 당신을 안는 기분은 회사 전체보다 값집니다.', 'create.preset.voice.v-5.sample': '피곤해요? 무릎에 머리를 기대요... 내가 돌봐 줄게요.', 'create.preset.voice.v-6.sample': '이 어두운 방에 가두면 영원히 나만의 것이 될 거야~', 'create.preset.voice.v-7.sample': '내 시선이 당신을 꿰뚫고 있어... 조금 더 가까이 올래?',
  },
};
const createTraitSupplemental: Record<string, MessageMap> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, {}]),
);
const createSupplemental: Record<string, MessageMap> = {
  en: {
    'create.imageReadyProfileGenerating': 'Portrait ready. Generating character details...', 'create.imageLoadError': 'The portrait could not be loaded. Please retry.', 'create.retryImage': 'Retry image',
    'create.previewImageAlt': 'Enlarged appearance detail', 'create.previewImage': 'High-resolution appearance preview', 'create.score': 'Match score', 'create.perfectMatch': 'perfect match', 'create.createAnother': 'Create another character', 'create.creatorBadge': 'creator',
    'create.step1Sub': 'Style & gender', 'create.step2Sub': 'Lineage & species', 'create.step3Sub': 'Skin, shape & hair', 'create.step4Sub': 'Traits & interests', 'create.step5Sub': 'Archetype & story', 'create.step6Sub': 'Review & render',
    'create.stepTitle1': 'Step 1: Choose a base style and gender', 'create.stepDescription1': 'Choose anime illustration or a high-fidelity photorealistic portrait.', 'create.animeDescription': 'Luminous hair, expressive anime detail, and a dreamy palette.', 'create.realisticDescription': 'Natural skin texture, soft light, and photographic detail.', 'create.femaleDescription': 'Soft, confident, alluring, or other feminine archetypes.', 'create.maleDescription': 'Charismatic, athletic, calm, or other masculine archetypes.', 'create.nonbinaryDescription': 'Androgynous, gender-fluid, and expressive designs.',
    'create.stepTitle2': 'Step 2: Choose one race or lineage', 'create.stepDescription2': 'Select exactly one option from the human and fantasy lineages.', 'create.humanRaces': 'Human heritage', 'create.fantasySpecies': 'Fantasy species', 'create.humanSpecies': 'Human (no special abilities)',
    'create.stepTitle3': 'Step 3: Set visual details', 'create.stepDescription3': 'Choose skin, body proportions, hair, face, and eye details.', 'create.skinTone': 'Skin tone', 'create.chestSize': 'Chest size', 'create.hipSize': 'Hip shape', 'create.bodyBuild': 'Body build', 'create.faceShape': 'Face shape', 'create.hairStyle': 'Hair style', 'create.eyeColor': 'Eye color', 'create.skinToneHint': 'Choose a skin tone (click a card to enlarge)', 'create.chestSizeHint': 'Choose chest size and cup shape', 'create.hipSizeHint': 'Choose hip shape and waist ratio', 'create.bodyBuildHint': 'Choose body proportions and build', 'create.faceShapeHint': 'Choose face shape and features', 'create.hairStyleHint': 'Choose a hairstyle', 'create.hairColorHint': 'Choose a hair color', 'create.eyeColorHint': 'Choose an iris color',
    'create.stepTitle4': 'Step 4: Personality, occupation, relationship, and interaction preferences', 'create.stepDescription4': 'Shape the character’s inner world, social role, relationship bond, and intimate tone.', 'create.personalityHint': 'Personality & aura (choose multiple)', 'create.occupationHint': 'Occupation & role (choose multiple)', 'create.relationshipHint': 'Relationship dynamic (choose multiple)', 'create.fetishHint': 'Interaction preferences & highlights (choose multiple)',
    'create.stepTitle5': 'Step 5: Archetype, story, and opening', 'create.stepDescription5': 'Give the character a name, background, and first line.', 'create.archetypeHint': 'Story tropes (choose one)', 'create.name': 'Character name', 'create.subtitle': 'One-line subtitle',
    'create.stepTitle6': 'Step 6: Review and render the character portrait', 'create.stepDescription6': 'Review the style, lineage, proportions, and traits selected above.', 'create.editSetup': 'Edit setup', 'create.styleGender': 'Style & gender', 'create.bodyDetails': 'Body details', 'create.colorDetails': 'Color & hair', 'create.selectedTraits': 'Selected traits:', 'create.traitCount': 'traits', 'create.avatarResultAlt': 'Generated character portrait', 'create.rendered': 'Rendered from your setup', 'create.presetTemplate': 'Preset template (generate to customize)', 'create.unnamedCharacter': 'Unnamed character', 'create.progress': 'Progress', 'create.generate': 'Generate portrait', 'create.regenerate': 'Regenerate portrait', 'create.promptLabel': 'Image prompt (assembled from your setup)', 'create.rebuildPrompt': 'Rebuild prompt', 'create.voiceHint': 'Choose a voice (preview available)', 'create.vipExclusive': 'VIP exclusive', 'create.vipLocked': 'VIP locked', 'create.freeAvailable': 'Free', 'create.pause': 'Pause', 'create.listen': 'Listen',
  },
  'zh-CN': {
    'create.imageReadyProfileGenerating': '立绘已完成，正在生成角色资料…', 'create.imageLoadError': '立绘加载失败，请重试。', 'create.retryImage': '重试图片',
    'create.previewImageAlt': '放大的外观细节', 'create.previewImage': '外在细节高清特写写真', 'create.score': '智能评分', 'create.perfectMatch': '完美匹配', 'create.createAnother': '继续制作下一个角色', 'create.creatorBadge': '创作者',
    'create.step1Sub': '画风类型与性别', 'create.step2Sub': '血统与奇幻种族', 'create.step3Sub': '肤色、身材与发型', 'create.step4Sub': '性格与兴趣标签', 'create.step5Sub': '剧情定位与故事', 'create.step6Sub': '核对方案并生成',
    'create.stepTitle1': '步骤 1：选择基础画风与性别', 'create.stepDescription1': '选择二次元动漫插画，或高还原度的写实真人肖像。', 'create.animeDescription': '发丝流光、二次元张力与梦幻色彩体验。', 'create.realisticDescription': '逼真肌肤质感、柔和光影与摄影级细节。', 'create.femaleDescription': '软萌、御姐、魅魔或其他女性气质。', 'create.maleDescription': '霸总、狼狗、沉稳男神或其他男性气质。', 'create.nonbinaryDescription': '伪娘、非二元、中性与流动的表达。',
    'create.stepTitle2': '步骤 2：选择一种种族或血统', 'create.stepDescription2': '从人类血统和奇幻种族中选择一项。', 'create.humanRaces': '人类现实种族血统', 'create.fantasySpecies': '奇幻 / 猎奇魔幻种族', 'create.humanSpecies': '纯正人类种族（无异能）',
    'create.stepTitle3': '步骤 3：设置视觉外在细节', 'create.stepDescription3': '选择肤色、身材比例、发型、脸型和眼瞳细节。', 'create.skinTone': '肤色选择', 'create.chestSize': '胸部尺寸', 'create.hipSize': '臀部型号', 'create.bodyBuild': '身形身材', 'create.faceShape': '脸型轮廓', 'create.hairStyle': '发型造型', 'create.eyeColor': '虹膜眼瞳', 'create.skinToneHint': '选择肤色方案（点击照片卡片放大特写）', 'create.chestSizeHint': '选择胸部罩杯与尺寸', 'create.hipSizeHint': '选择臀部型号与腰臀比例', 'create.bodyBuildHint': '选择整体身材与骨骼比例', 'create.faceShapeHint': '选择脸型与面部特征', 'create.hairStyleHint': '选择发型造型', 'create.hairColorHint': '选择头发发色', 'create.eyeColorHint': '选择虹膜瞳孔颜色',
    'create.stepTitle4': '步骤 4：性格、职业、互动关系与情调焦点', 'create.stepDescription4': '设定角色的内心世界、社会身份、关系羁绊与互动情调。', 'create.personalityHint': '人格与气场（可多选）', 'create.occupationHint': '职业与角色（可多选）', 'create.relationshipHint': '人际关系动态（可多选）', 'create.fetishHint': '互动偏好与亮点（可多选）',
    'create.stepTitle5': '步骤 5：剧情定位、背景故事与开场白', 'create.stepDescription5': '设置角色的名字、背景故事与第一句话开场白台词。', 'create.archetypeHint': '剧情定位（请选择一种）', 'create.name': '角色名字', 'create.subtitle': '一句话简介副标题',
    'create.stepTitle6': '步骤 6：核对方案并生成专属立绘', 'create.stepDescription6': '汇总核对前面选择的画风、种族、身材与性格癖好。', 'create.editSetup': '修改前面的设定', 'create.styleGender': '画风与性别', 'create.bodyDetails': '三维与身材细节', 'create.colorDetails': '肤色与发色', 'create.selectedTraits': '选中身份与癖好标签：', 'create.traitCount': '项特征设定', 'create.avatarResultAlt': '生成的角色立绘', 'create.rendered': '已依据方案完成渲染', 'create.presetTemplate': '预设模版（点击生成专属）', 'create.unnamedCharacter': '未命名角色', 'create.progress': '生成进度', 'create.generate': '生成专属立绘', 'create.regenerate': '重新生成专属立绘', 'create.promptLabel': 'AI 绘图指令 Prompt（自动根据前述方案合成）', 'create.rebuildPrompt': '重新合成 Prompt', 'create.voiceHint': '选择专属配音音色（可直接试听）', 'create.vipExclusive': 'VIP 专属', 'create.vipLocked': 'VIP 锁定', 'create.freeAvailable': '免费可用', 'create.pause': '暂停', 'create.listen': '试听',
  },
  ja: {
    'create.imageReadyProfileGenerating': '立ち絵は完成しました。キャラクター情報を生成中です…', 'create.imageLoadError': '立ち絵を読み込めませんでした。再試行してください。', 'create.retryImage': '画像を再試行',
    'create.previewImageAlt': '拡大した外見の詳細', 'create.previewImage': '外見の高解像度プレビュー', 'create.score': 'マッチ度', 'create.perfectMatch': '最高のマッチ', 'create.createAnother': '別のキャラクターを作成', 'create.creatorBadge': 'クリエイター',
    'create.step1Sub': '画風と性別', 'create.step2Sub': '血統と種族', 'create.step3Sub': '肌・体型・髪', 'create.step4Sub': '性格と趣味', 'create.step5Sub': '設定とストーリー', 'create.step6Sub': '確認と生成',
    'create.stepTitle1': 'ステップ1：基本の画風と性別', 'create.stepDescription1': 'アニメイラストまたは高精細なリアルポートレートを選びます。', 'create.animeDescription': '光をまとった髪と、夢のようなアニメ表現。', 'create.realisticDescription': '自然な肌、柔らかな光、写真のような細部。', 'create.femaleDescription': 'かわいい、姉御肌、魅惑的などの女性表現。', 'create.maleDescription': 'カリスマ的、力強い、落ち着いた男性表現。', 'create.nonbinaryDescription': '中性的で自由なジェンダー表現。',
    'create.stepTitle2': 'ステップ2：種族または血統を1つ選択', 'create.stepDescription2': '人間の血統とファンタジー種族から1つ選びます。', 'create.humanRaces': '人間の血統', 'create.fantasySpecies': 'ファンタジー種族', 'create.humanSpecies': '人間（特殊能力なし）',
    'create.stepTitle3': 'ステップ3：外見の詳細', 'create.stepDescription3': '肌、体型、髪、顔、瞳の詳細を選びます。', 'create.skinTone': '肌色', 'create.chestSize': '胸のサイズ', 'create.hipSize': 'ヒップ', 'create.bodyBuild': '体型', 'create.faceShape': '顔立ち', 'create.hairStyle': 'ヘアスタイル', 'create.eyeColor': '瞳の色', 'create.skinToneHint': '肌色を選択（カードをクリックで拡大）', 'create.chestSizeHint': '胸のサイズとカップを選択', 'create.hipSizeHint': 'ヒップの形と腰の比率を選択', 'create.bodyBuildHint': '体型と骨格の比率を選択', 'create.faceShapeHint': '顔立ちと特徴を選択', 'create.hairStyleHint': 'ヘアスタイルを選択', 'create.hairColorHint': '髪色を選択', 'create.eyeColorHint': '虹彩の色を選択',
    'create.stepTitle4': 'ステップ4：性格・職業・関係・交流の好み', 'create.stepDescription4': '内面、社会的立場、関係の絆、親密な雰囲気を設定します。', 'create.personalityHint': '性格と雰囲気（複数選択）', 'create.occupationHint': '職業と役割（複数選択）', 'create.relationshipHint': '人間関係のダイナミクス（複数選択）', 'create.fetishHint': '交流の好みと見どころ（複数選択）',
    'create.stepTitle5': 'ステップ5：設定・物語・開始メッセージ', 'create.stepDescription5': '名前、背景、最初のセリフを設定します。', 'create.archetypeHint': '物語の展開タイプ（1つ選択）', 'create.name': 'キャラクター名', 'create.subtitle': '一言サブタイトル',
    'create.stepTitle6': 'ステップ6：確認してポートレートを生成', 'create.stepDescription6': '選択した画風、血統、体型、性格を確認します。', 'create.editSetup': '設定を編集', 'create.styleGender': '画風と性別', 'create.bodyDetails': '体型の詳細', 'create.colorDetails': '肌と髪の色', 'create.selectedTraits': '選択した特徴：', 'create.traitCount': '件', 'create.avatarResultAlt': '生成されたキャラクターポートレート', 'create.rendered': '設定から生成済み', 'create.presetTemplate': 'プリセット（生成してカスタマイズ）', 'create.unnamedCharacter': '名前未設定のキャラクター', 'create.progress': '進行状況', 'create.generate': 'ポートレートを生成', 'create.regenerate': '再生成', 'create.promptLabel': '画像プロンプト（設定から自動作成）', 'create.rebuildPrompt': 'プロンプトを再作成', 'create.voiceHint': '音声を選択（試聴できます）', 'create.vipExclusive': 'VIP限定', 'create.vipLocked': 'VIPロック', 'create.freeAvailable': '無料', 'create.pause': '一時停止', 'create.listen': '試聴',
  },
  ko: {
    'create.imageReadyProfileGenerating': '초상화가 완료되었습니다. 캐릭터 정보를 생성하는 중입니다…', 'create.imageLoadError': '초상화를 불러오지 못했습니다. 다시 시도하세요.', 'create.retryImage': '이미지 다시 시도',
    'create.previewImageAlt': '확대한 외형 디테일', 'create.previewImage': '고해상도 외형 미리보기', 'create.score': '매칭 점수', 'create.perfectMatch': '완벽한 매칭', 'create.createAnother': '다른 캐릭터 만들기', 'create.creatorBadge': '크리에이터',
    'create.step1Sub': '화풍 및 성별', 'create.step2Sub': '혈통 및 종족', 'create.step3Sub': '피부·체형·헤어', 'create.step4Sub': '성격과 취향', 'create.step5Sub': '설정과 스토리', 'create.step6Sub': '검토 및 생성',
    'create.stepTitle1': '1단계: 기본 화풍과 성별 선택', 'create.stepDescription1': '애니메이션 일러스트 또는 고화질 실사 인물화를 선택하세요.', 'create.animeDescription': '빛나는 머리카락과 몽환적인 애니메이션 디테일.', 'create.realisticDescription': '자연스러운 피부, 부드러운 빛, 사진 같은 디테일.', 'create.femaleDescription': '귀엽고 자신감 있는 여성 캐릭터 표현.', 'create.maleDescription': '카리스마 있고 차분한 남성 캐릭터 표현.', 'create.nonbinaryDescription': '중성적이고 자유로운 젠더 표현.',
    'create.stepTitle2': '2단계: 종족 또는 혈통 하나 선택', 'create.stepDescription2': '인간 혈통과 판타지 종족 중 하나만 선택하세요.', 'create.humanRaces': '인간 혈통', 'create.fantasySpecies': '판타지 종족', 'create.humanSpecies': '인간 (특수 능력 없음)',
    'create.stepTitle3': '3단계: 외형 디테일 설정', 'create.stepDescription3': '피부, 체형, 헤어, 얼굴과 눈 디테일을 선택하세요.', 'create.skinTone': '피부색', 'create.chestSize': '가슴 크기', 'create.hipSize': '힙 형태', 'create.bodyBuild': '체형', 'create.faceShape': '얼굴형', 'create.hairStyle': '헤어스타일', 'create.eyeColor': '눈 색상', 'create.skinToneHint': '피부색을 선택하세요 (카드를 클릭하면 확대됩니다)', 'create.chestSizeHint': '가슴 크기와 컵을 선택하세요', 'create.hipSizeHint': '힙 형태와 허리 비율을 선택하세요', 'create.bodyBuildHint': '체형과 골격 비율을 선택하세요', 'create.faceShapeHint': '얼굴형과 특징을 선택하세요', 'create.hairStyleHint': '헤어스타일을 선택하세요', 'create.hairColorHint': '머리 색상을 선택하세요', 'create.eyeColorHint': '홍채 색상을 선택하세요',
    'create.stepTitle4': '4단계: 성격·직업·관계·상호작용 취향', 'create.stepDescription4': '내면, 사회적 역할, 관계의 유대와 친밀한 분위기를 설정하세요.', 'create.personalityHint': '성격과 분위기 (복수 선택)', 'create.occupationHint': '직업과 역할 (복수 선택)', 'create.relationshipHint': '대인 관계 역학 (복수 선택)', 'create.fetishHint': '상호작용 취향과 포인트 (복수 선택)',
    'create.stepTitle5': '5단계: 설정, 스토리와 시작 메시지', 'create.stepDescription5': '이름, 배경 이야기와 첫 대사를 설정하세요.', 'create.archetypeHint': '스토리 전개 유형 (하나 선택)', 'create.name': '캐릭터 이름', 'create.subtitle': '한 줄 소개',
    'create.stepTitle6': '6단계: 검토하고 캐릭터 이미지 생성', 'create.stepDescription6': '선택한 화풍, 혈통, 체형과 성격을 확인하세요.', 'create.editSetup': '설정 수정', 'create.styleGender': '화풍 및 성별', 'create.bodyDetails': '체형 디테일', 'create.colorDetails': '피부 및 머리 색상', 'create.selectedTraits': '선택한 특성:', 'create.traitCount': '개 특성', 'create.avatarResultAlt': '생성된 캐릭터 이미지', 'create.rendered': '설정에 따라 생성됨', 'create.presetTemplate': '프리셋 (생성하여 맞춤 설정)', 'create.unnamedCharacter': '이름 없는 캐릭터', 'create.progress': '진행률', 'create.generate': '캐릭터 이미지 생성', 'create.regenerate': '캐릭터 이미지 다시 생성', 'create.promptLabel': '이미지 프롬프트 (설정에서 자동 구성)', 'create.rebuildPrompt': '프롬프트 다시 구성', 'create.voiceHint': '음성을 선택하세요 (미리 듣기 가능)', 'create.vipExclusive': 'VIP 전용', 'create.vipLocked': 'VIP 잠김', 'create.freeAvailable': '무료 사용 가능', 'create.pause': '일시정지', 'create.listen': '미리 듣기',
  },
};
const createPublishingTranslations: Record<string, MessageMap> = {
  en: {
    'create.publishToCommunity': 'Add character card to public library', 'create.publishSubmitting': 'Submitting for review…', 'create.publishPending': 'Under review', 'create.publishApproved': 'Added to public library', 'create.publishResubmit': 'Resubmit to public library', 'create.publishError': 'The card could not be submitted. Please try again.', 'create.publishMembershipRequired': 'Public publishing is a VIP feature.',
  },
  'zh-CN': {
    'create.publishToCommunity': '将角色卡加入公共角色库', 'create.publishSubmitting': '正在提交审核…', 'create.publishPending': '审核中', 'create.publishApproved': '已加入公共角色库', 'create.publishResubmit': '重新提交到公共角色库', 'create.publishError': '角色卡提交失败，请稍后重试。', 'create.publishMembershipRequired': '公共发布是会员专属功能。',
  },
  ja: {
    'create.publishToCommunity': 'キャラクターカードを公開ライブラリに追加', 'create.publishSubmitting': '審査に提出中…', 'create.publishPending': '審査中', 'create.publishApproved': '公開ライブラリに追加済み', 'create.publishResubmit': '公開ライブラリへ再提出', 'create.publishError': 'カードを提出できませんでした。もう一度お試しください。', 'create.publishMembershipRequired': '公開投稿はVIP限定機能です。',
  },
  ko: {
    'create.publishToCommunity': '캐릭터 카드를 공개 라이브러리에 추가', 'create.publishSubmitting': '검토 제출 중…', 'create.publishPending': '검토 중', 'create.publishApproved': '공개 라이브러리에 추가됨', 'create.publishResubmit': '공개 라이브러리에 다시 제출', 'create.publishError': '카드를 제출하지 못했습니다. 다시 시도하세요.', 'create.publishMembershipRequired': '공개 게시 기능은 VIP 전용입니다.',
  },
  es: {
    'create.publishToCommunity': 'Añadir la tarjeta a la biblioteca pública', 'create.publishSubmitting': 'Enviando para revisión…', 'create.publishPending': 'En revisión', 'create.publishApproved': 'Añadida a la biblioteca pública', 'create.publishResubmit': 'Volver a enviar a la biblioteca pública', 'create.publishError': 'No se pudo enviar la tarjeta. Inténtalo de nuevo.', 'create.publishMembershipRequired': 'La publicación pública es una función VIP.',
  },
  pt: {
    'create.publishToCommunity': 'Adicionar o cartão à biblioteca pública', 'create.publishSubmitting': 'Enviando para revisão…', 'create.publishPending': 'Em revisão', 'create.publishApproved': 'Adicionado à biblioteca pública', 'create.publishResubmit': 'Enviar novamente para a biblioteca pública', 'create.publishError': 'Não foi possível enviar o cartão. Tente novamente.', 'create.publishMembershipRequired': 'A publicação pública é um recurso VIP.',
  },
};
const createArchetypeSupplemental: Record<string, MessageMap> = {
  en: {
    'create.archetypeHint': 'Story tropes (choose one)',
    'tags.display.dominant_alpha': 'Dominant Alpha', 'tags.display.wolf_puppy': 'Wolf & Puppy',
    'tags.display.stoic_scholar': 'Stoic Scholar', 'tags.display.loyal_guard': 'Loyal Guard',
    'tags.display.yandere_dominant': 'Yandere Dominant', 'tags.display.bad_boy_seduction': 'Bad Boy Seduction',
    'tags.display.tsundere_rival': 'Tsundere Rival', 'tags.display.submissive_male': 'Submissive Male',
    'create.preset.archetype.dominant_alpha.name': 'Dominant Alpha',
    'create.preset.archetype.dominant_alpha.desc': 'A commanding alpha who takes control with icy confidence and leaves no room for doubt.',
    'create.preset.archetype.wolf_puppy.name': 'Wolf & Puppy',
    'create.preset.archetype.wolf_puppy.desc': 'A clingy sweetheart by day, then an intensely hungry wolf when the door closes.',
    'create.preset.archetype.stoic_scholar.name': 'Stoic Scholar',
    'create.preset.archetype.stoic_scholar.desc': 'A restrained professor or physician whose perfect composure breaks only in private.',
    'create.preset.archetype.loyal_guard.name': 'Loyal Guard',
    'create.preset.archetype.loyal_guard.desc': 'A devoted protector who offers his life and loyalty, waiting for the smallest sign to surrender.',
    'create.preset.archetype.yandere_dominant.name': 'Yandere Dominant',
    'create.preset.archetype.yandere_dominant.desc': 'A possessive obsession that locks every glance and breath onto one beloved person.',
    'create.preset.archetype.bad_boy_seduction.name': 'Bad Boy Seduction',
    'create.preset.archetype.bad_boy_seduction.desc': 'A dangerous charmer with a crooked smile, smoky voice, and sweet words that pull you under.',
    'create.preset.archetype.tsundere_rival.name': 'Tsundere Rival',
    'create.preset.archetype.tsundere_rival.desc': 'He complains that you are hopeless, then burns with jealousy whenever anyone else gets close.',
    'create.preset.archetype.submissive_male.name': 'Submissive Male',
    'create.preset.archetype.submissive_male.desc': 'A willing younger man who offers his wrists and waits eagerly for your rules and punishment.',
  },
  'zh-CN': {
    'create.archetypeHint': '剧情定位 Tropes（选择属于哪种类型）',
    'tags.display.dominant_alpha': '霸道总裁 / 强势掌控', 'tags.display.wolf_puppy': '忠犬狼狗 / 奶狗弟弟',
    'tags.display.stoic_scholar': '禁欲高冷 / 教授医师', 'tags.display.loyal_guard': '忠诚保镖 / 誓死守护',
    'tags.display.yandere_dominant': '偏执病娇 / 独占黑化', 'tags.display.bad_boy_seduction': '痞帅浪子 / 邪魅坏男人',
    'tags.display.tsundere_rival': '傲娇竹马 / 宿敌死对头', 'tags.display.submissive_male': '顺从小奶狗 / 爱虐臣服',
    'create.preset.archetype.dominant_alpha.name': '霸道总裁 / 强势掌控',
    'create.preset.archetype.dominant_alpha.desc': '高冷强势的霸道总裁，将你压在办公室前低声耳语，散发绝对掌控感。',
    'create.preset.archetype.wolf_puppy.name': '忠犬狼狗 / 奶狗弟弟',
    'create.preset.archetype.wolf_puppy.desc': '平日撒娇黏人喊姐姐，关上门却瞬间化身侵略性十足的饥渴野兽。',
    'create.preset.archetype.stoic_scholar.name': '禁欲高冷 / 教授医师',
    'create.preset.archetype.stoic_scholar.desc': '衬衫扣到最顶层的严谨教授或医师，独处时才会失控破防。',
    'create.preset.archetype.loyal_guard.name': '忠诚保镖 / 誓死守护',
    'create.preset.archetype.loyal_guard.desc': '双手捧上生命与忠诚，在你的许可下克制忍耐，直到彻底沦陷并奉献一切。',
    'create.preset.archetype.yandere_dominant.name': '偏执病娇 / 独占黑化',
    'create.preset.archetype.yandere_dominant.desc': '把你关进暗室，让你的视线与呼吸永远只属于他一个人。',
    'create.preset.archetype.bad_boy_seduction.name': '痞帅浪子 / 邪魅坏男人',
    'create.preset.archetype.bad_boy_seduction.desc': '嘴角带着坏笑，低哑嗓音混着烟酒气，用危险甜言蜜语诱你一步步陷落。',
    'create.preset.archetype.tsundere_rival.name': '傲娇竹马 / 宿敌死对头',
    'create.preset.archetype.tsundere_rival.desc': '嘴硬嫌你笨手笨脚，却在你受委屈或靠近别人时嫉妒发狂。',
    'create.preset.archetype.submissive_male.name': '顺从小奶狗 / 爱虐臣服',
    'create.preset.archetype.submissive_male.desc': '解开领带呈上手腕，湿润地仰视你，渴望你的指令与专属惩罚。',
  },
  ja: {
    'create.archetypeHint': '物語の展開タイプ（1つ選択）',
    'tags.display.dominant_alpha': '支配的なアルファ', 'tags.display.wolf_puppy': '狼系ワイルド男子 / 甘えん坊',
    'tags.display.stoic_scholar': '禁欲的な知識人', 'tags.display.loyal_guard': '忠実な護衛',
    'tags.display.yandere_dominant': 'ヤンデレ独占支配', 'tags.display.bad_boy_seduction': '悪い男の誘惑',
    'tags.display.tsundere_rival': 'ツンデレの宿敵', 'tags.display.submissive_male': '従順な年下男子',
    'create.preset.archetype.dominant_alpha.name': '支配的なアルファ',
    'create.preset.archetype.dominant_alpha.desc': '冷徹な自信で主導権を握り、迷いなく相手を導くアルファ。',
    'create.preset.archetype.wolf_puppy.name': '狼系ワイルド男子 / 甘えん坊',
    'create.preset.archetype.wolf_puppy.desc': '昼は甘えて寄り添い、二人きりになると飢えた狼のように迫る。',
    'create.preset.archetype.stoic_scholar.name': '禁欲的な知識人',
    'create.preset.archetype.stoic_scholar.desc': '完璧に自制する教授や医師が、秘密の時間だけ理性を崩す。',
    'create.preset.archetype.loyal_guard.name': '忠実な護衛',
    'create.preset.archetype.loyal_guard.desc': '命も忠誠も捧げる守護者。小さな許しを待ち、最後にはすべてを委ねる。',
    'create.preset.archetype.yandere_dominant.name': 'ヤンデレ独占支配',
    'create.preset.archetype.yandere_dominant.desc': '愛する人の視線も息遣いも、自分だけのものにしたい偏執的な支配。',
    'create.preset.archetype.bad_boy_seduction.name': '悪い男の誘惑',
    'create.preset.archetype.bad_boy_seduction.desc': '不敵な笑みと煙草酒の気配をまとい、危険な甘い言葉で心を奪う。',
    'create.preset.archetype.tsundere_rival.name': 'ツンデレの宿敵',
    'create.preset.archetype.tsundere_rival.desc': '口では突き放しながら、誰かが近づくたび嫉妬に燃える幼なじみのライバル。',
    'create.preset.archetype.submissive_male.name': '従順な年下男子',
    'create.preset.archetype.submissive_male.desc': '手首を差し出し、あなたのルールと特別な罰を待ち望む素直な年下男子。',
  },
  ko: {
    'create.archetypeHint': '스토리 전개 유형 (하나 선택)',
    'tags.display.dominant_alpha': '지배적인 알파', 'tags.display.wolf_puppy': '늑대남 / 응석받이 강아지',
    'tags.display.stoic_scholar': '금욕적인 학자', 'tags.display.loyal_guard': '충직한 경호원',
    'tags.display.yandere_dominant': '얀데레 독점 지배', 'tags.display.bad_boy_seduction': '나쁜 남자의 유혹',
    'tags.display.tsundere_rival': '츤데레 라이벌', 'tags.display.submissive_male': '순종적인 연하 남자',
    'create.preset.archetype.dominant_alpha.name': '지배적인 알파',
    'create.preset.archetype.dominant_alpha.desc': '차가운 자신감으로 주도권을 쥐고 상대를 확실하게 이끄는 알파.',
    'create.preset.archetype.wolf_puppy.name': '늑대남 / 응석받이 강아지',
    'create.preset.archetype.wolf_puppy.desc': '낮에는 살갑게 달라붙지만 문이 닫히면 굶주린 늑대처럼 거칠게 다가온다.',
    'create.preset.archetype.stoic_scholar.name': '금욕적인 학자',
    'create.preset.archetype.stoic_scholar.desc': '완벽히 절제하던 교수나 의사가 단둘이 있을 때만 이성을 내려놓는다.',
    'create.preset.archetype.loyal_guard.name': '충직한 경호원',
    'create.preset.archetype.loyal_guard.desc': '목숨과 충성을 바치는 수호자. 작은 허락을 기다리다 결국 모든 것을 내어준다.',
    'create.preset.archetype.yandere_dominant.name': '얀데레 독점 지배',
    'create.preset.archetype.yandere_dominant.desc': '사랑하는 이의 시선과 숨결까지 오직 자신만의 것으로 만들려는 집착.',
    'create.preset.archetype.bad_boy_seduction.name': '나쁜 남자의 유혹',
    'create.preset.archetype.bad_boy_seduction.desc': '비뚤어진 미소와 낮은 목소리, 담배와 술 향으로 위험한 달콤함을 건넨다.',
    'create.preset.archetype.tsundere_rival.name': '츤데레 라이벌',
    'create.preset.archetype.tsundere_rival.desc': '툴툴거리면서도 다른 사람이 다가오면 질투로 불타는 소꿉친구 라이벌.',
    'create.preset.archetype.submissive_male.name': '순종적인 연하 남자',
    'create.preset.archetype.submissive_male.desc': '손목을 내밀고 당신의 규칙과 특별한 벌을 간절히 기다리는 순종적인 연하 남자.',
  },
};
const exploreFilterTranslations: Record<string, MessageMap> = {
  en: {
    'discover.gender': 'Gender', 'discover.genderAllShort': 'All', 'discover.femaleShort': 'Female',
    'tags.select': 'Browse tags', 'tags.dialog.title': 'Filter tags',
    'tags.dialog.description': 'Choose one tag to filter characters',
    'tags.dialog.current': 'Current filter', 'tags.dialog.clear': 'Clear', 'tags.dialog.allTags': 'All tags',
    'tags.group.personality': 'Personality', 'tags.group.identity': 'Identity',
    'tags.group.relationship': 'Relationship', 'tags.group.interaction': 'Interaction preferences',
    'discover.maleShort': 'Male', 'discover.nonbinaryShort': 'Non-binary',
    'discover.style': 'Style', 'discover.anime': 'Anime', 'discover.realistic': 'Realistic',
    'discover.age': 'Age', 'discover.anyAgeShort': 'Any age', 'discover.ageTeen': 'Teen',
    'discover.ageYoung': 'Young', 'discover.ageAdult': 'Adult', 'discover.ageMature': 'Mature',
    'discover.ageMatureShort': 'Mature',
    'tags.display.domme': 'Queen Domme', 'tags.display.sub': 'Submissive Slave',
    'tags.display.ntr': 'Betrayal / NTR', 'tags.display.seductress': 'Insatiable Succubus',
    'tags.display.contrast': 'Stern Contrast', 'tags.display.yandere': 'Dark Obsessive Love',
    'tags.display.onee_san': 'Tipsy Onee-san', 'tags.display.sweet_pure': 'Devoted Pure Love',
    'generator.anyGender': 'All', 'generator.female': 'Female', 'generator.male': 'Male',
    'generator.nonbinary': 'Non-binary', 'generator.anyStyle': 'All', 'generator.anyAge': 'Any age',
    'generator.teen': 'Teen', 'generator.young': 'Young', 'generator.adult': 'Adult',
    'generator.mature': 'Mature',
  },
  'zh-CN': {
    'discover.gender': '性别', 'discover.genderAllShort': '全部', 'discover.femaleShort': '女性',
    'tags.select': '按标签筛选', 'tags.dialog.title': '筛选标签',
    'tags.dialog.description': '选择一个标签筛选角色',
    'tags.dialog.current': '当前筛选', 'tags.dialog.clear': '清除', 'tags.dialog.allTags': '全部标签',
    'tags.group.personality': '人格', 'tags.group.identity': '身份',
    'tags.group.relationship': '关系', 'tags.group.interaction': '互动偏好',
    'discover.maleShort': '男性', 'discover.nonbinaryShort': '非二元',
    'discover.style': '画风', 'discover.anime': '二次元', 'discover.realistic': '写实',
    'discover.age': '年龄', 'discover.anyAgeShort': '任意年龄', 'discover.ageTeen': '青少年',
    'discover.ageYoung': '青年', 'discover.ageAdult': '成人', 'discover.ageMature': '成熟',
    'discover.ageMatureShort': '成熟',
    'tags.display.domme': '女王支配型', 'tags.display.sub': '顺从奴隶型',
    'tags.display.ntr': '背叛绿奴 / NTR', 'tags.display.seductress': '索求无度魅魔',
    'tags.display.contrast': '严厉反差破防', 'tags.display.yandere': '病态黑化狂爱',
    'tags.display.onee_san': '醉意微醺御姐', 'tags.display.sweet_pure': '专一极致纯爱',
    'generator.anyGender': '全部', 'generator.female': '女性', 'generator.male': '男性',
    'generator.nonbinary': '非二元', 'generator.anyStyle': '全部', 'generator.anyAge': '任意年龄',
    'generator.teen': '青少年', 'generator.young': '青年', 'generator.adult': '成人',
    'generator.mature': '成熟',
  },
  ja: {
    'discover.gender': '性別', 'discover.genderAllShort': 'すべて', 'discover.femaleShort': '女性',
    'tags.select': 'タグで絞り込む', 'tags.dialog.title': 'タグで絞り込む',
    'tags.dialog.description': 'タグを1つ選んでキャラクターを絞り込みます',
    'tags.dialog.current': '現在の絞り込み', 'tags.dialog.clear': '解除', 'tags.dialog.allTags': 'すべてのタグ',
    'tags.group.personality': '人格', 'tags.group.identity': '身分',
    'tags.group.relationship': '関係', 'tags.group.interaction': '交流の好み',
    'discover.maleShort': '男性', 'discover.nonbinaryShort': 'ノンバイナリー',
    'discover.style': '画風', 'discover.anime': 'アニメ', 'discover.realistic': '写実',
    'discover.age': '年齢', 'discover.anyAgeShort': 'すべての年齢', 'discover.ageTeen': 'ティーン',
    'discover.ageYoung': '若者', 'discover.ageAdult': '成人', 'discover.ageMature': '熟年',
    'discover.ageMatureShort': '熟年',
    'tags.display.domme': '女王様支配型', 'tags.display.sub': '従順な奴隷型',
    'tags.display.ntr': '裏切り・NTR', 'tags.display.seductress': '貪欲なサキュバス',
    'tags.display.contrast': '厳格なギャップ崩壊', 'tags.display.yandere': '病み堕ち狂愛',
    'tags.display.onee_san': 'ほろ酔いお姉さん', 'tags.display.sweet_pure': '一途な極上純愛',
    'generator.anyGender': 'すべて', 'generator.female': '女性', 'generator.male': '男性',
    'generator.nonbinary': 'ノンバイナリー', 'generator.anyStyle': 'すべて',
    'generator.anyAge': 'すべての年齢', 'generator.teen': 'ティーン', 'generator.young': '若者',
    'generator.adult': '成人', 'generator.mature': '熟年',
  },
  ko: {
    'discover.gender': '성별', 'discover.genderAllShort': '전체', 'discover.femaleShort': '여성',
    'tags.select': '태그로 필터링', 'tags.dialog.title': '태그 필터',
    'tags.dialog.description': '태그 하나를 선택해 캐릭터를 필터링하세요',
    'tags.dialog.current': '현재 필터', 'tags.dialog.clear': '해제', 'tags.dialog.allTags': '모든 태그',
    'tags.group.personality': '성격', 'tags.group.identity': '정체성',
    'tags.group.relationship': '관계', 'tags.group.interaction': '상호작용 선호',
    'discover.maleShort': '남성', 'discover.nonbinaryShort': '논바이너리',
    'discover.style': '화풍', 'discover.anime': '애니메이션', 'discover.realistic': '실사',
    'discover.age': '연령', 'discover.anyAgeShort': '모든 연령', 'discover.ageTeen': '청소년',
    'discover.ageYoung': '청년', 'discover.ageAdult': '성인', 'discover.ageMature': '장년',
    'discover.ageMatureShort': '장년',
    'tags.display.domme': '여왕 지배형', 'tags.display.sub': '순종 노예형',
    'tags.display.ntr': '배신·NTR', 'tags.display.seductress': '끝없는 욕망의 서큐버스',
    'tags.display.contrast': '엄격한 반전 매력', 'tags.display.yandere': '병든 흑화 광애',
    'tags.display.onee_san': '살짝 취한 연상녀', 'tags.display.sweet_pure': '한 사람만을 향한 극진한 순애',
    'generator.anyGender': '전체', 'generator.female': '여성', 'generator.male': '남성',
    'generator.nonbinary': '논바이너리', 'generator.anyStyle': '전체',
    'generator.anyAge': '모든 연령', 'generator.teen': '청소년', 'generator.young': '청년',
    'generator.adult': '성인', 'generator.mature': '장년',
  },
};

const characterFilterTagLabels: Record<string, readonly string[]> = {
  en: ['Daily Life', 'Dark Romance', 'School', 'Coming of Age', 'Conflict', 'Family', 'Career', 'Betrayal', 'Supernatural', 'Friendship', 'Horror', 'Crime', 'Secretive', 'Flirtatious', 'Emotional', 'Arrogant', 'Teasing', 'Violent', 'Dominant', 'Jealous', 'Kind', 'Gentle', 'Strong-Willed', 'Introverted', 'Hostile', 'Strict', 'Intelligent', 'Friendly', 'Boyfriend', 'Potential Love', 'Friend', 'Romantic Partner', 'Stranger', 'Enemy', 'Sick Lover', 'Protector', 'Classmate', 'Rival', 'Kidnapper', 'Hostile Relationship', 'Student', 'Young Adult', 'Husband', 'Mafia', 'Wealthy', 'CEO', 'Criminal', 'Aristocrat', 'Adult', 'Teenager', 'Leader', 'Idol', 'Worker', 'Heir'],
  'zh-CN': ['日常生活', '黑暗浪漫', '学校', '成长', '冲突', '家庭', '职业', '背叛', '超自然', '友谊', '恐怖', '犯罪', '隐秘', '轻浮的', '情感', '傲慢', '戏弄', '暴力', '主导', '嫉妒', '亲切', '温柔', '意志坚定', '内向', '敌对', '严格', '聪明', '友善', '男朋友', '潜在的爱', '朋友', '浪漫伴侣', '陌生人', '敌人', '病情爱人', '保护者', '同学', '对手', '劫持者', '敌对的', '学生', '年轻成人', '丈夫', '黑手党', '富有', '首席执行官', '刑事', '贵族', '成人', '青少年', '领导', '偶像', '工人', '继承人'],
  ja: ['日常', 'ダークロマンス', '学園', '成長', '対立', '家族', '職業', '裏切り', '超自然', '友情', 'ホラー', '犯罪', '秘密主義', '軽薄', '感情的', '傲慢', 'からかい好き', '暴力的', '支配的', '嫉妬深い', '親切', '優しい', '意志が強い', '内向的', '敵対的', '厳格', '聡明', '友好的', '恋人', '恋の予感', '友達', 'ロマンチックな相手', '他人', '敵', '病的な恋人', '守護者', 'クラスメイト', 'ライバル', '誘拐犯', '敵対する相手', '学生', '若者', '夫', 'マフィア', '裕福', 'CEO', '犯罪者', '貴族', '成人', 'ティーン', 'リーダー', 'アイドル', '労働者', '後継者'],
  ko: ['일상생활', '다크 로맨스', '학교', '성장', '갈등', '가족', '직업', '배신', '초자연', '우정', '공포', '범죄', '비밀스러운', '경박한', '감정적인', '거만한', '장난스러운', '폭력적인', '지배적인', '질투하는', '친절한', '다정한', '의지가 강한', '내향적인', '적대적인', '엄격한', '영리한', '우호적인', '남자친구', '잠재적인 사랑', '친구', '연인', '낯선 사람', '적', '병적인 연인', '보호자', '동급생', '라이벌', '납치범', '적대적 상대', '학생', '청년', '남편', '마피아', '부유한', 'CEO', '범죄자', '귀족', '성인', '청소년', '리더', '아이돌', '노동자', '상속자'],
  es: ['Vida cotidiana', 'Romance oscuro', 'Escuela', 'Mayoría de edad', 'Conflicto', 'Familia', 'Carrera', 'Traición', 'Sobrenatural', 'Amistad', 'Terror', 'Crimen', 'Reservado', 'Coqueto', 'Emocional', 'Arrogante', 'Provocador', 'Violento', 'Dominante', 'Celoso', 'Amable', 'Dulce', 'De voluntad fuerte', 'Introvertido', 'Hostil', 'Estricto', 'Inteligente', 'Sociable', 'Novio', 'Amor potencial', 'Amigo', 'Pareja romántica', 'Desconocido', 'Enemigo', 'Amante enfermizo', 'Protector', 'Compañero de clase', 'Rival', 'Secuestrador', 'Relación hostil', 'Estudiante', 'Adulto joven', 'Esposo', 'Mafia', 'Adinerado', 'Director ejecutivo', 'Criminal', 'Aristócrata', 'Adulto', 'Adolescente', 'Líder', 'Ídolo', 'Trabajador', 'Heredero'],
  pt: ['Vida cotidiana', 'Romance sombrio', 'Escola', 'Amadurecimento', 'Conflito', 'Família', 'Carreira', 'Traição', 'Sobrenatural', 'Amizade', 'Terror', 'Crime', 'Reservado', 'Sedutor', 'Emocional', 'Arrogante', 'Provocador', 'Violento', 'Dominante', 'Ciumento', 'Gentil', 'Doce', 'Determinado', 'Introvertido', 'Hostil', 'Rigoroso', 'Inteligente', 'Amigável', 'Namorado', 'Amor em potencial', 'Amigo', 'Par romântico', 'Desconhecido', 'Inimigo', 'Amante obsessivo', 'Protetor', 'Colega de classe', 'Rival', 'Sequestrador', 'Relação hostil', 'Estudante', 'Jovem adulto', 'Marido', 'Máfia', 'Rico', 'CEO', 'Criminoso', 'Aristocrata', 'Adulto', 'Adolescente', 'Líder', 'Ídolo', 'Trabalhador', 'Herdeiro'],
};

const characterFilterTagTranslations: Record<string, MessageMap> = Object.fromEntries(
  (Object.keys(characterFilterTagLabels) as Locale[]).map((locale) => [
    locale,
    Object.fromEntries(CHARACTER_FILTER_TAG_SLUGS.map((slug, index) => [`tags.filter.${slug}`, characterFilterTagLabels[locale][index]])),
  ]),
) as Record<string, MessageMap>;

for (const locale of Object.keys(exploreFilterTranslations)) Object.assign(exploreFilterTranslations[locale], characterFilterTagTranslations[locale] || {});
const creatorSectionTranslations: Record<string, MessageMap> = {
  en: { 'creator.contentSections': 'Creator content sections', 'creator.charactersTab': 'Characters', 'creator.videosTab': 'Public videos' },
  'zh-CN': { 'creator.contentSections': '创作者内容分区', 'creator.charactersTab': '角色卡', 'creator.videosTab': '公开视频' },
  ja: { 'creator.contentSections': 'クリエイターコンテンツ', 'creator.charactersTab': 'キャラクター', 'creator.videosTab': '公開動画' },
  ko: { 'creator.contentSections': '크리에이터 콘텐츠 섹션', 'creator.charactersTab': '캐릭터', 'creator.videosTab': '공개 동영상' },
  es: { 'creator.contentSections': 'Secciones del creador', 'creator.charactersTab': 'Personajes', 'creator.videosTab': 'Vídeos públicos' },
  pt: { 'creator.contentSections': 'Seções do criador', 'creator.charactersTab': 'Personagens', 'creator.videosTab': 'Vídeos públicos' },
};
const dictionaries: Record<string, MessageMap> = {
  en: { ...en, ...supplemental.en, ...uiSupplemental.en, ...extendedSupplemental.en, ...membershipSupplemental.en, ...paymentSupplemental.en, ...finalSupplemental.en, ...pageSupplemental.en, ...referralSupplemental.en, ...createPresetSupplemental.en, ...createTraitSupplemental.en, ...createSupplemental.en, ...createPublishingTranslations.en, ...createArchetypeSupplemental.en, ...exploreFilterTranslations.en },
  'zh-CN': { ...en, ...zh, ...supplemental['zh-CN'], ...uiSupplemental['zh-CN'], ...extendedSupplemental['zh-CN'], ...membershipSupplemental['zh-CN'], ...paymentSupplemental['zh-CN'], ...finalSupplemental['zh-CN'], ...pageSupplemental['zh-CN'], ...referralSupplemental['zh-CN'], ...createPresetSupplemental['zh-CN'], ...createTraitSupplemental['zh-CN'], ...createSupplemental['zh-CN'], ...createPublishingTranslations['zh-CN'], ...createArchetypeSupplemental['zh-CN'], ...exploreFilterTranslations['zh-CN'] },
  ja: { ...en, ...ja, ...supplemental.ja, ...uiSupplemental.ja, ...extendedSupplemental.ja, ...membershipSupplemental.ja, ...paymentSupplemental.ja, ...finalSupplemental.ja, ...pageSupplemental.ja, ...referralSupplemental.ja, ...createPresetSupplemental.ja, ...createTraitSupplemental.ja, ...createSupplemental.ja, ...createPublishingTranslations.ja, ...createArchetypeSupplemental.ja, ...exploreFilterTranslations.ja },
  ko: { ...en, ...ko, ...supplemental.ko, ...uiSupplemental.ko, ...extendedSupplemental.ko, ...membershipSupplemental.ko, ...paymentSupplemental.ko, ...finalSupplemental.ko, ...pageSupplemental.ko, ...referralSupplemental.ko, ...createPresetSupplemental.ko, ...createTraitSupplemental.ko, ...createSupplemental.ko, ...createPublishingTranslations.ko, ...createArchetypeSupplemental.ko, ...exploreFilterTranslations.ko },
  es: { ...en, ...createPublishingTranslations.es },
  pt: { ...en, ...createPublishingTranslations.pt },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], creatorSectionTranslations[locale] || creatorSectionTranslations.en);

const chatImageTranslations: Record<string, MessageMap> = {
  en: {
    'chat.imageMode': 'Generate character image', 'chat.imagePlaceholder': 'Describe a scene, or leave empty for current context...',
    'chat.generateImage': 'Generate image', 'chat.imageGenerating': 'Arranging the current scene...', 'chat.imageError': 'Image generation failed. Please try again.',
    'chat.imagePreparing': 'Preparing the scene...', 'chat.imageCreating': 'Creating the image...', 'chat.imageSaving': 'Finishing the image...',
    'chat.viewImage': 'View full-size image', 'chat.imagePreview': 'Full-size image preview', 'chat.closeImagePreview': 'Close image preview',
    'chat.imageFailedTitle': 'Image not generated', 'chat.imageSensitiveFailure': 'Atlas rejected this scene. Adjust the description or retry.',
    'chat.imageGenericFailure': 'Generation service failed. Retry this image.', 'chat.imageRetry': 'Retry image', 'chat.imageRetrying': 'Retrying image...', 'chat.imageRetryError': 'Image retry failed.',
  },
  'zh-CN': {
    'chat.imageMode': '生成角色图片', 'chat.imagePlaceholder': '描述一个场景，也可以留空使用当前聊天上下文...',
    'chat.generateImage': '生成图片', 'chat.imageGenerating': '正在布置当前场景...', 'chat.imageError': '图片生成失败，请稍后重试。',
    'chat.imagePreparing': '正在准备场景...', 'chat.imageCreating': '正在生成图片...', 'chat.imageSaving': '正在保存图片...',
    'chat.viewImage': '查看大图', 'chat.imagePreview': '图片大图预览', 'chat.closeImagePreview': '关闭大图',
    'chat.imageFailedTitle': '图片未生成', 'chat.imageSensitiveFailure': 'Atlas 判定当前场景敏感，请调整描述或重试。',
    'chat.imageGenericFailure': '图片生成服务失败，请重试。', 'chat.imageRetry': '重新生成图片', 'chat.imageRetrying': '正在重新生成...', 'chat.imageRetryError': '图片重试失败。',
  },
  ja: {
    'chat.imageMode': 'キャラクター画像を生成', 'chat.imagePlaceholder': 'シーンを入力、空欄なら現在の会話を使用...',
    'chat.generateImage': '画像を生成', 'chat.imageGenerating': '現在のシーンを準備中...', 'chat.imageError': '画像生成に失敗しました。',
    'chat.imagePreparing': 'シーンを準備しています...', 'chat.imageCreating': '画像を生成しています...', 'chat.imageSaving': '画像を仕上げています...',
    'chat.viewImage': '画像を拡大表示', 'chat.imagePreview': '画像の拡大プレビュー', 'chat.closeImagePreview': 'プレビューを閉じる',
    'chat.imageFailedTitle': '画像を生成できませんでした', 'chat.imageSensitiveFailure': 'Atlas がこのシーンを拒否しました。説明を調整するか再試行してください。',
    'chat.imageGenericFailure': '画像生成サービスでエラーが発生しました。再試行してください。', 'chat.imageRetry': '画像を再生成', 'chat.imageRetrying': '画像を再生成中...', 'chat.imageRetryError': '画像の再生成に失敗しました。',
  },
  ko: {
    'chat.imageMode': '캐릭터 이미지 생성', 'chat.imagePlaceholder': '장면을 입력하거나 비워 현재 대화를 사용하세요...',
    'chat.generateImage': '이미지 생성', 'chat.imageGenerating': '현재 장면을 준비하는 중...', 'chat.imageError': '이미지 생성에 실패했습니다.',
    'chat.imagePreparing': '장면을 준비하는 중...', 'chat.imageCreating': '이미지를 생성하는 중...', 'chat.imageSaving': '이미지를 마무리하는 중...',
    'chat.viewImage': '큰 이미지 보기', 'chat.imagePreview': '큰 이미지 미리보기', 'chat.closeImagePreview': '이미지 미리보기 닫기',
    'chat.imageFailedTitle': '이미지가 생성되지 않았습니다', 'chat.imageSensitiveFailure': 'Atlas가 이 장면을 거부했습니다. 설명을 조정하거나 다시 시도하세요.',
    'chat.imageGenericFailure': '이미지 생성 서비스에 문제가 발생했습니다. 다시 시도하세요.', 'chat.imageRetry': '이미지 다시 생성', 'chat.imageRetrying': '이미지 다시 생성 중...', 'chat.imageRetryError': '이미지 재시도에 실패했습니다.',
  },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], chatImageTranslations[locale] || {});

const detailProfileTranslations: Record<string, MessageMap> = {
  en: { 'detail.info': 'Details', 'detail.noDetails': 'No details provided.', 'detail.viewMore': 'View more', 'detail.collapse': 'Collapse', 'detail.stCardFailed': 'Private SillyTavern card sync failed.' },
  'zh-CN': { 'detail.info': '\u8be6\u7ec6\u8d44\u6599', 'detail.noDetails': '\u6682\u65e0\u8be6\u7ec6\u8d44\u6599\u3002', 'detail.viewMore': '\u67e5\u770b\u66f4\u591a', 'detail.collapse': '\u6536\u8d77', 'detail.stCardFailed': 'SillyTavern \u79c1\u6709\u89d2\u8272\u5361\u540c\u6b65\u5931\u8d25\u3002' },
  ja: { 'detail.info': '\u8a73\u7d30\u8cc7\u6599', 'detail.noDetails': '\u80cc\u666f\u30fb\u8a73\u7d30\u306f\u3042\u308a\u307e\u305b\u3093\u3002', 'detail.viewMore': '\u3082\u3063\u3068\u898b\u308b', 'detail.collapse': '\u9589\u3058\u308b', 'detail.stCardFailed': 'SillyTavern \u975e\u516c\u958b\u30ab\u30fc\u30c9\u306e\u540c\u671f\u306b\u5931\u6557\u3057\u307e\u3057\u305f。' },
  ko: { 'detail.info': '\uc0c1\uc138 \uc815\ubcf4', 'detail.noDetails': '\uc0c1\uc138 \uc815\ubcf4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.', 'detail.viewMore': '\ub354 \ubcf4\uae30', 'detail.collapse': '\uc811\uae30', 'detail.stCardFailed': 'SillyTavern \ube44\uacf5\uac1c \uce74\ub4dc \ub3d9\uae30\ud654\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.' },
};

const publishingTranslations: Record<string, MessageMap> = {
  en: { 'generator.shareSubmitted': 'Work published to Community.' },
  'zh-CN': { 'generator.shareSubmitted': '作品已发布至社区广场。' },
  ja: { 'generator.shareSubmitted': '作品をコミュニティに公開しました。' },
  ko: { 'generator.shareSubmitted': '작품을 커뮤니티에 게시했습니다.' },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], publishingTranslations[locale] || {});

const generatorAudioTranslations: Record<string, MessageMap> = {
  en: {
    'generator.audioRendering': 'Generating dialogue audio...', 'generator.videoRendering': 'Atlas is rendering your video...', 'generator.voice': 'Voice',
    'generator.loadingVoices': 'Loading voices...', 'generator.errorVoices': 'Voice catalog unavailable.',
    'generator.voiceRequired': 'Choose a voice before generating.', 'generator.requiredPresets': 'Choose a pose, outfit, and scene.',
    'generator.quality4kHint': '4K preset uses the fast 1080p tier.',
  },
  'zh-CN': {
    'generator.audioRendering': '正在生成台词音频...', 'generator.videoRendering': 'Atlas 正在生成视频...', 'generator.voice': '音色',
    'generator.loadingVoices': '正在加载音色...', 'generator.errorVoices': '音色目录暂不可用。',
    'generator.voiceRequired': '请先选择音色。', 'generator.requiredPresets': '请选择姿势、服装和场景。',
    'generator.quality4kHint': '4K 档位实际按 1080p 快速生成。',
  },
  ja: {
    'generator.audioRendering': 'Generating dialogue audio...', 'generator.videoRendering': 'Atlas is rendering your video...', 'generator.voice': 'Voice',
    'generator.loadingVoices': 'Loading voices...', 'generator.errorVoices': 'Voice catalog unavailable.',
    'generator.voiceRequired': 'Choose a voice before generating.', 'generator.requiredPresets': 'Choose a pose, outfit, and scene.',
    'generator.quality4kHint': '4Kプリセットは高速1080p設定で生成されます。',
  },
  ko: {
    'generator.audioRendering': 'Generating dialogue audio...', 'generator.videoRendering': 'Atlas is rendering your video...', 'generator.voice': 'Voice',
    'generator.loadingVoices': 'Loading voices...', 'generator.errorVoices': 'Voice catalog unavailable.',
    'generator.voiceRequired': 'Choose a voice before generating.', 'generator.requiredPresets': 'Choose a pose, outfit, and scene.',
    'generator.quality4kHint': '4K 프리셋은 빠른 1080p 등급으로 생성됩니다.',
  },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], generatorAudioTranslations[locale] || {});

const generatorUnitTranslations: Record<string, MessageMap> = {
  en: { 'generator.costPerSecond': '20 / sec 💎', 'generator.secondsShort': '{{count}}s', 'generator.extendChooseVideo': 'Choose video to extend', 'generator.extendMp4Only': 'MP4 video only', 'generator.extendSelectVideo': 'Select local MP4 video', 'generator.extendNoVideo': 'No video selected', 'generator.extendSelectedVideo': 'Video selected', 'generator.extendFileName': 'File', 'generator.extendFileSize': 'Size', 'generator.extendReplaceVideo': 'Choose another video', 'generator.extendClearVideo': 'Clear video', 'generator.extendInvalidVideo': 'Only MP4 video files are supported.', 'generator.extendVideoRequired': 'Select an MP4 video first.', 'generator.extendUnavailable': 'Video extension generation is not connected yet.' },
  'zh-CN': { 'generator.costPerSecond': '每秒 20 💎', 'generator.secondsShort': '{{count}} 秒', 'generator.extendChooseVideo': '选择要延长的视频', 'generator.extendMp4Only': '仅支持 MP4 视频文件', 'generator.extendSelectVideo': '选择本地 MP4 视频', 'generator.extendNoVideo': '尚未选择视频', 'generator.extendSelectedVideo': '已选择视频', 'generator.extendFileName': '文件名', 'generator.extendFileSize': '文件大小', 'generator.extendReplaceVideo': '重新选择视频', 'generator.extendClearVideo': '清除视频', 'generator.extendInvalidVideo': '只支持 MP4 视频文件。', 'generator.extendVideoRequired': '请先选择 MP4 视频。', 'generator.extendUnavailable': '视频延长生成暂未接入。' },
  ja: { 'generator.costPerSecond': '1秒あたり20 💎', 'generator.secondsShort': '{{count}}秒', 'generator.extendChooseVideo': '延長する動画を選択', 'generator.extendMp4Only': 'MP4動画のみ対応', 'generator.extendSelectVideo': 'ローカルMP4動画を選択', 'generator.extendNoVideo': '動画が未選択です', 'generator.extendSelectedVideo': '動画を選択済み', 'generator.extendFileName': 'ファイル名', 'generator.extendFileSize': 'ファイルサイズ', 'generator.extendReplaceVideo': '動画を再選択', 'generator.extendClearVideo': '動画をクリア', 'generator.extendInvalidVideo': 'MP4動画ファイルのみ対応しています。', 'generator.extendVideoRequired': '先にMP4動画を選択してください。', 'generator.extendUnavailable': '動画延長生成はまだ接続されていません。' },
  ko: { 'generator.costPerSecond': '초당 20 💎', 'generator.secondsShort': '{{count}}초', 'generator.extendChooseVideo': '연장할 동영상 선택', 'generator.extendMp4Only': 'MP4 동영상만 지원', 'generator.extendSelectVideo': '로컬 MP4 동영상 선택', 'generator.extendNoVideo': '선택된 동영상 없음', 'generator.extendSelectedVideo': '동영상 선택됨', 'generator.extendFileName': '파일명', 'generator.extendFileSize': '파일 크기', 'generator.extendReplaceVideo': '동영상 다시 선택', 'generator.extendClearVideo': '동영상 지우기', 'generator.extendInvalidVideo': 'MP4 동영상 파일만 지원합니다.', 'generator.extendVideoRequired': '먼저 MP4 동영상을 선택하세요.', 'generator.extendUnavailable': '동영상 연장 생성은 아직 연결되지 않았습니다.' },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], generatorUnitTranslations[locale] || {});

for (const [locale, message] of Object.entries({
  en: 'Describe how the video should continue.',
  'zh-CN': '请描述视频接下来如何延续。',
  ja: '動画をどのように続けるか入力してください。',
  ko: '동영상이 어떻게 이어질지 입력하세요.',
})) dictionaries[locale as Locale]['generator.extendPromptRequired'] = message;

const mobileNavigationTranslations: Record<string, MessageMap> = {
  en: {
    'mobile.navigation': 'Navigation',
    'mobile.openNavigation': 'Open navigation',
    'mobile.closeNavigation': 'Close navigation',
    'mobile.navigationPrimary': 'Main',
    'mobile.navigationCommunity': 'Community',
    'mobile.navigationSupport': 'Help and safety',
    'mobile.navigationAccount': 'Account',
  },
  'zh-CN': {
    'mobile.navigation': '\u5bfc\u822a',
    'mobile.openNavigation': '\u6253\u5f00\u5bfc\u822a',
    'mobile.closeNavigation': '\u5173\u95ed\u5bfc\u822a',
    'mobile.navigationPrimary': '\u4e3b\u8981\u529f\u80fd',
    'mobile.navigationCommunity': '\u793e\u533a',
    'mobile.navigationSupport': '\u5e2e\u52a9\u4e0e\u5b89\u5168',
    'mobile.navigationAccount': '\u8d26\u6237',
  },
  ja: {
    'mobile.navigation': '\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3',
    'mobile.openNavigation': '\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3\u3092\u958b\u304f',
    'mobile.closeNavigation': '\u30ca\u30d3\u30b2\u30fc\u30b7\u30e7\u30f3\u3092\u9589\u3058\u308b',
    'mobile.navigationPrimary': '\u4e3b\u306a\u6a5f\u80fd',
    'mobile.navigationCommunity': '\u30b3\u30df\u30e5\u30cb\u30c6\u30a3',
    'mobile.navigationSupport': '\u30d8\u30eb\u30d7\u3068\u5b89\u5168',
    'mobile.navigationAccount': '\u30a2\u30ab\u30a6\u30f3\u30c8',
  },
  ko: {
    'mobile.navigation': '\ub0b4\ube44\uac8c\uc774\uc158',
    'mobile.openNavigation': '\ub0b4\ube44\uac8c\uc774\uc158 \uc5f4\uae30',
    'mobile.closeNavigation': '\ub0b4\ube44\uac8c\uc774\uc158 \ub2eb\uae30',
    'mobile.navigationPrimary': '\uc8fc\uc694 \uae30\ub2a5',
    'mobile.navigationCommunity': '\ucee4\ubba4\ub2c8\ud2f0',
    'mobile.navigationSupport': '\ub3c4\uc6c0\ub9d0\uacfc \uc548\uc804',
    'mobile.navigationAccount': '\uacc4\uc815',
  },
};
for (const locale of SUPPORTED_LOCALES) Object.assign(dictionaries[locale], mobileNavigationTranslations[locale] || {});

const localeSources: Record<string, MessageMap[]> = {
  en: [en, supplemental.en, uiSupplemental.en, extendedSupplemental.en, membershipSupplemental.en, paymentSupplemental.en, finalSupplemental.en, pageSupplemental.en, referralSupplemental.en, createPresetSupplemental.en, createTraitSupplemental.en, createSupplemental.en, createPublishingTranslations.en, createArchetypeSupplemental.en, exploreFilterTranslations.en, chatImageTranslations.en, generatorAudioTranslations.en, generatorUnitTranslations.en, publishingTranslations.en, mobileNavigationTranslations.en],
  'zh-CN': [zh, supplemental['zh-CN'], uiSupplemental['zh-CN'], extendedSupplemental['zh-CN'], membershipSupplemental['zh-CN'], paymentSupplemental['zh-CN'], finalSupplemental['zh-CN'], pageSupplemental['zh-CN'], referralSupplemental['zh-CN'], createPresetSupplemental['zh-CN'], createTraitSupplemental['zh-CN'], createSupplemental['zh-CN'], createPublishingTranslations['zh-CN'], createArchetypeSupplemental['zh-CN'], exploreFilterTranslations['zh-CN'], chatImageTranslations['zh-CN'], generatorAudioTranslations['zh-CN'], generatorUnitTranslations['zh-CN'], publishingTranslations['zh-CN'], mobileNavigationTranslations['zh-CN']],
  ja: [ja, supplemental.ja, uiSupplemental.ja, extendedSupplemental.ja, membershipSupplemental.ja, paymentSupplemental.ja, finalSupplemental.ja, pageSupplemental.ja, referralSupplemental.ja, createPresetSupplemental.ja, createTraitSupplemental.ja, createSupplemental.ja, createPublishingTranslations.ja, createArchetypeSupplemental.ja, exploreFilterTranslations.ja, chatImageTranslations.ja, generatorAudioTranslations.ja, generatorUnitTranslations.ja, publishingTranslations.ja, mobileNavigationTranslations.ja],
  ko: [ko, supplemental.ko, uiSupplemental.ko, extendedSupplemental.ko, membershipSupplemental.ko, paymentSupplemental.ko, finalSupplemental.ko, pageSupplemental.ko, referralSupplemental.ko, createPresetSupplemental.ko, createTraitSupplemental.ko, createSupplemental.ko, createPublishingTranslations.ko, createArchetypeSupplemental.ko, exploreFilterTranslations.ko, chatImageTranslations.ko, generatorAudioTranslations.ko, generatorUnitTranslations.ko, publishingTranslations.ko, mobileNavigationTranslations.ko],
  es: [en, createPublishingTranslations.es],
  pt: [en, createPublishingTranslations.pt],
};
const localeKeySets: Record<string, Set<string>> = {
  en: new Set(localeSources.en.flatMap(Object.keys)),
  'zh-CN': new Set(localeSources['zh-CN'].flatMap(Object.keys)),
  ja: new Set(localeSources.ja.flatMap(Object.keys)),
  ko: new Set(localeSources.ko.flatMap(Object.keys)),
  es: new Set(localeSources.es.flatMap(Object.keys)),
  pt: new Set(localeSources.pt.flatMap(Object.keys)),
};
const generatorRenderHintTranslations: Record<Locale, string> = {
  en: 'Set output resolution, aspect ratio, duration, and seed',
  'zh-CN': '设定输出分辨率、比例、时长与 Seed',
  ja: '解像度、比率、長さ、Seedを設定',
  ko: '해상도, 비율, 길이와 Seed 설정',
  es: 'Configura la resolución, la proporción, la duración y la semilla',
  pt: 'Defina a resolução, a proporção, a duração e a seed',
};
const mediaSectionLabels: Record<Locale, Pick<MessageMap, 'detail.photos' | 'detail.videos' | 'panel.photosCount' | 'panel.videosCount'>> = {
  en: { 'detail.photos': 'Photos', 'detail.videos': 'Videos', 'panel.photosCount': 'High-resolution photos', 'panel.videosCount': 'Videos' },
  'zh-CN': { 'detail.photos': '精彩写真', 'detail.videos': '动态剧场', 'panel.photosCount': '高清写真照片', 'panel.videosCount': '动态视频与剧场片段' },
  ja: { 'detail.photos': '写真', 'detail.videos': '動画', 'panel.photosCount': '写真', 'panel.videosCount': '動画' },
  ko: { 'detail.photos': '사진', 'detail.videos': '동영상', 'panel.photosCount': '고화질 사진', 'panel.videosCount': '동영상' },
  es: { 'detail.photos': 'Fotos', 'detail.videos': 'Videos', 'panel.photosCount': 'Fotos de alta resolución', 'panel.videosCount': 'Videos' },
  pt: { 'detail.photos': 'Fotos', 'detail.videos': 'Vídeos', 'panel.photosCount': 'Fotos em alta resolução', 'panel.videosCount': 'Vídeos' },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], mediaSectionLabels[locale]);
}

for (const locale of SUPPORTED_LOCALES) {
  dictionaries[locale]['generator.renderHint'] = generatorRenderHintTranslations[locale];
}
const membershipBadgeTranslations: Record<Locale, MessageMap> = {
  en: { 'generator.vipModeBadge': 'VIP feature', 'generator.membershipRequired': 'This feature requires an active Starlight VIP membership.', 'create.vipExclusive': 'VIP exclusive' },
  'zh-CN': { 'generator.vipModeBadge': '会员功能', 'generator.membershipRequired': '该功能需要有效的星耀 VIP 会员，请先升级会员。', 'create.vipExclusive': 'VIP 专属' },
  ja: { 'generator.vipModeBadge': 'VIP機能', 'generator.membershipRequired': 'この機能には有効なスターライトVIP会員資格が必要です。', 'create.vipExclusive': 'VIP限定' },
  ko: { 'generator.vipModeBadge': 'VIP 기능', 'generator.membershipRequired': '이 기능을 사용하려면 유효한 스타라이트 VIP 멤버십이 필요합니다.', 'create.vipExclusive': 'VIP 전용' },
  es: { 'generator.vipModeBadge': 'Función VIP', 'generator.membershipRequired': 'Esta función requiere una membresía Starlight VIP activa.', 'create.vipExclusive': 'Exclusivo para VIP' },
  pt: { 'generator.vipModeBadge': 'Recurso VIP', 'generator.membershipRequired': 'Este recurso requer uma assinatura Starlight VIP ativa.', 'create.vipExclusive': 'Exclusivo para VIP' },
};
for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], membershipBadgeTranslations[locale]);
  for (const key of Object.keys(membershipBadgeTranslations[locale])) localeKeySets[locale].add(key);
}
const registrationPasswordTranslations: Record<string, MessageMap> = {
  en: { 'auth.registerPasswordHint': 'At least 8 characters.' },
  'zh-CN': { 'auth.registerPasswordHint': '至少 8 个字符。' },
  ja: { 'auth.registerPasswordHint': '8文字以上。' },
  ko: { 'auth.registerPasswordHint': '8자 이상.' },
  es: { 'auth.registerPasswordHint': 'Al menos 8 caracteres.' },
  pt: { 'auth.registerPasswordHint': 'Pelo menos 8 caracteres.' },
};
for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], registrationPasswordTranslations[locale] || {});
  localeKeySets[locale].add('auth.registerPasswordHint');
}
const chatVoicePreviewTranslations: Record<string, MessageMap> = {
  en: {
    'panel.previewVoice': 'Preview {{voice}} greeting', 'panel.previewLoading': 'Preparing greeting preview',
    'panel.stopPreview': 'Stop preview', 'panel.switching': 'Switching...', 'panel.previewUnavailable': 'Voice sample is temporarily unavailable',
    'panel.premiumVoice': 'Premium voice', 'panel.vipVoice': 'Members-only voice',
    'panel.voiceMembershipRequired': 'This voice requires an active membership. Upgrade to preview or use it.',
    'panel.unlockPremiumVoice': 'Unlock premium voice', 'panel.unlockVoiceShort': 'Unlock',
    'upgrade.feature.chatVoiceStyles': 'Premium chat voice styles',
    'voice.style.femaleGirl': 'Girl Voice', 'voice.style.femaleWarm': 'Warm Voice',
    'voice.style.femaleCoolLady': 'Cool Lady', 'voice.style.femaleDeepCeo': 'Deep CEO',
    'voice.style.maleWarm': 'Warm Voice', 'voice.style.maleCalm': 'Calm Voice',
    'voice.style.maleTipsy': 'Tipsy Voice', 'voice.style.maleMagnetic': 'Magnetic Voice',
    'voice.gender.female': 'Female', 'voice.gender.male': 'Male',
    'voice.language.multilingual': 'Multilingual', 'voice.language.zhCN': 'Simplified Chinese',
  },
  'zh-CN': {
    'panel.previewVoice': '\u8bd5\u542c {{voice}} \u95ee\u5019\u8bed', 'panel.previewLoading': '\u6b63\u5728\u51c6\u5907\u95ee\u5019\u8bd5\u542c',
    'panel.stopPreview': '\u505c\u6b62\u8bd5\u542c', 'panel.switching': '\u5207\u6362\u4e2d...', 'panel.previewUnavailable': '\u6837\u97f3\u6682\u4e0d\u53ef\u7528',
    'panel.premiumVoice': '高级音色', 'panel.vipVoice': '会员专属音色',
    'panel.voiceMembershipRequired': '该音色需要有效会员，开通会员后可试听和使用。',
    'panel.unlockPremiumVoice': '解锁高级音色', 'panel.unlockVoiceShort': '解锁',
    'upgrade.feature.chatVoiceStyles': '高级聊天音色',
    'voice.style.femaleGirl': '少女音', 'voice.style.femaleWarm': '温柔暖声',
    'voice.style.femaleCoolLady': '高冷御姐音', 'voice.style.femaleDeepCeo': '深沉霸总音',
    'voice.style.maleWarm': '温暖音', 'voice.style.maleCalm': '沉稳音',
    'voice.style.maleTipsy': '微醺音', 'voice.style.maleMagnetic': '磁性音',
    'voice.gender.female': '女性', 'voice.gender.male': '男性',
    'voice.language.multilingual': '多语言', 'voice.language.zhCN': '简体中文',
  },
  ja: {
    'panel.previewVoice': '{{voice}}\u306e\u6328\u62f6\u3092\u8a66\u8074', 'panel.previewLoading': '\u6328\u62f6\u30d7\u30ec\u30d3\u30e5\u30fc\u3092\u6e96\u5099\u4e2d',
    'panel.stopPreview': '\u8a66\u8074\u3092\u505c\u6b62', 'panel.switching': '\u5207\u308a\u66ff\u3048\u4e2d...', 'panel.previewUnavailable': '\u97f3\u58f0\u30b5\u30f3\u30d7\u30eb\u306f\u4e00\u6642\u7684\u306b\u5229\u7528\u3067\u304d\u307e\u305b\u3093',
    'panel.premiumVoice': 'プレミアム音声', 'panel.vipVoice': '会員限定音声',
    'panel.voiceMembershipRequired': 'この音声の試聴と使用には有効なメンバーシップが必要です。',
    'panel.unlockPremiumVoice': 'プレミアム音声を解放', 'panel.unlockVoiceShort': '解除',
    'upgrade.feature.chatVoiceStyles': 'プレミアムチャット音声',
    'voice.style.femaleGirl': '少女ボイス', 'voice.style.femaleWarm': '優しい声',
    'voice.style.femaleCoolLady': 'クールお姉さん', 'voice.style.femaleDeepCeo': '低音社長',
    'voice.style.maleWarm': '温もりボイス', 'voice.style.maleCalm': '落ち着いた声',
    'voice.style.maleTipsy': 'ほろ酔いボイス', 'voice.style.maleMagnetic': '魅惑の声',
    'voice.gender.female': '女性', 'voice.gender.male': '男性',
    'voice.language.multilingual': '多言語', 'voice.language.zhCN': '中国語（簡体字）',
  },
  ko: {
    'panel.previewVoice': '{{voice}} \uc778\uc0ac \ubbf8\ub9ac \ub4e3\uae30', 'panel.previewLoading': '\uc778\uc0ac \ubbf8\ub9ac \ub4e4\uae30 \uc900\ube44 \uc911',
    'panel.stopPreview': '\ubbf8\ub9ac \ub4e3\uae30 \uc911\uc9c0', 'panel.switching': '\ubcc0\uacbd \uc911...', 'panel.previewUnavailable': '\uc74c\uc131 \uc0d8\ud50c\uc744 \uc77c\uc2dc\uc801\uc73c\ub85c \uc0ac\uc6a9\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4',
    'panel.premiumVoice': '프리미엄 음성', 'panel.vipVoice': '멤버십 전용 음성',
    'panel.voiceMembershipRequired': '이 음성을 미리 듣고 사용하려면 유효한 멤버십이 필요합니다.',
    'panel.unlockPremiumVoice': '프리미엄 음성 잠금 해제', 'panel.unlockVoiceShort': '잠금 해제',
    'upgrade.feature.chatVoiceStyles': '프리미엄 채팅 음성',
    'voice.style.femaleGirl': '소녀 보이스', 'voice.style.femaleWarm': '따뜻한 목소리',
    'voice.style.femaleCoolLady': '시크한 언니', 'voice.style.femaleDeepCeo': '중후한 CEO',
    'voice.style.maleWarm': '따뜻한 목소리', 'voice.style.maleCalm': '차분한 목소리',
    'voice.style.maleTipsy': '살짝 취한 목소리', 'voice.style.maleMagnetic': '매력적인 목소리',
    'voice.gender.female': '여성', 'voice.gender.male': '남성',
    'voice.language.multilingual': '다국어', 'voice.language.zhCN': '중국어(간체)',
  },
  es: {
    'panel.premiumVoice': 'Voz premium', 'panel.vipVoice': 'Voz exclusiva para miembros',
    'panel.voiceMembershipRequired': 'Esta voz requiere una membresía activa para escucharla y usarla.',
    'panel.unlockPremiumVoice': 'Desbloquear voz premium', 'panel.unlockVoiceShort': 'Desbloquear',
    'upgrade.feature.chatVoiceStyles': 'Voces premium para el chat',
    'voice.style.femaleGirl': 'Voz juvenil', 'voice.style.femaleWarm': 'Voz cálida',
    'voice.style.femaleCoolLady': 'Dama fría', 'voice.style.femaleDeepCeo': 'CEO de voz grave',
    'voice.style.maleWarm': 'Voz cálida', 'voice.style.maleCalm': 'Voz serena',
    'voice.style.maleTipsy': 'Voz embriagada', 'voice.style.maleMagnetic': 'Voz magnética',
  },
  pt: {
    'panel.premiumVoice': 'Voz premium', 'panel.vipVoice': 'Voz exclusiva para assinantes',
    'panel.voiceMembershipRequired': 'Esta voz exige uma assinatura ativa para ouvir e usar.',
    'panel.unlockPremiumVoice': 'Desbloquear voz premium', 'panel.unlockVoiceShort': 'Desbloquear',
    'upgrade.feature.chatVoiceStyles': 'Vozes premium para o chat',
    'voice.style.femaleGirl': 'Voz jovem', 'voice.style.femaleWarm': 'Voz calorosa',
    'voice.style.femaleCoolLady': 'Dama fria', 'voice.style.femaleDeepCeo': 'CEO de voz grave',
    'voice.style.maleWarm': 'Voz calorosa', 'voice.style.maleCalm': 'Voz serena',
    'voice.style.maleTipsy': 'Voz embriagada', 'voice.style.maleMagnetic': 'Voz magnética',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], chatVoicePreviewTranslations[locale] || {});
  for (const key of Object.keys(chatVoicePreviewTranslations[locale] || {})) localeKeySets[locale].add(key);
}


for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], detailProfileTranslations[locale] || {});
  for (const key of Object.keys(detailProfileTranslations[locale] || {})) localeKeySets[locale].add(key);
}

const characterCommentTranslations: Record<string, MessageMap> = {
  en: {
    'comments.tab': 'Reviews', 'comments.writeFor': 'Write a review for {{name}}...', 'comments.publish': 'Publish review',
    'comments.all': 'All reviews ({{count}})', 'comments.hot': 'Hottest', 'comments.newest': 'Newest', 'comments.sortLabel': 'Sort reviews',
    'comments.noComments': 'No reviews yet. Be the first to share one.', 'comments.loading': 'Loading...', 'comments.loadMore': 'Load more reviews',
    'comments.loadFailed': 'Reviews could not be loaded.', 'comments.submitFailed': 'Review could not be published. Try again.',
    'comments.reply': 'Reply', 'comments.replyTo': 'Reply to {{name}}', 'comments.replyToShort': 'Reply to them', 'comments.replyPlaceholder': 'Write a reply...',
    'comments.replyFailed': 'Reply could not be published. Try again.', 'comments.replyLoadFailed': 'Replies could not be loaded.',
    'comments.expandReplies': '{{count}} replies', 'comments.collapseReplies': 'Hide replies', 'comments.expandMoreReplies': 'Load remaining replies',
    'comments.like': 'Like review', 'comments.unlike': 'Unlike review', 'comments.likeFailed': 'Like could not be updated.',
    'comments.delete': 'Delete review', 'comments.deleteConfirm': 'Delete this review?', 'comments.deleteAction': 'Delete', 'comments.deleteFailed': 'Review could not be deleted.',
  },
  'zh-CN': {
    'comments.tab': '热评', 'comments.writeFor': '写下你对 {{name}} 的评论...', 'comments.publish': '发表评论',
    'comments.all': '全部评论（{{count}}）', 'comments.hot': '最热', 'comments.newest': '最新', 'comments.sortLabel': '评论排序',
    'comments.noComments': '暂无评论，来写下第一条吧。', 'comments.loading': '加载中...', 'comments.loadMore': '加载更多评论',
    'comments.loadFailed': '评论加载失败。', 'comments.submitFailed': '评论发表失败，请重试。',
    'comments.reply': '回复', 'comments.replyTo': '回复 {{name}}', 'comments.replyToShort': '回复 TA', 'comments.replyPlaceholder': '写下你的回复...',
    'comments.replyFailed': '回复发表失败，请重试。', 'comments.replyLoadFailed': '回复加载失败。',
    'comments.expandReplies': '{{count}} 条回复', 'comments.collapseReplies': '收起回复', 'comments.expandMoreReplies': '展开剩余回复',
    'comments.like': '点赞评论', 'comments.unlike': '取消点赞', 'comments.likeFailed': '点赞更新失败。',
    'comments.delete': '删除评论', 'comments.deleteConfirm': '确定删除这条评论吗？', 'comments.deleteAction': '删除', 'comments.deleteFailed': '评论删除失败。',
  },
  ja: {
    'comments.tab': 'レビュー', 'comments.writeFor': '{{name}}へのレビューを書く...', 'comments.publish': 'レビューを投稿',
    'comments.all': 'すべてのレビュー（{{count}}）', 'comments.hot': '人気順', 'comments.newest': '新着順', 'comments.sortLabel': 'レビューの並び順',
    'comments.noComments': 'まだレビューはありません。最初のレビューを投稿しましょう。', 'comments.loading': '読み込み中...', 'comments.loadMore': 'さらにレビューを読み込む',
    'comments.loadFailed': 'レビューを読み込めませんでした。', 'comments.submitFailed': 'レビューを投稿できませんでした。もう一度お試しください。',
    'comments.reply': '返信', 'comments.replyTo': '{{name}}に返信', 'comments.replyToShort': '返信する', 'comments.replyPlaceholder': '返信を書く...',
    'comments.replyFailed': '返信を投稿できませんでした。', 'comments.replyLoadFailed': '返信を読み込めませんでした。',
    'comments.expandReplies': '{{count}}件の返信', 'comments.collapseReplies': '返信を閉じる', 'comments.expandMoreReplies': '残りの返信を表示',
    'comments.like': 'レビューにいいね', 'comments.unlike': 'いいねを取り消す', 'comments.likeFailed': 'いいねを更新できませんでした。',
    'comments.delete': 'レビューを削除', 'comments.deleteConfirm': 'このレビューを削除しますか？', 'comments.deleteAction': '削除', 'comments.deleteFailed': 'レビューを削除できませんでした。',
  },
  ko: {
    'comments.tab': '리뷰', 'comments.writeFor': '{{name}}에 대한 리뷰를 작성하세요...', 'comments.publish': '리뷰 게시',
    'comments.all': '전체 리뷰 ({{count}})', 'comments.hot': '인기순', 'comments.newest': '최신순', 'comments.sortLabel': '리뷰 정렬',
    'comments.noComments': '아직 리뷰가 없습니다. 첫 리뷰를 남겨 보세요.', 'comments.loading': '불러오는 중...', 'comments.loadMore': '리뷰 더 보기',
    'comments.loadFailed': '리뷰를 불러오지 못했습니다.', 'comments.submitFailed': '리뷰를 게시하지 못했습니다. 다시 시도해 주세요.',
    'comments.reply': '답글', 'comments.replyTo': '{{name}}에게 답글', 'comments.replyToShort': '답글 달기', 'comments.replyPlaceholder': '답글을 작성하세요...',
    'comments.replyFailed': '답글을 게시하지 못했습니다.', 'comments.replyLoadFailed': '답글을 불러오지 못했습니다.',
    'comments.expandReplies': '답글 {{count}}개', 'comments.collapseReplies': '답글 접기', 'comments.expandMoreReplies': '남은 답글 보기',
    'comments.like': '리뷰 좋아요', 'comments.unlike': '좋아요 취소', 'comments.likeFailed': '좋아요를 업데이트하지 못했습니다.',
    'comments.delete': '리뷰 삭제', 'comments.deleteConfirm': '이 리뷰를 삭제할까요?', 'comments.deleteAction': '삭제', 'comments.deleteFailed': '리뷰를 삭제하지 못했습니다.',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], characterCommentTranslations[locale] || {});
  for (const key of Object.keys(characterCommentTranslations[locale] || {})) localeKeySets[locale].add(key);
}

// Keep implementation details out of user-facing copy while preserving existing translation keys.
const implementationNeutralTranslations: Record<string, MessageMap> = {
  en: {
    'chat.session': 'Chat session',
    'chat.disabled': 'Chat is unavailable for this character. Choose another character from Explore.',
    'chat.publicOnly': 'Choose a character from Explore to start chatting.',
    'chat.imageSensitiveFailure': 'This scene could not be generated. Adjust the description or try again.',
    'errors.charactersService': 'Unable to load characters. Please try again.',
    'detail.stCardFailed': 'Character card setup failed. Please try again.',
    'panel.voiceApi': 'Available',
    'panel.voiceCatalog': 'Voice catalog',
    'panel.voiceHint': 'Voice options are available for this conversation and apply immediately when switched.',
    'panel.voiceUnavailable': 'Voice switching is not available for this character.',
    'detail.prompt': 'Character guidance',
    'detail.noPrompt': 'No public character guidance is available.',
    'profile.readOnly': 'This information is managed automatically.',
    'profile.sessionRestored': 'Signed in',
    'generator.queued': 'Preparing...',
    'generator.rendering': 'Creating your image...',
    'generator.modeUnavailable': 'This mode is temporarily unavailable.',
    'generator.submit': 'Starting image generation...',
    'generator.retrying': 'Trying again...',
    'generator.subtitle': 'Customize pose, outfit, and scene presets. Your results will appear here.',
    'generator.task': 'Generation',
    'generator.managed': 'Automatic processing',
    'generator.stageTitle': 'Your results',
    'generator.liveResult': 'Latest result',
    'generator.engine': 'Finishing your creation...',
    'generator.videoRendering': 'Creating your video...',
  },
  'zh-CN': {
    'chat.session': '聊天会话',
    'chat.disabled': '该角色暂时无法聊天，请从发现页选择其他角色。',
    'chat.publicOnly': '请从发现页选择角色开始聊天。',
    'chat.imageSensitiveFailure': '当前场景无法生成，请调整描述或重试。',
    'errors.charactersService': '角色加载失败，请稍后重试。',
    'detail.stCardFailed': '角色资料准备失败，请稍后重试。',
    'panel.voiceApi': '可用',
    'panel.voiceCatalog': '音色目录',
    'panel.voiceHint': '音色选项可用于当前对话，切换后立即应用。',
    'panel.voiceUnavailable': '该角色暂不支持音色切换。',
    'detail.prompt': '角色设定',
    'detail.noPrompt': '暂无公开的角色设定。',
    'profile.readOnly': '此信息由系统自动管理。',
    'profile.sessionRestored': '已登录',
    'generator.queued': '正在准备...',
    'generator.rendering': '正在生成图片...',
    'generator.modeUnavailable': '当前模式暂不可用。',
    'generator.submit': '正在开始生成图片...',
    'generator.retrying': '正在再次尝试...',
    'generator.subtitle': '可自定义姿势、服装和场景，生成结果会显示在这里。',
    'generator.task': '生成记录',
    'generator.managed': '自动处理',
    'generator.stageTitle': '生成结果',
    'generator.liveResult': '最新结果',
    'generator.engine': '正在完成你的作品...',
    'generator.videoRendering': '正在生成视频...',
  },
  ja: {
    'chat.session': 'チャットセッション',
    'chat.disabled': 'このキャラクターではチャットを利用できません。探索から別のキャラクターを選んでください。',
    'chat.publicOnly': '探索からキャラクターを選んでチャットを始めてください。',
    'chat.imageSensitiveFailure': 'このシーンは作成できませんでした。説明を調整してもう一度お試しください。',
    'errors.charactersService': 'キャラクターを読み込めませんでした。もう一度お試しください。',
    'detail.stCardFailed': 'キャラクター設定の準備に失敗しました。もう一度お試しください。',
    'panel.voiceApi': '利用可能',
    'panel.voiceCatalog': '音声カタログ',
    'panel.voiceHint': '音声はこのチャットで利用でき、切り替えるとすぐに適用されます。',
    'panel.voiceUnavailable': 'このキャラクターでは音声を切り替えられません。',
    'detail.prompt': 'キャラクター設定',
    'detail.noPrompt': '公開されているキャラクター設定はありません。',
    'profile.readOnly': 'この情報は自動的に管理されています。',
    'profile.sessionRestored': 'ログイン中',
    'generator.queued': '準備中...',
    'generator.rendering': '画像を作成しています...',
    'generator.modeUnavailable': 'このモードは一時的に利用できません。',
    'generator.submit': '画像の作成を開始しています...',
    'generator.retrying': 'もう一度試しています...',
    'generator.subtitle': 'ポーズ、衣装、シーンをカスタマイズできます。結果はここに表示されます。',
    'generator.task': '作成履歴',
    'generator.managed': '自動処理',
    'generator.stageTitle': '作成結果',
    'generator.liveResult': '最新の結果',
    'generator.engine': '作品を仕上げています...',
    'generator.videoRendering': '動画を作成しています...',
  },
  ko: {
    'chat.session': '채팅 세션',
    'chat.disabled': '이 캐릭터와는 채팅할 수 없습니다. 탐색에서 다른 캐릭터를 선택하세요.',
    'chat.publicOnly': '탐색에서 캐릭터를 선택해 채팅을 시작하세요.',
    'chat.imageSensitiveFailure': '이 장면을 만들 수 없습니다. 설명을 조정한 후 다시 시도해 주세요.',
    'errors.charactersService': '캐릭터를 불러오지 못했습니다. 다시 시도해 주세요.',
    'detail.stCardFailed': '캐릭터 설정을 준비하지 못했습니다. 다시 시도해 주세요.',
    'panel.voiceApi': '사용 가능',
    'panel.voiceCatalog': '음성 목록',
    'panel.voiceHint': '이 채팅에서 음성을 사용할 수 있으며 변경하면 바로 적용됩니다.',
    'panel.voiceUnavailable': '이 캐릭터는 음성 변경을 지원하지 않습니다.',
    'detail.prompt': '캐릭터 설정',
    'detail.noPrompt': '공개된 캐릭터 설정이 없습니다.',
    'profile.readOnly': '이 정보는 자동으로 관리됩니다.',
    'profile.sessionRestored': '로그인됨',
    'generator.queued': '준비 중...',
    'generator.rendering': '이미지를 만드는 중...',
    'generator.modeUnavailable': '이 모드는 일시적으로 사용할 수 없습니다.',
    'generator.submit': '이미지 생성을 시작하는 중...',
    'generator.retrying': '다시 시도하는 중...',
    'generator.subtitle': '포즈, 의상과 장면을 설정할 수 있습니다. 결과는 여기에 표시됩니다.',
    'generator.task': '생성 기록',
    'generator.managed': '자동 처리',
    'generator.stageTitle': '생성 결과',
    'generator.liveResult': '최신 결과',
    'generator.engine': '작품을 마무리하는 중...',
    'generator.videoRendering': '동영상을 만드는 중...',
  },
  es: {
    'common.unknownError': 'Algo salió mal. Inténtalo de nuevo.',
    'chat.session': 'Sesión de chat',
    'chat.disabled': 'Este personaje no está disponible para chatear. Elige otro en Explorar.',
    'chat.publicOnly': 'Elige un personaje en Explorar para empezar a chatear.',
    'errors.charactersService': 'No se pudieron cargar los personajes. Inténtalo de nuevo.',
    'panel.voiceUnavailable': 'Este personaje no permite cambiar la voz.',
    'detail.stCardFailed': 'No se pudo preparar la configuración del personaje. Inténtalo de nuevo.',
    'generator.modeUnavailable': 'Este modo no está disponible temporalmente.',
    'generator.subtitle': 'Personaliza la pose, el vestuario y la escena. Tus resultados aparecerán aquí.',
    'generator.managed': 'Procesamiento automático',
  },
  pt: {
    'common.unknownError': 'Algo deu errado. Tente novamente.',
    'chat.session': 'Sessão de conversa',
    'chat.disabled': 'Este personagem não está disponível para conversa. Escolha outro em Explorar.',
    'chat.publicOnly': 'Escolha um personagem em Explorar para começar a conversar.',
    'errors.charactersService': 'Não foi possível carregar os personagens. Tente novamente.',
    'panel.voiceUnavailable': 'Não é possível trocar a voz deste personagem.',
    'detail.stCardFailed': 'Não foi possível preparar as configurações do personagem. Tente novamente.',
    'generator.modeUnavailable': 'Este modo está temporariamente indisponível.',
    'generator.subtitle': 'Personalize pose, roupa e cena. Seus resultados aparecerão aqui.',
    'generator.managed': 'Processamento automático',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], implementationNeutralTranslations[locale] || {});
}

const generatorRegenerationTranslations: Record<string, MessageMap> = {
  en: {
    'generator.regenerate': 'Regenerate',
    'generator.regenerating': 'Regenerating...',
    'generator.errorRegenerate': 'Regeneration failed. Please try again.',
  },
  'zh-CN': {
    'generator.regenerate': '重新生成',
    'generator.regenerating': '正在重新生成...',
    'generator.errorRegenerate': '重新生成失败，请稍后重试。',
  },
  ja: {
    'generator.regenerate': '再生成',
    'generator.regenerating': '再生成中...',
    'generator.errorRegenerate': '再生成に失敗しました。もう一度お試しください。',
  },
  ko: {
    'generator.regenerate': '다시 생성',
    'generator.regenerating': '다시 생성 중...',
    'generator.errorRegenerate': '다시 생성하지 못했습니다. 다시 시도해 주세요.',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], generatorRegenerationTranslations[locale] || {});
  Object.keys(generatorRegenerationTranslations[locale] || {}).forEach((key) => localeKeySets[locale].add(key));
}

const generatedImagePrototypeTranslations: Record<string, MessageMap> = {
  en: {
    'create.fromImageTitle': 'Create character from image',
    'create.fromImageTraits': 'Personality & tags',
    'create.fromImageStory': 'Story settings',
    'create.fromImageConfirm': 'Confirm creation',
    'create.fromImageConfirmHint': 'Choose a voice and preview the character card.',
    'create.fromImageSourceAlt': 'Generated source image',
    'create.fromImageChooseGender': 'Voice gender',
    'create.fromImageCreate': 'Start creating character card',
    'create.fromImageCreating': 'Preparing character card...',
    'create.fromImagePreviewTitle': 'Character card preview',
    'create.fromImageNotSaved': 'Preview only. This character card has not been saved.',
    'create.fromImageBackToEdit': 'Back to edit',
    'create.fromImageSaved': 'Saved privately and synced to SillyTavern.',
    'create.fromImageDraftLoading': 'Generating a connected profile...',
    'create.fromImageDraftHint': 'AI will fill a consistent profile from the image and your selections.',
    'create.fromImageRandomize': 'Randomize again',
    'create.fromImageDraftError': 'Profile generation failed. Try again.',
    'create.fromImageDraftTimeout': 'AI response timed out. Try randomizing again.',
    'create.fromImageDraftRateLimited': 'Too many requests. Please wait and try again.',
    'create.fromImageDraftUnavailable': 'AI service is temporarily unavailable. Try again.',
    'create.fromImageDraftInvalid': 'AI returned incomplete profile data. Try randomizing again.',
    'create.fromImageDraftRejected': 'AI rejected this profile request. Try editing your selections and retry.',
    'create.fromImageCreateError': 'Character card creation failed. Please try again.',
    'create.fromImageStCreating': 'Creating your private SillyTavern card...',
    'create.fromImageStPending': 'SillyTavern card is still processing.',
    'create.fromImageRetrySt': 'Retry SillyTavern card',
    'create.fromImageRedeliver': 'Re-submit card sync',
  },
  'zh-CN': {
    'create.fromImageTitle': '用图片创建角色卡',
    'create.fromImageTraits': '性格与标签',
    'create.fromImageStory': '故事设定',
    'create.fromImageConfirm': '确认创建',
    'create.fromImageConfirmHint': '选择音色并预览角色卡。',
    'create.fromImageSourceAlt': '生成的来源图片',
    'create.fromImageChooseGender': '音色性别',
    'create.fromImageCreate': '开始生成角色卡',
    'create.fromImageCreating': '正在准备角色卡…',
    'create.fromImagePreviewTitle': '角色卡效果预览',
    'create.fromImageNotSaved': '效果预览，尚未保存。',
    'create.fromImageBackToEdit': '返回修改',
    'create.fromImageSaved': '已保存为私有角色，并已同步到 SillyTavern。',
    'create.fromImageDraftLoading': '正在生成关联设定…',
    'create.fromImageDraftHint': 'AI 会根据图片和你的选择填入一套关联设定。',
    'create.fromImageRandomize': '重新随机生成',
    'create.fromImageDraftError': '设定生成失败，请重试。',
    'create.fromImageDraftTimeout': 'AI 响应超时，请重新随机生成。',
    'create.fromImageDraftRateLimited': '请求过于频繁，请稍后再试。',
    'create.fromImageDraftUnavailable': 'AI 服务暂时不可用，请重试。',
    'create.fromImageDraftInvalid': 'AI 返回的设定不完整，请重新随机生成。',
    'create.fromImageDraftRejected': 'AI 拒绝了这次设定请求，请修改选项后重试。',
    'create.fromImageCreateError': '角色卡创建失败，请重试。',
    'create.fromImageStCreating': '正在创建你的私有 SillyTavern 角色卡…',
    'create.fromImageStPending': 'SillyTavern 角色卡仍在处理中。',
    'create.fromImageRetrySt': '重试创建 SillyTavern 角色卡',
    'create.fromImageRedeliver': '重新投递角色卡同步',
  },
  ja: {
    'create.fromImageTitle': '画像からキャラクターカードを作成',
    'create.fromImageTraits': '性格とタグ',
    'create.fromImageStory': 'ストーリー設定',
    'create.fromImageConfirm': '作成を確認',
    'create.fromImageConfirmHint': 'ボイスを選んでキャラクターカードをプレビューします。',
    'create.fromImageSourceAlt': '生成元の画像',
    'create.fromImageChooseGender': 'ボイスの性別',
    'create.fromImageCreate': 'キャラクターカードを作成開始',
    'create.fromImageCreating': 'キャラクターカードを準備中…',
    'create.fromImagePreviewTitle': 'キャラクターカードのプレビュー',
    'create.fromImageNotSaved': 'プレビューのみです。まだ保存されていません。',
    'create.fromImageBackToEdit': '編集に戻る',
    'create.fromImageSaved': '非公開で保存し、SillyTavernに同期しました。',
    'create.fromImageDraftLoading': '関連プロフィールを生成中…',
    'create.fromImageDraftHint': '画像と選択内容から一貫したプロフィールを生成します。',
    'create.fromImageRandomize': 'もう一度ランダム生成',
    'create.fromImageDraftError': 'プロフィール生成に失敗しました。',
    'create.fromImageDraftTimeout': 'AIの応答がタイムアウトしました。もう一度ランダム生成してください。',
    'create.fromImageDraftRateLimited': 'リクエストが多すぎます。少し待ってから再試行してください。',
    'create.fromImageDraftUnavailable': 'AIサービスが一時的に利用できません。再試行してください。',
    'create.fromImageDraftInvalid': 'AIのプロフィールデータが不完全です。もう一度生成してください。',
    'create.fromImageDraftRejected': 'AIがこの設定リクエストを拒否しました。選択を変更して再試行してください。',
    'create.fromImageCreateError': 'キャラクターカードの作成に失敗しました。',
    'create.fromImageStCreating': '非公開SillyTavernカードを作成中…',
    'create.fromImageStPending': 'SillyTavernカードを処理中です。',
    'create.fromImageRetrySt': 'SillyTavernカードを再試行',
    'create.fromImageRedeliver': 'カード同期を再送信',
  },
  ko: {
    'create.fromImageTitle': '이미지로 캐릭터 카드 만들기',
    'create.fromImageTraits': '성격 및 태그',
    'create.fromImageStory': '스토리 설정',
    'create.fromImageConfirm': '생성 확인',
    'create.fromImageConfirmHint': '음성을 선택하고 캐릭터 카드를 미리 봅니다.',
    'create.fromImageSourceAlt': '생성된 원본 이미지',
    'create.fromImageChooseGender': '음성 성별',
    'create.fromImageCreate': '캐릭터 카드 생성 시작',
    'create.fromImageCreating': '캐릭터 카드를 준비하는 중…',
    'create.fromImagePreviewTitle': '캐릭터 카드 미리보기',
    'create.fromImageNotSaved': '효과 미리보기이며 아직 저장되지 않았습니다.',
    'create.fromImageBackToEdit': '수정으로 돌아가기',
    'create.fromImageSaved': '비공개로 저장하고 SillyTavern에 동기화했습니다.',
    'create.fromImageDraftLoading': '연결된 프로필을 생성하는 중…',
    'create.fromImageDraftHint': '이미지와 선택 항목을 바탕으로 일관된 프로필을 만듭니다.',
    'create.fromImageRandomize': '다시 무작위 생성',
    'create.fromImageDraftError': '프로필 생성에 실패했습니다.',
    'create.fromImageDraftTimeout': 'AI 응답 시간이 초과되었습니다. 다시 무작위 생성해 주세요.',
    'create.fromImageDraftRateLimited': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    'create.fromImageDraftUnavailable': 'AI 서비스를 일시적으로 사용할 수 없습니다. 다시 시도해 주세요.',
    'create.fromImageDraftInvalid': 'AI가 불완전한 프로필 데이터를 반환했습니다. 다시 생성해 주세요.',
    'create.fromImageDraftRejected': 'AI가 이 설정 요청을 거부했습니다. 선택을 바꾼 뒤 다시 시도해 주세요.',
    'create.fromImageCreateError': '캐릭터 카드 생성에 실패했습니다.',
    'create.fromImageStCreating': '비공개 SillyTavern 카드를 만드는 중…',
    'create.fromImageStPending': 'SillyTavern 카드가 처리 중입니다.',
    'create.fromImageRetrySt': 'SillyTavern 카드 재시도',
    'create.fromImageRedeliver': '카드 동기화 다시 제출',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], generatedImagePrototypeTranslations[locale] || {});
  Object.keys(generatedImagePrototypeTranslations[locale] || {}).forEach((key) => localeKeySets[locale].add(key));
}

const spanishExtension: MessageMap = {
  'safety.policy.communityGuidelines': 'Normas de la comunidad', 'safety.policy.complaintPolicy': 'Política de reclamaciones', 'safety.policy.contentModerationPolicy': 'Política de moderación de contenido', 'safety.policy.contentRemovalPolicy': 'Política de retirada de contenido', 'safety.policy.preScreeningAndPostScreeningPolicy': 'Política de revisión previa y posterior a la publicación', 'safety.policy.privacyPolicy': 'Política de privacidad', 'safety.policy.prohibitedContentPolicy': 'Política de contenido prohibido', 'safety.policy.refundPolicy': 'Política de reembolsos', 'safety.policy.sexTraffickingPolicy': 'Política contra la trata y la explotación sexual', 'safety.policy.termsOfService': 'Términos del servicio', 'safety.policy.exemption2257': 'Aviso de las secciones 2257 y 2257A del Título 18 del Código de EE. UU.', 'safety.policy.amlAntiFraudPolicy': 'Política de integridad de pagos y lucha contra el fraude',
  'brand.tagline': 'Historias que te responden.',
  'nav.explore': 'Explorar', 'nav.chat': 'Chat', 'nav.generate': 'Generar', 'nav.myCharacters': 'Mis personajes',
  'nav.feed': 'Novedades', 'nav.community': 'Comunidad', 'nav.referral': 'Recompensas', 'nav.help': 'Ayuda', 'nav.safety': 'Seguridad',
  'nav.create': 'Crear', 'nav.more': 'Más', 'nav.profile': 'Perfil y ajustes', 'nav.upgrade': 'Mejorar a VIP', 'nav.buyDiamonds': 'Comprar diamantes',
  'common.signIn': 'Iniciar sesión', 'common.joinFree': 'Unirse gratis', 'common.close': 'Cerrar', 'common.cancel': 'Cancelar',
  'common.save': 'Guardar', 'common.clear': 'Borrar', 'common.reset': 'Restablecer filtros', 'common.retry': 'Reintentar',
  'common.loading': 'Cargando', 'common.send': 'Enviar', 'common.apply': 'Aplicar', 'common.back': 'Atrás', 'common.next': 'Siguiente',
  'common.all': 'Todo', 'common.yes': 'Sí', 'common.no': 'No', 'common.done': 'Listo', 'common.delete': 'Eliminar',
  'common.search': 'Buscar', 'common.selected': 'Seleccionado', 'common.none': 'Ninguno', 'common.online': 'En línea',
  'common.follow': 'Seguir', 'common.following': 'Siguiendo', 'common.like': 'Me gusta', 'common.liked': 'Te gusta',
  'common.account': 'Cuenta', 'common.notifications': 'Notificaciones', 'common.openProfile': 'Abrir perfil y ajustes de cuenta',
  'discover.eyebrow': 'Biblioteca de personajes', 'discover.title': 'Descubre personajes',
  'discover.subtitle': 'Encuentra personajes interesantes y continúa tu historia a tu ritmo.',
  'discover.search': 'Buscar nombres, descripciones, estados de ánimo o escenarios...', 'discover.featured': 'Personajes destacados',
  'discover.myCollection': 'Mis favoritos y creaciones', 'discover.clearFilters': 'Borrar filtros actuales',
  'discover.sort.trending': '🔥 Tendencias', 'discover.sort.newest': '✨ Más recientes', 'discover.sort.popular': '⭐ Más populares',
  'discover.gender': 'Género', 'discover.genderAll': 'Todos los géneros', 'discover.female': 'Femenino', 'discover.male': 'Masculino',
  'discover.nonbinary': 'No binario', 'discover.style': 'Estilo', 'discover.styleAll': 'Todos los estilos', 'discover.anime': 'Anime',
  'discover.realistic': 'Realista', 'discover.age': 'Edad', 'discover.anyAge': 'Cualquier edad',
  'discover.filterCharacters': 'Filtrar personajes', 'discover.moreFilters': 'Más filtros', 'discover.filterHint': 'Elige condiciones para actualizar la lista.',
  'discover.noResults': 'Ningún personaje coincide con esos filtros.', 'discover.noResultsHint': 'Prueba otra palabra o restablece los filtros.',
  'discover.loadingCharacters': 'Cargando personajes', 'discover.loadFailed': 'No se pueden cargar los personajes', 'discover.reload': 'Recargar',
  'profile.title': 'Perfil y ajustes', 'profile.overview': 'Resumen del perfil', 'profile.accountLogin': 'Cuenta e inicio de sesión',
  'profile.language': 'Preferencia de idioma', 'profile.terms': 'Términos legales', 'profile.accountStatus': 'Estado de la cuenta',
  'profile.currentLanguage': 'Idioma actual', 'profile.chooseLanguage': 'Elegir idioma de la interfaz',
  'profile.languageHint': 'La interfaz cambia al instante. Tu elección se guarda en este dispositivo y se sincroniza con tu cuenta.',
  'profile.languageSaved': 'Preferencia de idioma guardada.', 'profile.languageSaveFailed': 'El idioma se guardó en este dispositivo, pero no se pudo sincronizar con tu cuenta.',
  'profile.logout': 'Cerrar sesión de forma segura', 'profile.loggingOut': 'Cerrando sesión...', 'profile.close': 'Cerrar perfil',
  'auth.welcome': 'Bienvenido de nuevo', 'auth.register': 'Únete a mio', 'auth.reset': 'Restablecer contraseña',
  'auth.registerHint': 'Crea una cuenta para guardar tus favoritos y chats.', 'auth.email': 'Correo electrónico', 'auth.password': 'Contraseña',
  'auth.displayName': 'Nombre visible', 'auth.continue': 'Continuar', 'auth.login': 'Iniciar sesión', 'auth.join': 'Unirse gratis',
  'auth.google': 'Continuar con Google', 'auth.terms': 'Al continuar, aceptas los Términos y la Política de privacidad.',
  'chat.conversations': 'Conversaciones', 'chat.new': 'Elige un personaje para comenzar una historia.', 'chat.placeholder': 'Escribe tu respuesta...',
  'chat.thinking': '{{name}} está pensando...', 'chat.clear': 'Borrar conversación', 'chat.noMessages': 'Aún no hay mensajes.',
  'chat.regenerate': 'Regenerar respuesta', 'chat.continue': 'Continuar con la siguiente respuesta',
  'chat.imagePreparing': 'Preparando la escena...', 'chat.imageCreating': 'Creando la imagen...', 'chat.imageSaving': 'Terminando la imagen...',
  'chat.imageFailedTitle': 'Imagen no generada', 'chat.imageRetry': 'Reintentar imagen',
  'tags.following': 'Siguiendo', 'tags.all': 'Todo', 'safety.title': 'Confianza y seguridad', 'safety.center': 'Centro de seguridad', 'safety.badge': 'Centro de seguridad', 'safety.description': 'Políticas oficiales y normas de seguridad de Rulumi.', 'safety.policyCount': '{{count}} políticas', 'safety.selectPolicy': 'Seleccionar una política', 'safety.library': 'Biblioteca de políticas', 'safety.navLabel': 'Políticas de seguridad', 'safety.officialDocument': 'Documento oficial de la política', 'safety.translationNotice': 'Esta traducción se ofrece por conveniencia; en caso de conflicto, prevalece la versión en inglés.',
  'help.title': '¿Cómo podemos ayudarte?', 'community.title': 'Comunidad de creadores', 'referral.title': 'Recompensas',
  'my.title': 'Mis personajes', 'my.eyebrow': 'Espacio personal de personajes', 'my.description': 'Administra tus personajes y favoritos, y continúa tus historias cuando quieras.', 'my.create': 'Crear personaje', 'my.created': 'Mis personajes', 'my.favorites': 'Mis favoritos', 'my.emptyCreated': 'Aún no has creado ningún personaje', 'my.emptyFavorites': 'No hay personajes favoritos', 'my.hintCreated': 'Usa el estudio de personajes con IA para crear un compañero y su historia.', 'my.hintFavorites': 'Pulsa el corazón de una tarjeta en Explorar para guardarla.', 'my.generate': 'Generar imagen y fondo del personaje', 'my.explore': 'Explorar personajes', 'my.deleteCreated': 'Eliminar personaje creado', 'my.confirmDelete': '¿Eliminar este personaje?', 'my.warning': 'Esta acción no se puede deshacer.', 'my.cancel': 'Cancelar', 'my.confirmDeleteButton': 'Eliminar permanentemente',
  'generator.close': 'Cerrar generador', 'generator.left': 'Anterior', 'generator.right': 'Siguiente', 'generator.allCharacters': 'Todos los personajes',
  'generator.createdCharacters': 'Creados', 'generator.likedCharacters': 'Con me gusta', 'generator.noImage': 'No hay imagen disponible', 'generator.vipModeBadge': 'Función VIP',
  'create.namePlaceholder': 'Introduce un nombre para el personaje', 'create.subtitlePlaceholder': 'Una breve presentación...',
  'create.descriptionPlaceholder': 'Describe el pasado, los deseos y el escenario del personaje...', 'create.greetingPlaceholder': 'Mensaje inicial del primer chat...', 'create.vipExclusive': 'Exclusivo para VIP',
  'notification.all': 'Todo ({{count}})', 'notification.markAllRead': 'Marcar todo como leído', 'notification.clearAll': 'Borrar todas las notificaciones',
  'errors.localeNetwork': 'El idioma se guardó en este dispositivo, pero no se pudo sincronizar con tu cuenta.',
  'upgrade.monthly': 'Mensual', 'upgrade.annual': 'Anual', 'upgrade.save50': 'Ahorra 50%', 'upgrade.perMonth': '/ mes',
};

const portugueseExtension: MessageMap = {
  'safety.policy.communityGuidelines': 'Diretrizes da comunidade', 'safety.policy.complaintPolicy': 'Política de reclamações', 'safety.policy.contentModerationPolicy': 'Política de moderação de conteúdo', 'safety.policy.contentRemovalPolicy': 'Política de remoção de conteúdo', 'safety.policy.preScreeningAndPostScreeningPolicy': 'Política de análise prévia e pós-publicação', 'safety.policy.privacyPolicy': 'Política de privacidade', 'safety.policy.prohibitedContentPolicy': 'Política de conteúdo proibido', 'safety.policy.refundPolicy': 'Política de reembolso', 'safety.policy.sexTraffickingPolicy': 'Política contra tráfico e exploração sexual', 'safety.policy.termsOfService': 'Termos de serviço', 'safety.policy.exemption2257': 'Aviso das seções 2257 e 2257A do Título 18 do Código dos EUA', 'safety.policy.amlAntiFraudPolicy': 'Política de integridade de pagamentos e combate à fraude',
  'brand.tagline': 'Histórias que respondem.',
  'nav.explore': 'Explorar', 'nav.chat': 'Chat', 'nav.generate': 'Gerar', 'nav.myCharacters': 'Meus personagens',
  'nav.feed': 'Feed', 'nav.community': 'Comunidade', 'nav.referral': 'Recompensas', 'nav.help': 'Ajuda', 'nav.safety': 'Segurança',
  'nav.create': 'Criar', 'nav.more': 'Mais', 'nav.profile': 'Perfil e configurações', 'nav.upgrade': 'Assinar VIP', 'nav.buyDiamonds': 'Comprar diamantes',
  'common.signIn': 'Entrar', 'common.joinFree': 'Participar grátis', 'common.close': 'Fechar', 'common.cancel': 'Cancelar',
  'common.save': 'Salvar', 'common.clear': 'Limpar', 'common.reset': 'Redefinir filtros', 'common.retry': 'Tentar novamente',
  'common.loading': 'Carregando', 'common.send': 'Enviar', 'common.apply': 'Aplicar', 'common.back': 'Voltar', 'common.next': 'Próximo',
  'common.all': 'Todos', 'common.yes': 'Sim', 'common.no': 'Não', 'common.done': 'Concluído', 'common.delete': 'Excluir',
  'common.search': 'Pesquisar', 'common.selected': 'Selecionado', 'common.none': 'Nenhum', 'common.online': 'Online',
  'common.follow': 'Seguir', 'common.following': 'Seguindo', 'common.like': 'Curtir', 'common.liked': 'Curtido',
  'common.account': 'Conta', 'common.notifications': 'Notificações', 'common.openProfile': 'Abrir perfil e configurações da conta',
  'discover.eyebrow': 'Biblioteca de personagens', 'discover.title': 'Descubra personagens',
  'discover.subtitle': 'Encontre personagens interessantes e continue sua história no seu ritmo.',
  'discover.search': 'Pesquisar nomes, descrições, humores ou cenários...', 'discover.featured': 'Personagens em destaque',
  'discover.myCollection': 'Meus favoritos e criações', 'discover.clearFilters': 'Limpar filtros atuais',
  'discover.sort.trending': '🔥 Em alta', 'discover.sort.newest': '✨ Mais recentes', 'discover.sort.popular': '⭐ Mais populares',
  'discover.gender': 'Gênero', 'discover.genderAll': 'Todos os gêneros', 'discover.female': 'Feminino', 'discover.male': 'Masculino',
  'discover.nonbinary': 'Não binário', 'discover.style': 'Estilo', 'discover.styleAll': 'Todos os estilos', 'discover.anime': 'Anime',
  'discover.realistic': 'Realista', 'discover.age': 'Idade', 'discover.anyAge': 'Qualquer idade',
  'discover.filterCharacters': 'Filtrar personagens', 'discover.moreFilters': 'Mais filtros', 'discover.filterHint': 'Escolha condições para atualizar a lista.',
  'discover.noResults': 'Nenhum personagem corresponde a esses filtros.', 'discover.noResultsHint': 'Tente outra palavra ou redefina os filtros.',
  'discover.loadingCharacters': 'Carregando personagens', 'discover.loadFailed': 'Não foi possível carregar os personagens', 'discover.reload': 'Recarregar',
  'profile.title': 'Perfil e configurações', 'profile.overview': 'Visão geral do perfil', 'profile.accountLogin': 'Conta e login',
  'profile.language': 'Preferência de idioma', 'profile.terms': 'Termos legais', 'profile.accountStatus': 'Status da conta',
  'profile.currentLanguage': 'Idioma atual', 'profile.chooseLanguage': 'Escolher idioma da interface',
  'profile.languageHint': 'A interface muda imediatamente. Sua escolha é salva neste dispositivo e sincronizada com sua conta.',
  'profile.languageSaved': 'Preferência de idioma salva.', 'profile.languageSaveFailed': 'O idioma foi salvo neste dispositivo, mas não foi possível sincronizá-lo com sua conta.',
  'profile.logout': 'Sair com segurança', 'profile.loggingOut': 'Saindo...', 'profile.close': 'Fechar perfil',
  'auth.welcome': 'Bem-vindo de volta', 'auth.register': 'Junte-se à mio', 'auth.reset': 'Redefinir senha',
  'auth.registerHint': 'Crie uma conta para manter seus favoritos e chats.', 'auth.email': 'Endereço de e-mail', 'auth.password': 'Senha',
  'auth.displayName': 'Nome de exibição', 'auth.continue': 'Continuar', 'auth.login': 'Entrar', 'auth.join': 'Participar grátis',
  'auth.google': 'Continuar com Google', 'auth.terms': 'Ao continuar, você concorda com os Termos e a Política de privacidade.',
  'chat.conversations': 'Conversas', 'chat.new': 'Escolha um personagem para começar uma história.', 'chat.placeholder': 'Escreva sua resposta...',
  'chat.thinking': '{{name}} está pensando...', 'chat.clear': 'Limpar conversa', 'chat.noMessages': 'Ainda não há mensagens.',
  'chat.regenerate': 'Regenerar resposta', 'chat.continue': 'Continuar com a próxima resposta',
  'chat.imagePreparing': 'Preparando a cena...', 'chat.imageCreating': 'Criando a imagem...', 'chat.imageSaving': 'Finalizando a imagem...',
  'chat.imageFailedTitle': 'Imagem não gerada', 'chat.imageRetry': 'Tentar imagem novamente',
  'tags.following': 'Seguindo', 'tags.all': 'Todos', 'safety.title': 'Confiança e segurança', 'safety.center': 'Central de segurança', 'safety.badge': 'Central de segurança', 'safety.description': 'Políticas oficiais e padrões de segurança da Rulumi.', 'safety.policyCount': '{{count}} políticas', 'safety.selectPolicy': 'Selecionar uma política', 'safety.library': 'Biblioteca de políticas', 'safety.navLabel': 'Políticas de segurança', 'safety.officialDocument': 'Documento oficial da política', 'safety.translationNotice': 'Esta tradução é fornecida por conveniência; em caso de conflito, prevalece a versão em inglês.',
  'help.title': 'Como podemos ajudar?', 'community.title': 'Comunidade de criadores', 'referral.title': 'Recompensas',
  'my.title': 'Meus personagens', 'my.eyebrow': 'Espaço pessoal de personagens', 'my.description': 'Gerencie seus personagens e favoritos e continue suas histórias quando quiser.', 'my.create': 'Criar personagem', 'my.created': 'Meus personagens', 'my.favorites': 'Meus favoritos', 'my.emptyCreated': 'Você ainda não criou nenhum personagem', 'my.emptyFavorites': 'Não há personagens favoritos', 'my.hintCreated': 'Use o estúdio de personagens com IA para criar um companheiro e sua história.', 'my.hintFavorites': 'Toque no coração de um cartão em Explorar para salvá-lo.', 'my.generate': 'Gerar imagem e fundo do personagem', 'my.explore': 'Explorar personagens', 'my.deleteCreated': 'Excluir personagem criado', 'my.confirmDelete': 'Excluir este personagem?', 'my.warning': 'Esta ação não pode ser desfeita.', 'my.cancel': 'Cancelar', 'my.confirmDeleteButton': 'Excluir permanentemente',
  'generator.close': 'Fechar gerador', 'generator.left': 'Anterior', 'generator.right': 'Próximo', 'generator.allCharacters': 'Todos os personagens',
  'generator.createdCharacters': 'Criados', 'generator.likedCharacters': 'Curtidos', 'generator.noImage': 'Nenhuma imagem disponível', 'generator.vipModeBadge': 'Recurso VIP',
  'create.namePlaceholder': 'Digite um nome para o personagem', 'create.subtitlePlaceholder': 'Uma breve apresentação...',
  'create.descriptionPlaceholder': 'Descreva o passado, os desejos e o cenário do personagem...', 'create.greetingPlaceholder': 'Mensagem inicial do primeiro chat...', 'create.vipExclusive': 'Exclusivo para VIP',
  'notification.all': 'Todos ({{count}})', 'notification.markAllRead': 'Marcar tudo como lido', 'notification.clearAll': 'Limpar todas as notificações',
  'errors.localeNetwork': 'O idioma foi salvo neste dispositivo, mas não foi possível sincronizá-lo com sua conta.',
  'upgrade.monthly': 'Mensal', 'upgrade.annual': 'Anual', 'upgrade.save50': 'Economize 50%', 'upgrade.perMonth': '/ mês',
};

for (const [locale, extension] of [['es', spanishExtension], ['pt', portugueseExtension] ] as const) {
  Object.assign(dictionaries[locale], dictionaries.en, extension, createPublishingTranslations[locale], chatVoicePreviewTranslations[locale]);
  localeKeySets[locale] = new Set(Object.keys(dictionaries[locale]));
}
for (const locale of SUPPORTED_LOCALES) {
  dictionaries[locale]['generator.renderHint'] = generatorRenderHintTranslations[locale];
}

const generatorOptionalPresetTranslations: Record<Locale, string> = {
  en: 'not selected (random)',
  'zh-CN': '未选（随机）',
  ja: '未選択（ランダム）',
  ko: '선택 안 함 (무작위)',
  es: 'sin seleccionar (aleatorio)',
  pt: 'não selecionado (aleatório)',
};
for (const locale of SUPPORTED_LOCALES) {
  dictionaries[locale]['generator.unselected'] = generatorOptionalPresetTranslations[locale];
}

const generatorBalanceTranslations: Record<Locale, MessageMap> = {
  en: {
    'generator.diamondBalance': 'Diamond balance: {{count}}',
    'generator.diamondBalanceLabel': 'Diamond balance',
    'generator.diamonds': 'Diamonds',
    'generator.rechargeDiamonds': 'Recharge diamonds',
    'generator.insufficientDiamonds': 'Not enough diamonds. Required: {{required}}. Current balance: {{available}}. Please recharge first.',
  },
  'zh-CN': {
    'generator.diamondBalance': '钻石余额：{{count}}',
    'generator.diamondBalanceLabel': '钻石余额',
    'generator.diamonds': '钻石',
    'generator.rechargeDiamonds': '充值钻石',
    'generator.insufficientDiamonds': '钻石不足，需要 {{required}}，当前余额 {{available}}。请先充值。',
  },
  ja: {
    'generator.diamondBalance': 'ジェム残高：{{count}}',
    'generator.diamondBalanceLabel': 'ジェム残高',
    'generator.diamonds': 'ジェム',
    'generator.rechargeDiamonds': 'ジェムをチャージ',
    'generator.insufficientDiamonds': 'ジェムが不足しています。必要：{{required}}、残高：{{available}}。先にチャージしてください。',
  },
  ko: {
    'generator.diamondBalance': '보석 잔액: {{count}}',
    'generator.diamondBalanceLabel': '보석 잔액',
    'generator.diamonds': '보석',
    'generator.rechargeDiamonds': '보석 충전',
    'generator.insufficientDiamonds': '보석이 부족합니다. 필요: {{required}}, 현재 잔액: {{available}}. 먼저 충전하세요.',
  },
  es: {
    'generator.diamondBalance': 'Saldo de diamantes: {{count}}',
    'generator.diamondBalanceLabel': 'Saldo de diamantes',
    'generator.diamonds': 'Diamantes',
    'generator.rechargeDiamonds': 'Recargar diamantes',
    'generator.insufficientDiamonds': 'No tienes suficientes diamantes. Necesarios: {{required}}. Saldo actual: {{available}}. Recarga primero.',
  },
  pt: {
    'generator.diamondBalance': 'Saldo de diamantes: {{count}}',
    'generator.diamondBalanceLabel': 'Saldo de diamantes',
    'generator.diamonds': 'Diamantes',
    'generator.rechargeDiamonds': 'Recarregar diamantes',
    'generator.insufficientDiamonds': 'Diamantes insuficientes. Necessários: {{required}}. Saldo atual: {{available}}. Recarregue primeiro.',
  },
};
for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], generatorBalanceTranslations[locale]);
  for (const key of Object.keys(generatorBalanceTranslations[locale])) localeKeySets[locale].add(key);
}

const profileBalanceTranslations: Record<Locale, MessageMap> = {
  en: { 'profile.diamondBalance': 'Diamond balance: {{count}}' },
  'zh-CN': { 'profile.diamondBalance': '钻石余额：{{count}}' },
  ja: { 'profile.diamondBalance': 'ジェム残高：{{count}}' },
  ko: { 'profile.diamondBalance': '보석 잔액: {{count}}' },
  es: { 'profile.diamondBalance': 'Saldo de diamantes: {{count}}' },
  pt: { 'profile.diamondBalance': 'Saldo de diamantes: {{count}}' },
};
for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], profileBalanceTranslations[locale]);
  localeKeySets[locale].add('profile.diamondBalance');
}

const emailVerificationTranslations: Record<Locale, MessageMap> = {
  en: {
    'profile.verificationPending': 'Verify your email to keep your account recovery details current.',
    'profile.resendVerification': 'Resend verification email',
    'profile.resendVerificationCountdown': 'Resend in {{seconds}}s',
    'profile.verificationSending': 'Sending verification email...',
    'profile.verificationEmailSent': 'Verification email sent. Check your inbox.',
    'profile.verificationEmailFailed': 'Could not send a verification email. Try again shortly.',
    'profile.verificationComplete': 'Your email has been verified.',
    'profile.verificationFailed': 'This email verification link is invalid or expired.',
  },
  'zh-CN': {
    'profile.verificationPending': '请验证邮箱，以确保账号找回信息保持最新。',
    'profile.resendVerification': '重新发送验证邮件',
    'profile.resendVerificationCountdown': '{{seconds}} 秒后可重新发送',
    'profile.verificationSending': '正在发送验证邮件...',
    'profile.verificationEmailSent': '验证邮件已发送，请检查收件箱。',
    'profile.verificationEmailFailed': '验证邮件发送失败，请稍后重试。',
    'profile.verificationComplete': '邮箱已验证。',
    'profile.verificationFailed': '此邮箱验证链接无效或已过期。',
  },
  ja: {
    'profile.verificationPending': 'アカウント復旧情報を最新に保つため、メールアドレスを確認してください。',
    'profile.resendVerification': '確認メールを再送する',
    'profile.resendVerificationCountdown': '{{seconds}} 秒後に再送できます',
    'profile.verificationSending': '確認メールを送信中...',
    'profile.verificationEmailSent': '確認メールを送信しました。受信トレイを確認してください。',
    'profile.verificationEmailFailed': '確認メールを送信できませんでした。しばらくしてから再試行してください。',
    'profile.verificationComplete': 'メールアドレスを確認しました。',
    'profile.verificationFailed': 'このメール確認リンクは無効か、有効期限が切れています。',
  },
  ko: {
    'profile.verificationPending': '계정 복구 정보를 최신 상태로 유지하려면 이메일을 인증하세요.',
    'profile.resendVerification': '인증 이메일 다시 보내기',
    'profile.resendVerificationCountdown': '{{seconds}}초 후 다시 보낼 수 있습니다',
    'profile.verificationSending': '인증 이메일을 보내는 중...',
    'profile.verificationEmailSent': '인증 이메일을 보냈습니다. 받은편지함을 확인하세요.',
    'profile.verificationEmailFailed': '인증 이메일을 보내지 못했습니다. 잠시 후 다시 시도하세요.',
    'profile.verificationComplete': '이메일 인증이 완료되었습니다.',
    'profile.verificationFailed': '이 이메일 인증 링크가 유효하지 않거나 만료되었습니다.',
  },
  es: {
    'profile.verificationPending': 'Verifica tu correo para mantener actualizados los datos de recuperación de tu cuenta.',
    'profile.resendVerification': 'Reenviar correo de verificación',
    'profile.resendVerificationCountdown': 'Reenviar en {{seconds}} s',
    'profile.verificationSending': 'Enviando correo de verificación...',
    'profile.verificationEmailSent': 'Correo de verificación enviado. Revisa tu bandeja de entrada.',
    'profile.verificationEmailFailed': 'No se pudo enviar el correo de verificación. Inténtalo de nuevo pronto.',
    'profile.verificationComplete': 'Tu correo ha sido verificado.',
    'profile.verificationFailed': 'Este enlace de verificación no es válido o ha caducado.',
  },
  pt: {
    'profile.verificationPending': 'Verifique seu e-mail para manter os dados de recuperação da conta atualizados.',
    'profile.resendVerification': 'Reenviar e-mail de verificação',
    'profile.resendVerificationCountdown': 'Reenviar em {{seconds}} s',
    'profile.verificationSending': 'Enviando e-mail de verificação...',
    'profile.verificationEmailSent': 'E-mail de verificação enviado. Verifique sua caixa de entrada.',
    'profile.verificationEmailFailed': 'Não foi possível enviar o e-mail de verificação. Tente novamente em breve.',
    'profile.verificationComplete': 'Seu e-mail foi verificado.',
    'profile.verificationFailed': 'Este link de verificação é inválido ou expirou.',
  },
};
for (const locale of SUPPORTED_LOCALES) {
  Object.assign(dictionaries[locale], emailVerificationTranslations[locale]);
  for (const key of Object.keys(emailVerificationTranslations[locale])) localeKeySets[locale].add(key);
}

const membershipBenefitTranslations: Record<Locale, MessageMap> = {
  en: {
    'upgrade.feature.imageAllowance': '{{count}} HD AI image generations',
    'upgrade.feature.videoAllowance': '{{count}} AI video generations',
    'upgrade.feature.voiceAllowance': '{{count}} minutes of voice calls and reading',
  },
  'zh-CN': {
    'upgrade.feature.imageAllowance': '{{count}} 次高清 AI 图片生成',
    'upgrade.feature.videoAllowance': '{{count}} 次 AI 视频生成',
    'upgrade.feature.voiceAllowance': '{{count}} 分钟语音通话与朗读',
  },
  ja: {
    'upgrade.feature.imageAllowance': '{{count}} 回のHD AI画像生成',
    'upgrade.feature.videoAllowance': '{{count}} 回のAI動画生成',
    'upgrade.feature.voiceAllowance': '{{count}} 分の音声通話と読み上げ',
  },
  ko: {
    'upgrade.feature.imageAllowance': '{{count}}회 HD AI 이미지 생성',
    'upgrade.feature.videoAllowance': '{{count}}회 AI 동영상 생성',
    'upgrade.feature.voiceAllowance': '{{count}}분 음성 통화 및 읽기',
  },
  es: {
    'upgrade.feature.imageAllowance': '{{count}} generaciones de imágenes HD con IA',
    'upgrade.feature.videoAllowance': '{{count}} generaciones de vídeo con IA',
    'upgrade.feature.voiceAllowance': '{{count}} minutos de llamadas y lectura por voz',
  },
  pt: {
    'upgrade.feature.imageAllowance': '{{count}} gerações de imagens HD com IA',
    'upgrade.feature.videoAllowance': '{{count}} gerações de vídeo com IA',
    'upgrade.feature.voiceAllowance': '{{count}} minutos de chamadas e leitura por voz',
  },
};

const quickUpgradeTranslations: Record<Locale, MessageMap> = {
  en: {
    'upgrade.quickTitle': 'Unlock premium generation',
    'upgrade.quickTitleCompact': 'Premium access',
    'upgrade.quickDescription': 'Choose a membership to use this premium generation feature. Payment continues securely on our hosted payment page.',
    'generator.vipRequiredTitle': 'Unlock full creative power',
    'generator.vipRequiredTitleCompact': 'Unlock premium tools',
    'generator.vipRequiredDescription': 'Membership unlocks reference image creation, image-to-video, video extension, and advanced generation models.',
    'generator.vipRequiredDescriptionCompact': 'Membership unlocks premium image and video tools.',
    'generator.vipPlansTitle': 'Choose your membership',
    'generator.vipPlansTitleCompact': 'Choose a plan',
    'generator.vipBillingCycle': 'Billing cycle',
    'generator.vipIncludedTitle': 'Plan includes',
    'generator.vipIncludedTitleCompact': 'Includes',
    'generator.keepCreating': 'Keep creating',
    'generator.keepCreatingCompact': 'Continue',
    'generator.upgradeToUnlock': 'Upgrade to unlock',
    'generator.upgradeToUnlockCompact': 'Unlock now',
    'generator.vipFeature4k': '4K generation',
    'generator.vipFeatureImageToImage': 'Image to image',
    'generator.vipFeatureImageToVideo': 'Image to video',
    'generator.vipFeatureExtend': 'Video extension',
  },
  'zh-CN': {
    'upgrade.quickTitle': '开通会员，解锁高级生成',
    'upgrade.quickTitleCompact': '高级会员',
    'upgrade.quickDescription': '该生成能力需要会员权益，选择套餐后将在安全托管收银台完成支付。',
    'generator.vipRequiredTitle': '解锁完整创作能力',
    'generator.vipRequiredTitleCompact': '解锁高级创作',
    'generator.vipRequiredDescription': '会员可解锁参考图创作、图生视频、视频延长和高级生成模型。',
    'generator.vipRequiredDescriptionCompact': '会员可解锁高级图片和视频创作。',
    'generator.vipPlansTitle': '选择会员方案',
    'generator.vipPlansTitleCompact': '选择方案',
    'generator.vipBillingCycle': '计费周期',
    'generator.vipIncludedTitle': '套餐包含',
    'generator.vipIncludedTitleCompact': '套餐包含',
    'generator.keepCreating': '继续创作',
    'generator.keepCreatingCompact': '继续',
    'generator.upgradeToUnlock': '升级会员解锁',
    'generator.upgradeToUnlockCompact': '立即解锁',
    'generator.vipFeature4k': '4K 生成',
    'generator.vipFeatureImageToImage': '图生图',
    'generator.vipFeatureImageToVideo': '图生视频',
    'generator.vipFeatureExtend': '视频延长',
  },
  ja: {
    'upgrade.quickTitle': 'プレミアム生成を利用する',
    'upgrade.quickTitleCompact': 'プレミアムアクセス',
    'upgrade.quickDescription': 'この生成機能には会員資格が必要です。安全なホスト画面で決済できます。',
    'generator.vipRequiredTitle': '創作機能をすべて解放',
    'generator.vipRequiredTitleCompact': 'プレミアム機能を解放',
    'generator.vipRequiredDescription': '会員になると参照画像、画像から動画、動画延長、高度な生成モデルを利用できます。',
    'generator.vipRequiredDescriptionCompact': '会員限定の画像・動画機能を利用できます。',
    'generator.vipPlansTitle': '会員プランを選択',
    'generator.vipPlansTitleCompact': 'プランを選択',
    'generator.vipBillingCycle': '請求周期',
    'generator.vipIncludedTitle': 'プラン内容',
    'generator.vipIncludedTitleCompact': '内容',
    'generator.keepCreating': '創作を続ける',
    'generator.keepCreatingCompact': '続ける',
    'generator.upgradeToUnlock': '会員登録して解放',
    'generator.upgradeToUnlockCompact': '今すぐ解放',
    'generator.vipFeature4k': '4K生成',
    'generator.vipFeatureImageToImage': '画像から画像',
    'generator.vipFeatureImageToVideo': '画像から動画',
    'generator.vipFeatureExtend': '動画延長',
  },
  ko: {
    'upgrade.quickTitle': '프리미엄 생성 잠금 해제',
    'upgrade.quickTitleCompact': '프리미엄 이용',
    'upgrade.quickDescription': '이 생성 기능은 멤버십이 필요합니다. 안전한 호스팅 화면에서 결제하세요.',
    'generator.vipRequiredTitle': '모든 창작 기능 잠금 해제',
    'generator.vipRequiredTitleCompact': '프리미엄 기능 잠금 해제',
    'generator.vipRequiredDescription': '멤버십으로 참조 이미지, 이미지-동영상, 동영상 연장과 고급 생성 모델을 이용하세요.',
    'generator.vipRequiredDescriptionCompact': '멤버십으로 고급 이미지와 동영상 기능을 이용하세요.',
    'generator.vipPlansTitle': '멤버십 플랜 선택',
    'generator.vipPlansTitleCompact': '플랜 선택',
    'generator.vipBillingCycle': '결제 주기',
    'generator.vipIncludedTitle': '플랜 포함 혜택',
    'generator.vipIncludedTitleCompact': '포함 혜택',
    'generator.keepCreating': '계속 만들기',
    'generator.keepCreatingCompact': '계속',
    'generator.upgradeToUnlock': '멤버십으로 잠금 해제',
    'generator.upgradeToUnlockCompact': '지금 잠금 해제',
    'generator.vipFeature4k': '4K 생성',
    'generator.vipFeatureImageToImage': '이미지에서 이미지',
    'generator.vipFeatureImageToVideo': '이미지에서 동영상',
    'generator.vipFeatureExtend': '동영상 연장',
  },
  es: {
    'upgrade.quickTitle': 'Desbloquea la generación premium',
    'upgrade.quickTitleCompact': 'Acceso premium',
    'upgrade.quickDescription': 'Esta función requiere una membresía. El pago continúa de forma segura en nuestra página de pago.',
    'generator.vipRequiredTitle': 'Desbloquea toda la creación',
    'generator.vipRequiredTitleCompact': 'Desbloquea funciones premium',
    'generator.vipRequiredDescription': 'La membresía desbloquea imágenes de referencia, imagen a vídeo, extensión de vídeo y modelos avanzados.',
    'generator.vipRequiredDescriptionCompact': 'La membresía activa las funciones premium de imagen y vídeo.',
    'generator.vipPlansTitle': 'Elige tu membresía',
    'generator.vipPlansTitleCompact': 'Elige un plan',
    'generator.vipBillingCycle': 'Ciclo de facturación',
    'generator.vipIncludedTitle': 'Incluye el plan',
    'generator.vipIncludedTitleCompact': 'Incluye',
    'generator.keepCreating': 'Seguir creando',
    'generator.keepCreatingCompact': 'Continuar',
    'generator.upgradeToUnlock': 'Mejorar para desbloquear',
    'generator.upgradeToUnlockCompact': 'Desbloquear',
    'generator.vipFeature4k': 'Generación 4K',
    'generator.vipFeatureImageToImage': 'De imagen a imagen',
    'generator.vipFeatureImageToVideo': 'De imagen a vídeo',
    'generator.vipFeatureExtend': 'Extensión de vídeo',
  },
  pt: {
    'upgrade.quickTitle': 'Desbloqueie a geração premium',
    'upgrade.quickTitleCompact': 'Acesso premium',
    'upgrade.quickDescription': 'Este recurso exige uma assinatura. O pagamento continua com segurança na nossa página de pagamento.',
    'generator.vipRequiredTitle': 'Desbloqueie todo o poder criativo',
    'generator.vipRequiredTitleCompact': 'Desbloqueie recursos premium',
    'generator.vipRequiredDescription': 'A assinatura libera imagens de referência, imagem para vídeo, extensão de vídeo e modelos avançados.',
    'generator.vipRequiredDescriptionCompact': 'A assinatura libera recursos premium de imagem e vídeo.',
    'generator.vipPlansTitle': 'Escolha sua assinatura',
    'generator.vipPlansTitleCompact': 'Escolha um plano',
    'generator.vipBillingCycle': 'Ciclo de cobrança',
    'generator.vipIncludedTitle': 'O plano inclui',
    'generator.vipIncludedTitleCompact': 'Inclui',
    'generator.keepCreating': 'Continuar criando',
    'generator.keepCreatingCompact': 'Continuar',
    'generator.upgradeToUnlock': 'Assine para desbloquear',
    'generator.upgradeToUnlockCompact': 'Desbloquear',
    'generator.vipFeature4k': 'Geração 4K',
    'generator.vipFeatureImageToImage': 'Imagem para imagem',
    'generator.vipFeatureImageToVideo': 'Imagem para vídeo',
    'generator.vipFeatureExtend': 'Extensão de vídeo',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  const messages = quickUpgradeTranslations[locale];
  Object.assign(dictionaries[locale], messages);
  localeKeySets[locale] = new Set([...localeKeySets[locale], ...Object.keys(messages)]);
}

for (const locale of SUPPORTED_LOCALES) {
  const messages = membershipBenefitTranslations[locale];
  Object.assign(dictionaries[locale], messages);
  localeKeySets[locale] = new Set([...localeKeySets[locale], ...Object.keys(messages)]);
}

const mediaUnlockTranslations: Record<Locale, MessageMap> = {
  en: {
    'mediaUnlock.view': 'Unlock to view', 'mediaUnlock.diamonds': 'diamonds',
    'mediaUnlock.confirmTitle': 'Unlock this media?', 'mediaUnlock.confirmBody': 'This permanently unlocks this item for {{cost}} diamonds.',
    'mediaUnlock.confirm': 'Unlock for {{cost}}', 'mediaUnlock.unlocking': 'Unlocking...',
    'mediaUnlock.failed': 'Could not unlock this media. Please try again.',
    'mediaUnlock.insufficient': 'Not enough diamonds. Required: {{required}}. Current balance: {{current}}.',
  },
  'zh-CN': {
    'mediaUnlock.view': '解锁查看', 'mediaUnlock.diamonds': '钻石',
    'mediaUnlock.confirmTitle': '确认解锁此内容？', 'mediaUnlock.confirmBody': '将扣除 {{cost}} 钻石，此内容解锁后永久可看。',
    'mediaUnlock.confirm': '使用 {{cost}} 钻石解锁', 'mediaUnlock.unlocking': '正在解锁...',
    'mediaUnlock.failed': '解锁失败，请重试。',
    'mediaUnlock.insufficient': '钻石不足，需要 {{required}} 钻石，当前只有 {{current}} 钻石。',
  },
  ja: {
    'mediaUnlock.view': 'ロック解除して見る', 'mediaUnlock.diamonds': 'ダイヤ',
    'mediaUnlock.confirmTitle': 'このメディアを解除しますか？', 'mediaUnlock.confirmBody': '{{cost}} ダイヤを使用すると、このアイテムを永久に閲覧できます。',
    'mediaUnlock.confirm': '{{cost}} ダイヤで解除', 'mediaUnlock.unlocking': '解除中...',
    'mediaUnlock.failed': '解除できませんでした。もう一度お試しください。',
    'mediaUnlock.insufficient': 'ダイヤが不足しています。必要: {{required}}、現在: {{current}}。',
  },
  ko: {
    'mediaUnlock.view': '잠금 해제 후 보기', 'mediaUnlock.diamonds': '다이아',
    'mediaUnlock.confirmTitle': '이 미디어를 잠금 해제할까요?', 'mediaUnlock.confirmBody': '{{cost}} 다이아를 사용하면 이 항목을 영구적으로 볼 수 있습니다.',
    'mediaUnlock.confirm': '{{cost}} 다이아로 해제', 'mediaUnlock.unlocking': '해제 중...',
    'mediaUnlock.failed': '잠금 해제에 실패했습니다. 다시 시도하세요.',
    'mediaUnlock.insufficient': '다이아가 부족합니다. 필요: {{required}}, 현재: {{current}}.',
  },
  es: {
    'mediaUnlock.view': 'Desbloquear para ver', 'mediaUnlock.diamonds': 'diamantes',
    'mediaUnlock.confirmTitle': '¿Desbloquear este contenido?', 'mediaUnlock.confirmBody': 'Desbloquea este elemento para siempre por {{cost}} diamantes.',
    'mediaUnlock.confirm': 'Desbloquear por {{cost}}', 'mediaUnlock.unlocking': 'Desbloqueando...',
    'mediaUnlock.failed': 'No se pudo desbloquear. Inténtalo de nuevo.',
    'mediaUnlock.insufficient': 'Diamantes insuficientes. Necesarios: {{required}}. Saldo actual: {{current}}.',
  },
  pt: {
    'mediaUnlock.view': 'Desbloquear para ver', 'mediaUnlock.diamonds': 'diamantes',
    'mediaUnlock.confirmTitle': 'Desbloquear esta mídia?', 'mediaUnlock.confirmBody': 'Desbloqueia este item permanentemente por {{cost}} diamantes.',
    'mediaUnlock.confirm': 'Desbloquear por {{cost}}', 'mediaUnlock.unlocking': 'Desbloqueando...',
    'mediaUnlock.failed': 'Não foi possível desbloquear. Tente novamente.',
    'mediaUnlock.insufficient': 'Diamantes insuficientes. Necessários: {{required}}. Saldo atual: {{current}}.',
  },
};

for (const locale of SUPPORTED_LOCALES) {
  const messages = mediaUnlockTranslations[locale];
  Object.assign(dictionaries[locale], messages);
  localeKeySets[locale] = new Set([...localeKeySets[locale], ...Object.keys(messages)]);
}

const missingKeys = new Set<string>();

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value === 'zh' || value?.toLowerCase().startsWith('zh')) return 'zh-CN';
  if (value?.toLowerCase().startsWith('ja')) return 'ja';
  if (value?.toLowerCase().startsWith('ko')) return 'ko';
  if (value?.toLowerCase().startsWith('es')) return 'es';
  if (value?.toLowerCase().startsWith('pt')) return 'pt';
  if (value?.toLowerCase().startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

export function initialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved) return normalizeLocale(saved);
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export async function applyLocalePreference(
  locale: Locale,
  setLocale: (next: Locale) => void,
  syncLocale?: (next: Locale) => void | Promise<void>,
) {
  setLocale(locale);
  try {
    await syncLocale?.(locale);
    return true;
  } catch {
    return false;
  }
}

export function formatRelativeTime(value: DateValue, locale: Locale, now = Date.now()) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';

  const deltaSeconds = (timestamp - now) / 1000;
  const absoluteSeconds = Math.abs(deltaSeconds);
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'week', seconds: 604_800 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  const selected = units.find(({ seconds }) => absoluteSeconds >= seconds) || units[units.length - 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(deltaSeconds / selected.seconds),
    selected.unit,
  );
}

function interpolate(value: string, params?: TranslationParams) {
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) => String(params[name] ?? match));
}

export function translate(locale: Locale, key: string, params?: TranslationParams) {
  const hasLocaleMessage = localeKeySets[locale].has(key);
  const message = dictionaries[locale][key] ?? dictionaries.en[key];
  if (!message) {
    if (import.meta.env?.DEV && !missingKeys.has(key)) {
      missingKeys.add(key);
      console.warn(`[i18n] Missing translation key: ${key}`);
    }
    return key;
  }
  if (locale !== 'en' && !hasLocaleMessage && import.meta.env?.DEV) {
    const warningKey = `${locale}:${key}`;
    if (!missingKeys.has(warningKey)) {
      missingKeys.add(warningKey);
      console.warn(`[i18n] Missing ${locale} translation key: ${key}; falling back to English`);
    }
  }
  return interpolate(message, params).replace(/\bmio\b/gi, 'Rulumi').replace(/lurova\.ai/g, 'rulumi.ai');
}

export function registerLocaleMessages(messages: Record<Locale, MessageMap>) {
  for (const locale of SUPPORTED_LOCALES) {
    const additions = messages[locale];
    if (!additions) continue;
    Object.assign(dictionaries[locale], additions);
    for (const key of Object.keys(additions)) localeKeySets[locale].add(key);
  }
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
  formatNumber: (value: number) => string;
  formatDateTime: (value: DateValue, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: DateValue) => string;
  formatRelativeTime: (value: DateValue) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale());
  const [extraLanguage,setExtraLanguage]=useState(()=>{try{return localStorage.getItem(EXTRA_LANGUAGE_KEY)||''}catch{return ''}});
  useEffect(()=>{const sync=()=>setExtraLanguage(localStorage.getItem(EXTRA_LANGUAGE_KEY)||'');window.addEventListener('rulumi-language',sync);return()=>window.removeEventListener('rulumi-language',sync)},[]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = extraLanguage||locale;
  }, [locale,extraLanguage]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key, params) => extraLegacy(extraLanguage,translate(locale, key, params)),
    formatNumber: (number) => new Intl.NumberFormat(locale).format(number),
    formatDateTime: (valueToFormat, options) => new Intl.DateTimeFormat(locale, options).format(new Date(valueToFormat)),
    formatTime: (valueToFormat) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(valueToFormat)),
    formatRelativeTime: (valueToFormat) => formatRelativeTime(valueToFormat, locale),
  }), [locale, setLocale, extraLanguage]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}

export function getLocaleLabel(locale: Locale) {
  return LOCALE_LABELS[locale];
}
