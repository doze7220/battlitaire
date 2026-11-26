/**
 * 責務: 列のカードから「放ったときのゲージの加算量」を求める純粋な計算（状態は変えない。強化の足し分を受ける）。
 * 同じスートが続く区切りごとに足す量と加算量を出し、4スートそろい（全スート）の足す量も求める。束の補正の式もここに置く。
 */

/**
 * 同じスートが続く1つの区切りの計算結果。
 * @typedef {Object} ReleaseSegment
 * @property {string} suit 区切りのスート
 * @property {string} gauge 加算先のゲージの識別子（`config.suitGauge` による）
 * @property {import('./card.js').Card[]} cards 区切りに含まれるカード（列の下から順）
 * @property {number} sum 区切りの数字の合計（強化の札の +◯ を含む）
 * @property {number} count 区切りの枚数
 * @property {number} bonus 足す量（`min(max, perCard × (count - 1))`）
 * @property {number} amount 加算量（`sum + bonus`）
 */

/**
 * 放つ計算の全体の結果。
 * @typedef {Object} ReleaseCalc
 * @property {ReleaseSegment[]} segments 区切りの配列（列の下から順）
 * @property {Object<string, number>} gains ゲージごとの加算量（`config.gauges` の全キーを含む。4スートそろいの加算を含む）
 * @property {AllSuitsBonus|null} allSuits 4スートそろいの加算。そろわない・量が 0 以下なら `null`
 */

/**
 * 4スートそろい（放った列に全スートが1枚以上ある）の加算。
 * @typedef {Object} AllSuitsBonus
 * @property {number} amount 各ゲージに足す量
 * @property {Array<{ suit: string, gauge: string }>} parts 足すスートと加算先のゲージ（`config.suits` の順）
 */

/**
 * 放つ計算に受ける強化の足し分。
 * @typedef {Object} ReleaseBoost
 * @property {(card: import('./card.js').Card) => number} cardBonus 札の +◯（区切りの合計に足す）
 * @property {number} comboSteps 束の補正の段（`perCard`・`max` に `× (1 + 段)`）
 * @property {number} allSuitsExtra 4スートそろいの足し分
 */

/**
 * 強化の足し分なし（今までと同じ計算）。
 * @type {Readonly<ReleaseBoost>}
 */
export const NO_RELEASE_BOOST = Object.freeze({ cardBonus: () => 0, comboSteps: 0, allSuitsExtra: 0 });

/**
 * 束の補正の係数に、強化の段を掛ける。
 * @param {{ perCard: number, max: number }} releaseBonus 設定の束の補正の係数
 * @param {number} steps 束の補正の段（0 以上の整数）
 * @returns {{ perCard: number, max: number }} `perCard × (1 + steps)`・`max × (1 + steps)`
 */
export function scaledReleaseBonus(releaseBonus, steps) {
  return { perCard: releaseBonus.perCard * (1 + steps), max: releaseBonus.max * (1 + steps) };
}

/**
 * 同じスートの区切り1つの束の補正（足す量）。
 * @param {number} count 区切りの枚数
 * @param {{ perCard: number, max: number }} bonus 束の補正の係数（段を掛けた後）
 * @returns {number} `min(max, perCard × (count − 1))`
 */
export function bundleBonus(count, bonus) {
  return Math.min(bonus.max, bonus.perCard * (count - 1));
}

/**
 * 放った列に全スートが1枚以上あり、足す量が 0 より大きいときの加算を求める。
 * @param {import('./card.js').Card[]} cards 列のカード
 * @param {{ suits: readonly string[], suitGauge: Object<string, string>, allSuitsBonus: number }} config ルールの設定
 * @param {number} extra 4スートそろいの足し分
 * @returns {AllSuitsBonus|null} 加算。そろわない・量が 0 以下なら `null`
 */
function computeAllSuits(cards, config, extra) {
  const amount = config.allSuitsBonus + extra;
  if (!(amount > 0)) return null;
  const present = new Set(cards.map((card) => card.suit));
  if (!config.suits.every((suit) => present.has(suit))) return null;
  return {
    amount,
    parts: config.suits.map((suit) => ({ suit, gauge: config.suitGauge[suit] })),
  };
}

/**
 * 列のカード（下から順）から、区切りごとの足す量・加算量とゲージごとの加算量を求める。
 * 引数は書き換えない。
 * @param {import('./card.js').Card[]} cards 列のカード（[0] が一番下）
 * @param {{ suits: readonly string[], gauges: readonly string[], suitGauge: Object<string, string>, releaseBonus: { perCard: number, max: number }, allSuitsBonus: number }} config ルールの設定
 * @param {ReleaseBoost} [boost] 強化の足し分（札の +◯・束の補正の段・4スートそろいの足し分。省くと足し分なし）
 * @returns {ReleaseCalc} 計算結果
 */
export function computeRelease(cards, config, boost = NO_RELEASE_BOOST) {
  /** @type {ReleaseSegment[]} */
  const segments = [];
  /** @type {ReleaseSegment|null} */
  let current = null;

  for (const card of cards) {
    if (current === null || current.suit !== card.suit) {
      current = {
        suit: card.suit,
        gauge: config.suitGauge[card.suit],
        cards: [],
        sum: 0,
        count: 0,
        bonus: 0,
        amount: 0,
      };
      segments.push(current);
    }
    current.cards.push(card);
    current.sum += card.rank + boost.cardBonus(card);
    current.count += 1;
  }

  /** @type {Object<string, number>} */
  const gains = {};
  for (const gauge of config.gauges) {
    gains[gauge] = 0;
  }

  const bonus = scaledReleaseBonus(config.releaseBonus, boost.comboSteps);
  for (const seg of segments) {
    seg.bonus = bundleBonus(seg.count, bonus);
    seg.amount = seg.sum + seg.bonus;
    gains[seg.gauge] = (gains[seg.gauge] ?? 0) + seg.amount;
  }

  const allSuits = computeAllSuits(cards, config, boost.allSuitsExtra);
  if (allSuits !== null) {
    for (const part of allSuits.parts) {
      gains[part.gauge] = (gains[part.gauge] ?? 0) + allSuits.amount;
    }
  }

  return { segments, gains, allSuits };
}
