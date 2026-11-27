# RES: 作業計画・作業レポート (Interrupt) : スライムの分裂（ダメージを受けると子スライムが生まれ、次のターンに襲ってくる）
* 参照元REQ: `./_log/req/261127_0333_Interrupt_スライムの分裂.md`

## 1. 作業目的
★1の敵「スライム」（`slime`）を、**ダメージを受けると与えたダメージの3割（切り上げ）の「子スライム」が生まれ、次のターンのふつうの攻撃に上乗せして襲ってくる敵** に作り直す。名前・識別子は今のまま（「スライム」・`slime`）で、★1は6種のまま。

* 狙い: 防御の準備がないときに大攻撃をぶちかますと、次のターンに痛い目にあう。盾を寝かせておくか、寝かせた束で一気に倒しきるのが上手い遊び方になる。
* スライムは毎ターンふつうの攻撃（2〜3＋ステージの加算）を行い、防御はしない（防御だけのターン・大防御はなくなる。防御はいつも 0）。並びの組は骸骨と同じ「攻撃か防御」のまま（設定の `motion: 'either'`）。
* 子スライムの数・予告への上乗せ・攻防の結果（子スライムが盾の兵・城にどれだけ当たり、スライム自身の攻撃がどれだけ当たったか、何匹生まれたか）は、**ルール層が決めて出来事として出す**。演出は出来事と状態を読むだけで計算し直さない。
* 子スライムは「次のターンに持ち越す攻撃のユニット」（コードの呼び名は `minion`。設定の呼び名は分裂 `split`）として、敵の種類ごとの設定・表で持つ。**敵の種類の識別子で分岐する if は書かない**。
* 中断データの版を 8 に上げ、子スライムの数を持たせる。DEBUG タブでスライムの値（最大 HP・攻撃の幅・子スライムが生まれる割合）と子スライムの数の操作を使えるようにする。
* **ほかの7種の敵（猪の親子を含む。数値・動き・見た目・乱数を呼ぶ順と回数・攻防の計算と出来事・時間割）、自軍、ステージの加算と疲弊、1ターンの流れ、スコアの項目・精鋭・強化は変えない。**

## 2. アーキテクチャ設計

### 全体の形
| ファイル | 層 | 変更 | 役割（今回足すこと） | タスク |
| --- | --- | --- | --- | --- |
| `js/rules/enemySplit.js` | ルール | **新規** | 子（次のターンに持ち越す攻撃のユニット）を持つ敵の純粋な計算（生まれる数・相殺と城の被害のうち子の分・予告への子の数の付け方（タスク1）、中断データの形の確かめ（タスク3）） | 1・3 |
| `js/rules/config.js` | ルール | 更新 | 型（`EnemySplitSpec`・`EnemySpec.split`）（タスク1）・行動の決まりの種類 `assault`（タスク2）。スライムの行（タスク7） | 1・2・7 |
| `js/rules/combatants.js` | ルール | 更新 | 敵の状態に子の数（`minions`。子を持たない敵は 0）・予告の型に任意の `minions` | 1 |
| `js/rules/battle.js` | ルール | 更新 | 入力の襲う子の数と分裂の設定から、出来事 `minionAttack`・`block.minions`・`castleDamage.minions`・`minionSpawn` を出し、攻防の後の子の数を返す（入力がなければ今と同じ） | 1 |
| `js/rules/Game.js` | ルール | 更新 | 予告に子の数を付ける（`intentOf`）・攻防に子の数と分裂の設定を渡し、攻防の後の子の数を敵に入れる（`resolveBattle`）。呼ぶ行だけ | 1 |
| `js/rules/enemyBehaviors.js` | ルール | 更新 | 行動の決まり「毎ターン攻撃だけ」（`assault`）の行 | 2 |
| `js/rules/debugIntents.js` | ルール | 更新 | `assault` の指定できる行動（`attack` の1つ） | 2 |
| `js/rules/debugRuleItems.js` | ルール | 更新 | `assault` のルールの値の項目（攻撃の幅）（タスク2）・分裂の割合の項目（タスク8） | 2・8 |
| `js/rules/suspendData.js` | ルール | 更新 | 敵の項目に `minions`・予告の形に任意の `minions`・`SUSPEND_VERSION` 8 | 3 |
| `assets/sprites/unit_slime_child.js` | assets | **新規（コピー）** | `unit_slime.js` のコピー（先頭の説明の1行目だけ「子スライムの仮のスプライト」に直す） | 4 |
| `js/view/spriteView.js` | view | 更新 | 子スライムのスプライトの import・`SPRITE_IDS.slimeChild`・絵の範囲の表の行（スライムと同じ値） | 4 |
| `js/view/minionSkins.js` | view | **新規** | 子を持つ敵の種類ごとの、子の絵（体の絵・焼き付けの識別子）の表 `MINION_SKINS` と引く関数 | 4 |
| `js/view/minionPlaces.js` | view | **新規** | 子を持つ敵の種類ごとの、子の大きさと待つ場所の表 `MINION_PLACES` と、配置（待つ場所の矩形・生まれ出る位置）の組み立て | 4 |
| `js/view/layout.js` | view | 更新 | 戦闘の段の配置に `minionPlaces`・`minionSlots`、その敵の兵の配置（`troopsFor`）に子の陣地と大きさ（タスク4）。予告の札の間 `intentBadge.minionGap`（タスク6） | 4・6 |
| `js/view/troopView.js` | view | 更新 | 兵の種類 `minion`・`minionBorn` の見た目（`MINION_SKINS` で引く）と焼き付け | 4 |
| `js/anim/minionShow.js` | anim | **新規** | 子の攻防の見せ方（出来事から子の段を作る・待っていた子を名簿に置く・襲う行進・生まれて待つ場所へ跳ぶ・待っていた数と段の食い違いの確かめ） | 5 |
| `js/anim/battleSteps.js` | anim | 更新 | 写しに待っていた子の数（`enemyMinions`）。子の段を差し込み、相殺・城の被害の段を「子の分」と「敵自身の分」に分ける。生まれる段 | 5 |
| `js/anim/battleTimeline.js` | anim | 更新 | 待っていた子を時刻 0 に置き、段 `minionMarch`・`minionSpawn` の組み立てを `minionShow.js` につなぐ（呼ぶ行だけ） | 5 |
| `js/anim/troopRoster.js` | anim | 更新 | 種類 → 陣地の表 `CAMP_OF` に `minion`・`minionBorn` | 5 |
| `js/anim/troopMotion.js` | anim | 更新 | 兵の種類の型と、弾かれる向きの表 `KNOCK_DIRS` に `minion`・`minionBorn` | 5 |
| `js/anim/battleAnimConfig.js` | anim | 更新 | 子が生まれて待つ場所へ跳ぶ長さ（`minionHatchMs`） | 5 |
| `js/view/enemyView.js` | view | 更新 | 段取りの間、待っている子の群れ（敵の状態の `minions` の数）を描く | 6 |
| `js/view/intentParts.js` | view | 更新 | 予告に「子の側」を出すか（`minions`） | 6 |
| `js/view/intentView.js` | view | 更新 | 攻撃の札の横に、子の絵と数の札をもう1つ並べる | 6 |
| `js/view/battleText.js` | view | 更新 | 子の名前の表（`MINION_LABELS`）・予告の子の数の文字・ターンの始まりの文字に「+子スライム 8」 | 6 |
| `js/view/bannerView.js` | view | 更新 | 合図の値に敵の種類の識別子（`enemyTypeId`）を受け、ターンの始まりの文字に渡す | 6 |
| `js/scenes/BoardScene.js` | scenes | 更新 | 合図の値に `enemyTypeId: game.enemy.typeId` を足す（1行） | 6 |
| `js/rules/debugRules.js` | ルール | 更新 | 値の種類 `percent`（0〜100 の整数）の確かめ | 8 |
| `js/rules/debugControls.js` | ルール | 更新 | 「子スライム +5」「子スライムを 0 にする」の操作（`addEnemyMinions`・`clearEnemyMinions`） | 8 |
| `js/scenes/debugRuleSliders.js` | scenes | 更新 | 値の種類 `percent` のスライダーの範囲と、値の文字の付け方の表 | 8 |
| `js/view/debugText.js` | view | 更新 | 項目名「子スライムが生まれる割合」・2つのボタンの文字・百分率（整数）の文字 | 8 |
| `js/view/debugLayout.js` | view | 更新 | 「子を 0 にする」「親を 0 にする」の下に子スライムのボタンの段 | 8 |
| `js/scenes/debugTab.js` | scenes | 更新 | 2つのボタンを足して盤面のデバッグの口につなぐ | 8 |
| `js/scenes/boardDebug.js` | scenes | 更新 | 2つのボタンの口 | 8 |
| `PROJECT_ARCHITECTURE.md` | 資料 | 更新 | 最終タスクでだけ反映 | 10 |

* **敵の種類の識別子で分岐する if は書かない。** 子を持つかは設定の `split` があるか（状態では `enemy.minions`。子を持たない敵は 0、予告は `minions` を持たない）で決まる。子の絵・大きさ・待つ場所は `MINION_SKINS`・`MINION_PLACES`（同じ識別子の行）、子の名前の文字は `battleText.js` の `MINION_LABELS`、生まれ出る位置はその敵の絵の表（`ENEMY_FIGURES`）の足元から求める。演出は出来事（`minionAttack`・`block.minions`・`castleDamage.minions`・`minionSpawn`）があるときだけ子の段を作るので、ほかの敵の段・時間割は変わらない。
* **ルールと画面の分離:** 子の数・予告の量・攻防の結果はルール層（`enemySplit.js`・`battle.js`・`Game.js`）。演出は、写しの待っていた子の数（`BattleSnapshot.enemyMinions`）と出来事の量を段にするだけ。画面は `game.enemy.minions` と予告の `minions` を読むだけ。
* **乱数:** 子の数・生まれる数・相殺の分け方は乱数を使わない。スライムの行動の決まり `assault` は量の抽選の1回だけ（防御の乱数は呼ばない）。ほかの7種の呼ぶ順・回数は変えない。並びの決定（`stageOrder.js`）は乱数を呼ばない。
* **数値の置き場所:** ルールは `config.js`（スライムの行の `split.percent`・攻撃の幅）、動きの長さは `battleAnimConfig.js`、大きさ・待つ場所は `minionPlaces.js` の表と定数、予告の札の間は `layout.js` の定数、DEBUG のボタンの数（5）は `debugTab.js` の定数。

#### 区切りの順（どのタスクの終わりでも起動とプレイが壊れない）
REQ の目安の順（ルール層 → 演出の仕組み → スプライトと見た目 → 中断データ → スライムの設定の切り替え → DEBUG）を基にし、次の3点を変える。スライムの設定はタスク7まで今のまま（`either`・`split` なし）なので、どの区切りでも敵の `minions` は 0、予告は `minions` を持たず、出来事に子の出来事は出ず、ゲームと見た目は今と同じに動く。
1. **行動の決まり `assault` の表の行（タスク2）を切り替えの前に置く。** `debugRuleItems.js` の `RULE_ITEMS` は読み込んだときに `RULES` から組み立て、行動の決まりの種類の表にない種類は Error を投げる（`main.js` から辿って読み込まれるので、ふつうの起動も壊れる）。`enemyBehaviors.js`・`debugIntents.js` の行も、ないと `createEnemy`・DEBUG の選択肢が Error になる。そこで3つの表の `assault` の行をタスク2で先に足す（どの敵も使わないので何も変わらない）。
2. **中断データ（タスク3）を演出の前に置く。** 敵の `minions` はタスク1から敵の状態にある。中断データが持たないと、再開した盤面の敵に `minions` がなく（`undefined`）、タスク5の写し・タスク6の描画が数を読めない。タスク3で保存・確かめ・戻しに足して版を 8 に上げる（今の敵はどれも 0 なので遊び方は変わらない）。タスク1・2の間に再開した盤面の敵は `minions` を持たないことがあるので、タスク1の `Game.js` は予告の `minions` を `?? 0` で読み、`intentWithMinions` は `split` のない敵では予告をそのまま返す（`minions` を読まない）。
3. **子の見せる表のスライムの行（`MINION_SKINS.slime`・`MINION_PLACES.slime`）はタスク4で先に足してよい。** 子の群れは `minions` が 1 以上のときだけ描かれ、切り替えまではいつも 0 なので、今のスライムの見た目は変わらない（猪の親子のうり坊と違い、表に行があるだけでは何も描かれない）。焼き付けの一覧に子スライムの絵が1枚増えるだけ。
* タスク7（切り替え）は、見せる表（タスク4）・演出（タスク5）・予告の札と文字（タスク6）・中断データ（タスク3）がそろった後に置く。タスク8（DEBUG）が入るまでは、スライムのルールの値に「子スライムが生まれる割合」が出ず、子スライムの数のボタンがないだけで壊れない。

### 要件1: スライムの数値と行動（タスク2・タスク7）

**設定（`config.js`）** スライムの行をタスク7で次にする（識別子 `slime`・名前・★・最大 HP は今のまま）。
```js
slime: Object.freeze({
  name: 'スライム',
  star: 1,
  maxHp: 40,
  motion: 'either',
  split: Object.freeze({ percent: 30 }),
  behavior: Object.freeze({
    type: 'assault',
    attackRange: Object.freeze({ min: 2, max: 3 }),
  }),
}),
```
* 型（タスク1）: `EnemySplitSpec`（`percent`＝与えたダメージに対する、生まれる子の数の百分率。0〜100 の整数。数は切り上げ）と `EnemySpec.split`（任意。書かなければ子を持たない）。`config.js` の先頭の説明にも分裂 `split` を足す。
* 型（タスク2）: `EnemyBehaviorSpec.type` に `'assault'`（毎ターン攻撃だけ。防御しない）を足し、`attackRange` の説明の対象に `assault` を足す。`attackChance`・`guardRange`・`bigGuardChance`・`bigGuardRange` の説明は `either` のまま（骸骨が使う）。
* スライムは防御の設定（`defense`）を持たないまま。

**行動の決まり `assault`（`enemyBehaviors.js`・タスク2）** 表 `BEHAVIORS` に1行足す（`steady` の行と同じ形で、隙だけ違う）。
```js
assault: Object.freeze({
  initialState: () => ({}),
  isState: (state) => isPlainObject(state),
  planNext: (behavior, state, random, unit) => ({
    action: steadyAttackAction(behavior, random, unit),
    state,
  }),
  countdown: () => null,
  isOpening: () => true,
}),
```
* 毎ターンふつうの攻撃（攻撃・中の種類なし・量は `attackRange` から1回抽選）。状態は持たない（`{}`）。数え下ろしは持たない。
* 隙はすべてのターン（`isOpening` が真）。`createIntent` は隙の行動では防御の乱数を呼ばず防御 0（敵が防御の設定を持たないので、隙でなくても 0。両方の理由で防御はいつも 0）。
* 乱数: 量の抽選の1回だけ（`planBehaviorAction` の説明の乱数の使い方の並びに `assault: 攻撃の量` を足す）。
* `isBehaviorState` の説明の形の並びに `assault`（プレーンなオブジェクト）を足す。先頭の責務の決まりの一覧に「毎ターン攻撃だけ」を足す（3行以内のまま）。

