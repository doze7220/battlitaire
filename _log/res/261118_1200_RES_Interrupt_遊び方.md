# RES: 作業計画・作業レポート (Interrupt) : 遊び方
* 参照元REQ: `./_log/req/261118_1154_Interrupt_遊び方.md`

## 1. 作業目的
初めて遊ぶ人が、ゲームの外でルールの説明を受けなくても遊べるように、タイトル画面から開く「遊び方」の画面（7ページを「まえへ」「つぎへ」でめくって読む、文字だけの画面）を足す。タイトル画面には「はじめる」の下に控えめな「遊び方」ボタンを置く。ゲームのルール・設定の値（`js/rules/`）は変えない。BOOT・盤面・攻防・決着の流れも変えない。

## 2. アーキテクチャ設計

### 要件1: タイトル画面に「遊び方」ボタンを置く
*   **配置（`js/view/layout.js` の `createTitleLayout`）**: 今の `startButton`（幅 360・高さ 120・上端 y = 高さ × 0.58 ≒ 742.4）はそのまま。その下に `howToButton` を足す。
    *   x・幅は `startButton` と同じ（x = (720 − 360) / 2 = 180、幅 360）。
    *   上端 y = `startButton.y + startButton.h + TITLE_HOWTO_GAP`（32）≒ 894.4、高さ `TITLE_HOWTO_H`（96。押せる範囲の高さ 80 以上）。下端 ≒ 990.4 で画面に収まる。
    *   新しい定数: `TITLE_HOWTO_GAP = 32`（「はじめる」と「遊び方」の間のすき間）、`TITLE_HOWTO_H = 96`（「遊び方」ボタンの高さ）。既存の `TITLE_*` の定数の並びのすぐ後に置き、JSDoc を付ける。
    *   `titleHitTest(x, y)` の戻り値を `'start' | 'howTo' | null` に広げる（`startButton` を先に調べ、次に `howToButton`）。
    *   `TitleLayout` の typedef に `howToButton: Rect` を足し、`titleHitTest` の型を `function(number, number): ('start'|'howTo'|null)` に直す。ボタンの文字の最大の幅は今の `startTextMaxW` を両方のボタンで使う（幅が同じため。typedef の説明を「ボタン（はじめる・遊び方）の文字の最大の幅」に直す）。
*   **見た目（`js/view/titleView.js` の `drawTitle`）**: 「はじめる」は今のまま。「遊び方」は **塗らずに縁だけ** の角丸の枠（角の丸みは今の `BUTTON_RADIUS` を共用）で、控えめにする。
    *   新しい定数: `HOWTO_STROKE = '#bfe8cf'`（縁の色。「はじめる」の縁と同じ色）、`HOWTO_LINE_WIDTH = 3`（縁の太さ）、`HOWTO_FONT = 'bold 40px sans-serif'`（文字のフォント。「はじめる」の 48px より小さい）、`HOWTO_TEXT_COLOR = '#bfe8cf'`（文字の色）。
    *   文字は `TITLE_TEXT.howTo`（`js/view/titleText.js` に足す `'遊び方'`）を、ボタンの中央に `startTextMaxW` を最大の幅として描く。
    *   すべて今の `ctx.save()`〜`ctx.restore()` の中で描く。
*   **入力（`js/scenes/TitleScene.js`）**: 押し方は「はじめる」と同じく「このシーンで押して、同じボタンの中で離したとき」。
    *   今の `pressed: boolean` を `pressed: ('start'|'howTo'|null)`（このシーンで押したボタン）に置き換える。`'down'` で `titleHitTest` の結果を記録し、`'up'` で `titleHitTest` の結果が記録と同じ（かつ null でない）ときだけ働く。`'start'` は今と同じく `Engine.changeScene(this.next())`、`'howTo'` は `Engine.changeScene(this.howTo())`。`'up'` のあとは記録を null に戻す。前の画面から届く `'down'` のない `'up'` では、記録が null なので何も起きない。
    *   Enter・Space は今のまま盤面へ進む。**「遊び方」にはキーを割り当てない**（PC でもクリックで開ける。キーの割り当ては足さない）。
    *   オプションに `howTo: () => Scene`（遊び方の画面を作る関数）を足す。
*   遊び方はタイトル画面からだけ開く。盤面・攻防の演出のシーンには何も足さない。

