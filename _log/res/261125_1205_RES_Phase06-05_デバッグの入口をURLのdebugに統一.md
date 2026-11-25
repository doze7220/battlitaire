# RES: 作業計画・作業レポート (Phase 06-05) : デバッグの入口を URL の `?debug` に統一
* 参照元REQ: `./_log/req/261125_1205_Phase06-05_デバッグの入口をURLのdebugに統一.md`

## 1. 作業目的
デバッグの入口を、URL の `?debug` の1つにまとめる。タイトル画面の「デバッグスタート」のボタンと、`js/main.js` の定数 `DEBUG_TOOLS_ENABLED` を消す。URL に `?debug` を付けて開いたとき（以下「デバッグ」。それ以外は「ふつう」）は、「はじめる」のゲームがいまの「デバッグスタート」のゲームになり、画面の右下に赤い2行「DEBUG」「MODE」を出し、FPS の表示は消えた状態で始まり、何も保存しない。

* ふつうに開いたときの遊び・見た目・設定の保存は、「デバッグスタート」のボタンがなくなることのほかは変えない。
* デバッグかどうかの持ち主は `Engine.debug` だけ。ゲーム側に同じ意味の定数・変数を持たない（起動設定に渡す値を除く）。
* DEBUG タブの中身・「焼き付けで描く」の初めの状態・ルールの数値・遊び方の中身は変えない。静的 `import` のまま。時間の操作・開発用のキー・開発用パネルは入れない。
* 座標はすべて論理座標（720×1280）。

## 2. アーキテクチャ設計

### 全体の形（新しく作るもの・作り変えるもの）
| ファイル | 層 | 役割 |
| --- | --- | --- |
| `js/view/debugModeView.js`（新規） | 描画 | 「DEBUG」「MODE」の2行の文字・位置・見た目の定数と、描く関数 `drawDebugMode(ctx)`。`oz` は import しない（デバッグかどうかは知らない） |
| `js/scenes/debugModeLayer.js`（新規） | シーンの補助 | 「DEBUG MODE」のレイヤーの名前 `DEBUG_MODE_LAYER` と、シーンの `draw` から呼ぶ口 `drawDebugModeLayer(ctx, layer)`（レイヤーの名前と `Engine.debug` を見て `drawDebugMode` を呼ぶ） |
| `js/scenes/BootScene.js`・`TitleScene.js`・`HowToScene.js`・`BoardScene.js`（更新） | シーン | `draw` の頭で `drawDebugModeLayer(ctx, layer)` を1回呼ぶ |
| `js/scenes/TitleScene.js`・`js/view/layout.js`・`js/view/titleView.js`・`js/view/titleText.js`（更新） | シーン・描画 | 「デバッグスタート」の配置・当たり・文字・描画・受け口を消す |
| `js/scenes/settingsStore.js`（更新） | シーンの補助 | デバッグのときは `Storage.set` を呼ばず、変えた値をページの間だけ持つ |
| `js/main.js`（更新） | 起動 | URL を読んで起動設定 `debug` に渡す。レイヤーを足す。`createBoard` が `Engine.debug` で盤面を選ぶ。起動の直後に FPS の表示を消す。定数 `DEBUG_TOOLS_ENABLED` を消す |
| `js/rules/debugRules.js`（更新） | ルール層 | 先頭の責務の説明だけ（動きは変えない） |

`MenuScene.js`・`BattleShowScene.js`・`menuTabs.js`・`debugTab.js`・`boardDebug.js`・`debugLayout.js`・`index.html`・`assets/`・`js/rules/` のほかのファイルは変えない。

### 要件1: `?debug` の読み方
* URL を読むのは `js/main.js` の `config` を作る1か所だけ: `debug: isDebugQuery(location.search)`。
* `isDebugQuery(search)`（`js/main.js` の内部の関数。引数の文字列だけから答える）:
  ```js
  const value = new URLSearchParams(search).get('debug');
  return value !== null && value !== '0';
  ```
  `?debug`（値は空文字列）・`?debug=1`・`?a=1&debug` は真、なし・`?debug=0`・`?debugx=1` は偽。同じ名前が2つあるときは初めの値で決まる。`location` は読むだけ（履歴・クエリは書き換えない）。結果を変数に持たず、そのまま `config.debug` に渡す。
* ほかの所は `Engine.debug` を読む。読むのは次の3か所だけで、どれも `Engine.start` の後にしか呼ばれない。
  | 読む所 | 呼ばれる時期 |
  | --- | --- |
  | `js/main.js` の `createBoard` | タイトル画面の「はじめる」（入力の配信） |
  | `js/scenes/debugModeLayer.js` の `drawDebugModeLayer` | シーンの `draw` |
  | `js/scenes/settingsStore.js` の `writeValue`（内部の関数） | メニューの部品の `write`（入力の配信） |
