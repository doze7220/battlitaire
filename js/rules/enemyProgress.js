/**
 * 責務: 敵の順番（enemyOrder）の上での問い合わせ（何番目の敵の種類と設定、最後の敵か、次の敵の名前）。純粋な関数（ルール層）。
 */

/**
 * 順番の問い合わせに使う設定。
 * @typedef {Object} ProgressConfig
 * @property {readonly string[]} enemyOrder 敵の種類の識別子の並び（戦う順）
 * @property {Readonly<Object<string, import('./config.js').EnemySpec>>} enemies 識別子から敵の種類の設定への対応
 */

/**
 * 何番目の敵の種類の識別子か。
 * @param {ProgressConfig} config ルールの設定
 * @param {number} index 敵の番号（0から）
 * @returns {string} 敵の種類の識別子
 * @throws {Error} 範囲外のとき
 */
export function enemyTypeIdAt(config, index) {
  if (!Number.isInteger(index) || index < 0 || index >= config.enemyOrder.length) {
    throw new Error(`enemy index out of range: ${index}`);
  }
  return config.enemyOrder[index];
}

/**
 * 何番目の敵の種類の設定か。
 * @param {ProgressConfig} config ルールの設定
 * @param {number} index 敵の番号（0から）
 * @returns {import('./config.js').EnemySpec} 敵の種類の設定
 * @throws {Error} 範囲外、または設定にない識別子のとき
 */
export function enemySpecAt(config, index) {
  const typeId = enemyTypeIdAt(config, index);
  const spec = config.enemies[typeId];
  if (!spec) throw new Error(`unknown enemy type: ${typeId}`);
  return spec;
}

/**
 * 最後の敵か。
 * @param {ProgressConfig} config ルールの設定
 * @param {number} index 敵の番号（0から）
 * @returns {boolean} 最後の敵なら true
 */
export function isLastEnemy(config, index) {
  return index === config.enemyOrder.length - 1;
}

/**
 * 次の敵の名前。
 * @param {ProgressConfig} config ルールの設定
 * @param {number} index 敵の番号（0から）
 * @returns {string|null} 次の敵の名前。最後の敵なら null
 */
export function nextEnemyName(config, index) {
  if (isLastEnemy(config, index)) return null;
  return enemySpecAt(config, index + 1).name;
}
