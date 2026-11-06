/** Canned demo replies. These are explicit templates, not open-ended model output. */
export function demoReply(input: string, locale: string) {
  const text = input.trim();
  const ja = locale === 'ja';
  const zh = locale === 'zh-CN';
  const rules: Array<[RegExp, string]> = [
    [/こんにちは|こんばんは|hello|hi\b|嗨|你好|안녕/i, ja ? 'こんにちは。ここはデモの会話です。今日はどんな話にしますか。' : zh ? '你好。这是本地演示对话，不会调用真实模型。' : 'Hello. This is a local demo reply, not a live model.'],
    [/好き|恋愛|デート|love|romance/i, ja ? '甘い話、いいですね。デモでは用意した受け答えだけです。もう少し、その気持ちを聞かせて。' : zh ? '恋爱话题可以用演示回复。我不会真的理解任意句子。' : 'A romance topic matches a prepared demo reply.'],
    [/日常|今日|疲|仕事|day|today/i, ja ? '今日もお疲れさま。デモの定型です。無理に話さなくて大丈夫ですよ。' : zh ? '日常话题命中了演示模板。' : 'An everyday topic matches a prepared demo reply.'],
    [/相談|悲し|辛|癒|listen|sad/i, ja ? '話してくれてありがとう。これはデモの傾聴テンプレートです。急がなくていいです。' : zh ? '这是演示用的倾听模板，不是真实咨询。' : 'This is a prepared listening template, not real support.'],
    [/ファンタジー|魔法|冒険|fantasy|magic/i, ja ? 'ファンタジーの導入テンプレートです。城門の前で、あなたを待っています。' : zh ? '奇幻话题命中了演示模板。' : 'A fantasy topic matches a prepared demo reply.'],
    [/喧嘩|けんか|ライバル|bicker/i, ja ? 'また喧嘩ですか。デモの掛け合いテンプレートです。でも、本当は話したいんですよね。' : zh ? '欢喜冤家话题命中了演示模板。' : 'A bickering-couple topic matches a prepared demo reply.'],
  ];
  const hit = rules.find(([pattern]) => pattern.test(text));
  if (hit) return hit[1];
  if (ja) return 'この入力には用意した返答がありません。デモでは決まった話題だけ返せます。下の話題を押してみてください。';
  if (zh) return '没有匹配的演示模板。这里不能做任意语义理解，请点下面的话题。';
  return 'No prepared demo reply matches that. This preview cannot understand arbitrary text. Try one of the topic buttons.';
}
