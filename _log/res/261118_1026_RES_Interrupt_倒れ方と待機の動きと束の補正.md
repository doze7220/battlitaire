# RES: 作業計画・作業レポート (Interrupt) : 倒れ方と待機の動きと束の補正
* 参照元REQ: `./_log/req/261118_1026_Interrupt_倒れ方と待機の動きと束の補正.md`

## 1. 作業目的
3つの独立した変更をまとめて行う。
*   **要件1（見た目）**: 兵・ゴブリンが倒れるとき、いまの「その場で真上に跳ねて真下へ落ちる」動きを、「進む向きと逆へ弾かれて、放物線を描いて画面の下へ落ちる」動きに変える（自軍の兵は左へ、ゴブリンは右へ、約 50px）。時刻（消える数・音・HP の変化・ヒットマーク・白い光・ヒットストップ）は変えず、落ちていく間の位置だけを変える。シールド・炎・巨人とドラゴンの倒れる動きは変えない。
*   **要件2（見た目）**: ゴブリン（HP の群れ・防御のゴブリン・待っている向かってくるゴブリン）と巨人・ドラゴンに、自軍の兵と同じゆるやかな待機の動き（呼吸するような伸び縮み）を、段取りの間も攻防の間も付ける。ための動き・倒れる動きの間はそちらを優先する。
*   **要件3（ルールの変更。発注者が決めた例外）**: 同じスートが続く区切りの加算量を「合計 × 区切りの枚数」から「合計 ＋ 足す量（足す量 = 1枚ごとに 1 ×（枚数 − 1）、最大 +6）」に変え、玉の式の表示を「18 +2 = 20」（足す量 0 は数字だけ）にする。係数は `js/rules/config.js` に置く。
*   要件3以外のルール（カードの操作・攻防の計算・敵と城の数値・行動の決まり）は変えない。早送り・スキップ・04-02〜04-05 の見せ方は、変える点のほかは今のまま動く。

## 2. アーキテクチャ設計

### 全体の考え方
*   **ルールの変更は `release.js` と `config.js` の中だけ**: 束の補正の式は `computeRelease`（純粋関数）の1か所、係数は `RULES.releaseBonus` の1か所。放った結果の区切りの項目 `multiplier` は `bonus`（足す量）に置き換え、`amount`（加算量）の意味（ゲージ・兵の数・金貨に足す量）は変えない。`Game.release` はいまと同じく `gains` を足すだけなので変えない。
*   **式の文字の形は `battleText.js` だけ**: `releaseFormulaText(sum, bonus, amount)` が「18 +2 = 20」／「4」を作る。玉の記録（`orbTrack.js`）は区切りの `bonus` を写すだけ、描画（`orbView.js`）はそれを渡すだけ。
*   **弾かれる動きは `troopMotion.js` の式の1か所**: 弾かれる向きは兵の種類だけで決まる（自軍の兵＝右へ進む → 左へ、ゴブリン＝左へ進む → 右へ、シールド・炎・絵 → 横に動かない）。終わり方を決めるとき（`setTroopEnd`）に、終わり方の記録 `TroopEnd` に横のずれの合計 `dx`（符号つき）を1回だけ入れ、毎フレームは `sampleTroop` が時計から横の位置を求めるだけ。跳ねる高さ・落ちる加速・`fallDuration`（＝ `doneAt`）は変えないので、消える時刻・時間割・当たりの記録（`impactLog.js` は `end.x`・`end.y`・`end.time` を写す）・ヒットマーク（`enemyAttacks.js` も同じ）はずれない。
*   **待機の動きは「止まって待っているときだけ」の伸び縮みで、時刻を持たない**: 
    *   攻防の間のゴブリン（名簿の `goblin`・`enemyGuard`・`enemy`）は、いまの自軍の兵と同じ仕組み（`TroopSwarm.sample` が `idle` の兵だけ `breathScale` を書く）に乗せる。`troopBreath.js` の `breathScale` が呼吸する種類を、自軍の兵の3種類からゴブリンの3種類まで広げるだけで、名簿・時間割・描画（`troopView.js` は既に伸び縮みを受ける）は変えない。
    *   巨人・ドラゴンの絵と段取りの間の HP の群れは名簿に入っていないので、新しいモジュール `js/anim/enemyIdle.js` が受け持つ。段取りの間は `EnemyIdle`（自分の時計を持ち、`update(dt)` で群れ1体ずつの伸び縮みを型付き配列に、絵の伸び縮みを入れ物に書く）、攻防の間は `sampleFigurePose`（ための姿勢に絵の伸び縮みを重ねる）を演出の管理（`battleDirector.js`）が毎フレーム呼ぶ。
    *   描画（`enemyView.js`）は渡された伸び縮みを、絵は足元（絵の矩形の下端の中央）を軸に、群れは1体ずつ足元を軸に（`drawTroop` の `scaleX`・`scaleY`）当てるだけ。時間を進めず、状態を変えない。
*   **重さ**: 毎フレーム新しいオブジェクトを作らない。攻防の間は既存の型付き配列（`TroopSwarm`）と入れ物（`pose`）に書くだけ。段取りの間の群れは `EnemyIdle` が持つ型付き配列（数が増えたときだけ作り直す）に書くだけ。

### 要件1: 倒れるときは、進む向きと逆へ弾かれる放物線にする
*   **設定**（`js/anim/battleAnimConfig.js`）: `knockDistance: 50` を足す（px。跳ね始めから消える（`doneAt`）までに横へ動く距離の合計。試遊で決め直す）。JSDoc の `BattleAnimConfig` に項目を足し、`popHeight`・`popMs`・`fallAccel` の説明の「跳ねて落ちる」はそのままでよい（値は変えない）。
*   **向きの表**（`js/anim/troopMotion.js`）: 凍結した表 `KNOCK_DIRS` を足す。
    *   `attack: -1`・`defense: -1`・`heal: -1`（自軍の兵は右へ進むので左へ。動かずに打撃を受ける防御の兵も、敵と逆の左）。
    *   `enemy: 1`・`enemyGuard: 1`・`goblin: 1`（ゴブリンは左へ進むので右へ。画面の外から来るゴブリン・防御のゴブリン・HP の群れ）。
    *   表にない種類（`shield`・`flame`・`figure`）は 0（今のまま真上に跳ねて真下へ落ちる。炎はそもそも `vanish`）。
