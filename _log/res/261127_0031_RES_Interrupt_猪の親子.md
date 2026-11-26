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
*   2章「攻防の出来事の並び」: （タスク3）計算の入力に任意の `enemyParts`（親子の敵の攻防の前の親と子の HP と当たる順）、結果に `enemyParts`（攻防の後の親と子の HP。親子でない敵は null）。親子の敵で親と子の合計が敵の HP と違うとき・敵の回復があるときは Error。`Game.resolveBattle` は設定の `brood.hitOrder` から `battlePartsOf` で入力を作り、結果を `enemy.parts` に入れる（`BattleResult` には足さない）。
*   4章の表: 新規の行 `enemyParts.js`・`bodyHp.js`。行の更新 `config.js`・`enemyBehaviors.js`（`brood`・局面の引数・行動を作る関数）・`combatants.js`・`battle.js`・`Game.js`・`enemyTypes.js`（組の鍵）・`debugIntents.js`・`debugControls.js`・`debugRules.js`・`debugRuleItems.js`（69 個）・`suspendData.js`（版 7）・`enemyShows.js`・`enemyBody.js`・`battleSteps.js`・`battleTimeline.js`・`enemyIdle.js`・`spriteView.js`（`uribo`）・`hordePlaces.js`（`area.h`）・`hordeSkins.js`・`enemyFigures.js`・`enemyView.js`・`battleText.js`・`intentView.js`・`enemyPortrait.js`・`debugText.js`・`debugLayout.js`・`debugTab.js`・`boardDebug.js`・`BoardScene.js`・`soundCues.js`。
*   （タスク12）見せる表の猪の行（`ENEMY_SHOWS.boar`・`ENEMY_FIGURES.boar`・`HORDE_SKINS.boar`・`HORDE_PLACES.boar`・`ENEMY_ATTACK_SE.boar`）を切り替えたことを、4章の表（`soundCues.js`・`hordeSkins.js`・`hordePlaces.js`・`enemyFigures.js`・`enemyShows.js`・`config.js`）の更新の行にそのまま使える形で反映する。追加の更新はない（上の予定のとおり）。

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
*   [x] タスク3: ルール層の親子の仕組み（3）— 剣の当たり方の分け方と、攻防で親と子の HP を渡して受け取ること
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 更新（`battlePartsOf`・`splitPartDamage`・型 `BattleParts`・`PartDamage`）
        *   `./js/rules/battle.js` : 更新（入力 `enemyParts`・出来事の `parts`・結果 `BattleCalc.enemyParts`・先頭の責務）
        *   `./js/rules/Game.js` : 更新（`resolveBattle` で `battlePartsOf` を渡し、`calc.enemyParts` を `this.enemy.parts` に入れる。`BattleResult` には足さない）
    *   **作業内容** :
        *   2章「要件2」の剣の当たり方のとおりに書く。`Game.js` には import と呼ぶ行だけを足す。各関数・型に JSDoc。`battle.js` の先頭の責務に親子を足す（3行以内）。
        *   確かめ: (1) スクラッチの写しの設定（猪の親子）で、`splitPartDamage` と `computeBattle` の剣の当たり方の場合分け（要件5）が要件2のとおりで、`computeBattle` が合計の食い違い・親子の回復で Error。`Game` を通した攻防（猪の親子は `switchEnemy(game, 'boar')` で出す。写しでは DEBUG の項目のモジュールを読み込まない。2章「要件5」の先回りの依存）で、倒した数（`enemyDefeat`・結果の記録・`defeated`）とスコアが1回だけ・親だけ・子だけが 0 では数えない・攻防で局面が変わると次のターンの予告から新しい局面の行動になる・ゲームを敵が替わるまで・負けるまで Error なく進められる。(2) `RULES` のままで、変更前と並べたランダムなゲーム（タスク1と同じ3種）で毎手の結果・状態が一致し、ほかの7種と今の猪の攻防の出来事が同じ（`computeBattle` の結果の新しい項目 `enemyParts`・敵の `parts` は比べない）。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク4: ルール層の親子の仕組み（4）— 並びの組の鍵
    *   **対象ファイル** :
        *   `./js/rules/enemyTypes.js` : 更新（`motionKeyOf`・`enemyMotionsOfStar`）
    *   **作業内容** :
        *   2章「要件1」の並び（`enemyTypes.js`）のとおりに書く。関数に JSDoc。
        *   確かめ: (1) ★1の並び: 10 年分の日付の種 × ステージ 1〜500 で、変更前・`RULES` の変更後・スクラッチの写しの設定（猪の親子）の3つの敵の種類が同じ。(2) `RULES` のままで、各★の `enemyMotionsOfStar` の組と組の中の並びが変更前と同じ。写しの設定の★1が「`steady`・`buildup`・`either`」の3組で、`buildup` が狼・猪の親子の順。(3) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク5: DEBUG のルール層 — 指定できる行動・敵の HP の付け方・ルールの値の項目（UI はまだ）
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
*   [x] タスク6: 中断データ（版 7・親と子の HP）
    *   **対象ファイル** :
        *   `./js/rules/enemyParts.js` : 更新（`isEnemyPartsShape`）
        *   `./js/rules/suspendData.js` : 更新（`FIELDS.enemy` の保存・確かめ・戻しに `parts`・`SUSPEND_VERSION` 7・`SuspendData` の型・版の説明）
    *   **作業内容** :
        *   `enemyParts.js` に `isEnemyPartsShape(spec, parts, hp)` を足す（形: 設定が `brood` を持つ敵は `parent`・`child` が 0 以上の整数のプレーンなオブジェクトで合計が `hp`、持たない敵は `null`。例外を投げない。JSDoc）。
        *   REQ 要件2「中断データ」と2章「区切りの順」2のとおり、敵の項目に `parts` を足す（保存は写し、確かめは `isEnemyPartsShape(enemySpecOf(config, typeId), value.parts, value.hp)`、戻しは写し）。`SUSPEND_VERSION` を 7 にし、版の説明に「7: 敵の親と子の HP `parts` を足したとき 6 から上げた」を足す。
        *   確かめ: (1) `isEnemyPartsShape` を単体で、親子の敵・親子でない敵それぞれの正しい形と形違い（合計が HP と違う・親子の敵で `null`・親子でない敵で値あり・負・小数・プレーンでないオブジェクト・項目の欠け）で呼び、結果が要件のとおりで例外を投げない。(2) `RULES` のまま、ターンの始まりと3択の段階の保存・復元で続けた結果が変更前と同じ（敵の `parts` は `null`）。版 6 のデータが捨てられる。(3) スクラッチの写しの設定（猪の親子）で、3つの局面それぞれのターンの始まり（溜めの次の大突進のターンを含む）と3択の段階で保存・復元し、同じ操作で同じ結果（乱数の状態・親と子の HP・決まりの状態まで）。形違いの `parts`（要件5）が捨てられ、例外を投げない。(4) 代用の `oz` のローダーで `js/main.js` から辿るモジュールがすべて読み込める。
        *   共通の作業。
*   [x] タスク7: 演出の「絵と群れを両方持つ体」の仕組み（猪の見せ方はまだ今のまま）
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
*   [x] タスク8: うり坊のスプライト — スプライトのコピーとスプライトの表
    *   **対象ファイル** :
        *   `./assets/sprites/unit_uribo.js` : 新規（`unit_boar.js` のコピー。先頭の説明の1行目だけ直す）
        *   `./js/view/spriteView.js` : 更新（import・`SPRITE_IDS.uribo`・型・`SPRITE_TABLE` の行）
    *   **作業内容** :
        *   2章「要件3」のスプライトのとおりに書く（`unit_uribo.js` はシェルのコピー（`cp`）で作り、説明の1行目だけ直す。ほかの行・`source`・要素は変えない）。表の行・識別子に JSDoc。
        *   確かめ: (1) `unit_uribo.js` と `unit_boar.js` の違いが先頭の説明の1行目だけ（`diff`）。`unit_uribo.js` が読み込め、`spriteView.js` の描く関数で `SPRITE_IDS.uribo` を描け、`save`/`restore` が釣り合う。`SPRITE_TABLE` の `uribo` の行が猪の行と同じ値。(2) `RULES` のまま、ほかのスプライトの描く呼び出しの並びが変更前と同じ。焼き付けの一覧に `uribo` が入らない（`HORDE_SKINS` にまだないので）ことを含めて一覧が変更前と同じ。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク9: 群れの範囲の高さ（`area.h`）
    *   **対象ファイル** :
        *   `./js/view/hordePlaces.js` : 更新（`area.h`（任意）の型と `createHordePlaces`。猪の行はまだ足さない）
    *   **作業内容** :
        *   2章「要件3」の猪の行の見せる表のうち `createHordePlaces` の `area.h` の扱い（群れの範囲の y は足元の範囲の上端のまま、高さを `min(area.h, 足元の範囲の高さ − 削る量)` にする。攻撃・守りの陣地は今のまま）のとおりに書く。型・関数の JSDoc。
        *   確かめ: (1) `RULES` と今の表のまま、実際の戦闘の段の配置の `groundY`・`fieldH`・標準の値で、今の表のすべての行と標準の `createHordePlaces` の結果が変更前と同じ。(2) スクラッチの写しの表（`HORDE_PLACES` に要件3の猪の行を足したもの）と、写しの `ENEMY_FIGURES` の猪の行（要件3）で、実際の `groundY`・`fieldH` から群れの範囲（`area` の x・y・w・h）・攻撃と守りの陣地・群れの体の上端（足元 − `size`）と、親の絵の矩形（x・y・幅・高さ）を数値で求めて詳細作業内容に書く。群れの足元の範囲が見込み（x 565〜685・y 145〜225。体は y 121 から）のとおりで、群れの足元の範囲の下端が親の矩形の上端（見込み y 235）より上にあり重ならないこと。見込みと違うか重なるときは、どの値がどれだけ違うかと直す案を懸念事項に書く（猪の行の値はタスク12で入れるので、このタスクでは表に足さない）。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク10: 群れと絵の描き分け — 群れと絵の HP の読み方・段取りの間の敵・待機の群れの数
    *   **対象ファイル** :
        *   `./js/view/bodyHp.js` : 新規
        *   `./js/view/enemyView.js` : 更新（段取りの間の群れと絵・型・先頭の責務）
        *   `./js/scenes/BoardScene.js` : 更新（待機の群れの数を `hordeHpOf` から）
    *   **作業内容** :
        *   2章「要件3」の見た目の仕組みのうち `bodyHp.js`・`enemyView.js`・`BoardScene.update` のとおりに書く。各関数・型に JSDoc。
        *   確かめ: (1) `hordeHpOf`・`figureHpOf` を、`parts` が `null`・`undefined`・値ありの敵で呼び、要件3のとおり。(2) `RULES` のまま、8種の敵の段取りの間（入りの途中・待機の伸び縮み・シールドの数・スライムの縮みを含む）と攻防の演出中の描画を代用の `ctx` の呼び出しの並びで記録し、変更前と同じ。`BoardScene.update` の待機の伸び縮みの値が変更前と同じ。(3) スクラッチの写し（猪の行をタスク12の行にした設定と見せる表）で、段取りの間に群れと絵を両方描け（親が 0 の子だけ・子が 0 の怒りを含む）、`save`/`restore` が釣り合う（主な確かめはタスク12）。(4) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク11: 予告の札 — 突進・怒りを溜める・大突進の札と「怒り」の文字
    *   **対象ファイル** :
        *   `./js/view/battleText.js` : 更新（`VARIANT_LABELS` の3行・`BADGE_LABELS`・`intentBadgeLabel`）
        *   `./js/view/intentView.js` : 更新（`INTENT_ICONS` の3行・`EMPHASIZED_VARIANTS`・「怒り」の文字・定数）
    *   **作業内容** :
        *   2章「要件3」の見た目の仕組みのうち予告の札・「怒り」の文字のとおりに書く。各関数・定数・表の行に JSDoc。
        *   確かめ: (1) `RULES` のまま、予告の札（代用の `ctx` の呼び出しの並び）と始まりの文字が今の行動すべてで変更前と同じ。(2) 突進・怒りを溜める・大突進の予告（手で作ったもの）で、札の絵・赤い札・「怒り」の文字（位置・フォント・色）と始まりの文字が要件3のとおりで、`save`/`restore` が釣り合う。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク12: 猪の設定を猪の親子に切り替える（設定と見せる表の猪の行を同時に）
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
*   [x] タスク13: DEBUG タブ — 5つの行動とルールの値の文字・「子を 0 にする」「親を 0 にする」のボタン
    *   **対象ファイル** :
        *   `./js/view/debugText.js` : 更新（`DEBUG_TEXT` の2つ・`RULE_ITEM_TEXT` の項目名・`INTENT_CHOICE_TEXT` の5つ・型）
        *   `./js/view/debugLayout.js` : 更新（`enemyPartButtons` の段・型・説明）
        *   `./js/scenes/debugTab.js` : 更新（2つのボタン）
        *   `./js/scenes/boardDebug.js` : 更新（`zeroEnemyChild`・`zeroEnemyParent` の口）
    *   **作業内容** :
        *   2章「要件4」の DEBUG の文字・ボタンの段のとおりに書く。各関数・型・定数に JSDoc。
        *   確かめ: (1) 代用の `oz`（`Ui` の部品を記録する代わり）で DEBUG タブを組み立て、猪の親子の行動の選択肢が局面ごとに出て押すと予告が替わる、ルールの値に猪の親子の 11 個が日本語の項目名で出る（69 個）、2つのボタンが要件4のとおりに効く（親子でない敵では何も起きない）、その下の部品の位置が1段ぶん下がって重ならない。(2) 選択肢・項目名・ボタンの文字が枠に収まるかを見積もる（`Ui` の標準の文字の大きさで、縮みが目安 0.6 未満のものがあれば懸念事項に書く）。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク14: 敵の絵 — 3択の「次の敵」と結果の画面の猪の親子
    *   **対象ファイル** :
        *   `./js/view/enemyPortrait.js` : 更新（`BROOD_PORTRAIT`・群れの絵と絵の両方を持つ敵の描き方・先頭の責務）
    *   **作業内容** :
        *   2章「要件3」の敵の絵のとおりに書く。定数・関数に JSDoc。
        *   確かめ: (1) 代用の `ctx` で、ほかの7種の3択の次の敵の絵と結果の画面の絵（倒した敵の並び・負けた敵）の呼び出しの並びが変更前と同じ。(2) 猪の親子の3つの大きさの矩形（3択・結果の倒した敵・負けた敵）で、親の絵と3体のうり坊が矩形の中に描かれ、`save`/`restore` が釣り合う。(3) 2章「要件5」の起動とプレイが壊れないことの確かめ。
        *   共通の作業。
