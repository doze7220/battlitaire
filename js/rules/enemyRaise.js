/**
 * 責務: 死んだ自軍の兵を亡者（次のターンに持ち越す攻撃のユニット）にする敵の純粋な計算（前から使ったポイントで死んだ兵の人数・攻防に渡す兵のポイントの形）。
 * 何も import しない（ルール層）。
 */

/**
 * 攻防に渡す、ひとつのゲージの兵のポイントの形。
 * @typedef {Object} TroopPoints
 * @property {number} people 人数（ゲージ − 上振れ。自動兵士を含む）
 * @property {number} elites 精鋭の数
 * @property {number} extra 上振れ（精鋭のポイントのうち 1 を超える分の合計）
 */

/**
 * ゲージの値と精鋭の状態から、兵のポイントの形を作る。
 * @param {number} gauge ゲージの値（0 以上の整数）
 * @param {{ count: number, extra: number }|undefined} elite `game.elites` のそのゲージの精鋭の状態（`undefined` は精鋭なし）
 * @returns {TroopPoints} `people = gauge − extra`（0 未満にならない）
 */
export function troopPointsOf(gauge, elite) {
  const extra = elite?.extra ?? 0;
  return { people: Math.max(0, gauge - extra), elites: elite?.count ?? 0, extra };
}

/**
 * 前から `spent` ポイントを使ったとき、ポイントを使い切られた兵の人数を数える。
 * 並びは「ふつうの兵（`people − elites` 人。1人1ポイント）が先・精鋭が後」（演出の名簿の並びと同じ）。
 * 精鋭1体のポイントは `1 + floor(extra / elites)`。割り切れないとき（DEBUG でターンの途中に能力を変えたときだけ）は、
 * 余り `extra % elites` 体が +1 で、少ないポイントの精鋭を先とみなす。一部だけ使われた精鋭は数えない。
 * 例: 盾 6 人（ふつう 4・精鋭 2（3ポイント）。ゲージ 10）に 7 → 5 人、8 → 5 人、10 → 6 人。
 * @param {TroopPoints} troops 兵のポイントの形
 * @param {number} spent 前から使ったポイント
 * @returns {number} 使い切られた兵の人数（0 以上の整数。`spent` が 0 以下なら 0）
 */
export function troopDeaths(troops, spent) {
  if (spent <= 0) return 0;
  const elites = Math.max(0, troops.elites);
  const normal = Math.max(0, troops.people - elites);
  let left = spent;
  let deaths = Math.min(normal, left);
  left -= deaths;
  if (left <= 0 || elites === 0) return deaths;
  const base = 1 + Math.floor(troops.extra / elites);
  const bonus = troops.extra % elites;
  for (let i = 0; i < elites; i++) {
    const points = i < elites - bonus ? base : base + 1;
    if (left < points) break;
    left -= points;
    deaths += 1;
  }
  return deaths;
}

/**
 * 攻防に渡す、盾・剣の兵のポイントの形を作る。
 * @param {{ raise?: boolean }} spec 敵の種類の設定
 * @param {Object<string, number>} gauges ゲージ（`attack`・`defense`）の値
 * @param {Object<string, { count: number, extra: number }>} elites `game.elites`（ゲージ → 精鋭の状態）
 * @returns {{ shield: TroopPoints, sword: TroopPoints }|null} `spec.raise` が真の敵だけ。そうでなければ `null`
 */
export function raiseTroopsOf(spec, gauges, elites) {
  if (spec.raise !== true) return null;
  return {
    shield: troopPointsOf(gauges.defense ?? 0, elites.defense),
    sword: troopPointsOf(gauges.attack ?? 0, elites.attack),
  };
}