**DEBUG の指定できる行動（`debugIntents.js`・タスク2）** 表 `INTENT_TABLE` に1行足す。
```js
assault: Object.freeze({
  ids: () => ['attack'],
  plan: (behavior, id, random, unit) => {
    if (id !== 'attack') throw new Error(`unknown intent id: ${id}`);
    return { action: steadyAttackAction(behavior, random, unit), state: {} };
  },
  chosen: () => 'attack',
}),
```
* 選択肢の文字は今の `INTENT_CHOICE_TEXT.attack`（「攻撃」）をそのまま使う（`debugText.js` は変えない）。選択肢の枠の数（`intentChoiceSlotCount`）は今の最大 3 のまま。

**ルールの値の項目（`debugRuleItems.js`・タスク2）** `BEHAVIOR_ITEMS` に1行足す（`steady` と同じ攻撃の幅の2項目）。
```js
assault: (typeId, behavior, unit) => rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount',
  (c) => c.enemies[typeId].behavior.attackRange, unit),
```

**並び** 組の鍵は `motionKeyOf(spec)` = `spec.motion ?? spec.behavior.type`。スライムは `motion: 'either'` なので骸骨と同じ「攻撃か防御」の組のまま。★1の組と組の中の順（ゴブリン・オーガ／狼・猪の親子／骸骨・スライム）は変わらず、同じ日付・同じステージで同じ敵の種類が出る（`enemyTypes.js`・`stageOrder.js` は変えない）。

**見込みの値（加算の後）** 最大 HP と攻撃の量（`stageBonus.js` の今の値で求めた）。
| ステージ | 最大 HP | 攻撃の量 | 1回の攻防で生まれる子の最大（倒さないとき。最大 HP − 1 を与えたとき） |
| --- | --- | --- | --- |
| 1 | 40 | 2〜3 | 12 |
| 21 | 108 | 20〜21 | 33 |
| 30 | 152 | 31〜32 | 46 |
| 100 | 488 | 119〜120 | 147 |

### 要件2: 子スライム（ルール層。タスク1・タスク3）

**状態**
* 敵の状態 `Enemy.minions`（待っている子の数。0 以上の整数。子を持たない敵はいつも 0）。`createEnemy` は 0 で作る（敵が替わる・DEBUG の切り替え・ステージを移すと 0）。
* 予告 `EnemyIntent.minions`（任意。**子を持つ敵の予告だけが持つ**、このターンのふつうの攻撃に上乗せして襲う子の数）。予告を作るとき（`Game.intentOf`）に、敵の `minions` を写す。子を持たない敵の予告は今と同じ（項目を持たない）。
* 段取りの間（予告を決めた後）は `intent.minions === enemy.minions`。攻防（`resolveBattle`）は予告の `minions` で襲い、攻防の後の `enemy.minions` は「その攻防で生まれた数」（倒した・城が落ちた攻防・生まれない敵では 0）になる。次のターンの予告（`advancePhase` → `planIntent`）でそれが予告に写る。つまり「襲いかかった後は消え、そのターンの攻防で生まれた子だけが次のターンに残る」。
* 3択の段階（敵を倒した後）の敵は `minions` が 0、予告は倒したターンのもの（`minions` が 0 より大きいこともある）。

**計算の置き場所（`js/rules/enemySplit.js`。新規。何も import しない）**
* 先頭の責務（3行以内）: 「次のターンに持ち越す攻撃のユニット（子。スライムの子スライム）を持つ敵の純粋な計算（生まれる数・相殺と城の被害のうち子の分・予告への子の数の付け方・中断データの形の確かめ）。何も import しない（ルール層）。」
* `minionBirths(split, dealt)`: 分裂の設定（`{ percent }`。`null`・`undefined` は子を持たない）と、その攻防で敵の HP が実際に減った量（`enemyDamage` の量。残りの HP で頭打ちの値）から、生まれる数を返す。`split` がない・`dealt` が 0 以下なら 0。そうでなければ `Math.floor((dealt * split.percent + 99) / 100)`（整数だけの切り上げ。浮動小数の誤差を避ける）。上限・ステージの加算・疲弊はない。例（30%）: 0 → 0、1 → 1、3 → 1、4 → 2、10 → 3、11 → 4。
* `minionShares(minions, blocked, damage)`: 襲う子の数 `minions`、盾の兵での相殺の合計 `blocked`、城の被害の合計 `damage` から、そのうち子の分 `{ blocked, damage }` を返す。**盾の兵に当たる順は「子スライムが先」**（子が先に盾の兵と相打ちになり、残った盾の兵がスライムの攻撃を受ける。城の被害も子の分が先）。`blocked` の子の分 = `min(blocked, minions)`、`damage` の子の分 = `min(minions − 子の相殺, damage)`。合計の `blocked`・`damage` は今の式のまま求めたもの（下）なので、子の分 ≤ 合計。
  * 子が先にした理由: 子は前のターンから城の側（スライムの左）で待っていて、スライムが駆け寄る前に行進で盾の兵に着く（見せ方の順と合う）。合計（`block`・`castleDamage`）は順によらず同じ。
* `intentWithMinions(spec, intent, minions)`: `spec.split` があれば `{ ...intent, minions }` の新しい予告、なければ `intent` をそのまま返す（ほかの敵の予告は今と同じオブジェクトの形）。`minions` が `undefined`（タスク3より前に再開した敵）のときは 0 とみなす。
* `isEnemyMinionsShape(spec, minions, intent)`（タスク3）: 中断データの形の確かめ。`spec.split` がない敵は `minions === 0` かつ `intent.minions === undefined`。ある敵は `minions` が 0 以上の整数で、`intent.minions` は `undefined` か 0 以上の整数（段取りの間は同じ値、3択の段階は違ってよいので、等しさは見ない）。どんな値でも例外を投げず真偽を返す。

**攻防の計算（`battle.js`・タスク1）**
* 入力 `BattleInput` に任意の2項目を足す: `minions`（この攻防でふつうの攻撃に上乗せして襲う子の数。省くと 0）、`split`（分裂の設定 `{ percent }`。省く・`null` は生まれない）。
* 出来事 `BattleEvent` の種類に `minionAttack`（襲う子の数。`minions` が 1 以上のときだけ、敵の攻撃の側（と敵の防御 `enemyDefend`）の直後に入る）と `minionSpawn`（生まれた子の数。1 以上のときだけ、`enemyDamage` の直後に入る。倒した攻防では入らない）を足し、任意の項目 `minions`（`block`・`castleDamage` のうち子の分。`minionAttack` がある攻防の `block`・`castleDamage` だけが持ち、0 のこともある）を足す。
* 結果 `BattleCalc` に `minions`（攻防の後の子の数＝生まれた数。城が落ちた攻防は 0）を足す。
* 計算（今の順のまま。`minions` が 0 で `split` がなければ、出来事・結果は今と同じ。結果に足した `minions` だけが 0 で増える）:
```js
const minions = input.minions ?? 0;
// 敵の攻撃の側・enemyDefend は今のまま
if (minions > 0) events.push({ type: 'minionAttack', amount: minions });
const total = enemyAttack + minions;
const blocked = Math.min(defense, total);
const damage = Math.min(total - blocked, castleHp);
const share = minionShares(minions, blocked, damage);
const minionField = minions > 0 ? { minions: share.blocked } : {};   // castleDamage は share.damage
if (blocked > 0) events.push({ type: 'block', amount: blocked, ...minionField });
castleHp -= damage;
if (damage > 0) events.push({ type: 'castleDamage', amount: damage, ...(minions > 0 ? { minions: share.damage } : {}) });
// 城が落ちたら lose で終わり（結果の minions は 0）。札が燃える・敵の回復・enemyBlock・enemyDamage は今のまま
const born = enemyHp > 0 ? minionBirths(input.split, dealt) : 0;   // enemyDamage の直後
if (born > 0) events.push({ type: 'minionSpawn', amount: born });
// enemyDefeat・heal は今のまま。return に minions: born
```
* 最大の一撃（`tallyBattle`。自軍の攻撃 − `enemyBlock`）と城の被害の記録（`recordBattle`。`castleDamage` があれば無傷でない）は変えない（子の城の被害も `castleDamage` の合計に入る）。`gameStats.js`・`battleRecord.js` は知らない出来事を読まないので変えない。
* 先頭の責務・`computeBattle` の説明の順序に、子の襲撃（ふつうの攻撃に上乗せ・子が先）と生まれる子を足す（3行以内）。

**ゲーム（`Game.js`・タスク1。呼ぶ行だけ）**
* `import { intentWithMinions } from './enemySplit.js';`
* `intentOf(action)`: 設定を1回引き、`return intentWithMinions(spec, createIntent(spec, action, …今のまま), this.enemy.minions);`。`planIntent`（ターンの始まり）と DEBUG の `chooseEnemyIntent` の両方がここを通るので、予告はいつも今の子の数を持つ。
* `resolveBattle()`: `computeBattle` の入力に `minions: enemyAction.minions ?? 0` と `split: spec.split ?? null` を足し、`this.enemy.parts = calc.enemyParts;` の次に `this.enemy.minions = calc.minions;`。`BattleResult` の形は変えない（`enemyAction` は予告の写しなので `minions` を含む）。
* 先頭の責務に「子を持つ敵は子の数を予告と攻防に渡す」を足す（3行以内のまま）。

**予告**: 予告の攻撃の量（`amount`）はふつうの攻撃（2〜3＋加算）だけで、子の数は別の項目 `minions`。札・ターンの始まりの文字は両方を並べて出す（要件3）。

**中断データ（`suspendData.js`・タスク3）**
* `SUSPEND_VERSION` を 8 にし、版の歴史の説明に「8: 敵の子の数 `minions` と予告の `minions` を足したとき 7 から上げた。」を足す。版 7 のデータは版番号違いで捨てられる。
* `FIELDS.enemy`: `save` に `minions: game.enemy.minions`、`check` に `isEnemyMinionsShape(enemySpecOf(config, value.typeId), value.minions, value.intent)`（`isIntentShape` の後）、`load` に `minions: v.minions`。
* `isIntentShape`: `minions` は無いか 0 以上の整数（説明の文にも足す）。
* `SuspendData.enemy` の型に `minions`。先頭の責務は変えない（形の項目は表にある）。

### 要件3: 見た目・動き・音（タスク4〜6）

**子スライムのスプライト（タスク4）**
* `assets/sprites/unit_slime.js` をコピーして `assets/sprites/unit_slime_child.js` を作る（**本 REQ で明示的に認められたコピー**）。中身はコピーのままで、先頭の説明の1行目だけ「子スライムの仮のスプライト（左向き。原点は体の中ほど、足元は範囲の下端）。」に直す。ほかのスプライトは変えない。コピーは手で書いた仮のスプライトのコピーで、OZ Vector Editor の書き出しではない（シェルでのコピーでよい）。
* `spriteView.js`: `import unitSlimeChild from 'assets/sprites/unit_slime_child.js';`、`SPRITE_IDS.slimeChild = 'slimeChild'`（`SPRITE_IDS` の型にも）、`SPRITE_TABLE` に `[SPRITE_IDS.slimeChild]: Object.freeze({ sprite: unitSlimeChild, minX: -156, maxX: 145, minY: -120, maxY: 120 })`（スライムと同じ値）。発注者が描き直して同じ名前で上書きしたら、この行を新しい `bounds` に合わせるだけで済む（子の体は長い方の辺を子の大きさにして描くので、縦横比が変わっても大きさの決め方は同じ）。

**子の絵の表（`js/view/minionSkins.js`・新規・タスク4）** `hordeSkins.js` と同じ形。`spriteView.js` だけを import する。
```js
export const MINION_SKINS = Object.freeze({
  slime: Object.freeze({ body: SPRITE_IDS.slimeChild, item: null, bake: 'slimeChild' }),
});
export function minionSkinOf(typeId) { /* 表にない・null は null */ }
```
* 先頭の責務: 「子（次のターンに持ち越す攻撃のユニット）を持つ敵の種類ごとの、子の絵（体の絵・持ち物・焼き付けの識別子）の表を持ち、引くだけ。状態は変えず、import するのは spriteView.js だけ。」
* **`HORDE_SKINS` には足さない**（足すと `isHordeEnemy('slime')` が真になり、段取りの間のスライムが群れで描かれ、敵の絵（`enemyPortrait.js`）にも子が出てしまう）。

**子の大きさと待つ場所（`js/view/minionPlaces.js`・新規・タスク4）** 何も import しない純粋な表と関数。
```js
/** 子を持つ敵の種類 → 子の大きさと待つ場所（x・w は段の左端からの絶対値。h は足元の範囲の下端（groundY）から上への高さ）。試遊で決め直す値。 */
export const MINION_PLACES = Object.freeze({
  slime: Object.freeze({ size: 24, area: Object.freeze({ x: 440, w: 70, h: 130 }) }),
});
/** 生まれ出る足元の y の、groundY から上への高さ（絵の奥から出るように、絵の足元より少しだけ上）。試遊で決め直す値。 */
const HATCH_RISE = 2;
export function createMinionPlaces({ groundY, fieldH, figures }) { … }
```
* `createMinionPlaces` は識別子 → `{ size, area: { x, y: groundY − h', w, h' }, hatch: { x, y } }` を凍結して返す（`h'` = `min(h, fieldH)`）。`hatch.x` はその敵の絵（`figures[typeId]`。`layout.js` が `enemyFigures` を渡す）の矩形の下端の中央の x（体が縮んでも足元の中央は動かない）、`hatch.y` = `groundY − HATCH_RISE`。**絵のない敵の行は Error**（子は絵の敵から生まれる前提。今はスライムだけ）。
* 先頭の責務: 「子を持つ敵の種類ごとの、子の大きさと待つ場所の表を持ち、そこから配置（待つ場所の矩形・生まれ出る位置）を組み立てる。状態は持たず、何も import しない。」

**配置（`layout.js`・タスク4）**
* `createBattleLayout` で、`enemyFigures` を作った後に `const minionPlaces = createMinionPlaces({ groundY, fieldH: FIELD_H, figures: enemyFigures });`。
* `minionSlots(typeId, count)`: 子 count 匹の並び（番号の順。`{ x, footY, size }`）。i 番目は `campSlot(place.area, i)`（味方の兵と同じ R2 列。乱数なし。番号だけで決まり、数によらない）。表にない識別子は Error（`hordeSlots` と同じ形）。count が 0 以下なら空。
* `troopsFor(typeId)`: 子を持つ敵は、その敵の兵の配置（群れの行があればそれ、なければ `troops`）に、`camps.minion`（= `place.area`）と `kindSizes.minion`・`kindSizes.minionBorn`（= `place.size`）を足した凍結の写しを返す（作るときに1回だけ作る。今の `troopsByType` の作りの後に、`MINION_PLACES` の識別子ごとに足す）。ほかの敵は今と同じオブジェクト。
* `BattleLayout` の型に `minionPlaces`・`minionSlots`、`TroopLayout` の型の `camps`・`kindSizes` に「子を持つ敵との攻防だけ `minion`」を足す。先頭の責務の並べ方の一覧に「子の待つ場所（種類ごとの大きさと範囲は minionPlaces.js の表）」を足す（3行以内のまま）。