*   **終わり方の記録**: `TroopEnd` に `dx`（落ちる間の横のずれの合計。px、符号つき。`'vanish'` と向きが 0 の種類は 0）を足す。`setTroopEnd` の `'fall'` で `dx = (KNOCK_DIRS[kind] ?? 0) × BATTLE_ANIM.knockDistance`、`'vanish'` で `dx = 0`。表を引くときは `Object.prototype.hasOwnProperty.call` で引く（既存の書き方に合わせる）。
*   **見た目の式**（`sampleTroop` の落ちる分岐）: 縦（`footY`）の式はいまのまま。横は**速さ一定**で、`x = end.x + end.dx × min(1, τ / (end.doneAt − end.time))`（τ = `clock − end.time`。`doneAt − time` が 0 以下なら `end.dx` をそのまま足す）。縦が放物線（跳ねて上がり、加速して落ちる）なので、軌跡は進む向きと逆へ弾かれる放物線になる。`sortY` はいまのまま `end.y`（描く順は変えない）。
*   **変えないもの**: `fallDuration`（消える時刻）・`setTroopEnd` の `rush` の扱い・`troopHitEnd`・名簿（`troopRoster.js`）・時間割（`battleTimeline.js`）・`enemyBody.js` の倒れる絵（`figure` は向き 0、`sampleEnemyFigure` は `dy` だけを読むので今のまま）・`enemyAttacks.js`・`troopSwarm.js`（`out.x` を写すだけ）。落ちる兵は今と同じく戦闘の段の中で切り抜いて描く（`battleShowView.js` の段の切り抜き。段の横の端から出てもよい）。

### 要件2: 敵にも待機の動きを付ける
*   **深さ・速さの決め方**: ゴブリンは自軍の兵と同じ大きさの兵なので、自軍の兵と**同じ値**（`breathDepth`・`breathPeriodMs`）と同じ式（`breathScale`）を使う。巨人・ドラゴンは絵の高さが 200px あり、同じ深さ（0.05 → 10px）だと大きく見えるので、**敵の絵用の値**を `battleAnimConfig.js` に足す: `figureBreathDepth: 0.025`（縦の伸び縮みの割合）、`figureBreathPeriodMs: 2000`（1回の長さ ms）。どちらも試遊で決め直す。
*   **ゴブリンの位相**（`js/anim/troopBreath.js`）: 種類ごとの位相の表 `KIND_PHASE` に `goblin: 0`・`enemyGuard: 1 / 2`・`enemy: 1 / 6` を足し、`breathScale` の「自軍以外は 1・1」の判定を「表にない種類は 1・1」（`Object.prototype.hasOwnProperty.call(KIND_PHASE, kind)`）に変える。位相は今と同じく番号から（`index × GOLDEN + KIND_PHASE[kind]` の小数部。乱数なし）。`OWN_KINDS` の import は使わなくなるので消す。シールド・炎・絵は表に入れない（伸び縮みしない）。
    *   これで攻防の間、名簿のゴブリン（HP の群れ・防御のゴブリン・家に着いて待っている向かってくるゴブリン）は、`TroopSwarm.sample` の `idle`（家の位置で止まっていて、終わり方が始まっていない）のときだけ伸び縮みする。進む・当たる・倒れる・帰る間は `idle` でないので 1・1（いまの自軍の兵と同じ）。`troopSwarm.js` と `troopView.js` は変えない。
*   **新しいモジュール `js/anim/enemyIdle.js`**（責務: 敵（ゴブリンの群れ・巨人・ドラゴンの絵）の待機の伸び縮み。段取りの間の見た目の入れ物と、攻防の間の絵の姿勢。絵の伸び縮みの式はここだけ。ゴブリンの式は `troopBreath.js` の `breathScale` を使う。描画も状態の変更もしない）。中身は次のとおり。
    *   `figureBreath(clock)`（モジュールの中だけの関数）: `s = figureBreathDepth × sin(2π × clock / figureBreathPeriodMs)` を返す（数だけを返し、オブジェクトを作らない）。横は `1 − s / 2`、縦は `1 + s`（自軍の兵の呼吸と同じ形）。
    *   `sampleFigurePose(charge, chargeK, falling, clock, out)`（export）: 攻防の間の絵の姿勢を `out`（`{tilt, scaleX, scaleY}`）に書く。`out.tilt = charge.tilt`。`falling` なら伸び縮みを重ねず `out.scaleX = charge.scaleX`・`out.scaleY = charge.scaleY`。そうでなければ `s = figureBreath(clock) × (1 − chargeK)` として `out.scaleX = charge.scaleX × (1 − s / 2)`・`out.scaleY = charge.scaleY × (1 + s)`。ための強さ `chargeK`（0〜1。ための段の外は 0、頂点で 1）で待機の伸び縮みを弱めるので、ための動きの間はそちらが優先され、段の始めと終わりで姿勢が跳ばない。
    *   `class EnemyIdle`（export）: 段取りの間の敵の待機の見た目の入れ物。
        *   持つもの: `clock`（ms、0 から）、`count`（伸び縮みを書いた群れの数。群れでない敵は 0）、`scaleX`・`scaleY`（`Float64Array`。群れの並びの番号 i（`layout.hordeSlots` の番号）ごとの伸び縮み。数が今の長さを超えたときだけ作り直す）、`figure`（`{tilt: 0, scaleX, scaleY}`。絵の伸び縮み）、作業用の入れ物 `_scale`（`{scaleX, scaleY}`）。
        *   `update(ms, typeId, hp)`: 時計に `ms` を足し、`enemyBodyStyle(typeId)`（`enemyShows.js`）が `'horde'` なら `n = max(0, hp)` 体ぶん、並びの番号 i の伸び縮みを `breathScale('goblin', n − 1 − i, clock, _scale)` で書く（攻防の名簿の群れは `enemyBody.js` の準備で並びを逆順に置くので、番号 `n − 1 − i` にそろえると、同じ HP のまま攻防に入ったゴブリンと位相がそろう）。`'figure'` なら `count = 0`。絵の伸び縮みは毎回 `figureBreath(clock)` から `figure` に書く（群れのときは描画が読まない）。
        *   `look()`: 自分（`EnemyIdleLook`。`count`・`scaleX`・`scaleY`・`figure`。読むだけ）を返す。状態は変えない。
