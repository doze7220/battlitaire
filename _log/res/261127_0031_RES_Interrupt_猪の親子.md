# RES: 作業計画・作業レポート (Interrupt) : 猪の親子（猪を親と子の群れに作り直す）
* 参照元REQ: `./_log/req/261127_0031_Interrupt_猪の親子.md`

## 1. 作業目的
★1の敵「猪」（`boar`）を、**親（中くらいの猪が1体）と子（うり坊の群れ。1体1ポイント）が一緒に出る敵「猪の親子」** に作り直す。猪を置き換えるので★1は6種のまま。

* 狙い: 「子どもたちを守る」ターンまで剣を寝かせて親を先に削るのが上手い勝ち方になり、子を先に倒しきると怒った親と戦うことになる。
* 親と子の HP・局面（子がいる間／怒り／子だけ）・行動・剣の当たり方（どれだけが防御で止まり、どれだけが子・親に当たったか）は、**ルール層が決めて出来事として出す**。演出は出来事と状態を読むだけで計算し直さない。
* 敵の HP のゲージと数は親子の合計。子の残りはうり坊の数で分かる。
* 敵の体に「絵と群れの両方を持つ体」（`brood`）を足す。体の形・大きさ・当たる順は敵の種類ごとの設定・表で持ち、**敵の種類の識別子で分岐する if は書かない**。
* 並びの組は「溜めて大攻撃」のまま（同じ日付・同じステージでは、猪が出ていた所に猪の親子が出る）。
* 中断データの版を 7 に上げ、親と子の HP を持たせる。DEBUG タブで5つの行動・ルールの値・「子を 0 にする」「親を 0 にする」を使えるようにする。
* **ほかの7種の敵（数値・動き・見た目・乱数を呼ぶ順と回数・攻防の計算と出来事・時間割）、自軍、ステージの加算と疲弊、1ターンの流れ、スコアの項目・精鋭・強化は変えない。**

## 2. アーキテクチャ設計

### 全体の形
| ファイル | 層 | 変更 | 役割（今回足すこと） | タスク |
| --- | --- | --- | --- | --- |
| `js/rules/enemyParts.js` | ルール | **新規** | 親と子を持つ敵の純粋な計算（HP の分け方・局面（タスク1）、攻防の剣の当たり方の分け方（タスク3）、DEBUG の HP の付け方（タスク5）、中断データの形の確かめ（タスク6）） | 1・3・5・6 |
| `js/rules/config.js` | ルール | 更新 | 型（`EnemySpec.motion`・`EnemySpec.brood`・`EnemyBroodSpec`・行動の決まり `brood` の項目）（タスク1）。猪の行を猪の親子に（タスク12） | 1・12 |
| `js/rules/enemyBehaviors.js` | ルール | 更新 | 行動の決まり `brood` の行・行動を作る関数（守る・突進・怒りを溜める・大突進）・次の行動の決め方に局面を渡す引数 | 2 |
| `js/rules/combatants.js` | ルール | 更新 | 敵の状態に親と子の HP（`parts`。親子でない敵は `null`）・型 | 1 |
| `js/rules/battle.js` | ルール | 更新 | 入力の親と子の HP と当たる順から、敵へのダメージを親と子に分けて出来事 `enemyDamage` の `parts` に出し、攻防の後の親と子の HP を返す（入力がなければ今と同じ） | 3 |
| `js/rules/Game.js` | ルール | 更新 | 予告に局面を渡す（タスク2）・攻防に親と子の HP を渡して受け取る（タスク3） | 2・3 |
| `js/rules/enemyTypes.js` | ルール | 更新 | 動きの組の鍵を `spec.motion ?? behavior.type` にする | 4 |
| `js/rules/debugIntents.js` | ルール | 更新 | `brood` の指定できる行動（局面ごと）・局面の引数 | 5 |
| `js/rules/debugControls.js` | ルール | 更新 | 次の行動の選択肢を今の局面で出す・選択肢の枠の数を局面ごとの最大で数える・敵の HP の付け方（親子）・「子を 0 にする」「親を 0 にする」の操作 | 5 |
| `js/rules/debugRules.js` | ルール | 更新 | 今の敵の最大 HP を変えたとき、親と子の HP も合わせる | 5 |
| `js/rules/debugRuleItems.js` | ルール | 更新 | `brood` のルールの値の項目（子の攻撃・守る確率と幅・突進・怒りを溜める確率・大突進）。親子の敵の最大 HP の項目名を「最大 HP（合計）」に | 5 |
| `js/rules/suspendData.js` | ルール | 更新 | 敵の項目に親と子の HP（`parts`）・形の確かめ・`SUSPEND_VERSION` 7 | 6 |
| `js/anim/enemyShows.js` | anim | 更新 | 体の見せ方 `brood`（防御はシールド）・群れの体を持つかの問い合わせ（タスク7）。猪の行（タスク12） | 7・12 |
| `js/anim/enemyBody.js` | anim | 更新 | 体の見せ方 `brood` の準備（群れ＋絵）と当たり（子は群れ、親は絵）・親と子の残りの HP の記録・絵が倒れるかの問い合わせ | 7 |
| `js/anim/battleSteps.js` | anim | 更新 | 写しに親と子の HP（`enemyParts`）。出来事 `enemyDamage` の `parts` から、当たる先ごとの `enemyHit` の段（`part`）を作る | 7 |
| `js/anim/battleTimeline.js` | anim | 更新 | 敵の体に親と子の HP を渡し、`enemyHit` の段の `part` を渡し、絵の倒れる時刻を体の問い合わせで決める（3か所） | 7 |
| `js/anim/enemyIdle.js` | anim | 更新 | 群れの伸び縮みを「群れの体を持つ敵」（`horde`・`brood`）で書く | 7 |
| `assets/sprites/unit_uribo.js` | assets | **新規（コピー）** | `unit_boar.js` のコピー（先頭の説明の1行目だけ「うり坊の仮のスプライト」に直す） | 8 |
| `js/view/spriteView.js` | view | 更新 | うり坊のスプライトの import・`SPRITE_IDS.uribo`・絵の範囲の表の行（猪と同じ値） | 8 |
| `js/view/hordePlaces.js` | view | 更新 | 群れの範囲の高さ（`area.h`。任意）を持てるようにする（タスク9）。猪の行（タスク12） | 9・12 |
| `js/view/bodyHp.js` | view | **新規** | 敵の状態から、群れの体・絵の体が受け持つ HP を読む純粋関数（親子の敵は子・親の HP、ほかは HP） | 10 |
| `js/view/enemyView.js` | view | 更新 | 段取りの間、群れと絵を別々に描けるようにする（群れは子の HP の数、絵は親の HP が 0 より大きいときだけ） | 10 |
| `js/scenes/BoardScene.js` | scenes | 更新 | 待機の伸び縮みの群れの体の数を `bodyHp.js` の群れの HP から求める（1行） | 10 |
| `js/view/battleText.js` | view | 更新 | 中の種類の名前（突進・怒りを溜める・大突進）・予告の札に量の代わりに出す文字の表（怒り）と引く関数 | 11 |
| `js/view/intentView.js` | view | 更新 | 予告の絵の表（突進・怒り・大突進）・赤い札（大突進）・量のない行動の札に「怒り」の文字を出す | 11 |
| `js/view/enemyFigures.js` | view | 更新 | 猪の行（高さ 100・シールド・予告の札の高さ） | 12 |
| `js/view/hordeSkins.js` | view | 更新 | 猪の行（うり坊の絵） | 12 |
| `js/scenes/soundCues.js` | scenes | 更新 | 猪の攻撃の音の行を突進・大突進だけにする（子の攻撃は鳴らさない。5章の要確認の点） | 12 |
| `js/view/debugText.js` | view | 更新 | 5つの行動・ルールの値の項目名・「子を 0 にする」「親を 0 にする」の文字 | 13 |
| `js/view/debugLayout.js` | view | 更新 | 敵の HP のボタンの下に「子を 0 にする」「親を 0 にする」の段 | 13 |
| `js/scenes/debugTab.js` | scenes | 更新 | 2つのボタンを足して盤面のデバッグの口につなぐ | 13 |
| `js/scenes/boardDebug.js` | scenes | 更新 | 「子を 0 にする」「親を 0 にする」の口 | 13 |
| `js/view/enemyPortrait.js` | view | 更新 | 群れの絵と絵の両方を持つ敵は、親の絵の前にうり坊を数体描く | 14 |
| `PROJECT_ARCHITECTURE.md` | 資料 | 更新 | 最終タスクでだけ反映 | 16 |

* **敵の種類の識別子で分岐する if は書かない。** 親子かどうかは設定の `brood` があるか（状態では `enemy.parts` が `null` か）、体は `ENEMY_SHOWS` の `body`、当たる順は設定の `brood.hitOrder`、局面ごとの行動は `brood` の行の中の局面の表で決める。描画は「群れの絵の表（`HORDE_SKINS`）にあるか」「絵の表（`ENEMY_FIGURES`）にあるか」をそれぞれ見て、両方あれば両方描く（今の8種で両方を持つ敵はないので、ほかの敵の描き方は変わらない）。
* **ルールと画面の分離:** 親と子の HP・局面・行動・攻防の分け方はルール層（`enemyParts.js`・`enemyBehaviors.js`・`battle.js`）。演出は、写しの親と子の HP（`BattleSnapshot.enemyParts`）と出来事 `enemyDamage.parts` の量を当たる先ごとの段にするだけ。画面は `game.enemy.parts` を読むだけ（`bodyHp.js`）。
* **乱数:** 猪の親子の決まりの乱数の呼び方は要件2のとおり。ほかの7種の呼ぶ順・回数は変えない（行動の決まりに局面の引数を足すが、ほかの決まりは読まない）。並びの決定（`stageOrder.js`）は乱数を呼ばない。
* **数値の置き場所:** ルールは `config.js`（猪の親子の行）、大きさ・並ぶ場所は `enemyFigures.js`・`hordePlaces.js` の表、予告の札の文字の大きさ・色は `intentView.js` の定数、敵の絵の並びは `enemyPortrait.js` の定数。

#### 区切りの順（どのタスクの終わりでも起動とプレイが壊れない）
REQ の目安の順（ルール層 → 演出の仕組み → スプライトと見た目 → 猪の設定の切り替え → 中断データ → DEBUG → 敵の絵）を基にする。ルール層の仕組みはタスク1〜4の4つ（HP の分け方・局面・敵の状態 → 行動の決まり `brood` と予告の局面 → 剣の当たり方と攻防 → 並びの組の鍵）に、見た目の仕組みはタスク8〜11の4つ（スプライトの表 → 群れの範囲の高さ → 群れと絵の描き分け → 予告の札）に分ける。猪の設定はタスク12まで今のまま（`brood` を持たない）なので、どの区切りでも敵の `parts` は `null`、見せる表に猪の親子の行はなく、ゲームと見た目は今と同じに動く。そのうえで次の3点を変える。
1. **DEBUG のルール層（タスク5）を切り替えの前に置く。** `debugRuleItems.js` の `RULE_ITEMS` は読み込んだときに `RULES` から組み立て、行動の決まりの種類の表にない種類は Error を投げる。猪を `brood` に切り替えた時点で表の行がないとデバッグの読み込みが壊れる。また、最大 HP のスライダー・「HP を 1 にする」で親と子の HP が合計とずれると攻防の計算が Error になる。そこでルール層の DEBUG の操作と項目はタスク5で先に足す（UI のボタンと文字はタスク13）。
2. **中断データ（タスク6）を切り替えの前に置く。** 切り替えた後に中断データが親と子の HP を持たないと、再開した猪の親子の状態が欠けて予告・攻防が Error になる。親と子の HP はタスク1から敵の状態にあり（親子でない敵は `null`）、タスク6で保存・確かめ・戻しに足して版を 7 に上げる（今の敵はどれも `null` なので遊び方は変わらない）。タスク1〜5の間に再開した盤面の敵は `parts` の項目を持たないことがあるので、`enemyParts.js` の関数は `parts` が `null` または無い（`undefined`）ときを「親子でない」と同じに扱う。
3. **見せる表の猪の行は、すべて切り替えのタスク（タスク12）でそろえる。** 演出の仕組み（タスク7）・見た目の仕組み（タスク8〜11）は、両方の体を持つ敵の扱いを足すだけで、猪の行（`ENEMY_SHOWS`・`ENEMY_FIGURES`・`HORDE_SKINS`・`HORDE_PLACES`・攻撃の音）はまだ今のまま。今の猪に群れの絵の行だけ先に足すと、今の猪の後ろにうり坊が 44 体並んでしまうため。タスク12で、設定と見せる表の猪の行を同時に替える。DEBUG の文字（タスク13）が入るまでは、DEBUG タブの行動・項目名が識別子のまま出るだけで壊れない。敵の絵（タスク14）が入るまでは、3択と結果の画面の猪の親子の絵がうり坊3体だけになるだけで壊れない。

### 要件1: 猪の親子の数値と形（タスク1・タスク4・タスク12）

**設定（`config.js`）** 猪の行をタスク12で次にする（識別子 `boar` は今のまま）。
```js
boar: Object.freeze({
  name: '猪の親子',
  star: 1,
  maxHp: 44,                       // 親子の合計（ステージの加算の前）
  motion: 'buildup',               // 並びの組の鍵（狼と同じ「溜めて大攻撃」の組）
  brood: Object.freeze({
    childPercent: 50,              // 子の HP = floor(加算後の最大 HP × 50 / 100)。親は残り
    hitOrder: Object.freeze({      // 予告の kind → 剣の当たる順（防御で止まった後）
      guard: Object.freeze(['parent', 'child']),
      default: Object.freeze(['child', 'parent']),
    }),
  }),
  behavior: Object.freeze({
    type: 'brood',
    attackRange: Object.freeze({ min: 1, max: 2 }),    // 子の攻撃
    protectChance: 0.3,                                 // 子がいる間、毎ターン「子どもたちを守る」確率
    protectRange: Object.freeze({ min: 4, max: 8 }),   // 守るの防御の量（加算の前）
    rushRange: Object.freeze({ min: 4, max: 6 }),      // 怒った親の突進
    rageChance: 0.3,                                    // 怒りを溜める確率
    bigRushRange: Object.freeze({ min: 13, max: 16 }), // 大突進
  }),
}),
```
* 型: `EnemySpec` に `motion`（任意。並びの組の鍵。書かなければ `behavior.type`）と `brood`（任意。型 `EnemyBroodSpec` = `childPercent`（0〜100 の整数）・`hitOrder`（予告の `kind` → `['parent'|'child', …]`。`default` は必須））。`EnemyBehaviorSpec.type` に `'brood'`、項目 `protectChance`・`protectRange`・`rushRange`・`rageChance`・`bigRushRange`（どれも `'brood'` のみ）。`attackRange` の説明に `'brood'`（子の攻撃）を足す。型はタスク1、猪の行はタスク12。
* 防御の設定（`defense`）は持たない（「守る」以外のターンの防御は 0）。`attackHeal` も持たない（親子の敵の回復は扱わない。書くと `computeBattle` が Error。下の要件2）。`unitPoints` は書かない（1）。

