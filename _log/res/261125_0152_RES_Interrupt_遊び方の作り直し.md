# RES: 作業計画・作業レポート (Interrupt) : 遊び方の作り直し
* 参照元REQ: `./_log/req/261125_0152_Interrupt_遊び方の作り直し.md`

## 1. 作業目的
タイトル画面から開く「遊び方」（今は文字だけの8ページ）を、短く楽しい雰囲気に作り直す。ページを4つに減らし、語りかける口調の文章（REQ の【遊び方の文章】）に替え、大事な言葉に色を付け、各ページにゲームの絵（今あるスプライトを今ある描く口で描く）を添える。

* ゲームのルール・設定の値（`js/rules/`）は変えない。
* 画面の流れ（タイトル → 遊び方 → タイトル）、ページのめくり方（「まえへ」「つぎへ」「タイトルへ」、← →・Escape、開くたびに1ページ目から、効果音なし）、背景の色、見出し・ページ番号・区切り線・ボタンの見た目は今のまま。`js/scenes/HowToScene.js` は変えない（下の「全体の形」）。
* 本文の文字は 34px・行の間隔 1.5 倍・左右の余白 40px のまま。
* 座標はすべて論理座標（720×1280）。

## 2. アーキテクチャ設計

### 全体の形（新しく作るもの・作り変えるもの）
| ファイル | 層 | 役割 |
| --- | --- | --- |
| `js/view/howToText.js`（更新） | 描画（文字） | 4ページの見出し・本文の段落（印つきの文字列）・絵の識別子・4ページ目の敵ごとの段（絵の識別子・名前・説明の段落）、絵の識別子の表（`HOW_TO_ART_IDS`）、絵の中の文字（予告の札の数字。`HOW_TO_ART_LABELS`）、ボタンとページ番号の文字（`HOW_TO_LABELS`。今のまま）を凍結した定数で持つ。何も import しない。描画・折り返しの処理は書かない |
| `js/view/howToRichText.js`（新規） | 描画（文字の割り付け） | 段落の印（折り返してよい位置 `|`・色を付ける言葉 `{種類:言葉}`）を読み取り、幅に合わせて行に割り付け（区切りのよい位置だけで折り返す・行頭禁止・ぶら下げ・はみ出すときだけ1文字単位）、色の付いた行を描く。何も import しない |
| `js/view/howToArt.js`（新規） | 描画（絵の組み立て） | 遊び方の絵（識別子ごとに、どのスプライトを区画のどこにどの大きさで描くか）を描く（`drawHowToArt(ctx, artId, rect)`）。描く口は `spriteView.js`・`cardView.js`・`troopView.js` の export を呼ぶだけ |
| `js/view/layout.js`（更新。遊び方の配置の部分だけ） | 描画（配置） | `HowToLayout` に、1〜3ページの絵の区画（`art`）、絵の下の本文の範囲（`body`。位置を下げる）、4ページ目の敵ごとの段の並び（`enemyRows(count)`）を足す。`howToHitTest`・ボタン・見出し・ページ番号・区切り線は変えない |
| `js/view/howToView.js`（更新） | 描画（画面） | 遊び方の画面を組み立てて描く。背景・見出し・ページ番号・区切り線・ボタンは今のまま。本文は `howToRichText.js` で割り付けて描き（段落の間を半行空ける）、絵は `howToArt.js` で描き、4ページ目は段ごとに左に絵・右に敵の名前と説明を描く。色の種類 → 色の表（`TONE_COLORS`）を持つ。今の `NO_LINE_START`・`splitUnits`・`wrapParagraph` は `howToRichText.js` に移して消す |

* `js/scenes/HowToScene.js` は変えない（ページの番号・ページ数（`HOW_TO_PAGES.length`）・ボタンとキーの扱いは今のままで足りる。`drawHowTo(ctx, layout, view)` の呼び方も変わらない）。
* `js/view/spriteView.js`・`cardView.js`・`troopView.js`・`suitStyle.js`・`intentView.js`・`troopBakes.js` は読んで export を呼ぶ（import する）だけで変更しない。`js/rules/`・`js/anim/`・`js/audio/`・`js/ui/`・`js/main.js`・`TitleScene.js`・`titleView.js`・`titleText.js`・`oz/`・`index.html`・`assets/`・`_doc/` は変更しない。
* import の向き: `howToView.js` → `howToText.js`・`howToRichText.js`・`howToArt.js`・`cardView.js`（`roundRectPath`。今のまま）・`suitStyle.js`（`SUIT_LOOKS`）。`howToArt.js` → `howToText.js`（`HOW_TO_ART_IDS`・`HOW_TO_ART_LABELS`）・`spriteView.js`・`cardView.js`・`troopView.js`。`howToText.js`・`howToRichText.js` は何も import しない。ルール層・`oz`・anim はどれも import しない。

### 要件1: ページは4つ。文章は【遊び方の文章】のとおり

#### ページのデータの形（`howToText.js`）
```js
/**
 * 遊び方の4ページ目の、敵ごとの段。
 * @typedef {Object} HowToEnemyRow
 * @property {string} art 段の左に描く絵の識別子（HOW_TO_ART_IDS の値）
 * @property {string} name 敵の名前（印は使わない）
 * @property {readonly string[]} paragraphs 説明の段落（1要素＝1段落。印つき）
 */
/**
 * 遊び方の1ページ。
 * @typedef {Object} HowToPage
 * @property {string} heading ページの見出し
 * @property {string|null} art 見出しの下の絵の区画に描く絵の識別子（HOW_TO_ART_IDS の値。絵がなければ null）
 * @property {readonly string[]} paragraphs 本文の段落（1要素＝1段落。印つき。敵ごとの段のページは空）
 * @property {readonly Readonly<HowToEnemyRow>[]} rows 敵ごとの段（上から順。なければ空。空でなければ絵の区画と本文の代わりに段を並べる）
 */
```
* 絵の識別子の表 `HOW_TO_ART_IDS`（凍結）: `welcome`（1ページ目）・`cards`（2ページ目）・`battle`（3ページ目）・`goblins`・`giant`・`dragon`（4ページ目の段）。値は同じ名前の文字列。`howToArt.js` がこの表を import して絵の表のキーにする（識別子の書き間違いを防ぐ）。
* 絵の中の文字の表 `HOW_TO_ART_LABELS`（凍結）: `intentAmount: '20'`（3ページ目の巨人の頭の上の予告の札の数字）。JSDoc に「飾りの数字で、`js/rules/config.js` の巨人の攻撃の量の幅（今は 18〜22）の中の値を文字として書いたもの。設定の値を変えたら手で直す」と書く。
* ページの並び（上から順。`HOW_TO_PAGES`）:

| ページ | heading | art | paragraphs | rows |
| --- | --- | --- | --- | --- |
| 1 | `バトリティアへようこそ！` | `welcome` | 1段落 | 空 |
| 2 | `基本はソリティア！` | `cards` | 2段落 | 空 |
| 3 | `いざ、BATTLE!` | `battle` | 2段落 | 空 |
| 4 | `敵を知れ！` | `null` | 空 | 3段（`goblins`・`ゴブリンの軍勢` ／ `giant`・`巨人` ／ `dragon`・`ドラゴン`。説明は各1段落） |

* 段落の文字列は、REQ の【遊び方の文章】のコードブロック（REQ の 69 行・77〜78 行・86〜87 行・95 行・99 行・103 行）を、**文字を変えずに**（`|`・`{種類:言葉}` の印も含めてそのまま）写す。コードブロックの1行が1段落（1要素）。4ページ目の説明のコードブロックの行頭の字下げ（空白4つ）は Markdown の字下げなので写さない。写す文字列（確認用。REQ と食い違えば REQ を正とする）:
    * 1ページ目: `{key:ソリティア}で|兵を|集めて、攻めてくる|敵を|倒そう！城の|HP が|0 に|なる前に、すべての|敵を|倒せば|クリアだ！`
    * 2ページ目の1段落目: `使う|カードの|数字は|{key:1〜7}。山札の|カードを|{key:2回タップ}すると、そのまま|捨て札に|できる。{key:同じ絵柄}で|つなげるほど|ボーナスが|加算されるぞ！`
    * 2ページ目の2段落目: `{gold:金貨}が|5 たまる|ごとに、次の|ターンの|アクションポイントが|増える|（最大 +2）。準備が|できたら|{key:「放つ」}で|戦場へ|出撃だ！`
    * 3ページ目の1段落目: `アクションポイントを|使い切ったら|戦闘だ！まず|{key:敵の攻撃}を|{shield:盾}の兵が|受け止め、次に|{sword:剣}の兵が|攻め、最後に|{hammer:ハンマー}の兵が|城を|直す。`
    * 3ページ目の2段落目: `敵の|頭の上には、{key:次の行動の予告}が|出ているぞ。よく見て|備えよう！`
    * ゴブリンの軍勢: `雑魚だ！蹴散らせ！{key:防御してる}|ときが|準備の|チャンス！`
    * 巨人: `数ターン|準備して|大打撃を|繰り出す。{key:防御のタイミング}を|見極めろ！`
    * ドラゴン: `強敵！全力で|立ち向かえ！{key:ブレス}は|積んだ|カードを|燃やすぞ！`
