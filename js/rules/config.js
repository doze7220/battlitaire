/** ルールの調整値（スート・数字の範囲・数字の一周・列の数・手札の枠の数・行動回数・倍率の式の係数、城の数値、敵の種類ごとの数値（名前・最大 HP・常時防御力・行動の決まり（重みによる抽選・周期の攻撃と攻撃の直後の回復・ブレスチャージ（爪・ブレス・燃やす札の枚数）））と敵の順番、力こぶの換算）を1か所に集める設定ファイル。 */

/**
 * 敵の行動の種類ごとの量と重み。
 * @typedef {Object} EnemyActionSpec
 * @property {string} kind 行動の種類（'attack'|'defend'）。
 * @property {number} amount 行動の量。
 * @property {number} weight 予告で選ばれる重み。
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
 * ブレスチャージの爪の攻撃の設定。
 * @typedef {Object} ChargeStrikeSpec
 * @property {number} amount 爪の攻撃力。
 */

/**
 * ブレスチャージのブレスの攻撃の設定。
 * @typedef {Object} ChargeBreathSpec
 * @property {number} amount ブレスの攻撃力。
 * @property {Readonly<BurnSpec>} burn ブレスで燃やす札の枚数の範囲。
 */

/**
 * 敵の行動の決まりの設定。
 * @typedef {Object} EnemyBehaviorSpec
 * @property {'weighted'|'cycle'|'charge'} type 行動の決まりの種類（'weighted'＝重みによる抽選、'cycle'＝周期の攻撃、'charge'＝ブレスチャージ）。
 * @property {Readonly<ChargeStrikeSpec>} [claw] 爪の攻撃（'charge' のみ）。
 * @property {Readonly<ChargeBreathSpec>} [breath] ブレスの攻撃と燃やす札（'charge' のみ）。
 * @property {number} [chargeMax] チャージの満ちる数（'charge' のみ）。
 * @property {number} [breathChance] 満ちているとき、フェーズごとにブレスを予告する確率（0〜1。'charge' のみ）。
 * @property {readonly Readonly<EnemyActionSpec>[]} [actions] 予告する行動の種類ごとの量と重み（'weighted' のみ）。
 * @property {number} [cycleLength] 1周期のフェーズ数。最後のフェーズで攻撃、ほかは振りかぶり（'cycle' のみ。1以上の整数）。
 * @property {number} [attack] 周期の最後のフェーズの攻撃の量（'cycle' のみ）。
 * @property {Readonly<AttackHealSpec>} [attackHeal] 攻撃の直後の回復（任意。書かなければ回復しない）。
 */

/**
 * 敵の種類の設定。
 * @typedef {Object} EnemySpec
 * @property {string} name 敵の名前（表示用）。
 * @property {number} maxHp 敵の最大 HP（戦い始めの HP でもある）。
 * @property {number} armor 常時防御力（毎フェーズ、自軍の攻撃から差し引かれる量）。
 * @property {Readonly<EnemyBehaviorSpec>} behavior 行動の決まり。
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
 * @property {Readonly<{base: number, perCard: number}>} releaseMultiplier 放ったときの倍率の式の係数。倍率 = base + perCard × 同スート区切りの枚数。
 * @property {number} castleMaxHp 城の最大 HP（ゲーム開始時の HP でもある）。
 * @property {readonly string[]} enemyOrder 敵の種類の識別子の並び（戦う順）。
 * @property {Readonly<Object<string, Readonly<EnemySpec>>>} enemies 敵の種類の識別子から、敵の種類の設定への対応。
 * @property {readonly string[]} keptGauges フェーズをまたいで値を残すゲージの識別子。
 * @property {Readonly<{gauge: string, per: number, maxBonus: number}>} muscleConversion 力こぶの換算。gauge のゲージが per ごとに行動回数 +1、最大 maxBonus。
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
  releaseMultiplier: Object.freeze({ base: 0, perCard: 1 }),
  castleMaxHp: 50,
  enemyOrder: Object.freeze(['goblins', 'giant', 'dragon']),
  enemies: Object.freeze({
    goblins: Object.freeze({
      name: 'ゴブリンの軍勢',
      maxHp: 50,
      armor: 0,
      behavior: Object.freeze({
        type: 'weighted',
        actions: Object.freeze([
          Object.freeze({ kind: 'attack', amount: 10, weight: 3 }),
          Object.freeze({ kind: 'defend', amount: 15, weight: 1 }),
        ]),
      }),
    }),
    giant: Object.freeze({
      name: '巨人',
      maxHp: 80,
      armor: 8,
      behavior: Object.freeze({
        type: 'cycle',
        cycleLength: 4,
        attack: 40,
        attackHeal: Object.freeze({ chance: 0.25, amount: 20 }),
      }),
    }),
    dragon: Object.freeze({
      name: 'ドラゴン',
      maxHp: 120,
      armor: 15,
      behavior: Object.freeze({
        type: 'charge',
        claw: Object.freeze({ amount: 10 }),
        breath: Object.freeze({ amount: 35, burn: Object.freeze({ min: 4, max: 6 }) }),
        chargeMax: 4,
        breathChance: 0.5,
      }),
    }),
  }),
  keptGauges: Object.freeze(['muscle']),
  muscleConversion: Object.freeze({ gauge: 'muscle', per: 5, maxBonus: 2 }),
});