*   **攻防の間の絵**（`js/anim/battleDirector.js`）: 絵の姿勢の入れ物 `this.pose = {tilt: 0, scaleX: 1, scaleY: 1}` を持ち、`sampleLooks` の中で `this.fx.sample(...)`・`sampleEnemyFigure(...)` の後に `sampleFigurePose(this.fx.pose, chargeLevel(this.fx.charges, this.clock), enemyFigureFalling(this.timeline.body, this.clock), this.clock, this.pose)` を呼ぶ。`view()` の `pose` は `this.pose` を返す（`BattleLook.pose` の型は `ChargePoseLook` のまま、説明を「絵の姿勢（ための姿勢に待機の伸び縮みを重ねたもの）」に変える）。`BattleFx`（`battleFx.js`）の `pose`（ための姿勢）はその入力としてそのまま使い、`battleFx.js`・`chargeShow.js` は変えない。演出が終わった後も時計は進むので、待つ間も伸び縮みは続く。スキップ後も同じ式で最後の状態を見せる（倒れた絵は見えず、立っている絵は伸び縮みする）。
*   **倒れ始めたか**（`js/anim/enemyBody.js`）: `enemyFigureFalling(body, clock)` を足す（`body.fall !== null && body.fall.end !== null && clock >= body.fall.end.time`）。倒れる絵の記録の問い合わせなので `enemyBody.js` の責務の中。群れは `false`。
*   **段取りの間**（`js/scenes/BoardScene.js`）: `init` で `this.enemyIdle = new EnemyIdle()` を作り、`update(dt)` で `this.enemyIdle.update(dt, this.game.enemy.typeId, this.game.enemy.hp)` を呼ぶ（ルール層は読むだけ）。`draw` で `this.enemyIdle.look()` を `drawBoard` に渡す。
*   **描画**:
    *   `js/view/boardView.js`: `drawBoard` に引数 `idle`（`EnemyIdleLook|null`。末尾に足し、省くと null）を足し、`drawBattleStage` の state に `idle` を渡す。
    *   `js/view/battleStageView.js`: state に `idle`（省くと null）を足し、`drawEnemyFigure` に渡す。攻防の演出中（`battleShowView.js`）は渡さない（`battleShowView.js` は変えない。`look.pose` が伸び縮みを含む）。
    *   `js/view/enemyView.js`: `drawEnemyFigure(ctx, battleLayout, enemy, figure = null, pose = null, idle = null)`。いまの倒れる絵の分岐の「足元を軸に傾け・伸ばす」変換を、小さな関数 `applyFootPose(ctx, rect, pose)`（傾き 0・伸び 1・1 なら何もしない）に出し、段取りの絵（`idle !== null` のとき `idle.figure`）でも使う。段取りの絵は `ctx.save()`／`restore()` の中で `applyFootPose` → `drawSpriteFit`。シールドマークは**伸び縮みさせない**（体の伸び縮みは縦 2.5% までで、シールドの位置のずれは数 px なので、体から大きく離れて見えない。攻防の間の名簿のシールドも今のまま動かない）。群れは `drawHorde(ctx, battleLayout, count, idle)` で、並びの番号 i が `idle !== null && i < idle.count` ならその伸び縮み、そうでなければ 1・1 を `drawTroop` に渡す（奥の行から描く順は変えない）。
*   **ための動きと倒れる動きが優先**: 攻防の間は `sampleFigurePose` が、ための段の中は伸び縮みを弱め（頂点で 0）、倒れ始めた後は重ねない。ためる段・倒れる段の時刻・見え方（`chargeShow.js`・`enemyBody.js` の落ちる式）は変えない。
*   **時刻を変えない**: 待機の動きは見た目の伸び縮みだけで、時間割・名簿・`idle` の判定・当たりの記録には入らない。

### 要件3: 同じスートの束の補正を「枚数−1 を合計に足す（最大 +6）」に変える
*   **設定**（`js/rules/config.js`）: `releaseMultiplier: { base, perCard }` を消し、`releaseBonus: Object.freeze({ perCard: 1, max: 6 })` を置く。JSDoc の `Rules` の項目を「放ったときの束の補正の係数。足す量 = min(max, perCard × (同じスートの区切りの枚数 − 1))、加算量 = 合計 + 足す量」に書き換え、ファイル先頭の責務の「倍率の式の係数」を「束の補正（足す量）の係数」に変える。
*   **計算**（`js/rules/release.js`）: `ReleaseSegment` の `multiplier` を `bonus`（足す量。`min(max, perCard × (count − 1))`）に置き換え、`amount` の説明を「加算量（`sum + bonus`）」にする。`computeRelease` の config の型を `releaseBonus: { perCard: number, max: number }` にし、`const { perCard, max } = config.releaseBonus; seg.bonus = Math.min(max, perCard * (seg.count - 1)); seg.amount = seg.sum + seg.bonus;`。1枚だけの区切りは `bonus = 0`（合計そのまま）。ファイル先頭の責務と関数の JSDoc の「倍率」を「足す量」に変える。`Math.max(0, …)` は付けない（`count ≥ 1` なので負にならない）。
    *   例: 剣 7・6・5 → `sum 18`・`bonus 2`・`amount 20`。7枚以上でも `bonus` は 6。
*   **型の説明**: `planningResults.js` の `ReleaseResult.segments` は `ReleaseSegment` を参照しているだけで「倍率」の文字はないので変えない（タスク実行時に確認し、文字があれば合わせる）。`Game.js` は `computeRelease` の `segments`・`gains` を返すだけで変えない。
*   **玉と式**:
    *   `js/anim/orbTrack.js`: `OrbSegment`・`FormulaLook` の `multiplier`（倍率）を `bonus`（足す量）に、`createReleaseOrbs` の引数の型の `multiplier` を `bonus` に、写すところ（`segs.push`・`out.formulas.push`）を `bonus: seg.bonus` に変える。
    *   `js/anim/releaseShow.js`: `start` の引数の型の `multiplier: number` を `bonus: number` に変える（JSDoc だけ）。
    *   `js/view/orbView.js`: `drawReleaseOrbs` の引数の型の `multiplier` を `bonus` に、`releaseFormulaText(f.sum, f.bonus, f.amount)` にする。
    *   `js/view/battleText.js`: `releaseFormulaText(sum, bonus, amount)` を、`bonus > 0` なら `${sum} +${bonus} = ${amount}`（例「18 +2 = 20」）、そうでなければ `${amount}`（例「4」）にする。JSDoc の例・説明を「合計 +足す量 = 加算量（足す量 0 は加算量の数字だけ）」に変える。ファイル先頭の責務の「放った区切りの式」はそのままでよい。
