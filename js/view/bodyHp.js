/**
 * 責務: 敵の状態から、群れの体・絵の体がそれぞれ受け持つ HP を読む（親子の敵は子・親の HP、ほかは HP）。
 * 状態は読むだけで、何も import しない。
 */

/**
 * 群れの体が受け持つ HP を返す。親子の敵（parts あり）は子の HP、ほかは敵の HP。
 * @param {{ hp: number, parts?: { parent: number, child: number }|null }} enemy 敵の状態
 * @returns {number} 群れの体の HP
 */
export function hordeHpOf(enemy) {
  return enemy.parts ? enemy.parts.child : enemy.hp;
}

/**
 * 絵の体が受け持つ HP を返す。親子の敵（parts あり）は親の HP、ほかは敵の HP。
 * @param {{ hp: number, parts?: { parent: number, child: number }|null }} enemy 敵の状態
 * @returns {number} 絵の体の HP
 */
export function figureHpOf(enemy) {
  return enemy.parts ? enemy.parts.parent : enemy.hp;
}
