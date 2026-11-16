/**
 * 責務: 兵（小さな兵・大きなユニット。守備兵・兵士・大工・敵兵・敵の守り・ゴブリン）のスプライトを描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { SPRITE_IDS, drawSpriteFit } from './spriteView.js';

/** 兵の種類 → 絵（スプライトの識別子）の表。自軍は白い丸、敵の側は緑の丸。 */
const TROOP_SPRITES = Object.freeze({
  guard: SPRITE_IDS.soldier,
  soldier: SPRITE_IDS.soldier,
  carpenter: SPRITE_IDS.soldier,
  enemy: SPRITE_IDS.goblin,
  enemyGuard: SPRITE_IDS.goblin,
  goblin: SPRITE_IDS.goblin,
});

/**
 * 兵・ユニット1体を描く。大きなユニットも同じ（unit.w・unit.h が大きいだけ）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ kind: string, big: boolean, x: number, footY: number, w: number, h: number, alpha: number }} unit 1体の見た目
 * @returns {void}
 */
function drawUnit(ctx, unit) {
  const sprite = TROOP_SPRITES[unit.kind];
  if (sprite === undefined) throw new Error(`未知の兵の種類: ${unit.kind}`);
  ctx.save();
  ctx.globalAlpha = unit.alpha;
  drawSpriteFit(ctx, sprite, {
    x: unit.x - unit.w / 2,
    y: unit.footY - unit.h,
    w: unit.w,
    h: unit.h,
  });
  ctx.restore();
}

/**
 * 兵・ユニットを並び順どおりに描く（後ろの列から前の列へ）。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {ReadonlyArray<{ kind: string, big: boolean, x: number, footY: number, w: number, h: number, alpha: number }>} units 描く兵の見た目（UnitLook の配列）
 * @returns {void}
 */
export function drawTroops(ctx, units) {
  for (const unit of units) drawUnit(ctx, unit);
}