*   **ゲージ・兵・金貨**: `amount` の意味は変わらないので、`releaseShow.js` の `camp.land(seg.gauge, seg.amount, …)`・`createGaugeCount({ …, to: seg.amount, … })` はそのまま新しい加算量で動く（玉が着いたら兵の数とゲージが一致する 04-03 の決まりは変わらない）。
*   **片付け**: `releaseMultiplier`・`multiplier` の項目・式の「×」は残さない。`js/` 全体を `multiplier`・`releaseMultiplier`・`倍率` で探し、束の補正に関わるものがなくなったことを確かめる（早送りの倍率 `fastScale`・`fastLabel` の「×」・`spriteView.js` の絵の倍率・`impactFx.js` の式の「×」・`hudView.js` の倍率表示は束の補正と無関係なので触らない）。

### 要件4: 今と同じく使えること
*   早送り（`Engine.timeScale`）・スキップは変えない。弾かれる動き・待機の動きは時計から求めるだけなので、早送りでは同じ比率で速くなり、スキップ後は最後の時計の見た目になる（攻防の結果・時刻は変わらない）。
*   04-02〜04-05 の見せ方は、`sampleTroop` の落ちる分岐の横の位置・`breathScale` の種類・攻防の絵の姿勢・段取りの絵と群れの伸び縮みのほかは触らない。
*   ルール層の変更は束の補正だけで、カードの操作・攻防の計算・敵と城の数値・行動の決まりは変えない。

### 関連フォルダと論理クラス
*   **対象フォルダ**:
    *   `./js/rules/` - ルール層（束の補正の式と設定だけ）
    *   `./js/anim/` - 演出（弾かれる動き・敵の待機の動き・玉の記録）
    *   `./js/view/` - 描画（式の文字・敵の絵と群れの伸び縮み）
    *   `./js/scenes/` - 盤面のシーン（段取りの間の敵の待機の時計を進める）
*   **関連する論理クラス・関数**:
    *   `js/rules/config.js`: `RULES.releaseBonus`（新。`releaseMultiplier` を置き換え）（更新）
    *   `js/rules/release.js`: `computeRelease`・`ReleaseSegment.bonus`（更新）
    *   `js/anim/orbTrack.js`: `OrbSegment.bonus`・`FormulaLook.bonus`（更新）
    *   `js/anim/releaseShow.js`: `ReleaseShow.start` の JSDoc（更新）
    *   `js/view/orbView.js`: `drawReleaseOrbs`（更新）
    *   `js/view/battleText.js`: `releaseFormulaText`（更新）
    *   `js/anim/battleAnimConfig.js`: `knockDistance`・`figureBreathDepth`・`figureBreathPeriodMs`（新しい項目）（更新）
    *   `js/anim/troopMotion.js`: `KNOCK_DIRS`（新）・`TroopEnd.dx`（新）・`setTroopEnd`・`sampleTroop`（更新）
    *   `js/anim/troopBreath.js`: `KIND_PHASE`・`breathScale`（更新。ゴブリンの種類を足す）
    *   `js/anim/enemyIdle.js`: `EnemyIdle`・`sampleFigurePose`・`EnemyIdleLook`（**新規**）
    *   `js/anim/enemyBody.js`: `enemyFigureFalling`（新しい関数）（更新）
    *   `js/anim/battleDirector.js`: `BattleDirector.pose`・`sampleLooks`・`view`（更新）
    *   `js/view/enemyView.js`: `drawEnemyFigure`・`drawHorde`・`applyFootPose`（新しい内部関数）（更新）
    *   `js/view/battleStageView.js`: `drawBattleStage`（更新）
    *   `js/view/boardView.js`: `drawBoard`（更新）
    *   `js/scenes/BoardScene.js`: `BoardScene.enemyIdle`・`init`・`update`・`draw`（更新）
*   **変えないファイル**（読むだけ）: `js/rules/Game.js`・`js/rules/planningResults.js`（「倍率」の文字がないことの確認だけ）・`js/anim/troopRoster.js`・`js/anim/troopSwarm.js`・`js/anim/battleTimeline.js`・`js/anim/enemyAttacks.js`・`js/anim/enemyShows.js`・`js/anim/chargeShow.js`・`js/anim/battleFx.js`・`js/anim/campTroops.js`・`js/view/troopView.js`・`js/view/battleShowView.js`・`js/view/spriteView.js`・`js/view/layout.js`・`js/scenes/BattleShowScene.js`。