### 要件2: 遊び方の画面（ページをめくる）
*   **新しいシーン `js/scenes/HowToScene.js`（`HowToScene extends Scene`）**: 今のページの番号はこのシーンが持つ。
    *   オプション `{ screen, layer, back }`（`back: () => Scene` はタイトル画面を作る関数）。
    *   状態: `page`（今のページの番号。0 始まり）、`pressed`（このシーンで押したボタン `'prev'|'next'|'back'|null`）、`layout`（`HowToLayout`）。
    *   `init()`: `layout = createHowToLayout(this.screen)`、`page = 0`、`pressed = null`（開くたびに新しいインスタンスで1ページ目から始まる）。
    *   ページ数は `HOW_TO_PAGES.length`（`js/view/howToText.js` から import）で数える。
    *   `canPrev()`（`page > 0`）・`canNext()`（`page < ページ数 − 1`）を持ち、ページを移る判定と、描画に渡す「押せるか」の両方にこの2つだけを使う（条件を1か所にする）。
    *   `onPointer`: タイトル画面と同じく、`'down'` で `howToHitTest` の結果を記録し、`'up'` で同じボタンの中なら働く。`'prev'` は `canPrev()` のときだけ `page -= 1`、`'next'` は `canNext()` のときだけ `page += 1`（押せないときは何も起きない）、`'back'` は `Engine.changeScene(this.back())`。
    *   `onKeyDown`: `'ArrowLeft'` は「まえへ」、`'ArrowRight'` は「つぎへ」と同じ（押せないときは何もしない）、`'Escape'` はタイトル画面へ戻る。ほかのキーは何もしない。
    *   `draw(ctx, layer)`: `layer` が自分のレイヤーのときだけ `drawHowTo(ctx, this.layout, { page, count, canPrev, canNext })` を呼ぶ。状態は変えない。
    *   `update` は書かない（時間で進む動きがないため）。効果音は鳴らさない（`soundCues.js`・`Sound` は import しない）。
*   **配置（`js/view/layout.js` に `createHowToLayout(screen)` を1つ足す。`createTitleLayout` と同じ形・同じくらいの大きさ）**: 論理解像度 720×1280 での値。
    *   左右の余白 `HOWTO_PAD_X = 40`（本文・見出し・ボタンの列の左右の端）。
    *   見出し: 左寄せ、x = 40、中心 y = `HOWTO_HEADING_Y`（88）、最大の幅 = 640 − `HOWTO_PAGE_NUMBER_W`（120）− `HOWTO_HEADING_GAP_X`（16）= 504（いちばん長い見出し「行動の回数と行動終了」10文字 × 44px = 440 で収まる）。
    *   ページ番号: 右寄せ、x = 720 − 40 = 680、中心 y = 88（見出しと同じ行）、最大の幅 = 120。
    *   見出しの下の区切り線: y = `HOWTO_RULE_Y`（140）、x = 40〜680。
    *   本文の範囲（`Rect`）: x = 40、上端 y = `HOWTO_BODY_TOP`（164）、幅 = 640、下端 = ボタンの上端 − `HOWTO_BODY_GAP`（24）。
    *   ボタン: 高さ `HOWTO_BUTTON_H`（100。押せる範囲の高さ 80 以上）、上端 y = 1280 − `HOWTO_BOTTOM_PAD`（40）− 100 = 1140。横に3つ、左から「まえへ」「タイトルへ」「つぎへ」、間隔 `HOWTO_BUTTON_GAP_X`（16）、幅 = (640 − 16 × 2) / 3 ≒ 202.7。文字の最大の幅 = ボタンの幅 − `HOWTO_BUTTON_PAD_X`（12）× 2。
    *   よって本文の範囲は y = 164〜1116（高さ 952）。
    *   当たり判定 `howToHitTest(x, y)`: `inRect` で3つのボタンを調べ `'prev' | 'back' | 'next' | null` を返す（押せるかどうかは見ない。押せるかはシーンが決める）。`Engine.addButton` は使わない。
    *   typedef `HowToLayout`: `screen`（画面の大きさ）、`heading: { x, y, maxW }`、`pageNumber: { x, y, maxW }`、`rule: { x, y, w }`（区切り線の左端・y・長さ）、`body: Rect`、`prevButton: Rect`、`backButton: Rect`、`nextButton: Rect`、`buttonTextMaxW: number`、`howToHitTest: function(number, number): ('prev'|'back'|'next'|null)`。
    *   新しい定数は `HOWTO_` で始め、`TITLE_*` の定数の後に、それぞれ JSDoc を付けて置く。
