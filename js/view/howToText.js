/**
 * 責務: 遊び方の画面の文字（各ページの見出し・印つきの本文の段落・絵の識別子・4ページ目の敵ごとの段、絵の中の文字、ボタンとページ番号の文字）を凍結した定数で持つ。
 * 文章の中の数字は js/rules/config.js の今の値を文字として書いたもので、設定の値を変えたらこの文章も手で直す。
 */

/**
 * 遊び方の絵の識別子の表。値は同じ名前の文字列。howToArt.js がこの表を import して絵の表のキーにする。
 * @type {Readonly<{ welcome: 'welcome', cards: 'cards', battle: 'battle', goblins: 'goblins', giant: 'giant', dragon: 'dragon' }>}
 */
export const HOW_TO_ART_IDS = Object.freeze({
  welcome: 'welcome',
  cards: 'cards',
  battle: 'battle',
  goblins: 'goblins',
  giant: 'giant',
  dragon: 'dragon',
});

/**
 * 遊び方の絵の中の文字。
 * intentAmount は飾りの数字で、js/rules/config.js の巨人の攻撃の量の幅（今は 18〜22）の中の値を文字として書いたもの。
 * 設定の値を変えたら手で直す。
 * @type {Readonly<{ intentAmount: string }>}
 */
export const HOW_TO_ART_LABELS = Object.freeze({
  intentAmount: '20',
});

/**
 * 遊び方の4ページ目の、敵ごとの段。
 * @typedef {Object} HowToEnemyRow
 * @property {string} art 段の左に描く絵の識別子（HOW_TO_ART_IDS の値）。
 * @property {string} name 敵の名前（印は使わない）。
 * @property {readonly string[]} paragraphs 説明の段落（1要素＝1段落。印つき）。
 */

/**
 * 遊び方の1ページ。
 * @typedef {Object} HowToPage
 * @property {string} heading ページの見出し。
 * @property {string|null} art 見出しの下の絵の区画に描く絵の識別子（HOW_TO_ART_IDS の値。絵がなければ null）。
 * @property {readonly string[]} paragraphs 本文の段落（1要素＝1段落。印つき。敵ごとの段のページは空）。
 * @property {readonly Readonly<HowToEnemyRow>[]} rows 敵ごとの段（上から順。なければ空。空でなければ絵の区画と本文の代わりに段を並べる）。
 */

/**
 * 遊び方のページの並び。並び順がそのままページの順で、ページ数は length で数える。
 * ページの追加・削除・並べ替えは、この配列の要素を足す・消す・並べ替えるだけで済む。
 *
 * 印の書き方: 1要素＝1段落で、文の途中で改行しない（画面の幅で自動で折り返す）。
 * 折り返してよい位置は『、』『。』『！』『？』『）』の直後と、`|`（画面に出ない）を入れた位置だけなので、
 * 言葉の切れ目に `|` を入れる（言葉の途中では折り返さない）。
 * `{種類:言葉}` は言葉を種類の色で描く（種類は key・sword・shield・hammer・gold。`{}` の中に `|` は入れない）。
 * `|`・`{`・`}` は文字として出せない。
 * @type {readonly Readonly<HowToPage>[]}
 */
export const HOW_TO_PAGES = Object.freeze([
  Object.freeze({
    heading: 'バトリティアへようこそ！',
    art: HOW_TO_ART_IDS.welcome,
    paragraphs: Object.freeze([
      '{key:ソリティア}で|兵を|集めて、攻めてくる|敵を|倒そう！城の|HP が|0 に|なる前に、すべての|敵を|倒せば|クリアだ！',
    ]),
    rows: Object.freeze([]),
  }),
  Object.freeze({
    heading: '基本はソリティア！',
    art: HOW_TO_ART_IDS.cards,
    paragraphs: Object.freeze([
      '使う|カードの|数字は|{key:1〜7}。山札の|カードを|{key:2回タップ}すると、そのまま|捨て札に|できる。{key:同じ絵柄}で|つなげるほど|ボーナスが|加算されるぞ！',
      '{gold:金貨}が|5 たまる|ごとに、次の|ターンの|アクションポイントが|増える|（最大 +2）。準備が|できたら|{key:「放つ」}で|戦場へ|出撃だ！',
    ]),
    rows: Object.freeze([]),
  }),
  Object.freeze({
    heading: 'いざ、BATTLE!',
    art: HOW_TO_ART_IDS.battle,
    paragraphs: Object.freeze([
      'アクションポイントを|使い切ったら|戦闘だ！まず|{key:敵の攻撃}を|{shield:盾}の兵が|受け止め、次に|{sword:剣}の兵が|攻め、最後に|{hammer:ハンマー}の兵が|城を|直す。',
      '敵の|頭の上には、{key:次の行動の予告}が|出ているぞ。よく見て|備えよう！',
    ]),
    rows: Object.freeze([]),
  }),
  Object.freeze({
    heading: '敵を知れ！',
    art: null,
    paragraphs: Object.freeze([]),
    rows: Object.freeze([
      Object.freeze({
        art: HOW_TO_ART_IDS.goblins,
        name: 'ゴブリンの軍勢',
        paragraphs: Object.freeze([
          '雑魚だ！蹴散らせ！{key:防御してる}|ときが|準備の|チャンス！',
        ]),
      }),
      Object.freeze({
        art: HOW_TO_ART_IDS.giant,
        name: '巨人',
        paragraphs: Object.freeze([
          '数ターン|準備して|大打撃を|繰り出す。{key:防御のタイミング}を|見極めろ！',
        ]),
      }),
      Object.freeze({
        art: HOW_TO_ART_IDS.dragon,
        name: 'ドラゴン',
        paragraphs: Object.freeze([
          '強敵！全力で|立ち向かえ！{key:ブレス}は|積んだ|カードを|燃やすぞ！',
        ]),
      }),
    ]),
  }),
]);

/**
 * 遊び方の画面のボタンとページ番号の文字。
 * @type {Readonly<{ prev: string, next: string, back: string, pageSeparator: string }>}
 */
export const HOW_TO_LABELS = Object.freeze({
  prev: 'まえへ',
  next: 'つぎへ',
  back: 'タイトルへ',
  pageSeparator: ' / ',
});