### 参照する責務
*   **`js/rules/`**: ルール（…放ったときの計算、ゲージ…）と、その設定（調整値）。乱数は外から受け取る。違反: `oz` や `js/` のほかのフォルダの import、Canvas・DOM・音・時間（`dt` を含む）を扱うこと、`Math.random` の直接の呼び出し、画面の座標や色。
*   **`js/anim/`**: 時間で進む見た目の動き（カードの移動・めくれ、兵の群れの突撃、数字の増え方など）と、補間（イージング）。ルール層の操作の結果を受けて、見た目の値を作る。違反: ゲームの状態を変えること、ゲームの結果を決めること、描画そのもの（`view` に置く）、`Sound` の import・音の名前を持つこと。
*   **`js/view/`**: カード・山札・列・ゲージ・城・敵・兵などの描き方、画面の配置。違反: ゲームの状態を変えること、ルールの判定、時間で進む動き（`anim` に置く）、`Sound` の import。
*   **`js/scenes/`**: シーン。入力を受けてルール層の操作を呼ぶこと、`anim` の時間を進めること、`view` を呼んで描くこと。違反: ルールの判定や計算を書くこと、細かい描画の処理（`view` に置く）。
*   `js/rules/config.js`: ルールの調整値（`RULES`）を1か所に凍結して持つ。
*   `js/rules/release.js`: 放った束のゲージ加算量の計算（純粋関数）。
*   `js/rules/planningResults.js`: 段取りの操作の結果の型定義。
*   `js/anim/orbTrack.js`: 1回の放つの、札1枚ごと・区切りごとの玉の記録（玉に変わる・上る・合体・式・飛ぶ・弾けるの時刻と位置。時刻の式はここ1か所）を組み立て、時計から見た目（玉に変わる前の札・玉・式）を求める。
*   `js/anim/releaseShow.js`: 放つ演出全体の管理（時計を進め、放つたびの玉の記録と段取りの間の兵を持ち、連鎖のきっかけ・札を止めているか・動いているか・ゲージの表示値・待っている兵の数・描画用の見た目の値を答える）。
*   `js/view/orbView.js`: 放つ演出の見た目（玉に変わる前の札・スートの色の光の玉・弾ける玉・区切りの式の文字）を描く。
*   `js/view/battleText.js`: …放った区切りの式（「12 ×3 = 36」）…を表示文字に直す。
*   `js/anim/battleAnimConfig.js`: 攻防の演出の設定（…弾み・揺れ・跳ねて落ちる・ずらしの値…呼吸の深さと速さ…）を1か所に凍結して持つ。
*   `js/anim/troopMotion.js`: 兵1体の動きの記録（`TroopUnit`・脚 `TroopLeg`・終わり方 `TroopEnd`）の作成と追記、跳ねて落ちる長さ、時計からの1体の見た目（弾む・揺れる・跳ねて落ちる・城に入って消える・当たる脚の踏み込み。式はここだけ）と、家で待っているか（`idle`）。種類に `goblin`・`shield`・`flame`・`figure` を持ち、…種類ごとの当たったときの終わり方（`troopHitEnd`。炎は消える）を決める。
*   `js/anim/troopSwarm.js`: 名簿の全員の見た目（…呼吸の伸び縮み `scaleX`・`scaleY`・家で待っているか `idle` を含む）を型付き配列の入れ物に書き込む。描画は読むだけ。
*   `js/anim/troopBreath.js`: 陣地の家で待っている自軍の兵の呼吸の伸び縮み（`breathScale`。兵ごとの位相は番号から。乱数なし）。
*   `js/anim/enemyBody.js`: 敵の体（ゴブリンの HP の群れ・シールドを名簿へ置く、攻撃の兵が当たる・シールドが剥がれる、倒れたときに巨人・ドラゴンの絵が跳ねて落ちる記録）と、時計からの絵の見た目を求める。体の見せ方ごとの違いはこのファイルの表で分ける。
*   `js/anim/enemyShows.js`: 敵の種類ごとの攻防の見せ方の表（体の見せ方…）を持ち、引くだけ。
*   `js/anim/chargeShow.js`: ための段の時刻の窓（`chargeWindows`）と、時計からのための強さ（`chargeLevel`）と、巨人・ドラゴンのための姿勢（`sampleChargePose`）を求める。
*   `js/anim/battleFx.js`: 攻防のエフェクト（…ための姿勢）の見た目の入れ物の取りまとめ（`BattleFx`）と、エフェクトが消える時刻。
*   `js/anim/battleDirector.js`: 攻防の演出全体の管理（…兵全員・ヒットマーク・倒れる絵の見た目の入れ物を `update` で書き込む、描画用の見た目の値（…エフェクトの見た目（`fx`・`stage`・`pose`）を含む）…）。
*   `js/view/enemyView.js`: 戦闘の段の敵の絵の描画。段取りの間は絵（巨人・ドラゴン）・HP の数のゴブリンの群れ・常時防御力のシールドマークを描く。攻防の演出中は絵だけを、倒れる動きのずれで段の中で切り抜き、ための姿勢（足元を軸に傾け・伸ばす）で描く。
*   `js/view/battleStageView.js`: 最上段（戦闘）の描画（…敵の図形（`enemyView.js`）…）。敵の絵の見た目（倒れる動き。段取りは null）とための姿勢（段取りは null）を `enemyView.js` へ渡す。
*   `js/view/boardView.js`: 盤面全体の描画の取りまとめ（戦闘の段・段取りの間の兵…。`anim` の見た目の値を各部品に渡し…）。
*   `js/view/troopView.js`: 兵1体の描画…と、名簿の見た目（呼吸の伸び縮みを含む）を奥から描くこと。
*   `js/scenes/BoardScene.js`: 盤面のシーン。入力を受けてルール層の操作を呼び、結果を `anim` に渡して進め…、盤面を描く。放つ演出（`ReleaseShow`）の時計を進め、連鎖の音を鳴らす。…
*   **憲法の要点**: ルールの数値は `js/rules/config.js` だけ、演出の値は `js/anim/battleAnimConfig.js` だけに置く。`update` の中で描かない・`draw` の中で状態を変えない。経過時間は `update(dt)` の `dt` だけ。`ctx` の変換は `save`／`restore` で囲む。`js/` に `requestAnimationFrame`・`addEventListener`・`getContext`・`setTimeout`・`setInterval`・`performance.now()`・`Date.now()`・`Math.random` を書かない。すべてのファイルの先頭に責務の JSDoc（3行以内）、関数・クラス・データ構造に JSDoc。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   **2章 データ構造**:
    *   「設定（調整値）」の「倍率の式に使う値」を「束の補正の値（1枚ごとに足す量・足す量の上限）」に変える。
    *   「操作の結果」の「放った束の内訳と倍率」を「放った束の内訳と足す量」に変える。
*   **3章 処理フロー**:
    *   2（段取り中）: 「区切りごとに合体して『合計 ×倍率 = 加算量』の式を出し」を「区切りごとに合体して『合計 +足す量 = 加算量』の式（足す量 = 枚数 − 1、最大 +6。足す量 0 は加算量の数字だけ）を出し」に変える。「陣地の家で待つ自軍の兵は…伸び縮みする」の後に「戦闘の段の敵（ゴブリンの群れは1体ずつずれた拍子、巨人・ドラゴンは絵全体を足元を軸に）も伸び縮みする」を足す。
    *   4（攻防中）: 「相打ち・当たった後に跳ねて画面の下へ落ちて消える」を「相打ち・当たった後・打撃を受けたときに、進む向きと逆へ弾かれて（自軍の兵は左へ、ゴブリンは右へ）放物線で画面の下へ落ちて消える（シールド・炎・巨人とドラゴンは今のまま）」に、「1体ずつ跳ねて落ちる」の各所も合わせる。「陣地で待つ自軍の兵は呼吸し」を「陣地で待つ自軍の兵・ゴブリンと巨人・ドラゴンは呼吸し（巨人・ドラゴンはための動き・倒れる動きの間はそちらを優先）」に変える。
