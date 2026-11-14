/** ルールの調整値（スート・数字の範囲・数字の一周・列の数・手札の枠の数・行動回数・倍率の式の係数、城の数値、敵の種類ごとの数値（名前・最大 HP・常時防御力・行動の決まり）と敵の順番、力こぶの換算）を1か所に集める設定ファイル。 */

/**
 * 敵の行動の種類ごとの量と重み。
 * @typedef {Object} EnemyActionSpec
 * @property {string} kind 行動の種類（'attack'|'defend'）。
 * @property {number} amount 行動の量。
 * @property {number} weight 予告で選ばれる重み。
 */

/**
 * 敵の行動の決まりの設定。
 * @typedef {Object} EnemyBehaviorSpec
 * @property {string} type 行動の決まりの種類（今は 'weighted'＝重みによる抽選だけ）。
 * @property {readonly Readonly<EnemyActionSpec>[]} actions 予告する行動の種類ごとの量と重み。
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
        type: 'weighted',
        actions: Object.freeze([
          Object.freeze({ kind: 'attack', amount: 15, weight: 2 }),
          Object.freeze({ kind: 'defend', amount: 15, weight: 1 }),
        ]),
      }),
    }),
    dragon: Object.freeze({
      name: 'ドラゴン',
      maxHp: 120,
      armor: 15,
      behavior: Object.freeze({
        type: 'weighted',
        actions: Object.freeze([
          Object.freeze({ kind: 'attack', amount: 20, weight: 2 }),
          Object.freeze({ kind: 'defend', amount: 15, weight: 1 }),
        ]),
      }),
    }),
  }),
  keptGauges: Object.freeze(['muscle']),
  muscleConversion: Object.freeze({ gauge: 'muscle', per: 5, maxBonus: 2 }),
});