*   **描画（新しいファイル `js/view/howToView.js`）**: 状態は変えない。座標は `HowToLayout` からだけ読む。
    *   公開する関数は `drawHowTo(ctx, howToLayout, view)` の1つ（`view` は `{ page: number, count: number, canPrev: boolean, canNext: boolean }`。typedef `HowToViewState` を置く）。全体を `ctx.save()`〜`ctx.restore()` で囲む。
    *   描く順: 背景（画面全体）→ 見出し（`HOW_TO_PAGES[page].heading`）→ ページ番号（`` `${page + 1}${HOW_TO_LABELS.pageSeparator}${count}` ``）→ 区切り線 → 本文（折り返して1行ずつ）→ 3つのボタン。
    *   ボタンは、角丸の縁だけの枠（`roundRectPath`、`js/view/cardView.js`）と中央の文字。「まえへ」は `canPrev`、「つぎへ」は `canNext` が false のとき、`ctx.globalAlpha = HOWTO_DISABLED_ALPHA`（0.3）で薄く描く（ボタンごとに `save`／`restore`）。「タイトルへ」は常に押せる見た目。
    *   色・フォントの定数（このファイルに JSDoc 付きで置く）: 背景 `BACKGROUND_FILL = '#101820'`（タイトル画面の暗い背景と同じ色）、見出し `HEADING_FONT = 'bold 44px sans-serif'`・`HEADING_COLOR = '#ffe680'`、ページ番号 `PAGE_NUMBER_FONT = '28px sans-serif'`・`PAGE_NUMBER_COLOR = '#9fb3c0'`、区切り線 `RULE_COLOR = '#3a4a58'`・`RULE_LINE_WIDTH = 2`、本文 `BODY_FONT_PX = 34`・`BODY_FONT = '34px sans-serif'`（`BODY_FONT_PX` から作る）・`BODY_COLOR = '#e8eef2'`・`BODY_LINE_RATIO = 1.5`（行の間隔＝文字の大きさ × 1.5 = 51px）、ボタン `BUTTON_STROKE = '#bfe8cf'`・`BUTTON_LINE_WIDTH = 3`・`BUTTON_RADIUS = 20`・`BUTTON_FONT = 'bold 34px sans-serif'`・`BUTTON_TEXT_COLOR = '#ffffff'`、`HOWTO_DISABLED_ALPHA = 0.3`。
    *   本文の i 行目（0 始まり）の文字の中心 y = `body.y + 行の間隔 × (i + 0.5)`、左寄せ、x = `body.x`、`textBaseline = 'middle'`。
*   **画面の切り替え（`js/main.js`）**: `createHowTo()` を足す（`new HowToScene({ screen, layer: 'main', back: createTitle })`）。`createTitle()` は `new TitleScene({ screen, layer: 'main', next: createBoard, howTo: createHowTo })` にする。BOOT・盤面の作り方・渡し方は変えない。先頭の責務のコメントと `config` の JSDoc の画面の流れに「TITLE ⇄ 遊び方」を書き足す。
*   シーンの切り替えはすべて `Engine.changeScene`（タイトル → 遊び方、遊び方 → タイトル。どちらも新しいインスタンス）。

### 要件3: スマホの縦画面で読める文字の大きさ
*   本文 34px（32px 以上）、見出し 44px、行の間隔 51px（1.5 倍）、左右の余白 40px。
*   **折り返し（`howToView.js` の中の、公開しない関数 `wrapParagraph(ctx, text, maxW, hangW)` → `string[]`）**: `ctx.font` を本文のフォントにした後で呼ぶ（測る文字の大きさを本文に合わせるため）。
    1.  段落（`paragraphs` の1要素＝文章の中の1行）ごとに折り返す。段落の区切りは必ず改行にする。
    2.  段落を「単位」に分ける: 1文字ずつ見て、行頭禁止の文字（`'、' '。' '）' '」'` の4つ。凍結した `Set` の定数 `NO_LINE_START` に持つ）は直前の単位の末尾に付け、それ以外の文字は新しい単位にする（例:「す）。」→ 単位「す）。」）。
    3.  単位の幅は `ctx.measureText(単位).width` で測り、今の行の幅に足していく（文字の幅は1文字単位で測ってよいという REQ に従う）。
    4.  今の行が空なら、単位をそのまま足す。今の行の幅 + 単位の幅 ≦ `maxW` なら足す。
    5.  そうでなくても、単位の1文字目までが `maxW` に収まり、単位の全体が `maxW + hangW` に収まるなら、行頭禁止の文字を **前の行の末尾にぶら下げて** 足す。
    6.  それ以外は、今の行を確定して、単位から新しい行を始める。このとき、新しい行の頭に来た単位が半角スペース `' '` だけなら捨てる（折り返した行の頭に空白を出さないため）。
    7.  `maxW` = 本文の範囲の幅（640）、`hangW` = 本文の文字の大きさ（34。右の余白 40 の中に1文字ぶら下げても画面からはみ出さない）。行頭禁止の文字が2つ続く（「）。」）ところでも、5 で全体が `maxW + hangW` に収まらなければ 6 で単位ごと次の行へ送るので、行頭に禁止の文字は来ず、画面からもはみ出さない。
    8.  箇条（「・」で始まる段落）の2行目以降の字下げはしない。
    *   折り返しは `draw` のたびに計算する（1ページ数百回の `measureText` で軽い。結果を覚えておく仕組みは作らない）。
*   **収まるかの見積もり（計画時）**: 本文の範囲の高さ 952 ÷ 行の間隔 51 = 18 行まで収まる。全角の文字を 34px、半角の文字を 0.6 倍として上の折り返しの手順を計算した見積もりは、1〜7ページが 10・13・9・11・11・12・15 行（半角も全角と同じ幅とした厳しめの見積もりでも 10・13・9・12・12・13・15 行）で、すべて 18 行以内に収まる。行の間隔を詰める必要はない。実装時（タスク4）に同じ見積もりをし直し、結果を詳細作業内容に書く。
*   背景は `'#101820'`（タイトル画面と同じ暗い色）。