*   **4章 作成済みのファイルの表**:
    *   `js/rules/release.js`: 「放った束のゲージ加算量の計算（同じスートの区切りごとの足す量（枚数 − 1、上限あり）と加算量。純粋関数）」に。
    *   `js/anim/battleAnimConfig.js`: 「跳ねて落ちる」の後に「・弾かれる横の距離」、「呼吸の深さと速さ」の後に「・巨人とドラゴンの絵の呼吸の深さと速さ」を足す。
    *   `js/anim/troopMotion.js`: 「跳ねて落ちる」を「進む向きと逆へ弾かれて放物線で落ちる（種類ごとの弾かれる向きの表 `KNOCK_DIRS`。終わり方に横のずれ `dx`）」に変える。
    *   `js/anim/troopBreath.js`: 「陣地の家で待っている自軍の兵とゴブリン（名簿の `goblin`・`enemyGuard`・`enemy`）の呼吸の伸び縮み（`breathScale`。兵ごとの位相は種類と番号から。乱数なし）」に。
    *   `js/anim/enemyIdle.js`（新規の行）: 「敵の待機の伸び縮み。段取りの間の見た目の入れ物（`EnemyIdle`。自分の時計で、ゴブリンの群れ1体ずつの伸び縮みを型付き配列へ、巨人・ドラゴンの絵の伸び縮みを入れ物へ書く）と、攻防の間の絵の姿勢（`sampleFigurePose`。ための姿勢に絵の伸び縮みを重ね、ための強さで弱め、倒れ始めたら重ねない）。絵の伸び縮みの式はここだけ（ゴブリンは `troopBreath.js` の式）」。
    *   `js/anim/enemyBody.js`: 末尾に「倒れる動きが始まったかを答える（`enemyFigureFalling`）」を足す。
    *   `js/anim/battleDirector.js`: 「エフェクトの見た目（`fx`・`stage`・`pose`）」を「エフェクトの見た目（`fx`・`stage`）・絵の姿勢（`pose`。ための姿勢に待機の伸び縮みを重ねる）」に変える。
    *   `js/view/battleText.js`: 「放った区切りの式（「12 ×3 = 36」）」を「放った区切りの式（「18 +2 = 20」。足す量 0 は「4」のように加算量だけ）」に。
    *   `js/view/enemyView.js`: 「段取りの間は絵（巨人・ドラゴン。待機の伸び縮みを足元を軸に）・HP の数のゴブリンの群れ（1体ずつの待機の伸び縮み）・常時防御力のシールドマーク（伸び縮みしない）を描く。攻防の演出中は…ための姿勢と待機の伸び縮み（足元を軸に傾け・伸ばす）で描く」に。
    *   `js/view/battleStageView.js`: 「段取りの間の敵の待機の見た目（`EnemyIdleLook`。攻防中は渡さない）を `enemyView.js` へ渡す」を足す。
    *   `js/view/boardView.js`: 取りまとめの中身に「段取りの間の敵の待機の見た目を戦闘の段へ渡す」を足す。
    *   `js/scenes/BoardScene.js`: 「放つ演出（`ReleaseShow`）の時計を進め」の後に「、段取りの間の敵の待機の動き（`EnemyIdle`）の時計を進め」を足す。
*   （タスク実行時に影響が判明した場合は、ここへ追記する。）

## 3. タスクリスト
*   [x] タスク1: 束の補正の式と設定（ルール層）
    *   **対象ファイル** :
        *   `./js/rules/config.js` :（更新）
        *   `./js/rules/release.js` :（更新）
    *   **作業内容** :
        *   `config.js`: `releaseMultiplier` を消して `releaseBonus: Object.freeze({ perCard: 1, max: 6 })` を置き、`Rules` の JSDoc の項目とファイル先頭の責務の文言を書き換える。
        *   `release.js`: `ReleaseSegment` の `multiplier` を `bonus` に置き換え、`computeRelease` を「`bonus = min(max, perCard × (count − 1))`、`amount = sum + bonus`」にする。ファイル先頭の責務・JSDoc（config の型を含む）を合わせる。
        *   `planningResults.js`・`Game.js` に「倍率」「multiplier」の文字がないことを確かめる（なければ変えない）。
        *   構文チェック（`node --input-type=module --check < ファイル`）。
*   [x] タスク2: 玉の記録と式の文字
    *   **対象ファイル** :
        *   `./js/anim/orbTrack.js` :（更新）
        *   `./js/anim/releaseShow.js` :（更新。JSDoc だけ）
        *   `./js/view/orbView.js` :（更新）
        *   `./js/view/battleText.js` :（更新）
    *   **作業内容** :
        *   `orbTrack.js`: `OrbSegment`・`FormulaLook`・`createReleaseOrbs` の引数の型の `multiplier` を `bonus`（足す量）に、写すところを `bonus: seg.bonus` にする。
        *   `releaseShow.js`: `start` の JSDoc の引数の型の `multiplier` を `bonus` にする。
        *   `orbView.js`: `drawReleaseOrbs` の JSDoc の型と `releaseFormulaText(f.sum, f.bonus, f.amount)` にする。
        *   `battleText.js`: `releaseFormulaText(sum, bonus, amount)` を「`bonus > 0` なら `合計 +足す量 = 加算量`、そうでなければ加算量の数字だけ」にし、JSDoc を合わせる。
        *   構文チェック。
*   [x] タスク3: 倒れるときに弾かれる放物線
    *   **対象ファイル** :
        *   `./js/anim/battleAnimConfig.js` :（更新。`knockDistance` を足す）
        *   `./js/anim/troopMotion.js` :（更新）
    *   **作業内容** :
        *   `battleAnimConfig.js`: `knockDistance: 50` と JSDoc の項目を足し、ファイル先頭の責務に「弾かれる距離」が読み取れるよう必要なら文言を合わせる（3行以内）。
        *   `troopMotion.js`: 凍結した表 `KNOCK_DIRS`（JSDoc つき）を足し、`TroopEnd` に `dx` を足し（JSDoc）、`setTroopEnd` で `dx` を決め、`sampleTroop` の落ちる分岐で `x = end.x + end.dx × min(1, τ / (doneAt − time))` にする。ファイル先頭の責務の「跳ねて落ちる」を「進む向きと逆へ弾かれて落ちる」に合わせる（3行以内）。`fallDuration`・縦の式・`sortY` は変えない。
        *   構文チェック。