*   [x] タスク15: 通しの確かめ（要件5）
    *   **対象ファイル** :
        *   （コードは変えない。本 RES だけ更新）
    *   **作業内容** :
        *   2章「要件5」の確かめを作業ツリーの最新の `js/` でまとめて行い、結果（数値・割合・体の数）を詳細作業内容に書く。不具合が見つかったら直さずに懸念事項に書き、どのタスクの直しかを示す。
        *   発注者に依頼するテストプレイ（REQ の【テストプレイで確かめること】1〜11）の一覧を詳細作業内容に写し、目視が要る所（重なり・大きさ・「怒り」の文字・敵の絵）を挙げる。
        *   共通の作業（RES の記入）。
*   [x] タスク16: 開発資料の更新（固定タスク）
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
    *   `js/rules/enemyParts.js`: 型 `BattleParts`（`hp`・`order`）・`PartDamage`（`part`・`amount`）、`battlePartsOf(spec, parts, kind)`（`spec.brood` がないか `parts` が null/undefined なら null。`hitOrder[kind]` がなければ `default`。順の配列は写し）、`splitPartDamage(battleParts, dealt)`（当たる順に `min(残り, HP)` を当て、量が 0 より大きいものだけ `damages` に入れ、攻防の後の `after` を返す。入力は書き換えない）を足した。先頭の責務は変更なし（すでに剣の当たり方を含めて3行以内）。
    *   `js/rules/battle.js`: `enemyParts` を import せず `splitPartDamage` だけ import。入力 `enemyParts`（任意。省く・null は今と同じ）、出来事 `enemyDamage` の `parts`（親子の敵のときだけ。親子でない敵の出来事には `parts` の項目自体がない）、結果 `BattleCalc.enemyParts`（親子でない敵は null、城が落ちた攻防は入力のまま）。親子の敵で合計が `enemyHp` と違う・`enemyHeal > 0` は Error。相殺・`dealt`・`enemyDefeat` の式は変えていない。先頭の責務に親子の1行を足した（2行）。
    *   `js/rules/Game.js`: import に `battlePartsOf` を足し、`resolveBattle` の `computeBattle` の入力に `enemyParts: battlePartsOf(spec, this.enemy.parts, enemyAction.kind)` を足し、`this.enemy.parts = calc.enemyParts` を足した。`BattleResult` には足していない。先頭の責務の括弧に「親と子の HP を攻防に渡す」を足した（3行のまま）。
    *   確かめ（一時スクリプトと、変更前 `git archive c4d8924 js` の展開・猪の行を要件1の猪の親子の行に替えた `js/` の写しはスクラッチに置き、終わって消した）。変更した3ファイルの構文チェック OK。
        *   (1) 写しの設定（猪の親子。`behavior.type: 'brood'`。タスク2の後なので `createEnemy` は通る。DEBUG の項目のモジュールは読み込まない。`motion` は付けたが並びには効かないので `spawnEnemy('boar')`＋`planIntent` で出した。`switchEnemy` は `debugIntents.js` を import するので使わず、同じ処理を直接呼んだ）。`splitPartDamage`・`computeBattle` の場合分け: ふだんのターン（剣 0・子より少ない・子と同じ・子より多い（余りが親）・合計以上（倒す）・合計を超える）、守るターン（防御以下・防御と親の間・親を越えて子へ・倒す。防御で相殺してから親 → 子）、怒り（突進・溜め・大突進。剣が親より多くても親の HP で頭打ち）、子だけ（倒すときを含む）、城が落ちる攻防（親と子・HP は入力のまま）がすべて要件2のとおり。剣 0〜50 × 3種類の予告 × 5通りの親と子（22/22・22/0・0/22・23/22・1/1）で、`parts` の量の合計 = `enemyDamage` の量 = `min(剣, 合計 HP)`、攻防の後の親 + 子 = `enemyHp`、`enemyDefeated` は `enemyHp === 0` のときだけ。合計の食い違い・親子の回復は Error（2件とも投げる）。`enemyParts` を省く・null は結果が `enemyParts: null` になるだけで、出来事は今と同じ（`parts` の項目なし）。
        *   `Game` を通した攻防（上と同じ写し）: 上の場合分けを `resolveBattle` で行い、`enemy.parts`・`enemy.hp`（= 親 + 子）・`enemyDefeat` の数・`stats.enemiesDefeated`・結果の `defeat` が、親と子の両方が 0 になったときだけ 1 回で、親だけ・子だけが 0 では 0 回。`BattleResult` に `parts` はない。城が落ちた攻防は `enemy.parts`・`enemy.hp` が変わらず倒した数 0。攻防で together → enraged（子を倒した）にすると、次のフェーズの予告が突進か溜める。守るターンで親を倒して young にすると次の予告が子の攻撃。`parts` を手で書き換えた各局面で 300 回ずつ予告を決めると、together = 子の攻撃・守る、enraged = 突進・溜める、young = 子の攻撃だけ。
        *   ゲームを通す: どのステージの敵も猪の親子にして（倒すたびに `spawnEnemy('boar')`）、放つ頻度 0.9・0.7・0.5 × 各 40 ゲーム = 120 ゲーム、186,512 手、すべて負けまで（120 回。最大ステージ 16、敵を倒した 1122 回）、Error 0。毎手の `hp === parent + child`、攻防ごとの「`enemyDefeat` の有無 = 倒した数の増え方 = `hp` が 0」・「`hp` が 0 のとき親も子も 0」、段取りの間の予告が今の局面の行動（together = 子の攻撃・守る、enraged = 突進・溜める・大突進、young = 子の攻撃）であること、がすべて成り立った（局面を通った回数: together 122750・enraged 61193・young 325）。
        *   (2) `RULES` のまま（今の猪）、変更前 `c4d8924` と作業ツリーの `Game` を同じ乱数・同じ日付の種から作り、同じ操作を同時に行って、毎手の戻り値（攻防の `BattleResult`・出来事を含む）と状態全体（乱数の状態・予告・3択の候補を含む。敵の `parts` だけ除く）を JSON で比べた。放つ頻度 0.7・0.9・0 × 各 30 ゲーム = 90 ゲーム、143,804 手、敵を倒した 340・3択の選択 340、負け 68。8種すべて（猪 24,714 回の攻防を含む）で一致、作業ツリー側の敵の `parts` は常に null。予告は attack（ふつう・爪・ブレス・大攻撃）・windup（ふつう・吸い込む・溜める）・guard（ふつう・大防御）を通った。
        *   (3) 代用の `oz`（受け流す最小の代わり）と、`oz`・`assets/` だけ解く `module.register` のローダー、`document`・`location` の代わりで、`js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク4: ルール層の親子の仕組み（4）— 並びの組の鍵
*   **作業内容** :
    *   `js/rules/enemyTypes.js`: `motionKeyOf(spec)`（`spec.motion ?? spec.behavior.type`。export。JSDoc 付き）を足し、`enemyMotionsOfStar` の組の鍵を `motionKeyOf` にした（JSDoc の説明・型も合わせた）。先頭の責務は変更なし（1行）。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js` の展開・猪の行を要件1の猪の親子の行（`motion: 'buildup'`・`brood`・`behavior.type: 'brood'`）に替えた `js/` の写しはスクラッチに置き、終わって消した）。変更した1ファイルの構文チェック OK。
        *   (1) ★1の並び: 日付の種 3650 通り（20200101 から 1 日ずつ。10 年分）× ステージ 1〜500 = 1,825,000 通りで、変更前・`RULES` の変更後・写しの設定（猪の親子）の3つの `enemyTypeIdOfStage` の結果が全件同じ（食い違い 0）。
        *   (2) `RULES` のまま、★1〜8 の `enemyMotionsOfStar` の組と組の中の並びが変更前と同じ（食い違い 0。★1は `[goblins, ogres]・[wolf, boar]・[skeletons, slime]`）。写しの設定の★1も `steady`・`buildup`・`either` の3組で、`buildup` が狼・猪の親子（`wolf`・`boar`）の順（各敵の鍵: goblins/ogres = steady、wolf/boar = buildup、skeletons/slime = either、giant = cycle、dragon = inhale）。
        *   (3) 代用の `oz`（受け流す最小の代わり）と、`oz`・`assets/` だけ解く `module.register` のローダー、`document`・`location` の代わりで、`js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク5: DEBUG のルール層 — 指定できる行動・敵の HP の付け方・ルールの値の項目（UI はまだ）
*   **作業内容** :
    *   `js/rules/enemyParts.js`: `fitPartsToMax(brood, maxHp, parts)`（親と子をそれぞれ新しい最大で頭打ち・合計が 0 になるときは `{ parent: 1, child: 0 }`）・`partsWithTotal(brood, maxHp, parts, hp)`（満タン＝`hp ≥ maxHp` は親子とも最大、それ以外は生きている部分を親 → 子の順、足りなければ倒れている部分を親 → 子の順に、それぞれの最大まで満たす）・`zeroPart(parts, part)`（指定側を 0 に。もう片方が 0 なら 1 を残す）を足した（どれも入力は書き換えない。JSDoc 付き。先頭の責務は変更なし）。
    *   `js/rules/debugIntents.js`: `INTENT_TABLE.brood`（`ids(behavior, situation)`: together = `youngAttack`・`protect`、enraged = `rush`・`rage`・`bigRush`、young = `youngAttack`、null = 空。`plan`: `steadyAttackAction`・`protectAction`・`rushAction`・`rageAction`・`bigRushAction`、状態 `{ lastVariant: action.variant ?? null }`。`chosen`: guard → `protect`、中の種類が rush/rage/bigRush ならそれ、ほかは `youngAttack`）。`intentChoiceIds(behavior, situation = null)` と、表の `ids` の型に局面を足した（ほかの決まりは局面を読まない）。
    *   `js/rules/debugControls.js`: `intentChoiceIdsOf` が `enemySituationOf(game.enemy.parts)` を渡す。`intentChoiceSlotCount` が敵ごとに `[null, ...ENEMY_SITUATIONS]` の各局面の数の最大を取る。`setEnemyHp` は、設定が `brood` を持ち `enemy.parts` がある敵は `partsWithTotal` で親と子を決める（`setHp` の条件はそのまま。予告は変えない）。`zeroEnemyChild`・`zeroEnemyParent` を足した（共通の非公開関数 `zeroEnemyPart`。段取り中・`parts` あり・その部分 > 0 のときだけ。`zeroPart` で求め、変わらないときは false、`hp` は合計）。`zeroEnemyParent` は、今の予告の `currentIntentChoice` が今の局面の `intentChoiceIdsOf` に含まれないときだけ `game.planIntent()` で決め直す。先頭の責務を更新（2行のまま）。
    *   `js/rules/debugRules.js`: `applyNow` の `enemyMaxHp` で、`config.enemies[group].brood` と `enemy.parts` があるときは `fitPartsToMax` で親と子を合わせ `hp` を合計にする（なければ今のまま）。
    *   `js/rules/debugRuleItems.js`: `BEHAVIOR_ITEMS.brood`（`${typeId}.attack`（名前 `youngAttackMin`/`Max`）・`protectChance`・`protect`（`protectMin`/`Max`・種類 `defense`）・`rush`（`rushMin`/`Max`）・`rageChance`・`bigRush`（`bigRushMin`/`Max`）。時期はどれも `nextIntent`）。最大 HP の項目は設定が `brood` を持つ敵だけ名前を `maxHpTotal` にした。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js` の展開・猪の行を要件1の猪の親子の行に替えた `js/` の写し・代用の `oz` はスクラッチに置き、終わって消した）。変更した5ファイルの構文チェック OK。
        *   (1) `fitPartsToMax`・`partsWithTotal`・`zeroPart` を単体で呼んだ（満タン・1・親が 0・子が 0・奇数の最大・合計が 0 になるとき親に 1・もう片方が 0 なら 1 を残す・入力を書き換えない。最大 HP 1・2・3・44・45・167・536 のすべての HP × 3通りの親と子で `parent + child === hp` かつ各最大以下）。すべて要件のとおり。
        *   (2) `RULES` のまま、変更前と作業ツリーで: `RULE_ITEMS` は 65 個で、識別子・組・種類・名前・時期・組の相手・側・刻み・`RULES` の値がすべて一致。`ruleGroups` 一致。8種の `intentChoiceIds`（局面の引数なし・null・together・enraged・young のどれを渡しても変更前と同じ）・`planChosenIntent`（各識別子 × 20 通りの乱数で、結果と乱数の呼び出しの値の並びが一致）・`chosenIntentOf` 一致。`intentChoiceSlotCount` は 3（変更前と同じ）。デバッグのゲーム 60 個（種ごとに違う）で、敵の切り替え・`setEnemyHp`（1〜80・満タン）・`setRuleValue`（全項目・最大 HP の項目）・`resetRuleValues`・`chooseEnemyIntent`・`moveStage` をランダムに 120 手ずつ（計 7200 手）、変更前と同時に行い、毎手の戻り値・敵の状態（`parts` を除く）・戦闘のターンの番号・ステージの番号・乱数の状態・`currentIntentChoice` が一致（敵の `parts` は常に null）。
        *   (3) 写しの設定（猪の親子）で: `RULE_ITEMS` は 69 個（猪の親子の 11 個: `boar.maxHp`（名前 `maxHpTotal`・`now`・刻み 1）・`boar.attack.min/max`（`youngAttackMin/Max`）・`boar.protectChance`・`boar.protect.min/max`・`boar.rush.min/max`・`boar.rageChance`・`boar.bigRush.min/max`。種類・時期 `nextIntent`・組・刻み・初期値（44・1/2・0.3・4/8・4/6・0.3・13/16）が要件のとおり）、猪以外の項目は変更前と一致。`intentChoiceSlotCount` 3。局面ごとの選択肢（together 2つ・enraged 3つ・young 1つ・null と引数なしは空）、各局面の各行動を `chooseEnemyIntent` で指定すると予告（種類・量の幅・`defense`・`variant`）と決まりの状態（`lastVariant`）と `currentIntentChoice` が要件のとおり、局面でできない行動は選べず状態も変わらない。`chosenIntentOf`（null・guard・attack・rage）OK。「1 にする」（両方生きている・親が 0・子が 0 でそれぞれ親 1・子 0／子 1／親 1・子 0）・「満タンにする」（親子とも最大。親が 0 からも）・途中の HP（30 → 親 22・子 8、親が 0 からは子 22・親 8）・0・最大超え・小数の拒否、予告は変わらない。「子を 0 にする」（親 22・子 0・予告と乱数はそのまま。親が 0 なら子 1 を残す・1 のままなら false）、「親を 0 にする」（子 22 の親 0・子が 0 なら親 1 を残す・倒したことにならない）、親を 0 にして今の予告が守る → 決め直して子の攻撃（乱数を呼ぶ）、子の攻撃の予告なら決め直さない（乱数・予告が変わらない）、段取り中でないときと親子でない敵（ゴブリン）では何も起きない。最大 HP のスライダー（ステージ 1・30 で 20・21・1・2・3・44・100・45・10・200・44・7 と上げ下げ）で、毎回 `hp === parent + child`・各部分が新しい最大以下・上げない・HP 0 にならない。親 0・子 22 の敵で最大 1 にすると親 1・子 0。他の項目（確率の範囲・組の最小最大の連動・時期・刻み）OK。確率 1・防御 8 にすると次の予告が守る・`defense` 8。「元に戻す」で猪の設定が全部戻り、最大 HP・親と子の合計が保たれる。
        *   ランダムなゲーム 40 個（DEBUG 操作（HP・子/親を 0・最大 HP・行動の指定・猪への切り替え）をまぜて、剣・盾を積んで `resolveBattle` → 3択 or 次のフェーズ、1439 回の攻防、Error 0）。毎回 `hp === parent + child`、倒したときは親も子も 0。通った局面の回数: together 272・enraged 155・young 48。
        *   (4) 代用の `oz`（受け流す最小の代わり）と、`oz`・`assets/` だけ解く `module.register` のローダー、`document`・`location`・`screen` の代わりで、作業ツリーと写しの両方で `js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク6: 中断データ（版 7・親と子の HP）
*   **作業内容** :
    *   `js/rules/enemyParts.js`: `isEnemyPartsShape(spec, parts, hp)` を足した（設定が `brood` を持たない敵は `parts === null` だけ true。持つ敵は、`parent`・`child` の2項目だけを持つプレーンなオブジェクト（プロトタイプが `Object.prototype` か null）で、どちらも 0 以上の整数・合計が `hp` と同じなら true。`try/catch` で例外を投げない。JSDoc 付き。先頭の責務は変更なし＝中断データの形の確かめを最初から含む）。
    *   `js/rules/suspendData.js`: `enemyParts.js` から `isEnemyPartsShape` を import し、`FIELDS.enemy` の保存（`game.enemy.parts`。`structuredClone` の中で写し）・確かめ（`isEnemyPartsShape(enemySpecOf(config, value.typeId), value.parts, value.hp)`）・戻し（`structuredClone` した値の `parts`）に `parts` を足した。`SUSPEND_VERSION` を 7 にし、版の説明に「7: 敵の親と子の HP `parts` を足したとき 6 から上げた」を足した。`SuspendData` の型の `enemy` に `parts` を足した。先頭の責務は変更なし。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開・猪の行を要件1の猪の親子の行（`motion`・`brood`・`behavior.type: 'brood'`）に替えた `js/` の写し・代用の `oz` はスクラッチに置き、終わって消した）。変更した2ファイルの構文チェック OK。
        *   (1) `isEnemyPartsShape` を単体で 22 通り（親子の正しい形・親 0・子だけ・両方 0 で `hp` 0・合計が違う・親子の敵で `null`/`undefined`・親子でない敵で `null`/`undefined`/値あり・負・小数・項目の欠け（親・子）・余分な項目・配列・文字列の数・NaN・クラスのインスタンス・プロトタイプなしのオブジェクト・数・`ownKeys` が例外を投げる Proxy・`hp` が文字列）で呼び、すべて見込みどおり（食い違い 0）、例外は外へ出ない。
        *   (2) `RULES` のまま、変更前と作業ツリーを同じ操作・同じ乱数で並べたランダムなゲーム 90 個（放つ頻度 0.7・0.9・0.3、敵の切り替えを混ぜた。ターンの始まり 8,335 回・3択の段階 262 回の計 8,597 回）で、保存した中断データが `version`・敵の `parts` を除いて変更前と完全に一致（食い違い 0。作業ツリーの敵の `parts` は常に `null`、`version` は 7）。変更前（版 6）のデータは 8,597 回すべて捨てられた（受け入れ 0）。保存 → JSON → `readSuspendData` → `restoreGame` で作ったゲームと元のゲームに同じ操作を行うと、毎ターンの戻り値の並び・結果の記録・中断データ全体が一致（食い違い 0。3択の段階の選択も同じ）。
        *   (3) 写しの設定（猪の親子）で、ランダムなゲーム 120 個（敵を猪の親子に替え、「子を 0 にする」「親を 0 にする」を混ぜた。放つ頻度 0.9・0.7・0.5）で、ターンの始まり 2,864 回（子がいる間 1245・怒り 1185・子だけ 434。うち溜めの次の大突進のターン 192 回）と3択の段階 452 回で保存 → 戻し → 同じ操作を3ターン続けると、毎ターンの中断データ全体（乱数の状態・親と子の HP・決まりの状態・予告）と攻防の戻り値の並びが元のゲームと一致（食い違い 0）。毎回 `hp === parent + child`。形違いの `parts`（合計が `hp` と違う・`null`・項目なし・負・小数・配列・余分な項目・種類を親子でない敵（ゴブリンの軍勢）に替えて値あり・版 6）を各ターンの始まりで作り、25,776 件すべて `readSuspendData` が `null` を返し、例外 0。
        *   (4) 代用の `oz`（受け流す最小の代わり）と、`oz`・`assets/`（import map の `assets/`）だけ解く `module.register` のローダー、`document`・`location`・`screen` の代わりで、作業ツリーと写しの両方で `js/main.js` の import が成功し、`js/` 配下の 168 ファイルすべても個別に読み込めた（失敗 0）。

### タスク7: 演出の「絵と群れを両方持つ体」の仕組み（猪の見せ方はまだ今のまま）
*   **作業内容** :
    *   `js/anim/enemyShows.js`: 体の見せ方に `'brood'` を足し（型）、`DEFENSE_SHOWS.brood = { unit: null, blockStep: 'shieldBlock' }`、体の見せ方ごとの「群れの体を持つか」の表 `HORDE_BODIES`（`horde`・`brood` は真、`figure` は偽）と問い合わせ `enemyHasHorde(typeId)` を足した。`ENEMY_SHOWS` の猪の行は今のまま。
    *   `js/anim/enemyIdle.js`: `enemyBodyStyle(typeId) === 'horde'` を `enemyHasHorde(typeId)` に替えた（import も替えた）。
    *   `js/anim/enemyBody.js`: `EnemyBody` に `partHp`（親子の敵だけ `{ parent, child }`、ほかは `null`。`horde`・`figure` の行に `partHp: null`）。`BODY_SETUPS` の各行に最後の引数 `parts` を渡す形にし、`BODY_SETUPS.brood` を足した（`parts.child` の数の群れを `horde` の行で作り、`parts.parent > 0` なら `figure` の行で絵の記録・シールドの並べ先を作って `style: 'brood'`・`partHp` を付ける。親が 0 なら絵の記録は群れと同じ空。`parts` がなければ Error。絵の倍率は合計の `hp`・`maxHp` で `figure` の行と同じ式）。`BODY_HITS` に `part` を渡し、`BODY_HITS.brood`（`child` は `horde` の当たり、`parent` は `figure` の当たり、それ以外は Error）。`createEnemyBody(…, unit, parts = null)`、`hitEnemyBody(…, shownHp, part = null)`（`partHp` があれば当たった量だけ `partHp[part]` を減らす）、`isEnemyFigureDown(body, shownHp)` を足した。先頭の責務の文は「群れ・絵・シールド」に直しただけ（3行以内）。
    *   `js/anim/battleSteps.js`: `BattleSnapshot.enemyParts`（`snapshotBattle` で `game.enemy.parts` の写し。親子でない敵は `null`）、`BattleStep.part`、出来事 `enemyDamage` が `parts` を持つとき `parts` の順に量が 0 より大きいものを `{ type: 'enemyHit', amount, part }` の段にする（持たないときは今のまま）。
    *   `js/anim/battleTimeline.js`（3か所だけ）: `createEnemyBody` に `before.enemyParts` を渡す・`addEnemyHit` で `hitEnemyBody(…, step.part ?? null)`・倒れる時刻の判定を `isEnemyFigureDown(state.body, state.enemyShown)` にした（import に `isEnemyFigureDown` を足した）。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開・猪の行を要件のタスク12の行にした `js/` の写し・代用の `oz` はスクラッチに置き、終わって消した）。変更した5ファイルの構文チェック OK。
        *   (1) `RULES` のまま、変更前と作業ツリーを同じ種・同じ操作で並べ、8種の敵 × 各 1,500 = 12,000 件（ステージ 1〜300・城の HP・敵の HP・戦闘のターン（疲れ）・攻撃/防御/修理のゲージと精鋭（1〜3 体・2〜5 ポイント）・自動兵士の印・待っていた精鋭・DEBUG の口 `chooseEnemyIntent` で指定した次の行動（約 6 割）、攻撃の大きいもの（9 件に 1 件）、ゲージ 0 を含む）で、段の並び・時間割の段（時刻・きっかけ）・名簿全体（脚と終わり方）・敵と城の HP の変化・ヒットマーク・当たりの記録（並びの順まで）・体の記録（`partHp` を除く）・終わりの時刻・出来事・演出の時計の約 160 点での人数の表示値・精鋭の上振れ・城と敵の HP の表示値・絵の見た目・姿勢・ヒットストップを入れた時計・きっかけ・HP が 0 になったか、がすべて一致（食い違い 0）。待機の伸び縮み（8種 × 60 回の `EnemyIdle.update`。群れの数 0〜89）も一致（食い違い 0）。検出力の確認として、変更前と猪の行を替えた写しを同じ方法で比べると、猪の 60 件すべてで食い違いが出た（猪以外の食い違いは、猪の親子の予告の乱数の呼び方が違うため `moveStage` の後の乱数の状態がずれたことによるもの）。
        *   (2) 猪の行を要件3・要件1のタスク12の行にした写し（`config.js` の猪の親子・`ENEMY_SHOWS.boar`（`body: 'brood'`・`attacks: { default: 'march', rush: 'dashStraight', bigRush: 'dashStraight' }`・`heavy: ['bigRush']`・`charge: ['rage']`）・`ENEMY_FIGURES.boar`（高さ 100・シールド・札の `gap: null`）・`HORDE_SKINS.boar` は `SPRITE_IDS.goblin`（`bake: 'goblin'`）・`HORDE_PLACES.boar`（`area.h` は書かない）・`ENEMY_ATTACK_SE.boar` の突進・大突進）で、猪の親子の攻防 8,000 件（満タン・子を 0・親を 0・HP を 1〜最大にして作った3つの局面、予告は DEBUG の口で指定、攻撃ゲージは 0〜合計 HP の 1.4 倍＋8、精鋭を含む。城が落ちる攻防 2,015 件を含む。倒した 1,975 件・子を全滅させた 1,400 件・親が先に倒れて子が残った 373 件）を、Error なく時間割まで作って演出の時計を最後まで進めた。確かめた内容はすべて食い違い 0:
            *   `enemyHit` の段（`part`・量）が出来事 `enemyDamage.parts` と一致。段の並びは、ふだん（子の攻撃）が `enemyMarch → block/castleHit → march → enemyHit(child) → enemyHit(parent)`、守るターンが `march → shieldBlock → enemyHit(parent) → enemyHit(child)`（`form` の段・`enemyMarch` はない）、怒りの突進・大突進が `dash → strikeBlock/strikeCastle → dashBack → march → enemyHit(parent)`、溜めが `charge → march → enemyHit(parent)`（要件3のとおり）。
            *   体の記録 `partHp` の最後の値が攻防の後の `game.enemy.parts` と一致し、攻防の前の親・子 − 当たった量 = 攻防の後。
            *   名簿のうり坊の最初の数 = 攻防の前の子の HP、落ちたうり坊の数 = 子に当たった量の合計（精鋭を含む）。絵が跳ねて落ちる記録は、親が 0 になった攻防（親が残るときはなし）だけにあり、その時刻 = 親の `enemyHit` の段の終わり。親が 0 のとき絵の記録（`figure`・`fall`）は空。城が落ちる攻防では絵は倒れない。
            *   守るターンのシールド: `shieldBlock` の量 = 出来事 `enemyBlock` の量 = 落ちたシールドの数、シールドの数 = 攻防の前の予告の防御。
            *   当たりの記録の `enemyDamage` の量の合計 = 出来事 `enemyDamage` の量。敵の HP の表示は最後に攻防の後の HP（`親 + 子`）になる。`enemyDefeat` は親と子が両方 0 のときだけ1回（結果の `defeat` も同じ）。
        *   (3) 代用の `oz`（受け流す最小の `Engine`（シーンの積み・外し）・`Scene`・`Assets`・`Sound`・`Storage`・`CanvasCache`・`Ui`）・`assets/` だけ解く `module.register` のローダー・`document`・`location`・`screen` の代わり・`save`/`restore` を数える代用の `ctx` で、作業ツリー（`cur`）と猪の行を替えた写し（`brood`）の両方に対し、`js/` 配下の 168 ファイルすべてが個別に読み込め、`js/main.js` の import も成功した（失敗 0）。`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → 準備終了 → BATTLE!）→ 積んだ `BattleShowScene` の `update`/`draw` → 次のフェーズ、を各ゲームで最大 7 ターン進め（行動の使い切り・攻撃ゲージ・待っている兵の数は代用の口で作った）、すべての `draw` の前後で `save`/`restore` が釣り合った。作業ツリー 60 ゲーム（386 ターン・約 28 万回の draw）・写し 60 ゲーム（猪の親子 330 ターン。子がいる間 104・怒り 146・子だけ 80。約 25 万回の draw）・ステージ 30 の写し 12 ゲーム（64 ターン）・ステージ 100 の写し 12 ゲーム（18 ターン）で Error 0・`save`/`restore` の不釣り合い 0。敵を倒した攻防で3択の画面（`UpgradeChoiceScene`）が積まれた時点・負けの結果の画面が積まれた時点でそのゲームの確かめは終えた（3択以降は本タスクの範囲外）。

