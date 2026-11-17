/**
 * 責務: ヒットマーク（仮のスプライト）を、見た目の値の位置・大きさ・濃さで描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { SPRITE_IDS, drawSpriteCentered } from './spriteView.js';

/**
 * 見えるヒットマークをすべて描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/hitMarks.js').HitMarkLook} marks ヒットマークの見た目
 * @returns {void}
 */
export function drawHitMarks(ctx, marks) {
  for (let i = 0; i < marks.count; i++) {
    if (marks.visible[i] === 0) continue;
    ctx.save();
    ctx.globalAlpha = marks.alpha[i];
    drawSpriteCentered(ctx, SPRITE_IDS.hit, marks.x[i], marks.y[i], marks.size[i]);
    ctx.restore();
  }
}