**HP の分け方（`enemyParts.js` の `partMaxHps(brood, maxHp)`。タスク1）**: 子 = `Math.floor(maxHp × childPercent / 100)`、親 = `maxHp − 子`（奇数なら親が1多い）。`maxHp` はステージの加算の後（`createEnemy` が `grownMaxHp` で求めた値）。子の HP がうり坊の体の数（1体1ポイント）。
* 初期値の見込み（タスク1・タスク15で確かめる）: ステージ 1 = 44（親 22・子 22）、ステージ 30 = 167（親 84・子 83）、ステージ 100 = 536（親 268・子 268）。
* 敵の状態（`combatants.js` の `Enemy`）に `parts`（型 `EnemyParts` = `{ parent: number, child: number }`。親子でない敵は `null`）を足す。**`hp` は親子の合計のまま**（`hp === parts.parent + parts.child` を常に保つ）。`maxHp` も合計。これで HP のゲージ・数・倒したかの判定（`hp === 0`）・中断データの段階の整合・結果の記録などの今の読み手は変えなくてよい。`createEnemy` が `createEnemyParts(spec, maxHp)`（`spec.brood` がなければ `null`、あれば親と子の最大）を入れる。

**並び（`enemyTypes.js`。タスク4）**: `enemyMotionsOfStar` の組の鍵を `motionKeyOf(spec)` = `spec.motion ?? spec.behavior.type`（同じファイルの小さな関数。export してよい）にする。★1は書いた順に「`steady`（ゴブリン・オーガ）・`buildup`（狼・猪の親子）・`either`（骸骨・スライム）」の3組で、組の並び・組の中の並びは今と同じなので、同じ種・同じステージの敵の種類は変わらない。

### 要件2: 3つの局面の行動と、剣の当たり方（タスク1・タスク2・タスク3）

**局面（`enemyParts.js`。タスク1）**: `enemySituationOf(parts)` は `parts` が `null`/`undefined` なら `null`、親 > 0 かつ子 > 0 なら `'together'`（子がいる間）、親 > 0 かつ子 = 0 なら `'enraged'`（怒り）、親 = 0 かつ子 > 0 なら `'young'`（子だけ）、両方 0 なら `null`。局面の識別子の並び `ENEMY_SITUATIONS`（凍結。`['together', 'enraged', 'young']`）を export する。局面は予告を決めるとき（ターンの始まり）に読むので、攻防で局面が変わると次のターンの予告から新しい局面の行動になる。

**行動の決まり `brood`（`enemyBehaviors.js`。タスク2）**
* `planBehaviorAction(behavior, state, random, unit = 1, situation = null)`・表の `planNext(behavior, state, random, unit, situation)` に局面の引数を足す（ほかの決まりは読まない＝呼び方・結果は今と同じ）。`Game.planIntent` が `enemySituationOf(this.enemy.parts)` を渡す。
* 行動を作る関数を足す（export。`debugIntents.js` も使う）: `protectAction(behavior, random, unit)` = `{ kind: 'guard', amount: 0, guard: rollAmount(protectRange), variant: 'protect' }`（乱数1回）、`rushAction` = `{ kind: 'attack', amount: rollAmount(rushRange), variant: 'rush' }`（1回）、`rageAction()` = `{ kind: 'windup', amount: 0, variant: 'rage' }`（0回）、`bigRushAction` = `{ kind: 'attack', amount: rollAmount(bigRushRange), variant: 'bigRush' }`（1回）。子の攻撃は今の `steadyAttackAction`（`attackRange`。中の種類なし）。
* 状態 `{ lastVariant: string|null }`（直前の予告の中の種類。初期値 `null`）。`isState`: プレーンなオブジェクトで、`lastVariant` が `null` か `'protect'`・`'rush'`・`'rage'`・`'bigRush'` のどれか。次の状態は `{ lastVariant: action.variant ?? null }`。
* 次の行動は、`brood` の行の中の**局面 → 決め方の表**（`BROOD_PLANS`。局面で分ける表で、敵の識別子は見ない）で決める。表にない局面（`null`）は Error。

| 局面 | 決め方 | 乱数 |
| --- | --- | --- |
| `together` | `random() < protectChance` なら守る（`protectAction`）、外れれば子の攻撃（`steadyAttackAction`） | 毎ターン2回 |
| `enraged` | 直前が `rage` なら大突進、直前が `bigRush` なら突進（抽選なし）、それ以外は `random() < rageChance` なら怒りを溜める、外れれば突進 | 抽選のターン: 溜める 1回・突進 2回。大突進 1回。大突進の次の突進 1回 |
| `young` | 子の攻撃 | 1回 |

* `countdown`: いつも `null`（溜めは1ターンで数え下ろしなし）。`isOpening`: `action.kind !== 'guard'`（猪の親子は防御の設定を持たないので、どちらでも防御の乱数は呼ばない）。
* 予告の組み立ては今の `createIntent` のまま: 子の攻撃・突進・大突進は量に攻撃の加算、守る（`guard`）は `guard` に防御の加算を足して `baseDefense`・疲弊を掛けて `defense`。怒りを溜める・子の攻撃・突進・大突進の防御は 0（防御の設定なし）。
* 割合の見込み（タスク2・タスク15で確かめる）: `together` の守る ≈ 30%。`enraged` の溜めの抽選をしたターンのうち溜める ≈ 30%（怒りのターン全体では 0.3 ÷ 1.6 ≈ 18.75%）、溜めの次はいつも大突進、大突進の次はいつも突進。

**剣の当たり方（攻防の計算。タスク3）**
* `enemyParts.js` の `battlePartsOf(spec, parts, kind)`: `spec.brood` がないか `parts` が `null`/`undefined` なら `null`。そうでなければ `{ hp: { parent, child }, order }`（`order` は `brood.hitOrder[kind]`、なければ `brood.hitOrder.default`）。`Game.resolveBattle` が予告の `kind` で求めて `computeBattle` の入力 `enemyParts` に渡す。
* `enemyParts.js` の `splitPartDamage(battleParts, dealt)`: 当たる順に、その部分の HP までを当て（`min(残り, HP)`）、残りを次へ。`{ damages: [{ part, amount }]（量が 0 より大きいものだけ、当たる順）, after: { parent, child } }`。
* `battle.js` の `computeBattle`: 入力に任意の `enemyParts`（`null`/なしなら今と同じ。出来事も結果も今と同じで、結果に `enemyParts: null` が足されるだけ）。あるときは、
  * `enemyParts.hp.parent + enemyParts.hp.child !== enemyHp` なら Error（呼ぶ側の誤り）。`enemyHeal > 0` でも Error（親子の敵の回復は扱わない）。
  * 敵の防御での相殺（`enemyBlock`）・敵へのダメージの合計（`dealt = min(attack − enemyBlocked, enemyHp)`）・倒した（`enemyDefeat`。合計の HP が 0 のときだけ）は**今の式のまま**。
  * `dealt > 0` の `enemyDamage` の出来事に `parts: damages`（親と子に当たった量。当たる順）を付ける。量の合計は `dealt`。
  * 結果 `BattleCalc` に `enemyParts`（攻防の後の親と子の HP。城が落ちた攻防は入力のまま。読むのは `Game.resolveBattle` だけ）。
* 当たる順: ふだんのターン（子の攻撃）・突進・溜め・大突進は `default`（子 → 余りが親。怒りの局面は子が 0 なので全部が親、子だけの局面は親が 0 なので全部が子）。守るターン（`guard`）は防御で止まった後、親 → 余りが子。
* `Game.resolveBattle`: `this.enemy.parts = calc.enemyParts`（親子でない敵は `null` のまま）。攻防の結果 `BattleResult` には親と子の HP を足さない（演出は写しの `before.enemyParts` と出来事の `enemyDamage.parts` だけを読み、攻防の後の親と子の HP は画面が `game.enemy.parts` で読むので、読む側がないため）。
* 決着: 親と子の両方が 0（合計 0）で今の `enemyDefeat` が1回だけ入る。結果の記録の倒した数（`enemyDefeat` を数える）・スコア（`calc.enemyDefeated` で1回）・3択・次のステージは今のまま1回。親だけ・子だけが 0 になったときは何も数えない。最大の一撃（`attack − Σ enemyBlock`）も今のまま。

### 要件3: 見た目・動き・音（タスク7〜12・タスク14）

**HP の表示**: 最上部の敵の HP のゲージと数は今のまま `enemy.hp`・演出の HP の表示値（合計）。HP が 0 になる時刻（BGM を止める）も合計が 0 になる時刻（`knockoutTime`。変えない）。

**体の見せ方 `brood`（`enemyShows.js`。タスク7）**
* 型の `body` に `'brood'`。`DEFENSE_SHOWS.brood = { unit: null, blockStep: 'shieldBlock' }`（守るターンは親の前のシールド）。
* 群れの体を持つかの表と問い合わせ `enemyHasHorde(typeId)`（`horde`・`brood` は真、`figure` は偽）。`enemyIdle.js` が今の `enemyBodyStyle(typeId) === 'horde'` の代わりに使う（ほかの敵は同じ結果）。
* 猪の行（タスク12）: `body: 'brood'`、`attacks: { default: 'march', rush: 'dashStraight', bigRush: 'dashStraight' }`（子の攻撃はゴブリンの攻撃の兵と同じく画面の外から陣地へ出て城へ向かう。怒った親は今の猪の駆け寄り）、`heavy: ['bigRush']`、`charge: ['rage']`、`dents: false`、`pace: 'normal'`。

**敵の体（`enemyBody.js`。タスク7）**
* `createEnemyBody(roster, battleLayout, typeId, hp, defense, maxHp, unit, parts = null)`（最後の引数を足す。`battleTimeline.js` が `before.enemyParts` を渡す）。`BODY_SETUPS` の各行に `parts` を渡す（`horde`・`figure` は読まない）。
* `BODY_SETUPS.brood`: 子の HP の数のうり坊を `horde` と同じ作り方（`splitPoints`・`hordeSlots(typeId, 数)`・`placeTroops(roster, 'goblin', …)`）で置き、親の HP が 0 より大きければ `figure` と同じ作り方で絵の記録（当たる位置・シールドの並べ先・駆け寄り・倒れる動き）を作る。親が 0 なら絵の記録は群れと同じ空（`figure: null`・`dash: null`・`fall: null`・シールドの並べ先 `null`）。`style: 'brood'`。絵の倍率は今の絵の敵と同じ式（`bodyScale(minScale, hp, maxHp)`。猪の `minScale` は 1 なので 1）。
* 体の記録 `EnemyBody` に `partHp`（`{ parent, child }`。親子の敵だけ。攻防の前の親と子の HP の写しで、当たりのたびに減らす。ほかの敵は `null`）を足す。
* `BODY_HITS` の各行に当たる先 `part` を渡す（`horde`・`figure` は読まない）。`BODY_HITS.brood`: `part` が `'child'` なら `horde` の当たり（`chargePairs(roster, 'attack', 'goblin', …)`）、`'parent'` なら `figure` の当たり（`chargePoints` で親の当たる位置へ）。それ以外は Error。
* `hitEnemyBody(body, roster, count, t, shownHp, part = null)`: 当たりの後、`body.partHp` があれば `body.partHp[part] -= count`。
* `isEnemyFigureDown(body, shownHp)` を足す: `body.partHp !== null` なら `body.partHp.parent <= 0`、そうでなければ `shownHp <= 0`（今の式）。
* 精鋭が子と親の境目をまたぐとき: 子の段で `chargePairs` が最後の組を量で切るので、精鋭は一部のポイントだけ使って傷ついた姿で残り、続く親の段で `chargePoints` が残りのポイントで親に当たる（守るターンのシールド → 親 → 子も同じ）。量の合計は出来事と同じになる。

**段と時間割（`battleSteps.js`・`battleTimeline.js`。タスク7）**
* `BattleSnapshot.enemyParts`（`game.enemy.parts` の写し。親子でない敵は `null`）。
* `buildBattleSteps`: 出来事 `enemyDamage` が `parts` を持つときは、`parts` の順に量が 0 より大きいものを `{ type: 'enemyHit', amount, part }` の段にする（持たないときは今のまま1つの `enemyHit`）。`BattleStep` の型に `part`（`'parent'|'child'`。`enemyHit` のみ）。自軍の突撃の段は今のまま最初の `enemyHit`（または `enemyBlock`）の前。
* `battleTimeline.js`（変えるのは3か所だけ）: `createEnemyBody` に `before.enemyParts` を渡す。`addEnemyHit` で `hitEnemyBody(…, step.part ?? null)` にする。倒れる時刻の判定 `state.enemyShown <= 0` を `isEnemyFigureDown(state.body, state.enemyShown)` にする。HP の表示値（合計）は段ごとに `dropEnemyHpByHits` で今のまま減る。
* 守るターンの段の並び: （自軍の突撃）→ `shieldBlock`（防御の量）→ `enemyHit`（親）→ `enemyHit`（子）。ふだんのターン: `enemyMarch`（うり坊）→ `block`/`castleHit` → 突撃 → `enemyHit`（子）→ `enemyHit`（親）。怒りのターンは今の猪と同じ（突進は `dash` → 打撃 → `dashBack`、溜めは `charge` の段、大突進は大きな一撃）。親が先に倒れると、親の `enemyHit` の段の終わりで絵が跳ねて落ち、うり坊は残る。
* 演出の時計・演出の速さ（普通・速い）・ヒットストップは時間割から求める今の仕組みのまま新しい段にも効く（`battleDirector.js` は変えない）。