### 要件4: 文章は1か所にまとめる
*   **新しいファイル `js/view/howToText.js`**（`titleText.js` と同じ作り。凍結した定数だけを持ち、描画・折り返し・数の組み立ての処理は書かない）:
    *   `HOW_TO_PAGES`: ページの並び（凍結した配列。並び順＝ページの順）。1ページは凍結したオブジェクト `{ heading: string, paragraphs: readonly string[] }`。`heading` は見出し、`paragraphs` は本文の行（REQ の【遊び方の文章】の本文の1行＝要素1つ。要素の区切りが改行になる。凍結した配列）。ページを足す・消す・並べ替えるのは、この配列の要素を足す・消す・並べ替えるだけで済む（ページ数は `length` で数える）。
        *   本文を「`\n` 入りの1つの文字列」ではなく「行の配列」にするのは、発注者が文章を直すときに改行の書き方（`\n` やテンプレート文字列の字下げ）を気にせず、1行を1つの文字列として書き換えられるようにするため。文章の改行はそのまま改行として扱われる。
        *   文字は REQ の【遊び方の文章】を **1文字も変えずに** 写す（半角スペース・全角の記号「→」「−」「〜」「・」「（」「）」「「」「」」・半角の「:」「+」「=」もそのまま）。
    *   `HOW_TO_LABELS`: 遊び方の画面のボタンとページ番号の文字（凍結したオブジェクト）`{ prev: 'まえへ', next: 'つぎへ', back: 'タイトルへ', pageSeparator: ' / ' }`。
    *   先頭の責務のコメント（3行以内）に「遊び方の画面の文字（各ページの見出しと本文、ボタンとページ番号の文字）を凍結した定数で持つ。文章の中の数字は js/rules/config.js の今の値を文字として書いたもので、設定の値を変えたらこの文章も手で直す」旨を書く。
*   **タイトル画面の「遊び方」**は `js/view/titleText.js` の `TITLE_TEXT` に `howTo: '遊び方'` を足す（typedef も `{ gameName: string, start: string, howTo: string }` に直す）。
*   数字は設定の値から組み立てない（`howToText.js` も `howToView.js` も `js/rules/` を import しない）。

