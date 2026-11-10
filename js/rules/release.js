/**
 * 責務: 列のカードから「放ったときのゲージの加算量」を求める純粋な計算（状態は変えない）。
 * 同じスートが続く区切りごとに倍率と加算量を出す。
 */

/**
 * 同じスートが続く1つの区切りの計算結果。
 * @typedef {Object} ReleaseSegment
 * @property {string} suit 区切りのスート
 * @property {string} gauge 加算先のゲージの識別子（`config.suitGauge` による）
 * @property {import('./card.js').Card[]} cards 区切りに含まれるカード（列の下から順）
 * @property {number} sum 区切りの数字の合計
 * @property {number} count 区切りの枚数
 * @property {number} multiplier 倍率（`base + perCard × count`）
 * @property {number} amount 加算量（`sum × multiplier`）
 */

/**
 * 放つ計算の全体の結果。
 * @typedef {Object} ReleaseCalc
 * @property {ReleaseSegment[]} segments 区切りの配列（列の下から順）
 * @property {Object<string, number>} gains ゲージごとの加算量（`config.gauges` の全キーを含む）
 */

/**
 * 列のカード（下から順）から、区切りごとの倍率・加算量とゲージごとの加算量を求める。
 * 引数は書き換えない。
 * @param {import('./card.js').Card[]} cards 列のカード（[0] が一番下）
 * @param {{ gauges: readonly string[], suitGauge: Object<string, string>, releaseMultiplier: { base: number, perCard: number } }} config ルールの設定
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
        multiplier: 0,
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

  const { base, perCard } = config.releaseMultiplier;
  for (const seg of segments) {
    seg.multiplier = base + perCard * seg.count;
    seg.amount = seg.sum * seg.multiplier;
    gains[seg.gauge] = (gains[seg.gauge] ?? 0) + seg.amount;
  }

  return { segments, gains };
}