**見た目の仕組み（タスク10・タスク11）**
* `js/view/bodyHp.js`（新規。何も import しない。タスク10）: `hordeHpOf(enemy)` = `enemy.parts` があれば `parts.child`、なければ `enemy.hp`。`figureHpOf(enemy)` = `enemy.parts` があれば `parts.parent`、なければ `enemy.hp`。
* `enemyView.js` の段取りの間: 今の「絵を持つなら絵、そうでなく群れなら群れ」を、「群れの絵を持つなら群れ（`hordeHpOf` の数）を描き、続けて絵を持ち `figureHpOf > 0` なら絵とシールドマークを描く」にする（群れが奥・絵が手前）。今の8種は両方を持たないので描き方は変わらない。攻防の演出中（`figure` が `null` でない）は今のまま絵だけ。
* `BoardScene.update` の待機の伸び縮みの群れの数: `bodyCount(hordeHpOf(this.game.enemy), this.game.enemyUnitPoints())`。
* 予告の札（`intentView.js`・`battleText.js`。タスク11）: `INTENT_ICONS` に `rush: attack`・`rage: windup`・`bigRush: attack`、`EMPHASIZED_VARIANTS` に `bigRush`（赤い札）。`VARIANT_LABELS` に `rush: '突進'`・`rage: '怒りを溜める'`・`bigRush: '大突進'`（始まりの文字は「突進 5」「怒りを溜める」「大突進 14」。子の攻撃は「攻撃 2」、守るは今の防御だけの予告で「防御 6」）。
* 「怒り」の文字（タスク11）: `battleText.js` に予告の札に量の代わりに出す文字の表 `BADGE_LABELS`（`{ rage: '怒り' }`。中の種類 → 文字）と `intentBadgeLabel(action)`（表になければ `null`）。`intentView.js` は攻撃の側の量の文字が `null`（量のない行動）のとき、この文字があれば絵の右（量の数字と同じ位置。`badge.gap` の後）に描く。文字の大きさ・色は `intentView.js` の定数 `BADGE_LABEL_FONT = 'bold 22px sans-serif'`・`BADGE_LABEL_COLOR = '#ffb347'`（橙。縁取りは量の数字と同じ）。札の幅はこの文字の幅で求める（試遊で決め直す値）。札の高さは変えない。

**猪の行の見せる表（タスク12。`createHordePlaces` の `area.h` の扱いだけタスク9）**
* 親の絵（`enemyFigures.js` の `boar`）: `height: 100`（今 130）、`shield: { cx: 0.35, cy: 0.55, w: 0.55, h: 0.6 }`（親の体の前の方。守るターンのシールド）、`hit: 0.12`、`mouth: null`、`intent: { x: 0.5, gap: null }`（札は群れの敵・巨人と同じ高さ。うり坊の群れの上に札を出すため）、`minScale: 1`。絵の中心は今の `ENEMY_CX`（620）のままで、矩形は x 約 552〜688・y 235〜335。
* うり坊の群れの絵（`hordeSkins.js` の `boar`）: `{ body: SPRITE_IDS.uribo, item: null, bake: 'uribo' }`。
* うり坊の大きさと並ぶ場所（`hordePlaces.js` の `boar`）: `{ size: 24, area: { x: 565, w: 120, h: 80 }, enemy: { x: 455, w: 45 }, enemyGuard: { x: 525, w: 35 } }`。群れは親の奥（足元 x 565〜685・y 145〜225。体は y 121 から。親の矩形の上端 235 より上）、攻撃のうり坊の陣地は今のゴブリンの攻撃の兵の陣地と同じ x 455〜500（親の左端より左）。`createHordePlaces` は `area.h` があれば群れの範囲の高さを `min(area.h, 足元の範囲の高さ − 削る量)` にする（群れの範囲の y は今のまま足元の範囲の上端 `groundY − fieldH + 削る量`。攻撃・守りの陣地は今のまま足元の範囲いっぱい）。どれも試遊で決め直す値。
  * 上の群れの足元の範囲（y 145〜225）と親の矩形（y 235〜335）は、群れの範囲の y を上端に固定したまま h だけを縮める前提での見込み。タスク9（スクラッチの写しの表）とタスク12（作業ツリーの表）の確かめで、実際の `groundY`・`fieldH` から群れの範囲・群れの体の上端・親の矩形を数値で求め、重ならないことを確かめて詳細作業内容に書く。
* 攻撃の音（`soundCues.js` の `ENEMY_ATTACK_SE.boar`）: `{ rush: 'giantAttack', bigRush: 'giantAttack' }`（今の猪と同じ音。`default` を持たないので子の攻撃では鳴らさない＝ゴブリンの攻撃と同じ）。`STAGE_BGM.boar`（`'stage'`）・`ENEMY_HIT_RATE`（なし）は変えない。新しい音は作らない。

**スプライト（タスク8）**: `assets/sprites/unit_boar.js` をコピーして `assets/sprites/unit_uribo.js` を作る（REQ で明示的に認められたコピー。中身はコピーのまま、先頭の説明の1行目だけ「うり坊の仮のスプライト（左向き。原点は体の中ほど、足元は範囲の下端）。」に直す）。`spriteView.js` に `import unitUribo from 'assets/sprites/unit_uribo.js'`・`SPRITE_IDS.uribo = 'uribo'`・`SPRITE_TABLE` の行（今の猪と同じ範囲 x −172〜168・y −122〜128）。発注者が描き直して同じ名前で上書きしたら、`SPRITE_TABLE` の `uribo` の行を新しい `bounds` に合わせるだけで済む（群れの体は長い方の辺を `size` にして描くので、縦横比が変わっても大きさの決め方は同じ）。`unit_boar.js` とほかのスプライトは変えない。

**敵の絵（`enemyPortrait.js`。タスク14）**: 群れの絵（`hordeSkinOf`）と絵（`battleLayout.enemyFigures[typeId]`）の両方を持つ敵は、矩形の中に親の絵（矩形の右下にそろえた幅・高さ 0.8 倍の矩形に `drawSpriteFit`）を描き、その手前（左下）にうり坊を3体（大きさは矩形の高さの 0.3 倍。足元の位置は矩形に対する割合 `{ x: 0.14, y: 1 }`・`{ x: 0.32, y: 1 }`・`{ x: 0.23, y: 0.9 }`）描く。値は `enemyPortrait.js` の定数 `BROOD_PORTRAIT`（凍結）。引数の `horde`（群れの敵の並び）はこの敵では使わない。片方だけ持つ敵は今のまま。

**描く体の数の見込み**: ステージ 30 はうり坊 83 体＋攻撃のうり坊 30〜31 体＋自軍の兵、ステージ 100 はうり坊 268 体＋攻撃のうり坊 118〜119 体＋自軍の兵（ゴブリンの軍勢のステージ 100（群れ 366 体）と同じくらいの重さ）。タスク12・タスク15で数える。

### 要件4: DEBUG タブ（タスク5・タスク13）
* **敵の切り替え**: 今のまま（名前は設定の「猪の親子」）。
* **敵の次の行動**（`debugIntents.js`）: `intentChoiceIds(behavior, situation = null)`・表の `ids(behavior, situation)` に局面の引数を足す（ほかの決まりは読まない）。`brood` の行: `together` は `youngAttack`・`protect`、`enraged` は `rush`・`rage`・`bigRush`、`young` は `youngAttack`、`null` は空。`plan(behavior, id, random, unit)`: `youngAttack` は `steadyAttackAction`、`protect` は `protectAction`、`rush`・`rage`・`bigRush` はそれぞれの関数で、状態は `{ lastVariant: action.variant ?? null }`。`chosen`: `kind` が `guard` なら `protect`、中の種類が `rush`・`rage`・`bigRush` ならそれ、ほかは `youngAttack`。
* `debugControls.js`: `intentChoiceIdsOf(game)` は `enemySituationOf(game.enemy.parts)` を渡す（今の局面でできる行動だけ）。`intentChoiceSlotCount(config)` は敵ごとに `[null, ...ENEMY_SITUATIONS]` の各局面の数の最大を取る（ほかの決まりは局面によらず同じ数なので今と同じ 3。猪の親子は最大 3）。`chooseEnemyIntent` は今のまま（今の局面の識別子だけ通る）。
* **ルールの値**（`debugRuleItems.js`）: `BEHAVIOR_ITEMS.brood` = 子の攻撃の幅（`${typeId}.attack`・名前 `youngAttackMin`/`Max`・種類 `amount`）、守る確率（`${typeId}.protectChance`・`protectChance`・`chance`）、守るの幅（`${typeId}.protect`・`protectMin`/`Max`・`defense`）、突進の幅（`${typeId}.rush`・`rushMin`/`Max`・`amount`）、怒りを溜める確率（`${typeId}.rageChance`・`rageChance`・`chance`）、大突進の幅（`${typeId}.bigRush`・`bigRushMin`/`Max`・`amount`）。効く時期はどれも「次の予告から」。最大 HP の項目は、設定が `brood` を持つ敵だけ名前を `maxHpTotal`（「最大 HP（合計）」）にする（識別子・種類・時期は今のまま）。猪の項目は 7 個 → 11 個で、全部で 69 個。「元に戻す」は今のまま全項目を戻す。
* **最大 HP を変えたとき**（`debugRules.js` の `applyNow`）: 今の敵が `parts` を持つときは、加算後の新しい最大 HP から `enemyParts.js` の `fitPartsToMax(brood, maxHp, parts)`（親と子をそれぞれ新しい最大で頭打ち。合計が 0 になるときは親に 1 を残す）で親と子を求め、`hp` を合計にする（上げない・超えるときだけ下げる、の今の決まりと同じ）。
* **「HP を 1 にする」「満タンにする」**（`debugControls.js` の `setEnemyHp`）: 今の敵が `parts` を持つときは `partsWithTotal(brood, maxHp, parts, hp)` で親と子を決める。満タン（`hp ≥ maxHp`）は親子とも最大。それ以外は、生きている部分（HP > 0）を親 → 子の順にそれぞれの最大まで満たし、足りなければ倒れている部分へ親 → 子の順に回す。**「1 にする」は、親が生きていれば親 1・子 0（次のターンから怒る）、親が 0 なら子 1**。予告は変えない（今のまま）。
* **「子を 0 にする」**（`zeroEnemyChild(game)`）: 段取り中で、`parts` を持ち、子 > 0 のときだけ。親 > 0 なら子を 0、親が 0 なら子を 1（倒したことにしない）。`hp` を合計にする。**予告は変えない**（次のターンの予告から怒る。今の予告が子の攻撃・守るのままでも、攻撃のうり坊は画面の外から出て、守るのシールドは親の前に出るので、演出は壊れない）。
* **「親を 0 にする」**（`zeroEnemyParent(game)`）: 段取り中で、`parts` を持ち、親 > 0 のときだけ。子 > 0 なら親を 0、子が 0 なら親を 1。`hp` を合計にする。**今の予告が今の局面で指定できない行動（親が 0 で子だけになったときの守る）なら、ふつうに予告を決め直す（`game.planIntent()`。乱数はゲームの乱数）。** 親のいない守るのターンは、シールドの並べ先がなく演出が Error になるため。
* 0 にする・1 を残す・決め直す計算は `enemyParts.js`（`zeroPart(parts, part)`）と `debugControls.js` の操作に置く。DEBUG の文字（`debugText.js`）: 行動 `youngAttack: '子の攻撃'`・`protect: '子どもたちを守る'`・`rush: '突進'`・`rage: '怒りを溜める'`・`bigRush: '大突進'`、項目名 `maxHpTotal: '最大 HP（合計）'`・`youngAttackMin/Max: '子の攻撃の量 最小/最大'`・`protectChance: '守る確率'`・`protectMin/Max: '守るの防御 最小/最大'`・`rushMin/Max: '突進の量 最小/最大'`・`rageChance: '怒りを溜める確率'`・`bigRushMin/Max: '大突進の量 最小/最大'`、ボタン `childToZero: '子を 0 にする'`・`parentToZero: '親を 0 にする'`。
* ボタンの段（`debugLayout.js`）: 敵の HP の「1 にする」「満タンにする」の下に `enemyPartButtons: { child, parent }`（半分の幅2つ）を足し、その下の強化・FPS・ルールの値の y を1段ぶん下げる。ボタンはどの敵でも出す（親子でない敵では押しても何も起きない）。`debugTab.js` がボタンを足し、`boardDebug.js` の `zeroEnemyChild()`・`zeroEnemyParent()` につなぐ。

### 要件5: 確かめ（全タスク）
* 一時スクリプトはスクラッチのフォルダ（リポジトリの外）に置き、終わったら消す（消せなければ残した場所を書く）。`oz` は代用（`Engine`・`Scene`・`Storage`・`CanvasCache`・`Ui`・`Sound` などの最小の代わり）、`assets/` だけ解く `module.register` のローダーで `js/` を読む（07-08 と同じ要領）。変更前のコードは `git archive c4d8924`（本 REQ のコミット）をスクラッチへ展開して比べる。リポジトリの状態を変える git 操作はしない。
* 切り替え（タスク12）の前に猪の親子を試すときは、スクラッチに写した `js/` の猪の行（`config.js`、タスク7以降は見せる表も）をタスク12の行に書き換えた写しを使う（作業ツリーは書き換えない）。
  * **先回りの依存**: タスク12の行は、後のタスクで足す物を前提にしている。写しを使う確かめでは、そのタスクの時点でまだない物に頼らない。
    * `behavior.type: 'brood'` は `BEHAVIORS.brood`（タスク2）がないと `createEnemy` が Error になる。タスク1は猪の行に `brood` だけを足し、`behavior` は今の `buildup` のままにした写しを使う（タスク1の確かめ(1)）。
    * `motion`（タスク4）はタスク2・3の時点ではまだ効かず、★1は `brood` の組が増えた4組になる（Error にはならない）。タスク2・3で写しの `Game` に猪の親子を出すときは、ステージの並びに頼らず `debugControls.js` の `switchEnemy(game, 'boar')` で出す。
    * `BEHAVIOR_ITEMS.brood`・`INTENT_TABLE.brood`（タスク5）がないと、写しの設定で `debugRuleItems.js`（読み込んだときに組み立てる）と、それを import する `debugRules.js`・`boardDebug.js`・`main.js` の読み込みが Error になり、`intentChoiceIdsOf`・`intentChoiceSlotCount`・`planChosenIntent`・`chosenIntentOf` も Error になる。タスク2〜4の写しの確かめでは、これらを読み込まず・呼ばない（起動の確かめは作業ツリーの `js/` で行う）。
    * `HORDE_SKINS.boar` の `SPRITE_IDS.uribo`（タスク8）と `HORDE_PLACES.boar` の `area.h` の扱い（タスク9）は、タスク7の時点ではまだない。タスク7の写しの置き換え方はタスク7の確かめ(2)のとおり。タスク10の写しはタスク8・9の後なので、タスク12の行のまま使える（予告の札の突進・怒りを溜める・大突進の絵と文字はタスク11まで「？」になるが Error にはならない）。