### 要件5: 今と同じく使えること
*   「はじめる」・Enter・Space の動き、BOOT・盤面・攻防・決着 → TITLE（`BoardScene` に渡す `createTitle`）は変えない。`createTitle` が `howTo` を渡すようになるので、決着後に戻ったタイトル画面からも遊び方を開ける。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./js/scenes/`（シーン）、`./js/view/`（描画・配置・画面の文字）、`./js/`（`main.js`）
*   **関連する論理クラス**:
    *   新規: `HowToScene`（`js/scenes/HowToScene.js`。遊び方の画面のシーン。今のページの番号を持つ）、`drawHowTo`（`js/view/howToView.js`。遊び方の画面の描画と本文の折り返し）、`HOW_TO_PAGES`・`HOW_TO_LABELS`（`js/view/howToText.js`。遊び方の画面の文字）、`createHowToLayout`・`HowToLayout`（`js/view/layout.js` に追加。遊び方の画面の配置と当たり）
    *   更新: `TitleScene`（「遊び方」ボタンの押下で遊び方の画面へ）、`drawTitle`（「遊び方」ボタンの描画）、`TITLE_TEXT`（`howTo` の追加）、`createTitleLayout`・`TitleLayout`（`howToButton` と当たりの追加）、`js/main.js`（`createHowTo` の追加と渡し方）

### 参照する責務
*   `PROJECT_ARCHITECTURE.md` 4章の表から抜粋（以後のタスク実行チャットは、この項目のみを責務情報源とする）:
    *   `js/main.js`: 書いてよい＝`Engine.start` の設定（解像度、レイヤー、最初のシーン）、起動時に1回だけ行う準備、起動の前の音の読み込みと音量の設定／責務違反＝ルール、描画、シーンの中身。（土台から残したファイルの説明）BOOT・TITLE・盤面のシーンを作る関数を持ち、互いに渡す（BOOT の進む先は TITLE、TITLE の進む先は盤面、盤面には TITLE を作る関数を渡す）。最初のシーンは BOOT。
    *   `js/scenes/`: 書いてよい＝シーン（`Scene` の継承）。入力を受けてルール層の操作を呼ぶこと、`anim` の時間を進めること、`view` を呼んで描くこと、シーンの切り替え、ボタンの登録、効果音を鳴らすこと（`Sound.playSe` は `soundCues.js` の中でだけ）／責務違反＝ルールの判定や計算を書くこと、細かい描画の処理（`view` に置く）。
    *   `js/view/`: 書いてよい＝描き方、画面の配置（座標と大きさ）と、座標から「何に当たるか」を求めること／責務違反＝ゲームの状態を変えること、ルールの判定、時間で進む動き（`anim` に置く）、`Sound` の import。
    *   `js/scenes/TitleScene.js`: タイトル画面のシーン。「はじめる」ボタンの押下（このシーンで押して離したとき）と Enter・Space キーで、渡された関数で作った新しいゲームの盤面へ進む。描くのは `titleView.js`。
    *   `js/view/titleView.js`: タイトル画面の描画（暗い背景・ゲーム名・「はじめる」ボタン）。
    *   `js/view/titleText.js`: タイトル画面の文字（ゲーム名・「はじめる」）を凍結した定数で持つ。
    *   `js/view/layout.js`: 画面の配置（…タイトル画面の配置と当たり（`createTitleLayout`）、結果の表示の配置）と、座標から何に当たるかの判定（盤面は `hitTest`、攻防の演出中は `battleHitTest`、タイトル画面は `titleHitTest`）。
    *   `js/view/cardView.js`: …角丸パス（`roundRectPath` を読むだけ。変更しない）。
    *   3章「1ティックの中での役割」: ポインタ入力は `onPointer` の `'down'` で受け（BOOT と TITLE は例外で、このシーンで押して離したとき（`'up'`）に進む）、当たり判定は `js/view/layout.js` で行う（`Engine.addButton` は使わない）。`draw` は状態を変えない。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   3章「起動と画面の流れ」: TITLE の説明を「ゲーム名と『はじめる』ボタン、その下の『遊び方』ボタン」にし、「TITLE から遊び方の画面（HOWTO。7ページを『まえへ』『つぎへ』（← →）でめくる。『タイトルへ』・Escape で TITLE へ戻る。開くたびに1ページ目から）を開ける。遊び方はタイトル画面からだけ開く」を書き足す。「TITLE も今は音を鳴らさない」に遊び方の画面も鳴らさないことを足す。
*   3章「1ティックの中での役割」: 押して離したとき（`'up'`）に進む例外のシーンに、遊び方の画面（ボタン）を足す。
*   4章「作成済みのファイル」の表:
    *   新規 `js/scenes/HowToScene.js`: 遊び方の画面のシーン。今のページの番号を持ち、「まえへ」「つぎへ」「タイトルへ」のボタン（このシーンで押して離したとき）と ← → ・Escape キーでページを移る・タイトル画面へ戻る。描くのは `howToView.js`。効果音は鳴らさない。
    *   新規 `js/view/howToView.js`: 遊び方の画面の描画（暗い背景・見出し・ページ番号・区切り線・本文の折り返し（行頭禁止の文字のぶら下げを含む）・まえへ／タイトルへ／つぎへのボタン（押せないときは薄く））。
    *   新規 `js/view/howToText.js`: 遊び方の画面の文字（各ページの見出しと本文の行・ボタンとページ番号の文字）を凍結した定数で持つ。文章の中の数字は `js/rules/config.js` の今の値を文字として書いたもので、**設定の値を変えたらこの文章も手で直す**。ページの追加・削除・並べ替えもこのファイルだけで済む。
    *   更新 `js/scenes/TitleScene.js`: 「はじめる」ボタンと Enter・Space で盤面へ、「遊び方」ボタン（どちらもこのシーンで押して同じボタンの中で離したとき）で遊び方の画面へ進む。
    *   更新 `js/view/titleView.js`: タイトル画面の描画（暗い背景・ゲーム名・「はじめる」ボタン・縁だけの「遊び方」ボタン）。
    *   更新 `js/view/titleText.js`: タイトル画面の文字（ゲーム名・「はじめる」・「遊び方」）。
    *   更新 `js/view/layout.js`: タイトル画面の配置と当たり（`createTitleLayout`。「遊び方」ボタンを含む）、遊び方の画面の配置と当たり（`createHowToLayout`・`howToHitTest`）を足す。
*   4章「土台から残したファイル」の `js/main.js`: シーンを作る関数に遊び方の画面（`HowToScene`）を足し、「TITLE には盤面と遊び方の画面を作る関数を、遊び方の画面には TITLE を作る関数を渡す」を書き足す。
*   1章の注記のうち画面の説明に関わる箇所は、上の追記で足りるため変えない。

## 3. タスクリスト
*   [x] タスク1: 画面に出す文字（遊び方の文章のファイルと、タイトル画面の「遊び方」）
    *   **対象ファイル** :
        *   `./js/view/howToText.js` :（新規）
        *   `./js/view/titleText.js` :（更新）
    *   **作業内容** :
        *   `howToText.js` を新規に作る。先頭に3行以内の責務の JSDoc（2章 要件4のとおり。「設定の値を変えたらこの文章も手で直す」を含む）。
        *   `HOW_TO_PAGES`（凍結した配列。各要素は凍結した `{ heading, paragraphs }`、`paragraphs` も凍結した配列）を、REQ の【遊び方の文章】の1〜7ページから **文字を変えずに** 写す（本文の1行＝`paragraphs` の要素1つ）。ページの typedef（`HowToPage`）と定数の JSDoc（型・並び順がページの順であること・ページ数は `length` で数えること）を書く。
        *   `HOW_TO_LABELS`（凍結。`prev`・`next`・`back`・`pageSeparator`）を JSDoc 付きで置く。
        *   `titleText.js` の `TITLE_TEXT` に `howTo: '遊び方'` を足し、`@type` と先頭の責務のコメントの「ボタンの文字」の説明を「はじめる・遊び方」が分かるように直す（3行以内のまま）。
        *   写した文字を REQ と1行ずつ突き合わせて確かめる（スクリプトで REQ のコードブロックと比べてもよい。比べるスクリプトはリポジトリに置かない）。
        *   2ファイルの構文チェック（`node --input-type=module --check < <ファイル>`）。
*   [x] タスク2: 配置と当たり（タイトル画面の「遊び方」ボタン、遊び方の画面）
    *   **対象ファイル** :
        *   `./js/view/layout.js` :（更新）
    *   **作業内容** :
        *   2章 要件1の配置のとおり、`TITLE_HOWTO_GAP`・`TITLE_HOWTO_H` を足し、`createTitleLayout` に `howToButton` を足し、`titleHitTest` を `'start'|'howTo'|null` に広げる。`TitleLayout` の typedef を直す。
        *   2章 要件2の配置のとおり、`HOWTO_*` の定数（JSDoc 付き）と typedef `HowToLayout` を足し、`createHowToLayout(screen)`（JSDoc 付き。中の `howToHitTest` にも JSDoc）を `createTitleLayout` の後に1つ足す。`inRect` を使い、`Engine.addButton` は使わない。関数は `createTitleLayout` と同じくらいの大きさに収める。
        *   先頭の責務のコメントの「タイトル画面・結果の表示（決着）の配置と当たりも持つ」を「タイトル画面・遊び方の画面・結果の表示（決着）の配置と当たりも持つ」に直す（3行以内のまま）。
        *   ほかの関数・定数は変えない。構文チェック。
*   [x] タスク3: タイトル画面の「遊び方」ボタンの描画
    *   **対象ファイル** :
        *   `./js/view/titleView.js` :（更新）
    *   **作業内容** :
        *   2章 要件1の見た目のとおり、`HOWTO_*` の定数（JSDoc 付き）を足し、`drawTitle` で「はじめる」の後に、縁だけの角丸の枠と `TITLE_TEXT.howTo` を描く（今の `save`／`restore` の中）。
        *   先頭の責務のコメントと `drawTitle` の JSDoc の説明に「遊び方」ボタンを足す。構文チェック。
*   [x] タスク4: 遊び方の画面の描画（本文の折り返しを含む）
    *   **対象ファイル** :
        *   `./js/view/howToView.js` :（新規）
    *   **作業内容** :
        *   先頭に3行以内の責務の JSDoc（遊び方の画面（背景・見出し・ページ番号・区切り線・折り返した本文・まえへ／タイトルへ／つぎへのボタン）を描く。状態は変えず、座標は配置（HowToLayout）からだけ読む）。
        *   2章 要件2・要件3のとおり、色・フォントの定数、行頭禁止の文字の `Set`、typedef `HowToViewState`、公開しない `wrapParagraph(ctx, text, maxW, hangW)`・ボタン1つを描く関数（押せないときは薄く）、公開する `drawHowTo(ctx, howToLayout, view)` を、すべて JSDoc 付きで書く。import は `roundRectPath`（`./cardView.js`）、`HOW_TO_PAGES`・`HOW_TO_LABELS`（`./howToText.js`）だけ（`layout.js` は typedef の参照だけ）。`js/rules/`・`oz`・`Sound` は import しない。
        *   `ctx` の状態を変える描画は `save`／`restore` で囲む。`draw` で状態を変えない（引数で受けた値を読むだけ）。
        *   収まるかの見積もりをし直す: 2章 要件3の折り返しの手順を、全角 34px・半角 0.6 倍（と、厳しめに半角も 34px）として各ページの行数を数え（スクリプトはリポジトリに置かない）、18 行（本文の範囲の高さ 952 ÷ 51）以内か確かめて、結果を詳細作業内容に書く。収まらないページがあれば、行の間隔の比率を 1.4 まで詰めて確かめ、それでも収まらなければ、どのページが何行（何 px）はみ出すかを懸念事項に書いて作業を止める。
        *   構文チェック。
*   [ ] タスク5: 遊び方の画面のシーン
    *   **対象ファイル** :
        *   `./js/scenes/HowToScene.js` :（新規）
    *   **作業内容** :
        *   先頭に3行以内の責務の JSDoc（遊び方の画面のシーン。今のページの番号を持ち、まえへ／つぎへ／タイトルへのボタン（このシーンで押して離したとき）と ← → ・Escape キーで、ページを移る・渡された関数で作ったタイトル画面へ戻る。描くのは howToView.js）。
        *   2章 要件2のシーンのとおり、typedef `HowToOptions`、`HowToScene`（`constructor`・`init`・`canPrev`・`canNext`・`onPointer`・`onKeyDown`・`draw`）を JSDoc 付きで書く。import は `Engine`・`Scene`（`'oz'`）、`createHowToLayout`（`../view/layout.js`）、`drawHowTo`（`../view/howToView.js`）、`HOW_TO_PAGES`（`../view/howToText.js`）だけ。
        *   `update` は書かない。効果音は鳴らさない。`Engine.addButton` は使わない。構文チェック。
*   [ ] タスク6: タイトル画面から遊び方を開き、遊び方からタイトル画面へ戻す（画面の切り替え）
    *   **対象ファイル** :
        *   `./js/scenes/TitleScene.js` :（更新）
        *   `./js/main.js` :（更新）
    *   **作業内容** :
        *   `TitleScene.js`: 2章 要件1の入力のとおり、オプション `howTo` を足し（typedef `TitleOptions` とコンストラクタの JSDoc も）、`pressed` を押したボタン（`'start'|'howTo'|null`）の記録に変え、`onPointer` を「押したボタンと同じボタンの中で離したとき、そのボタンの働き」にする。`onKeyDown`（Enter・Space）は変えない。先頭の責務のコメント・クラスの JSDoc に「遊び方」ボタンで遊び方の画面へ進むことを足す。
        *   `main.js`: `HowToScene` を import し、`createHowTo()`（JSDoc 付き）を足し、`createTitle()` で `howTo: createHowTo` を渡す。先頭の責務のコメントの画面の流れと、`createTitle` の JSDoc、`config` の JSDoc の説明に、TITLE ⇄ 遊び方を書き足す。BOOT・盤面の作り方・渡し方、`Engine.start` の設定、音の読み込みは変えない。
        *   2ファイルの構文チェック。
*   [ ] タスク7: JSDoc の記載漏れの確認
    *   **対象ファイル** :
        *   タスク1〜6で作成・変更したファイル（確認のみ。漏れがあれば、そのファイルの JSDoc だけを足す）
    *   **作業内容** :
        *   新しく作った・変えたファイルの先頭の責務のコメント（3行以内）、クラス・関数・メソッド・typedef・定数の JSDoc（引数・戻り値・責務）に漏れがないか確かめ、漏れがあれば足す。あわせて `js/` に `addEventListener`・`requestAnimationFrame`・`getContext`・`setTimeout`・`setInterval`・`performance.now`・`Date.now`・`Math.random`（`main.js` の今の `Math.random` の受け渡しを除く）を書いていないこと、`window` にプロパティを足していないことを grep で確かめる。
*   [ ] タスク8: 作業レポートの完成
    *   **対象ファイル** :
        *   `./_log/res/261118_1200_RES_Interrupt_遊び方.md` :（更新）
    *   **作業内容** :
        *   「4. 詳細作業内容」の各タスクの記載がそろっているか確かめ、足りなければ書き足す。各タスクで判明した『開発資料の更新予定』の追記が2章の欄にあるか確かめる。懸念事項を整理する。
*   [ ] タスク9: 開発資料への反映
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` :（更新）
    *   **作業内容** :
        *   2章『開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定』の内容（画面の流れに遊び方の画面を足すこと、タイトル画面の説明、遊び方の文章のファイルと「設定を変えたら文章も直す」こと、新しく作る・責務の変わったファイルの表、`main.js` の説明）を開発資料に反映する。
        *   ※ 実装AIによる開発資料の書き換えは本ワークフローにおいて原則禁止であるが、**この最終タスクのみ明示的な例外とする**（後続タスクが存在せず、資料の変更によって他タスクの前提が動く危険がないため）。個別の実装タスク内で資料を書き換えてはならない。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: 画面に出す文字（遊び方の文章のファイルと、タイトル画面の「遊び方」）