* 印の書き方は文章のファイルの中でそのまま使う（置き換えない）。
* 数字（1〜7、5、+2、絵の 20）は `config.js` の今の値を文字として書いたもので、設定の値から組み立てない。先頭の責務のコメントの「設定の値を変えたらこの文章も手で直す」の一言は残す。
* ページ番号はシーンが今のまま `HOW_TO_PAGES.length`（4）で数えて渡すので「1 / 4」〜「4 / 4」になる。
* `HOW_TO_LABELS` は今のまま。

### 要件2・3: 区切りのよい位置だけで折り返す・色を付ける（`howToRichText.js`）

#### 印
* `|`: 折り返してよい位置（画面に出さない）。
* `{種類:言葉}`: 言葉を種類の色で描く。`{`・`}`・`種類:` は画面に出さない。`{}` の中には `|`・`{` を書かない。
* `|`・`{`・`}` は文字として画面に出せない（印専用）。`{}` の外の `:` はふつうの文字。

#### 割り付けの単位
* **字**（`Glyph`）: 1文字ずつ。`{ text: string（1文字）, tone: string|null（色の種類。地の文は null）, w: number（幅） }`。
* **かたまり**（`Chunk`）: 折り返してよい位置で区切った字の並び。かたまりの途中では折り返さない（はみ出すときを除く）。
* 定数（`howToRichText.js` の中。凍結した `Set`。JSDoc 付き）:
    * `NO_LINE_START`（行頭禁止の文字）: `、` `。` `）` `」` `！` `？`（今の4つに `！` `？` を足す）。
    * `BREAK_AFTER`（直後で折り返してよい文字）: `、` `。` `！` `？` `）`。

#### 読み取り（内部の関数 `parseChunks(text, toneColors)` → `Glyph[][]`。幅はまだ 0）
* 状態: できたかたまりの並び、今のかたまり（字の並び）、`breakPending`（次の字の前で区切ってよいか。初めは偽）。
* 字を足す処理 `add(ch, tone)`:
    1. `breakPending` が真で、`ch` が `NO_LINE_START` になく、今のかたまりが空でなければ、今のかたまりを並びに入れて新しいかたまりを始める。
    2. `ch` が `NO_LINE_START` になければ `breakPending` を偽にする（行頭禁止の文字の前では区切らず、区切りをその後ろへ送る。例: `（最大 +2）。準備` は `）` の後でなく `。` の後で区切る）。
    3. 字を今のかたまりに足す。
    4. `ch` が `BREAK_AFTER` にあれば `breakPending` を真にする。
* 文字列を前から1文字ずつ読む（`for...of` でコードポイント単位）:
    * `|` → `breakPending` を真にする（字は足さない）。
    * `{` → 次の `:` までを種類の名前、その後の `}` までを言葉として読み、言葉の各文字を `add(文字, 種類)` で足す（言葉の中では区切りを作らない＝言葉の中の `|` は書かない約束。言葉の最後の文字が `BREAK_AFTER` なら、上の 4. のとおり直後で区切ってよい）。`:` か `}` がない、言葉が空、種類の名前が `toneColors` にない、言葉の中に `|`・`{` があるときは `Error`（`howToRichText: …`）を投げる。
    * `}` → `Error`（対応する `{` がない）。
    * そのほか → `add(文字, null)`。
* 最後に今のかたまりが空でなければ並びに入れる。
* 例: `{key:ソリティア}で|兵を|集めて、攻めてくる|…` → 「ソリティアで」「兵を」「集めて、」「攻めてくる」…。

#### 幅を測る
* 字ごとに `ctx.measureText(字).width`（フォントは地の文 `style.font`、色の言葉 `style.toneFont`。フォントが変わるときだけ `ctx.font` を設定し直す）。
* かたまりの幅 `w` ＝字の幅の和。ぶら下げてよい末尾の幅 `tailW` ＝かたまりの末尾から続く、`NO_LINE_START` か `BREAK_AFTER` にある字の幅の和。

#### 行への割り付け（`wrapRichText` の中）
* 行（字の並びと行の幅 `lineW`）を前から埋める。かたまりごとに:
    1. 行が空、または `lineW + w <= maxW` → 行に足す。
    2. そうでなく、`lineW + w - tailW <= maxW` かつ `lineW + w <= maxW + hangW` → 行に足す（末尾の句読点を右の余白へぶら下げる。今の「収まれば前の行の末尾にぶら下げる」と同じ考え方）。
    3. そうでなければ行を確定し、新しい行をこのかたまりで始める。
    * ただし、かたまりだけで1行に収まらない（`w - tailW > maxW` または `w > maxW + hangW`）ときに限り、このかたまりは**今と同じ1文字単位**で割り付ける: 行が空でなければ先に確定し、かたまりの字を「行頭禁止でない字＋その後に続く行頭禁止の字」の組（今の `splitUnits` と同じ組）にまとめ、組ごとに今の `wrapParagraph` と同じ判定（行が空か収まれば足す／組の最初の字が収まり、組の全体が `maxW + hangW` に収まれば足す（ぶら下げ）／それ以外は行を確定して組で始める）で割り付ける。最後の行は確定せず、次のかたまりがその後ろに続く。今の文章では起きない見込み（下の見積もり）。
    * 空白（` `）はふつうの字として扱う（折り返しの位置にはしない。行頭・行末の空白も消さない）。今の文章の空白は `HP が`・`0 に`・`5 たまる`・`（最大 +2）` の中だけで、どれもかたまりの中にある。
* 割り付けた行は、同じ色の種類が続く字をつないだ **ひと続き**（`RichRun`: `{ text, tone, w }`。`w` は字の幅の和）の並びにして返す。

#### 公開する関数・型（`howToRichText.js`。JSDoc 付き）
```js
/**
 * 本文の見た目。
 * @typedef {Object} RichTextStyle
 * @property {string} font 地の文のフォント
 * @property {string} toneFont 色を付けた言葉のフォント
 * @property {string} color 地の文の色
 * @property {Readonly<Record<string, string>>} toneColors 色の種類 → 色（ここにない種類は印の誤りとして Error）
 */
/** @typedef {{ text: string, tone: string|null, w: number }} RichRun 行の中の、同じ色の種類が続くひと続き */
/** @typedef {{ runs: RichRun[], w: number }} RichLine 割り付けた1行（w は行の幅） */

/** 段落（印つき）を幅 maxW に割り付けた行の並びを返す。ctx のフォントは中で save/restore する。 */
export function wrapRichText(ctx, text, maxW, hangW, style) { … } // → RichLine[]

/** 行の並びを、左端 x、1行目の上端 top から行の高さ lineH ごとに描く（各行の中心 y = top + lineH × (i + 0.5)。左寄せ・textBaseline 'middle'）。ひと続きごとに font・色を変え、x を run.w ずつ進める。save/restore で囲む。 */
export function drawRichLines(ctx, lines, x, top, lineH, style) { … } // → void
```
* 状態は持たない（毎回割り付け直す。今の `wrapParagraph` と同じく `draw` のたびに測る）。オブジェクトはその場で作って返すだけで、モジュールに残さない。