### タスク8: うり坊のスプライト — スプライトのコピーとスプライトの表
*   **作業内容** :
    *   `assets/sprites/unit_uribo.js`: `cp` で `unit_boar.js` をコピーして作り、先頭の説明の1行目だけ「うり坊の仮のスプライト（左向き。原点は体の中ほど、足元は範囲の下端）。」に直した（ほかの行・`source`・要素は変えていない）。
    *   `js/view/spriteView.js`: `import unitUribo from 'assets/sprites/unit_uribo.js'`・`SPRITE_IDS.uribo = 'uribo'`（型の JSDoc にも `uribo` を追記）・`SPRITE_TABLE` の `uribo` の行（猪と同じ x −172〜168・y −122〜128）を足した。`unit_boar.js` とほかのスプライトは変えていない。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開・代用の `oz`・`assets/` だけ解く `module.register` のローダーはスクラッチに置き、終わって消した）。変更した 2 ファイルの構文チェック OK。
        *   (1) `diff unit_boar.js unit_uribo.js` の違いは先頭の説明の1行目（2行目）だけ。作業ツリーの `spriteView.js` で `unit_uribo.js` が読み込め、`SPRITE_IDS.uribo` を `drawSpriteCentered`・`drawSpriteFit`・`drawSpriteStretched`・`drawTroopFigure` で描け（代用の `ctx` の呼び出し 620 回）、`save`/`restore` が釣り合った（深さ 0・負になった回数 0）。`uribo` の描く呼び出しの並び・`spriteFitRect`・`troopFigureBakeBounds` の値が `boar` と完全に一致（`SPRITE_TABLE` の行が猪の行と同じ値）。
        *   (2) `RULES` のまま、変更前と作業ツリーで、`SPRITE_IDS` の識別子 22 個すべての描く呼び出しの並び（上の4つの描く関数）・`spriteFitRect`・`troopFigureBakeBounds` が一致（食い違い 0。作業ツリーの識別子は `uribo` が増えた 23 個）。`createTroopBakes` の焼き付けの一覧（`createLayout` の戦闘の配置で作り、`CanvasCache.create` の呼び出しを記録）は変更前・作業ツリーとも 24 件で、範囲（`bounds`・`scale`）と焼き付ける絵の描く呼び出しの並びまで完全に一致（`uribo` は入らない）。焼き付ける絵の `save`/`restore` も釣り合った。
        *   (3) 代用の `oz`（`Engine`・`Scene`・`CanvasCache`・`Storage`・`Sound`・`Assets`・`Ui`）・`document`・`location`・`screen` の代わり・`save`/`restore` を数える代用の `ctx` で、作業ツリーの `js/` 配下 168 ファイルすべてが個別に読み込め（失敗 0。変更前は 167 ファイル、失敗 0）、`js/main.js` の import も成功した。`BoardScene` の `init` → `update`（タップを混ぜて進める）→ 積んだ `BattleShowScene` の `update`/`draw` → 次のフェーズ、を 40 ゲーム（約 16 万ティック・16 万回の draw。敵は狼・オーガ・猪・骸骨・スライム・ゴブリンの軍勢。攻防の演出は 1,072 ティック、ターンは 1〜4）で進め、Error 0・`save`/`restore` の不釣り合い 0。変更前も同じ条件で Error 0・不釣り合い 0。3択・結果の画面までは進めていない（本タスクの範囲外）。