*   **作業内容** :
    *   `js/view/howToText.js` を新規作成。責務コメント（3行）、typedef `HowToPage`、`HOW_TO_PAGES`（7ページ、凍結した `{heading, paragraphs}`、paragraphs も凍結配列）、`HOW_TO_LABELS`（prev/next/back/pageSeparator）を JSDoc 付きで置いた。
    *   `js/view/titleText.js` の `TITLE_TEXT` に `howTo: '遊び方'` を足し、`@type` と責務コメントを直した（3行以内）。
    *   確認: スクリプト（スクラッチパッドに置き、リポジトリには置かない）で REQ の【遊び方の文章】7ページの見出し・本文を `HOW_TO_PAGES` と全行比較し、完全一致（MATCH 7）。2ファイルとも構文チェック ok。

### タスク2: 配置と当たり（タイトル画面の「遊び方」ボタン、遊び方の画面）
*   **作業内容** :
    *   `layout.js` を更新済み（構文チェック ok）: `TITLE_HOWTO_GAP`・`TITLE_HOWTO_H`、`HOWTO_*` 定数、typedef `TitleLayout`（`howToButton` 追加）・`HowToLayout`、`createTitleLayout`（`howToButton`・`titleHitTest` の `'howTo'`）、`createHowToLayout`、先頭の責務コメントを直した。
    *   `createHowToLayout` は 50 行（`createTitleLayout` は 29 行）。実装統括の判断により、同じ形の1関数でボタン3つと返す項目の多さによる差のため、このまま `layout.js` に置く（別ファイルには分けない）。

