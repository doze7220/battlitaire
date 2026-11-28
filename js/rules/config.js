/** ルールの調整値（スート・数字の範囲・数字の一周・列の数・手札の枠の数・行動回数・束の補正（足す量）の係数、城の数値、敵の種類ごとの数値（名前・最大 HP・1体のポイント（任意）・防御（張る確率と量の幅）・行動の決まり（毎ターン攻撃と防御・毎ターン攻撃だけ（防御しない）・周期の攻撃と攻撃の直後の回復・吸い込んでからのブレス（爪・ブレス・燃やす札の枚数・吸い込む確率）・溜めてからの大攻撃・攻撃か防御のどちらか・混乱の周期（強い攻撃か厚い守り・列の印）・親と子（猪の親子。子の攻撃・守る・突進・怒りを溜める・大突進）。親と子の HP の分け方と当たる順 `brood`・分裂（子が生まれる割合）`split`・並びの組の鍵 `motion` も敵の設定に持つ）と攻撃・防御の量の幅）、敵の★とステージの★の抽選の決まり（上がる量・戻る★・最初の1体）、ステージごとの敵の加算量（章ごと）、力こぶの換算、激昂（長引いた戦闘で敵の攻撃が上がる倍率）、4スートそろいの加算量、3択の強化の枠・候補の数・城の修理の割合・強化の種類ごとの設定（城・カード・特別の強化）、点の項目の設定）を1か所に集める設定ファイル。 */

/**
 * 行動の量の幅（予告を決めるたびに、この中から整数を1つ抽選する）。
 * @typedef {Object} AmountRangeSpec
 * @property {number} min 量の最小（整数）。
 * @property {number} max 量の最大（min 以上の整数）。
 */

/**
 * 敵の防御（そのターンだけの防御の量）の設定。
 * @typedef {Object} EnemyDefenseSpec
 * @property {number} chance 防御を張る確率（0〜1）。
 * @property {Readonly<AmountRangeSpec>} range 防御の量の幅。
 */

/**
 * 激昂の設定（戦闘のターンが fromTurn 以上のとき、予告の攻撃の量に倍率をかける）。
 * 倍率（百分率）= 100 + stepPercent × (戦闘のターン − fromTurn + 1)。
 * @typedef {Object} RageSpec
 * @property {number} fromTurn 激昂が始まる戦闘のターン数（1 以上の整数）。
 * @property {number} stepPercent 激昂の1ターンごとに上がる倍率の量（百分率の整数。0 以上）。
 */

/**
 * 攻撃の直後の回復の設定。
 * @typedef {Object} AttackHealSpec
 * @property {number} chance 回復する確率（0〜1）。
 * @property {number} amount 回復の量。
 */

/**
 * 燃やす札の枚数の範囲。
 * @typedef {Object} BurnSpec
 * @property {number} min 燃やす札の最小の枚数。
 * @property {number} max 燃やす札の最大の枚数（min 以上の整数）。
 */

/**
 * ドラゴンの爪の攻撃の設定。
 * @typedef {Object} ClawSpec
 * @property {Readonly<AmountRangeSpec>} range 爪の攻撃力の幅。
 */

/**
 * ドラゴンのブレスの攻撃の設定。
 * @typedef {Object} BreathSpec
 * @property {Readonly<AmountRangeSpec>} range ブレスの攻撃力の幅。
 * @property {Readonly<BurnSpec>} burn ブレスで燃やす札の枚数の範囲。
 */