**並ぶ場所と重なりの見積もり（論理座標 720×1280。`groundY` 335・兵の足元の範囲 y 145〜335）**
* スライムの絵: 高さ 120・幅 約 150（x 約 545〜695。中心 x 620。HP が減ると足元の中央を軸に半分まで縮む）。
* 子の待つ場所: 足元の中心が x 440〜510・y 205〜335 に入る。体（直径 24）の範囲は x 約 428〜522・y 約 181〜335。スライムの左（城の側）で、絵と約 20px、防御の陣地（x 300〜400。体は 412 まで）と約 16px 空く。
* 予告の札: スライムの札は中心 x 620、高さ 44、上端 y 141（HP 満タン）〜201（いちばん縮んだとき）。子の札を足した2枚の幅は 約 150〜210 で、中央にそろえ、右端（x 712）を越えるときは左へ寄せるので、左端は x 約 512〜545。子の体と重なるのは、攻撃の量が3桁の後半のステージで、子の数も3桁のときの、札の左下の約 10×40px だけ（目視の確認を5章に書く）。
* 人数の表示（左上。x 298 まで）・最上部のゲージ・城（中心 x 240）・HP の表示とは重ならない。ほかの敵の並びと見た目は変えない（子の陣地はスライムとの攻防だけに足す）。

**兵の見た目と焼き付け（`troopView.js`・タスク4）**
* `TROOP_LOOKS` に `minion`（待っている・襲う子）と `minionBorn`（その攻防で生まれた子）を足す。どちらも `{ body: SPRITE_IDS.slimeChild, item: null, bake: 'slimeChild', minion: true }`。型 `TroopLook` に任意の `minion`（真なら `drawTroop` の `enemyTypeId` の `MINION_SKINS` の絵で描く。この項目の体は絵を引けないときの既定）。
* `drawTroop`: `look.horde === true` の引き方の次に、`look.minion === true` なら `minionSkinOf(enemyTypeId)` があればそれにする（識別子の if ではなく表を引く）。
* `createTroopBakes`: `MINION_SKINS` の識別子ごとに、`battleLayout.minionPlaces[typeId].size` で1枚焼き付ける（行がなければ Error。`HORDE_SKINS` の行と同じ形）。子は傷つかないので傷ついた絵は焼き付けない。
* 先頭の責務の兵の一覧に「子（子スライム）」を足す。

**攻防の演出（タスク5）**
* 段の順（子が先・重ならない）: 子スライムの見せ方とスライム自身の打撃（`dashBounce`）は**順に**行い、同時には動かさない。
  1. `minionMarch`（量＝襲う子の数、`pairs`＝`block.minions`）: 待つ場所にいる子が、ゴブリンの攻撃の兵と同じ行進（`marchSquad`。相手は防御の兵。向きは左）で盾の兵の前へ進む。組のない子は `enemyAdvanceX` だけ進む。
  2. `block`（`kind: 'minion'`、量＝`block.minions`）: 盾の兵と1対1で相打ち（今の `addClash`）。
  3. `castleHit`（`kind: 'minion'`、量＝`castleDamage.minions`）: 残った子が城へ向かって当たって消え、城の HP の表示が減る（今の `addCastleHit`。残りの子は全員城へ向かう）。
  4. ここからスライム自身の攻撃（今のまま）: 駆け寄り → `strikeBlock`（量＝`block` − 子の分）→（盾を倒しきったら駆け寄り → `strikeCastle`（量＝`castleDamage` − 子の分））→ 戻り。`insertDashSteps` は打撃の段だけを見るので、子の段には駆け寄りを差し込まない。
  5. 自軍の突撃・`enemyHit`（今のまま）→ `minionSpawn`（量＝生まれた数）→ 修理。
  * 城が落ちるとき: 出来事は `lose` で止まり、駆け寄りの戻りは入らない（今のまま）。子だけで城が落ちると、スライムの打撃の段は量 0 で作られず、スライムは動かない。
  * 子が 0 匹の攻防・ほかの敵: 子の段は1つも作らず、段の並びは今と同じ。
* 生まれるとき（`minionSpawn`）: スライムの足元の中央（`hatch`。絵の奥）から、生まれた子が前から少しずつずれて（`enterTroops` の今の遅れの式）、待つ場所の番号 0 から順の位置へ跳んで並ぶ（長さ `BATTLE_ANIM.minionHatchMs`。弾む動きは今の兵と同じ）。待っていた子は 1〜3 で城の側へ出ていった後なので、同じ番号の位置を使っても重ならない。生まれた子は演出の終わりまで待つ場所に立ち、演出が終わると盤面が `game.enemy.minions` の数を同じ位置に描く（位置の式が同じ `campSlot(place.area, i)` なので、つなぎ目で動かない）。倒した攻防では出来事が出ないので生まれない。
* 待つ間: 子は呼吸の伸び縮みをしない（`troopBreath.js` の表に子の種類を足さない。段取りの間の描画も伸び縮みなしで、攻防の始めとつなぎ目で形が変わらない）。剣の兵は子に向かわない（子は名簿の種類が違い、剣の当たりは今の体（絵）だけを相手にする）。
* 名簿の種類と陣地: 待っている・襲う子は `minion`、生まれた子は `minionBorn`（番号を 0 から数えるために分ける）。どちらも陣地 `minion`（`troopsFor` が子を持つ敵だけに足す）。`troopRoster.js` の `CAMP_OF` に `minion: 'minion'`・`minionBorn: 'minion'` を足す。`ENEMY_RUNNERS`（最後に右へ帰る種類）には足さない（襲う子は相打ち・城でいつも全員消え、生まれた子は残る）。`troopMotion.js` の `KNOCK_DIRS` に `minion: 1`・`minionBorn: 1`（敵の側の兵と同じく右へ弾かれる）、型 `TroopKind` に2つを足す。
* 時間・速さ: 子の段の時刻は時間割の中で決まり、演出の速さの設定（普通・速い）とヒットストップは時間割の上で効くので、新しい動きにも同じように効く（`minionShow.js` は `dt`・時計を持たない）。
* 音: 子の行進は鳴らさない（ゴブリンの攻撃の兵と同じ）。子の相打ち・城に当たる段は今の段の種類（`block`・`castleHit`）なので、今の当たりの音が鳴る（スライムは `ENEMY_HIT_RATE` に行がないので高さ 1）。新しい音は作らない。`soundCues.js`・`soundConfig.js`・`battleCues.js` は変えない（敵の攻撃の始まりのきっかけは最初の子の相打ちの段の始めになるが、スライムは攻撃の始まりの音を持たないので鳴る音は変わらない）。
* 当たりの記録（`impactLog.js`）: 子の相打ち・城の当たりは今の表（`block`・`castleHit`）で記録され、`minionMarch`・`minionSpawn` は表にないので何も記録しない（変えない）。

**写しと段（`battleSteps.js`・タスク5）**
* `BattleSnapshot.enemyMinions`（攻防の前に待っていた子の数。`game.enemy.minions`）。
* `buildBattleSteps`: 敵の攻撃の段（`enemyMarch`）を足した後に `steps.push(...minionAttackSteps(events))`（`minionShow.js`。`minionAttack` がなければ空）。`blockPairs` は `block` の量から子の分（`minions ?? 0`）を引く。出来事の並びの読み込みで、`block`・`castleDamage` は「量 − 子の分」が 0 より大きいときだけ今の段（量はその差）にする。`EVENT_TO_STEP` に `minionSpawn: 'minionSpawn'`。子の出来事がない攻防は今と同じ段の並び。
* `BattleStep` の型: 種類に `minionMarch`・`minionSpawn`、`kind` に `'minion'`、`pairs` の説明に `minionMarch`。

**子の見せ方（`js/anim/minionShow.js`・新規・タスク5）** `troopRoster.js`・`battleAnimConfig.js` を import する（view は import しない。配置は引数の `battleLayout` を読む）。
* 先頭の責務: 「次のターンに持ち越す攻撃のユニット（子）の攻防の見せ方。出来事から子の段（襲う・生まれる）を作り、名簿へ待っていた子を置く・襲う行進・生まれて待つ場所へ跳ぶ脚を割り当てる。ルールの判定や計算・描画・状態の変更はしない。乱数は使わない。」
* `minionAttackSteps(events)`: `minionAttack` があれば `[{ type: 'minionMarch', amount, pairs: block.minions ?? 0 }, （block.minions > 0 なら）{ type: 'block', amount: block.minions, kind: 'minion' }, （castleDamage.minions > 0 なら）{ type: 'castleHit', amount: castleDamage.minions, kind: 'minion' }]`、なければ `[]`。
* `placeWaitingMinions(roster, count)`: count が 1 以上なら `spawnTroops(roster, 'minion', count, 0, 0)`（時刻 0 から陣地 `minion` の番号 0〜count−1 の位置に立つ）。陣地 `minion` がない配置で 1 以上なら Error。0 なら何もしない（名簿に何も足さない）。
* `checkWaitingMinions(steps, count)`: 段の `minionMarch` の量（なければ 0）が待っていた数 count と違えば Error（写しと出来事の食い違いを早く見つける）。
* `marchMinions(roster, step, t, moveScale)`: `marchSquad(roster, { kind: 'minion', partnerKind: 'defense', pairs: step.pairs ?? 0, dir: -1, advanceX: roster.layout.enemyAdvanceX, t, moveScale, partnerScale: 1 })` を返す（段の長さ）。
* `hatchMinions(roster, battleLayout, typeId, count, t)`: `battleLayout.minionPlaces[typeId].hatch` から、`enterTroops(roster, 'minionBorn', count 体の { points: 1, wounded: false }, hatch.x, hatch.y, t, BATTLE_ANIM.minionHatchMs)` で跳ばせ、`着く時刻 − t` を返す。表にない識別子は Error。
* `battleAnimConfig.js`: `minionHatchMs: 450`（子が生まれて待つ場所まで跳ぶ時間。前から出る遅れは別。試遊で決め直す）を `BATTLE_ANIM` と型に足す。

**時間割（`battleTimeline.js`・タスク5。呼ぶ行だけ）**
* `createEnemyBody` の後に `placeWaitingMinions(state.roster, before.enemyMinions)` と `checkWaitingMinions(steps, before.enemyMinions)`。
* `STEP_BUILDERS` に `minionMarch: (state, step, t) => marchMinions(state.roster, step, t, enemyPace(state.typeId).moveScale)` と `minionSpawn: (state, step, t) => hatchMinions(state.roster, state.boardLayout.battle, state.typeId, step.amount, t)`。子の相打ち・城の当たりは今の `block`・`castleHit` の組み立て（`step.kind`）をそのまま使う。
* 先頭の責務に「待っていた子の引き継ぎ」を足す（3行以内のまま）。

**段取りの間の子の群れ（`enemyView.js`・タスク6）**
* `drawEnemyFigure` の段取りの間の道（`figure` が null）で、群れの次・絵の前に、`enemy.minions`（省く・0 は描かない）の数の子を `battleLayout.minionSlots(enemy.typeId, n)` の位置に、足元の y の小さい（奥の）順（同じなら番号の小さい順）に `drawTroop(ctx, 'minion', x, footY, size, 0, 1, 1, 1, typeId)` で描く（関数 `drawMinions` を足す。入りの見た目のずれの中で描く）。攻防の演出中（`figure` があるとき）は描かない（名簿の1体として描かれる）。`enemy` の型に任意の `minions`。盤面（`boardView.js`）は `game.enemy` を渡しているので変えない。
* 先頭の責務に「待っている子の群れ」を足す。

**予告の札（`intentParts.js`・`intentView.js`・`layout.js`・タスク6）**
* `intentParts(action)` の戻り値に `minions`（`action.minions` が数で 0 より大きいとき真）を足す（防御だけの予告の早い戻りにも）。攻撃の側・防御の側の判定は変えない。
* `drawEnemyIntent`: `parts.minions` のとき、今の札（攻撃の側・防御の側）の右に、間 `badge.minionGap` を空けて、もう1枚の札（子の絵と数）を描く。子の札の幅 = `padX × 2 + iconW + gap + 数の文字の幅`。2枚の合計の幅で中心を `spot.x` にそろえ、右端（`area.x + area.w − badge.edge`）を越えるときは左へ寄せる（子の札がないときは今の式と同じ値）。子の札は今のふつうの札の塗り・縁（目立たせる赤い札にはしない）で、絵は `minionSkinOf(enemy.typeId)` の体のスプライトを `drawSpriteCentered(ctx, body, 絵の中心 x, cy, badge.iconW)` で描き（表にないときは「？」）、数は `intentMinionText(action)` を今の量の数字と同じ文字で描く。子が 0 匹なら子の札は描かない。数え下ろしの文字は今の札の下のまま。
* `layout.js`: 予告の札の配置 `intentBadge` に `minionGap: INTENT_MINION_GAP_X`（攻撃の札と子の札の間。6。試遊で決め直す）、型 `IntentBadgeLayout` に `minionGap`。
* 先頭の責務（`intentView.js`）に「攻撃の札の横の子の絵と数の札」、`intentParts.js` に「子の側」を足す。

**ターンの始まりの文字（`battleText.js`・`bannerView.js`・`BoardScene.js`・タスク6）**
* `battleText.js`: 表 `MINION_LABELS = Object.freeze({ slime: '子スライム' })`（敵の種類の識別子 → 子の名前）、`intentMinionText(action)` = `String(action.minions)`、`enemyActionText(action, typeId = null)`: 攻撃の側の文字（出すとき）の後ろに、`parts.minions` なら半角の空白をはさんで `+子スライム 8`（名前は `MINION_LABELS[typeId]`、なければ「？」）を続け、防御の側は今のまま ` ／ ` でつなぐ。例「攻撃 4 +子スライム 8」。子がいない予告・ほかの敵は今と同じ文字。
* `bannerView.js`: `BannerValues` に `enemyTypeId`（敵の種類の識別子）を足し、フェーズの始まりで `enemyActionText(values.intent, values.enemyTypeId)`。
* `BoardScene.js`: `drawBanner` の値に `enemyTypeId: game.enemy.typeId` を足す（1行）。
* 攻防の演出中の札は、`drawBattleShow` が渡す `result.enemyAction`（`minions` を含む予告の写し）で同じ札が出る（`battleShowView.js` は変えない）。