### タスク9: 群れの範囲の高さ（`area.h`）
*   **作業内容** :
    *   `js/view/hordePlaces.js`: `HordePlaceDef.area` の型に任意の `h` を足し、`createHordePlaces` で `area.h` があれば群れの範囲の高さを `min(area.h, 足元の範囲の高さ − 削る量)` にした（y は足元の範囲の上端のまま。`area.h` がなければ今と同じ `fieldH − cut`）。攻撃・守りの陣地は今のまま（削った後の高さいっぱい）。JSDoc を更新。猪の行は足していない（タスク12）。構文チェック OK。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開・写し・代用の `oz`・`assets/` だけ解く `module.register` のローダーはスクラッチに置いた。**後始末の `rm` が安全装置で拒否されたため、スクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad` の中身が残っている（リポジトリの外）。発注者が消してよい**）。
        *   (1) `RULES` と今の表のまま、`createLayout`（画面 720×1280 相当の引数）の戦闘の段の配置（`groundY` 335・`fieldH` 190・標準の大きさ 24）全体を JSON にして、変更前と作業ツリーで比べたところ完全に一致（`hordePlaces` の全行・`enemyFigures`・陣地を含む。`cmp` 差なし）。`ogres` の群れの範囲は両方 `{x:605, y:169, w:75, h:166}`、`goblins` は標準そのもの（同じオブジェクト）。
        *   (2) スクラッチの写し（作業ツリーの `js/` を写し、`HORDE_PLACES` に要件3の猪の行 `{ size: 24, area: { x: 565, w: 120, h: 80 }, enemy: { x: 455, w: 45 }, enemyGuard: { x: 525, w: 35 } }`、`ENEMY_FIGURES.boar` に要件3の行（高さ 100・シールド `{cx 0.35, cy 0.55, w 0.55, h 0.6}`・`hit 0.12`・`mouth null`・`intent {x 0.5, gap null}`・`minScale 1`）を入れたもの）で、実際の `createLayout` から求めた値:
            *   `groundY` 335、`fieldH` 190。標準（24）の猪の行は `cut = 0`。
            *   群れの範囲（足元の中心が入る範囲）: x 565〜685（w 120）・y 145〜225（h 80。`min(80, 190)` = 80）。群れの体の上端（足元 − size 24）: 最も奥の足元 y 145 の体で y 121（足元 145 − 24）。
            *   攻撃の陣地: x 455〜500（w 45）・y 145〜335（h 190）。守りの陣地: x 525〜560（w 35）・y 145〜335（h 190）。
            *   親の絵の矩形: x 552・y 235・w 136・h 100（x 552〜688・y 235〜335）。シールドの並べ先: x 562.2・y 260・w 74.8・h 60。予告の札の基準 x 620・y 60（`gap` が null なので人数の表示の枠の下端にそろう）。当たる x 568.32。
            *   見込み（群れの足元 x 565〜685・y 145〜225・体は y 121 から・親の矩形 y 235〜335）とすべて一致。群れの足元の範囲の下端 225 は親の矩形の上端 235 より 10px 上で、重ならない（体の中心は足元から 12px 上に置くので、最も手前の足元 225 の体は y 201〜225）。
            *   攻撃・守りの陣地（y 145〜335）は親の矩形（x 552〜688・y 235〜335）と y で重なるが、x は攻撃 455〜500・守り 525〜560 で、守りの陣地の右端 560 は親の左端 552 より 8px 右に出る（守りの陣地は群れの敵の守りの兵が並ぶ範囲で、親の絵の左の端に少しかぶる）。見込みの計画（要件3）の値どおりで、このタスクの合格条件（群れの足元の範囲と親の矩形が重ならない）ではない。重なりの見え方は試遊で確かめる（懸念事項に書いた）。
        *   (3) 代用の `oz`（`Engine`（シーンの積みで `init`・外しで `destroy` を呼ぶ）・`Scene`・`Assets`・`Sound`・`Storage`・`CanvasCache`・`Ui`）・`assets/` だけ解く `module.register` のローダー・`document`・`location`・`screen` の代わり・`save`/`restore` を数える代用の `ctx` で、作業ツリー（168 ファイル）・変更前（167 ファイル）・猪の行を足した写し（168 ファイル）のすべてで、`js/` 配下のファイルが個別に読み込め（失敗 0。`main.js` を含む）、`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → 準備終了を、`canResolveBattle` を真にして作り、タップで BATTLE! → 攻防）→ 積んだ `BattleShowScene` の `update`/`draw` → 次のフェーズ、を 12 ゲームで各最大 5 回の攻防まで進めた。3つとも 16,154 ティック・16,154 回の draw・攻防の演出 48 回で、Error 0・`save`/`restore` の不釣り合い 0（深さ 0・負 0）。3択以降は範囲外。今の `RULES` の猪は `brood` を持たない（写しの猪の行は、計画どおり今の猪の体のまま新しい表で描かれる）ので、写しの確かめは「新しい表の値で今の猪が壊れない」までで、猪の親子としての描画はタスク12以降。

### タスク10: 群れと絵の描き分け — 群れと絵の HP の読み方・段取りの間の敵・待機の群れの数
*   **作業内容** :
    *   `js/view/bodyHp.js`（新規。何も import しない）: `hordeHpOf(enemy)`（`enemy.parts` があれば `parts.child`、なければ `enemy.hp`）・`figureHpOf(enemy)`（同じく `parts.parent` か `enemy.hp`）。先頭の責務・JSDoc あり。
    *   `js/view/enemyView.js`: 段取りの間の描き方を「群れの絵を持つ（`isHordeEnemy`）なら群れ（`hordeHpOf` の数）を描き、続けて絵を持ち `figureHpOf > 0` なら絵とシールドマークを描く」にした（群れが奥・絵が手前）。攻防の演出中（`figure` が `null` でない）は今のまま絵だけ。`drawEnemyFigure` の JSDoc（`enemy` の型に `parts`）を更新。先頭の責務の文は変えていない（段取りの間の絵・群れ・シールドマークを描く、のまま）。
    *   `js/scenes/BoardScene.js`: 待機の伸び縮みの群れの数を `bodyCount(hordeHpOf(this.game.enemy), this.game.enemyUnitPoints())` にし、`bodyHp.js` を import。
    *   構文チェック: 変更・作成した 3 ファイルとも OK。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開（`t10/base`）・作業ツリーの写し（`t10/cur`）・猪の行をタスク12の行に替えた写し（`t10/brd`。`config.js`・`enemyShows.js`・`enemyFigures.js`・`hordeSkins.js`・`hordePlaces.js`・`soundCues.js` の猪の行）・代用の `oz`・`assets/` だけ解く `module.register` のローダーは、スクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad`（`t10/` ほか）に置いた。リポジトリの外。残してある。発注者が消してよい）。
        *   (1) `hordeHpOf`・`figureHpOf` を `parts` が `null`・省略（`undefined` 値と項目なし）の敵で呼ぶと、どちらも `enemy.hp`（10 → 10・10）。`parts = { parent: 20, child: 10 }` なら群れ 10・絵 20、`{ parent: 20, child: 0 }` なら群れ 0・絵 20、`{ parent: 0, child: 10 }` なら群れ 10・絵 0。要件3のとおり。
        *   (2) `RULES` のまま、変更前（`base`）と作業ツリー（`cur`）で、8種の敵（goblins・ogres・wolf・boar・skeletons・slime・giant・dragon）× 乱数の種 2 つ（11・12）で、`BoardScene` の `init` →（`switchEnemy` で敵を入れ替え）→ `update`/`draw`（スタートの待ち → TURN → 段取り（入り・待機の伸び縮み・シールド）→ 準備終了 → BATTLE! → 攻防の演出（敵の絵・名簿・結果まで）。各ゲーム 2 回の攻防まで。約 100 万回の `ctx` 呼び出し）の全 `ctx` 呼び出し（`save`/`restore`・描く呼び出し・プロパティの設定。引数は小数 6 桁まで）の SHA-1 と呼び出し数、`EnemyIdle.update` に渡る引数（種類・群れの体の数）の全列の SHA-1 と回数（422 回）が 16 ゲームすべてで完全に一致した（`diff` 差なし）。Error 0・`save`/`restore` の不釣り合い 0。猪の待機の伸び縮みの群れの数の初回は `boar:44`（変更前と同じ）。スライムの縮みは敵の種類の行に含まれる。
        *   (3) 猪をタスク12の行にした写し（`brd`）で、(a) `drawEnemyFigure` を `parts` を変えて直接呼ぶと、子がいる間（22・22・防御 6）の呼び出し列の中身（外側の `save`/`restore` を除く）が、子だけ（0・22）の列（群れだけ）に、怒り（22・0・防御 6）の列（親の絵とシールドマーク）を続けた列と完全に一致（群れが奥・絵が手前）。空（0・0）は `save`/`restore` の 2 回だけ。子だけでは防御があっても絵・シールドは描かれず（防御 6 と 0 の列が同じ）、怒りの防御 6 は 0 より呼び出しが増える（518 対 158＝シールドマーク）。攻防の演出中（`figure` あり）は絵だけの 160 回（`clip` を含む）。`save`/`restore` は釣り合い（深さ 0・負 0）。(b) `BoardScene` で猪の親子（ステージ 1 = 親 22・子 22・`hp` 44）を段取りから攻防まで進めると Error 0・不釣り合い 0、待機の伸び縮みの群れの数は初回 22（子の HP）。`parts` を書き換えて予告を決め直した 3 局面でも Error 0・不釣り合い 0（子だけ `{0, 22}` は初回 22、怒り `{22, 0}` は初回 0、`{5, 3}` は初回 3）。
        *   (4) 代用の `oz`・`document`・`location`・`screen` の代わり・`save`/`restore` を数える代用の `ctx` で、作業ツリー（169 ファイル）・猪の行を替えた写し（169 ファイル）とも、`js/` 配下のファイルがすべて個別に読み込め（失敗 0）、`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → BATTLE! → 攻防）→ 積んだ `BattleShowScene` の `update`/`draw` → 次のフェーズ、を 12 ゲームで各最大 5 回の攻防まで進め（作業ツリー 16,154 ティック・写し 16,328 ティック。各 1 ティックに 1 回の draw）、Error 0・`save`/`restore` の不釣り合い 0。3択以降は範囲外。

