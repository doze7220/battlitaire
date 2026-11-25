/**
 * 責務: 状態を取り出し・戻せるプレイ用の乱数（sfc32）の計算。純粋な計算だけで、Math.random・日付は読まない。
 * 始めの状態の作り方・状態の形の確かめ・乱数の生成を提供する。
 */

/**
 * 乱数の状態（32 ビット符号なし整数4つ `[a, b, c, counter]`）。
 * @typedef {number[]} RngState
 */

/**
 * 状態を取り出し・戻せる乱数。
 * @typedef {Object} Rng
 * @property {() => number} next 0 以上 1 未満の値を返す（`this` に依らない関数。1回呼ぶごとに状態が1回進む）
 * @property {() => RngState} state 今の状態の写しを返す
 * @property {(state: RngState) => void} setState 状態を写して持つ（形が違えば Error）
 */

/** 2 の 32 乗 */
const TWO_32 = 2 ** 32;

/** 種の上限（2 の 53 乗。これ未満） */
const SEED_LIMIT = 2 ** 53;

/** 始めの状態を混ぜるために進める回数 */
const WARMUP_STEPS = 20;

/**
 * 値が乱数の状態の形か。
 * @param {unknown} value 調べる値
 * @returns {boolean} 長さ 4 の配列で、全部が 0 以上 2^32 未満の整数なら true
 */
export function isRngState(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((v) => Number.isInteger(v) && v >= 0 && v < TWO_32)
  );
}

/**
 * 状態を1回進め、出た値（32 ビット符号なし整数）を返す。`s` を直接書き換える。
 * @param {number[]} s 状態（長さ 4。書き換える）
 * @returns {number} 出た値（0 以上 2^32 未満の整数）
 */
function step(s) {
  const t = ((s[0] + s[1]) >>> 0) + s[3];
  const out = t >>> 0;
  s[3] = (s[3] + 1) >>> 0;
  s[0] = (s[1] ^ (s[1] >>> 9)) >>> 0;
  s[1] = (s[2] + (s[2] << 3)) >>> 0;
  s[2] = (((s[2] << 21) | (s[2] >>> 11)) + out) >>> 0;
  return out;
}

/**
 * 種から乱数の始めの状態を作る（20回進めて混ぜる）。
 * @param {number} seed 0 以上 2^53 未満の整数
 * @returns {RngState} 始めの状態
 * @throws {Error} 範囲外・整数でないとき
 */
export function rngStateOfSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_LIMIT) {
    throw new Error('rngStateOfSeed: seed は 0 以上 2^53 未満の整数で渡してください');
  }
  const s = [seed >>> 0, Math.floor(seed / TWO_32), 0, 1];
  for (let i = 0; i < WARMUP_STEPS; i += 1) step(s);
  return s;
}

/**
 * 乱数を作る。
 * @param {RngState} state 始めの状態（写して持つ）
 * @returns {Rng} 乱数
 * @throws {Error} 状態の形が違うとき
 */
export function createRng(state) {
  if (!isRngState(state)) {
    throw new Error('createRng: state は 4 つの 32 ビット符号なし整数の配列で渡してください');
  }
  let s = [...state];
  return {
    next: () => step(s) / TWO_32,
    state: () => [...s],
    setState: (next) => {
      if (!isRngState(next)) {
        throw new Error('Rng.setState: state は 4 つの 32 ビット符号なし整数の配列で渡してください');
      }
      s = [...next];
    },
  };
}
