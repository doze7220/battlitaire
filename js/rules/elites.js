/**
 * 責務: 放った兵の精鋭の抽選と、ゲージごとの精鋭の状態（精鋭の数と上振れ）の生成・加算・空にする・形の確かめ。
 * ルール層の純粋な計算で、渡された乱数だけを使う（何も import しない。型の参照だけ）。
 */

/**
 * ゲージ1つぶんの精鋭の状態。
 * @typedef {Object} EliteCount
 * @property {number} count 精鋭の数。
 * @property {number} extra 上振れ（精鋭のポイントのうち 1 を超える分の合計）。
 */

/**
 * ゲージごとの精鋭の状態（`config.gauges` の全キー）。
 * @typedef {Object<string, EliteCount>} EliteState
 */

/**
 * 1回の放つでの精鋭の抽選の結果。
 * @typedef {Object} EliteDraw
 * @property {number[]} segments 区切りごとの精鋭の数（`calc.segments` と同じ並び）。
 * @property {number[]} allSuits 4スートそろいの `parts` ごとの精鋭の数（そろわなければ空）。
 * @property {Object<string, number>} points ゲージ → この放つの時点の精鋭1体のポイント。
 * @property {Object<string, number>} counts ゲージ → この放つで増えた精鋭の数。
 * @property {Object<string, number>} extra ゲージ → この放つで増えた上振れ（精鋭の数 × (ポイント − 1)）。
 */

/**
 * 精鋭のいない状態を作る。
 * @param {{ gauges: readonly string[] }} config ルールの設定
 * @returns {EliteState} 全ゲージ `{ count: 0, extra: 0 }`
 */
export function createEliteState(config) {
  /** @type {EliteState} */
  const state = {};
  for (const gauge of config.gauges) state[gauge] = { count: 0, extra: 0 };
  return state;
}

/**
 * 兵 `people` 人を1人ずつ抽選して精鋭の数を数える。確率が 0 以下なら乱数を呼ばない。
 * @param {number} people 兵の人数
 * @param {number} percent 精鋭になる確率の百分率
 * @param {() => number} random 乱数の関数（`[0, 1)`）
 * @returns {number} 精鋭の数
 */
function drawCount(people, percent, random) {
  if (percent <= 0) return 0;
  let count = 0;
  for (let i = 0; i < people; i += 1) {
    if (random() < percent / 100) count += 1;
  }
  return count;
}

/**
 * 放った兵の精鋭を抽選する。
 * 乱数の順: 区切りの順（列の下から）に、その区切りのゲージの確率が 0 より大きければ、区切りの加算量（`seg.amount`）の人数だけ1人1回
 * `random() < percent / 100` を呼ぶ（確率 0 の区切りは呼ばない）→ 4スートそろいがあれば `parts` の順（`config.suits` の順）に、
 * そのゲージの確率が 0 より大きければ `allSuits.amount`（各ゲージに足す量）の人数だけ同じく呼ぶ。
 * @param {{ segments: Array<{ gauge: string, amount: number }>, allSuits: null|{ amount: number, parts: Array<{ gauge: string }> } }} calc `computeRelease` の結果
 * @param {Object<string, { percent: number, points: number }>} status `eliteStatusOf` の結果（ゲージ → 精鋭の状態）
 * @param {() => number} random 乱数の関数（`[0, 1)`）
 * @returns {EliteDraw} 抽選の結果
 */
export function drawElites(calc, status, random) {
  const counts = {};
  const points = {};
  const extra = {};
  for (const gauge of Object.keys(status)) {
    counts[gauge] = 0;
    points[gauge] = status[gauge].points;
    extra[gauge] = 0;
  }
  const segments = [];
  for (const seg of calc.segments) {
    const n = drawCount(seg.amount, status[seg.gauge].percent, random);
    segments.push(n);
    counts[seg.gauge] += n;
  }
  const allSuits = [];
  if (calc.allSuits) {
    for (const part of calc.allSuits.parts) {
      const n = drawCount(calc.allSuits.amount, status[part.gauge].percent, random);
      allSuits.push(n);
      counts[part.gauge] += n;
    }
  }
  for (const gauge of Object.keys(status)) extra[gauge] = counts[gauge] * (points[gauge] - 1);
  return { segments, allSuits, points, counts, extra };
}

/**
 * 抽選の結果を状態に足す（元の状態は書き換えない）。
 * @param {EliteState} state 今の状態
 * @param {EliteDraw} draw 抽選の結果
 * @returns {EliteState} 新しい状態（ゲージごとに数と上振れを足したもの）
 */
export function addElites(state, draw) {
  /** @type {EliteState} */
  const next = {};
  for (const gauge of Object.keys(state)) {
    next[gauge] = {
      count: state[gauge].count + (draw.counts[gauge] ?? 0),
      extra: state[gauge].extra + (draw.extra[gauge] ?? 0),
    };
  }
  return next;
}

/**
 * 1つのゲージの精鋭をなくす（元の状態は書き換えない）。
 * @param {EliteState} state 今の状態
 * @param {string} gauge ゲージの識別子
 * @returns {EliteState} 新しい状態（そのゲージだけ `{ count: 0, extra: 0 }`）
 */
export function clearEliteOf(state, gauge) {
  return { ...state, [gauge]: { count: 0, extra: 0 } };
}

/**
 * 値が精鋭の状態の形か確かめる（例外を投げない）。
 * @param {unknown} value 確かめる値
 * @param {{ gauges: readonly string[] }} config ルールの設定
 * @returns {boolean} プレーンなオブジェクトで、キーが `config.gauges` とちょうど同じで、各値が 0 以上の整数の `count`・`extra` を持てば true
 */
export function isEliteState(value, config) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== config.gauges.length) return false;
  for (const gauge of config.gauges) {
    if (!Object.hasOwn(value, gauge)) return false;
    const e = value[gauge];
    if (typeof e !== 'object' || e === null || Array.isArray(e)) return false;
    if (!Number.isInteger(e.count) || e.count < 0) return false;
    if (!Number.isInteger(e.extra) || e.extra < 0) return false;
  }
  return true;
}