### タスク11: 予告の札 — 突進・怒りを溜める・大突進の札と「怒り」の文字
*   **作業内容** :
    *   `js/view/battleText.js`: `VARIANT_LABELS` に `rush: '突進'`・`rage: '怒りを溜める'`・`bigRush: '大突進'`、量の代わりに出す文字の表 `BADGE_LABELS`（`{ rage: '怒り' }`）と `intentBadgeLabel(action)`（表になければ `null`）を足した。先頭の責務を更新。
    *   `js/view/intentView.js`: `INTENT_ICONS` に `rush: attack`・`rage: windup`・`bigRush: attack`、`EMPHASIZED_VARIANTS` に `bigRush`、定数 `BADGE_LABEL_FONT = 'bold 22px sans-serif'`・`BADGE_LABEL_COLOR = '#ffb347'`。攻撃の側の量が `null` で `intentBadgeLabel` が文字を返すとき、絵の右（`badge.gap` の後）に量の数字と同じ縁取りで描き、札の幅にその文字の幅（22px のフォントで測る）を足す。札の高さは変えていない。ラベルを持たない予告では `ctx.font` の設定も含め呼び出しの並びは変わらない。先頭の責務を更新。構文チェック 2 ファイルとも OK。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924` の展開（`t10/base`）・代用の `oz`・`assets/` だけ解くローダーはスクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad`（`t11/` ほか）に置き、残してある。リポジトリの外。発注者が消してよい）。
        *   (1) `RULES` のまま、今の行動 13 種（攻撃・爪・吸い込む・ブレス・溜める・大攻撃・振りかぶり・防御だけ・攻撃＋防御・守る系・未知の kind・未知の variant）× 敵 6 種 × 数え下ろし（なし・2）× 入りの見た目 4 通りで `drawEnemyIntent` の全 `ctx` 呼び出し（37,326 回。`save`/`restore`・描く呼び出し・プロパティ設定）の SHA-1 が変更前と作業ツリーで完全に一致（`save`/`restore` 不釣り合い 0）。始まりの文字 `enemyActionText`・`intentAmountText` も13種とも変更前と同じ。
        *   (2) 手で作った予告で、代用の `ctx`（`measureText` は文字数×フォントごとの幅）の呼び出しを確認。突進 5: 札は普通の色（塗り `rgba(20,24,36,0.75)`・縁 白）・攻撃の絵・「5」（30px 白）、始まりの文字「突進 5」。怒りを溜める: 札は普通の色・振りかぶりの絵・`bold 22px sans-serif`・橙 `#ffb347`・縁取り 6px（`#111827`）の「怒り」を絵の右 `badge.gap`（4）の後の位置（札の左 610 + padX 6 + iconW 40 + gap 4 = 660、y は札の中央 82）に描き、札の幅は 12 + 40 + 4 + 文字幅（24）= 80、始まりの文字「怒りを溜める」。大突進 14: 赤い札（塗り `rgba(170,20,20,0.92)`・縁 `#ffe45c` 太さ 3）・攻撃の絵・「14」は黄色 `#ffe45c`、始まりの文字「大突進 14」。子の攻撃（攻撃 2）・守る（防御 6）は今の描き方で、「怒り」は出ない。溜める（`charge`）は表にないので文字は出ない（変更前と同じ）。どれも `save`/`restore` が釣り合った（深さ 0・負 0）。
        *   (3) 作業ツリー（169 ファイル）と猪の行をタスク12の行にした写し（`t11/brd`。`t10/brd` に今回の 2 ファイルを重ねた）で、`js/` 配下のファイルがすべて個別に読み込め（失敗 0）、`BoardScene` の `init` → `update`（スタートの待ち → TURN → 段取り → BATTLE! → 攻防）→ 積んだ `BattleShowScene` の `update`/`draw` → 次のフェーズ、を 12 ゲームで各最大 5 回の攻防まで進め（作業ツリー 16,154 ティック・写し 16,328 ティック。各 1 ティックに 1 回の draw）、Error 0・`save`/`restore` の不釣り合い 0。変更前と作業ツリーの 8 種 × 乱数の種 2 つの全 `ctx` 呼び出しの SHA-1 と待機の伸び縮みの引数も完全に一致（16 ゲームとも Error なし）。写しで猪の親子の局面（親子 22/22・子だけ 0/22・怒り 22/0・5/3）を段取りから攻防まで進めても Error 0・不釣り合い 0。3択以降は範囲外。