* 確かめること（REQ 要件5。主にタスク15でまとめて行い、各タスクではその分を行う）:
  * **HP の分け方**: ステージ 1・2・6・11・16・30・100・500 などで、親 = 最大 HP − 子・子 = floor(最大 HP × 50 / 100)・合計がステージの加算の後の最大 HP と同じ。
  * **予告の割合**: 猪の親子を多数のターン進め、局面ごとの予告の行動・量の幅（加算の後）・確率が要件2のとおり（守る ≈ 30%、溜めの抽選のうち溜める ≈ 30%、溜めの次は大突進、大突進の次は突進、子だけは子の攻撃だけ）。乱数の呼び出しの回数が表のとおり。
  * **剣の当たり方の場合分け**: ふだんのターン（剣 0・子より少ない・子と同じ・子より多い（余りが親）・合計以上（倒す））、守るターン（剣が防御以下・防御と親の間・親を越えて子へ・倒す）、怒り（突進・溜め・大突進）と子だけ（どちらも倒すときを含む）、城が落ちるとき。`enemyBlock`・`enemyDamage` の合計・`parts` の量・親と子の HP の残りが要件2のとおりで、Error がない。
  * **数える回数**: 倒したこと（`enemyDefeat`・結果の記録の倒した数・`defeated`）とスコアが1回だけ。親だけ・子だけが 0 では数えない。
  * **攻防の時間割**: 上の場合（攻撃・防御の精鋭を含む）で時間割が Error なく作れ、落ちるうり坊の数・親の倒れる時刻（親の HP が 0 になる段の終わり。親が残るときは倒れない）・シールドで止まる量・HP の表示の減り方（終わりが結果の HP）・当たりの記録の `enemyDamage` の量の合計が、出来事の量と合う。
  * **変わっていないこと**（変更前 `c4d8924` と同じ乱数の状態から比べる）: ほかの7種の予告・最大 HP・乱数の呼び出し（順と回数）・攻防の出来事・時間割（段の時刻・きっかけ・名簿の脚と終わり方・HP の変化・当たりの記録・ヒットマーク・終わりの時刻・人数の表示値）・見た目（代用の `ctx` の描く呼び出しの並び）。★1の並び（10 年分の日付の種 × ステージ 1〜500 で、同じ日付・ステージで同じ敵の種類）。`RULE_ITEMS` のほかの敵の項目と、DEBUG の次の行動の選択肢の数（3）。
  * **中断データ**: 3つの局面それぞれのターンの始まりと3択の段階で保存して戻し、同じ操作で同じ結果（乱数の状態・親と子の HP・決まりの状態まで）。版 6 のデータ・形違いの `parts`（合計が HP と違う・親子の敵で `null`・親子でない敵で値あり・負・小数）は捨てられる。
  * **描く体の数**: ステージ 30・100 の猪の親子で、段取りの間と攻防の演出の名簿の体の数（目安 500 体）。
  * **起動とプレイが壊れないこと**（画面に関わるタスクの終わりに行う）: 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込めること、`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → 放つ → BATTLE!）→ 積んだ `BattleShowScene` → 次のフェーズを数ターン Error なく進められ、代用の `ctx` で `draw` が Error なく `save`/`restore` が釣り合うこと。

### 関連フォルダと論理クラス
*   **対象フォルダ**: `./js/rules/`（親と子を持つ敵の計算・設定・行動の決まり・敵の状態・攻防の計算・ゲーム・並びの組の鍵・DEBUG の操作と項目・中断データ）、`./js/anim/`（体の見せ方 `brood`・当たる先ごとの段・時間割・待機）、`./js/view/`（うり坊のスプライトの表・群れと絵の HP の読み方・段取りの間の敵・予告の札・猪の見せる表・DEBUG の文字と配置・敵の絵）、`./js/scenes/`（待機の数・攻撃の音・DEBUG タブと口）、`./assets/sprites/`（うり坊のスプライトのコピー）。
*   **関連する論理クラス**: 新規 `enemyParts.js`（`ENEMY_SITUATIONS`・`partMaxHps`・`createEnemyParts`・`enemySituationOf`・`battlePartsOf`・`splitPartDamage`・`isEnemyPartsShape`・`fitPartsToMax`・`partsWithTotal`・`zeroPart`・型 `EnemyParts`・`BattleParts`・`PartDamage`）、`bodyHp.js`（`hordeHpOf`・`figureHpOf`）、`unit_uribo.js`。更新 `RULES.enemies.boar`・型 `EnemySpec`（`motion`・`brood`）・`EnemyBroodSpec`・`EnemyBehaviorSpec`（`brood`）、`enemyBehaviors.js`（`BEHAVIORS.brood`・`protectAction`・`rushAction`・`rageAction`・`bigRushAction`・`planBehaviorAction` の `situation`）、`combatants.js`（`Enemy.parts`・`EnemyAction.variant`）、`battle.js`（`BattleInput.enemyParts`・`BattleEvent.parts`・`BattleCalc.enemyParts`）、`Game`（`planIntent`・`resolveBattle`）、`enemyTypes.js`（`motionKeyOf`・`enemyMotionsOfStar`）、`debugIntents.js`（`INTENT_TABLE.brood`・`intentChoiceIds` の `situation`）、`debugControls.js`（`intentChoiceIdsOf`・`intentChoiceSlotCount`・`setEnemyHp`・`zeroEnemyChild`・`zeroEnemyParent`）、`debugRules.js`（`applyNow`）、`debugRuleItems.js`（`BEHAVIOR_ITEMS.brood`・最大 HP の項目名）、`suspendData.js`（`FIELDS.enemy`・`SUSPEND_VERSION` 7）、`enemyShows.js`（`DEFENSE_SHOWS.brood`・`enemyHasHorde`・`ENEMY_SHOWS.boar`）、`enemyBody.js`（`BODY_SETUPS.brood`・`BODY_HITS.brood`・`EnemyBody.partHp`・`createEnemyBody`・`hitEnemyBody`・`isEnemyFigureDown`）、`battleSteps.js`（`BattleSnapshot.enemyParts`・`BattleStep.part`）、`battleTimeline.js`（`addEnemyHit`）、`EnemyIdle`、`spriteView.js`（`SPRITE_IDS.uribo`）、`hordePlaces.js`（`area.h`・`HORDE_PLACES.boar`）、`enemyView.js`（`drawEnemyFigure`）、`BoardScene.update`、`battleText.js`（`VARIANT_LABELS`・`BADGE_LABELS`・`intentBadgeLabel`）、`intentView.js`（`INTENT_ICONS`・`EMPHASIZED_VARIANTS`・`drawEnemyIntent`）、`ENEMY_FIGURES.boar`、`HORDE_SKINS.boar`、`ENEMY_ATTACK_SE.boar`、`debugText.js`（`DEBUG_TEXT`・`RULE_ITEM_TEXT`・`INTENT_CHOICE_TEXT`）、`createDebugLayout`（`enemyPartButtons`）、`buildDebugTab`、`BoardDebug`（`zeroEnemyChild`・`zeroEnemyParent`）、`drawEnemyPortrait`（`BROOD_PORTRAIT`）。

### 参照する責務
*   憲法 3章: ルール（親と子の HP・局面・行動・剣の当たり方・倒したか）はルール層だけに書き、ルール層は `oz`・画面・演出を import せず、Canvas・DOM・音・時間に触れず、`Math.random`・日付を読まない（乱数は外から渡されたものだけ）。画面・入力・演出は状態を読むことと、ルール層が公開する操作を呼ぶことでだけ状態を変え、ルールの判定や計算を画面に書き写さない。演出は結果を見せるだけで、途中・速さの設定で結果を変えない。数値は設定の1か所（ルールは `config.js`、動きの時間は `js/anim/` の設定、配置・大きさは `js/view/` の表と定数）で、ほかに直書きしない。`update` で描かず、`draw` で状態を変えない。`ctx` は `save`・`restore` で囲む。時間は `update(dt)` の `dt` と `draw` の `time` だけ。`js/` に `requestAnimationFrame`・`addEventListener`・`getContext` を書かない。`window` にプロパティを足さない。エンジンは `import { … } from 'oz'` だけ・`oz/` を編集しない・`oz/src/` を読まない。必要な機能が `oz/ENGINE_API.md` にない・書かれたとおりに動かないときは回避策を書かずに止めて RES に記録する。スプライトは `spriteView.js` だけが import する。手で書いた仮のスプライトのコピーは REQ が認めた `unit_uribo.js` だけ（中身はコピーのまま、説明の1行目だけ直す）。すべてのファイルの先頭に責務を3行以内、クラス・関数・型・定数に JSDoc。責務に合わない処理は新しいファイルに分ける。先回り実装をしない（遊び方の4ページ目・新しい音・新しい予告の絵・スライムの調整・うり坊の本番の絵はしない）。
*   開発資料 2章「敵」: 敵は HP・次の行動の予告（攻撃の側と防御の側）を持つ。予告の `defense` は抽選した量にステージの加算（防御）を足した `baseDefense` に疲弊を掛けた値で、予告の表示・シールドの数・攻防の計算はこれだけを読む。攻撃の側は種類（攻撃・振りかぶり（量 0）・防御だけ `guard`（量 0。任意の `guard` に加算の前の防御の量を持ち、予告では `baseDefense` にされて残らない））と量、中の種類（`variant`。表示の違いだけで、城へのダメージ・行動の扱いは種類によらない）。敵の並びは、★の敵を動き（`behavior.type`）ごと・書いた順にまとめ（`enemyMotionsOfStar`）、同じ★の何番目かから動きの番号（`motionIndexAt`）、同じ動きの中の敵は `seededIndex(seed, STREAM.member, stageNumber, 数)` で選ぶ（乱数を呼ばない）。★1は6種で、ゴブリンとオーガ（`steady`）・狼と猪（`buildup`）・骸骨とスライム（`either`）の3組。ステージの加算は `stageBonus.js` の1か所で求め、HP は敵を作るとき（`grownMaxHp`）、攻撃・防御は予告を作るとき（`enemyIntent.js`）に足す。行動の決まりは種類ごとの設定から選ばれ、決まりの状態を敵ごとに持つ。溜めて大攻撃（`buildup`）は溜めていないターンに溜める確率で抽選し（乱数1回）、外れればふつうの攻撃（量1回）、大攻撃の次のターンは抽選せずふつうの攻撃。防御だけの行動の量はステージの加算（防御）を足し、疲弊も同じ式。行動が防御の量を持たず、敵が防御の設定を持たないときは抽選せず防御 0。
*   開発資料 2章「敵の種類を足すときに書き足す所」: 敵の種類は識別子で引く表に1行ずつ足す（識別子で分岐する if は書かない）。ルール層は `config.js` の `enemies` に1行、行動の決まりが新しいときは `enemyBehaviors.js` の表に1行（状態・次の行動・数え下ろし・隙・形の確かめ）と行動を作る関数、`debugIntents.js` の表に1行、`debugRuleItems.js` の組み立てに項目（必要なら `debugRules.js` の `VALIDATORS`・`debugRuleSliders.js` の `RULE_SLIDERS`・`debugText.js` の項目名・時期）、`debugText.js` の `INTENT_CHOICE_TEXT`、`battleText.js` の `VARIANT_LABELS`、`intentView.js` の `INTENT_ICONS`・`EMPHASIZED_VARIANTS`、`intentParts.js`。行動の `kind` が新しいときは `battle.js`・`battleText.js` の `ACTION_LABELS`・`AMOUNTLESS_KINDS`・`suspendData.js` の `INTENT_KINDS` と `SUSPEND_VERSION`（今回は `kind` を足さない）。演出は `enemyShows.js` の `ENEMY_SHOWS` に1行（体の見せ方・攻撃の見せ方・大きな一撃 `heavy`・ための動き `charge`・`dents`・`pace`（必須））。絵の敵は `enemyFigures.js` の `ENEMY_FIGURES` に1行、群れの敵は `hordeSkins.js` の `HORDE_SKINS` に1行と `hordePlaces.js` の `HORDE_PLACES` に同じ識別子で1行。どちらもスプライトの `spriteView.js` の `SPRITE_IDS` と絵の範囲の表と `assets/sprites/` のスプライトが要る。音は `soundConfig.js` の `STAGE_BGM`（必須）、`soundCues.js` の `ENEMY_ATTACK_SE`（任意）、`ENEMY_HIT_RATE`（任意）。
*   開発資料 2章「攻防の出来事の並び」: 量が 0 の相殺・ダメージ・回復は並びに入れない。敵の攻撃の側（`enemyAttack`・`enemyWindup`・`enemyGuard`）は必ず入り、直後に敵の防御（`enemyDefend`。0 なら入らない）。敵の防御での相殺（`enemyBlock`。自軍の攻撃と敵の防御の小さい方。余った防御は持ち越さない）・敵へのダメージ（`enemyDamage`。残りの HP で頭打ち）・敵の撃破（`enemyDefeat`。敵の HP が 0 になったら必ず入り、回復が続く）。決着は城が落ちる `'lose'` だけ。
*   開発資料 2章「結果の記録とスコア」: 倒した敵の数は出来事 `enemyDefeat` 1つごとに 1。最大の一撃は1回の攻防の自軍の攻撃から敵の防御での相殺を引いた量の最大（城が落ちた攻防は数えない）。スコアは敵を1体倒すたびに、倒した攻防（`resolveBattle`）の中で戦闘の記録から求めて足す。
*   開発資料 2章「1体のポイント」: 群れの敵の1体のポイントは `unitPoints`（書かなければ 1）。攻防の計算（`battle.js`）はポイントを知らない。
*   開発資料 2章「中断データ」: 各ターンの始まりと3択の段階を保存する。項目の表 `FIELDS`（項目名 → `{ save, check, load }`）に1行ずつ（`check` は形だけを見て設定の数値と比べない。`load` は写して使う）、形が変わったら `SUSPEND_VERSION` を上げる（今は 6）。敵の決まりの状態の形の確かめは `enemyBehaviors.js` の `isBehaviorState`（種類で分岐する if を `suspendData.js` に書かない）。`readSuspendData` は例外を投げず、合わなければ `null`。3択の段階でない敵の HP 0 は捨てる（`isStageConsistent`）。
*   開発資料 2章「設定（調整値）」・3章「デバッグ」: デバッグのゲームだけは `RULES` と同じ形の写し（`createDebugRules()`。凍結しない。保存しない）を使い、DEBUG タブで城と敵の値（今は 65 個）を変えられる。効く時期は値ごとに、すぐ（城と今の敵の最大 HP。今の敵の最大 HP はステージの加算後。最大 HP を変えたとき今の HP は超えるときだけ下げ、上げない）／次の予告から／…／出てきたときから。DEBUG タブの敵の次の行動の指定・城と敵の HP（「1 にする」「満タンにする」）。部品は盤面のデバッグの口（`BoardDebug`）を呼ぶだけで、ルールの状態はルール層のデバッグ用の操作（`debugControls.js`）とルールの値の操作（`debugRules.js`）でだけ変わる。操作は段取りの間だけ効く。
*   開発資料 3章「1フェーズの流れ」4（攻防中）: 群れの敵は HP を1体のポイントで割った数の体の群れ。攻撃の群れの兵は画面の外（右）から跳ねて現れる。シールドを張る絵の敵は防御の量の数のシールドが体に並び、攻撃の兵が当たるたびに1つ剥がれ、なくなった後に当たった兵の数が敵へのダメージになる。狼・猪の攻撃は打撃の前に絵が駆け寄り（猪はまっすぐ加速）、最後の打撃の後に戻る。絵の敵を倒すと跳ねて画面の下へ落ちる。大きな一撃（狼と猪の大攻撃など）はヒットストップが長く、段が揺れ、撃つ瞬間に光る。振りかぶりの攻防は先頭にための段。最上部の HP ゲージと数字は演出の HP の表示値。攻防の演出の途中のタップでは何も起きない。
*   開発資料 3章「自軍の複数ポイントの兵（精鋭）の消し合いの作り」: 群れ・守りは `chargePairs`（進む側の兵ごとに1回の当たり）、絵の敵・シールドは `chargePoints`。精鋭は1回の当たりで自分のポイントをシールド・敵の守り → 敵の順に使い、境目の精鋭は一部を使って傷ついた姿で残り、残りで次の段に敵へ当たる。敵の HP を減らす当たりは名簿の `strikes` に記録し、敵の HP の表示値は当たりごとにそのポイントだけ減る。
*   開発資料 1章「スプライトの決まり」: スプライトは `spriteView.js` だけが import し、描いた向きのまま描く（足元を軸に少し傾け・縮めるのはよい）。絵の敵は左（城の方）を向いて描く。基準点は体の中ほどで、地面に立たせるときは絵の範囲の下端を足元にそろえる。絵の範囲は `spriteView.js` の凍結した表に持ち、描く位置・大きさには `bounds` を使わない。スプライトを描き直して差し替えるときは表の値を新しい `bounds` に合わせる。猪（`unit_boar.js`）は手で書いた仮のスプライト（`source` を持つ）。
*   `js/rules/config.js`: ルールの調整値（敵8種ごとの★・最大 HP・1体のポイント・防御・行動の決まりなど）を1か所に凍結して持つ。
*   `js/rules/enemyBehaviors.js`: 行動の決まり（種類ごとの状態の初期値と次の行動の決め方・隙の判定）の表と呼び分け、行動の量の幅からの抽選、行動を作る関数（export）、決まりの状態の形の確かめ（`isBehaviorState`）、数え下ろしの問い合わせ、攻撃の直後の回復の抽選（純粋関数）。
*   `js/rules/combatants.js`: 城・敵の状態の生成（敵は種類の設定とステージの加算から作り、最大 HP・HP は加算後）と、予告の型（`EnemyAction`・`EnemyIntent`）。
*   `js/rules/battle.js`: 攻防の出来事の並びと結果の計算（純粋関数）。
*   `js/rules/Game.js`: ゲーム全体の状態と操作・問い合わせ。抽選を呼ぶ順・回数を守る。`enterStage`・`spawnEnemy` は乱数を呼ばない。大きいので、足す処理は新しいファイル（今回は `enemyParts.js`）に分け、`Game.js` には呼ぶ行だけを足す。
*   `js/rules/enemyTypes.js`: 設定の敵の種類の一覧・★ごとの候補・★ごとの動きごとの候補（`enemyMotionsOfStar`）・識別子からの設定の引き方（純粋関数）。
*   `js/rules/enemyIntent.js`（読むだけ。変えない）: 行動にステージの加算と防御の量を付けて予告を作る（`createIntent`）。
*   `js/rules/debugIntents.js`: 行動の決まりの種類ごとの「指定できる次の行動」の表（識別子の並び・指定した行動から行動と決まりの状態・今の予告がどれに当たるか）。純粋関数。乱数は渡されたものだけ。
*   `js/rules/debugControls.js`: ゲームの状態を書き換えるデバッグ用の操作（段取り中だけ効く）と問い合わせ。DEBUG タブから `boardDebug.js` 経由でだけ呼ばれる。
*   `js/rules/debugRules.js`: デバッグのゲームが使うルールの値の写しと、値の問い合わせ、変える・元に戻す操作（すぐ効く値は城・今の敵に効かせる）。
*   `js/rules/debugRuleItems.js`: DEBUG タブで変えられるルールの値の項目の表（`RULE_ITEMS`）を、`RULES` の形から城と敵の種類・行動の決まりの種類ごとに組み立てて持つ（今は 65 個）。
*   `js/rules/suspendData.js`: 中断データの形（`SUSPEND_VERSION`・`FIELDS`）と、ゲーム → データ・確かめ・データ → ゲーム。純粋な計算だけ。`Game.js` はこのファイルを import しない。
*   `js/anim/` の決まり: 時間で進む見た目の動き。結果を受けて見た目の値を作る。ゲームの状態を変えない・ゲームの結果を決めない・描画しない・`Sound` を import しない。`js/view/` は `campSlots.js`・`figureScale.js`・`bodyPoints.js` だけ実行時に import してよい（`bodyHp.js` は anim から import しない。anim は写しの `enemyParts` を読む）。
*   `js/anim/enemyShows.js`: 敵の種類ごとの攻防の見せ方の表（体の見せ方・行動の中の種類ごとの攻撃の見せ方・体の見せ方ごとの防御の見せ方・大きな一撃・ための動き・`dents`・`pace`）と、攻撃の見せ方ごとの段の作り方の表を持ち、引くだけ。
*   `js/anim/enemyBody.js`: 敵の体（群れ・シールドを名簿へ置く、攻撃の兵が当たる・シールドが剥がれる、倒れたとき絵が跳ねて落ちる記録）と、時計からの絵の見た目。体の見せ方ごとの違いはこのファイルの表で分ける。
*   `js/anim/battleSteps.js`: 攻防の前の値の写しと、攻防の出来事の並びから演出の段の並びを組み立てる。ルールの判定や計算はしない。
*   `js/anim/battleTimeline.js`: 段の並びから時間割（段の時刻・名簿・敵の体・ヒットマーク・当たりの記録・HP の変化・きっかけの時刻）を組み立てる。大きいので、足す処理は `enemyBody.js` に置き、ここは呼ぶ引数と判定の関数の付け替えだけにする。
*   `js/anim/enemyIdle.js`: 敵の待機の伸び縮み（段取りの間の見た目の入れ物と攻防の間の絵の姿勢）。
*   `js/view/` の決まり: 描き方と配置。ゲームの状態を変えない・ルールの判定をしない・時間で進む動きを持たない・`Sound` を import しない。ルール層は実行時に import しない（型の参照だけ）。
*   `js/view/spriteView.js`: スプライトJSの import と識別子の表・絵の範囲の表を持ち、位置と大きさを合わせて `draw(ctx)` を呼ぶ。
*   `js/view/hordePlaces.js`: 群れの敵の種類ごとの兵の大きさと、群れ・攻撃の陣地・守りの陣地の範囲の表（`HORDE_SKINS` と同じ識別子。標準なら `null`）と、引く関数。何も import しない。
*   `js/view/hordeSkins.js`: 群れで描く敵の種類ごとの群れの兵の絵の表と引く関数（`hordeSkinOf`・`isHordeEnemy`）。`spriteView.js` だけを import する。
*   `js/view/enemyFigures.js`: 絵の敵ごとの配置の表 `ENEMY_FIGURES`（高さ・シールドの範囲・当たる位置・口・予告の札（`gap` が `null` なら全体で共通の高さ）・`minScale`）と、配置の組み立て。
*   `js/view/bodyPoints.js`（読むだけ。変えない）: 群れの体の割り振り（`splitPoints`・`bodyCount`・`isWoundedBody`）。
*   `js/view/enemyView.js`: 戦闘の段の敵の絵の描画（段取りの間は絵・HP の群れ・シールドマークを入りの見た目に従って描く。攻防の演出中は絵だけを倒れる動きのずれで描き、群れ・シールドは名簿の1体として `troopView.js` が描く）。
*   `js/view/intentView.js`: 敵の頭の上の予告の札（攻撃の側の絵と量・防御の側。ブレス・大攻撃は赤い札）と数え下ろしの描画。攻撃の側の種類 → 絵の表（`INTENT_ICONS`）を持つ。
*   `js/view/battleText.js`: 敵の行動・予告の量の数字・数え下ろしなどを表示文字に直す（中の種類の名前の表 `VARIANT_LABELS`）。計算はしない。
*   `js/view/enemyPortrait.js`: 敵の絵を矩形に描く（群れの敵は体の絵を数体、絵の敵はその絵）。3択の画面の次の敵の絵と結果の画面が共有する。
*   `js/view/troopView.js`・`troopBakes.js`（読むだけ。変えない）: 群れの敵の兵の種類（`enemy`・`enemyGuard`・`goblin`）は `hordeSkinOf(enemyTypeId)` の絵で描き、`HORDE_SKINS` の絵をその敵の `hordePlaces` の大きさでも焼き付ける（表にない識別子は Error）。
*   `js/view/debugText.js`・`debugLayout.js`: DEBUG タブの文字（`DEBUG_TEXT`・`INTENT_CHOICE_TEXT`・`RULE_ITEM_TEXT`）と、部品の位置・大きさ（`createDebugLayout`）。
*   `js/scenes/` の決まり: 入力を受けてルール層の操作を呼ぶ・`anim` の時間を進める・`view` を呼んで描く・効果音（`soundCues.js`）を鳴らす。ルールの判定や計算・細かい描画は書かない。
*   `js/scenes/BoardScene.js`: 盤面のシーン（`update` で待機の伸び縮みを進める）。
*   `js/scenes/soundCues.js`: 敵の攻撃の始まりのきっかけから、敵の種類と行動の中の種類の表（`ENEMY_ATTACK_SE`。引き方は `enemyShows.js` と同じ）で引く攻撃の音を鳴らす。
*   `js/scenes/debugTab.js`・`boardDebug.js`: DEBUG タブの部品を足して盤面のデバッグの口につなぐ。口はルール層のデバッグ用の操作を呼ぶだけ。
*   `oz/ENGINE_API.md` 23章（スプライト）: スプライトJSは既定の export で `draw(ctx)` を持つ。今回はエンジンの新しい機能を使わない。

### 開発資料（`PROJECT_ARCHITECTURE.md`）の更新予定
*   1章「スプライトの決まり」「スプライトの一覧」: `unit_uribo.js`（うり坊。猪の親子の子。`unit_boar.js` のコピーの仮のスプライト。表の範囲は猪と同じ。描き直したら `SPRITE_TABLE` の `uribo` の行を合わせる）を足す。猪の説明を「猪の親子の親」にする。絵の敵の一覧に猪（親）、群れの説明にうり坊。
*   1章の戦闘の段の説明: 群れの敵の並ぶ場所に猪の親子（親の絵の奥にうり坊の群れ（x 565〜685・y 145〜225。`HORDE_PLACES` の `area.h`）、攻撃のうり坊の陣地は標準と同じ）を足す。予告の札の高さの説明（背の低い絵の敵は `gap`）の例から猪を外し、猪の親子は群れの敵と同じ高さ。札の「大攻撃（狼・猪）は赤い」に大突進、数え下ろしの「溜めている間の猪」を外す（猪の親子は数え下ろしを持たない）。怒りを溜める予告の札は振りかぶりの絵の右に「怒り」の文字。
*   2章「敵」: 敵の状態に親と子の HP（`parts`。親子の敵だけ。`hp` は合計）、行動の決まりに「親と子（猪の親子。`brood`）」の項（局面・行動・乱数の回数・状態 `lastVariant`）、溜めて大攻撃の項から猪を外す（狼だけ）、並びの決まりの組の鍵（`motion` があればそれ、なければ `behavior.type`。猪の親子は `motion: 'buildup'`）、★1の6種の名前（猪 → 猪の親子）、防御の設定を持たない敵の一覧の猪を猪の親子に、隙の説明に猪の親子（守るのターン以外）。予告の中の種類に `protect`・`rush`・`rage`・`bigRush`。
*   2章に「**親と子を持つ敵**」の項を足す: 体の形（親の絵＋子の群れ。体の見せ方 `brood`）・HP の分け方（設定の `brood.childPercent`。子は切り捨て、親は残り。`hp` は合計）・当たる順（設定の `brood.hitOrder`。予告の `kind` → 当たる順。防御で止まった後）・局面（`together`・`enraged`・`young`。予告を決めるときに `enemySituationOf(parts)` で決まる）・攻防の出来事（`enemyDamage.parts`。合計は今の式）・倒したのは合計 0 のとき1回だけ・回復は扱わない。計算の置き場所 `enemyParts.js`。
*   2章「**敵の種類を足すときに書き足す所**」に、親と子を持つ敵を書き足す所を足す: ルール層は `config.js` の行に `brood`（`childPercent`・`hitOrder`）と、行動の決まりが局面で変わるなら決まりの表の行で局面ごとの決め方（`planNext` の `situation`）・`debugIntents.js` の局面ごとの選択肢（`ids(behavior, situation)`）、並びの組を変えないなら `motion`。演出は `ENEMY_SHOWS` の `body: 'brood'`。絵は `ENEMY_FIGURES`（親）と `HORDE_SKINS`・`HORDE_PLACES`（子。群れの範囲の高さ `area.h`）の両方に同じ識別子で1行。敵の絵（`enemyPortrait.js`）は両方の表にあれば親の前に子を描く。
*   2章「攻防の出来事の並び」: `enemyDamage` の任意の項目 `parts`（親子の敵だけ。親と子に当たった量の並び。当たる順）。
*   2章「中断データ」: 版 7（6 から上げた理由: 敵の親と子の HP `parts` を足した）、敵の項目に `parts`（形の確かめは `enemyParts.js` の `isEnemyPartsShape`。親子の敵だけ値を持ち、合計が `hp` と同じ）。
*   2章「設定（調整値）」・3章「デバッグ」: 敵の種類の設定に `motion`・`brood`。猪（溜める確率と溜めのターン数）の記述を猪の親子（子の攻撃・守る確率と幅・突進・怒りを溜める確率・大突進）に。DEBUG のルールの値 65 個 → 69 個（猪の親子の最大 HP は「最大 HP（合計）」）。敵の次の行動の指定に猪の親子（今の局面でできる行動だけ）。敵の HP の「1 にする」の親子の扱い（親が生きていれば親 1・子 0、親が 0 なら子 1）と、「子を 0 にする」「親を 0 にする」（もう片方が 0 なら 1 を残す。親を 0 にして今の予告が今の局面でできなければ決め直す）。最大 HP を変えたときの親と子の合わせ方。
*   3章「1フェーズの流れ」1・4: 猪の溜めの数え下ろしの記述を外す。猪の親子の見せ方（子の攻撃はうり坊が画面の外から陣地へ出て城へ向かう、守るターンは親の前にシールド、剣はふだんは子 → 余りが親・守るターンはシールド → 親 → 余りが子、親が先に倒れると絵が倒れて消えうり坊が残る、怒った後は今の猪の駆け寄り・溜め・大きな一撃）。攻撃の音の表の猪の行（突進・大突進だけ）。
*   4章の表: 新規の行 `enemyParts.js`・`bodyHp.js`。行の更新 `config.js`・`enemyBehaviors.js`（`brood`・局面の引数・行動を作る関数）・`combatants.js`・`battle.js`・`Game.js`・`enemyTypes.js`（組の鍵）・`debugIntents.js`・`debugControls.js`・`debugRules.js`・`debugRuleItems.js`（69 個）・`suspendData.js`（版 7）・`enemyShows.js`・`enemyBody.js`・`battleSteps.js`・`battleTimeline.js`・`enemyIdle.js`・`spriteView.js`（`uribo`）・`hordePlaces.js`（`area.h`）・`hordeSkins.js`・`enemyFigures.js`・`enemyView.js`・`battleText.js`・`intentView.js`・`enemyPortrait.js`・`debugText.js`・`debugLayout.js`・`debugTab.js`・`boardDebug.js`・`BoardScene.js`・`soundCues.js`。

## 3. タスクリスト
※ 共通の作業（どのタスクでも行う）: 追加・変更した関数・型・定数・表の行の JSDoc と、ファイル先頭の責務（3行以内。新しいファイルは必ず書く）の記載漏れ・古い説明の残りがないことを確かめる。変更した .js の構文チェック（`node --input-type=module --check < <ファイル>`）。本 RES の詳細作業内容を記入する（確かめの結果を含む）。開発資料に影響が出ることが分かったら、資料本体は直さず『開発資料の更新予定』欄に追記する。確かめは2章「要件5」の要領（一時スクリプトはスクラッチに置き、終わったら消す。`git archive c4d8924` を変更前として比べる。切り替え前の親子の確かめはスクラッチの写しの設定・表で行う）。
※ 区切りの順は2章「区切りの順」のとおり。どのタスクの終わりでも起動とプレイは壊れない（タスク11の終わりまでは今の猪のまま遊べる）。

*   [x] タスク1: ルール層の親子の仕組み（1）— HP の分け方・局面・敵の状態の親と子の HP（猪の設定はまだ今のまま）
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 新規（`ENEMY_SITUATIONS`・`partMaxHps`・`createEnemyParts`・`enemySituationOf`・型 `EnemyParts`・先頭の責務。後のタスクの関数はまだ書かない）
        *   `./js/rules/config.js` : 更新（型だけ。猪の行はまだ変えない）
        *   `./js/rules/combatants.js` : 更新（`Enemy.parts`・`EnemyAction.variant` の型・`createEnemy`）
    *   **作業内容** :
        *   2章「要件1」の型・HP の分け方・敵の状態と、「要件2」の局面のとおりに書く。`enemyParts.js` は何も import しない（設定の型は JSDoc の参照だけ）。先頭の責務は「親と子を持つ敵の純粋な計算」としてこのファイル全体の責務を3行以内で書く。`parts` が `null`/`undefined` の扱いは「区切りの順」2のとおり。各関数・型・定数に JSDoc。
        *   確かめ: (1) HP の分け方を2通りで確かめる。**タスク12の猪の行（`behavior.type: 'brood'`）は使わない**（`createEnemy` は中で `createBehaviorState(spec.behavior)` を呼び、`BEHAVIORS.brood` はタスク2で足すので、`unknown enemy behavior type: brood` の Error になる）。(1a) 関数を直接: ステージ 1・2・6・11・16・30・100・500 それぞれで `grownMaxHp(44, stageBonusOf(RULES.stageGrowth, n), 1)` の値を求め、要件1の `brood`（`childPercent: 50`・`hitOrder`）を手で作って `partMaxHps(brood, maxHp)` と `createEnemyParts({ brood }, maxHp)` に渡し、子 = floor(最大 HP × 50 / 100)・親 = 最大 HP − 子・合計 = 最大 HP で、要件1の見込み（ステージ 1 = 22・22、30 = 84・83、100 = 268・268）と合う。`createEnemyParts` は `brood` のない設定で `null`。(1b) `createEnemy` を通す: スクラッチの写しの `config.js` の猪の行に要件1の `brood` だけを足す（`behavior` は今の `buildup` のまま。`maxHp` は今と同じ 44）。この写しの `RULES.enemies.boar` で、(1a) と同じステージの `createEnemy('boar', spec, stageBonusOf(…, n))` を呼び、`maxHp` が加算後、`parts` が (1a) と同じ、`hp === parts.parent + parts.child`。`enemySituationOf` の全場合（`null`・`undefined`・`together`・`enraged`・`young`・両方 0）を単体で。写しの設定では `Game` を通さない。(2) `RULES` のままで、8種の `createEnemy` の結果が `parts` を除いて変更前と同じで `parts` が `null`。変更前と並べたランダムなゲーム（強化を取るもの・敵を数体倒すもの・負けまで）で毎手の結果・状態（予告・乱数の状態・3択の候補まで）が一致（敵の新しい項目 `parts` は比べない）。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク2: ルール層の親子の仕組み（2）— 行動の決まり `brood` と、予告に局面を渡すこと
    *   **対象ファイル** :
        *   `./js/rules/enemyBehaviors.js` : 更新（`brood` の行・`BROOD_PLANS`・行動を作る関数・局面の引数・先頭の責務）
        *   `./js/rules/Game.js` : 更新（`planIntent` で `enemySituationOf(this.enemy.parts)` を渡す・import・先頭の責務）
    *   **作業内容** :
        *   2章「要件2」の行動の決まり `brood` のとおりに書く。`Game.js` には import と呼ぶ行だけを足す。各関数・表の行に JSDoc（`BROOD_PLANS` の各行に乱数の回数）。`enemyBehaviors.js`・`Game.js` の先頭の責務に親子を足す（3行以内）。
        *   確かめ: (1) スクラッチの写しの設定（猪の親子）で `planBehaviorAction` を局面ごとに多数呼び、予告の行動・量の幅・確率（守る ≈ 30%、溜めの抽選のうち溜める ≈ 30%、溜めの次は大突進、大突進の次は突進、子だけは子の攻撃だけ）・次の状態・乱数の呼び出しの回数が要件2の表のとおり。`isState`・`countdown`・`isOpening`・局面 `null` で Error。`createIntent` を通した予告（攻撃の加算・守るの `defense`・ほかの行動の防御 0）が要件2のとおり。写しの設定の `Game` で、敵の `parts` を手で書き換えて `planIntent` が今の局面の行動を出す（猪の親子は `switchEnemy(game, 'boar')` で出す。写しでは DEBUG の項目のモジュールを読み込まない。2章「要件5」の先回りの依存）。(2) `RULES` のままで、変更前と並べたランダムなゲーム（タスク1と同じ3種）で毎手の結果・状態が一致し、ほかの7種と今の猪の予告・乱数の呼び出し（順と回数）が同じ。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [ ] タスク3: ルール層の親子の仕組み（3）— 剣の当たり方の分け方と、攻防で親と子の HP を渡して受け取ること
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 更新（`battlePartsOf`・`splitPartDamage`・型 `BattleParts`・`PartDamage`）
        *   `./js/rules/battle.js` : 更新（入力 `enemyParts`・出来事の `parts`・結果 `BattleCalc.enemyParts`・先頭の責務）
        *   `./js/rules/Game.js` : 更新（`resolveBattle` で `battlePartsOf` を渡し、`calc.enemyParts` を `this.enemy.parts` に入れる。`BattleResult` には足さない）
    *   **作業内容** :
        *   2章「要件2」の剣の当たり方のとおりに書く。`Game.js` には import と呼ぶ行だけを足す。各関数・型に JSDoc。`battle.js` の先頭の責務に親子を足す（3行以内）。
        *   確かめ: (1) スクラッチの写しの設定（猪の親子）で、`splitPartDamage` と `computeBattle` の剣の当たり方の場合分け（要件5）が要件2のとおりで、`computeBattle` が合計の食い違い・親子の回復で Error。`Game` を通した攻防（猪の親子は `switchEnemy(game, 'boar')` で出す。写しでは DEBUG の項目のモジュールを読み込まない。2章「要件5」の先回りの依存）で、倒した数（`enemyDefeat`・結果の記録・`defeated`）とスコアが1回だけ・親だけ・子だけが 0 では数えない・攻防で局面が変わると次のターンの予告から新しい局面の行動になる・ゲームを敵が替わるまで・負けるまで Error なく進められる。(2) `RULES` のままで、変更前と並べたランダムなゲーム（タスク1と同じ3種）で毎手の結果・状態が一致し、ほかの7種と今の猪の攻防の出来事が同じ（`computeBattle` の結果の新しい項目 `enemyParts`・敵の `parts` は比べない）。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [ ] タスク4: ルール層の親子の仕組み（4）— 並びの組の鍵
    *   **対象ファイル** :
        *   `./js/rules/enemyTypes.js` : 更新（`motionKeyOf`・`enemyMotionsOfStar`）
    *   **作業内容** :
        *   2章「要件1」の並び（`enemyTypes.js`）のとおりに書く。関数に JSDoc。
        *   確かめ: (1) ★1の並び: 10 年分の日付の種 × ステージ 1〜500 で、変更前・`RULES` の変更後・スクラッチの写しの設定（猪の親子）の3つの敵の種類が同じ。(2) `RULES` のままで、各★の `enemyMotionsOfStar` の組と組の中の並びが変更前と同じ。写しの設定の★1が「`steady`・`buildup`・`either`」の3組で、`buildup` が狼・猪の親子の順。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [ ] タスク5: DEBUG のルール層 — 指定できる行動・敵の HP の付け方・ルールの値の項目（UI はまだ）
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 更新（`fitPartsToMax`・`partsWithTotal`・`zeroPart`）
        *   `./js/rules/debugIntents.js` : 更新（`brood` の行・局面の引数）
        *   `./js/rules/debugControls.js` : 更新（`intentChoiceIdsOf`・`intentChoiceSlotCount`・`setEnemyHp`・`zeroEnemyChild`・`zeroEnemyParent`・先頭の責務）
        *   `./js/rules/debugRules.js` : 更新（`applyNow` の親と子の合わせ）
        *   `./js/rules/debugRuleItems.js` : 更新（`BEHAVIOR_ITEMS.brood`・最大 HP の項目名）
    *   **作業内容** :
        *   2章「要件4」のルール層の分のとおりに書く。`enemyParts.js` の3つの関数は要件4の最大 HP を変えたとき・「HP を 1 にする」「満タンにする」・「子を 0 にする」「親を 0 にする」のとおり。各関数・表の行に JSDoc。
        *   確かめ: (1) `fitPartsToMax`・`partsWithTotal`・`zeroPart` を単体で、要件4の場合（満タン・1・親が 0・子が 0・合計が 0 になるとき親に 1 を残す・もう片方が 0 なら 1 を残す）で呼び、結果と `hp === parent + child` が要件のとおり。(2) `RULES` のままで、`RULE_ITEMS`（65 個。識別子・組・種類・名前・時期・刻み・読む値）・各敵の次の行動の選択肢と枠の数（3）・`planChosenIntent` の結果と乱数の呼び出し・`setEnemyHp`・`applyNow` が変更前と同じ。(3) スクラッチの写しの設定（猪の親子）で、`RULE_ITEMS` が 69 個（猪の親子の 11 個の識別子・名前・種類・時期。最大 HP は `maxHpTotal`）、局面ごとの選択肢（`together` 2つ・`enraged` 3つ・`young` 1つ）と指定した予告・決まりの状態・`chosenIntentOf`、「1 にする」「満タンにする」・「子を 0 にする」「親を 0 にする」（もう片方が 0 のときは 1 を残す・倒したことにならない・親を 0 にして守るの予告なら決め直す）・最大 HP のスライダーを上げ下げしたときの親と子と合計（`hp === parent + child`）、その後の攻防が Error なく進む。「元に戻す」で全部戻る。(4) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [ ] タスク6: 中断データ（版 7・親と子の HP）
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 更新（`isEnemyPartsShape`）
        *   `./js/rules/suspendData.js` : 更新（`FIELDS.enemy` の保存・確かめ・戻しに `parts`・`SUSPEND_VERSION` 7・`SuspendData` の型・版の説明）
    *   **作業内容** :
        *   `enemyParts.js` に `isEnemyPartsShape(spec, parts, hp)` を足す（形: 設定が `brood` を持つ敵は `parent`・`child` が 0 以上の整数のプレーンなオブジェクトで合計が `hp`、持たない敵は `null`。例外を投げない。JSDoc）。
        *   REQ 要件2「中断データ」と2章「区切りの順」2のとおり、敵の項目に `parts` を足す（保存は写し、確かめは `isEnemyPartsShape(enemySpecOf(config, typeId), value.parts, value.hp)`、戻しは写し）。`SUSPEND_VERSION` を 7 にし、版の説明に「7: 敵の親と子の HP `parts` を足したとき 6 から上げた」を足す。
        *   確かめ: (1) `isEnemyPartsShape` を単体で、親子の敵・親子でない敵それぞれの正しい形と形違い（合計が HP と違う・親子の敵で `null`・親子でない敵で値あり・負・小数・プレーンでないオブジェクト・項目の欠け）で呼び、結果が要件のとおりで例外を投げない。(2) `RULES` のまま、ターンの始まりと3択の段階の保存・復元で続けた結果が変更前と同じ（敵の `parts` は `null`）。版 6 のデータが捨てられる。(3) スクラッチの写しの設定（猪の親子）で、3つの局面それぞれのターンの始まり（溜めの次の大突進のターンを含む）と3択の段階で保存・復元し、同じ操作で同じ結果（乱数の状態・親と子の HP・決まりの状態まで）。形違いの `parts`（要件5）が捨てられ、例外を投げない。(4) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [ ] タスク7: 演出の「絵と群れを両方持つ体」の仕組み（猪の見せ方はまだ今のまま）
    *   **対象ファイル** :
        *   `./js/anim/enemyShows.js` : 更新（`DEFENSE_SHOWS.brood`・型・`enemyHasHorde`。猪の行はまだ変えない）
        *   `./js/anim/enemyBody.js` : 更新（`BODY_SETUPS.brood`・`BODY_HITS.brood`・`partHp`・`createEnemyBody`・`hitEnemyBody`・`isEnemyFigureDown`・先頭の責務）
        *   `./js/anim/battleSteps.js` : 更新（`BattleSnapshot.enemyParts`・当たる先ごとの `enemyHit`・`BattleStep.part`）
        *   `./js/anim/battleTimeline.js` : 更新（3か所のつなぎだけ）
        *   `./js/anim/enemyIdle.js` : 更新（`enemyHasHorde` を使う）
    *   **作業内容** :
        *   2章「要件3」の体の見せ方・敵の体・段と時間割のとおりに書く。`battleTimeline.js` は要件3の3か所だけ変える（ほかの段の組み立ては変えない）。各関数・型・表の行に JSDoc。
        *   確かめ: (1) `RULES` のまま、8種の敵 × ランダムなゲージ（0 を含む。攻撃・防御・修理の精鋭を含む）× DEBUG の口で指定した次の行動を多数作り、変更前と後の段の並び・時間割（段の時刻・きっかけ・名簿の脚と終わり方・HP の変化・当たりの記録（並びの順まで）・ヒットマーク・終わりの時刻・人数の表示値（時計の多数の点で））・待機の伸び縮みの値が一致（写しの新しい項目 `enemyParts`・体の新しい項目 `partHp` は比べない）。(2) スクラッチの写し（猪の行をタスク12の行にした設定と見せる表）で、親子の攻防の段の並びが要件3のとおりで時間割が Error なく作れる（主な確かめはタスク12）。写しの見せる表のうち、まだない物に頼る値は次のとおり置き換える（2章「要件5」の先回りの依存）: `HORDE_SKINS.boar` の `body` は `SPRITE_IDS.uribo`（タスク8）の代わりに今ある `SPRITE_IDS.goblin`（`bake: 'goblin'`）にする（時間割は群れの絵を読まないので結果は変わらない）。`HORDE_PLACES.boar` の `area.h`（タスク9）は書いてもまだ効かず、群れの範囲は足元の範囲いっぱいになる前提で見る（群れと親の絵の重なりはここでは見ない。タスク9・12で見る）。`ENEMY_SHOWS.boar` の `body: 'brood'` はこのタスクで足す体の見せ方なのでそのまま使える。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク8: うり坊のスプライト — スプライトのコピーとスプライトの表
    *   **対象ファイル** :
        *   `./assets/sprites/unit_uribo.js` : 新規（`unit_boar.js` のコピー。先頭の説明の1行目だけ直す）
        *   `./js/view/spriteView.js` : 更新（import・`SPRITE_IDS.uribo`・型・`SPRITE_TABLE` の行）
    *   **作業内容** :
        *   2章「要件3」のスプライトのとおりに書く（`unit_uribo.js` はシェルのコピー（`cp`）で作り、説明の1行目だけ直す。ほかの行・`source`・要素は変えない）。表の行・識別子に JSDoc。
        *   確かめ: (1) `unit_uribo.js` と `unit_boar.js` の違いが先頭の説明の1行目だけ（`diff`）。`unit_uribo.js` が読み込め、`spriteView.js` の描く関数で `SPRITE_IDS.uribo` を描け、`save`/`restore` が釣り合う。`SPRITE_TABLE` の `uribo` の行が猪の行と同じ値。(2) `RULES` のまま、ほかのスプライトの描く呼び出しの並びが変更前と同じ。焼き付けの一覧に `uribo` が入らない（`HORDE_SKINS` にまだないので）ことを含めて一覧が変更前と同じ。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク9: 群れの範囲の高さ（`area.h`）
    *   **対象ファイル** :
        *   `./js/view/hordePlaces.js` : 更新（`area.h`（任意）の型と `createHordePlaces`。猪の行はまだ足さない）
    *   **作業内容** :
        *   2章「要件3」の猪の行の見せる表のうち `createHordePlaces` の `area.h` の扱い（群れの範囲の y は足元の範囲の上端のまま、高さを `min(area.h, 足元の範囲の高さ − 削る量)` にする。攻撃・守りの陣地は今のまま）のとおりに書く。型・関数の JSDoc。
        *   確かめ: (1) `RULES` と今の表のまま、実際の戦闘の段の配置の `groundY`・`fieldH`・標準の値で、今の表のすべての行と標準の `createHordePlaces` の結果が変更前と同じ。(2) スクラッチの写しの表（`HORDE_PLACES` に要件3の猪の行を足したもの）と、写しの `ENEMY_FIGURES` の猪の行（要件3）で、実際の `groundY`・`fieldH` から群れの範囲（`area` の x・y・w・h）・攻撃と守りの陣地・群れの体の上端（足元 − `size`）と、親の絵の矩形（x・y・幅・高さ）を数値で求めて詳細作業内容に書く。群れの足元の範囲が見込み（x 565〜685・y 145〜225。体は y 121 から）のとおりで、群れの足元の範囲の下端が親の矩形の上端（見込み y 235）より上にあり重ならないこと。見込みと違うか重なるときは、どの値がどれだけ違うかと直す案を懸念事項に書く（猪の行の値はタスク12で入れるので、このタスクでは表に足さない）。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク10: 群れと絵の描き分け — 群れと絵の HP の読み方・段取りの間の敵・待機の群れの数
    *   **対象ファイル** :
        *   `./js/view/bodyHp.js` : 新規
        *   `./js/view/enemyView.js` : 更新（段取りの間の群れと絵・型・先頭の責務）
        *   `./js/scenes/BoardScene.js` : 更新（待機の群れの数を `hordeHpOf` から）
    *   **作業内容** :
        *   2章「要件3」の見た目の仕組みのうち `bodyHp.js`・`enemyView.js`・`BoardScene.update` のとおりに書く。各関数・型に JSDoc。
        *   確かめ: (1) `hordeHpOf`・`figureHpOf` を、`parts` が `null`・`undefined`・値ありの敵で呼び、要件3のとおり。(2) `RULES` のまま、8種の敵の段取りの間（入りの途中・待機の伸び縮み・シールドの数・スライムの縮みを含む）と攻防の演出中の描画を代用の `ctx` の呼び出しの並びで記録し、変更前と同じ。`BoardScene.update` の待機の伸び縮みの値が変更前と同じ。(3) スクラッチの写し（猪の行をタスク12の行にした設定と見せる表）で、段取りの間に群れと絵を両方描け（親が 0 の子だけ・子が 0 の怒りを含む）、`save`/`restore` が釣り合う（主な確かめはタスク12）。(4) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク11: 予告の札 — 突進・怒りを溜める・大突進の札と「怒り」の文字
    *   **対象ファイル** :
        *   `./js/view/battleText.js` : 更新（`VARIANT_LABELS` の3行・`BADGE_LABELS`・`intentBadgeLabel`）
        *   `./js/view/intentView.js` : 更新（`INTENT_ICONS` の3行・`EMPHASIZED_VARIANTS`・「怒り」の文字・定数）
    *   **作業内容** :
        *   2章「要件3」の見た目の仕組みのうち予告の札・「怒り」の文字のとおりに書く。各関数・定数・表の行に JSDoc。
        *   確かめ: (1) `RULES` のまま、予告の札（代用の `ctx` の呼び出しの並び）と始まりの文字が今の行動すべてで変更前と同じ。(2) 突進・怒りを溜める・大突進の予告（手で作ったもの）で、札の絵・赤い札・「怒り」の文字（位置・フォント・色）と始まりの文字が要件3のとおりで、`save`/`restore` が釣り合う。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク12: 猪の設定を猪の親子に切り替える（設定と見せる表の猪の行を同時に）
    *   **対象ファイル** :
        *   `./js/rules/config.js` : 更新（猪の行・先頭の責務）
        *   `./js/anim/enemyShows.js` : 更新（猪の行）
        *   `./js/view/enemyFigures.js` : 更新（猪の行）
        *   `./js/view/hordeSkins.js` : 更新（猪の行・先頭の責務の敵の一覧）
        *   `./js/view/hordePlaces.js` : 更新（猪の行）
        *   `./js/scenes/soundCues.js` : 更新（`ENEMY_ATTACK_SE.boar`）
    *   **作業内容** :
        *   2章「要件1」の設定と「要件3」の猪の行の見せる表のとおりに書く。各表の行の JSDoc・説明の敵の一覧（「狼・猪」の組・猪の溜め・群れの敵の一覧など）を今の形に合わせる。
        *   確かめ: 2章「要件5」のうち、HP の分け方・予告の割合・剣の当たり方の場合分け・数える回数・攻防の時間割（精鋭を含む）・中断データ・描く体の数（ステージ 30・100）を作業ツリーの `RULES` で行う。ほかの7種の予告・攻防・時間割・見た目・★1の並びが変更前と同じ。猪の親子の段取りの間の描画（親とうり坊・シールド・予告の札・親が 0 の子だけ・子が 0 の怒り）と攻防の演出中の描画が Error なく、`save`/`restore` が釣り合う。群れの範囲と親の絵の矩形を作業ツリーの表と実際の `groundY`・`fieldH` で数値で求め直し、重ならないこと（タスク9の数値と同じ）。焼き付けの一覧に `uribo`（24px・傷ついた絵）が入る。攻撃の音が突進・大突進だけで鳴り、子の攻撃では鳴らない（5章の要確認の点。発注者の答えで変わる）。2章「要件5」の起動とプレイが壊れないことの確かめ（猪の親子に DEBUG の口で切り替えて数ターン・倒すまで）。
        *   共通の作業。
*   [ ] タスク13: DEBUG タブ — 5つの行動とルールの値の文字・「子を 0 にする」「親を 0 にする」のボタン
    *   **対象ファイル** :
        *   `./js/view/debugText.js` : 更新（`DEBUG_TEXT` の2つ・`RULE_ITEM_TEXT` の項目名・`INTENT_CHOICE_TEXT` の5つ・型）
        *   `./js/view/debugLayout.js` : 更新（`enemyPartButtons` の段・型・説明）
        *   `./js/scenes/debugTab.js` : 更新（2つのボタン）
        *   `./js/scenes/boardDebug.js` : 更新（`zeroEnemyChild`・`zeroEnemyParent` の口）
    *   **作業内容** :
        *   2章「要件4」の DEBUG の文字・ボタンの段のとおりに書く。各関数・型・定数に JSDoc。
        *   確かめ: (1) 代用の `oz`（`Ui` の部品を記録する代わり）で DEBUG タブを組み立て、猪の親子の行動の選択肢が局面ごとに出て押すと予告が替わる、ルールの値に猪の親子の 11 個が日本語の項目名で出る（69 個）、2つのボタンが要件4のとおりに効く（親子でない敵では何も起きない）、その下の部品の位置が1段ぶん下がって重ならない。(2) 選択肢・項目名・ボタンの文字が枠に収まるかを見積もる（`Ui` の標準の文字の大きさで、縮みが目安 0.6 未満のものがあれば懸念事項に書く）。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク14: 敵の絵 — 3択の「次の敵」と結果の画面の猪の親子
    *   **対象ファイル** :
        *   `./js/view/enemyPortrait.js` : 更新（`BROOD_PORTRAIT`・群れの絵と絵の両方を持つ敵の描き方・先頭の責務）
    *   **作業内容** :
        *   2章「要件3」の敵の絵のとおりに書く。定数・関数に JSDoc。
        *   確かめ: (1) 代用の `ctx` で、ほかの7種の3択の次の敵の絵と結果の画面の絵（倒した敵の並び・負けた敵）の呼び出しの並びが変更前と同じ。(2) 猪の親子の3つの大きさの矩形（3択・結果の倒した敵・負けた敵）で、親の絵と3体のうり坊が矩形の中に描かれ、`save`/`restore` が釣り合う。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [ ] タスク15: 通しの確かめ（要件5）
    *   **対象ファイル** :
        *   （コードは変えない。本 RES だけ更新）
    *   **作業内容** :
        *   2章「要件5」の確かめを作業ツリーの最新の `js/` でまとめて行い、結果（数値・割合・体の数）を詳細作業内容に書く。不具合が見つかったら直さずに懸念事項に書き、どのタスクの直しかを示す。
        *   発注者に依頼するテストプレイ（REQ の【テストプレイで確かめること】1〜11）の一覧を詳細作業内容に写し、目視が要る所（重なり・大きさ・「怒り」の文字・敵の絵）を挙げる。
        *   共通の作業（RES の記入）。
*   [ ] タスク16: 開発資料の更新（固定タスク）
    *   **対象ファイル** :
        *   `./PROJECT_ARCHITECTURE.md` : 更新
    *   **作業内容** :
        *   2章『開発資料の更新予定』と各タスクで追記した予定を確かめ、`PROJECT_ARCHITECTURE.md` へ反映する（※実装AIによる開発資料の書き換えは原則禁止だが、この最終タスクのみ明示的な例外。後続タスクがなく、資料の変更で他タスクの前提が動く危険がないため）。
        *   2章「敵の種類を足すときに書き足す所」に、親と子を持つ敵（体の形・HP の分け方・当たる順・局面）を書き足す所が分かる形にする。
        *   書き方は今の資料に合わせ（識別子と画面の呼び名・TURN・ターン）、`_doc/`・`README.md` は変えない。

## 4. 詳細作業内容
※ 「3. タスクリスト」と同数の見出しを立て、タスク実行時にそれぞれ記入する。

### タスク1: ルール層の親子の仕組み（1）— HP の分け方・局面・敵の状態の親と子の HP（猪の設定はまだ今のまま）
*   **作業内容** :
    *   `js/rules/enemyParts.js` を新規作成（先頭の責務・型 `EnemyParts`・`ENEMY_SITUATIONS`・`partMaxHps`・`createEnemyParts`・`enemySituationOf`。何も import しない。`parts` が null/undefined は親子でない扱い）。
    *   `js/rules/config.js`: 型のみ（`EnemyBehaviorSpec.type` に `'brood'`・項目 `protectChance`/`protectRange`/`rushRange`/`rageChance`/`bigRushRange`・`attackRange` の説明・`EnemyBroodSpec`・`EnemySpec.motion`/`brood`）。猪の行は未変更。
    *   （監査の修正）`enemyParts.js` の先頭の責務をファイル全体の範囲に、`createEnemy` の `@returns` に `parts`、`EnemyAction.variant` の説明に守る・突進・怒りを溜める・大突進を書き足した。3ファイルの構文チェックを再実施して OK。
    *   `js/rules/combatants.js`: `Enemy.parts`、`EnemyAction.variant` に `protect`/`rush`/`rage`/`bigRush`、`createEnemy` が `createEnemyParts(spec, maxHp)` を入れる。
    *   確かめ: 変更した3ファイルの構文チェック OK。(1a)(1b) ステージ 1・2・6・11・16・30・100・500 で `partMaxHps`・`createEnemyParts`・`createEnemy`（写しでなく、一時スクリプトで `RULES.enemies.boar` に `brood` だけ足した spec を渡した。behavior は buildup のまま）が、子 = floor(最大 HP/2)・親 = 残り・合計 = 最大 HP で、見込み（1 = 22/22、30 = 84/83、100 = 268/268）と一致。`createEnemyParts` は brood なしで null。`enemySituationOf` の全場合（null・undefined・together・enraged・young・両方 0 = null）OK。(2) `RULES` のままの8種の `createEnemy` は `parts: null`（ステージ 30）。
    *   確かめ(2)の後半・(3)（監査の指摘で実施。一時スクリプトはスクラッチに置き、終わって消した。変更前は `git archive c4d8924 js` をスクラッチへ展開して使った）:
        *   (2) 前半: 8種（goblins・ogres・wolf・boar・skeletons・slime・giant・dragon）× ステージ 1・2・6・11・16・30・100・500 の 64 通りで、変更前と変更後の `createEnemy` の結果が `parts` を除いて完全に同じ（JSON 比較）、変更後の `parts` はすべて `null`。
        *   (2) 後半: 変更前と変更後の `Game` を同じ乱数の状態・同じ日付の種から作り、同じ操作（置く・捨てる・手札に取る・手札から置く・放つ・攻防・次のフェーズ・3択の開始・3択の選択（強化か修復））を両方へ同時に行って、毎手の戻り値と状態全体（乱数の状態・予告・3択の候補を含む。敵の `parts` だけ除く）を JSON で比べた。放つ頻度を変えた3通り（放つ 0.7・0.9・まったく放たない）× 各30ゲーム = 90 ゲーム、47,377 手、敵を倒した回数 254、3択の選択 254、全ゲームが負けまで（90 回）、最大ステージ 10。すべて一致。予告の種類は attack（爪・ブレス・大攻撃・ふつう）・windup（吸い込む・溜める・ふつう）・guard（ふつう・大防御）を通った。
        *   (3) 代用の `oz`（`Engine`・`Scene`・`Assets`・`Storage`・`CanvasCache`・`Ui`・`Sound` の最小の代わり）と、`oz` と `assets/` だけ解く `module.register` のローダー、`document`・`location` の代わりで、`js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク2: ルール層の親子の仕組み（2）— 行動の決まり `brood` と、予告に局面を渡すこと