#### 色（`howToView.js`）
* 色の種類 → 色の表（`TONE_COLORS`。凍結。JSDoc 付き）。絵柄の色は `suitStyle.js` の `SUIT_LOOKS` を import して読む（値を書き写さない。`suitStyle.js` は変えない）:
    * `key`: `HEADING_COLOR`（`'#ffe680'`。見出しと同じ黄色）
    * `sword`: `SUIT_LOOKS.sword.color`（`'#d9534f'`）
    * `shield`: `SUIT_LOOKS.shield.color`（`'#4a90d9'`）
    * `hammer`: `SUIT_LOOKS.potion.color`（`'#4cae4c'`。スートの識別子 `potion`＝画面のハンマー）
    * `gold`: `SUIT_LOOKS.muscle.color`（`'#e0a030'`。スートの識別子 `muscle`＝画面の金貨）
* 色を付けた言葉は **太字**（`bold 34px sans-serif`。文字の大きさは本文と同じ 34px）。地の文は今の `34px sans-serif`・`BODY_COLOR`。
* 本文の見た目（`BODY_TEXT_STYLE`。凍結した `RichTextStyle`）: `{ font: BODY_FONT, toneFont: BODY_TONE_FONT, color: BODY_COLOR, toneColors: TONE_COLORS }`。

#### 段落の間
* 段落と段落の間は、行の間隔（34 × 1.5 ＝ 51px）に加えて半行（`BODY_PARAGRAPH_GAP_RATIO` ＝ 0.5 × 行の高さ ＝ 25.5px）空ける。最後の段落の後には空けない。
* ぶら下げてよい幅 `hangW` は今と同じ `BODY_FONT_PX`（34px）。

### 要件4: 各ページに絵を添える（`howToArt.js`）

#### 公開する関数
```js
/**
 * 遊び方の絵を1つ、区画 rect に描く（状態は変えない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} artId 絵の識別子（HOW_TO_ART_IDS の値）
 * @param {import('./layout.js').Rect} rect 絵を描く区画
 * @returns {void}
 * @throws {Error} 未知の識別子のとき
 */
export function drawHowToArt(ctx, artId, rect) { … }
```
* 中は「絵の識別子 → 描く関数」の凍結した表（`ART_DRAWERS`。キーは `HOW_TO_ART_IDS` の値）で引く。各描く関数は `ctx.save()`／`ctx.restore()` で囲む。
* 位置・大きさは、区画 `rect` に対する割合（定数。凍結したオブジェクトにまとめて JSDoc を付ける）で決める（区画の高さを詰めても絵が一緒に縮む）。px の値は区画が 640×320（1〜3ページ）・180×約 301（4ページの段）のときの目安。
* 絵は動かさない（`time` を使わない）。乱数を使わない。

#### 使う描く口（すべて既存の export。変更しない）
* 城・巨人・ドラゴン: `spriteView.js` の `spriteFitRect(id, centerX, footY, height)` で矩形を求め、`drawSpriteFit(ctx, id, rect)` で描く（足元をそろえる）。4ページの段は `drawSpriteFit(ctx, id, 絵の箱)`。敵の絵は左（城の方）を向いて描かれているので、そのまま右に置けば城と向かい合う。
* 兵（攻撃・防御・修理）・ゴブリン: `troopView.js` の `drawTroop(ctx, kind, x, footY, size, 0, 1, 1, 1)`（`kind` は `'attack'`・`'defense'`・`'heal'`・`'goblin'`。傾き 0・濃さ 1・伸び縮み 1）。
* カード: `cardView.js` の `drawCardFace(ctx, x, y, w, h, card)`（盤面と同じ描き方）。
* BATTLE! のロゴ: `spriteView.js` の `drawLogo(ctx, LOGO_IDS.battle, cx, cy, scale)`。
* 予告の札: `cardView.js` の `roundRectPath` で板、`spriteView.js` の `drawIntentIcon(ctx, INTENT_IDS.attack, cx, cy)` で絵、`INTENT_CELL`（絵の枠 40×40）で大きさ、数字は `HOW_TO_ART_LABELS.intentAmount` を縁取りの文字で描く。

#### `drawTroop` が焼き付けのない状態でも直接描けること（計画の時点でコードで確かめた）
* `troopView.js` の `drawTroop` は `findTroopBake(look.bake, size)` を呼び、`null` なら `drawTroopFigure(...)` でスプライトを直接描く（112〜140 行）。
* `troopBakes.js` の `findTroopBake` は、いま使っている入れ物 `current` が `null` なら `null` を返し（104〜107 行）、入れ物があっても `TroopBakeSet.find` は大きさが一致する焼き付け（`|size − 項目の size| <= 1e-6`）がなければ `null` を返す（56〜64 行）。
* 盤面のシーンは `destroy` で入れ物を `dispose()` し、`dispose()` は `current` を `null` に戻す（`troopBakes.js` 77 行）。遊び方の画面はタイトル画面からだけ開くので、ふつうは `current` が `null` で直接描かれる。仮に入れ物が残っていても、盤面の焼き付けの大きさは兵・ゴブリンとも `TROOP_SIZE`（24）で、遊び方の絵の兵・ゴブリンの大きさ（約 59〜64px）と一致しないので、焼き付けは使われず直接描かれる。
* 遊び方の画面・`howToArt.js` からは `createTroopBakes`・`openTroopBakes`・`findTroopBake`・`setTroopBakesEnabled`・`dispose` を呼ばない（焼き付けの資源の作成・破棄に触らない）。

#### 絵の中身（区画 `rect` に対する割合）
**`welcome`（1ページ目。城と兵3体、向かいにドラゴン）**
* 足元の y: `rect.y + rect.h × 0.95`（約 304 下。区画 320 のとき）。
* 城: 高さ `rect.h × 0.82`（約 262）、中心 x `rect.x + rect.w × 0.14`（幅は約 128。区画の左端から約 26〜154）。
* 兵3体: 大きさ `rect.h × 0.2`（約 64）、左から `'heal'`・`'attack'`・`'defense'`、x は `rect.x + rect.w × 0.34`・`0.45`・`0.56`（城の前に並び、盾の兵が一番ドラゴン寄り）。
* ドラゴン: 高さ `rect.h × 0.82`、中心 x `rect.x + rect.w × 0.82`（幅は約 210。区画の左端から約 420〜630）。
* 描く順: 城 → 兵（左から）→ ドラゴン。

**`cards`（2ページ目。盤面の列と同じように重ねた剣の 5・4・3）**
* 札の高さ `rect.h × 0.6`（約 192）、幅は高さ ÷ 1.4（約 137。盤面と同じ縦横比）、重ねのずらし `rect.h × 0.125`（約 40。数字が見える）。
* 3枚の全体（高さ＝札の高さ＋ずらし×2、約 272）を区画の中央（縦横とも）に置く。
* 上から順に `{ id: -1, suit: 'sword', rank: 5 }`・`{ id: -2, suit: 'sword', rank: 4 }`・`{ id: -3, suit: 'sword', rank: 3 }`（凍結した定数 `ART_CARDS`。JSDoc に「絵の飾りの札。ルール層の札ではない（`id` は負の数）。数字は 1〜7 の中で盤面の置き方（ちょうど1つ下）を見せる並び」と書く）を、5 → 4 → 3 の順に、i 枚目を上端 `top + ずらし × i` に描く（後の札が手前に重なる。盤面の列と同じ）。
* スートの識別子 `'sword'` は `suitStyle.js` の `SUIT_LOOKS` のキー（剣の枠と色で描かれる）。ルール層の値は import しない。

