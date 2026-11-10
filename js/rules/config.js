/** ルールの調整値（スート・数字の範囲・数字の一周・列の数・手札の枠の数・行動回数・倍率の式の係数、城・敵の数値、敵の行動の種類ごとの量と重み、力こぶの換算）を1か所に集める設定ファイル。 */

/**
 * 敵の行動の種類ごとの量と重み。
 * @typedef {Object} EnemyActionSpec
 * @property {string} kind 行動の種類（'attack'|'defend'）。
 * @property {number} amount 行動の量。
 * @property {number} weight 予告で選ばれる重み。
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
 * @property {number} enemyMaxHp 敵の最大 HP（ゲーム開始時の HP でもある）。
 * @property {readonly Readonly<EnemyActionSpec>[]} enemyActions 敵が予告する行動の種類ごとの量と重み。
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
  enemyMaxHp: 50,
  enemyActions: Object.freeze([
    Object.freeze({ kind: 'attack', amount: 10, weight: 2 }),
    Object.freeze({ kind: 'defend', amount: 15, weight: 1 }),
  ]),
  keptGauges: Object.freeze(['muscle']),
  muscleConversion: Object.freeze({ gauge: 'muscle', per: 5, maxBonus: 2 }),
});