/**
 * 敵の行動の決まりの設定。
 * @typedef {Object} EnemyBehaviorSpec
 * @property {'steady'|'assault'|'cycle'|'inhale'|'buildup'|'either'|'brood'|'confuse'} type 行動の決まりの種類（'steady'＝毎ターン攻撃、'assault'＝毎ターン攻撃だけ（防御しない）、'cycle'＝周期の攻撃、'inhale'＝吸い込んでからブレス、'buildup'＝溜めて大攻撃、'either'＝攻撃か防御のどちらか、'brood'＝親と子の局面ごとの行動、'confuse'＝混乱の周期（ふつうのターンは攻撃と防御、混乱のターンは強い攻撃か厚い守りに列の印を付ける））。
 * @property {Readonly<ClawSpec>} [claw] 爪の攻撃（'inhale' のみ）。
 * @property {Readonly<BreathSpec>} [breath] ブレスの攻撃と燃やす札（'inhale' のみ）。
 * @property {number} [inhaleChance] 直前の予告が吸い込む・ブレスでないとき、フェーズごとに吸い込むを予告する確率（0〜1。'inhale' のみ）。
 * @property {number} [cycleLength] 1周期のフェーズ数。最後のフェーズで攻撃、ほかは振りかぶり（'cycle' のみ。1以上の整数）。
 * @property {Readonly<AmountRangeSpec>} [attackRange] 周期の最後のフェーズの攻撃の量の幅（'cycle'）、または毎ターンの・ふつうの攻撃の量の幅（'steady'・'assault'・'buildup'・'either'）、子の攻撃の量の幅（'brood'）、ふつうのターンの攻撃の量の幅（'confuse'）。
 * @property {Readonly<AmountRangeSpec>} [heavyRange] 大攻撃の量の幅（'buildup'）、混乱のターンの強い攻撃の量の幅（'confuse'）。
 * @property {number} [chargeChance] 溜めていないターンに溜めるを予告する確率（0〜1。'buildup' のみ）。
 * @property {number} [chargeTurns] 溜めのターン数（1以上の整数。溜めてから大攻撃までのターン数。'buildup' のみ）。
 * @property {number} [attackChance] 攻撃を予告する確率（0〜1。外れたら防御だけ。'either' のみ）。
 * @property {Readonly<AmountRangeSpec>} [guardRange] 防御だけの行動の防御の量の幅（加算の前。'either' のみ）。
 * @property {number} [bigGuardChance] 防御だけの行動のうち、大防御にする確率（0〜1。'either' のみ）。
 * @property {Readonly<AmountRangeSpec>} [bigGuardRange] 大防御の防御の量の幅（加算の前。'either'）、混乱のターンの厚い守りの防御の量の幅（加算の前。'confuse'）。
 * @property {number} [heavyChance] 混乱のターンを強い攻撃にする確率（0〜1。外れれば厚い守り。'confuse' のみ）。
 * @property {Readonly<AmountRangeSpec>} [firstConfuseTurn] その戦闘で最初に混乱するターンの幅（1 以上の整数。'confuse' のみ）。
 * @property {Readonly<AmountRangeSpec>} [confuseInterval] 混乱のターンから次の混乱のターンまでのターン数の幅（1 以上の整数。'confuse' のみ）。
 * @property {Readonly<AttackHealSpec>} [attackHeal] 攻撃の直後の回復（任意。書かなければ回復しない）。
 * @property {number} [protectChance] 子がいる間、毎ターン「子どもたちを守る」を予告する確率（0〜1。'brood' のみ）。
 * @property {Readonly<AmountRangeSpec>} [protectRange] 守るの防御の量の幅（加算の前。'brood' のみ）。
 * @property {Readonly<AmountRangeSpec>} [rushRange] 怒った親の突進の量の幅（'brood' のみ）。
 * @property {number} [rageChance] 怒りを溜めるを予告する確率（0〜1。'brood' のみ）。
 * @property {Readonly<AmountRangeSpec>} [bigRushRange] 大突進の量の幅（'brood' のみ）。
 */

/**
 * 親と子を持つ敵の設定。
 * @typedef {Object} EnemyBroodSpec
 * @property {number} childPercent 子の HP の割合（0〜100 の整数。子 = floor(最大 HP × childPercent / 100)、親は残り）。
 * @property {Readonly<Object<string, ReadonlyArray<'parent'|'child'>>>} hitOrder 予告の kind から、剣の当たる順への対応。`default` は必須。
 */

/**
 * 分裂（次のターンに持ち越す攻撃のユニット「子」を持つ敵）の設定。
 * @typedef {Object} EnemySplitSpec
 * @property {number} percent 与えたダメージに対する、生まれる子の数の百分率（0〜100 の整数。数は切り上げ）。
 */