**スライム自身の見た目** 今の絵の敵のまま（`ENEMY_SHOWS.slime`・`ENEMY_FIGURES.slime` は変えない。高さ 120・HP で縮む・`dashBounce`・へこむ）。防御がいつも 0 なので、シールドマーク・攻防のシールドは出なくなる（`ENEMY_FIGURES.slime.shield` の行は残すが使われない）。BGM（`STAGE_BGM` の `stage`）・当たりの音・攻撃の始まりの音（なし）は今のまま。敵の絵（`enemyPortrait.js`）は今のまま（スライムだけ）。

**描く体の数（目安 500 体）** 子の数は「その攻防で与えたダメージ × 30%」で、敵の HP で頭打ちなので、1回の攻防で生まれる最大は ステージ 30 で 46 匹・ステージ 100 で 147 匹（上の表）。大きな一撃の次のターンの名簿は「襲う子（≤ 最大）＋ その攻防で生まれる子（≤ 最大）＋ 自軍の兵（攻撃・防御・修理の人数）＋ スライム」。147 匹の子を生むにはその前のターンに 487 以上を与える必要がある（攻撃の兵が 487 体以上）。子の分は多くても ステージ 30 で 92 体・ステージ 100 で 294 体で、残りは自軍の兵の数で決まる（今の作りと同じ）。タスク9で、ステージ 30・100 の実際の名簿の体の数（大きな一撃の次のターン）を数えて書く。

### 要件4: DEBUG タブ（タスク2・タスク8）
* **敵の次の行動**: スライムは `assault` の `attack`（「攻撃」）の1つだけになる（タスク2。防御・大防御はなくなる）。
* **ルールの値**（タスク8）: スライムの見出しの下に、最大 HP（すぐ）・攻撃の量 最小／最大（次の予告から）・子スライムが生まれる割合（次の攻防から）の4つ。「ルールの値を元に戻す」で `RULES` の値に戻る（今の `resetRuleValues` のまま）。ほかの敵の項目は変えない。全体の数は 69 → **64**（スライムの項目 9 → 4）。
  * `debugRuleItems.js`: `splitItems(typeId, spec)`（`spec.split` がなければ空。あれば `item(`${typeId}.split.percent`, typeId, 'percent', 'splitPercent', 'nextBattle', null, null, (c) => c.enemies[typeId].split.percent, (c, v) => { c.enemies[typeId].split.percent = v; })` の1つ）を、敵ごとの項目の並びで行動の項目の後・防御の項目の前に足す。`RuleItem.kind` の説明に `'percent'`。
  * `debugRules.js`: `VALIDATORS.percent = (v) => Number.isInteger(v) && v >= 0 && v <= 100`。
  * `debugRuleSliders.js`: `RULE_SLIDERS.percent = { min: 0, max: 100, step: 5 }`。値の文字の付け方を表 `RULE_FORMATS = { chance: percentText, percent: wholePercentText }` にし、`const format = RULE_FORMATS[info.kind]; if (format) spec.format = format;`（今の `chance` の行を置き換える。確率の文字は今と同じ）。
  * `debugText.js`: `RULE_ITEM_TEXT.splitPercent = '子スライムが生まれる割合'`、`wholePercentText(v)` = `` `${v}%` ``（0〜100 の整数の百分率）。
* **子スライムの数の操作**（タスク8）: 敵の HP のボタン・「子を 0 にする」「親を 0 にする」の段の下に、半分の幅のボタン2つ「子スライム +5」「子スライムを 0 にする」の段を足す。
  * `debugControls.js`: `addEnemyMinions(game, count)`（段取り中・`count` が 1 以上の整数・敵の設定に `split` がある・敵の HP が 0 より大きいときだけ。`enemy.minions += count` し、`enemy.intent = intentWithMinions(spec, enemy.intent, enemy.minions)` で今の予告の子の数も合わせる。変えたら true）と `clearEnemyMinions(game)`（段取り中・`split` がある・`minions` が 0 より大きいときだけ 0 にし、予告も合わせる）。子を持たない敵では何もしない（ボタンはどの敵でも出る。「子を 0 にする」と同じ扱い）。行動の回数・乱数・HP は触らない。先頭の責務に足す。
  * `boardDebug.js`: 口 `addEnemyMinions(count)`・`clearEnemyMinions()`（ルール層を呼ぶだけ）。
  * `debugTab.js`: 定数 `MINION_STEP = 5`（ボタン1回で足す子の数。試遊で決め直す）、ボタン「子スライム +5」（文字は `minionAddText(MINION_STEP)`）→ `debug.addEnemyMinions(MINION_STEP)`、「子スライムを 0 にする」→ `debug.clearEnemyMinions()`。
  * `debugText.js`: `DEBUG_TEXT.minionClear = '子スライムを 0 にする'`（型にも）、`minionAddText(n)` = `` `子スライム +${n}` ``。
  * `debugLayout.js`: `enemyMinionButtons: { add, clear }`（`enemyPartButtons` の段の下・半分の幅2つ）。強化の見出し以降は1段ぶん下がる。型と説明。
* 敵を切り替える・ステージを移すと、新しい敵の子は 0（`createEnemy`）。

### 要件5: 確かめ（全タスク）
* 一時スクリプトはスクラッチのフォルダ（リポジトリの外）に置き、終わったら消す（消せなければ残した場所を書く）。`oz` は代用（`Engine`・`Scene`・`Storage`・`CanvasCache`・`Ui`・`Sound` などの最小の代わり）、`oz` と `assets/` の指定子だけを解く `module.register` のローダーで `js/` を読む。変更前のコードは `git archive 6f09332`（本 REQ のコミット）をスクラッチへ展開して比べる。リポジトリの状態を変える git 操作はしない。
* 切り替え（タスク7）の前にスライムの分裂を試すときは、スクラッチに写した `js/` の `config.js` のスライムの行を要件1の行に書き換えた写しを使う（作業ツリーは書き換えない）。
  * **先回りの依存**: 要件1の行の `behavior.type: 'assault'` はタスク2の表の行がないと `createEnemy`・`debugRuleItems.js` の読み込みが Error になる。タスク1の写しでは `behavior` を今の `either` のまま、`split` だけを足した写しを使う。タスク2以降は要件1の行のまま使える。写しの `Game` でスライムを出すときは `debugControls.js` の `switchEnemy(game, 'slime')` で出す。タスク5の写しの時間割・タスク6の写しの描画は、タスク4の表（作業ツリーにある）を使う。
* 確かめること（REQ 要件5。主にタスク9でまとめて行い、各タスクではその分を行う）:
  * **生まれる数**: `minionBirths({ percent: 30 }, d)` が d = 0・1・3・4・10・11 で 0・1・1・2・3・4。`computeBattle` で、残りの HP を越える攻撃（倒さないように防御・回復のない入力で、HP を越える量を与えて倒す場合と、HP − 1 で止まる場合）で、生まれる数が頭打ちの量（`enemyDamage`）の切り上げの 30%（倒したときは 0）。割合 0・100 でも式のとおり。
  * **予告**: スライム（写しまたはタスク7以降の `RULES`）を多数のターン進め、毎ターン攻撃（量は 2〜3＋加算。ステージ 1・30・100）・防御 0・`variant` なし、予告の `minions` が前のターンの攻防で生まれた数（`minionSpawn` の量。なければ 0）と同じ。乱数の呼び出しが1ターンの予告で1回。
  * **攻防の場合分け**: 子 0 匹・盾の兵より少ない・同じ・多い（盾 0 を含む）、スライムを倒すターン（前のターンの子は襲い、`minionSpawn` は出ず、攻防の後の子は 0）、城が落ちるとき（子だけで落ちる・子とスライムの攻撃で落ちる）で、Error なく出来事を出す。`block`・`castleDamage` の合計が今の式（`min(盾, 攻撃 + 子)`・`min(攻撃 + 子 − 相殺, 城の HP)`）と同じで、子の分が「子が先」の式のとおり。攻防の後の子の数が要件2のとおり。最大の一撃・城の被害の記録（無傷）が今の作りのまま（子の城の被害も無傷を消す）。
  * **攻防の時間割**: 上の場合（攻撃・防御の精鋭を含む）で時間割が Error なく作れる。消える子の数（相打ち・城）・盾の兵での相殺・城の被害の HP の変化の合計が出来事の量と合う。生まれた子が演出の終わりに `minionSlots(typeId, 生まれた数)` の位置に立っている。子の段の時刻が段の並び（子 → スライムの打撃 → 自軍の突撃 → 敵の HP → 生まれる → 修理）のとおり。
  * **変わっていないこと**（変更前 `6f09332` と同じ乱数の状態から比べる）: ほかの7種の予告・最大 HP・乱数の呼び出し（順と回数）・攻防の出来事・時間割（段の時刻・きっかけ・名簿の脚と終わり方・HP の変化・当たりの記録・ヒットマーク・終わりの時刻・人数の表示値）・見た目（代用の `ctx` の描く呼び出しの並び）。★1の並び（10 年分の日付の種 × ステージ 1〜500 で、同じ日付・ステージで同じ敵の種類）。`RULE_ITEMS` のほかの敵の項目と、DEBUG の次の行動の選択肢の数（3）。比べるとき、敵の新しい項目 `minions`・攻防の結果の新しい項目 `minions` は除く。
  * **中断データ**: 子スライムがいるターン・いないターン・3択の段階で保存して戻し、同じ操作で同じ結果（乱数の状態・子の数・予告の `minions` まで）。版 7 のデータ・形違いの `minions`（子を持たない敵で 0 でない・負・小数・文字・予告の `minions` が負や小数・子を持たない敵の予告が `minions` を持つ）は捨てられる。
  * **描く体の数**: ステージ 30・100 のスライムで、大きな一撃（倒さない最大のダメージ）の次のターンの名簿の体の数（襲う子・生まれる子・自軍の兵・スライム）を数える（目安 500 体。超えるときは数を書く）。
  * **起動とプレイが壊れないこと**（画面に関わるタスクの終わりに行う）: 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込めること、`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → 放つ → BATTLE!）→ 積んだ `BattleShowScene` → 次のフェーズを数ターン Error なく進められ、代用の `ctx` で `draw` が Error なく `save`/`restore` が釣り合うこと。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./js/rules/`（子の計算・設定・行動の決まり `assault`・敵の状態・攻防の計算・ゲーム・DEBUG の操作と項目・中断データ）、`./js/anim/`（子の段・時間割・名簿の陣地・兵ごとのずれ・動きの長さ）、`./js/view/`（子のスプライトの表・子の絵と待つ場所の表・配置・兵の見た目・段取りの間の子の群れ・予告の札と文字・DEBUG の文字と配置）、`./js/scenes/`（合図の値・DEBUG タブと口とスライダー）、`./assets/sprites/`（子スライムのスプライトのコピー）。
*   **関連する論理クラス**: 新規 `enemySplit.js`（`minionBirths`・`minionShares`・`intentWithMinions`・`isEnemyMinionsShape`）、`minionSkins.js`（`MINION_SKINS`・`minionSkinOf`）、`minionPlaces.js`（`MINION_PLACES`・`createMinionPlaces`）、`minionShow.js`（`minionAttackSteps`・`placeWaitingMinions`・`checkWaitingMinions`・`marchMinions`・`hatchMinions`）、`unit_slime_child.js`。更新 `RULES.enemies.slime`・型 `EnemySpec`（`split`）・`EnemySplitSpec`・`EnemyBehaviorSpec`（`assault`）、`enemyBehaviors.js`（`BEHAVIORS.assault`）、`combatants.js`（`Enemy.minions`・`EnemyIntent.minions`・`createEnemy`）、`battle.js`（`BattleInput.minions`・`BattleInput.split`・`BattleEvent`（`minionAttack`・`minionSpawn`・`minions`）・`BattleCalc.minions`）、`Game`（`intentOf`・`resolveBattle`）、`debugIntents.js`（`INTENT_TABLE.assault`）、`debugRuleItems.js`（`BEHAVIOR_ITEMS.assault`・`splitItems`）、`debugRules.js`（`VALIDATORS.percent`）、`debugControls.js`（`addEnemyMinions`・`clearEnemyMinions`）、`suspendData.js`（`FIELDS.enemy`・`isIntentShape`・`SUSPEND_VERSION` 8）、`spriteView.js`（`SPRITE_IDS.slimeChild`）、`layout.js`（`minionPlaces`・`minionSlots`・`troopsFor`・`intentBadge.minionGap`）、`troopView.js`（`TROOP_LOOKS.minion`・`minionBorn`・`drawTroop`・`createTroopBakes`）、`battleSteps.js`（`BattleSnapshot.enemyMinions`・`buildBattleSteps`・`BattleStep`）、`battleTimeline.js`（`buildBattleTimeline`・`STEP_BUILDERS`）、`troopRoster.js`（`CAMP_OF`）、`troopMotion.js`（`KNOCK_DIRS`・`TroopKind`）、`troopJitter.js`（`KIND_PHASES.minion`）、`BATTLE_ANIM.minionHatchMs`、`enemyView.js`（`drawEnemyFigure`・`drawMinions`）、`intentParts.js`、`intentView.js`（`drawEnemyIntent`）、`battleText.js`（`MINION_LABELS`・`intentMinionText`・`enemyActionText`）、`bannerView.js`（`BannerValues.enemyTypeId`）、`BoardScene.draw`、`debugRuleSliders.js`（`RULE_SLIDERS.percent`・`RULE_FORMATS`）、`debugText.js`（`DEBUG_TEXT.minionClear`・`RULE_ITEM_TEXT.splitPercent`・`minionAddText`・`wholePercentText`）、`createDebugLayout`（`enemyMinionButtons`）、`buildDebugTab`、`BoardDebug`（`addEnemyMinions`・`clearEnemyMinions`）。

