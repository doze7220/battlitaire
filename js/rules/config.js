/** ルールの調整値（スート・数字の範囲・数字の一周・列の数・手札の枠の数・行動回数・束の補正（足す量）の係数、城の数値、敵の種類ごとの数値（名前・最大 HP・防御（張る確率と量の幅）・行動の決まり（毎ターン攻撃と防御・周期の攻撃と攻撃の直後の回復・吸い込んでからのブレス（爪・ブレス・燃やす札の枚数・吸い込む確率））と攻撃・防御の量の幅）、敵の★とステージごとの★の決まり、力こぶの換算、疲弊（長引いた敵の防御の減り方）、4スートそろいの加算量）を1か所に集める設定ファイル。 */

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
 * 疲弊の段（戦闘のターン数が fromTurn 以上のとき、防御の量に defenseRate を掛けて切り捨てる）。
 * @typedef {Object} FatigueStage
 * @property {number} fromTurn この段が効き始める戦闘のターン数（1 から）。
 * @property {number} defenseRate 防御の量に掛ける率（0〜1）。
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
 * @property {'steady'|'cycle'|'inhale'} type 行動の決まりの種類（'steady'＝攻撃と防御を毎ターン両方行う、'cycle'＝周期の攻撃、'inhale'＝吸い込んでからブレス）。
 * @property {Readonly<ClawSpec>} [claw] 爪の攻撃（'inhale' のみ）。
 * @property {Readonly<BreathSpec>} [breath] ブレスの攻撃と燃やす札（'inhale' のみ）。
 * @property {number} [inhaleChance] 直前の予告が吸い込む・ブレスでないとき、フェーズごとに吸い込むを予告する確率（0〜1。'inhale' のみ）。
 * @property {number} [cycleLength] 1周期のフェーズ数。最後のフェーズで攻撃、ほかは振りかぶり（'cycle' のみ。1以上の整数）。
 * @property {Readonly<AmountRangeSpec>} [attackRange] 周期の最後のフェーズの攻撃の量の幅（'cycle' のみ）、または毎ターンの攻撃の量の幅（'steady' のみ）。
 * @property {Readonly<AttackHealSpec>} [attackHeal] 攻撃の直後の回復（任意。書かなければ回復しない）。
 */

/**
 * 敵の種類の設定。
 * @typedef {Object} EnemySpec
 * @property {string} name 敵の名前（表示用）。
 * @property {number} star 敵の★（1〜3。ステージの★と同じ敵の中から選ばれる）。
 * @property {number} maxHp 敵の最大 HP（戦い始めの HP でもある）。
 * @property {Readonly<EnemyDefenseSpec>} defense 防御（ターンごとの張る確率と量の幅）。
 * @property {Readonly<EnemyBehaviorSpec>} behavior 行動の決まり。
 */

/**
 * ステージの★の決まり（上から順に、最初に割り切れた of の star。どれにも当たらなければ base）。
 * @typedef {Object} StageStarsSpec
 * @property {number} base どの倍数にも当たらないステージの★。
 * @property {readonly Readonly<{of: number, star: number}>[]} multiples 倍数ごとの★（上から順に判定する）。
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
 * @property {Readonly<StageStarsSpec>} stageStars ステージの番号から★を決める設定。
 * @property {readonly string[]} keptGauges フェーズをまたいで値を残すゲージの識別子。
 * @property {Readonly<{gauge: string, per: number, maxBonus: number}>} muscleConversion 力こぶの換算。gauge のゲージが per ごとに行動回数 +1、最大 maxBonus。
 * @property {readonly Readonly<FatigueStage>[]} fatigue 疲弊の段（fromTurn の昇順）。
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
    multiples: Object.freeze([
      Object.freeze({ of: 10, star: 3 }),
      Object.freeze({ of: 5, star: 2 }),
    ]),
  }),
  keptGauges: Object.freeze(['muscle']),
  muscleConversion: Object.freeze({ gauge: 'muscle', per: 5, maxBonus: 2 }),
  fatigue: Object.freeze([
    Object.freeze({ fromTurn: 21, defenseRate: 0.5 }),
    Object.freeze({ fromTurn: 26, defenseRate: 0 }),
  ]),
});
