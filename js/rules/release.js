/**
 * 責務: 列のカードから「放ったときのゲージの加算量」を求める純粋な計算（状態は変えない）。
 * 同じスートが続く区切りごとに足す量と加算量を出し、4スートそろい（全スート）の足す量も求める。
 */

/**
 * 同じスートが続く1つの区切りの計算結果。
 * @typedef {Object} ReleaseSegment
 * @property {string} suit 区切りのスート
 * @property {string} gauge 加算先のゲージの識別子（`config.suitGauge` による）
 * @property {import('./card.js').Card[]} cards 区切りに含まれるカード（列の下から順）
 * @property {number} sum 区切りの数字の合計
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
 * 放った列に全スートが1枚以上あり、足す量が 0 より大きいときの加算を求める。
 * @param {import('./card.js').Card[]} cards 列のカード
 * @param {{ suits: readonly string[], suitGauge: Object<string, string>, allSuitsBonus: number }} config ルールの設定
 * @returns {AllSuitsBonus|null} 加算。そろわない・量が 0 以下なら `null`
 */
function computeAllSuits(cards, config) {
  if (!(config.allSuitsBonus > 0)) return null;
  const present = new Set(cards.map((card) => card.suit));
  if (!config.suits.every((suit) => present.has(suit))) return null;
  return {
    amount: config.allSuitsBonus,
    parts: config.suits.map((suit) => ({ suit, gauge: config.suitGauge[suit] })),
  };
}

/**
 * 列のカード（下から順）から、区切りごとの足す量・加算量とゲージごとの加算量を求める。
 * 引数は書き換えない。
 * @param {import('./card.js').Card[]} cards 列のカード（[0] が一番下）
 * @param {{ suits: readonly string[], gauges: readonly string[], suitGauge: Object<string, string>, releaseBonus: { perCard: number, max: number }, allSuitsBonus: number }} config ルールの設定
 * @returns {ReleaseCalc} 計算結果
 */
export function computeRelease(cards, config) {
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
    current.sum += card.rank;
    current.count += 1;
  }

  /** @type {Object<string, number>} */
  const gains = {};
  for (const gauge of config.gauges) {
    gains[gauge] = 0;
  }

  const { perCard, max } = config.releaseBonus;
  for (const seg of segments) {
    seg.bonus = Math.min(max, perCard * (seg.count - 1));
    seg.amount = seg.sum + seg.bonus;
    gains[seg.gauge] = (gains[seg.gauge] ?? 0) + seg.amount;
  }

  const allSuits = computeAllSuits(cards, config);
  if (allSuits !== null) {
    for (const part of allSuits.parts) {
      gains[part.gauge] = (gains[part.gauge] ?? 0) + allSuits.amount;
    }
  }

  return { segments, gains, allSuits };
}