### 参照する責務
*   憲法 3章: ルール（子の数・生まれる数・攻防の分け方・予告）はルール層だけに書き、ルール層は `oz`・画面・演出を import せず、Canvas・DOM・音・時間に触れず、`Math.random`・日付を読まない（乱数は外から渡されたものだけ）。画面・入力・演出は状態を読むことと、ルール層が公開する操作を呼ぶことでだけ状態を変え、ルールの判定や計算を画面に書き写さない。演出は結果を見せるだけで、途中・速さの設定で結果を変えない。数値は設定の1か所（ルールは `config.js`、動きの時間は `js/anim/` の設定、配置・大きさは `js/view/` の表と定数）で、ほかに直書きしない。`update` で描かず、`draw` で状態を変えない。`ctx` は `save`・`restore` で囲む。時間は `update(dt)` の `dt` と `draw` の `time` だけ。`js/` に `requestAnimationFrame`・`addEventListener`・`getContext` を書かない。`window` にプロパティを足さない。エンジンは `import { … } from 'oz'` だけ・`oz/` を編集しない・`oz/src/` を読まない。必要な機能が `oz/ENGINE_API.md` にない・書かれたとおりに動かないときは回避策を書かずに止めて RES に記録する。スプライトは `spriteView.js` だけが import する。手で書いた仮のスプライトのコピーは REQ が認めた `unit_slime_child.js` だけ（中身はコピーのまま、説明の1行目だけ直す）。すべてのファイルの先頭に責務を3行以内、クラス・関数・型・定数に JSDoc。責務に合わない処理は新しいファイルに分ける。先回り実装をしない（新しい音・曲・予告の絵・子スライムの本番の絵・敵の絵の変更・遊び方の4ページ目・ほかの敵の調整はしない）。
*   開発資料 2章「敵」: 敵は HP・親と子の HP（`parts`。親子でない敵は `null`）・次の行動の予告（攻撃の側と防御の側）を持つ。予告の `defense` は抽選した量にステージの加算（防御）を足した `baseDefense` に疲弊を掛けた値で、予告の表示・シールドの数・攻防の計算はこれだけを読む。予告の攻撃の量は行動の設定の幅から渡された乱数で1つ抽選した値に、攻撃の行動ならステージの加算（攻撃）を足した値で、予告にそのまま出し、攻防はその値で行う。敵の並びは、★の敵を動き（組の鍵は `motionKeyOf(spec)` = `spec.motion ?? spec.behavior.type`）ごと・書いた順にまとめ（`enemyMotionsOfStar`）、同じ★の何番目かから動きの番号（`motionIndexAt`）、同じ動きの中の敵は `seededIndex(seed, STREAM.member, stageNumber, 数)` で選ぶ（乱数を呼ばない）。★1は6種で、ゴブリンとオーガ（`steady`）・狼と猪の親子（`buildup`）・骸骨とスライム（`either`）の3組。ステージの加算は `stageBonus.js` の1か所で求め、HP は敵を作るとき（`grownMaxHp`）、攻撃・防御は予告を作るとき（`enemyIntent.js`）に足す。行動の決まりは種類ごとの設定から選ばれ、決まりの状態を敵ごとに持つ。行動が防御の量を持たず、敵が防御の設定を持たないときは抽選せず防御 0。隙のターンは防御を張らず、防御の乱数も呼ばない。
*   開発資料 2章「敵の種類を足すときに書き足す所」: 敵の種類は識別子で引く表に1行ずつ足す（識別子で分岐する if は書かない）。ルール層は `config.js` の `enemies` に1行、行動の決まりが新しいときは `enemyBehaviors.js` の表に1行（状態・次の行動・数え下ろし・隙・形の確かめ）と行動を作る関数、`debugIntents.js` の表に1行、`debugRuleItems.js` の組み立てに項目（必要なら `debugRules.js` の `VALIDATORS`・`debugRuleSliders.js` の `RULE_SLIDERS`・`debugText.js` の項目名・時期）、`debugText.js` の `INTENT_CHOICE_TEXT`、`battleText.js` の `VARIANT_LABELS`、`intentView.js` の `INTENT_ICONS`・`EMPHASIZED_VARIANTS`、`intentParts.js`。行動の `kind` が新しいときは `battle.js`・`battleText.js`・`suspendData.js` の `INTENT_KINDS` と `SUSPEND_VERSION`（今回は `kind` を足さない）。演出は `enemyShows.js` の `ENEMY_SHOWS` に1行。絵の敵は `enemyFigures.js` の `ENEMY_FIGURES` に1行、群れの敵は `hordeSkins.js` の `HORDE_SKINS`・`hordePlaces.js` の `HORDE_PLACES` に同じ識別子で1行。どちらもスプライトの `spriteView.js` の `SPRITE_IDS` と絵の範囲の表と `assets/sprites/` のスプライトが要る。音は `soundConfig.js` の `STAGE_BGM`（必須）、`soundCues.js` の `ENEMY_ATTACK_SE`（任意）、`ENEMY_HIT_RATE`（任意）。親と子を持つ敵は設定の `brood`（状態では `enemy.parts`）で決まり、画面が敵の HP を読むときは `bodyHp.js` を使う。中断データは親と子を持つ敵の `parts` を保存する（版 7 は `parts` を足したときに上げた）。
*   開発資料 2章「攻防の出来事の並び」: 種類と量を持つ。量が 0 の相殺・ダメージ・回復は並びに入れない。敵の攻撃の側（`enemyAttack`・`enemyWindup`・`enemyGuard`）は必ず入り、直後に敵の防御（`enemyDefend`。0 なら入らない）。札が燃える（`cardBurn`）は城の被害の後・敵の回復の前。敵の防御での相殺（`enemyBlock`）・敵へのダメージ（`enemyDamage`。残りの HP で頭打ち。親子の敵だけ任意の `parts`）・敵の撃破（`enemyDefeat`。敵の HP が 0 になったら必ず入り、回復が続く）。決着は城が落ちる `'lose'` だけ。計算の入力に任意の `enemyParts`、結果に `enemyParts`（`BattleResult` には足さない）。
*   開発資料 2章「結果の記録とスコア」・「戦闘の記録」: 最大の一撃は1回の攻防の自軍の攻撃から敵の防御での相殺を引いた量の最大（城が落ちた攻防は数えない）。`castleDamaged` は城が一度でも被害を受けたか（`recordBattle`。`castleDamage` の出来事で決まる）。スコアは敵を1体倒すたびに戦闘の記録から求めて足す。
*   開発資料 2章「中断データ」: 各ターンの始まりと3択の段階を保存する。項目の表 `FIELDS`（項目名 → `{ save, check, load }`）に1行ずつ（`check` は形だけを見て設定の数値と比べない。`load` は写して使う）、形が変わったら `SUSPEND_VERSION` を上げる（今は 7）。敵の決まりの状態の形の確かめは `enemyBehaviors.js` の `isBehaviorState`、親と子の HP は `enemyParts.js` の `isEnemyPartsShape`（種類で分岐する if を `suspendData.js` に書かない）。`readSuspendData` は例外を投げず、合わなければ `null`。
*   開発資料 2章「設定（調整値）」・3章「デバッグ」: デバッグのゲームだけは `RULES` と同じ形の写し（`createDebugRules()`。凍結しない。保存しない）を使い、DEBUG タブで城と敵の値（今は 69 個）を変えられる。効く時期は値ごとに、すぐ（城と今の敵の最大 HP）／次の予告から（防御・行動の量・確率）／次の周期から／次の溜めから／次の攻防から（巨人の回復の確率・量）／出てきたときから。最小 ≤ 最大を守る。「元に戻す」で全部が `RULES` の値に戻る。DEBUG タブの敵の次の行動の指定（攻撃か防御の敵は 攻撃・防御・大防御）・城と敵の HP・「子を 0 にする」「親を 0 にする」（ボタンはどの敵でも出て、親と子を持たない敵では押しても何も起きない）。部品は盤面のデバッグの口（`BoardDebug`）を呼ぶだけで、ルールの状態はルール層のデバッグ用の操作（`debugControls.js`）とルールの値の操作（`debugRules.js`）でだけ変わる。操作は段取りの間だけ効く。
*   開発資料 3章「1フェーズの流れ」4（攻防中）: 攻撃の群れの兵（ゴブリン）は画面の外（右）から跳ねて現れ、盾の兵と1対1で相打ちになり、越えた分が城に当たる。猪の親子の子の攻撃のうり坊も同じ。スライム（シールドを張る絵の敵）はそのターンの防御の量の数のシールドが並ぶ（防御 0 なら並ばない）。狼・猪の親・スライムの攻撃は打撃で、打撃の前に絵が防御の兵の前（倒しきって城を打つときは城の前）まで駆け寄り（スライムは大きく3回跳ねる `dashBounce`）、最後の打撃の後に戻る（城が落ちるときは戻らない）。スライムは HP の割合で体が縮み、体に当たった兵でへこむ。ゴブリン・オーガ・骸骨・スライムの攻撃・ための段は攻撃の音を鳴らさない。当たるたびにヒットストップと白い光、HP が減る当たりで「-N」と粒。攻防の演出の途中のタップでは何も起きない（早送り・スキップはない）。
*   開発資料 3章「1ティックの中での役割」: 攻防の演出のシーンは `dt` に演出の速さの倍率を掛けて足し、壁の時計からヒットストップの並びで演出の時計を求め、見た目・HP・音のきっかけは演出の時計で答える（時間割の時刻は変えない）。
*   開発資料 1章「スプライトの決まり」: スプライトは `spriteView.js` だけが import し、描いた向きのまま描く。絵の範囲は `spriteView.js` の凍結した表に持ち、描く位置・大きさには `bounds` を使わない。スプライトを描き直して差し替えるときは表の値を新しい `bounds` に合わせる。群れの体は長い方の辺を大きさにして描くので、縦横比が変わっても大きさの決め方は同じ。スライム（`unit_slime.js`）は手で書いた仮のスプライト（`source` を持つ）。
*   開発資料 1章（戦闘の段）: 画面は 720×1280。戦闘の段の地面の下端は `groundY`（335）、兵の足元の範囲は y 145〜335。自軍の陣地は右から「防御（x 300〜400）→ 城 → 攻撃 → 修理」。予告の札は敵の頭の上（背の低い絵の敵（狼・スライム）は絵の上端から `gap`（30px）上。縮むスライムは札も下がる）。札が右端からはみ出すときは左へ寄せる。人数の表示は最上部のゲージの下・城の左（右端 x 298）。
*   `js/rules/config.js`: ルールの調整値（敵8種ごとの★・最大 HP・1体のポイント・防御・行動の決まり・並びの組の鍵 `motion`・親と子 `brood` など）を1か所に凍結して持つ。
*   `js/rules/enemyBehaviors.js`: 行動の決まり（種類ごとの状態の初期値と次の行動の決め方・隙の判定）の表と呼び分け、行動の量の幅からの抽選、行動を作る関数（export）、決まりの状態の形の確かめ（`isBehaviorState`）、数え下ろしの問い合わせ、攻撃の直後の回復の抽選（純粋関数）。
*   `js/rules/combatants.js`: 城・敵の状態の生成（敵は種類の設定とステージの加算から作り、最大 HP・HP は加算後）と、予告の型（`EnemyAction`・`EnemyIntent`）。
*   `js/rules/enemyIntent.js`（読むだけ。変えない）: 行動にステージの加算と防御の量を付けて予告を作る（`createIntent`）。隙の行動・防御の設定のない敵は防御の乱数を呼ばず 0。`refreshIntent` は予告を広げて写すので、足した項目は残る。
*   `js/rules/battle.js`: 攻防の出来事の並びと結果の計算（純粋関数）。親子の敵の分け方は `enemyParts.js` を呼ぶ。
*   `js/rules/Game.js`: ゲーム全体の状態と操作・問い合わせ。抽選を呼ぶ順・回数を守る。大きいので、足す処理は新しいファイル（今回は `enemySplit.js`）に分け、`Game.js` には呼ぶ行だけを足す。
*   `js/rules/enemyParts.js`（読むだけ。変えない）: 親と子を持つ敵の純粋な計算。猪の親子の仕組みは変えない。
*   `js/rules/debugIntents.js`: 行動の決まりの種類ごとの「指定できる次の行動」の表（識別子の並び・指定した行動から行動と決まりの状態・今の予告がどれに当たるか）。純粋関数。乱数は渡されたものだけ。
*   `js/rules/debugControls.js`: ゲームの状態を書き換えるデバッグ用の操作（段取り中だけ効く）と問い合わせ。DEBUG タブから `boardDebug.js` 経由でだけ呼ばれる。
*   `js/rules/debugRules.js`: デバッグのゲームが使うルールの値の写しと、値の問い合わせ、変える・元に戻す操作（値の種類ごとの確かめ `VALIDATORS`。すぐ効く値は城・今の敵に効かせる）。
*   `js/rules/debugRuleItems.js`: DEBUG タブで変えられるルールの値の項目の表（`RULE_ITEMS`）を、`RULES` の形から城と敵の種類・行動の決まりの種類ごとに組み立てて持つ（読み込んだときに組み立て、表にない行動の決まりの種類は Error）。
*   `js/rules/suspendData.js`: 中断データの形（`SUSPEND_VERSION`・`FIELDS`）と、ゲーム → データ・確かめ・データ → ゲーム。純粋な計算だけ。`Game.js` はこのファイルを import しない。
*   `js/anim/` の決まり: 時間で進む見た目の動き。結果を受けて見た目の値を作る。ゲームの状態を変えない・ゲームの結果を決めない・描画しない・`Sound` を import しない。`js/view/` は `campSlots.js`・`figureScale.js`・`bodyPoints.js` だけ実行時に import してよい（配置は引数の `battleLayout`・`TroopLayout` を読む）。
*   `js/anim/battleSteps.js`: 攻防の前の値の写しと、攻防の出来事の並びから演出の段の並びを組み立てる。ルールの判定や計算はしない。
*   `js/anim/battleTimeline.js`: 段の並びから時間割（段の時刻・名簿・敵の体・ヒットマーク・当たりの記録・HP の変化・きっかけの時刻）を組み立てる。待っていた自軍の兵の引き継ぎも行う。大きいので、足す処理は新しいファイル（今回は `minionShow.js`）に置き、ここは呼ぶ行だけにする。
*   `js/anim/troopRoster.js`: 兵の名簿を作り、段ごとに兵へ脚と終わり方を割り当てる（出す `spawnTroops`・画面の外や口から家へ出す `enterTroops`・行進 `marchSquad`・相打ち `clashPairs`・城へ当たる `chargeTo` など）。種類 → 陣地の表 `CAMP_OF`。前から遅らせる式と兵ごとのずれの足し方はここだけ。乱数は使わない。大きいので、足すのは表の行だけにする。
*   `js/anim/troopMotion.js`: 兵1体の動きの記録の作成と追記、時計からの1体の見た目（弾む・揺れる・種類ごとの弾かれる向き `KNOCK_DIRS`）。
*   `js/anim/battleAnimConfig.js`: 攻防の演出の設定（段ごとの時間・段の間・ずらしの値など）。
*   `js/anim/impactLog.js`・`battleCues.js`・`troopBreath.js`・`enemyAttacks.js`（読むだけ。変えない）: 当たりの記録は段の種類の表（`block`・`castleHit` など）で作り、表にない段は記録しない。きっかけは段の `cueTimes`。呼吸は表の種類だけ。
*   `js/view/` の決まり: 描き方と配置。ゲームの状態を変えない・ルールの判定をしない・時間で進む動きを持たない・`Sound` を import しない。ルール層は実行時に import しない（型の参照だけ）。
*   `js/view/spriteView.js`: スプライトJSの import と識別子の表・絵の範囲の表を持ち、位置と大きさを合わせて `draw(ctx)` を呼ぶ（`drawSpriteCentered`・`drawTroopFigure` など）。
*   `js/view/hordeSkins.js`・`hordePlaces.js`（読むだけ。変えない）: 群れで描く敵の絵の表と、大きさ・並ぶ場所の表。`isHordeEnemy` は `HORDE_SKINS` に行があるかで決まる。
*   `js/view/layout.js`: 画面の配置を一手に持ち（戦闘の段の兵の陣地・予告の札・群れの並び（種類ごとの大きさと範囲は hordePlaces.js の表）など）、その敵との攻防の兵の配置（`troopsFor`）を返す。大きいので、子の表と組み立ては新しいファイル（`minionPlaces.js`）に置き、ここは呼ぶ行と問い合わせだけにする。
*   `js/view/troopView.js`: 兵1体の描画（群れの敵の兵の種類は `hordeSkinOf(enemyTypeId)` の絵）と、見た目と大きさごとの焼き付けの一覧。描き分けは `drawTroop` の1か所。
*   `js/view/enemyView.js`: 戦闘の段の敵の絵の描画（段取りの間は絵・HP の群れ・シールドマークを入りの見た目に従って描く。攻防の演出中は絵だけを倒れる動きのずれで描き、群れ・シールドは名簿の1体として `troopView.js` が描く）。
*   `js/view/intentParts.js`: 予告の「攻撃の側」「防御の側」を出すかの判定。札と始まりの文字が共用する。純粋で何も import しない。
*   `js/view/intentView.js`: 敵の頭の上の予告の札（攻撃の側の絵と量・防御の側）と数え下ろしの描画。札が画面の右端からはみ出すときは左へ寄せる。
*   `js/view/battleText.js`: 敵の行動（攻撃の側と防御の側を ` ／ ` でつなぐ）・予告の量の数字などを表示文字に直す。計算はしない。
*   `js/view/bannerView.js`: 合図の描画（フェーズの始まりの TURN のロゴ・番号・予告の文字・数え下ろしなど）。
*   `js/view/debugText.js`・`debugLayout.js`: DEBUG タブの文字（`DEBUG_TEXT`・`INTENT_CHOICE_TEXT`・`RULE_ITEM_TEXT`・百分率の文字）と、部品の位置・大きさ（`createDebugLayout`）。
*   `js/scenes/` の決まり: 入力を受けてルール層の操作を呼ぶ・`anim` の時間を進める・`view` を呼んで描く・効果音を鳴らす。ルールの判定や計算・細かい描画は書かない。
*   `js/scenes/BoardScene.js`: 盤面のシーン（`draw` で盤面と合図を描く。合図の値はゲームの状態から渡す）。
*   `js/scenes/debugTab.js`・`boardDebug.js`・`debugRuleSliders.js`: DEBUG タブの部品を足して盤面のデバッグの口につなぐ（ステージのボタンの数は `STAGE_STEPS` の定数）。口はルール層のデバッグ用の操作を呼ぶだけ。スライダーの範囲は値の種類ごとの表 `RULE_SLIDERS`。
*   `oz/ENGINE_API.md` 23章（スプライト）: スプライトJSは既定の export で `draw(ctx)` を持つ。今回はエンジンの新しい機能を使わない。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   1章「スプライトの決まり」「スプライトの一覧」: `unit_slime_child.js`（子スライム。`unit_slime.js` のコピーの仮のスプライト。先頭の説明の1行目だけ違う。表の範囲はスライムと同じ。発注者が描き直して同じ名前で書き出したら `SPRITE_TABLE` の `slimeChild` の行を新しい `bounds` に合わせる）を足す。
*   1章の戦闘の段の説明: 子スライムの待つ場所（スライムの左。足元の中心が x 440〜510・y 205〜335。`minionPlaces.js` の `MINION_PLACES`）。予告の札の説明に「子を持つ敵は、攻撃の札の右に子の絵と数の札をもう1枚並べる（0 匹なら出さない。2枚で中央にそろえ、右端からはみ出すときは左へ寄せる）」。シールドを張る絵の敵の一覧からスライムを外す（防御しない）。「防御だけの予告（骸骨・スライム）」を骸骨だけにする。
*   2章「敵」: 敵の状態に子の数（`minions`。子を持つ敵だけ 1 以上になりうる）、予告に任意の `minions`（子を持つ敵の予告だけ）。行動の決まりに「毎ターン攻撃だけ（スライム。`assault`）」の項（量の抽選1回・状態なし・数え下ろしなし・隙はすべてのターン・防御 0）を足し、「攻撃か防御のどちらか（`either`）」から スライムを外す（骸骨だけ）。決まりの数「6種類」→「7種類」。並びの組の説明に「スライムは行動の決まりが `assault` だが設定の `motion: 'either'` で骸骨と同じ組」。防御の設定を持たない敵・隙の説明のスライムを `assault` に合わせる。
*   2章に「**次のターンに持ち越す攻撃のユニット（子）を持つ敵（スライムの子スライム）**」の項を足す: 設定の `split`（`percent`。与えたダメージ（`enemyDamage`）× percent / 100 の切り上げが生まれる。上限・加算・疲弊なし。倒した攻防では生まれない）。状態 `enemy.minions`（攻防の後は生まれた数）と予告の `minions`（予告を作るとき `Game.intentOf` が写す）。攻防では予告の `minions` をふつうの攻撃に上乗せし（合計の `block`・`castleDamage` は今の式）、盾の兵・城には子が先に当たる。計算の置き場所 `enemySplit.js`。見せ方（子は待つ場所から行進して盾の兵と相打ち・越えた分が城へ → 敵自身の打撃 → 剣は敵にだけ当たる → 敵へのダメージの後に敵の足元から生まれて待つ場所へ）。
*   2章「**敵の種類を足すときに書き足す所**」に、子を持つ敵を書き足す所を足す: ルール層は `config.js` の行に `split`（`percent`）。絵は `minionSkins.js` の `MINION_SKINS`（子の絵）と `minionPlaces.js` の `MINION_PLACES`（子の大きさ・待つ場所の範囲）に同じ識別子で1行（その敵は `ENEMY_FIGURES` に絵の行を持つこと。子は絵の足元から生まれる）。文字は `battleText.js` の `MINION_LABELS`（子の名前）。スプライトは `spriteView.js` の `SPRITE_IDS`・`SPRITE_TABLE` と `assets/sprites/`。演出・中断データ・DEBUG の項目（分裂の割合）と子の数のボタンは設定から組み立てるので書き足さない（中断データの版 8 は `minions` を足したときに上げた）。`HORDE_SKINS` には足さない（足すと群れの敵として描かれる）。
*   2章「攻防の出来事の並び」: `minionAttack`（襲う子の数。敵の攻撃の側・敵の防御の直後）、`block`・`castleDamage` の任意の項目 `minions`（子の分。子が襲う攻防だけ）、`minionSpawn`（生まれた子の数。`enemyDamage` の直後。倒した攻防では入らない）。計算の入力に任意の `minions`・`split`、結果に `minions`（攻防の後の子の数）。`Game.resolveBattle` が予告の `minions` と設定の `split` を渡し、結果を `enemy.minions` に入れる（`BattleResult` には足さない）。
*   2章「中断データ」: 版 8（7 から上げた理由: 敵の子の数 `minions` と予告の `minions` を足した）、敵の項目に `minions`（形の確かめは `enemySplit.js` の `isEnemyMinionsShape`。子を持たない敵は 0 で予告に `minions` なし）。
*   2章「設定（調整値）」・3章「デバッグ」: 敵の種類の設定に `split`。スライムの行動（攻撃する確率・大防御の確率・防御と大防御の幅）の記述を `assault`（攻撃の幅）と分裂の割合に。DEBUG のルールの値 69 個 → 64 個（スライムは 最大 HP・攻撃の量 最小／最大・子スライムが生まれる割合（次の攻防から）。値の種類 `percent`（0〜100・刻み 5））。敵の次の行動の指定にスライム（攻撃だけ）。「子スライム +5」「子スライムを 0 にする」（段取り中・子を持つ敵で効き、今の予告の子の数も合わせる。ボタンはどの敵でも出る）。
*   3章「1フェーズの流れ」1・4: スライムは毎ターン攻撃（防御なし）。ターンの始まりの文字に「攻撃 4 +子スライム 8」。攻防の子スライムの見せ方（上の項）と段の順（子 → スライムの打撃）、生まれる段（敵へのダメージの後）。攻撃の音は今のまま（子の行進は鳴らさない）。
*   4章の表: 新規の行 `enemySplit.js`・`minionSkins.js`・`minionPlaces.js`・`minionShow.js`。行の更新 `config.js`・`enemyBehaviors.js`（`assault`）・`combatants.js`・`battle.js`・`Game.js`・`debugIntents.js`・`debugControls.js`・`debugRules.js`・`debugRuleItems.js`（64 個）・`suspendData.js`（版 8）・`spriteView.js`（`slimeChild`）・`layout.js`・`troopView.js`・`battleSteps.js`・`battleTimeline.js`・`troopRoster.js`・`troopMotion.js`・`battleAnimConfig.js`・`enemyView.js`・`intentParts.js`・`intentView.js`・`battleText.js`・`bannerView.js`・`BoardScene.js`・`debugRuleSliders.js`・`debugText.js`・`debugLayout.js`・`debugTab.js`・`boardDebug.js`。

