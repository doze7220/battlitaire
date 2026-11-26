/**
 * 責務: 敵1種の絵（群れの敵は体の絵を並べ、絵の敵はその絵）を矩形に描く。画面ごとの兵の大きさと並びは呼び出し側が渡す。
 * 状態は変えず、ルール層・anim は import しない。
 */

import { drawSpriteFit, drawTroopFigure } from './spriteView.js';
import { hordeSkinOf } from './hordeSkins.js';

/**
 * 群れの敵の兵の並び。
 * @typedef {Object} HordeLayout
 * @property {number} size 兵の大きさ（体の直径）
 * @property {number[]} dx 兵ごとの足元の x のずれ（矩形の下端の中央から）
 * @property {number[]} dy 兵ごとの足元の y のずれ（矩形の下端から）
 */

/**
 * 敵の絵を描く（群れの敵は体の絵を horde の数だけ、絵の敵は矩形に収めて1枚。どちらでもなければ描かない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置（enemyFigures を読む）
 * @param {string} typeId 敵の種類の識別子
 * @param {{ x: number, y: number, w: number, h: number }} rect 絵の矩形
 * @param {HordeLayout} horde 群れの敵の兵の並び
 * @returns {void}
 */
export function drawEnemyPortrait(ctx, battleLayout, typeId, rect, horde) {
  const skin = hordeSkinOf(typeId);
  if (skin !== null) {
    const cx = rect.x + rect.w / 2;
    const foot = rect.y + rect.h;
    for (let i = 0; i < horde.dx.length; i++) {
      drawTroopFigure(ctx, skin.body, skin.item, cx + horde.dx[i], foot + horde.dy[i], horde.size, 0, 0, 0, 0, 1, 1);
    }
    return;
  }
  const figure = battleLayout.enemyFigures[typeId];
  if (figure) drawSpriteFit(ctx, figure.sprite, rect);
}