/**
 * 敵の種類の設定。
 * @typedef {Object} EnemySpec
 * @property {string} name 敵の名前（表示用）。
 * @property {number} star 敵の★（★の抽選の設定 `stageStars` に書いた★（`base` と `draws` の `star`）のどれか。ステージの★と同じ敵の中から選ばれる）。
 * @property {number} maxHp 敵の元の最大 HP（ステージの加算の前）。
 * @property {number} [unitPoints] 1体が受け持つポイント（1 以上の整数。書かなければ 1。HP・攻撃・防御の量はポイントで書き、この倍数にする）。
 * @property {Readonly<EnemyDefenseSpec>} [defense] 防御（ターンごとの張る確率と量の幅）。行動と別に防御を抽選する敵だけが持つ。
 * @property {Readonly<EnemyBehaviorSpec>} behavior 行動の決まり。
 * @property {string} [motion] 並びの組の鍵（任意。書かなければ behavior.type）。
 * @property {Readonly<EnemyBroodSpec>} [brood] 親と子を持つ敵の設定（任意。書かなければ親子でない）。
 * @property {Readonly<EnemySplitSpec>} [split] 分裂の設定（任意。書かなければ子を持たない。ダメージを受けると次のターンに襲う子が生まれる）。
 * @property {boolean} [raise] 亡者の設定（任意。`true` の敵だけ、敵の攻撃で死んだ盾の兵・敵の防御で死んだ剣の兵が、死んだ人数だけ次のターンに襲う子（亡者）になる）。
 */

/**
 * ★の抽選1行分の決まり。ステージごとの当たる確率は、戻ってからのステージ数 × risePercent（百分率の整数。100 で頭打ち）。
 * @typedef {Object} StarDrawSpec
 * @property {number} star 当たったときのステージの★。
 * @property {number} risePercent 1ステージごとに上がる確率の量（百分率の整数）。
 * @property {readonly number[]} resetBy この抽選の確率を 0% に戻す★の並び（その★が出たステージの次が 0%）。
 * @property {string} [first] その★で最初に出る敵の種類の識別子（任意。使うのは敵の並びを決める側。くじ袋では最初の袋の先頭）。
 * @property {string} order その★の敵の並びの決まりの名前（'motion'＝動きの組・'bag'＝くじ袋。stageOrder.js の表で引く）。
 */

/**
 * ステージの★の抽選の決まり（draws を書いた順に抽選し、最初に当たった★にする。どれも外れたら base）。
 * @typedef {Object} StageStarsSpec
 * @property {number} base どの抽選にも外れたステージの★。
 * @property {string} baseOrder base の★の敵の並びの決まりの名前（'motion'・'bag'）。
 * @property {readonly Readonly<StarDrawSpec>[]} draws ★の抽選の並び（書いた順に抽選する）。
 */

/**
 * 章ごとの、1ステージ進むごとの加算量（形は章ごとに書ける。HP・防御は今は全章で同じ値、攻撃だけ章で違う）。
 * @typedef {Object} ChapterGrowth
 * @property {number} hpPercent 敵の最大 HP に足す百分率（整数。1ステージあたり）。
 * @property {number} attack 攻撃の値に足す量（0.01 刻み。1ステージあたり）。
 * @property {number} defense 防御の量に足す量（0.01 刻み。1ステージあたり）。
 */

/**
 * ステージが進むごとの敵の加算の設定。
 * @typedef {Object} StageGrowthSpec
 * @property {number} stagesPerChapter 1章のステージ数。
 * @property {readonly Readonly<ChapterGrowth>[]} chapters 章ごとの加算量（先頭が第1章。最後の要素をそれより先の章でも使う）。
 */