*   [x] タスク4: 敵の待機の動き（anim）
    *   **対象ファイル** :
        *   `./js/anim/battleAnimConfig.js` :（更新。`figureBreathDepth`・`figureBreathPeriodMs` を足す）
        *   `./js/anim/troopBreath.js` :（更新）
        *   `./js/anim/enemyIdle.js` :（新規）
        *   `./js/anim/enemyBody.js` :（更新。`enemyFigureFalling` を足す）
        *   `./js/anim/battleDirector.js` :（更新）
    *   **作業内容** :
        *   `battleAnimConfig.js`: `figureBreathDepth: 0.025`・`figureBreathPeriodMs: 2000` と JSDoc の項目を足す。
        *   `troopBreath.js`: `KIND_PHASE` にゴブリンの3種類を足し、`breathScale` の判定を表にあるかに変え、`OWN_KINDS` の import を消す。ファイル先頭の責務と JSDoc を「自軍の兵とゴブリン」に合わせる。
        *   `enemyIdle.js`（新規）: 先頭に責務の JSDoc（3行以内）。`figureBreath`（内部）・`sampleFigurePose`（export）・`EnemyIdleLook`（typedef）・`EnemyIdle`（export。`update(ms, typeId, hp)`・`look()`）を、2章「要件2」のとおりに JSDoc つきで書く。import は `battleAnimConfig.js`・`troopBreath.js`・`enemyShows.js` だけ。
        *   `enemyBody.js`: `enemyFigureFalling(body, clock)` を JSDoc つきで足す。
        *   `battleDirector.js`: 絵の姿勢の入れ物 `pose` を持ち、`sampleLooks` で `sampleFigurePose(...)` を呼び、`view()` の `pose` をそれにする。`chargeLevel` は `chargeShow.js` から import する。`BattleLook.pose` の JSDoc を合わせる。
        *   構文チェック。
*   [x] タスク5: 敵の待機の動きの描画と段取りの間のつなぎ
    *   **対象ファイル** :
        *   `./js/view/enemyView.js` :（更新）
        *   `./js/view/battleStageView.js` :（更新）
        *   `./js/view/boardView.js` :（更新）
        *   `./js/scenes/BoardScene.js` :（更新）
    *   **作業内容** :
        *   `enemyView.js`: 足元を軸にした変換を `applyFootPose`（JSDoc つき）に出して倒れる絵の分岐と段取りの絵で共用し、`drawEnemyFigure` に `idle` を足して段取りの絵を伸び縮みさせ、`drawHorde` に `idle` を渡して1体ずつ伸び縮みさせる。シールドマークは変えない。ファイル先頭の責務・JSDoc を合わせる。`ctx` の変換は必ず `save`／`restore` の中。
        *   `battleStageView.js`: state に `idle`（省くと null）を足して `drawEnemyFigure` に渡す。JSDoc を合わせる。
        *   `boardView.js`: `drawBoard` の末尾に `idle = null` を足し、`drawBattleStage` に渡す。JSDoc を合わせる。
        *   `BoardScene.js`: `EnemyIdle` を import し、`init` で作り、`update(dt)` で `update(dt, game.enemy.typeId, game.enemy.hp)`、`draw` で `look()` を `drawBoard` に渡す。プロパティの JSDoc とファイル先頭の責務（3行以内）を合わせる。
        *   構文チェック。
*   [x] タスク6: JSDoc と片付けの確認
    *   **対象ファイル** :
        *   タスク1〜5で変更・作成したファイル（確認と、漏れがあればその修正だけ）
    *   **作業内容** :
        *   変更・作成したすべてのファイルについて、先頭の責務の JSDoc（3行以内）と、クラス・関数・データ構造の JSDoc に漏れがないことを確認する。
        *   `js/` 全体を `multiplier`・`releaseMultiplier`・`倍率`・`×` で探し、束の補正に関わるもの（項目・設定・式の「×」・説明）が残っていないことを確認する（無関係な早送りの倍率などは触らない）。
        *   `js/` 全体を `requestAnimationFrame`・`addEventListener`・`getContext`・`setTimeout`・`setInterval`・`performance.now`・`Date.now`・`Math.random` で探し、今回の変更で増えていないことを確認する。
        *   変更・作成したすべての .js を構文チェックする。
*   [ ] タスク7: 作業レポートの完成
    *   **対象ファイル** :
        *   `./_log/res/261118_1026_RES_Interrupt_倒れ方と待機の動きと束の補正.md` :（更新）
    *   **作業内容** :
        *   「4. 詳細作業内容」の各タスクの欄を記入して完成させ、開発資料の記載に影響が出た点を『開発資料の更新予定』欄に追記する（資料本体は修正しない）。「5. 懸念事項」を見直す。