* `Engine.start` の前に動くもの（モジュールの読み込み・`createBoot`・`BootScene` の constructor・`Storage.open`・`applySoundSettings`・`Assets.load`）は、この3か所を通らない。`applySoundSettings` は設定を読む口だけを使い、読む口は `Engine.debug` を読まない（要件6）。

### 要件2: デバッグのゲーム
* `js/main.js` の `createBoard` を、頭で `if (Engine.debug) return createDebugBoard();` とし、そうでなければ今のとおりの盤面（`createMenu`。`rules` は渡さない）を作る。`createDebugBoard`（`debugRules` を最初の1回だけ作り、`createDebugMenu` と `rules` を渡す）・`createDebugMenu`・`createMenu`・`debugRules` の動きは変えない。
* タイトル画面には `next: createBoard` だけを渡す（「はじめる」・Enter・Space は同じ道）。「設定」は `createMenu`（デバッグでも DEBUG タブなし）のまま。
* ふつうのときは `createDebugBoard`・`createDebugMenu` はどこからも呼ばれないので、DEBUG タブ・デバッグの操作・FPS の表示への道はない。
* デバッグのゲームであることを盤面へ伝えるのは、今までどおり `rules` と `createMenu` の引き渡しだけ（`BoardScene` に分岐を足さない）。

### 要件3: 「デバッグスタート」と定数を消す
* `js/main.js`: `DEBUG_TOOLS_ENABLED` を消す。`createTitle` は `new TitleScene({ screen, layer: 'main', next: createBoard, howTo: createHowTo, menu: createMenu })`。
* `js/scenes/TitleScene.js`: オプションとメンバー `debugNext`、`pressed` の型の `'debugStart'`、`onPointer` の `'debugStart'` の分岐を消す。`startGame(create)` は引数をなくし `startGame()`（`this.next()` で進む）にする。`createTitleLayout(this.screen)` と呼ぶ。
* `js/view/layout.js`: `createTitleLayout(screen)`（第2引数 `options` を消す）。`debugStartButton` と、`titleHitTest` の `'debugStart'` を消す（最後は `return inRect(settingsButton, x, y) ? 'settings' : null;`）。`TitleLayout` の typedef も合わせる。3つのボタンの位置・大きさ・定数は変えない。
* `js/view/titleView.js`: `debugStartButton` の描画を消す。`js/view/titleText.js`: `debugStart` を消す（型も）。
* JSDoc・責務に「デバッグスタート」の言い方が残るファイルの全部（`js/` を検索して確かめた）: `js/main.js`・`js/rules/debugRules.js`（先頭の責務）・`js/scenes/BoardScene.js`（`BoardOptions` の `rules`）・`js/scenes/TitleScene.js`・`js/view/layout.js`・`js/view/titleText.js`・`js/view/titleView.js`。ほかの `js/`・`index.html`・`README.md`・`tools/` にはない。言い換えは「デバッグ（`Engine.debug` が真）のゲーム」。

### 要件4: 「DEBUG MODE」の表示
* レイヤーを1つ足す: `layers: ['main', DEBUG_MODE_LAYER]`（`DEBUG_MODE_LAYER = 'debugMode'`。いちばん手前）。ふつうのときもレイヤーはあるが、何も描かない。既存のシーンはすべて `layer: 'main'` に描き、ほかのレイヤーでは何も描かないので、`'main'` の順序・見た目は変わらない。窓の背後の幕・結果の幕はどれも `'main'` なので、表示は隠れず暗くならない。
* 描くのは「いちばん下に積まれるシーン」（`Engine.changeScene` で切り替わる4つ: BOOT・TITLE・HOWTO・盤面）。`MenuScene`・`BattleShowScene` は必ずその上に積まれ、背面の `draw` は続くので、呼ばない（二重に描かない）。4つのシーンの `draw` の頭（`if (layer !== this.layer) return;` の前）で `drawDebugModeLayer(ctx, layer);` を1行だけ呼ぶ。描く条件・レイヤーの名前・文字・位置はシーンに書かない。
* `js/scenes/debugModeLayer.js`:
  ```js
  export const DEBUG_MODE_LAYER = 'debugMode';
  export function drawDebugModeLayer(ctx, layer) {
    if (layer !== DEBUG_MODE_LAYER || !Engine.debug) return;
    drawDebugMode(ctx);
  }
  ```
  `js/view/` は `oz` を import しない決まり（`troopBakes.js` の `CanvasCache` だけが例外）なので、`Engine.debug` を読む所をシーンの補助に置く。