## 3. タスクリスト
※ 共通の作業（どのタスクでも行う）: 追加・変更した関数・型・定数・表の行の JSDoc と、ファイル先頭の責務（3行以内。新しいファイルは必ず書く）の記載漏れ・古い説明の残りがないことを確かめる。変更した .js の構文チェック（`node --input-type=module --check < <ファイル>`）。本 RES の詳細作業内容を記入する（確かめの結果を含む）。開発資料に影響が出ることが分かったら、資料本体は直さず『開発資料の更新予定』欄に追記する。確かめは2章「要件5」の要領（一時スクリプトはスクラッチに置き、終わったら消す。`git archive 6f09332` を変更前として比べる。切り替え前のスライムの確かめはスクラッチの写しの設定で行う）。
※ 区切りの順は2章「区切りの順」のとおり。どのタスクの終わりでも起動とプレイは壊れない（タスク6の終わりまでは今のスライムのまま遊べる）。

*   [x] タスク1: ルール層の子の仕組み — 子の数・予告への上乗せ・攻防の計算（スライムの設定はまだ今のまま）
    *   **対象ファイル** :
        *   `./js/rules/enemySplit.js` : 新規（`minionBirths`・`minionShares`・`intentWithMinions`・先頭の責務。`isEnemyMinionsShape` はタスク3）
        *   `./js/rules/config.js` : 更新（型 `EnemySplitSpec`・`EnemySpec.split` と先頭の説明だけ。スライムの行はまだ変えない）
        *   `./js/rules/combatants.js` : 更新（`Enemy.minions`・`EnemyIntent` の任意の `minions` の型・`createEnemy` の `minions: 0`）
        *   `./js/rules/battle.js` : 更新（入力 `minions`・`split`・出来事 `minionAttack`・`minionSpawn`・`block`／`castleDamage` の `minions`・結果 `minions`・先頭の責務と説明）
        *   `./js/rules/Game.js` : 更新（import・`intentOf`・`resolveBattle` の呼ぶ行だけ・先頭の責務）
    *   **作業内容** :
        *   2章「要件2」の状態・計算の置き場所・攻防の計算・ゲームのとおりに書く。`enemySplit.js` は何も import しない（設定の型は JSDoc の参照だけ）。各関数・型に JSDoc（`minionShares` に「子が先」の決まり、`minionBirths` に整数の切り上げの式と例）。`Game.js` は呼ぶ行だけを足す。
        *   確かめ: (1) `minionBirths` の要件5の値（0・1・3・4・10・11 → 0・1・1・2・3・4。割合 0・100・`split` なし）と `minionShares` の場合分け（子 0・盾より少ない・同じ・多い・盾 0・城の HP で頭打ち）を単体で。(2) `computeBattle` に `minions`・`split` を渡した要件5の攻防の場合分けで、出来事の並び・量・結果の `minions` が要件2のとおりで、合計が今の式と同じ。`minions`・`split` を省いた入力の出来事・結果（`minions` を除く）が変更前と同じ。(3) スクラッチの写しの設定（スライムの行に `split: { percent: 30 }` だけを足し、`behavior` は今の `either` のまま。2章「要件5」の先回りの依存）の `Game` で、`switchEnemy(game, 'slime')` でスライムを出し、攻防のたびに `enemy.minions` が生まれた数・次のターンの予告の `minions` がその数・その次の攻防で `minionAttack` の量がその数、倒した攻防・城が落ちた攻防で 0、敵が替わると 0。(4) `RULES` のままで、変更前と並べたランダムなゲーム（強化を取るもの・敵を数体倒すもの・負けまで）で毎手の結果・状態（予告・乱数の状態・3択の候補まで）が一致（敵の `minions`・結果の `minions` は比べない）。(5) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク2: ルール層の行動の決まり「毎ターン攻撃だけ」（`assault`）— 表の行だけ（どの敵もまだ使わない）
    *   **対象ファイル** :
        *   `./js/rules/enemyBehaviors.js` : 更新（`BEHAVIORS.assault`・説明の乱数の使い方と形の並び・先頭の責務）
        *   `./js/rules/debugIntents.js` : 更新（`INTENT_TABLE.assault`）
        *   `./js/rules/debugRuleItems.js` : 更新（`BEHAVIOR_ITEMS.assault`）
        *   `./js/rules/config.js` : 更新（型 `EnemyBehaviorSpec.type` の `'assault'`・`attackRange` の説明）
    *   **作業内容** :
        *   2章「要件1」の `assault` の3つの表の行と型のとおりに書く。各行に JSDoc（乱数の回数・隙）。
        *   確かめ: (1) スクラッチの写しの設定（スライムの行を要件1の行に）で `planBehaviorAction` を多数呼び、毎回攻撃・量が 2〜3・`variant` なし・状態 `{}`・乱数1回。`isState`・`countdown`（null）・`isOpening`（真）。`createIntent` を通した予告の防御が 0 で防御の乱数を呼ばない。写しの `RULE_ITEMS` のスライムの項目が 最大 HP・攻撃の量 最小／最大 の3つ（分裂の割合はタスク8）で、`intentChoiceIds` が `['attack']`、`planChosenIntent`・`chosenIntentOf` が要件1のとおり。(2) `RULES` のままで、`RULE_ITEMS` が変更前と同じ（69 個）・ほかの決まりの予告・乱数の呼び出しが変更前と同じ。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク3: 中断データ（版 8・子の数）
    *   **対象ファイル** :
        *   `./js/rules/enemySplit.js` : 更新（`isEnemyMinionsShape`）
        *   `./js/rules/suspendData.js` : 更新（`SUSPEND_VERSION` 8 と版の説明・`FIELDS.enemy`・`isIntentShape`・型）
    *   **作業内容** :
        *   2章「要件2」の中断データのとおりに書く。関数・型に JSDoc。`suspendData.js` に敵の種類で分岐する if を書かない（形の確かめは `enemySplit.js`）。
        *   確かめ: (1) `RULES` のままで、ターンの始まり・3択の段階で保存して戻し、同じ操作で同じ結果（乱数の状態・`minions` 0 まで）。(2) スクラッチの写しの設定（要件1の行）で、子がいるターン・いないターン・3択の段階を保存して戻し、同じ操作で同じ結果（子の数・予告の `minions` まで）。(3) 版 7 のデータ・形違いの `minions`（2章「要件5」の中断データの並び）は `readSuspendData` が `null` を返し、例外を投げない。(4) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク4: 子のスプライトと表と配置 — スプライトのコピー・子の絵の表・子の大きさと待つ場所・兵の見た目と焼き付け
    *   **対象ファイル** :
        *   `./assets/sprites/unit_slime_child.js` : 新規（`unit_slime.js` のコピー。先頭の説明の1行目だけ直す）
        *   `./js/view/spriteView.js` : 更新（import・`SPRITE_IDS.slimeChild`・`SPRITE_TABLE` の行・型）
        *   `./js/view/minionSkins.js` : 新規（`MINION_SKINS`（スライムの行）・`minionSkinOf`・先頭の責務）
        *   `./js/view/minionPlaces.js` : 新規（`MINION_PLACES`（スライムの行）・`HATCH_RISE`・`createMinionPlaces`・型・先頭の責務）
        *   `./js/view/layout.js` : 更新（`minionPlaces`・`minionSlots`・`troopsFor` の子の陣地と大きさ・型・先頭の責務）
        *   `./js/view/troopView.js` : 更新（`TROOP_LOOKS.minion`・`minionBorn`・型 `TroopLook.minion`・`drawTroop` の引き方・`createTroopBakes`・先頭の責務）
    *   **作業内容** :
        *   2章「要件3」の子スライムのスプライト・子の絵の表・子の大きさと待つ場所・配置・兵の見た目と焼き付けのとおりに書く。スプライトのコピーは中身を変えない（説明の1行目以外）。各関数・型・定数・表の行に JSDoc（試遊で決め直す値の印）。
        *   確かめ: (1) `unit_slime_child.js` が `unit_slime.js` と1行目の説明だけ違う（差分を取って確かめる）。(2) 作業ツリーの配置で、`minionSlots('slime', n)`（n = 1・10・150）がすべて待つ場所の範囲の中・番号だけで決まる（n によらず i 番目が同じ）・表にない識別子で Error。`troopsFor('slime')` が `camps.minion`・`kindSizes.minion`・`minionBorn` を持ち、ほかの7種の `troopsFor` が変更前と同じ値。`hatch` がスライムの絵の足元の中央。2章「要件3」の重なりの見積もりを実際の値で求め直す（スライムの絵・防御の陣地・予告の札の位置との間）。(3) 代用の `ctx` で、`drawTroop(ctx, 'minion', …, 'slime')` が子スライムの絵を描き、焼き付けの一覧に `slimeChild`（24px）が1つ入る。ほかの兵の描く呼び出しの並びが変更前と同じ。(4) 2章「要件5」の起動とプレイが壊れないことの確かめ（今のスライムのまま見た目が変わらないこと）。
        *   共通の作業。