/**
 * 強化の種類の設定。
 * @typedef {Object} UpgradeSpec
 * @property {string} slot 属する枠の識別子（`upgradeSlots` のキー）。
 * @property {number} weight 枠の中で選ばれる重み（0 以上。0 なら出ない）。
 * @property {string} effect 効き方の種類（`upgradeEffects.js` の `UPGRADE_EFFECTS` のキー）。
 * @property {Readonly<AmountRangeSpec>} [range] 3択が出たときに抽選する量の幅（'castleMaxHp'・'actionChance'・'eliteChance'。後ろ2つは確率の百分率の幅）。
 * @property {string} [gauge] 効くゲージの識別子（'autoTroop'＝ターンの頭に足すゲージ、'eliteChance'・'elitePower'＝精鋭になるゲージ）。
 * @property {number} [amount] 取った1回あたりの量（'autoTroop'・'cardSuit'・'cardRank'・'allSuitsBoost'・'comboBoost'・'battleActions'・'handSlot'・'elitePower' が使う）。
 * @property {string} [after] この強化の種類が上限に着いた後だけ出す（`upgrades` のキー）。
 * @property {string} [requires] この強化の種類を1回以上取っているときだけ出す（`upgrades` のキー）。
 * @property {string} [suit] 札の +◯ を足すスート（'cardSuit' のみ）。
 * @property {number} [rank] 札の +◯ を足す数字（'cardRank' のみ）。
 * @property {number} [maxCount] 取れる回数の上限（'allSuitsBoost'・'comboBoost'・'handSlot' のみ）。
 * @property {number} [previewCards] 選択肢の説明に出す束の枚数（'comboBoost' のみ）。
 * @property {number} [maxPercent] 発動率・精鋭の確率の上限の百分率（'actionChance'・'eliteChance'）。
 * @property {number} [actions] 発動で増える行動の数（'actionChance' のみ）。
 */

/**
 * 点の項目の設定の表（敵を倒すたびに、その戦闘から項目ごとの点を出す）。
 * @typedef {Object} ScoreItemsSpec
 * @property {Readonly<{base: number, perStage: number}>} defeat 討伐: base + (ステージの番号 − 1) × perStage。
 * @property {Readonly<{byStar: Readonly<Object<number, number>>}>} strong 強敵: 敵の★ごとの点（表にない★は 0）。
 * @property {Readonly<{base: number, perTurn: number, min: number}>} turns ターン: max(min, base − perTurn × 使ったターン数)。
 * @property {Readonly<{cards: number, points: number}>} combo コンボ: その戦闘で cards 枚以上の区切りを放っていれば points。
 * @property {Readonly<{points: number}>} noDamage 無傷: その戦闘で城が1度も被害を受けていなければ points。
 */

/**
 * ルールの調整値。
 * @typedef {Object} Rules
 * @property {readonly string[]} suits スートの識別子。山札の並び順でもある。
 * @property {number} minRank 各スートのカードの最小の数字。
 * @property {number} maxRank 各スートのカードの最大の数字。
 * @property {boolean} rankWrap 列の一番上が minRank のとき maxRank を置けるか（数字の一周）。
 * @property {number} columnCount 列の数。
 * @property {number} handSize 手札の枠の数。
 * @property {number} visibleCount 山札で表向きに見える枚数。
 * @property {number} baseActions 1フェーズの基本の行動回数。
 * @property {readonly string[]} gauges ゲージの識別子。ゲージの並び順でもある。
 * @property {Readonly<Object<string, string>>} suitGauge スートの識別子から、加算先のゲージの識別子への対応。
 * @property {Readonly<{perCard: number, max: number}>} releaseBonus 放ったときの束の補正の係数。足す量 = min(max, perCard × (同じスートの区切りの枚数 − 1))、加算量 = 合計 + 足す量。
 * @property {number} allSuitsBonus 放った列に suits のすべてのスートが1枚以上あるとき、それぞれのゲージに足す量（0 で効果なし）。
 * @property {number} castleMaxHp 城の最大 HP（ゲーム開始時の HP でもある）。
 * @property {Readonly<Object<string, Readonly<EnemySpec>>>} enemies 敵の種類の識別子から、敵の種類の設定への対応。
 * @property {Readonly<StageStarsSpec>} stageStars ステージの★の抽選の決まり。
 * @property {Readonly<StageGrowthSpec>} stageGrowth ステージが進むごとの敵の HP・攻撃・防御の加算量（章ごと）。
 * @property {readonly string[]} keptGauges フェーズをまたいで値を残すゲージの識別子。
 * @property {Readonly<{gauge: string, per: number, maxBonus: number}>} muscleConversion 力こぶの換算。gauge のゲージが per ごとに行動回数 +1、最大 maxBonus。
 * @property {Readonly<RageSpec>} rage 激昂（長引いた戦闘で敵の攻撃の量に倍率がかかる決まり）。
 * @property {Readonly<Object<string, number>>} upgradeSlots 3択の枠の識別子から枠の重みへの対応（書いた順が枠の並び）。
 * @property {number} upgradeChoiceCount 3択の候補の数。
 * @property {number} castleRepairPercent 城の修理で戻す、最大 HP に対する百分率（整数。量は切り捨て）。
 * @property {number} eliteBasePower 精鋭の能力の初めの値（精鋭1体のポイント = 1 + 能力）。
 * @property {Readonly<ScoreItemsSpec>} scoreItems 点の項目の設定の表（キーは点の項目の識別子。書いた順が内訳の並び。計算は `score.js` の `SCORE_RULES`、文字は `scoreText.js` に同じ識別子で1行ずつ持つ）。
 * @property {Readonly<Object<string, Readonly<UpgradeSpec>>>} upgrades 強化の種類の識別子から設定への対応（書いた順が一覧の並び）。
 */