* `js/view/debugModeView.js`: 定数（凍結。「試遊で決め直す値」と書く）と `drawDebugMode(ctx)`。
  | 定数 | 値 | 内容 |
  | --- | --- | --- |
  | `LINES` | `[{ text: 'DEBUG', y: 1252 }, { text: 'MODE', y: 1268 }]` | 2行の文字と中心 y |
  | `CENTER_X` | `693` | 2行の中心 x |
  | `MAX_W` | `48` | 文字の最大の幅（`fillText`・`strokeText` の第4引数。書体が幅広でもはみ出さない） |
  | `FONT` | `'bold 14px sans-serif'` | 書体 |
  | `TEXT_COLOR` | `'#ff4040'` | 赤 |
  | `OUTLINE_COLOR` | `'#000000'` | 縁取り |
  | `OUTLINE_WIDTH` | `2` | 縁取りの太さ |
  * 描き方: `ctx.save()` → `font`・`textAlign = 'center'`・`textBaseline = 'middle'`・`lineJoin = 'round'`・`lineWidth`・`strokeStyle`・`fillStyle` → 行ごとに `strokeText` → `fillText` → `ctx.restore()`。状態は変えない。
  * 範囲: 縁取りを入れて x 668〜718・y 1244〜1276。盤面の一番右の放つボタンは今の配置の計算で x 565〜665・y 1188〜1268（縁の線を入れて x 666 まで）で、y は重なるが x は重ならない（REQ の「y 1140〜1240」は遊び方のボタンの値）。遊び方のボタンは y 1140〜1240、メニューの窓は高さ 696 で画面の中央、結果の板は y 330〜950、TURN の区画は最上部、FPS の表示は左下で、どれとも重ならない。
* 入力: 描くだけで、当たり判定・ボタン・シーンを足さない（押しても下の画面の入力を妨げない）。

### 要件5: FPS の表示
* `js/main.js` で `Engine.start(config);` のすぐ次の行に `Engine.fpsVisible = false;` を書く（フレーム処理の外なので14章で許された場所。次の表示から効く）。ふつうのときは初めから偽なので、分岐は書かない。`Engine.fpsPosition` は触らない。
* DEBUG タブの「FPS を表示」（`debugTab.js`）は変えない（チェックで左下に出る）。

### 要件6: デバッグのときは保存しない
* `js/scenes/settingsStore.js` の中だけに置く。`menuTabs.js`・`MenuScene`・`BattleShowScene`・盤面は変えない。
* `const unsavedValues = new Map();`（名前 → 値。デバッグで変えた設定の値。ページを閉じるまで。デバッグのときだけ入る。デバッグかどうかの印としては使わない）
* 内部の関数を2つ足す。
  * `readValue(name)`: `unsavedValues.has(name) ? unsavedValues.get(name) : Storage.get(name)`。`Engine.debug` は読まない（起動の前に `applySoundSettings` から呼ばれるため）。`readVolume`・`battleSpeedId` の `Storage.get` をこれに替える（壊れた値を初期値にする処理は今のまま通る）。
  * `writeValue(name, value)`: `Engine.debug` が真なら `unsavedValues.set(name, value)` だけで戻り、偽なら `Storage.set(name, value)`。`writeBgmVolume`・`writeSeVolume`・`writeBattleSpeed` の `Storage.set` をこれに替える。`Storage.set` を呼ぶのは `writeValue` の中だけになる。
