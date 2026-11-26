/** 設定の敵の種類の一覧・★ごとの候補・識別子からの設定の引き方を返す純粋関数をまとめる。 */

/**
 * 設定にある敵の種類の識別子を、書いた順に返す。
 * @param {{enemies: Readonly<Object<string, object>>}} config ルールの設定。
 * @returns {string[]} 敵の種類の識別子。
 */
export function enemyTypeIds(config) {
  return Object.keys(config.enemies);
}

/**
 * 指定した★の敵の種類の識別子を、書いた順に返す。
 * @param {{enemies: Readonly<Object<string, {star: number}>>}} config ルールの設定。
 * @param {number} star ★。
 * @returns {string[]} その★の敵の種類の識別子（なければ空）。
 */
export function enemyTypeIdsOfStar(config, star) {
  return enemyTypeIds(config).filter((typeId) => config.enemies[typeId].star === star);
}

/**
 * 敵の種類の設定から、並びの組の鍵を求める。`motion` があればそれ、なければ `behavior.type`。
 * @param {{motion?: string, behavior: {type: string}}} spec 敵の種類の設定。
 * @returns {string} 並びの組の鍵。
 */
export function motionKeyOf(spec) {
  return spec.motion ?? spec.behavior.type;
}

/**
 * 指定した★の敵を、動きの組の鍵（`motionKeyOf`）ごとに、書いた順でまとめる。
 * @param {{enemies: Readonly<Object<string, {star: number, motion?: string, behavior: {type: string}}>>}} config ルールの設定。
 * @param {number} star ★。
 * @returns {string[][]} 組ごとの敵の種類の識別子の並び（組の現れる順。その★の敵がなければ空）。
 */
export function enemyMotionsOfStar(config, star) {
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const typeId of enemyTypeIdsOfStar(config, star)) {
    const key = motionKeyOf(config.enemies[typeId]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(typeId);
  }
  return [...groups.values()];
}

/**
 * 敵の種類の識別子から、敵の種類の設定を引く。
 * @param {{enemies: Readonly<Object<string, object>>}} config ルールの設定。
 * @param {string} typeId 敵の種類の識別子。
 * @returns {object} 敵の種類の設定。
 * @throws {Error} 設定にない識別子のとき。
 */
export function enemySpecOf(config, typeId) {
  if (!Object.prototype.hasOwnProperty.call(config.enemies, typeId)) {
    throw new Error(`enemySpecOf: 設定にない敵の種類です: ${typeId}`);
  }
  return config.enemies[typeId];
}