*   [ ] タスク5: 演出の子の仕組み — 待っていた子・襲う段・生まれる段（ほかの敵の時間割が変わらないことを確かめる）
    *   **対象ファイル** :
        *   `./js/anim/minionShow.js` : 新規（`minionAttackSteps`・`placeWaitingMinions`・`checkWaitingMinions`・`marchMinions`・`hatchMinions`・先頭の責務）
        *   `./js/anim/battleSteps.js` : 更新（`BattleSnapshot.enemyMinions`・`snapshotBattle`・`buildBattleSteps`・`EVENT_TO_STEP`・`BattleStep` の型）
        *   `./js/anim/battleTimeline.js` : 更新（import・待っていた子を置く行と確かめの行・`STEP_BUILDERS` の2行・先頭の責務）
        *   `./js/anim/troopRoster.js` : 更新（`CAMP_OF` の2行と説明）
        *   `./js/anim/troopMotion.js` : 更新（`KNOCK_DIRS` の2行・型 `TroopKind`）
        *   `./js/anim/troopJitter.js` : 更新（`KIND_PHASES` に `minion` の1行と、表の説明の「表にない種類」の並び）
        *   `./js/anim/battleAnimConfig.js` : 更新（`minionHatchMs` と型）
    *   **作業内容** :
        *   2章「要件3」の攻防の演出・写しと段・子の見せ方・時間割のとおりに書く。`battleTimeline.js`・`troopRoster.js` には呼ぶ行と表の行だけを足す。`minionShow.js` は view を import しない（配置は引数）。各関数・型・設定の値に JSDoc。
        *   兵ごとのずれ（`troopJitter.js`）: 襲う子の行進（`marchMinions` → `marchSquad`）にゴブリンの攻撃の兵（種類 `enemy`）と同じ扱いの動き出しのずれ（`moveJitterMs`）と動きの長さのばらつき（`speedSpread`。組の盾の兵の踏み出しの長さにも効く）を入れるため、`KIND_PHASES` に `minion: 0.6`（`enemy` と同じ値。スライムとの攻防には `enemy` の兵が出ないので並びがそろうことはなく、自軍の種類の 0・0.2・0.4 とも違う）を足す。`minionBorn` は足さない（生まれる段は `enterTroops` でずれ・ばらつきが 0 なので値が効かず、その後は動かない）ので、表の説明の「表にない種類」の並びに `minionBorn` を足す。ほかの種類の行（`attack`・`defense`・`heal`・`enemy`・`enemyGuard`）の値は変えない（ほかの敵の時間割・見た目は変わらない。確かめ (2) で見る）。
        *   確かめ: (1) スクラッチの写しの設定（要件1の行）の `Game` でスライムを出し、2章「要件5」の攻防の場合分け（精鋭を含む）で、`buildBattleSteps` の段の並びが要件3の順・`buildBattleTimeline` が Error なく、消える子の数・相殺・城の HP の変化の合計が出来事の量と合い、生まれた子が演出の終わりに `minionSlots` の位置に立っている。待っていた数と段の食い違いで Error。(2) 変更前と同じ乱数の状態から、ほかの7種と今のスライム（`RULES`）の段の並びと時間割（段の時刻・きっかけ・名簿の脚と終わり方・HP の変化・当たりの記録・ヒットマーク・終わりの時刻・人数の表示値）が同じ（写しの新しい項目 `enemyMinions` は比べない）。(3) 演出の速さの倍率とヒットストップが子の段にも効くこと（`BattleDirector` を倍率 1 と速い倍率で進め、子の段の当たりの時刻が演出の時計で同じに来る）。(4) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク6: 見た目 — 段取りの間の子の群れ・予告の札・ターンの始まりの文字
    *   **対象ファイル** :
        *   `./js/view/enemyView.js` : 更新（`drawMinions`・`drawEnemyFigure` の段取りの間の道・型・先頭の責務）
        *   `./js/view/intentParts.js` : 更新（`minions` の判定・説明・先頭の責務）
        *   `./js/view/intentView.js` : 更新（子の札・import・先頭の責務）
        *   `./js/view/layout.js` : 更新（`INTENT_MINION_GAP_X`・`intentBadge.minionGap`・型 `IntentBadgeLayout`）
        *   `./js/view/battleText.js` : 更新（`MINION_LABELS`・`intentMinionText`・`enemyActionText` の引数と子の文字・先頭の責務）
        *   `./js/view/bannerView.js` : 更新（`BannerValues.enemyTypeId`・フェーズの始まりの文字）
        *   `./js/scenes/BoardScene.js` : 更新（合図の値に `enemyTypeId` の1行）
    *   **作業内容** :
        *   2章「要件3」の段取りの間の子の群れ・予告の札・ターンの始まりの文字のとおりに書く。`draw` の中で状態を変えず、`ctx` の変更は `save`・`restore` で囲む。各関数・型・定数・表の行に JSDoc。
        *   確かめ: (1) 代用の `ctx` で、ほかの7種と今のスライムの段取りの間の戦闘の段・予告の札・ターンの始まりの描く呼び出しの並びと文字が変更前と同じ。(2) スクラッチの写しの設定（要件1の行）で子が 0・1・8・150 匹のとき、段取りの間に子がその数だけ待つ場所に描かれ、札が攻撃の札と子の札の2枚（0 匹は1枚）で右端からはみ出さず、ターンの始まりの文字が「攻撃 3 +子スライム 8」（0 匹は「攻撃 3」）。攻防の演出中（`drawBattleShow`）の札も同じで、待つ子の群れは名簿の体だけが描かれる（二重に描かれない）。`save`/`restore` が釣り合う。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク7: スライムの設定を切り替える（子スライムを持つスライムにする）
    *   **対象ファイル** :
        *   `./js/rules/config.js` : 更新（スライムの行を要件1の行に・先頭の説明の行動の決まりの一覧）
    *   **作業内容** :
        *   2章「要件1」のスライムの行のとおりに書く。`ENEMY_SHOWS.slime`・`ENEMY_FIGURES.slime`・`STAGE_BGM`・`ENEMY_ATTACK_SE`・`enemyPortrait.js` は変えないことを確かめる。説明の敵の一覧（「骸骨・スライム」の `either` など）を今の形に合わせる。
        *   確かめ: 2章「要件5」のうち、予告（ステージ 1・30・100 で多数のターン）・攻防の場合分け・攻防の時間割（精鋭を含む）・中断データ・描く体の数（ステージ 30・100）を作業ツリーの `RULES` で行う。★1の並び（10 年分の日付の種 × ステージ 1〜500）が変更前と同じ。ほかの7種の予告・攻防・時間割・見た目が変更前と同じ。スライムの段取りの間にシールドマークが出ない。2章「要件5」の起動とプレイが壊れないことの確かめ（`switchEnemy` でスライムにして数ターン・倒すまで・城が落ちるまで）。
        *   共通の作業。
*   [ ] タスク8: DEBUG タブ — スライムのルールの値（分裂の割合）・子スライムの数のボタン
    *   **対象ファイル** :
        *   `./js/rules/debugRuleItems.js` : 更新（`splitItems`・組み立てに足す・`RuleItem.kind` の説明）
        *   `./js/rules/debugRules.js` : 更新（`VALIDATORS.percent`）
        *   `./js/rules/debugControls.js` : 更新（`addEnemyMinions`・`clearEnemyMinions`・import・先頭の責務）
        *   `./js/scenes/debugRuleSliders.js` : 更新（`RULE_SLIDERS.percent`・`RULE_FORMATS`）
        *   `./js/view/debugText.js` : 更新（`DEBUG_TEXT.minionClear`・`RULE_ITEM_TEXT.splitPercent`・`minionAddText`・`wholePercentText`・型）
        *   `./js/view/debugLayout.js` : 更新（`enemyMinionButtons` の段・型・説明）
        *   `./js/scenes/debugTab.js` : 更新（`MINION_STEP`・2つのボタン・import）
        *   `./js/scenes/boardDebug.js` : 更新（`addEnemyMinions`・`clearEnemyMinions` の口・import）
    *   **作業内容** :
        *   2章「要件4」のとおりに書く。各関数・型・定数に JSDoc。
        *   確かめ: (1) `RULE_ITEMS` が 64 個で、スライムの4つ（最大 HP・攻撃の量 最小／最大・子スライムが生まれる割合）が日本語の項目名と効く時期で出て、ほかの敵の項目は変更前と同じ。割合のスライダー（0〜100・刻み 5・「30%」の文字）で変えた値が次の攻防の生まれる数に効き、「元に戻す」で 30 に戻る。(2) 代用の `oz`（`Ui` の部品を記録する代わり）で DEBUG タブを組み立て、「子スライム +5」で `enemy.minions` と予告の `minions` が 5 ずつ増え（札も変わる）、「子スライムを 0 にする」で両方 0、子を持たない敵・段取り中でないときは何も起きない。スライムの次の行動の選択肢が「攻撃」だけ。その下の部品の位置が1段ぶん下がって重ならない。(3) ボタンの文字が枠に収まるかを見積もる（`Ui` の標準の文字の大きさで、縮みが目安 0.6 未満のものがあれば懸念事項に書く）。(4) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク9: 通しの確かめ（要件5）
    *   **対象ファイル** :
        *   （コードは変えない。本 RES だけ更新）
    *   **作業内容** :
        *   2章「要件5」の確かめを作業ツリーの最新の `js/` でまとめて行い、結果（数値・体の数）を詳細作業内容に書く。不具合が見つかったら直さずに懸念事項に書き、どのタスクの直しかを示す。
        *   発注者に依頼するテストプレイ（REQ の【テストプレイで確かめること】1〜11）の一覧を詳細作業内容に写し、目視が要る所（子の群れ・札の重なり・生まれる動き・子の大きさ）を挙げる。
        *   共通の作業（RES の記入）。