/**
 * ゲームのルールの調整値（凍結済み）。
 * @type {Readonly<Rules>}
 */
export const RULES = Object.freeze({
  suits: Object.freeze(['sword', 'shield', 'potion', 'muscle']),
  minRank: 1,
  maxRank: 7,
  rankWrap: true,
  columnCount: 4,
  handSize: 1,
  visibleCount: 1,
  baseActions: 5,
  gauges: Object.freeze(['attack', 'defense', 'heal', 'muscle']),
  suitGauge: Object.freeze({
    sword: 'attack',
    shield: 'defense',
    potion: 'heal',
    muscle: 'muscle',
  }),
  releaseBonus: Object.freeze({ perCard: 1, max: 6 }),
  allSuitsBonus: 1,
  castleMaxHp: 50,
  enemies: Object.freeze({
    goblins: Object.freeze({
      name: 'ゴブリンの軍勢',
      star: 1,
      maxHp: 30,
      defense: Object.freeze({ chance: 1, range: Object.freeze({ min: 1, max: 2 }) }),
      behavior: Object.freeze({
        type: 'steady',
        attackRange: Object.freeze({ min: 1, max: 3 }),
      }),
    }),
    ogres: Object.freeze({
      name: 'オーガの軍勢',
      star: 1,
      maxHp: 32,
      unitPoints: 2,
      defense: Object.freeze({ chance: 1, range: Object.freeze({ min: 2, max: 2 }) }),
      behavior: Object.freeze({
        type: 'steady',
        attackRange: Object.freeze({ min: 2, max: 4 }),
      }),
    }),
    wolf: Object.freeze({
      name: '狼',
      star: 1,
      maxHp: 36,
      behavior: Object.freeze({
        type: 'buildup',
        attackRange: Object.freeze({ min: 1, max: 3 }),
        heavyRange: Object.freeze({ min: 7, max: 9 }),
        chargeChance: 0.3,
        chargeTurns: 1,
      }),
    }),
    boar: Object.freeze({
      name: '猪の親子',
      star: 1,
      maxHp: 44,
      motion: 'buildup',
      brood: Object.freeze({
        childPercent: 50,
        hitOrder: Object.freeze({
          guard: Object.freeze(['parent', 'child']),
          default: Object.freeze(['child', 'parent']),
        }),
      }),
      behavior: Object.freeze({
        type: 'brood',
        attackRange: Object.freeze({ min: 1, max: 2 }),
        protectChance: 0.3,
        protectRange: Object.freeze({ min: 4, max: 8 }),
        rushRange: Object.freeze({ min: 4, max: 6 }),
        rageChance: 0.3,
        bigRushRange: Object.freeze({ min: 13, max: 16 }),
      }),
    }),
    skeletons: Object.freeze({
      name: '骸骨の軍勢',
      star: 1,
      maxHp: 24,
      behavior: Object.freeze({
        type: 'either',
        attackChance: 0.4,
        attackRange: Object.freeze({ min: 4, max: 6 }),
        guardRange: Object.freeze({ min: 3, max: 5 }),
        bigGuardChance: 0.2,
        bigGuardRange: Object.freeze({ min: 7, max: 9 }),
      }),
    }),
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
    giant: Object.freeze({
      name: '巨人',
      star: 2,
      maxHp: 60,
      defense: Object.freeze({ chance: 0.75, range: Object.freeze({ min: 2, max: 6 }) }),
      behavior: Object.freeze({
        type: 'cycle',
        cycleLength: 4,
        attackRange: Object.freeze({ min: 18, max: 22 }),
        attackHeal: Object.freeze({ chance: 0.25, amount: 20 }),
      }),
    }),
    mushroom: Object.freeze({
      name: '毒キノコ',
      star: 2,
      maxHp: 56,
      defense: Object.freeze({ chance: 0.75, range: Object.freeze({ min: 2, max: 4 }) }),
      behavior: Object.freeze({
        type: 'confuse',
        attackRange: Object.freeze({ min: 3, max: 5 }),
        heavyChance: 0.5,
        heavyRange: Object.freeze({ min: 8, max: 10 }),
        bigGuardRange: Object.freeze({ min: 8, max: 10 }),
        firstConfuseTurn: Object.freeze({ min: 2, max: 3 }),
        confuseInterval: Object.freeze({ min: 2, max: 3 }),
      }),
    }),
    dragon: Object.freeze({
      name: 'ドラゴン',
      star: 3,
      maxHp: 90,
      defense: Object.freeze({ chance: 0.75, range: Object.freeze({ min: 3, max: 7 }) }),
      behavior: Object.freeze({
        type: 'inhale',
        claw: Object.freeze({ range: Object.freeze({ min: 4, max: 6 }) }),
        breath: Object.freeze({
          range: Object.freeze({ min: 10, max: 13 }),
          burn: Object.freeze({ min: 4, max: 6 }),
        }),
        inhaleChance: 0.3,
      }),
    }),
  }),
  stageStars: Object.freeze({
    base: 1,
    baseOrder: 'motion',
    draws: Object.freeze([
      Object.freeze({ star: 3, risePercent: 8, resetBy: Object.freeze([3]), first: 'dragon', order: 'bag' }),
      Object.freeze({ star: 2, risePercent: 30, resetBy: Object.freeze([3, 2]), first: 'giant', order: 'bag' }),
    ]),
  }),
  stageGrowth: Object.freeze({
    stagesPerChapter: 5,
    chapters: Object.freeze([
      Object.freeze({ hpPercent: 2, attack: 0.5, defense: 0.25 }),
      Object.freeze({ hpPercent: 2, attack: 0.75, defense: 0.25 }),
      Object.freeze({ hpPercent: 2, attack: 1, defense: 0.25 }),
      Object.freeze({ hpPercent: 2, attack: 1.25, defense: 0.25 }),
    ]),
  }),
  keptGauges: Object.freeze(['muscle']),
  muscleConversion: Object.freeze({ gauge: 'muscle', per: 5, maxBonus: 2 }),
  rage: Object.freeze({ fromTurn: 16, stepPercent: 20 }),
  upgradeSlots: Object.freeze({ castle: 1, troop: 1, card: 1, special: 0.5 }),
  upgradeChoiceCount: 3,
  castleRepairPercent: 30,
  eliteBasePower: 1,
  scoreItems: Object.freeze({
    defeat: Object.freeze({ base: 500, perStage: 20 }),
    strong: Object.freeze({ byStar: Object.freeze({ 1: 0, 2: 200, 3: 400 }) }),
    turns: Object.freeze({ base: 500, perTurn: 25, min: 0 }),
    combo: Object.freeze({ cards: 5, points: 50 }),
    noDamage: Object.freeze({ points: 25 }),
  }),
  upgrades: Object.freeze({
    castleMaxHp: Object.freeze({
      slot: 'castle',
      weight: 3,
      effect: 'castleMaxHp',
      range: Object.freeze({ min: 5, max: 10 }),
    }),
    autoSword: Object.freeze({ slot: 'castle', weight: 2, effect: 'autoTroop', gauge: 'attack', amount: 1 }),
    autoShield: Object.freeze({ slot: 'castle', weight: 2, effect: 'autoTroop', gauge: 'defense', amount: 1 }),
    autoHammer: Object.freeze({ slot: 'castle', weight: 2, effect: 'autoTroop', gauge: 'heal', amount: 1 }),
    eliteSword: Object.freeze({
      slot: 'troop',
      weight: 2,
      effect: 'eliteChance',
      gauge: 'attack',
      range: Object.freeze({ min: 5, max: 10 }),
      maxPercent: 50,
    }),
    eliteSwordPower: Object.freeze({
      slot: 'troop',
      weight: 1,
      effect: 'elitePower',
      gauge: 'attack',
      amount: 1,
      requires: 'eliteSword',
    }),
    eliteShield: Object.freeze({
      slot: 'troop',
      weight: 2,
      effect: 'eliteChance',
      gauge: 'defense',
      range: Object.freeze({ min: 5, max: 10 }),
      maxPercent: 50,
    }),
    eliteShieldPower: Object.freeze({
      slot: 'troop',
      weight: 1,
      effect: 'elitePower',
      gauge: 'defense',
      amount: 1,
      requires: 'eliteShield',
    }),
    eliteHammer: Object.freeze({
      slot: 'troop',
      weight: 2,
      effect: 'eliteChance',
      gauge: 'heal',
      range: Object.freeze({ min: 5, max: 10 }),
      maxPercent: 50,
    }),
    eliteHammerPower: Object.freeze({
      slot: 'troop',
      weight: 1,
      effect: 'elitePower',
      gauge: 'heal',
      amount: 1,
      requires: 'eliteHammer',
    }),
    swordCards: Object.freeze({ slot: 'card', weight: 0.5, effect: 'cardSuit', suit: 'sword', amount: 1 }),
    shieldCards: Object.freeze({ slot: 'card', weight: 0.5, effect: 'cardSuit', suit: 'shield', amount: 1 }),
    hammerCards: Object.freeze({ slot: 'card', weight: 0.5, effect: 'cardSuit', suit: 'potion', amount: 1 }),
    goldCards: Object.freeze({ slot: 'card', weight: 0.5, effect: 'cardSuit', suit: 'muscle', amount: 1 }),
    rank1Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 1, amount: 1 }),
    rank2Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 2, amount: 1 }),
    rank3Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 3, amount: 1 }),
    rank4Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 4, amount: 1 }),
    rank5Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 5, amount: 1 }),
    rank6Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 6, amount: 1 }),
    rank7Cards: Object.freeze({ slot: 'card', weight: 1, effect: 'cardRank', rank: 7, amount: 1 }),
    allSuits: Object.freeze({ slot: 'card', weight: 0.5, effect: 'allSuitsBoost', amount: 1, maxCount: 3 }),
    combo: Object.freeze({
      slot: 'card',
      weight: 1,
      effect: 'comboBoost',
      amount: 1,
      maxCount: 3,
      previewCards: 5,
    }),
    actionChance: Object.freeze({
      slot: 'special',
      weight: 2,
      effect: 'actionChance',
      range: Object.freeze({ min: 5, max: 10 }),
      maxPercent: 50,
      actions: 1,
    }),
    battleAction: Object.freeze({
      slot: 'special',
      weight: 2,
      effect: 'battleActions',
      amount: 1,
      after: 'actionChance',
    }),
    handSlot: Object.freeze({ slot: 'special', weight: 1, effect: 'handSlot', amount: 1, maxCount: 1 }),
  }),
});