* 音量の反映（`setBgmVolume`・`setSeVolume`）は今のまま（デバッグでもその場で効く）。`SETTINGS_STORAGE`（`key`・`version`・`defaults`）・公開している口の名前と引数は変えない。`Storage.open` は書き込まない（22章）ので、`js/main.js` の呼び出しは今のまま。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./js/`（起動）、`./js/scenes/`（シーンの `draw`・タイトルの受け口・「DEBUG MODE」のレイヤーの口・設定の保存）、`./js/view/`（「DEBUG MODE」の描画・タイトル画面の配置と描画と文字）、`./js/rules/`（責務の説明だけ）
*   **関連する論理クラス**: `BootScene`・`TitleScene`・`HowToScene`・`BoardScene`（更新）、`MenuScene`・`BattleShowScene`・`BoardDebug`（変えない）、エンジンの `Engine`（3章・10章・14章）・`Storage`（22章）

### 参照する責務
*   `PROJECT_CONSTITUTION.md` 3章: ルールと画面の分離（ルール層は `oz`・URL を読まない）・先回り実装の禁止・ファイル先頭の責務（JSDoc、3行以内。責務を逸脱するロジックを足さない）・JSDoc・入口の一本化（`import { … } from 'oz'` だけ）・基礎処理の直書き禁止（`requestAnimationFrame`・`addEventListener`・`getContext`）・ロジックと描画の分離（`draw` で状態を変えない）・Canvas 状態の保護（`save`・`restore`）・グローバル汚染の禁止（`window` に足さない）。
*   `js/main.js`: `Engine.start` の設定（解像度、レイヤー、最初のシーン）、起動時に1回だけ行う準備、起動の前の音の読み込みと保存された設定の反映、画面の流れを作る関数、デバッグの盤面を作る関数（`createDebugBoard`。`debugRules` を最初に1回だけ作って持つ）・DEBUG タブ付きのメニューを作る関数（`createDebugMenu`）。ルール、描画、シーンの中身は書かない。
*   `js/rules/`: `oz` や `js/` のほかのフォルダの import、Canvas・DOM・音・時間は扱わない。`debugRules.js`: ルールの値の写しと、値の問い合わせ・操作。写しは `js/main.js` が作る。
*   `js/scenes/`: シーンとシーンの補助モジュール（`Scene` を継承しない）。`view` を呼んで描くこと、シーンの切り替え。ルールの判定や計算、細かい描画の処理は書かない（`view` に置く）。
*   `js/scenes/TitleScene.js`: タイトル画面のシーン。「はじめる」・Enter・Space で盤面へ、「遊び方」で遊び方の画面へ、「設定」でメニューの窓へ（このシーンで押して同じボタンの中で離したとき）。タイトルの曲を流し、ゲームスタートでは曲を止めてスタートの音を鳴らす。描くのは `titleView.js`。
*   `js/scenes/HowToScene.js`: 遊び方の画面のシーン（ページの番号とボタン・キー）。`js/scenes/BootScene.js`: 最初の入力を受ける画面。`js/scenes/BoardScene.js`: 盤面のシーン（オプション `rules` を `new Game` の `config` に渡す）。
*   `js/scenes/settingsStore.js`: 設定の値の表と保存の設定（`SETTINGS_STORAGE`）を持ち、`Storage` を通して今の値を答え（壊れた値は初期値）・新しい値を保存し・起動時に音量を反映する口。設定の値の持ち主はここだけ。`Sound` は import しない。
*   `js/view/`: 描き方、画面の配置。ゲームの状態を変えること、ルールの判定、時間で進む動き、`Sound` の import は書かない。`oz` の import は `troopBakes.js` の `CanvasCache` だけ。
*   `js/view/layout.js`: 画面の配置と当たり（タイトル画面は `createTitleLayout`）。`js/view/titleText.js`: タイトル画面の文字の定数。`js/view/titleView.js`: タイトル画面の描画。
*   `oz/ENGINE_API.md` 3章: 起動設定 `debug`。`Engine.debug` は `Engine.start` の後だけ読める。真なら FPS を左上に表示した状態で始まる。10章: `layers` は奥から手前の順。14章: `Engine.fpsVisible` への代入は `update`・`onPointer`・`onKeyDown`・`onPress` の中とフレーム処理の外。22章: `Storage.open` は書き込まない。`Storage.set` はその場で保存する。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   冒頭のエンジンの段落: 「起動設定の `debug` は使っていない」を、開発モード（起動設定 `debug`・`Engine.debug`。3章）を URL の `?debug` で使っている（`js/main.js`。FPS の表示は起動の直後に消す）に直す。
*   2章「設定（調整値）」: 「デバッグスタートのゲームだけは…最初のデバッグスタートで…」「「はじめる」のゲームはいつも `RULES`」を、「デバッグ（`Engine.debug` が真）のゲームだけは…最初のゲームで…」「ふつうのゲームはいつも `RULES`」に直す。設定の保存の段落に「デバッグのときは保存せず、変えた値をページの間だけ持つ」を足す。
*   3章「起動と画面の流れ」: デバッグの決まり（`?debug`。`?debug=0` はふつう。URL を読むのは `js/main.js` の1か所）を足す。タイトル画面の「デバッグスタート」ボタン・`DEBUG_TOOLS_ENABLED`・キーの割り当ての記述を消す。DEBUG タブの段落の書き出しと「次のデバッグスタートのゲームにも残る」・「ふつうの「はじめる」の盤面」の言い方を、デバッグの「はじめる」のゲームに直す。起動の段落に `Engine.start` の直後に `Engine.fpsVisible = false` とすることを足す。「DEBUG MODE」の表示（レイヤー `'main'` の手前の `'debugMode'`。いちばん下に積まれるシーンが描く。`changeScene` で切り替わるシーンを足すときは `draw` の頭で `drawDebugModeLayer` を呼ぶ）を足す。
*   4章 責務の表: `js/main.js`（定数 `DEBUG_TOOLS_ENABLED` と「デバッグスタートの盤面」→ URL を読んで起動設定 `debug` に渡すこと・`createBoard` が `Engine.debug` で `createDebugBoard` を選ぶこと・起動の直後に FPS の表示を消すこと）、`js/rules/`（「デバッグスタートのゲーム」→「デバッグのゲーム」）。
*   4章 作成済みのファイル: `js/view/debugModeView.js`・`js/scenes/debugModeLayer.js` の行を足す。`config.js`・`debugRules.js`（「デバッグスタート」の言い方）・`layout.js`（`options.debugStart`・`debugStartButton`・`'debugStart'` を消す）・`titleText.js`・`titleView.js`・`TitleScene.js`（`debugNext` と「デバッグスタート」を消す。`draw` で「DEBUG MODE」のレイヤー）・`BoardScene.js`・`HowToScene.js`（`draw` で「DEBUG MODE」のレイヤー）・`debugTab.js`（「`Engine.fpsVisible`・`fpsPosition` への代入はチェックボックスの `write` の中だけ」→ ほかに `js/main.js` が起動の直後に `fpsVisible` を消す）・`settingsStore.js`（デバッグのときは `Storage.set` を呼ばず、変えた値をページの間だけ持つ）の行を直す。
*   4章 土台から残したファイル: `js/main.js`（`DEBUG_TOOLS_ENABLED`・`debugNext`・「`debug` は書かない」・「`createBoard` は `rules` を渡さず、いつも `RULES` で遊ぶ」を今の動きに直す。レイヤーを2つにしたこと）・`js/scenes/BootScene.js`（「DEBUG MODE」のレイヤー）。
*   「デバッグスタート」「`DEBUG_TOOLS_ENABLED`」「`debugNext`」「`debugStart`」が資料に残らないこと。

## 3. タスクリスト
各タスクに共通の作業（タスクごとに必ず行う）:
* コード修正の後、JSDoc の記載漏れがないことを確かめる（新しいファイルの先頭には責務を3行以内で書く。既存のファイルの先頭の責務が変わる場合は3行以内で書き直す）。
* 変更した .js ファイルの構文チェック（`node --input-type=module --check < <ファイル>`）を行う。
* 本 RES の「4. 詳細作業内容」の該当タスクを記載し、タスクを [x] にする。
* 開発資料の記載に影響が出る場合は、資料本体は直さず、「開発資料の更新予定」欄に追記する。

*   [x] タスク1: デバッグのときは設定を保存しない（`settingsStore.js`）
    *   **対象ファイル** :
        *   `./js/scenes/settingsStore.js` :（更新）
    *   **作業内容** :
        *   2章 要件6 のとおり、`import { Engine, Storage } from 'oz';` にし、`unsavedValues`・`readValue`・`writeValue` を JSDoc 付きで足す（どれも export しない）。`readValue` の JSDoc に「`Engine.debug` は読まない（起動の前の `applySoundSettings` からも呼ばれる）」、`writeValue` の JSDoc に「`Engine.start` の後（メニューの部品の `write`）だけ呼ぶ」を書く。
        *   `readVolume`・`battleSpeedId` の `Storage.get` を `readValue` に、`writeBgmVolume`・`writeSeVolume`・`writeBattleSpeed` の `Storage.set` を `writeValue` に替える。3つの `write…` の JSDoc の「保存し」「保存する」に「（デバッグのときは保存せず、ページを閉じるまで持つ）」を足す。
        *   先頭の責務（3行以内）に「デバッグ（`Engine.debug`）のときは保存せず、変えた値をページを閉じるまで持つ」を足す。`SETTINGS_STORAGE`・値の表・`applySoundSettings` は変えない。

*   [x] タスク2: 「DEBUG MODE」の描画とレイヤーの口（新規2ファイル）
    *   **対象ファイル** :
        *   `./js/view/debugModeView.js` :（新規）
        *   `./js/scenes/debugModeLayer.js` :（新規）
    *   **作業内容** :
        *   `debugModeView.js`: 2章 要件4 の表の定数（JSDoc 付き。`LINES` は項目も凍結。「試遊で決め直す値」）と `export function drawDebugMode(ctx)`（JSDoc 付き）を書く。何も import しない。先頭の責務: デバッグのときに画面の右下に出す2行「DEBUG」「MODE」の文字・位置・見た目を定数で持ち、描く。出すかどうかは呼ぶ側（`debugModeLayer.js`）が決める。状態は変えない。
        *   `debugModeLayer.js`: 2章 要件4 のコードのとおり、`DEBUG_MODE_LAYER` と `drawDebugModeLayer(ctx, layer)` を JSDoc 付きで書く（`import { Engine } from 'oz';` と `drawDebugMode`）。JSDoc に「いちばん下に積まれるシーン（`Engine.changeScene` で切り替わるシーン）の `draw` の頭で、レイヤーごとに呼ぶ。上に積むシーンからは呼ばない」を書く。先頭の責務: 「DEBUG MODE」のいちばん手前のレイヤーの名前を持ち、デバッグ（`Engine.debug`）のときだけそのレイヤーに描くこと（シーンの補助。`Scene` を継承しない）。

*   [x] タスク3: 盤面・遊び方・BOOT のシーンで「DEBUG MODE」のレイヤーを描く
    *   **対象ファイル** :
        *   `./js/scenes/BootScene.js` :（更新）
        *   `./js/scenes/HowToScene.js` :（更新）
        *   `./js/scenes/BoardScene.js` :（更新）
    *   **作業内容** :
        *   3つのシーンの `draw` の頭（`if (layer !== this.layer) return;` の前）に `drawDebugModeLayer(ctx, layer);` を1行足す（`import { drawDebugModeLayer } from './debugModeLayer.js';`）。`draw` の JSDoc と先頭の責務（3行以内）に「「DEBUG MODE」のレイヤーを描く（`debugModeLayer.js`）」を足す。ほかの処理は変えない。
        *   `BoardScene.js` の `BoardOptions` の `rules` の JSDoc の「デバッグスタートでは `RULES` と同じ形の写しが渡される」を、「デバッグ（`Engine.debug` が真）のゲームでは `RULES` と同じ形の写しが渡される」に直す。
        *   `MenuScene.js`・`BattleShowScene.js` には足さない。

*   [x] タスク4: タイトル画面の「デバッグスタート」を消す・タイトル画面の「DEBUG MODE」のレイヤー
    *   **対象ファイル** :
        *   `./js/scenes/TitleScene.js` :（更新）
        *   `./js/view/layout.js` :（更新）
        *   `./js/view/titleView.js` :（更新）
        *   `./js/view/titleText.js` :（更新）
    *   **作業内容** :
        *   2章 要件3 のとおり、`TitleScene.js` から `debugNext`・`'debugStart'` を消し、`startGame()` を引数なし（`Engine.changeScene(this.next())`）にして、`onPointer`・`onKeyDown` の呼び出しを合わせる。`draw` の頭に `drawDebugModeLayer(ctx, layer);` を足す（import・`draw` の JSDoc も）。先頭の責務（3行以内）・`TitleOptions`・クラスの JSDoc・`pressed`・`startGame`・`onPointer` の JSDoc から「デバッグスタート」を消す。
        *   `layout.js` の `createTitleLayout` から `options`・`debugStartButton`・`'debugStart'` を消し、`TitleLayout` の typedef（`debugStartButton` の行・`startTextMaxW` の説明・`titleHitTest` の型）と関数の JSDoc を合わせる。ほかの配置・定数は変えない。
        *   `titleView.js` の `debugStartButton` の描画を消し、先頭の責務と `drawTitle` の JSDoc を合わせる。`titleText.js` の `debugStart` を消し、型と先頭の責務を合わせる。

*   [ ] タスク5: 起動（`js/main.js`）とルール層の説明
    *   **対象ファイル** :
        *   `./js/main.js` :（更新）
        *   `./js/rules/debugRules.js` :（更新。先頭の責務の説明だけ）
    *   **作業内容** :
        *   `main.js`: `DEBUG_TOOLS_ENABLED` を消し、`createTitle` を 2章 要件3 の形にする（JSDoc も）。`createBoard` を 2章 要件2 のとおりにする（JSDoc に「デバッグ（`Engine.debug`）のときは `createDebugBoard` の盤面。`Engine.start` の後（タイトル画面のゲームスタート）だけ呼ばれる」）。
        *   `main.js`: `isDebugQuery(search)` を JSDoc 付きで足し（2章 要件1。JSDoc に `?debug=0` はふつう、を書く）、`config` に `debug: isDebugQuery(location.search)` を足す（URL を読むのはここだけ、と JSDoc に書く）。`layers` を `['main', DEBUG_MODE_LAYER]` にする（`./scenes/debugModeLayer.js` から import）。`config` の JSDoc（`scene` の説明の「デバッグスタート」・「`debug` は書かない」・型）を今の動きに直す。
        *   `main.js`: `Engine.start(config);` の次に `Engine.fpsVisible = false;` を書き、コメント（デバッグでは FPS を左上に出した状態で始まるので消す。出し入れは DEBUG タブから）を付ける。起動の前の準備の順（`Storage.open` → `applySoundSettings` → `Assets.load`）は変えない。
        *   `main.js`: `debugRules`・`createDebugBoard`・`createMenu`・`createDebugMenu`・先頭の責務（3行以内）の JSDoc の「デバッグスタート」を「デバッグのゲーム」に直す（先頭の責務は、URL の `?debug` を読んで起動設定に渡すこと・起動の直後に FPS の表示を消すことも書く）。
        *   `debugRules.js`: 先頭の責務の「デバッグスタートのゲームが使う」を「デバッグのゲームが使う」に直す（URL・エンジンの名前は書かない。コードは変えない）。

*   [ ] タスク6: JSDoc・構文チェック・決まりの通しの確認
    *   **対象ファイル** :
        *   タスク1〜5 で変更・作成したすべての .js ファイル（確認だけ。直すのは漏れがあったときだけ）
    *   **作業内容** :
        *   先頭の責務が3行以内であること、足した・変えた関数・定数・型に JSDoc があることを確かめる。変更・作成したすべての .js ファイルに構文チェックを行い、結果を記録する。
        *   `grep` で次を確かめ、結果を記録する: `js/` に「デバッグスタート」・`DEBUG_TOOLS_ENABLED`・`debugNext`・`debugStart` が残っていないこと。`location` を読むのが `js/main.js` の1か所だけであること。`Engine.debug` を読むのが `main.js` の `createBoard`・`debugModeLayer.js`・`settingsStore.js` の `writeValue` だけであること（コメントを除く）。`Storage.set` が `settingsStore.js` の `writeValue` の1か所だけであること。`Engine.fpsVisible` への代入が `main.js` の `Engine.start` の直後と `debugTab.js` の `write` だけであること。`drawDebugModeLayer(` を呼ぶのが4つのシーンの `draw` の頭だけであること。`js/view/` で `'oz'` を import するのが `troopBakes.js` だけ、`js/rules/` に `'oz'` がないこと。`js/` に `requestAnimationFrame`・`addEventListener`・`getContext`・`window.` がないこと（コメントを除く。`this.window.`・`MENU_LAYOUT.window.` は対象外）。
        *   `node` の一時的なスクリプト（スクラッチパッドに置き、リポジトリに残さない）に `isDebugQuery` の式を写し、`''`・`?debug`・`?debug=1`・`?debug=0`・`?a=1&debug`・`?debug=0&a=1`・`?debugx=1` の結果を記録する。

*   [ ] タスク7: 開発資料（`PROJECT_ARCHITECTURE.md`）への反映（固定タスク）
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` :（更新）
    *   **作業内容** :
        *   「2. アーキテクチャ設計」の「開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定」と、各タスクで追記された項目を確かめ、開発資料へ反映する（※実装AIによる開発資料の書き換えは、このタスクだけの明示的な例外）。
        *   冒頭のエンジンの段落、2章の設定（調整値）・設定の保存の段落、3章の画面の流れ・DEBUG タブ・起動の段落、4章の責務の表・作成済みのファイル・土台から残したファイルを、実際に合わせて直す。関係のない記述は変えない。
        *   反映した後、資料に「デバッグスタート」・`DEBUG_TOOLS_ENABLED`・`debugNext`・`debugStart` が残っていないことを `grep` で確かめ、結果を記録する。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: デバッグのときは設定を保存しない（`settingsStore.js`）
*   **作業内容** :
    *   `js/scenes/settingsStore.js` を更新。`import { Engine, Storage } from 'oz';` にし、`unsavedValues`（Map）・`readValue`・`writeValue` を JSDoc 付きで足した（export なし）。
    *   `readVolume`・`battleSpeedId` の `Storage.get` を `readValue` に、`writeBgmVolume`・`writeSeVolume`・`writeBattleSpeed` の `Storage.set` を `writeValue` に替えた。`Storage.set` は `writeValue` の中だけ。3つの `write…` の JSDoc に「（デバッグのときは保存せず、ページを閉じるまで持つ）」を追記。
    *   `readVolume` の JSDoc を、`readValue` 経由で読む実態（デバッグで変えた値を優先）に直した。
    *   先頭の責務（3行以内）にデバッグ時の扱いを追記（「Storage を通して」は「今の値を答え」に短縮）。`SETTINGS_STORAGE`・値の表・`applySoundSettings` は未変更。

### タスク2: 「DEBUG MODE」の描画とレイヤーの口（新規2ファイル）
*   **作業内容** :
    *   `js/view/debugModeView.js` を新規作成。定数 `LINES`（項目も凍結）・`CENTER_X`・`MAX_W`・`FONT`・`TEXT_COLOR`・`OUTLINE_COLOR`・`OUTLINE_WIDTH`（JSDoc に「試遊で決め直す値」）と `drawDebugMode(ctx)`（save → 設定 → 行ごとに strokeText・fillText → restore）。何も import しない。
    *   `js/scenes/debugModeLayer.js` を新規作成。`DEBUG_MODE_LAYER = 'debugMode'` と `drawDebugModeLayer(ctx, layer)`（`Engine.debug` と `drawDebugMode` を使う）。
    *   2ファイルとも構文チェック ok。

### タスク3: 盤面・遊び方・BOOT のシーンで「DEBUG MODE」のレイヤーを描く
*   **作業内容** :
    *   `BootScene.js`・`HowToScene.js`・`BoardScene.js` に `import { drawDebugModeLayer } from './debugModeLayer.js';` を足し、各 `draw` の頭（`if (layer !== this.layer) return;` の前）に `drawDebugModeLayer(ctx, layer);` を1行足した。`draw` の JSDoc と先頭の責務（いずれも3行以内）に「DEBUG MODE」のレイヤーを描く旨を足した。
    *   `BoardScene.js` の `BoardOptions.rules` の JSDoc を「デバッグ（`Engine.debug` が真）のゲームでは…」に直した。`MenuScene.js`・`BattleShowScene.js` は触っていない。
    *   構文チェック: 3ファイルとも ok。

### タスク4: タイトル画面の「デバッグスタート」を消す・タイトル画面の「DEBUG MODE」のレイヤー
*   **作業内容** :
    *   `TitleScene.js`: `debugNext`・`'debugStart'` を消し、`startGame()` を引数なし（`this.next()`）にして `onPointer`・`onKeyDown` を合わせた。`createTitleLayout(this.screen)` に変更。`draw` の頭に `drawDebugModeLayer(ctx, layer);`（import 追加）。先頭の責務（3行）・`TitleOptions`・クラス JSDoc・`pressed`・`startGame`・`onPointer`・`draw` の JSDoc を合わせた。
    *   `layout.js`: `createTitleLayout(screen)`（`options` 削除）、`debugStartButton`・`'debugStart'` を削除し、typedef・JSDoc を合わせた。
    *   `titleView.js`: `debugStartButton` の描画と記述を削除。`titleText.js`: `debugStart` と記述を削除。
    *   4ファイルとも構文チェック ok。4ファイルに「デバッグスタート」「debugNext」「debugStart」は残っていない。`main.js` はタスク5で `debugNext` を渡さなくするまで、まだ渡している（無害）。

### タスク5: 起動（`js/main.js`）とルール層の説明
*   **作業内容** :
    *   （未着手）

### タスク6: JSDoc・構文チェック・決まりの通しの確認
*   **作業内容** :
    *   （未着手）

### タスク7: 開発資料（`PROJECT_ARCHITECTURE.md`）への反映（固定タスク）
*   **作業内容** :
    *   （未着手）

## 5. 懸念事項・要確認ポイント
*   「DEBUG」の幅は書体で変わる（太字 14px でおよそ 44〜55px と見込む）。48px を超える書体では、`fillText` の最大の幅で横に縮む（指定した文字の大きさ 14px は変えない）。PC・スマホで読めるかを目視で確認してほしい。
*   放つボタンは、今の配置の計算では y 1188〜1268（REQ の「y 1140〜1240」は遊び方のボタンの値と読んだ）で、「DEBUG MODE」と縦は重なる。横は、ボタンの縁の右端が x 666、文字の縁取りの左端が x 668 で、すき間は 2px ほど。目視で確認してほしい（動かすときは `debugModeView.js` の `CENTER_X`・`MAX_W`）。
*   FPS の表示は `Engine.start` の直後に消す。`Engine.start` の中で最初のフレームが描かれるかどうかは `oz/ENGINE_API.md` に書かれていないので、`?debug` で開いた最初に左上へ一瞬も出ないことを目視で確認してほしい。
*   デバッグでは、起動の前の音の読み込みの間（まだ `Engine.start` の前で黒い画面）は「DEBUG MODE」は出ない。BOOT（「TAP SCREEN」）から出る。