*   [ ] タスク10: 開発資料の更新（固定タスク）
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` : 更新
    *   **作業内容** :
        *   2章『開発資料の更新予定』と各タスクで追記した予定を確かめ、`PROJECT_ARCHITECTURE.md` へ反映する（※実装AIによる開発資料の書き換えは原則禁止だが、この最終タスクのみ明示的な例外。後続タスクがなく、資料の変更で他タスクの前提が動く危険がないため）。
        *   2章「敵の種類を足すときに書き足す所」に、次のターンに持ち越す攻撃のユニット（子スライム）を持つ敵を書き足す所（設定の `split`・`MINION_SKINS`・`MINION_PLACES`・`MINION_LABELS`・絵の行が要ること）が分かる形にする。
        *   書き方は今の資料に合わせ（識別子と画面の呼び名・TURN・ターン）、`_doc/`・`README.md` は変えない。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: ルール層の子の仕組み — 子の数・予告への上乗せ・攻防の計算（スライムの設定はまだ今のまま）
*   **作業内容** :
    *   `js/rules/enemySplit.js` を新規作成（`minionBirths`・`minionShares`・`intentWithMinions`。何も import しない。`isEnemyMinionsShape` はタスク3）。`config.js` に型 `EnemySplitSpec`・`EnemySpec.split` と先頭の説明（スライムの行は未変更）。`combatants.js` に `Enemy.minions`・`EnemyIntent.minions`（任意）・`createEnemy` の `minions: 0`。`battle.js` に入力 `minions`・`split`、出来事 `minionAttack`・`minionSpawn`・`block`／`castleDamage` の `minions`、結果 `minions`（城が落ちた攻防・倒した攻防は 0）。`Game.js` は `intentOf`（`intentWithMinions(spec, intent, this.enemy.minions ?? 0)`）と `resolveBattle` の入力2項目・`this.enemy.minions = calc.minions` の呼ぶ行だけ。
    *   確かめ（スクラッチの一時スクリプト。終わって削除済み）:
        *   (1) `minionBirths`（30%）が d = 0・1・3・4・10・11 で 0・1・1・2・3・4。`split` が null・undefined・割合 0・100・dealt 負も式のとおり。`minionShares` は子 0・盾 < 子・盾 = 子・盾 > 子・盾 0・城の HP で頭打ちの場合が期待どおり。
        *   (2) `computeBattle`: `minions`・`split` を省いた入力 1008 通り（攻撃・防御・城 HP・敵 HP・敵の防御）で、変更前（`git archive 6f09332`）と出来事・結果（`minions` 除く）が一致し、結果の `minions` は 0。子あり各場合（盾なし・少・同・多・盾 0・城 HP の頭打ち・lose・倒す・HP−1 で止まる（生まれる 12）・割合 0／100）で出来事の並び（`minionAttack` は敵の攻撃の直後、`minionSpawn` は `enemyDamage` の直後）・`block.minions`／`castleDamage.minions`・結果 `minions` が要件2のとおり。子 0〜9 × 盾 0〜14 × 城 HP 3／50 で `block`・`castleDamage` の合計が今の式と同じ。
        *   (3) スクラッチの写し（スライムの行に `split: { percent: 30 }` だけ足す）の `Game`: `switchEnemy(game, 'slime')` 直後は `enemy.minions` 0・予告 `minions` 0。攻撃 10 の攻防で生まれた数 3 → 次のターンの予告 `minions` 3 → その攻防で `minionAttack` が 3・攻防後 `enemy.minions` 0。攻撃 8 で 3（切り上げ）。倒した攻防・城が落ちた攻防で 0。敵が替わる（`goblins`）と `minions` 0・予告に `minions` なし。`enemy.minions` が undefined でも予告は 0。
        *   (4) `RULES` のまま、変更前と並べたランダムなゲーム（60 シード・毎手の状態と結果を比較・計 24000 状態・3択の選択 54 回）で、`minions` を除く状態（敵・城・乱数の状態・ゲージ・スコアの記録・3択の候補）・操作の戻りが一致。
        *   (5) `js/rules/` の 39 モジュールがすべて読み込める（ルール層は `oz` を import しない。`js/main.js` から辿る画面側は今回のタスクで変えていない）。
        *   構文チェック: `battle.js`・`Game.js`・`enemySplit.js`・`config.js`・`combatants.js` ともエラーなし。
    *   開発資料: 2章の予定（敵の状態・予告の `minions`・攻防の出来事・`enemySplit.js`）は既に『開発資料の更新予定』にある内容で、追記の必要なし。

### タスク2: ルール層の行動の決まり「毎ターン攻撃だけ」（`assault`）— 表の行だけ（どの敵もまだ使わない）
*   **作業内容** :
    *   `enemyBehaviors.js` に `BEHAVIORS.assault`（JSDoc 付き。`isOpening` 常に真・乱数は量の1回）、`planBehaviorAction`・`isBehaviorState` の説明と先頭の責務に assault を追記。`debugIntents.js` に `INTENT_TABLE.assault`、`debugRuleItems.js` に `BEHAVIOR_ITEMS.assault`、`config.js` の `EnemyBehaviorSpec.type` と `attackRange` の説明に `assault` を追記。スライムの行は未変更。
    *   確かめ（スクラッチの一時ファイル。終わって削除済み）:
        *   (1) 写しの設定（スライムの `type` だけ `assault`）で `planBehaviorAction` 500回: 毎回攻撃・量 2〜3・`variant` なし・状態 `{}`・乱数1回、`isState` 真・`countdown` null・`isOpening` 真。`createIntent` の予告は防御 0・乱数 0 回。`RULE_ITEMS` のスライム項目は `slime.maxHp`・`slime.attack.min`・`slime.attack.max` の3つ。`intentChoiceIds` が `['attack']`、`planChosenIntent` が `{action:{kind:'attack',amount},state:{}}`、`chosenIntentOf` が `'attack'`。
        *   (2) `RULES` のままで `RULE_ITEMS` は 69 個（変更前と同数）。ほかの決まりの行は変えていない。
        *   (3) `js/rules/` の全モジュールが読み込める。構文チェック: 4ファイルともエラーなし。（`js/main.js` 経由の画面側は今回変えていないので、代用 `oz` ローダーでの確認は省略）
    *   開発資料: 追記の必要なし（タスク7・10 で `assault` を含めて反映する想定）。

### タスク3: 中断データ（版 8・子の数）
*   **作業内容** :
    *   `enemySplit.js` に `isEnemyMinionsShape(spec, minions, intent)`（JSDoc 付き。先頭の責務に「中断データの形の確かめ」を足した）。`suspendData.js` は `SUSPEND_VERSION` 8（版の歴史に 8 を追記）、`FIELDS.enemy` の `save`／`check`（`isIntentShape` の後）／`load` に `minions`、`isIntentShape` に任意の `minions`（0 以上の整数）、`SuspendData.enemy` の型に `minions`。敵の種類で分岐する if は書いていない。
    *   確かめ（スクラッチの一時スクリプト。終わって削除済み）:
        *   (1) `RULES` のまま、40 シードのランダムなゲームでターンの始まり・3択の段階 943 か所（うち3択 58）を保存 → JSON を通す → `readSuspendData` → `restoreGame`。保存し直したデータが元と一致し、同じ操作列を元と戻したゲームに15手ずつ与えて、操作の戻り・乱数の状態・敵（`minions`・予告・HP）・城が一致。`minions` は全部 0。
        *   (2) スクラッチの写しの設定（スライムの行に `split: { percent: 30 }`・`assault`）で同様に 565 か所（子がいる 312・予告の `minions` が 0 より大きい 336・3択 36）が一致（子の数・予告の `minions` まで）。
        *   (3) 版 7 のデータ・`minions` の欠け・子を持たない敵の `minions` が 5／−1／0.5／"3"／null・子を持たない敵の予告に `minions`・子を持つ敵の `minions` が −1／0.5／"3"／null／undefined・予告の `minions` が −1／0.5／"3"／null・予告がオブジェクトでない、はすべて `readSuspendData` が `null`（例外なし）。子を持つ敵の予告の `minions` が無い・敵の値と違うデータは通る。
        *   (4) 代用の `oz`（ローダーで `oz` を名前だけの置き物に、`assets/` を実ファイルに引く）で、`js/main.js` から辿る 167 モジュールを含む `js/` の全 169 モジュールが読み込めた（`main.js` 自身は読み込みで `Engine` の起動が `document` に触れて止まる。置き物のためで、読み込みの失敗ではない）。
        *   構文チェック: `enemySplit.js`・`suspendData.js` ともエラーなし。
    *   開発資料: 追記の必要なし（2章の予定にある中断データの版 8 の内容のとおり）。

### タスク4: 子のスプライトと表と配置 — スプライトのコピー・子の絵の表・子の大きさと待つ場所・兵の見た目と焼き付け
*   **作業内容** :
    *   `assets/sprites/unit_slime_child.js` を `unit_slime.js` からコピー（先頭の説明の1行目だけ「子スライムの仮のスプライト（…）」に）。`spriteView.js` に import・`SPRITE_IDS.slimeChild`（型にも）・`SPRITE_TABLE` の行（スライムと同じ範囲）。`minionSkins.js`（`MINION_SKINS.slime`・`minionSkinOf`）・`minionPlaces.js`（`MINION_PLACES.slime`・`HATCH_RISE`・`createMinionPlaces`）を新規。`layout.js` に `minionPlaces`・`minionSlots`・`troopsFor` の子の陣地（`camps.minion`）と大きさ（`kindSizes.minion`・`minionBorn`）・型・先頭の責務。`troopView.js` に `TROOP_LOOKS.minion`・`minionBorn`・型 `TroopLook.minion`・`drawTroop` の引き方（`minionSkinOf`。識別子の if なし）・`createTroopBakes` の子の焼き付け・先頭の責務。
    *   確かめ（スクラッチの一時スクリプト。`git archive 6f09332` の展開を変更前として比較。代用の `oz`（`CanvasCache` は記録するだけ）のローダー）:
        *   (1) `unit_slime_child.js` は `unit_slime.js` と `diff` で2行目（説明の1行目）だけ違う。
        *   (2) `minionSlots('slime', n)`（n = 1・10・150）はすべて待つ場所 `{x 440, y 205, w 70, h 130}` の中・size 24・i 番目は n によらず同じ。n = 0 は空、`'goblins'` で Error。`troopsFor('slime')` は `camps.minion`（待つ場所と同じ）・`kindSizes` `{minion: 24, minionBorn: 24}` を持ち、ほかを除くと変更前と同じ。ほかの7種（と表にない識別子）の `troopsFor` は変更前と JSON が一致。`createLayout` の戦闘の段のほかの項目（`area`・`castle`・`enemyFigures`・`intentBadge`・`troops`・`hordePlaces` など）も変更前と一致。`hatch` = `{x: 620, y: 333}`（スライムの絵の矩形 x 544.75〜695.25 の中央・足元 335 の 2px 上）。
        *   重なりの見積もり（実際の値）: 子の体の範囲は x 428〜522・y 181〜335。スライムの絵の左端 544.75 との間は **22.75px**（見積もり約 20）、防御の陣地（x 300〜400）の兵の体の右端 412 との間は **16px**（見積もり約 16）。予告の札（中心 x 620・上端 y 141・高さ 44。縮むと下がる）との重なりは見積もりどおり、2枚の札の左下が子の群れの右上に重なりうる（タスク6で札を足したときに目視。5章の計画時点の記述のとおり）。
        *   (3) 焼き付けなし・ありの両方で、`drawTroop` を全ての既存の種類（8）× 敵の識別子（6）× 傷・自動・精鋭の5通りで呼んだ代用の `ctx` の呼び出しの並びが変更前と完全に一致。焼き付けは 27 → 28 枚で、増えた1枚だけが `slimeChild`（24px。範囲 x ±13.16・y −22.73〜−1.27。ほかの27枚の範囲は変更前と一致）。`drawTroop(…, 'minion', …, 'slime')` は焼き付けを貼り、焼き付けなしでは `drawTroopFigure(…, 'slimeChild', …)` と同じ呼び出し（103 呼び出し）。`slimeChild` の絵は `slime` の絵と同じ呼び出し。`minionBorn` も同じ焼き付け。`enemyTypeId` を省いても Error なし（既定の体）。
        *   (4) `js/` の全 172 モジュールのうち 171 が読み込めた（`js/main.js` だけ読み込みで `document` に触れて止まる。置き物の `oz` のためで、読み込みの失敗ではない）。タスク4の変更は画面側の表・配置・`drawTroop` の分岐だけで、どの敵も `minions` が 0・`minion` の兵が名簿に出ないので、今のスライムの見た目は変わらない（上の (2)(3) の一致が根拠）。`BoardScene` の `init`〜`update`〜`draw` の通し実行は、代用の `Ui` 等が大きいため行っていない（タスク9・各画面タスクの確かめで行う）。
        *   構文チェック: `spriteView.js`・`minionSkins.js`・`minionPlaces.js`・`layout.js`・`troopView.js`・`unit_slime_child.js` ともエラーなし。
    *   監査の指摘による説明の修正: `layout.js` の `troopsFor` の説明（関数・`BattleLayout` の型）と `TroopLayout.camps` の型（任意の `minion`）、`troopView.js` の `drawTroop` の `enemyTypeId` の説明（子の種類の既定は `slimeChild` の体）を直した（コードの動きは変えていない）。
    *   開発資料: 追記の必要なし（『開発資料の更新予定』の 1章・2章の予定のとおり）。

### タスク5: 演出の子の仕組み — 待っていた子・襲う段・生まれる段（ほかの敵の時間割が変わらないことを確かめる）
*   **作業内容** :
    *   （未記入）

### タスク6: 見た目 — 段取りの間の子の群れ・予告の札・ターンの始まりの文字
*   **作業内容** :
    *   （未記入）

### タスク7: スライムの設定を切り替える（子スライムを持つスライムにする）
*   **作業内容** :
    *   （未記入）

### タスク8: DEBUG タブ — スライムのルールの値（分裂の割合）・子スライムの数のボタン
*   **作業内容** :
    *   （未記入）

### タスク9: 通しの確かめ（要件5）
*   **作業内容** :
    *   （未記入）

### タスク10: 開発資料の更新（固定タスク）
*   **作業内容** :
    *   （未記入）

## 5. 懸念事項・要確認ポイント
* （計画時点の要確認）盤面の盾の兵に当たる順は「子スライムが先、スライムの攻撃が後」に決めた（2章「要件2」）。合計の相殺・城の被害は順によらず同じで、見せ方（子が待つ場所から先に行進し、その後スライムが駆け寄る）と合う。逆の順がよければ `enemySplit.js` の `minionShares` と `minionAttackSteps` の段の置き場所を替える。
* （計画時点の要確認）子スライムの札の数は数字だけ（例「8」）、ターンの始まりの文字は「攻撃 4 +子スライム 8」にした。札に「+8」と出したいときは `battleText.js` の `intentMinionText` を替える。
* （計画時点の要確認）子スライムは待つ間に呼吸の伸び縮みをしない（段取りの間と攻防の始めで形がそろうよう、どちらもしない）。伸び縮みさせたいときは `troopBreath.js` の表と `EnemyIdle` に子を足す（今回のスコープの外）。
* （計画時点の要確認）攻撃の量が3桁の後半のステージで子も3桁のとき、2枚になった予告の札の左下が子の群れの右上と約 10×40px 重なる見込み（2章「要件3」の見積もり）。テストプレイ9で目視してほしい。
* （計画時点の要確認）子が襲う攻防では、攻防のきっかけ「敵の攻撃の始まり」（`battleCues.js`）が最初の子の相打ちの段の始めになる。スライムは攻撃の始まりの音を持たないので今は何も変わらないが、攻撃の始まりの音を持つ敵に子を持たせるときは見直す。
* （計画時点の要確認）DEBUG のルールの値の項目名は REQ の言葉のまま「子スライムが生まれる割合」にした（項目名の表は敵ごとに引くので、子を持つ敵を足すときに名前を見直す）。
* （タスク1）敵の `typeId` の識別子は `goblins`・`ogres`・`skeletons` など複数形がある（確かめの切り替えで注意）。`Game.resolveBattle` は子を持たない敵では予告の `minions` が無いので `?? 0`、`split` は `?? null` で渡す。タスク3より前に再開した盤面の敵は `minions` が無いことがあり、`intentOf` も `?? 0` で読む。
* （タスク3）`js/rules/enemySplit.js` は LF、`suspendData.js` は CRLF の改行（元のまま）。`isEnemyMinionsShape` は予告が `minions` を持つ敵に対し、予告の `minions` が無い場合も通す（タスク1・2 の間に保存されたデータの形はそもそも版 7 で捨てられる）。
* （タスク4）`layout.js`・`troopView.js` は CRLF、`spriteView.js` ・新規ファイルは LF の改行（元のまま）。`unit_slime_child.js` は `unit_slime.js` と同じ改行の混在（CRLF と LF）をそのままコピーした。焼き付けは `TROOP_LOOKS.minion`・`MINION_SKINS.slime` とも焼き付けの識別子 `slimeChild`・大きさ 24 で1枚を共有する（`minionPlaces.slime.size` を `troops.size`（24）と変えると、`TROOP_LOOKS` の分の 24px も別に焼かれる）。作業用のスクラッチ（`before/` の展開・一時スクリプト）は削除をシステムに止められたため、スクラッチのフォルダに残っている（リポジトリの外）。