**`battle`（3ページ目。上に BATTLE!、下に兵3体と巨人、巨人の頭の上に攻撃の予告の札）**
* ロゴ: 中心 `(rect.x + rect.w / 2, rect.y + rect.h × 0.15)`、倍率 0.7（定数）。今のロゴは 404×106 なので約 283×74。約束の上限（幅 640・高さ 120）でも約 448×84 で、区画の上端から約 6〜90 に収まる。
* 足元の y: `rect.y + rect.h × 0.975`（約 312）。
* 巨人: 高さ `rect.h × 0.53`（約 170）、中心 x `rect.x + rect.w × 0.80`（幅は約 117）。頭の上端は区画の上端から約 142。
* 予告の札: 板の高さ＝`INTENT_CELL.h` ＋上下の余白 2×2（44）、幅＝左右の余白 6×2 ＋ `INTENT_CELL.w` ＋絵と数字の間 4 ＋数字の幅（盤面の札と同じ寸法の考え方）。板の下端を巨人の頭の上端の 6px 上にそろえ（約 92〜136）、横は巨人の中心にそろえる。板の見た目は `intentView.js` のふつうの札に合わせる（塗り `'rgba(20, 24, 36, 0.75)'`・縁 `'rgba(255, 255, 255, 0.7)'`・縁の太さ 2・角の半径 10。数字は `bold 30px sans-serif`・白・縁取り `'#111827'`・縁取りの太さ 6・左寄せ・`textBaseline 'middle'`）。`intentView.js` の定数は export されていないので、`howToArt.js` に同じ値の定数を JSDoc 付きで置く（「盤面の予告の札（`intentView.js`）に似せた見た目」と書く）。
* 兵3体: 大きさ `rect.h × 0.2`（約 64）、左から `'heal'`・`'attack'`・`'defense'`、x は `rect.x + rect.w × 0.14`・`0.27`・`0.40`、足元は巨人と同じ y。
* 描く順: ロゴ → 兵 → 巨人 → 予告の札。
* ロゴの下端（最大 約 90）と札の上端（約 92）が重ならないこと、札が区画の右端を越えないこと（巨人の中心 x 約 512 ± 札の幅の半分 約 45）を確かめる。

**4ページ目の段の絵（`goblins`・`giant`・`dragon`）。区画は段の左の絵の区画（約 180×301）**
* 絵の箱: 横は区画の左右から 12px ずつ内側（幅 約 156）、縦は高さ `min(220, rect.h − 24)` で区画の縦の中央に置く。
* `goblins`: ゴブリン3体（大きさ `箱の幅 × 0.38`、約 59）。奥の2体を x `箱の左端 + 箱の幅 × 0.27`・`0.73`、足元 `箱の上端 + 箱の高さ × 0.62` に、手前の1体を x `箱の左端 + 箱の幅 × 0.5`、足元 `箱の上端 + 箱の高さ × 0.95` に、奥 → 手前の順に描く。
* `giant`: `drawSpriteFit(ctx, SPRITE_IDS.giant, 箱)`（約 152×220）。
* `dragon`: `drawSpriteFit(ctx, SPRITE_IDS.dragon, 箱)`（約 156×194）。

### 要件4（続き）・要件5: 配置（`layout.js` の `createHowToLayout`）

#### 今の値（変えない）
* 画面 720×1280。左右の余白 `HOWTO_PAD_X` 40（中の幅 640）。見出し・ページ番号の中心 y 88、区切り線 y 140。ボタン 高さ 100、下の余白 40 → ボタンの上端 y 1140。本文の下端とボタンの間 `HOWTO_BODY_GAP` 24 → 中身の下端 y 1116。
* `HOWTO_BODY_TOP`（164）は名前を変えず、JSDoc を「遊び方の画面の中身（1〜3ページの絵の区画・4ページの敵ごとの段の並び）の上端 y」に直す。

#### 足す定数（JSDoc 付き。`layout.js` の遊び方の定数の並びに足す）
| 定数 | 値 | 意味 |
| --- | --- | --- |
| `HOWTO_ART_H` | 320 | 1〜3ページの絵の区画の高さ |
| `HOWTO_ART_GAP` | 24 | 絵の区画の下端と本文の上端の間 |
| `HOWTO_ROW_GAP_Y` | 24 | 4ページ目の敵ごとの段の間 |
| `HOWTO_ROW_ART_W` | 180 | 4ページ目の段の左の絵の区画の幅 |
| `HOWTO_ROW_GAP_X` | 16 | 4ページ目の段の絵の区画と文字の範囲の間 |

#### `HowToLayout` の形（足す・変えるところ）
* `art: Rect` … 1〜3ページの絵の区画 `{ x: 40, y: 164, w: 640, h: 320 }`（＝ `HOWTO_PAD_X`・`HOWTO_BODY_TOP`・中の幅・`HOWTO_ART_H`）。
* `body: Rect` … 絵の下の本文の範囲 `{ x: 40, y: 164 + 320 + 24 = 508, w: 640, h: 1116 − 508 = 608 }`（今の `body` の y を下げる。JSDoc を「1〜3ページの本文の範囲（絵の区画の下）」に直す）。
* `enemyRows: function(number): Array<{ art: Rect, text: Rect }>` … 4ページ目の敵ごとの段 `count` 個を、中身の上端（164）から下端（1116）までに、段の間 `HOWTO_ROW_GAP_Y` を空けて同じ高さで上から並べる。段の高さ ＝（952 − 24 ×（count − 1））÷ count（3段で約 301.3）。i 段目の y ＝ 164 ＋（段の高さ＋ 24）× i。`art` ＝ `{ x: 40, y, w: 180, h: 段の高さ }`、`text` ＝ `{ x: 40 + 180 + 16 = 236, y, w: 640 − 196 = 444, h: 段の高さ }`。`count` が 0 以下なら空の配列。呼ぶたびに新しい配列を返す（状態を持たない純粋な関数。`hordeSlots` と同じ形）。
* `heading`・`pageNumber`・`rule`・`prevButton`・`backButton`・`nextButton`・`buttonTextMaxW`・`howToHitTest`・`screen` は変えない。

#### 収まるかの見積もり（要件5）
全角の字を 34px、半角の英字を約 24px、数字を約 19px、空白を約 10px、色を付けた言葉（太字）の半角を 5% 広いとして、上の割り付けの手順で折り返した結果（スクラッチパッドの使い捨てのスクリプトで計算）:

| ページ | 行（｜は行の区切り） | 行数 | 文章の下端 y（範囲の下端 1116） |
| --- | --- | --- | --- |
| 1 | ソリティアで兵を集めて、攻めてくる｜敵を倒そう！城のHP が0 になる前に、｜すべての敵を倒せばクリアだ！ | 3 | 508 + 153 = 661 |
| 2 | 使うカードの数字は1〜7。山札の｜カードを2回タップすると、そのまま｜捨て札にできる。同じ絵柄で｜つなげるほどボーナスが加算されるぞ！／金貨が5 たまるごとに、次のターンの｜アクションポイントが増える（最大 +2）。｜準備ができたら「放つ」で戦場へ出撃だ！ | 4 + 3 | 508 + 357 + 25.5 ≒ 891 |
| 3 | アクションポイントを使い切ったら｜戦闘だ！まず敵の攻撃を盾の兵が｜受け止め、次に剣の兵が攻め、最後に｜ハンマーの兵が城を直す。／敵の頭の上には、次の行動の予告が｜出ているぞ。よく見て備えよう！ | 4 + 2 | 508 + 306 + 25.5 ≒ 840 |
| 4（幅 444） | 雑魚だ！蹴散らせ！｜防御してるときが準備の｜チャンス！ ／ 数ターン準備して大打撃を｜繰り出す。｜防御のタイミングを見極めろ！ ／ 強敵！全力で立ち向かえ！｜ブレスは積んだカードを｜燃やすぞ！ | 各 3 | 段の中: 名前 56 + 3 × 51 = 209（段の高さ 約 301） |

* 端末のフォントで1段落が1行ずつ増えても（2ページ目が 9 行で 508 + 459 + 25.5 ≒ 993、4ページ目の段が4行で 56 + 204 = 260）収まる。絵の区画（164〜484）と本文（508〜）は別の範囲なので重ならない。今の見積もりでは、絵の区画・絵の大きさを詰める必要はなく、文字を縮める・文章を削る必要もない。

### 要件4（続き）: 4ページ目の段の描き方（`howToView.js`）
* `layout.enemyRows(page.rows.length)` の i 段目に `page.rows[i]` を描く。
* 左: `drawHowToArt(ctx, row.art, 段.art)`。
* 右（文字の範囲 `段.text`）: 敵の名前と説明の段落をまとめた塊を、段の縦の中央に置く（塊の高さ＝名前の行の高さ＋説明の行数 × 51 ＋段落の間 × （段落数 − 1）。先に説明を `wrapRichText` で割り付けて行数を数えてから描く）。
    * 敵の名前: `bold 40px sans-serif`・`HEADING_COLOR`（`key` と同じ黄色）・左寄せ、最大の幅 `段.text.w`、行の高さ 56（40 × 1.4。定数 `ENEMY_NAME_FONT_PX`・`ENEMY_NAME_LINE_RATIO`）。本文より大きく太い黄色で目立たせる。印は使わない（`fillText` でそのまま描く）。
    * 説明: 本文と同じ見た目（`BODY_TEXT_STYLE`・行の高さ 51・`hangW` 34・段落の間 25.5）で、幅 `段.text.w` に割り付けて名前の行の下から描く。

