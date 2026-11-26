/**
 * 責務: 親と子を持つ敵の純粋な計算（HP の分け方・局面・剣の当たり方の分け方・DEBUG の HP の付け方・中断データの形の確かめ）。
 * ルール層。何も import せず、画面・エンジンには触れない。
 */

/**
 * 親と子の HP。
 * @typedef {Object} EnemyParts
 * @property {number} parent 親の HP
 * @property {number} child 子の HP
 */

/**
 * 局面の識別子の並び（子がいる間・怒り・子だけ）。
 * @type {ReadonlyArray<'together'|'enraged'|'young'>}
 */
export const ENEMY_SITUATIONS = Object.freeze(['together', 'enraged', 'young']);

/**
 * 親と子の最大 HP を求める。子 = floor(maxHp × childPercent / 100)、親 = maxHp − 子。
 * @param {{ childPercent: number }} brood 親と子を持つ敵の設定
 * @param {number} maxHp ステージの加算の後の最大 HP（親子の合計）
 * @returns {EnemyParts} 親と子の最大 HP
 */
export function partMaxHps(brood, maxHp) {
  const child = Math.floor((maxHp * brood.childPercent) / 100);
  return { parent: maxHp - child, child };
}

/**
 * 敵の設定から、親と子の最大 HP を作る。
 * @param {{ brood?: { childPercent: number } }} spec 敵の種類の設定
 * @param {number} maxHp ステージの加算の後の最大 HP
 * @returns {EnemyParts|null} 親子の敵なら親と子の最大 HP、そうでなければ null
 */
export function createEnemyParts(spec, maxHp) {
  if (!spec.brood) return null;
  return partMaxHps(spec.brood, maxHp);
}

/**
 * 親と子の HP から局面を求める。
 * @param {EnemyParts|null|undefined} parts 親と子の HP（親子でない敵は null か undefined）
 * @returns {'together'|'enraged'|'young'|null} 局面（親子でない・両方 0 なら null）
 */
export function enemySituationOf(parts) {
  if (!parts) return null;
  if (parts.parent > 0 && parts.child > 0) return 'together';
  if (parts.parent > 0) return 'enraged';
  if (parts.child > 0) return 'young';
  return null;
}