### タスク3: タイトル画面の「遊び方」ボタンの描画
*   **作業内容** :
    *   `js/view/titleView.js` を更新（構文チェック ok）: `HOWTO_STROKE`・`HOWTO_LINE_WIDTH`・`HOWTO_FONT`・`HOWTO_TEXT_COLOR` を JSDoc 付きで足し、`drawTitle` の「はじめる」の後、既存の `save`／`restore` の中で、縁だけの角丸の枠（角の丸みは `BUTTON_RADIUS` を共用）と `TITLE_TEXT.howTo`（最大の幅は `startTextMaxW`）を描くようにした。先頭の責務コメントと `drawTitle` の JSDoc に「遊び方」ボタンを足した。
    *   `titleLayout.howToButton` を読むため、実際に動かすにはタスク2済みの `layout.js` が前提（済み）。

### タスク4: 遊び方の画面の描画（本文の折り返しを含む）
*   **作業内容** :
    *   `js/view/howToView.js` を新規作成（構文チェック ok）。責務コメント3行、色・フォント定数、`NO_LINE_START`（凍結した `Set`）、typedef `HowToViewState`、公開しない `splitUnits`（単位への分割）・`wrapParagraph(ctx, text, maxW, hangW)`・`drawButton`（押せないときは `globalAlpha = 0.3`、ボタンごとに `save`／`restore`）、公開 `drawHowTo(ctx, howToLayout, view)` を JSDoc 付きで書いた。import は `./cardView.js`（`roundRectPath`）と `./howToText.js` だけ。
    *   `drawHowTo` は、背景〜本文を1つの `save`／`restore` で囲み、ボタン3つは `drawButton` 内で `save`／`restore`。状態は変えない。
    *   見積もりのやり直し（スクラッチパッドのスクリプト。実装した `wrapParagraph` を `measureText` のモックで実行。`maxW` 640・`hangW` 34）: 全角 34px・半角 0.6 倍で1〜7ページが 10・13・9・11・11・12・15 行、半角も 34px で 10・13・9・12・12・13・15 行。すべて 18 行以内で、行の間隔を詰める必要はない。また、行頭が禁止の文字・半角スペースになる行は出なかった。