### `howToView.js` の描く順（`drawHowTo`）
1. 背景（今のまま）→ 見出し（今のまま）→ ページ番号（今のまま）→ 区切り線（今のまま）。
2. `page.rows.length > 0` なら、4ページ目の段の描き方で描く。
3. そうでなければ、`page.art !== null` なら `drawHowToArt(ctx, page.art, howToLayout.art)`。次に本文の段落を `howToLayout.body` の左上から、段落ごとに `wrapRichText(ctx, 段落, body.w, BODY_FONT_PX, BODY_TEXT_STYLE)` → `drawRichLines(ctx, 行, body.x, y, lineH, BODY_TEXT_STYLE)` で描き、y を「行数 × lineH ＋段落の間」ずつ進める。
4. ボタン3つ（今のまま）。
* 段落を描く処理（左上と幅を受けて段落の並びを描き、使った高さを返す）と、塊の高さを数える処理は `howToView.js` の内部の関数（JSDoc 付き）にする。4ページ目の段の描き方も内部の関数にする。
* 先頭の責務（3行以内）を「遊び方の画面（背景・見出し・ページ番号・区切り線・絵・色付きの本文・4ページ目の敵ごとの段・まえへ／タイトルへ／つぎへのボタン）を組み立てて描く。状態は変えず、座標は配置（HowToLayout）からだけ読む。本文の割り付けは howToRichText.js、絵は howToArt.js」の趣旨に書き直す。

