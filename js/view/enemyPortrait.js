/**
 * 責務: 敵1種の絵（群れの敵は体の絵を並べ、絵の敵はその絵、両方を持つ敵は親の絵と子の体）を矩形に描く。画面ごとの兵の大きさと並びは呼び出し側が渡す。
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
 * 群れの絵と絵の両方を持つ敵（親子の敵）の絵の並び。値はすべて矩形に対する割合。
 * @typedef {Object} BroodPortrait
 * @property {number} parentScale 親の絵を収める矩形の幅・高さの、矩形に対する倍率（右下にそろえる）
 * @property {number} youngSize 子（群れの体）の大きさの、矩形の高さに対する倍率
 * @property {{ x: number, y: number }[]} young 子の足元の位置（矩形の左上から、矩形の幅・高さに対する割合。手前から奥へ描く順）
 */

/**
 * 親子の敵の絵の並び（親は右下、子は手前の左下に3体）。
 * @type {Readonly<BroodPortrait>}
 */
const BROOD_PORTRAIT = Object.freeze({
  parentScale: 0.8,
  youngSize: 0.3,
  young: Object.freeze([
    Object.freeze({ x: 0.14, y: 1 }),
    Object.freeze({ x: 0.32, y: 1 }),
    Object.freeze({ x: 0.23, y: 0.9 }),
  ]),
});

/**
 * 敵の絵を描く（群れの絵と絵の両方を持つ敵は親の絵の手前に子を3体、群れの敵は体の絵を horde の数だけ、絵の敵は矩形に収めて1枚。どれでもなければ描かない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置（enemyFigures を読む）
 * @param {string} typeId 敵の種類の識別子
 * @param {{ x: number, y: number, w: number, h: number }} rect 絵の矩形
 * @param {HordeLayout} horde 群れの敵の兵の並び（親子の敵では使わない）
 * @returns {void}
 */
export function drawEnemyPortrait(ctx, battleLayout, typeId, rect, horde) {
  const skin = hordeSkinOf(typeId);
  const figure = battleLayout.enemyFigures[typeId];
  if (skin !== null && figure) {
    const pw = rect.w * BROOD_PORTRAIT.parentScale;
    const ph = rect.h * BROOD_PORTRAIT.parentScale;
    drawSpriteFit(ctx, figure.sprite, { x: rect.x + rect.w - pw, y: rect.y + rect.h - ph, w: pw, h: ph });
    const size = rect.h * BROOD_PORTRAIT.youngSize;
    for (const p of BROOD_PORTRAIT.young) {
      drawTroopFigure(ctx, skin.body, skin.item, rect.x + rect.w * p.x, rect.y + rect.h * p.y, size, 0, 0, 0, 0, 1, 1);
    }
    return;
  }
  if (skin !== null) {
    const cx = rect.x + rect.w / 2;
    const foot = rect.y + rect.h;
    for (let i = 0; i < horde.dx.length; i++) {
      drawTroopFigure(ctx, skin.body, skin.item, cx + horde.dx[i], foot + horde.dy[i], horde.size, 0, 0, 0, 0, 1, 1);
    }
    return;
  }
  if (figure) drawSpriteFit(ctx, figure.sprite, rect);
}