*   [ ] タスク8: 開発資料の更新（固定タスク）
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` :（更新）
    *   **作業内容** :
        *   『開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定』欄の各項目（束の補正の式と設定の項目、放った結果の区切りの項目、玉の式の表示、倒れるときの弾かれる動き、敵の待機の動き、新しく作る・責務の変わったファイルの表）を、資料本体へ反映する。
        *   ※ 実装AIによる開発資料の書き換えは原則禁止だが、この最終タスクのみ明示的な例外とする。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: 束の補正の式と設定（ルール層）
*   **作業内容** :
    *   `config.js`: `releaseMultiplier` を `releaseBonus: { perCard: 1, max: 6 }` に置き換え、`Rules` の JSDoc とファイル先頭の責務の文言（「束の補正（足す量）の係数」）を書き換えた。
    *   `release.js`: `ReleaseSegment.multiplier` を `bonus` に置き換え、`computeRelease` を `bonus = min(max, perCard × (count − 1))`・`amount = sum + bonus` にした。先頭の責務・JSDoc（config の型含む）も合わせた。
    *   `planningResults.js`・`Game.js` に「倍率」「multiplier」の文字がないことを `js/rules` の検索で確認（変更なし）。構文チェックは両ファイルとも通った。
    *   注意: `multiplier` を読む `orbTrack.js` 等（タスク2の対象）は、タスク2まで一時的に `undefined` を参照する状態。

### タスク2: 玉の記録と式の文字
*   **作業内容** :
    *   `orbTrack.js`: `OrbSegment`・`FormulaLook`・`createReleaseOrbs` 引数の型の `multiplier` を `bonus`（足す量）に、写す2か所を `bonus: seg.bonus` にした。
    *   `releaseShow.js`: `start` の JSDoc の型だけ `bonus` にした。
    *   `orbView.js`: JSDoc の型と `releaseFormulaText(f.sum, f.bonus, f.amount)` にした。
    *   `battleText.js`: `releaseFormulaText(sum, bonus, amount)` を `bonus > 0` なら「18 +2 = 20」、そうでなければ加算量だけにし、JSDoc を合わせた。
    *   4ファイルとも構文チェックが通った。

### タスク3: 倒れるときに弾かれる放物線
*   **作業内容** :
    *   `battleAnimConfig.js`: `knockDistance: 50` と JSDoc の項目を足し、先頭の責務に「弾かれて落ちる距離」を足した（3行以内）。
    *   `troopMotion.js`: 凍結表 `KNOCK_DIRS`（JSDoc つき）・`TroopEnd.dx`（JSDoc）を足し、`setTroopEnd` で `hasOwnProperty` を使って `dx` を決め（'vanish' は 0）、`sampleTroop` の落ちる分岐の横を `end.x + end.dx × min(1, τ / (doneAt − time))`（span ≤ 0 なら `dx` そのまま）にした。縦の式・`fallDuration`・`sortY` は変更なし。先頭の責務の文言も合わせた。
    *   終わり方の記録を作る箇所は `setTroopEnd` だけであることを確認。構文チェックは両ファイルとも通った。

### タスク4: 敵の待機の動き（anim）
*   **作業内容** :
    *   `battleAnimConfig.js`: `figureBreathDepth: 0.025`・`figureBreathPeriodMs: 2000` と JSDoc の項目を足し、先頭の責務の文言を合わせた。
    *   `troopBreath.js`: `KIND_PHASE` に `goblin: 0`・`enemyGuard: 1/2`・`enemy: 1/6` を足し、判定を `hasOwnProperty` に変え、`OWN_KINDS` の import を消した。先頭の責務・JSDoc を「自軍の兵とゴブリン」に合わせた。
    *   `enemyIdle.js`（新規）: `figureBreath`（内部）・`sampleFigurePose`・`EnemyIdleLook`・`EnemyIdle`（`update`・`look`）を2章のとおりに書いた。`look()` は自分自身を返す。
    *   `enemyBody.js`: `enemyFigureFalling(body, clock)` を足した。
    *   `battleDirector.js`: `pose` の入れ物を持ち、`sampleLooks` で `sampleFigurePose` を呼び、`view().pose` を `this.pose` にした。`BattleLook.pose` の JSDoc・先頭の責務を合わせた。
    *   5ファイルとも構文チェックが通った。

### タスク5: 敵の待機の動きの描画と段取りの間のつなぎ
*   **作業内容** :
    *   `enemyView.js`: 足元を軸にした変換を `applyFootPose`（JSDoc つき）に出し、倒れる絵の分岐（`pose`）と段取りの絵（`idle.figure`。`save`／`restore` の中）で共用した。`drawEnemyFigure` に `idle = null` を足し、`drawHorde` は並びの番号 i が `idle.count` 未満なら `idle.scaleX[i]`・`scaleY[i]`、そうでなければ 1・1 を渡す（奥の行から描く順は同じ）。シールドマークは変更なし。先頭の責務・JSDoc を合わせた。
    *   `battleStageView.js`: state に `idle`（省くと null）を足して `drawEnemyFigure` へ渡し、JSDoc・責務を合わせた。
    *   `boardView.js`: `drawBoard` の末尾に `idle = null` を足し、`drawBattleStage` に渡した。JSDoc を合わせた。
    *   `BoardScene.js`: `EnemyIdle` を import し、`init` で作り、`update(dt)` で `update(dt, game.enemy.typeId, game.enemy.hp)`、`draw` で `look()` を `drawBoard` に渡した。プロパティの JSDoc・先頭の責務を合わせた（3行以内）。
    *   4ファイルとも構文チェックが通った。

### タスク6: JSDoc と片付けの確認
*   **作業内容** :
    *   変更・作成した16ファイルの先頭の責務 JSDoc が3行以内であること、`enemyIdle.js` を含む関数・クラスに JSDoc があることを確認した（修正なし）。
    *   `js/` を `multiplier`・`releaseMultiplier`・`倍率`・`×` で検索し、束の補正に関わるものは残っていない（残りは早送りの倍率・`impactFx.js`・絵の倍率・座標の説明など無関係なもの）。
    *   `requestAnimationFrame` 等の禁止語は `js/main.js` の既存の `Math.random` の受け渡し（乱数の関数を渡す箇所）だけで、今回の変更で増えていない。
    *   変更・作成した全 .js の構文チェックが通った。

### タスク7: 作業レポートの完成
*   **作業内容** :
    *   （未記入）

### タスク8: 開発資料の更新（固定タスク）
*   **作業内容** :
    *   （未記入）

## 5. 懸念事項・要確認ポイント
*   **弾かれる横の距離の意味**: `knockDistance`（50px）は「跳ね始めから消える（`doneAt`）までに横へ動く距離の合計」とし、横の速さはその兵の落ちる時間の中で一定にした。消える y（`fallOutY`）は段の下端より兵1体ぶん下なので、見える範囲で動く距離もほぼ 50px になるが、地面の手前（下の方）の兵ほど落ちる時間が短く、横の速さが少し速く見える。目視で確かめてほしい。
*   **段取りから攻防へ移るときの拍子**: 段取りの間の敵の待機の動き（`EnemyIdle` の時計）と攻防の演出の時計は別なので、攻防に入った瞬間に伸び縮みの拍子が1回跳ぶ（自軍の兵の呼吸も今同じ）。深さが小さい（縦 5%・絵は 2.5%）ので目立たない見込み。
*   **シールドは伸び縮みしない**: 巨人・ドラゴンの体は伸び縮みするが、体の上のシールド（段取りのマーク・攻防の名簿のシールド）は動かない。縦 2.5% の伸び縮みでのずれは数 px なので、体から大きく離れては見えない見込み。目視で確かめてほしい。
*   **敵の絵の呼吸の値**: 巨人・ドラゴンの深さ・速さ（`figureBreathDepth: 0.025`・`figureBreathPeriodMs: 2000`）は自軍の兵と別の値にした（絵の高さが 200px あるため）。試遊で決め直す。
*   **テストプレイで確かめること（発注者が見る点）**:
    *   相打ち・当たった後・打撃を受けたときに、兵は左へ、ゴブリンは右へ、約 50px 弾かれて放物線で画面の下へ落ちる。シールド・炎・倒れる巨人とドラゴンは今のまま。
    *   ゴブリン（群れ・防御のゴブリン）・巨人・ドラゴンが、段取りの間も攻防の間も、ゆるやかに伸び縮みしている。ゴブリンは1体ずつ拍子がずれている。巨人・ドラゴンは地面から浮かない。振りかぶり・吸い込みのための動きと倒れる動きは今のまま。
    *   同じスートを続けて放つと、加算量が「合計 + (枚数 − 1)」になり、玉の式が「18 +2 = 20」のように出る。1枚だけなら数字だけ出る。7枚そろえても足す量は +6。ゲージ・兵の数が新しい加算量と一致する。
    *   音・HP の変化・ヒットマーク・白い光・ヒットストップの時刻が今と変わらず、早送り・スキップが今と同じく使え、タイトルからクリア・負けまで通しで遊べる。