### 要件6: 今と同じく使えること
* シーン（`HowToScene.js`）・タイトル画面・`main.js` を変えないので、画面の流れ・ボタン・キー・盤面へ進むこと・決着の後に遊び方を開けることは今のまま。
* 盤面の兵の描き方（`troopView.js`・`troopBakes.js`）は変えないので、盤面の兵の見た目（焼き付けで描く・描かない）も今のまま。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./js/view/` - 描画の部品と画面の配置（遊び方の画面の文字・本文の割り付け・絵・配置・画面の組み立て）
*   **関連する論理クラス**:
    *   `howToText.js`（更新）: `HOW_TO_PAGES`（`HowToPage`・`HowToEnemyRow`）・`HOW_TO_ART_IDS`（新）・`HOW_TO_ART_LABELS`（新）・`HOW_TO_LABELS`
    *   `howToRichText.js`（新規）: `wrapRichText`・`drawRichLines`・`RichTextStyle`・`RichRun`・`RichLine`
    *   `howToArt.js`（新規）: `drawHowToArt`
    *   `layout.js`（更新）: `createHowToLayout`・`HowToLayout`（`art`・`body`・`enemyRows`）
    *   `howToView.js`（更新）: `drawHowTo`・`HowToViewState`（変えない）
    *   読むだけ（変更しない）: `spriteView.js`・`cardView.js`・`troopView.js`・`suitStyle.js`・`intentView.js`・`troopBakes.js`・`js/scenes/HowToScene.js`

### 参照する責務
*   憲法3章: ルールと画面の分離（画面の側にルールの判定や計算を書かない。遊び方の数字は文字・飾りとして持つだけ）、調整値の一元化（ルールの数値を設定の値から組み立てず、文字として書く例外は REQ の許可による）、ロジックと描画の分離（`draw` の中で状態を変えない）、Canvas 状態の保護（`ctx` を変える描画は `save`／`restore`）、時間の受け渡し（絵は止まった絵。`performance.now()` などを使わない）、基礎処理の直書き禁止（`requestAnimationFrame`・`addEventListener`・`getContext` を書かない）、グローバル汚染の禁止、ファイル先頭の責務（3行以内）とその逸脱の禁止、JSDoc の義務。
*   `js/view/`（4章の表）: 書いてよいこと「カード・山札・列・ゲージ・城・敵・兵などの描き方、画面の配置（座標と大きさ）…と、座標から『何に当たるか』を求めること」。書いたら責務違反「ゲームの状態を変えること、ルールの判定、時間で進む動き（`anim` に置く）、`Sound` の import」。
*   `js/view/howToText.js`（作成済みのファイル）: 遊び方の画面の文字（各ページの見出しと本文の行・ボタンとページ番号の文字）を凍結した定数で持つ。文章の中の数字は `js/rules/config.js` の今の値を文字として書いたもので、設定の値を変えたらこの文章も手で直す。ページの追加・削除・並べ替えもこのファイルだけで済む。
*   `js/view/howToView.js`（作成済みのファイル）: 遊び方の画面の描画（暗い背景・見出し・ページ番号・区切り線・本文の折り返し（行頭禁止の文字のぶら下げを含む）・まえへ／タイトルへ／つぎへのボタン（押せないときは薄く））。
*   `js/view/layout.js`（作成済みのファイルの一部）: 遊び方の画面の配置と当たり（`createHowToLayout`・`howToHitTest`）。
*   `js/view/spriteView.js`（読むだけ）: スプライトの識別子の表（`SPRITE_IDS`）・ロゴ（`LOGO_IDS`・`drawLogo`）・予告の絵（`INTENT_IDS`・`drawIntentIcon`・`INTENT_CELL`）・絵の範囲を矩形に収める（`drawSpriteFit`・`spriteFitRect`）。`assets/sprites/` を import するのはここだけ。
*   `js/view/cardView.js`（読むだけ）: カード面（`drawCardFace`）・角丸パス（`roundRectPath`）。
*   `js/view/troopView.js`（読むだけ）: 兵1体の描画（`drawTroop`。焼き付けで描くか直接描くかの描き分けはここ1か所）。
*   `js/view/troopBakes.js`（読むだけ。呼ばない）: 焼き付けの入れ物は盤面のシーンが作り・手放す。
*   `js/view/suitStyle.js`（読むだけ）: スートの見た目（`SUIT_LOOKS` の色）。
*   `js/scenes/HowToScene.js`（変えない）: 今のページの番号を持ち、ボタンと ← →・Escape でページを移る・タイトル画面へ戻る。描くのは `howToView.js`。効果音は鳴らさない。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   3章「起動と画面の流れ」: 遊び方の画面（HOWTO）の「8ページ」を「4ページ」にする。
*   4章「作成済みのファイル」の `js/view/howToText.js` の行: 「各ページの見出しと本文の段落（印つき。折り返してよい位置 `|`・色を付ける言葉 `{種類:言葉}`。種類は `key`・`sword`・`shield`・`hammer`・`gold`）・見出しの下の絵の識別子・4ページ目の敵ごとの段（絵の識別子・名前・説明）、絵の識別子の表（`HOW_TO_ART_IDS`）、絵の中の文字（予告の札の数字 `HOW_TO_ART_LABELS`。設定の値を変えたら手で直す）、ボタンとページ番号の文字。何も import しない」の趣旨に直す。
*   4章の `js/view/howToView.js` の行: 「遊び方の画面の組み立てと描画（暗い背景・見出し・ページ番号・区切り線・絵（`howToArt.js`）・色付きの本文（`howToRichText.js` で割り付け。段落の間は半行）・4ページ目の敵ごとの段（左に絵、右に敵の名前（太字・黄色）と説明）・ボタン（押せないときは薄く））。色の種類 → 色の表（`TONE_COLORS`。絵柄の色は `suitStyle.js` の `SUIT_LOOKS` を読む）を持つ」の趣旨に直す。
*   4章に `js/view/howToRichText.js` の行を足す: 「遊び方の本文の印（`|`・`{種類:言葉}`）を読み取り、幅に合わせて行に割り付け（句読点の後と `|` でだけ折り返す・行頭禁止・句読点のぶら下げ・1行を超えるかたまりだけ1文字単位）、色の付いた行を描く（`wrapRichText`・`drawRichLines`）。状態を持たず、何も import しない」。
*   4章に `js/view/howToArt.js` の行を足す: 「遊び方の絵（城と兵とドラゴン・剣の 5・4・3 の札・BATTLE! と兵と巨人と予告の札・ゴブリン3体・巨人・ドラゴン）を、識別子（`howToText.js` の `HOW_TO_ART_IDS`）ごとに区画に対する割合で組み立てて描く（`drawHowToArt`）。描く口は `spriteView.js`・`cardView.js`・`troopView.js` の export だけ。兵・ゴブリンは `drawTroop` で描くが、焼き付けの資源には触れない（大きさが盤面と違うので直接描かれる）。止まった絵で、状態は変えない」。
*   4章の `js/view/layout.js` の行: 「遊び方の画面の配置と当たり（`createHowToLayout`・`howToHitTest`）」を「遊び方の画面の配置（見出し・ページ番号・区切り線・1〜3ページの絵の区画 `art`・その下の本文の範囲 `body`・4ページ目の敵ごとの段の並び `enemyRows(count)`（左の絵の区画と右の文字の範囲）・ボタン）と当たり（`howToHitTest`）」の趣旨に直す。

## 3. タスクリスト
各タスクに共通の作業（タスクごとに必ず行う）:
* コード修正の後、JSDoc の記載漏れがないことを確かめる（新しいファイルの先頭には責務を3行以内で書く。既存のファイルの先頭の責務が変わる場合は3行以内で書き直す）。
* 変更した .js ファイルの構文チェック（`node --input-type=module --check < <ファイル>`）を行う。
* 本 RES の「4. 詳細作業内容」の該当タスクを記載し、タスクを [x] にする。
* 開発資料の記載に影響が出る場合は、資料本体は直さず、「開発資料の更新予定」欄に追記する。

*   [x] タスク1: 遊び方の文章と絵の識別子（`howToText.js`）
    *   **対象ファイル** :
        *   `./js/view/howToText.js` :（更新）
    *   **作業内容** :
        *   2章 要件1「ページのデータの形」のとおり、`HowToEnemyRow`・`HowToPage` の typedef（`art`・`rows` を足し、`paragraphs` の説明を「1要素＝1段落。印つき」に直す）、`HOW_TO_ART_IDS`（凍結。JSDoc 付き）、`HOW_TO_ART_LABELS`（凍結。JSDoc に飾りの数字であることと「設定の値を変えたら手で直す」）を書く。
        *   `HOW_TO_PAGES` を4ページに置き換える。見出し・段落は REQ の【遊び方の文章】から文字を変えずに写す（2章の「写す文字列」。REQ を正とする）。各ページ・各段・各 `paragraphs`・`rows` を `Object.freeze` する。
        *   `HOW_TO_PAGES` の JSDoc に印の書き方を書く: 「1要素＝1段落で、文の途中で改行しない（画面の幅で自動で折り返す）。折り返してよい位置は『、』『。』『！』『？』『）』の直後と、`|`（画面に出ない）を入れた位置だけなので、言葉の切れ目に `|` を入れる（言葉の途中では折り返さない）。`{種類:言葉}` は言葉を種類の色で描く（種類は `key`・`sword`・`shield`・`hammer`・`gold`。`{}` の中に `|` は入れない）。`|`・`{`・`}` は文字として出せない」。並び順がページの順で、ページ数は `length` で数えること、ページの足し引き・並べ替えはこの配列だけで済むことは今の JSDoc のまま残す。
        *   先頭の責務（3行以内）を「遊び方の画面の文字（各ページの見出し・印つきの本文の段落・絵の識別子・4ページ目の敵ごとの段、絵の中の文字、ボタンとページ番号の文字）を凍結した定数で持つ」の趣旨に直し、「文章の中の数字は js/rules/config.js の今の値を文字として書いたもので、設定の値を変えたらこの文章も手で直す」の一言は残す。何も import しない。描画・折り返しの処理は書かない。
        *   `HOW_TO_LABELS` は変えない。
        *   この時点では `howToView.js` は今のまま `paragraphs` を描く（印がそのまま見え、4ページ目は見出しだけになる）。タスク5で直る。

*   [x] タスク2: 印の読み取りと行への割り付け（`howToRichText.js`）
    *   **対象ファイル** :
        *   `./js/view/howToRichText.js` :（新規）
    *   **作業内容** :
        *   2章 要件2・3「印」「割り付けの単位」「読み取り」「幅を測る」「行への割り付け」「公開する関数・型」のとおりに書く。定数 `NO_LINE_START`・`BREAK_AFTER`（凍結した `Set`）、typedef `RichTextStyle`・`RichRun`・`RichLine`（と内部の `Glyph`）、内部の関数（印の読み取り、幅を測る、1文字単位の割り付け、ひと続きへのまとめ）、export の `wrapRichText(ctx, text, maxW, hangW, style)`・`drawRichLines(ctx, lines, x, top, lineH, style)` をすべて JSDoc 付きで書く。
        *   `ctx` のフォント・色・揃えを変える処理は `save`／`restore` で囲む。状態（モジュールの変数）を持たない。何も import しない。
        *   先頭の責務（3行以内）: 「遊び方の本文の印（折り返してよい位置 `|`・色を付ける言葉 `{種類:言葉}`）を読み取り、幅に合わせて行に割り付け（句読点の後と `|` でだけ折り返す・行頭禁止・ぶら下げ）、色の付いた行を描く。状態を持たない」の趣旨。
        *   確認: スクラッチパッドに使い捨てのスクリプトを置き（リポジトリに残さない）、`howToRichText.js` と `howToText.js` を `.mjs` に写して import し、`measureText` が全角 34・半角 英字 24・数字 19・空白 10 を返す偽の `ctx`（`font`・`save`・`restore` を持つもの）で、4ページ分の全段落を `wrapRichText`（幅 640 と 444、`hangW` 34）にかけ、(1) 印の誤りの `Error` が出ないこと、(2) 行の文字をつなぐと印を除いた段落と一致すること、(3) 行頭に `NO_LINE_START` の字がないこと、(4) 行の区切りが `BREAK_AFTER` の字の後か `|` の位置だけであること、(5) 行数が 2章「収まるかの見積もり」の表と合うこと、(6) `{key:…}` などの色の言葉が正しい `tone` のひと続きになること を確かめ、結果を「4. 詳細作業内容」に書く。加えて、わざと長いかたまり（`|` のない 30 文字の段落）で1文字単位に戻ること、`{unknown:語}`・閉じない `{` で `Error` になることも確かめる。

*   [x] タスク3: 遊び方の絵（`howToArt.js`）
    *   **対象ファイル** :
        *   `./js/view/howToArt.js` :（新規）
    *   **作業内容** :
        *   2章 要件4「公開する関数」「使う描く口」「絵の中身」のとおり、`drawHowToArt(ctx, artId, rect)` と、識別子ごとの描く関数（`welcome`・`cards`・`battle`・`goblins`・`giant`・`dragon`）、絵の表 `ART_DRAWERS`（キーは `howToText.js` の `HOW_TO_ART_IDS` の値。未知の識別子は `Error`）、位置・大きさの割合の定数（絵ごとに凍結したオブジェクトにまとめる）、飾りの札 `ART_CARDS`、予告の札の見た目の定数、ロゴの倍率の定数を JSDoc 付きで書く。
        *   import は `./howToText.js`（`HOW_TO_ART_IDS`・`HOW_TO_ART_LABELS`）、`./spriteView.js`（`SPRITE_IDS`・`LOGO_IDS`・`INTENT_IDS`・`INTENT_CELL`・`spriteFitRect`・`drawSpriteFit`・`drawLogo`・`drawIntentIcon`）、`./cardView.js`（`drawCardFace`・`roundRectPath`）、`./troopView.js`（`drawTroop`）だけ。ルール層・`oz`・anim・`troopBakes.js` は import しない（焼き付けの資源に触れない）。
        *   各描く関数を `ctx.save()`／`ctx.restore()` で囲む。時間・乱数を使わない。状態を変えない。
        *   先頭の責務（3行以内）: 「遊び方の絵（識別子ごとに、どのスプライトを区画のどこにどの大きさで描くか）を組み立てて描く。描く口は spriteView.js・cardView.js・troopView.js の export だけで、焼き付けの資源には触れない。止まった絵で、状態は変えない」の趣旨。
        *   確認: 2章の「絵の中身」の割合から、区画 640×320 と 180×301.3 での各絵の矩形を計算し（スクラッチパッドの使い捨てのスクリプトか手計算。スプライトの範囲は `spriteView.js` の `SPRITE_TABLE` の値を写す）、絵が区画からはみ出さないこと、3ページ目のロゴ（約束の上限 640×120 で倍率 0.7）と予告の札が重ならないこと、1ページ目・3ページ目の兵と城・敵が重ならないことを「4. 詳細作業内容」に書く。

*   [x] タスク4: 遊び方の配置（`layout.js`）
    *   **対象ファイル** :
        *   `./js/view/layout.js` :（更新。遊び方の画面の配置の部分だけ）
    *   **作業内容** :
        *   2章「要件4（続き）・要件5: 配置」のとおり、定数 `HOWTO_ART_H`・`HOWTO_ART_GAP`・`HOWTO_ROW_GAP_Y`・`HOWTO_ROW_ART_W`・`HOWTO_ROW_GAP_X` を JSDoc 付きで遊び方の定数の並びに足し、`HOWTO_BODY_TOP` の JSDoc を直す（名前と値は変えない）。
        *   `HowToLayout` の typedef に `art`（Rect）と `enemyRows`（`function(number): Array<{ art: Rect, text: Rect }>`）を足し、`body` の説明を直す。
        *   `createHowToLayout` で `art`・`body`（y を絵の区画の下へ）・`enemyRows`（内部の関数。JSDoc 付き。純粋で、呼ぶたびに新しい配列）を作って返す。ボタン・見出し・ページ番号・区切り線・`howToHitTest` は変えない。
        *   遊び方の画面の配置の部分以外（盤面・タイトル画面・結果の表示の配置）は変えない。

*   [ ] タスク5: 遊び方の画面の組み立て（`howToView.js`）
    *   **対象ファイル** :
        *   `./js/view/howToView.js` :（更新）
    *   **作業内容** :
        *   2章「色」「段落の間」「`howToView.js` の描く順」「4ページ目の段の描き方」のとおりに `drawHowTo` を書き直す。背景・見出し・ページ番号・区切り線・ボタン（`drawButton`）とその定数・`HowToViewState` は変えない。
        *   定数を足す（JSDoc 付き）: `BODY_TONE_FONT`（`bold ${BODY_FONT_PX}px sans-serif`）・`BODY_PARAGRAPH_GAP_RATIO`（0.5）・`TONE_COLORS`（凍結。`HEADING_COLOR` と `SUIT_LOOKS` から）・`BODY_TEXT_STYLE`（凍結）・`ENEMY_NAME_FONT_PX`（40）・`ENEMY_NAME_FONT`・`ENEMY_NAME_LINE_RATIO`（1.4）。`BODY_FONT_PX`（34）・`BODY_LINE_RATIO`（1.5）は変えない。
        *   `NO_LINE_START`・`splitUnits`・`wrapParagraph` を消す（`howToRichText.js` に移した）。段落を描く内部の関数・塊の高さを数える内部の関数・4ページ目の段を描く内部の関数を JSDoc 付きで書く。
        *   import に `./suitStyle.js`（`SUIT_LOOKS`）・`./howToRichText.js`（`wrapRichText`・`drawRichLines`）・`./howToArt.js`（`drawHowToArt`）を足す。`./cardView.js` の `roundRectPath`・`./howToText.js` の `HOW_TO_PAGES`・`HOW_TO_LABELS` は今のまま。
        *   `ctx` を変える描画は `save`／`restore` で囲む。状態を変えない。座標は `HowToLayout` からだけ読む。
        *   先頭の責務（3行以内）を2章「`howToView.js` の描く順」の最後のとおりに書き直す。

*   [ ] タスク6: JSDoc・構文チェック・決まりの通しの確認
    *   **対象ファイル** :
        *   （確認のみ。直すところが見つかったら、タスク1〜5の対象ファイルの中で直す）
    *   **作業内容** :
        *   タスク1〜5で変えた・作ったファイル（`howToText.js`・`howToRichText.js`・`howToArt.js`・`layout.js`・`howToView.js`）の JSDoc の記載漏れ（関数・定数・typedef・先頭の責務（3行以内））がないことを確かめる。
        *   5つのファイルの構文チェック（`node --input-type=module --check < <ファイル>`）が通ることを確かめる。
        *   5つのファイルに `addEventListener`・`requestAnimationFrame`・`getContext`・`setTimeout`・`setInterval`・`performance.now`・`Date.now`・`Math.random`・`window.`・`oz/src`・`'oz'` の import・`js/rules/` の import・`troopBakes` の import がないことを grep で確かめる。
        *   `git status`（読むだけ）で、変わったファイルがタスク1〜5の対象ファイルと本 RES だけであること（`HowToScene.js`・`spriteView.js`・`cardView.js`・`troopView.js`・`suitStyle.js`・`intentView.js`・`troopBakes.js`・`js/rules/`・`assets/` などが変わっていないこと）を確かめる。
        *   タスク2の確認のスクリプトを、タスク5の後の `howToText.js` でもう一度通し、行数が 2章の見積もりと合うことを「4. 詳細作業内容」に書く。
        *   結果を「4. 詳細作業内容」に書く。

*   [ ] タスク7: 開発資料（`PROJECT_ARCHITECTURE.md`）への反映（固定タスク）
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` :（更新）
    *   **作業内容** :
        *   2章「開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定」と、各タスクで追記された項目を確かめ、資料へ反映する（3章の画面の流れの「8ページ」→「4ページ」、4章の `howToText.js`・`howToView.js`・`layout.js` の行の書き直し、`howToRichText.js`・`howToArt.js` の行の追加）。
        *   ※ 実装AIによる開発資料の書き換えは原則禁止だが、このタスクだけは明示的な例外とする（後続タスクがなく、資料の変更で他タスクの前提が動く危険がないため）。タスク1〜6の中では資料を書き換えない。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: 遊び方の文章と絵の識別子（`howToText.js`）
*   **作業内容** :
    *   `js/view/howToText.js` を更新。先頭の責務を新しい趣旨に書き直し（数字は手で直す旨は残した）、`HOW_TO_ART_IDS`・`HOW_TO_ART_LABELS`（`intentAmount: '20'`）・`HowToEnemyRow`・`HowToPage` の typedef を足し、`HOW_TO_PAGES` を4ページ（見出し・art・paragraphs・rows）に置き換えた。段落の文字列は REQ のコードブロックから `|`・`{種類:言葉}` も含めそのまま写した。各ページ・段・paragraphs・rows を `Object.freeze`。JSDoc に印の書き方を記載。`HOW_TO_LABELS` は変更なし。何も import していない。
    *   構文チェック（`node --input-type=module --check`）は通った。`howToView.js` は未変更のため、印がそのまま見え4ページ目は見出しだけになる（タスク5で直る）。

### タスク2: 印の読み取りと行への割り付け（`howToRichText.js`）
*   **作業内容** :
    *   `js/view/howToRichText.js` を新規作成（何も import しない・モジュールの状態なし）。`NO_LINE_START`・`BREAK_AFTER`（凍結 `Set`）、typedef `RichTextStyle`・`RichRun`・`RichLine`・`Glyph`、内部関数 `parseChunks`・`measureGlyphs`・`sumWidth`・`tailWidth`・`splitUnits`・`toLine`、export の `wrapRichText`・`drawRichLines` を JSDoc 付きで書いた。幅を測る処理は `ctx.save()`／`restore()` で囲み、`drawRichLines` も `save`／`restore` で囲む。
    *   構文チェック（`node --input-type=module --check`）は通った。
    *   確認（スクラッチパッドの使い捨てスクリプト。リポジトリには残していない。偽 ctx: 全角 34・英字 24・数字 19・空白 10・その他半角 19、太字の半角は 5% 増し）: 4ページ全段落（幅 640 と 444、hangW 34）で (1) 印の Error なし、(2) 行をつなぐと印を除いた段落と一致、(3) 行頭に `NO_LINE_START` の字なし、(4) 行の区切りは `BREAK_AFTER` の後か `|` の位置のみ、(5) 行数は 1ページ目 3／2ページ目 4＋3／3ページ目 4＋2／4ページ目 各 3 で 2章の表と一致、(6) `key`・`gold`・`shield`・`sword`・`hammer` の言葉が正しい `tone` のひと続きになる、をすべて確認。`|` のない 30 文字の段落は 2 行（612・408）に1文字単位で割り付けられた。`{unknown:語}`・閉じない `{`・対応のない `}`・空の言葉・`{}` 中の `|` はいずれも Error。

### タスク3: 遊び方の絵（`howToArt.js`）
*   **作業内容** :
    *   `js/view/howToArt.js` を新規作成。import は `howToText.js`・`spriteView.js`・`cardView.js`・`troopView.js` だけ（`troopBakes.js`・ルール層・`oz` は import していない）。`drawHowToArt(ctx, artId, rect)`、描く関数（`drawWelcome`・`drawCards`・`drawBattle`・`drawGoblins`・`drawGiant`・`drawDragon`。各 `save`／`restore`）、凍結した表 `ART_DRAWERS`（キーは `HOW_TO_ART_IDS`。未知の識別子は `Error`）、割合の定数（`WELCOME`・`CARDS`・`BATTLE`・`BATTLE_LOGO_SCALE`・`ROW_BOX`・`GOBLINS`）、`ART_CARDS`、`INTENT_PLATE`（`intentView.js` に似せた見た目）を JSDoc 付きで書いた。予告の札の数字の幅は `measureText` で測って板の幅を決める（時間・乱数は使わない）。
    *   構文チェック（`node --input-type=module --check`）は通った。
    *   確認（手計算。区画 640×320、スプライト範囲は `SPRITE_TABLE` の値）: welcome は城 約 128×262（x 25〜154）、兵（大きさ 64）x 218・288・358（左右 ±32 で 186〜390）、ドラゴン 約 211×262（x 420〜630）で、区画内・城と兵（154 < 186）・兵とドラゴン（390 < 420）は重ならない。cards は札 137×192、全体 272 で縦横とも中央（上端 24）。battle はロゴ 約 283×74（上限 640×120 でも 448×84、中心 y 48 で y 6〜90）、巨人 約 117×170（x 454〜570、頭の上端 y 142）、札は高さ 44・下端 136・上端 92 でロゴの下端（最大 90）と重ならず、幅 約 90（x 467〜557）で右端を越えない。兵は x 90・173・256（右端 288）で巨人（左端 454）と重ならない。4ページの段の箱（区画 180×301 → 箱 156×220）: giant 152×220、dragon 156×194、ゴブリン（大きさ 59）は箱内に収まる。

### タスク4: 遊び方の配置（`layout.js`）
*   **作業内容** :
    *   `js/view/layout.js` の遊び方の部分だけ更新。定数 `HOWTO_ART_H`（320）・`HOWTO_ART_GAP`（24）・`HOWTO_ROW_GAP_Y`（24）・`HOWTO_ROW_ART_W`（180）・`HOWTO_ROW_GAP_X`（16）を JSDoc 付きで足し、`HOWTO_BODY_TOP` の JSDoc を直した（名前・値は不変）。`HowToLayout` の typedef に `art`・`enemyRows` を足し `body` の説明を直した。`createHowToLayout` に内部関数 `enemyRows(count)`（純粋・呼ぶたびに新しい配列・count が 0 以下なら空）を足し、`art`・`body`（y を 508 に下げた）・`enemyRows` を返す。ボタン・見出し・ページ番号・区切り線・`howToHitTest` は未変更。
    *   構文チェック（`node --input-type=module --check`）は通った。実行での値確認は `spriteView.js` が import map の `assets` を使うため Node 単体では不可。手計算: art `{40,164,640,320}`、body `{40,508,640,608}`（下端 1116）、3段のとき段の高さ (952−48)/3 ≒ 301.33、段 y は 164・489.33・814.67、art 幅 180、text `{x:236, w:444}`。

### タスク5: 遊び方の画面の組み立て（`howToView.js`）
*   **作業内容** :
    *   （未記入）

### タスク6: JSDoc・構文チェック・決まりの通しの確認
*   **作業内容** :
    *   （未記入）

### タスク7: 開発資料（`PROJECT_ARCHITECTURE.md`）への反映（固定タスク）
*   **作業内容** :
    *   （未記入）

## テストプレイで確かめること（発注者が見る点）
*   タイトル画面の「遊び方」で1ページ目が開き、4ページを「まえへ」「つぎへ」（PC では ← →）で行き来でき、ページ番号が「1 / 4」〜「4 / 4」と出る。最初のページの「まえへ」、最後のページの「つぎへ」は薄く、押しても何も起きない。「タイトルへ」（PC では Escape）で戻り、もう一度開くと1ページ目から始まる。
*   文章が REQ の【遊び方の文章】のとおりに出て、`|`・`{`・`}`・`key:` などの印が画面に出ない。色を付けた言葉が、種類ごとの色（大事な言葉＝黄色、剣＝赤、盾＝青、ハンマー＝緑、金貨＝金色。どれも太字）で出る。
*   行が、句読点の後か言葉の切れ目でだけ折り返され、「アクションポイント」「ソリティア」などの言葉の途中で切れない。行頭に「、」「。」「！」が来ない。段落の間が少し空いている。
*   各ページに絵が出て、文章と重ならない（1ページ目: 左に城とその前に兵3体、右に向かい合うドラゴン。2ページ目: 重ねた剣の 5・4・3 の札。3ページ目: 上に BATTLE!、下に兵3体と巨人、巨人の頭の上に攻撃の予告の札（数字 20）。4ページ目: 敵の絵の右に名前（大きめの太字の黄色）と説明が並ぶ）。
*   スマホの縦画面で、本文が無理なく読める大きさで、どのページも画面に収まる。
*   タイトルからクリア・負けまで今と同じく通しで遊べ、決着の後のタイトル画面から、また遊び方を開ける。盤面の兵の見た目（焼き付けで描く・描かない）が今と変わらない。

## 5. 懸念事項・要確認ポイント
* **1ページ目の「城のHP が0 になる」の空白:** REQ の文章を文字を変えずに写すと、`城の|HP が|0 に|なる前に` は画面で「城のHP が0 になる前に」になる（「の」と「HP」の間に空白がなく、「HP」と「が」・「0」と「に」の間に空白がある。今の文章の「城の HP」とは空白の位置が違う）。REQ のとおりに写すが、見た目が気になれば文章の側（`howToText.js`）で空白を足す・消すだけで直せる。テストプレイで見てほしい。
* **行数の見積もりはフォントで変わる:** 2章の見積もりは、全角 34px・半角の数字 約 19px などの仮の幅で計算した。端末の `sans-serif` の字の幅で行の切れ目が変わることがある（特に 2ページ目の「アクションポイントが増える（最大 +2）。」は「）。」を右の余白にぶら下げて1行に収める見込みで、収まらなければ「（最大 +2）。」が次の行に送られる）。どのページも 1段落につき1行増えても収まる余裕がある（2章の表）。
* **4ページ目の巨人の説明の行の切れ方:** 文字の範囲の幅 444 では「数ターン準備して大打撃を｜繰り出す。｜防御のタイミングを見極めろ！」と、2行目が短くなる見込み（`|` の位置のとおりに折り返した結果）。気になれば `HOWTO_ROW_ART_W`（段の絵の幅）を変えるか、文章の `|` の位置で調整できる。
* **3ページ目の予告の札の数字「20」:** 巨人の攻撃の量（`config.js` の 18〜22）の中の値を、飾りの文字として `howToText.js` の `HOW_TO_ART_LABELS` に書く。設定の値を変えたら手で直す必要がある（文章の数字と同じ扱い）。
* **ロゴの大きさ:** 3ページ目の BATTLE! のロゴは倍率 0.7 で描く。今の仮のロゴ（404×106）では約 283×74。発注者がロゴを描き直しても、約束の上限（幅 640・高さ 120）の中なら区画に収まり予告の札と重ならない計算にしてある。
* **絵の見た目の割合:** 絵の位置・大きさの割合（2章「絵の中身」）は見積もりで決めた。テストプレイで見て、詰めたい・大きくしたいところがあれば `howToArt.js` の割合の定数と `layout.js` の `HOWTO_ART_H` などで直せる。