### タスク5: 遊び方の画面のシーン
*   **作業内容** :
    *   （未記入）

### タスク6: タイトル画面から遊び方を開き、遊び方からタイトル画面へ戻す（画面の切り替え）
*   **作業内容** :
    *   （未記入）

### タスク7: JSDoc の記載漏れの確認
*   **作業内容** :
    *   （未記入）

### タスク8: 作業レポートの完成
*   **作業内容** :
    *   （未記入）

### タスク9: 開発資料への反映
*   **作業内容** :
    *   （未記入）

## 5. 懸念事項・要確認ポイント
### テストプレイで確かめること（発注者が見る点）
*   タイトル画面の「はじめる」の下に「遊び方」ボタン（縁だけの控えめな見た目）があり、押して離すと遊び方の1ページ目が開く。「はじめる」・Enter・Space は今と同じく盤面へ進む。
*   7ページを「まえへ」「つぎへ」（PC では ← →）で行き来でき、ページ番号が「1 / 7」〜「7 / 7」と出る。最初のページの「まえへ」、最後のページの「つぎへ」は薄く、押しても何も起きない。
*   「タイトルへ」（PC では Escape）でタイトル画面へ戻り、もう一度開くと1ページ目から始まる。
*   スマホの縦画面で、本文が無理なく読める大きさで、どのページも画面に収まり、文字がはみ出したり重なったりしない。行頭に「、」「。」「）」「」」が来ない。
*   文章が REQ の【遊び方の文章】のとおりに出る。
*   タイトルからクリア・負けまで今と同じく通しで遊べ、決着の後のタイトル画面から、また遊び方を開ける。

### 計画時の懸念・決めたこと
*   **本文の収まり**: 計画時の見積もり（2章 要件3）では最も長い7ページ目で 15 行（上限 18 行）。実際の文字の幅は端末のフォントで変わるため、スマホの縦画面での目視を頼む。
*   **行頭禁止の文字が2つ続くところ（「）。」）**: REQ のとおり、行の幅を超える行頭禁止の文字は前の行の末尾にぶら下げるが、ぶら下げてよいのは右の余白の中の1文字分（34px）までとした。「）。」の2文字がともに行の幅を超える場合は、2文字をぶら下げると画面の右端からはみ出すため、その前の1文字ごと次の行へ送る（行頭に禁止の文字は来ない）。文章の中では「+6）。」「減ります）。」「出る）。」の3か所が当たりうる。
*   **「遊び方」のキー**: 割り当てない（Enter・Space は「はじめる」のまま。PC でもクリックで開ける）。
*   **背景の色**: 遊び方の画面の背景の色 `'#101820'` は、`titleView.js` の定数を export せずに、`howToView.js` にも同じ値の定数を置く（`titleView.js` の公開するものを増やさないため）。色を変えるときは2か所を直す。