*   **作業内容** :
    *   `js/rules/enemyBehaviors.js`: 行動を作る関数 `protectAction`・`rushAction`・`rageAction`・`bigRushAction`（export。JSDoc に乱数の回数）、局面 → 決め方の表 `BROOD_PLANS`（together・enraged・young。各行の JSDoc に乱数の回数）、`BEHAVIORS.brood`（初期状態 `{ lastVariant: null }`・`isState`・`planNext`（局面が表にないときは Error）・`countdown` は常に null・`isOpening` は `kind !== 'guard'`）を足した。`planBehaviorAction(behavior, state, random, unit = 1, situation = null)` に局面の引数を足し、`planNext` の型にも局面を足した（ほかの決まりは読まない）。`isBehaviorState` の説明に brood を足した。先頭の責務に親子の敵の局面ごとの行動を足した（3行以内）。
    *   `js/rules/Game.js`: `enemySituationOf` の import と、`planIntent` で `enemySituationOf(this.enemy.parts)` を渡す1行だけ足した。先頭の責務に「親子の敵は親と子の局面を予告に渡す」を足した（3行以内）。
    *   確かめ（一時スクリプトと変更前 `git archive c4d8924 js` の展開・猪の行を要件1の親子の行に替えた `js/` の写しはスクラッチに置き、終わって消した）。変更した2ファイルの構文チェック OK。
        *   (1) 写しの設定（猪の親子）で `planBehaviorAction` を局面ごとに 20000 回（状態をつないで）呼んだ: `together` は守る 29.8%（見込み 30%）・毎回乱数 2 回・守るの防御 4〜8・子の攻撃 1〜2。`enraged` は、溜めの抽選をしたターンのうち溜める 29.7%（見込み 30%）、怒りのターン全体では 18.6%（見込み ≈ 18.75%）。溜めの次は 3723 回すべて大突進、大突進の次は 3723 回すべて突進。乱数の回数は、溜める 1・抽選で外れた突進 2・大突進 1・大突進の次の突進 1 で、外れ 0 件。突進 4〜6・大突進 13〜16。`young` は子の攻撃（1〜2）だけで乱数 1 回。次の状態は `lastVariant = action.variant ?? null`。`isState`（null・protect・rush・rage・bigRush は true、claw・欠け・null・配列は false）・`countdown`（null）・`isOpening`（guard だけ false）。局面 `null`・`undefined`・未知の文字列で Error。
        *   `createIntent` を通した予告（写しの `Game`。`switchEnemy(game, 'boar')` で出し、`parts` を手で書き換えて `planIntent`。DEBUG の項目のモジュールは読み込まない）: ステージ 1 は加算 0 で、`together` が攻撃 1〜2・守る（`defense` 4〜8・量 0）、`enraged` が突進 4〜6・溜める（量 0・防御 0）、`young` が攻撃 1〜2。ステージ 30（加算: 攻撃 +29・防御 +12）は、`together` の攻撃 30〜31・守る `defense` 16〜20、`enraged` の突進 33〜35、`young` の攻撃 30〜31。守る以外の防御はすべて 0。各局面で `enemySituationOf(game.enemy.parts)` が書き換えた局面と一致。
        *   (2) `RULES` のまま、変更前と作業ツリーで、8種（今の猪を含む）の `planBehaviorAction` を、1体のポイント 1・2 × 局面の引数（なし・null・together・enraged・young）で各 2000 手、同じ乱数で並べた（計 160,000 手）: 結果（行動・状態）・`isOpeningAction`・`behaviorCountdown`・`isBehaviorState`・乱数の呼び出しの値の並び（順と回数）がすべて一致。8種の設定の中身も同じ。変更前と並べたランダムなゲーム（放つ頻度 0.7・0.9・まったく放たない × 各 30 ゲーム = 90 ゲーム、74,815 手、敵を倒した 428・3択の選択 428、全 90 ゲームが負けまで・最大ステージ 10）で、毎手の戻り値・状態全体（乱数の状態・予告・3択の候補を含む。敵の `parts` だけ除く）・例外の有無が一致。予告は attack（ふつう・爪・ブレス・大攻撃）・windup（ふつう・吸い込む・溜める）・guard（ふつう・大防御）を通った。
        *   (3) 代用の `oz`（`Scene` などの最小の代わり。`Storage`・`Assets`・`Engine` は呼び出しを受け流す代わり）と、`oz`・`assets/` だけ解く `module.register` のローダー、`document`・`location` の代わりで、`js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク3: ルール層の親子の仕組み（3）— 剣の当たり方の分け方と、攻防で親と子の HP を渡して受け取ること
*   **作業内容** :
    *   （未記入）

### タスク4: ルール層の親子の仕組み（4）— 並びの組の鍵
*   **作業内容** :
    *   （未記入）

### タスク5: DEBUG のルール層 — 指定できる行動・敵の HP の付け方・ルールの値の項目（UI はまだ）
*   **作業内容** :
    *   （未記入）

### タスク6: 中断データ（版 7・親と子の HP）
*   **作業内容** :
    *   （未記入）

### タスク7: 演出の「絵と群れを両方持つ体」の仕組み（猪の見せ方はまだ今のまま）
*   **作業内容** :
    *   （未記入）

### タスク8: うり坊のスプライト — スプライトのコピーとスプライトの表
*   **作業内容** :
    *   （未記入）

### タスク9: 群れの範囲の高さ（`area.h`）
*   **作業内容** :
    *   （未記入）

### タスク10: 群れと絵の描き分け — 群れと絵の HP の読み方・段取りの間の敵・待機の群れの数
*   **作業内容** :
    *   （未記入）

### タスク11: 予告の札 — 突進・怒りを溜める・大突進の札と「怒り」の文字
*   **作業内容** :
    *   （未記入）

### タスク12: 猪の設定を猪の親子に切り替える（設定と見せる表の猪の行を同時に）
*   **作業内容** :
    *   （未記入）

### タスク13: DEBUG タブ — 5つの行動とルールの値の文字・「子を 0 にする」「親を 0 にする」のボタン
*   **作業内容** :
    *   （未記入）

### タスク14: 敵の絵 — 3択の「次の敵」と結果の画面の猪の親子
*   **作業内容** :
    *   （未記入）

### タスク15: 通しの確かめ（要件5）
*   **作業内容** :
    *   （未記入）

### タスク16: 開発資料の更新（固定タスク）
*   **作業内容** :
    *   （未記入）

## 5. 懸念事項・要確認ポイント
* （計画時）並ぶ場所は、親の絵の奥（上）にうり坊の群れ、親の左に攻撃のうり坊の陣地とした（要件3）。ふだんのターンに剣の兵がうり坊へ向かうとき、親の絵の後ろを通って見える。重なり・見え方は試遊で確かめ、`HORDE_PLACES.boar`・`ENEMY_FIGURES.boar` の値で直す。
* （計画時）うり坊の仮のスプライトは猪のコピーで横長（幅 : 高さ ≈ 1.36 : 1）。群れの体は長い方の辺を 24px にして体の中心を足元から 12px 上に置くので、足元から約 3px 浮いて見える。発注者がうり坊を描き直すとき、`SPRITE_TABLE` の `uribo` の行を合わせる（必要なら `HORDE_PLACES.boar` の `size` も見直す）。
* （計画時）ステージ 100 ほどでは、うり坊 268 体＋攻撃のうり坊 約 119 体＋自軍の兵で、目安の 500 体に近いか超える見込み（ゴブリンの軍勢の同じステージと同じくらい）。タスク12・タスク15で数えて書く。
* （計画時）DEBUG の「子どもたちを守る」は3つ並びの選択肢の1つ分の幅に入るので、文字が縮む見込み。タスク13で見積もる。
* （計画時・**発注者に確かめてもらう点**）子の攻撃（子がいる間のふだんのターンと、子だけのターンのうり坊の攻撃）では、攻撃の始まりの音を鳴らさない計画にした（`ENEMY_ATTACK_SE.boar` を `{ rush: 'giantAttack', bigRush: 'giantAttack' }` にして `default` を外す。ゴブリンの攻撃と同じ）。今の猪はどの攻撃でも `giantAttack` が鳴る（`soundCues.js` の `ENEMY_ATTACK_SE.boar` = `{ default: 'giantAttack' }`）。REQ は「BGM・当たりの音は今の猪と同じで、新しい音は作らない」としか書いていないため、子の攻撃でも今の猪と同じく `giantAttack` を鳴らすか、鳴らさないかを発注者に確かめてもらう。鳴らすなら、タスク12で `default: 'giantAttack'` を足すだけで済む（ほかは変わらない）。
* （計画時・持ち越し）タスク7で体の見せ方に `'brood'` が増えるが、`js/anim/impactLog.js` の `recordStepImpacts` の JSDoc（引数 `bodyStyle` の説明「敵の体の見せ方（'horde'・'figure'）」）は古いままになる。このファイルは本 REQ の変更対象ではないのでコードは変えない（引数は今は使わない＝動きは変わらない）。次に `impactLog.js` を触る REQ で `'brood'` を足す。