### タスク12: 猪の設定を猪の親子に切り替える（設定と見せる表の猪の行を同時に）
*   **作業内容** :
    *   `js/rules/config.js`: 猪の行を要件1のとおり猪の親子に替えた（名前「猪の親子」・`motion: 'buildup'`・`brood`（`childPercent` 50・`hitOrder`）・`behavior`（`type: 'brood'`・`attackRange` 1〜2・`protectChance` 0.3・`protectRange` 4〜8・`rushRange` 4〜6・`rageChance` 0.3・`bigRushRange` 13〜16）。`maxHp` 44 のまま）。先頭の責務の文に親と子の行動・`brood`・`motion` を足した。
    *   `js/anim/enemyShows.js`: `ENEMY_SHOWS.boar` を `body: 'brood'`・`attacks: { default: 'march', rush: 'dashStraight', bigRush: 'dashStraight' }`・`heavy: ['bigRush']`・`charge: ['rage']`（`dents`・`pace` は今のまま）にした。
    *   `js/view/enemyFigures.js`: `boar` を `height: 100`・`shield: { cx 0.35, cy 0.55, w 0.55, h 0.6 }`・`intent: { x: 0.5, gap: null }`（`hit 0.12`・`mouth null`・`minScale 1` は今のまま）にした。
    *   `js/view/hordeSkins.js`: `boar: { body: SPRITE_IDS.uribo, item: null, bake: 'uribo' }` を足し、先頭の責務と表の説明に猪の親子（子のうり坊）を足した。
    *   `js/view/hordePlaces.js`: `boar: { size: 24, area: { x: 565, w: 120, h: 80 }, enemy: { x: 455, w: 45 }, enemyGuard: { x: 525, w: 35 } }` を足した。
    *   `js/scenes/soundCues.js`: `ENEMY_ATTACK_SE.boar` を `{ rush: 'giantAttack', bigRush: 'giantAttack' }` にした（子の攻撃は鳴らさない。5章の発注者への確認の点。説明にも書いた）。
    *   構文チェック: 変更した 6 ファイルとも OK。
    *   確かめ（一時スクリプト・変更前 `git archive c4d8924 js assets` の展開（`t10/base`）・代用の `oz`・`assets/` だけ解くローダーは、スクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad`（`t12/` ほか）に置き、残してある。リポジトリの外。発注者が消してよい）。作業ツリーの `RULES`・見せる表で行った。
        *   (1) HP の分け方: ステージ 1・2・6・11・16・30・100・500 の猪の親子で、子 = floor(最大 HP × 50 / 100)・親 = 最大 HP − 子・合計 = 加算後の最大 HP（= `hp`）。1: 44（親 22・子 22）、2: 46（23・23）、6: 55（28・27）、11: 72（36・36）、16: 93（47・46）、30: 167（84・83）、100: 536（268・268）、500: 2648（1324・1324）。見込みと一致。
        *   (2) 予告の割合（`planIntent` を各 60000 ターン。ステージ 1・30）: 子がいる間は守る 29.95%（17,972 / 60,000）・子の攻撃 70.05%、乱数は毎ターン 2 回。怒りは溜めの抽選をしたターン（37,308 回）のうち溜める 30.4%（全ターンでは 18.9%。見込み 18.75%）、溜めの次は必ず大突進（11,346 / 11,346）、大突進の次は必ず突進（11,346 / 11,346）、乱数は溜めの抽選のターンの突進 2 回・溜める 1 回・大突進 1 回・大突進の次の突進 1 回。子だけは子の攻撃だけ（5,000 / 5,000）で乱数 1 回。量の幅（加算後）: ステージ 1 は子の攻撃 1〜2・突進 4〜6・大突進 13〜16・守るの防御 4〜8、ステージ 30（加算 攻撃 29・防御 12）は子の攻撃 30〜31・突進 33〜35・大突進 42〜45・守るの防御 16〜20。守る以外の防御は 0。すべて要件2のとおり。
        *   (3) 剣の当たり方: 133 の場合（ふだんのターン（子の攻撃）を 親 22・子 22 で剣 0・1・5・10・21・22・23・30・43・44・60、精鋭 2 体入りで同じ剣の値（2 以上）、親子の HP を 5/3・1/1・22/1・1/22・30/14 に替えた場合、守るを 親 22・子 22 で剣 0〜80（防御以下・防御と親の間・親を越えて子へ・倒す）、精鋭入り、親子の HP 違い、怒り（突進・溜め・大突進）の剣 0・10・21・22・23・40、子だけの剣 0・10・21・22・23・40）で、独立に書いた期待値（相殺 = min(剣, 防御)・ダメージ = min(剣 − 相殺, HP)・当たる順（ふだんは子 → 親、守るは親 → 子）で分けた量と残り）と、`enemyBlock`・`enemyDamage` の量・`parts` の量と順・攻防の後の `enemy.parts`・`hp` が全部一致（Error 0）。城が落ちる攻防（城 HP 1）は出来事が `enemyAttack`・`castleDamage`・`lose` で、親と子の HP は入力のまま（22/22）。
        *   (4) 数える回数: 上の 133 の場合のうち合計が 0 になった 43 の場合で、`enemyDefeat` が 1 つだけ・結果の記録の倒した数が 1 増える・攻防の結果の `defeat` が入る・スコアが増える。親だけ 0・子だけ 0 になった場合は `enemyDefeat` なし・倒した数が増えず・`defeat` なし。
        *   (5) 攻防の時間割（上の 133 の場合すべて。守るは防御 4〜8 のシールド、精鋭入りを含む）: 時間割が Error なく作れ、`enemyHit` の段（`part`・量）が出来事の `parts` と同じ順・量、当たりの記録（`roster.strikes`）のポイントの合計が敵へのダメージと同じ、HP の表示値の終わりが結果の HP、`body.partHp` が攻防の後の親と子の HP、絵が倒れるのは親が 0 になるときだけで、倒れる時刻は親の最後の `enemyHit` の段の終わり（親が残るときは倒れない）、落ちたうり坊の数が子に当たった量（精鋭なしの場合）、シールドの数が予告の防御・剥がれた数が相殺の量（守るのターンで親がいるとき）、親が 0 のときは絵の記録なし。すべて一致。
        *   (6) 中断データ: 3つの局面（子がいる間・怒り・子だけ）× 乱数の種 4 つで、予告を数ターン決めた後に保存して `readSuspendData` → `restoreGame` で戻すと中断データが完全に一致（乱数の状態・親と子の HP・決まりの状態 `lastVariant` まで）し、同じ操作（攻防 → 次のフェーズを 6 ターン）で同じ結果。3択の段階（親だけ 1 の猪の親子を倒した後）も保存・戻し・`chooseUpgrade(0)` の結果が一致。版は 7。版 6 のデータ（`parts` あり・なし）、形違いの `parts`（合計が `hp` と違う・親子の敵で `null`・項目なし・負・小数・余分な項目・配列・文字列）、親子でない敵（ゴブリン）で値あり、決まりの状態の形違い（`lastVariant: 'nonsense'`・`buildup` の形）、3択の段階でない敵の HP 0 は、すべて捨てられる（`null`）。70 件の確かめがすべて通った。
        *   (7) 描く体の数（攻防の演出の名簿の体の数。自軍の攻撃 60+ステージ・防御 40・修理 5 を待たせた場合）: ステージ 30 の子の攻撃は 249 体（うり坊 83・攻撃のうり坊 31・自軍 135）、守るは 236 体（うり坊 83・シールド 18）、突進・大突進は 135 体（自軍だけ）。ステージ 100 の子の攻撃は 592 体（うり坊 268・攻撃のうり坊 119・自軍 205）、守るは 526 体（うり坊 268・シールド 53）、突進・大突進は 205 体。比較のゴブリンの軍勢（同じ条件）はステージ 30 が 295 体、ステージ 100 が 740 体（群れ 366）で、猪の親子の方が軽い。段取りの間の体の数はうり坊が子の HP の数（ステージ 30 が 83、ステージ 100 が 268）で、`hordeSlots` の数と一致。目安の 500 体は、ステージ 100 の子の攻撃・守る（592・526）が超えるが、ゴブリンの軍勢のステージ 100（740）より少ない。
        *   (8) ほかの7種が変更前と同じこと（変更前 `t10/base` と作業ツリーを同じ乱数の状態から比べた）: ゴブリンの軍勢・オーガの軍勢・狼・骸骨の軍勢・スライム・巨人・ドラゴン × 種 3 つ × ステージ 1・6・30 の 63 通りで、予告・最大 HP・乱数の状態・攻防の出来事・段（`buildBattleSteps`）・時間割（`buildBattleTimeline` の全項目）・結果の記録・戦闘の記録・中断データ（版と `parts` を除く）を 8 ターンぶん順に並べた SHA-1 が 63 通りすべて変更前と一致（猪の親子が次に出るステージに進む手前で打ち切った）。見た目は、7種 × 乱数の種 2 つ × 段取りから攻防の演出までの全 `ctx` 呼び出し（約 1,100,000 回ずつ）と待機の伸び縮みの引数の全列の SHA-1 が 14 通りすべて一致、Error 0・`save`/`restore` の不釣り合い 0。★1の並び: 10 年分（3,650 日）の日付の種 × ステージ 1〜500 の敵の種類の並びの SHA-1 が変更前と一致（猪の親子は 242,725 回、変更前の猪と同じ）。`RULE_ITEMS` はほかの敵の項目の識別子の列が変更前と同じで、猪の項目だけ 7 個 → 11 個（全部で 65 → 69 個）、DEBUG の次の行動の選択肢の枠の数は 3 のまま。
        *   (9) 猪の親子の描画（段取りの間から攻防の演出まで・`BoardScene` の `init` → `update` → 積んだ `BattleShowScene` → 次のフェーズ）: 乱数の種 11・12 で、通常（親 22・子 22）・子がいる間・子だけ（親 0・子 22）・怒り（親 22・子 0）・親 5 子 3・親 1 子 0 のすべてで Error 0・`save`/`restore` の不釣り合い 0（段取りの待機の伸び縮みの群れの数は初回 22・22・22・0・3・0 で局面どおり）。DEBUG の口（`switchEnemy`・`moveStage`）で猪の親子を出し、攻撃 6・14・25・70 の4とおり × 種 6 つ × ステージ 1・30・100 の 72 ゲーム（396 回の攻防、約 24 万ティックの `update`/`draw`）を数ターン〜倒すまで進め、Error 0・不釣り合い 0（倒して3択の画面に着いたもの 36、城が落ちて結果の画面に着いたもの 24、14 回の攻防の上限 12。倒した記録がついたもの 38）。予告は子の攻撃・守る・突進・怒りを溜める・大突進のすべてが現れた。
        *   (10) 並ぶ場所の数値（作業ツリーの表と実際の `groundY` 335・`fieldH` 190）: 群れの足元の範囲 x 565〜685・y 145〜225（h 80。タスク9の数値と同じ）、群れの体の上端 y 121（足元 145 − 24）。ステージ 100 のうり坊 268 体の足元の x 565.6〜684.9・y 145.3〜224.9。親の絵の矩形 x 552〜688・y 235〜335（h 100）。群れの足元の最も手前（224.9）は親の矩形の上端（235）より 10px 上で、重ならない。攻撃の陣地 x 455〜500・y 145〜335、守りの陣地 x 525〜560・y 145〜335（右端 560 は親の矩形の左端 552 より 8px 右にかぶる。タスク9の数値と同じ）。シールドの並べ先 x 562.2・y 260・w 74.8・h 60。予告の札の基準 x 620・y 60。当たる x 568.32。
        *   (11) 焼き付けの一覧（`createTroopBakes`）: 変更前の 24 件から 27 件に増え、増えたのは `uribo`（24px）・`uribo:wounded`（24px）と、親のシールドの大きさ（`shield` に 11.968px の1件）。ほかの識別子・大きさは同じ。
        *   (12) 攻撃の音: `enemyAttackSeName('boar', …)` と `battleCueSeName('enemyAttackStart', 'boar', …)` は、子の攻撃（中の種類なし）・怒りを溜める・守る（`protect`）で `null`、突進・大突進で `giantAttack`。狼（`dragonClaw`）・巨人（`giantAttack`）・ドラゴン（`dragonClaw`）・ゴブリン（`null`）は変更前と同じ。
        *   (13) 起動: 作業ツリーの `js/` 配下 169 ファイルがすべて個別に読み込め（失敗 0。`main.js` を含む）。

### タスク13: DEBUG タブ — 5つの行動とルールの値の文字・「子を 0 にする」「親を 0 にする」のボタン
*   **作業内容** :
    *   変更: `js/view/debugText.js`（`DEBUG_TEXT` に `childToZero: '子を 0 にする'`・`parentToZero: '親を 0 にする'` と型の項目、`RULE_ITEM_TEXT` に `maxHpTotal`・`youngAttackMin/Max`・`protectChance`・`protectMin/Max`・`rushMin/Max`・`rageChance`・`bigRushMin/Max` の11行、`INTENT_CHOICE_TEXT` に `youngAttack`・`protect`・`rush`・`rage`・`bigRush` の5行。文言は要件4のとおり）、`js/view/debugLayout.js`（`enemyPartButtons: { child, parent }`（半分の幅2つ）を敵の HP のボタンの下に足し、強化以降・`ruleTop` を1段（`BUTTON_H + GAP` = 104）下げた。型と説明を更新）、`js/scenes/debugTab.js`（2つのボタンを敵の HP の下に足し `debug.zeroEnemyChild()`・`debug.zeroEnemyParent()` につないだ）、`js/scenes/boardDebug.js`（`zeroEnemyChild()`・`zeroEnemyParent()` の口を `debugControls.js` の同名の操作へつなぐ。戻り値は使わない）。各追加に JSDoc。ファイル先頭の責務は変更なし。4ファイルとも構文チェック OK。
    *   確かめ（一時スクリプトと変更前の展開 `git archive c4d8924` はスクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad\` の `t13.mjs`・`new/`・`old/` ほか。リポジトリの外。消していない）:
        *   (1) 代用の `oz`（`Engine`・`Sound` などの最小の代わり）で `BoardScene`・`BoardDebug` を作り、`createDebugTab(debug).build` に部品を記録する代用の領域（`addButton`・`addChoices` などを配列に記録）を渡して組み立てた（部品 136 個、Error 0）。**行動の選択肢**: 猪の親子（ステージ 1。親 22・子 22）に切り替えた局面ごとに、子がいる間は「子の攻撃」「子どもたちを守る」「－」、子を 0 にした怒りでは「突進」「怒りを溜める」「大突進」、親を 0 にした子だけでは「子の攻撃」「－」「－」。押すと予告が替わる（子がいる間: 子の攻撃 = `attack`・variant なし／守る = `guard`・`protect`、これを 6 往復。怒り: 突進 = `attack`/`rush` 量 4、怒りを溜める = `windup`/`rage` 量 0、大突進 = `attack`/`bigRush` 量 16、押した枠が選ばれた表示になる）。子を 0 にした直後は予告が守るのまま（予告は変えない）で、枠にない予告のため選択なし（-1）。**ルールの値**: 組 9 つ・全部で 69 個（`RULE_ITEMS` 69）、猪の親子の組は 11 個（項目名 `maxHpTotal`・`youngAttackMin/Max`・`protectChance`・`protectMin/Max`・`rushMin/Max`・`rageChance`・`bigRushMin/Max`）で、スライダーの表示名は「最大 HP（合計）」「子の攻撃の量 最小/最大」「守る確率」「守るの防御 最小/最大」「突進の量 最小/最大」「怒りを溜める確率」「大突進の量 最小/最大」に時期を付けた形。識別子のままの表示 0（`RULE_ITEM_TEXT` に無い項目名も 0）。ほかの敵の最大 HP は「最大 HP」のまま（8 本 = 城 + 7 種）、合計の表示は猪の親子の1本だけ。7本の猪のスライダーは読み・同じ値を書く操作が Error なく通る。**「子を 0 にする」**: 親 22・子 22 → 親 22・子 0・`hp` 22（予告はそのまま）。子が 0 のとき押しても状態・乱数が変わらない。親が 1 のとき（子 0 で「親を 0 にする」）は親 1・子 0 で `hp` 1。親 0 の子だけで押すと子 1・`hp` 1。**「親を 0 にする」**: 親 22・子 22 で守る予告のとき押すと親 0・子 22・`hp` 22 で、予告は守るでない（子の攻撃 量 2・防御 0）に決め直された。親が 0 のとき押しても何も変わらない。**親子でない敵**（ゴブリン・オーガ・狼・骸骨・スライム・巨人・ドラゴンの7種）に切り替えて2つのボタンを押しても、敵の状態全体と乱数の状態が変わらない（7種とも）。選択肢の枠の数は 3 のまま。**位置**: 部品 57 個（変更前 55 個 + 2）に重なり 0・領域の外 0。変更前の `createDebugLayout`（`git archive c4d8924`）と比べ、敵の HP のボタンまでの 23 個は位置・大きさとも同じ、強化以降の 32 個と `ruleTop`（5048 → 5152）は x・幅・高さが同じで y がちょうど 104 下がった。新しい2つのボタンは y 1872（敵の HP のボタンの下端 1856 の 16 下）・幅 282 の半分2つ・強化の見出し y 1976。
        *   (2) 文字の収まりの見積もり（枠は領域の幅 580（ROW_W）。1文字の幅を全角 36・数字 20・空白 10・半角大文字 24 とする。実際の幅は `oz` が測るのでおおよその値）: 選択肢（3等分で 1 つ 193.3）は「子どもたちを守る」が幅 288 → 縮み 0.67、「怒りを溜める」216 → 0.90、「子の攻撃」「突進」「大突進」は 1.00（比較の既存「攻撃して回復」は 0.90）。ボタン（半分の幅 282）は「子を 0 にする」「親を 0 にする」とも幅 220 で縮み 1.00。ルールの値のスライダーの項目名は「項目名（時期）」の最長が「子の攻撃の量 最小（出てきたときから）」で幅 658 → 全幅に対し 0.88（既存の最長「攻撃後に回復する確率（出てきたときから）」が 720 で 0.81 なので既存より短い）。縮みが目安 0.6 未満になるものはない（枠の左右に空きを 16 ずつ取る仮定にしても「子どもたちを守る」が 0.56 でほかは 0.75 以上。懸念事項に書いた）。
        *   (3) 起動とプレイ: 作業ツリーの `js/` 169 ファイルがすべて個別に読み込める（失敗 0。`main.js` を含む。`document`・`location`・`Engine.start` は代用）。`BoardScene` を実際に操作（札を置く・放つ・BATTLE! の合図・`BattleShowScene`・3択の `UpgradeChoiceScene`）して 60 ターン進め、毎ターン猪の親子にして（倒したあとの別の敵からは DEBUG の口で猪の親子に戻した。14 回）、ターンごとに「子を 0 にする」「親を 0 にする」の押し・行動の選択肢の押しを交互に挟んだ。攻防は 60 回、ステージ 16 まで進み、Error 0・`save`/`restore` 7,488,085 回ずつで釣り合う（画面の積み重ねの全部の `draw`）。通った局面: 子がいる間の子の攻撃・守る（防御 5〜8）、怒りの突進・怒りを溜める、子を 0 にしたあとに残った守る・子の攻撃の予告。

### タスク14: 敵の絵 — 3択の「次の敵」と結果の画面の猪の親子
*   **作業内容** :
    *   `js/view/enemyPortrait.js`: 定数 `BROOD_PORTRAIT`（凍結。`parentScale` 0.8・`youngSize` 0.3・`young` 3つ `{ x: 0.14, y: 1 }`・`{ x: 0.32, y: 1 }`・`{ x: 0.23, y: 0.9 }`）と型 `BroodPortrait` を足した。`drawEnemyPortrait` は、群れの絵（`hordeSkinOf`）と絵（`battleLayout.enemyFigures[typeId]`）の両方を持つ敵のとき、親の絵を矩形の右下にそろえた幅・高さ 0.8 倍の矩形に `drawSpriteFit` で描き、その手前に子を3体（大きさ = 矩形の高さ × 0.3、足元は矩形に対する割合）`drawTroopFigure` で描く。`horde` は使わない。片方だけ持つ敵の分岐は元のまま。先頭の責務・関数の JSDoc を更新。構文チェック OK。
    *   確かめ（一時スクリプトと変更前 `git archive c4d8924` の展開 `t10/base` は、スクラッチ `C:\Users\TAKAYU~1.OZA\AppData\Local\Temp\claude\2ccf51d266ca769a\90c1915e-34e3-4ea4-8daa-1704d18d460e\scratchpad`（`t14/p.mjs`・`t14/g.mjs`・`t13.mjs`・`loadall.mjs`）に置き、残してある。リポジトリの外。発注者が消してよい）。
        *   (1) 代用の `ctx` で、`drawEnemyPortrait` を 9 種の敵（7種・猪・存在しない識別子）× 3つの矩形（3択の次の敵 x210 y184 w300 h160 と群れの並び・結果の倒した敵 64×64 と `PORTRAIT_HORDE`・負けた敵 120×100 と `LOST_HORDE`）で呼び、全 `ctx` 呼び出しの SHA-1 を変更前（`t10/base`）と作業ツリーで比べた。ゴブリンの軍勢・オーガの軍勢・狼・骸骨の軍勢・スライム・巨人・ドラゴン・存在しない識別子は 24 通りすべて一致（`save`/`restore` の不釣り合い 0）。猪だけが変わった（変更前は絵だけの 154 回、今は親の絵＋うり坊 3 体で 625 回。3つの矩形とも）。
        *   (2) 猪の親子の3つの矩形で、親の絵の `drawSpriteFit` の矩形は右下にそろった 0.8 倍（3択 x270 y216 w240 h128、結果の倒した敵 x32.8 y112.8 w51.2 h51.2、負けた敵 x54 y70 w96 h80。どれも矩形の中）。うり坊の足元は 3択 (252,344)・(306,344)・(279,328)、倒した敵 (28.96,164)・(40.48,164)・(34.72,157.6)、負けた敵 (46.8,150)・(68.4,150)・(57.6,140) で、期待値（矩形 x + w×割合、y + h×割合）と一致、大きさは矩形の高さの 0.3 倍（48・19.2・30）。足元はどれも矩形の中。`save`/`restore` は釣り合った（深さ 0・負 0）。
        *   (3) 起動とプレイ: 作業ツリーの `js/` 169 ファイルがすべて個別に読み込める（失敗 0）。`t13.mjs`（`BoardScene` を操作して 60 ターン進め、毎ターン猪の親子にして攻防・3択の `UpgradeChoiceScene` を通す。ステージ 16 まで）を作業ツリーの最新で再実行し、Error 0・`save`/`restore` 12,610,352 回ずつで釣り合い、`bad 0`。

### タスク15: 通しの確かめ（要件5）
*   **作業内容** :
    *   コードは変えていない（`git status` は変更なし）。作業ツリー（コミット `20cf41a` と同じ内容）の `js/` で、要件5の確かめをまとめて行った。一時スクリプト・変更前 `git archive c4d8924` の展開（`t10/base`）・代用の `oz`・出力は、スクラッチ `C:/Users/TAKAYU~1.OZA/AppData/Local/Temp/claude/2ccf51d266ca769a/90c1915e-34e3-4ea4-8daa-1704d18d460e/scratchpad`（`t12/`・`t13.mjs`・`t14/`・出力は `t15/`）に置き、残してある（リポジトリの外。発注者が消してよい）。タスク12・13・14 のスクリプトを作業ツリーの最新で再実行した（`new/` は作業ツリーの `js/`・`assets/` の写しに差し替え、`diff -r` で同一を確認）。
    *   結果（すべて Error 0・不具合なし）:
        *   **HP の分け方**（`t12/boar.mjs`）: ステージ 1・2・6・11・16・30・100・500 で 子 = floor(最大 HP × 50 / 100)・親 = 最大 HP − 子・合計 = 加算後の最大 HP = `hp`。1: 44（22/22）、2: 46（23/23）、6: 55（28/27）、11: 72（36/36）、16: 93（47/46）、30: 167（84/83）、100: 536（268/268）、500: 2648（1324/1324）。見込みと一致。
        *   **予告の割合**（`planIntent` を各 60000 ターン、ステージ 1・30）: 子がいる間は守る 29.95%（17,972 / 60,000）・子の攻撃 70.05%、乱数は毎ターン 2 回。怒りは溜めの抽選をしたターン 37,308 回のうち溜める 30.41%（怒りのターン全体では 18.91%。見込み 18.75%）、溜めの次は必ず大突進（11,346 / 11,346）、大突進の次は必ず突進（11,346 / 11,346）。乱数の回数は 溜めの抽選のターンの突進 2 回・溜める 1 回・大突進 1 回・大突進の次の突進 1 回・開始直後の突進 2 回。子だけは子の攻撃だけ（5,000 / 5,000）で乱数 1 回。量の幅（加算後）: ステージ 1 は子の攻撃 1〜2・突進 4〜6・大突進 13〜16・守るの防御 4〜8、ステージ 30（加算 攻撃 29・防御 12）は子の攻撃 30〜31・突進 33〜35・大突進 42〜45・守るの防御 16〜20。守る以外の防御は 0。
        *   **剣の当たり方の場合分け・数える回数・攻防の時間割**（同スクリプト。133 の場合・時間割 133 件。ふだんのターン（剣 0〜60、精鋭入り、親子の HP 違い）・守る（剣 0〜80、精鋭入り、親子の HP 違い）・怒り（突進・溜め・大突進 × 剣 0〜40）・子だけ・城が落ちる攻防）: 独立に書いた期待値（相殺・ダメージ・当たる順で分けた量と残り）と `enemyBlock`・`enemyDamage`・`parts`・攻防の後の `parts`・`hp` が全部一致。倒した場合は 43 件で、`enemyDefeat` が 1 つだけ・結果の記録の倒した数が 1 増える・`defeat` が入る・スコアが増える。親だけ 0・子だけ 0 では数えない。時間割は Error なく作れ、当たりの段（`part`・量）が出来事の `parts` と同じ、当たりの記録のポイント合計がダメージと同じ、HP の表示値の終わりが結果の HP、`body.partHp` が攻防の後の親と子、絵が倒れるのは親が 0 のときだけで時刻は親の最後の当たりの段の終わり、落ちたうり坊の数が子に当たった量（精鋭なし）、シールドの数が予告の防御・剥がれた数が相殺の量。名簿の体の数の最大は 108。城が落ちる攻防は出来事が `enemyAttack`・`castleDamage`・`lose` で親子の HP は入力のまま（22/22）。検査 1,981 件が通った（fails 0）。
        *   **描く体の数**（自軍の攻撃 60+ステージ・防御 40・修理 5。名簿の体の数）: ステージ 30 は子の攻撃 249（うり坊 83・攻撃のうり坊 31・自軍 135）、守る 236（うり坊 83・シールド 18）、突進・大突進 135（自軍だけ）。ステージ 100 は子の攻撃 592（うり坊 268・攻撃のうり坊 119・自軍 205）、守る 526（うり坊 268・シールド 53）、突進・大突進 205。段取りの間の体の数はうり坊が子の HP の数（ステージ 30 が 83、ステージ 100 が 268）で `hordeSlots` と一致。目安の 500 体は、ステージ 100 の子の攻撃・守る（592・526）が超える（ゴブリンの軍勢のステージ 100 は 740 体で、それより少ない）。
        *   **並ぶ場所の数値**（作業ツリーの表と `groundY` 335）: 群れの足元の範囲 x 565〜685・y 145〜225（h 80）、ステージ 100 のうり坊 268 体の足元 x 565.6〜684.9・y 145.3〜224.9、群れの体の上端 y 121.3。親の絵の矩形 x 552〜688・y 235〜335。群れの足元の最も手前（224.9）は親の矩形の上端（235）より 10px 上で重ならない。攻撃の陣地 x 455〜500、守りの陣地 x 525〜560（右端 560 は親の矩形の左端 552 より 8px 右にかぶる。タスク9・12と同じ）。シールドの並べ先 x 562.2・y 260・w 74.8・h 60、予告の札の基準 x 620・y 60、当たる x 568.32。
        *   **変わっていないこと**（変更前 `c4d8924` と作業ツリーを同じ乱数の状態から `t12/same.mjs`・`t12/full.mjs` で比較）: ほかの7種（ゴブリンの軍勢・オーガの軍勢・狼・骸骨の軍勢・スライム・巨人・ドラゴン）× 種 3 つ × ステージ 1・6・30 の 63 通りの予告・最大 HP・乱数の状態・攻防の出来事・段・時間割の全項目・結果の記録・戦闘の記録・中断データ（版と `parts` を除く）の SHA-1 が 63 通りすべて変更前と一致。★1の並び（10 年分 3,650 日の種 × ステージ 1〜500）の SHA-1 `39cd20e13eef` と敵の種類ごとの回数（猪の親子は 242,725 回）が変更前と一致。`RULE_ITEMS` のほかの敵の項目の識別子の SHA-1 が一致、猪の項目だけ 7 → 11 個（全部 65 → 69 個）、DEBUG の次の行動の選択肢の枠の数は 3 のまま。見た目: 7種 × 乱数の種 2 つ（11・12）の段取りから攻防の演出までの全 `ctx` 呼び出し（約 110 万回ずつ）と待機の伸び縮みの引数の全列の SHA-1 が 14 通りすべて変更前と一致、Error 0・`save`/`restore` の不釣り合い 0。3択の次の敵と結果の画面の絵（`t14/p.mjs`）は、7種と存在しない識別子の 8 種 × 3 つの矩形の 24 通りが変更前と一致し、猪だけが変わった（変更前 154 回 → 今 625 回。3つの矩形とも）。
        *   **中断データ**（`t12/susp.mjs`）: 3つの局面 × 乱数の種 4 つで保存 → `readSuspendData` → `restoreGame` で中断データが完全に一致（乱数の状態・親と子の HP・`lastVariant` まで）、同じ操作（攻防 → 次のフェーズを 6 ターン）で同じ結果。3択の段階（親だけ 1 の猪の親子を倒した後）も保存・戻し・`chooseUpgrade(0)` の結果が一致。版 7。版 6 のデータ（`parts` あり・なし）・形違いの `parts`（合計が `hp` と違う・親子の敵で `null`・親子でない敵で値あり・項目なし・負・小数・余分な項目・配列・文字列）・決まりの状態の形違い・3択の段階でない敵の HP 0 はすべて捨てられる（`null`）。70 件通った。
        *   **焼き付けの一覧・攻撃の音**（`t12/misc.mjs`）: 一覧は 24 件 → 27 件で、増えたのは `uribo`（24px）・`uribo:wounded`（24px）・親のシールドの大きさ（11.968px の1件）。`js/` 配下 169 ファイルがすべて個別に読み込める（失敗 0）。攻撃の音: 猪の親子は子の攻撃（中の種類なし）・怒りを溜める・守る（`protect`）で鳴らず（`null`）、突進・大突進で `giantAttack`。狼 `dragonClaw`・巨人 `giantAttack`・ドラゴン `dragonClaw`・ゴブリン `null` は変更前と同じ。
        *   **描画と起動・プレイ**: (1) 猪の親子の局面 5 通り（親子 22/22・子だけ 0/22・怒り 22/0・5/3・親 1 子 0）を段取りから攻防の演出まで `BoardScene` の `init` → `update` → 積んだ `BattleShowScene` → 次のフェーズで 2 つの乱数の種ずつ進め（`t12/full.mjs` の `SETP`）、すべて Error 0・`save`/`restore` の不釣り合い 0。(2) DEBUG の口で猪の親子に切り替え、攻撃 6・14・25・70 × 種 6 つ × ステージ 1・30・100 の 72 ゲーム（396 回の攻防・246,120 ティックの `update`/`draw`）を数ターン〜倒すまで進め、Error 0・不釣り合い 0（3択の画面に着いたもの 36、結果の画面に着いたもの 24、14 回の攻防の上限 12。倒した記録がついたもの 38）。予告は子の攻撃・守る・突進・怒りを溜める・大突進のすべてが現れた（`t12/play.mjs`）。(3) 実際の操作で 60 ターン（札を置く・放つ・BATTLE! の合図・3択）を毎ターン猪の親子で進め（14 回切り替え直し）、ステージ 16 まで、Error 0・`save`/`restore` 12,610,352 回ずつで釣り合う（`t13.mjs`。子を 0 にする・親を 0 にするの押しと行動の選択肢の押しを交互に挟む）。(4) DEBUG タブ（`t13.mjs`）: 猪の親子の行動の選択肢が局面ごとに出て押すと予告が替わる・ルールの値が 69 個で猪の親子の 11 個が日本語の項目名・2つのボタンの効き・親子でない敵では何も起きない・下の部品が 1 段（104）下がり重なり 0。(5) 3択・結果の画面の猪の親子の絵（`t14/g.mjs`）: 親の絵の矩形が右下にそろった 0.8 倍（3択 x270 y216 w240 h128 ほか）、うり坊 3 体の足元が期待値どおり、矩形の中に収まり、`save`/`restore` が釣り合う。
    *   **発注者に依頼するテストプレイ（REQ【テストプレイで確かめること】1〜11 の写し）**:
        1. 出たとき: `?debug` で猪の親子に切り替えると、中くらいの猪（親）とうり坊の群れ（HP の半分の数）が並び、名前が「猪の親子」と出る。HP は合計で出る。
        2. ふだんのターン: 予告は子の攻撃（1〜2）で、うり坊が城へ向かう。親は動かない。剣はうり坊に当たり、うり坊を倒しきった余りは親に当たる。
        3. 「子どもたちを守る」ターン: 予告は防御だけ（4〜8）で、親の前にシールドが出て、うり坊は攻撃しない。防御を越えた剣は親に当たり、親を倒しきった余りはうり坊に当たる。
        4. 子を倒しきった後: 次のターンから親が毎ターン突進する。ときどき溜めのターン（予告に「怒り」・防御 0）が来て、次のターンに大突進する。
        5. 親を先に倒した後: 親が消え、うり坊が残ってふつうの攻撃だけを続ける。
        6. 決着: 親とうり坊の両方がいなくなると「〜を倒した！」が出る。スコアの内訳・結果の画面の倒した数は 1 体分として出る。
        7. DEBUG: 「敵の次の行動」で5つの行動を（今の局面でできるものだけ）選べる。「子を 0 にする」「親を 0 にする」で局面を試せる。ルールの値のスライダーと「元に戻す」が効く。
        8. 敵の絵: 3択の「次の敵」と結果の画面で、猪の親子の絵が親子だと分かる。
        9. 崩れないこと: 親・うり坊・攻撃のうり坊・予告の札・HP の表示が重なりすぎない。ステージ 20〜30 の猪の親子で、崩れない・重くならない。
        10. 中断と再開: 途中で閉じて「再開」しても、親とうり坊の HP・怒りが同じように残り、続きから遊べる。
        11. ほかの敵と通しのプレイ: ほかの敵（ゴブリン・オーガ・狼・骸骨・スライム・巨人・ドラゴン）の見た目と動きは前と変わらない。同じ日付なら、猪が出ていたステージに猪の親子が出る。タイトルから負けまで、PC とスマホで通しで遊べる。
    *   **目視が要る所**（数値・呼び出しの並びでは確かめられない）: (a) 親の絵の奥のうり坊の群れ、親の左の攻撃のうり坊の陣地、守りのうり坊の右端（x 560）と親の絵（左端 552）の 8px の重なり、予告の札・HP の表示との重なり（テスト 9）。(b) 予告の札の「怒り」の文字（22px・橙・縁取り）の大きさ・読みやすさ・札の幅（テスト 4）。(c) 3択の「次の敵」・結果の画面の猪の親子の絵（親の手前左下のうり坊 3 体。結果の倒した敵の矩形 64×64 ではうり坊 19.2px）（テスト 8）。(d) 親の前のシールドの見え方・親が倒れた後のうり坊だけの画面・子が 0 の怒りの親だけの画面（テスト 3・4・5）。(e) うり坊の仮の絵（猪のコピー）が足元から約 3px 浮いて見える点。(f) DEBUG の「子どもたちを守る」の文字の縮み（約 0.67）・ステージ 100 近くの重さ（体 592 体）。(g) 攻撃の音（子の攻撃で鳴らさない案でよいか。5章の発注者への確認の点）。

### タスク16: 開発資料の更新（固定タスク）
*   **作業内容** :
    *   2章の『開発資料の更新予定』と各タスクの追記（追加なしの旨）を確かめ、`PROJECT_ARCHITECTURE.md` だけを更新した（コード・`_doc/`・`README.md` は変えていない）。書いた内容は `config.js`・`enemyParts.js`・`suspendData.js`・`enemyShows.js`・`hordePlaces.js`・`soundCues.js` などの実ファイルと突き合わせた（猪の行・`SUSPEND_VERSION` 7・`RULE_ITEMS` 69 個・`isEnemyPartsShape` の形の確かめ・`BADGE_LABEL_*`・`motionKeyOf`）。
    *   1章: スプライトの決まり・一覧に `unit_uribo.js`（うり坊）を足し、猪を猪の親に。戦闘の段の説明に、うり坊の群れ・陣地（x 565〜685・y 145〜225、`area.h`）、猪の親子の予告の札（大突進は赤・「怒り」の文字・札の高さは群れの敵と同じ・数え下ろしなし）を足した。
    *   2章: 「敵」の状態に `parts`、行動の決まりを6種類にして `brood` の項（局面・行動・乱数・状態 `lastVariant`）を足し、狼だけの溜めて大攻撃に直した。並びの組の鍵（`motion`・`motionKeyOf`）、防御なし・隙の一覧、予告の中の種類（`protect`・`rush`・`rage`・`bigRush`）、設定の項（`motion`・`brood`・65 → 69 個）、攻防の出来事の並び（`enemyDamage.parts`・入力・結果の `enemyParts`）、中断データ（版 7・`parts`）を更新。新しく「**親と子を持つ敵（猪の親子）**」の項（HP の分け方・局面・当たる順・倒したのは1回・体の見せ方）を足した。「**敵の種類を足すときに書き足す所**」に、親と子を持つ敵を足すときの項（体の形・HP の分け方・当たる順・局面・演出・絵・中断データ）を足した。
    *   3章: デバッグ（敵の次の行動の局面ごとの選択肢・HP の「1 にする」「満タンにする」の親子の扱い・「子を 0 にする」「親を 0 にする」・最大 HP を変えたときの親と子の合わせ方・69 個）、1フェーズの流れの1・4（猪の溜めの数え下ろしを外し、猪の親子の見せ方・攻撃の音の行を足した）。
    *   4章の表: 新しい行 `enemyParts.js`・`bodyHp.js`、更新の行（`config.js`・`combatants.js`・`enemyBehaviors.js`・`enemyTypes.js`・`debugIntents.js`・`debugControls.js`・`debugRules.js`・`debugRuleItems.js`・`suspendData.js`・`battle.js`・`Game.js`・`enemyShows.js`・`enemyBody.js`・`battleSteps.js`・`battleTimeline.js`・`enemyIdle.js`・`spriteView.js`・`hordePlaces.js`・`enemyFigures.js`・`hordeSkins.js`・`battleText.js`・`intentView.js`・`enemyView.js`・`enemyPortrait.js`・`debugText.js`・`debugLayout.js`・`debugTab.js`・`boardDebug.js`・`BoardScene.js`・`soundCues.js`）。
    *   共通の作業: コードは変えていないので構文チェックは不要。
    *   （diff 監査の修正）3章デバッグの見出し並びの「猪」を「猪の親子」に、2章の HP の分けの「奇数なら親が1多い」を猪の親子（`childPercent` 50）の場合と分かる書き方に、1章の予告の札の「橙の縁取りの「怒り」」を「縁取りのある橙の「怒り」」に直した。

## 5. 懸念事項・要確認ポイント
* （計画時）並ぶ場所は、親の絵の奥（上）にうり坊の群れ、親の左に攻撃のうり坊の陣地とした（要件3）。ふだんのターンに剣の兵がうり坊へ向かうとき、親の絵の後ろを通って見える。重なり・見え方は試遊で確かめ、`HORDE_PLACES.boar`・`ENEMY_FIGURES.boar` の値で直す。
* （計画時）うり坊の仮のスプライトは猪のコピーで横長（幅 : 高さ ≈ 1.36 : 1）。群れの体は長い方の辺を 24px にして体の中心を足元から 12px 上に置くので、足元から約 3px 浮いて見える。発注者がうり坊を描き直すとき、`SPRITE_TABLE` の `uribo` の行を合わせる（必要なら `HORDE_PLACES.boar` の `size` も見直す）。
* （計画時）ステージ 100 ほどでは、うり坊 268 体＋攻撃のうり坊 約 119 体＋自軍の兵で、目安の 500 体に近いか超える見込み（ゴブリンの軍勢の同じステージと同じくらい）。タスク12・タスク15で数えて書く。
* （計画時）DEBUG の「子どもたちを守る」は3つ並びの選択肢の1つ分の幅に入るので、文字が縮む見込み。タスク13で見積もる。
* （計画時・**発注者に確かめてもらう点**）子の攻撃（子がいる間のふだんのターンと、子だけのターンのうり坊の攻撃）では、攻撃の始まりの音を鳴らさない計画にした（`ENEMY_ATTACK_SE.boar` を `{ rush: 'giantAttack', bigRush: 'giantAttack' }` にして `default` を外す。ゴブリンの攻撃と同じ）。今の猪はどの攻撃でも `giantAttack` が鳴る（`soundCues.js` の `ENEMY_ATTACK_SE.boar` = `{ default: 'giantAttack' }`）。REQ は「BGM・当たりの音は今の猪と同じで、新しい音は作らない」としか書いていないため、子の攻撃でも今の猪と同じく `giantAttack` を鳴らすか、鳴らさないかを発注者に確かめてもらう。鳴らすなら、タスク12で `default: 'giantAttack'` を足すだけで済む（ほかは変わらない）。
* （計画時・持ち越し）タスク7で体の見せ方に `'brood'` が増えるが、`js/anim/impactLog.js` の `recordStepImpacts` の JSDoc（引数 `bodyStyle` の説明「敵の体の見せ方（'horde'・'figure'）」）は古いままになる。このファイルは本 REQ の変更対象ではないのでコードは変えない（引数は今は使わない＝動きは変わらない）。次に `impactLog.js` を触る REQ で `'brood'` を足す。
* （タスク3）`computeBattle` の `enemyParts` の入力は、`battlePartsOf` が返す `{ hp, order }` の形をそのまま渡す（`order` は予告の `kind` ごとに `Game.resolveBattle` が求める）。`enemyDamage.parts` は親子の敵だけに付くので、演出（タスク7）は `parts` の有無で親子かを決めず、体の見せ方（`body: 'brood'`）で決めること。
* （タスク3）攻防の後の局面は `Game.resolveBattle` が `enemy.parts` を更新した時点で変わるが、予告はターンの始まり（`planIntent`）でだけ読むので、攻防の結果の画面を見ている間の予告（`enemy.intent`）は前の局面のまま。タスク10以降で画面が `enemy.intent` と `enemy.parts` を同時に読むときは、結果の画面では `parts` が新しい局面、予告が古い局面になる点に注意（試遊で確かめる）。
* （タスク5）`zeroEnemyChild`・`zeroEnemyParent` は、押しても何も変わらないとき（その部分が 0、または 1 を残す場合で今の値が同じ）は false を返し何もしない（要件4に戻り値の決まりがないため、ほかの操作の「書き換えたら true」に合わせた）。タスク13のボタンは戻り値を使わない想定。
* （タスク5）`zeroEnemyParent` の決め直しは「今の予告が今の局面でできない行動」ならいつも行う（親を 0 にして子だけになるときに限らない）。例: 子を先に 0 にした怒りの局面（子の攻撃・守るの予告のまま）で親を 0 にしようとして親 1 に落ちるときも、今の局面の `rush`/`rage`/`bigRush` でないので決め直す（乱数を呼ぶ）。
* （タスク5）`fitPartsToMax` は親と子をそれぞれの新しい最大で頭打ちにするので、合計が新しい最大より小さくても、片方が新しい最大を超えるときはその分下がる（例: 親 22・子 5 を最大 20 に → 親 10・子 5、HP 15）。要件4の「親と子をそれぞれ新しい最大で頭打ち」のとおり。
* （タスク5）DEBUG の文字（`debugText.js`）が入る（タスク13）までは、猪の親子の行動・項目名は識別子のまま出る。`RULES` の猪はタスク12まで `brood` を持たないので、DEBUG タブの今の見え方は変わらない。
* （タスク6）`isEnemyPartsShape` は余分な項目（`parent`・`child` 以外）を持つ `parts` も形違いとして捨てる（要件に明記はないが、`structuredClone` で写して使うので、保存したものと同じ形だけを通す側に寄せた）。親子の敵は `parts` の `hp` との合計だけでなく、最大 HP との比べ（各部分 ≤ 最大）は行わない（`check` は設定の数値と比べない決まり。開発資料 2章「中断データ」）。
* （タスク6）`SUSPEND_VERSION` が 7 になったので、版 6 で保存された中断データは、次に遊ぶとき一度だけ捨てられて新しく始まる（`readSuspendData` が `null`）。開発資料の更新予定（2章「中断データ」の版 7・`parts`）はすでに書いてあるとおりで、追加はない。
* （タスク7）`createEnemyBody` の絵の倍率は、親子の体では子の数でなく合計の `hp`・`maxHp` で求める（要件3の「今の絵の敵と同じ式」。猪の `minScale` は 1 なので 1 のまま。`minScale` が 1 未満の親子の敵を足すときは、親の HP の割合で縮めるかを決め直す）。
* （タスク7）`BODY_SETUPS.brood` は `horde` の行と `figure` の行を呼び出して合成する（体の記録の項目を足すときは3つの行を同時に見る）。親が 0 のときの `shieldArea` は `null` で、親のいない守るターンはシールドを置かない（親を 0 にした後の予告の決め直しはタスク5で済み。ルール層が親 0 の守るを出さない前提）。親が 0 のとき `partHp.parent` への当たり（`part: 'parent'`）が来ると絵の記録がないので Error になる（ルール層の `parts` の量が 0 でない親への当たりは親が 0 で出ない）。
* （タスク7）猪の親子の攻防の演出は、見せる表の猪の行（タスク12）が入るまでは作業ツリーでは起きない（猪の `parts` が `null` で、`ENEMY_SHOWS.boar` も `figure` のまま）。確かめはスクラッチの写しでだけ行った。写しの `HORDE_SKINS.boar` は `SPRITE_IDS.goblin` で代用し、`area.h` は効かないので、群れと親の絵の重なり・うり坊の見え方は未確認（タスク9・12で数値と試遊で見る）。
* （タスク7）`BODY_SETUPS.brood` の群れは `hordeSlots(typeId, 数)` を使うので、`HORDE_PLACES.boar` の行がないと Error になる（タスク12で見せる表をそろえるまで、作業ツリーでは呼ばれない）。
* （タスク9）`area.h` は群れの範囲だけに効き、攻撃・守りの陣地の高さは足元の範囲いっぱい（190）のまま。見込みの値（群れ x 565〜685・y 145〜225、親の矩形 x 552〜688・y 235〜335）は実際の `groundY` 335・`fieldH` 190 で一致した。ただし守りの陣地（x 525〜560・y 145〜335）の右端は親の矩形の左端 552 より 8px 右にかぶる。守りのうり坊は足元がこの範囲に入るため、親の絵の左下に少し重なって見えるかもしれない。タスク12の試遊で見て、重なるなら `HORDE_PLACES.boar.enemyGuard` の x・w を左へ寄せる（例: x 515・w 30 で右端 545）。
* （タスク9）`createHordePlaces` の `area.h` は上限（`min`）としてだけ使うので、足元の範囲の高さ − 削る量を超える `h` を書いても範囲は広がらない。
* （タスク8）`unit_uribo.js` は、変更前の `unit_boar.js` が行の終わりを混在させていたかのように見える表示（`file` コマンド）が出たが、実際には CR を含まないファイルで、コピーは `unit_boar.js` と同一のバイト列（違いは先頭の説明の1行目だけ）。`uribo` の `SPRITE_TABLE` の行は猪と同じ値のまま。発注者が描き直して同じ名前で上書きしたら、`SPRITE_TABLE` の `uribo` の行を新しい `bounds` に合わせる（群れの体は長い方の辺を `size` にして描くので、縦横比が変わっても大きさの決め方は同じ）。`uribo` は `HORDE_SKINS` にまだないので焼き付けの一覧には入らない（タスク12で入る）。
* （タスク10）`enemyView.js` の段取りの間は「群れの絵を持つなら群れ、続けて絵を持つなら絵」の順で、群れが奥・絵が手前。今の8種は片方しか持たないので描き方は変わらない（ctx 呼び出しの完全一致で確かめた）。絵の体の大きさ（`bodyScale`）は今のまま `enemy.hp`（合計）と最大 HP で求めるが、猪の `minScale` は 1 なので親子では常に倍率 1。`minScale` が 1 未満の親子の敵を足すときは、`figureHpOf` と親の最大 HP で求める必要がある。
* （タスク10・目視確認を推奨）うり坊の群れ（奥）と親の絵（手前）の重なり・並びの見え方、子だけ（絵なし）・怒り（群れなし）の局面の段取りの画面は、タスク12で猪の行を切り替えた後に試遊で確かめる。子だけで守るの予告が残るときは親のシールドマークは描かれない（絵がないため）。DEBUG の「親を 0 にする」は守るの予告を決め直す（タスク5）。
* （タスク11）「怒り」の文字は絵の右・量の数字と同じ位置に出すので、札の幅は「怒りを溜める」の予告で 12 + 40 + 4 + 文字の幅になる。文字の大きさ（22px）・色（橙）・札の幅は試遊で目で確かめ、足りなければ `intentView.js` の `BADGE_LABEL_FONT`・`BADGE_LABEL_COLOR` を直す。
* （タスク12・目視確認を推奨）猪の行を切り替えた後の見え方は試遊で確かめる。うり坊の群れ（奥）と親の絵（手前）の重なり、子だけ（絵なし）・怒り（群れなし）の局面、守るターンの親の前のシールド、ふだんのターンでうり坊が画面の外から出て城へ向かう動き。数値では、群れの足元の範囲（y 145〜225）と親の矩形（y 235〜335）は重ならない（10px 空く）が、守りの陣地の右端 560 は親の矩形の左端 552 より 8px 右にかぶる（タスク9と同じ）。守りのうり坊が親の左下に重なって見えるときは `HORDE_PLACES.boar.enemyGuard` の x・w を左へ寄せる（例: x 515・w 30）。
* （タスク12）3択の画面の「次の敵」と結果の画面の猪の親子の絵は、切り替えの後はタスク14が入るまで `hordeSkinOf` だけを見る今の `enemyPortrait.js` で描かれるので、うり坊の群れだけになる（絵の親は描かれない）。壊れはしない（タスク11までの確かめと同じ）。DEBUG タブの猪の親子の行動・項目名は、タスク13が入るまで識別子のまま出る。
* （タスク12・発注者に確かめてもらう点の実施内容）攻撃の音は、計画どおり `ENEMY_ATTACK_SE.boar` を突進・大突進だけにした（子の攻撃・守る・怒りを溜めるでは鳴らさない）。今の猪と同じく子の攻撃でも `giantAttack` を鳴らすなら、`{ default: 'giantAttack', rush: 'giantAttack', bigRush: 'giantAttack' }` にするだけ（`default` の行を足すだけで、ほかは変わらない）。発注者の答えで決める。
* （タスク12）描く体の数は、ステージ 100 の子の攻撃（592 体）・守る（526 体）が目安の 500 体を超えるが、同じ条件のゴブリンの軍勢のステージ 100（740 体）より少ない。突進・大突進のターンは自軍だけで 205 体。重さが気になるときは試遊で確かめる。
* （タスク12）焼き付けの一覧が 24 件から 27 件に増えた（`uribo`・`uribo:wounded`・親のシールド 1 件）。猪の親の絵は `shield` を持つようになったため、盤面の起動時の焼き付けに1枚増える（シールドは `bakeSizes` が絵の敵のシールドの並べ先ごとに大きさを焼き付ける）。
* （タスク12）今の猪の「溜めて大攻撃」（`buildup`）の設定を使う敵は狼だけになった。猪の中断データは、版が 6 → 7 に上がっているので（タスク6）、切り替え前に保存された中断データは次に遊ぶとき一度だけ捨てられる。
* （タスク13）DEBUG の選択肢「子どもたちを守る」は3つ並びの1つ分の幅（193.3）に対し文字の幅が約 288 で、縮みは約 0.67（枠の左右に空きを 16 ずつ取るなら約 0.56）。目安 0.6 を切る可能性があるので、試遊で読めるかを目で確かめる（読みにくければ `INTENT_CHOICE_TEXT.protect` の文言を短くする。要件4で決めた文言のまま）。文字幅は見積もり（`oz` が実際に測る）。
* （タスク13・目視確認を推奨）DEBUG タブで強化・FPS・ルールの値が「子を 0 にする」「親を 0 にする」の分だけ1段（104）下がった。スクロールの長さが少し増える。ボタンはどの敵でも出る（親子でない敵では押しても何も起きない）。
* （タスク13）ルールの値のスライダーの時期の表示は、今の敵の最大 HP だけ「すぐ」、ほかの敵は「出てきたときから」（もとからの `debug.ruleTiming` の動き）。このため猪の親子が今の敵でないときの表示は「最大 HP（合計）（出てきたときから）」になる。
* （タスク13）子を 0 にした直後は予告が守る（または子の攻撃）のままで、行動の選択肢には出ない（局面でできる行動だけ）ので、どの枠も選ばれていない表示（-1）になる。要件4（予告は変えない）のとおり。
* （タスク13・開発資料の更新予定）追加なし（2章「設定（調整値）」・3章「デバッグ」の予定に、ボタンの下の部品が1段下がる点は含まれていないが、配置の数値は資料に書かない内容のため不要と判断）。
* （タスク14・目視確認を推奨）3択の「次の敵」と結果の画面（倒した敵の並び・負けた敵）の猪の親子は、親の絵（右下）の手前左下にうり坊 3 体が重なって並ぶ。うり坊が親に隠れる・小さすぎる（倒した敵の矩形 64×64 でうり坊 19.2px）などは試遊で確かめ、`BROOD_PORTRAIT` の値で直す。3択の画面では、群れの敵が使う `NEXT_ENEMY_HORDE`（体 96px・3体）は猪の親子では使われない（親子の敵は `horde` を使わない）。
* （タスク14・開発資料の更新予定）追加なし。
* （タスク15）不具合は見つからなかった（すべての確かめが通り、直しが要るタスクはない）。確かめでコードは変えていない。
* （タスク15・目視確認を推奨）目視が要る所は4章タスク15の「目視が要る所」(a)〜(g) にまとめた（重なり・「怒り」の文字・敵の絵・うり坊の浮き・DEBUG の文字の縮み・ステージ 100 付近の重さ・攻撃の音）。
* （タスク15）描く体の数は、ステージ 100 の子の攻撃 592 体・守る 526 体で目安の 500 体を超える（ゴブリンの軍勢のステージ 100 は 740 体）。実機（スマホ）の重さは試遊で確かめる。
* （タスク15・開発資料の更新予定）追加なし（2章の更新予定のとおり）。
* （タスク16）資料の「うり坊の守りの陣地は x 525〜560」は設定値のとおり書いた。親の絵の左端（552）との 8px の重なりは試遊の確認事項（タスク9・12の懸念）のままで、資料には数値だけを書き、重なりの評価は書いていない。ほかに判断に迷った点はない。
