/**
 * 責務: 攻防のエフェクト（当たりの白い光・粒・「-N」（HP が減る量）、戦闘の段の暗さと撃つ瞬間の光）を、見た目の値のとおりに描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { damagePopText } from './battleText.js';

/** 当たりの白い光の色。 */
const FLASH_COLOR = '#ffffff';
/** ダメージの粒の色。 */
const DAMAGE_SPARK_COLOR = '#ffd25a';
/** 修理の粒の色。 */
const REPAIR_SPARK_COLOR = '#7cf08a';
/** 城の HP が減る「-N」の色。 */
const CASTLE_POP_COLOR = '#ff5a4a';
/** 敵の HP が減る「-N」の色。 */
const ENEMY_POP_COLOR = '#ffe680';
/** 「-N」の文字のふちの色。 */
const POP_OUTLINE_COLOR = 'rgba(0, 0, 0, 0.7)';
/** 「-N」の文字のふちの太さ。 */
const POP_OUTLINE_WIDTH = 3;
/** 戦闘の段の暗さの色。 */
const DIM_COLOR = '#000000';
/** 撃つ瞬間の段の光の色。 */
const STAGE_FLASH_COLOR = '#ffffff';

/**
 * 白い丸の光を、見えるものだけ描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/impactFx.js').ImpactFlashLook} flashes 光の見た目
 * @returns {void}
 */
function drawFlashes(ctx, flashes) {
  ctx.fillStyle = FLASH_COLOR;
  for (let i = 0; i < flashes.count; i++) {
    if (flashes.visible[i] === 0) continue;
    ctx.globalAlpha = flashes.alpha[i];
    ctx.beginPath();
    ctx.arc(flashes.x[i], flashes.y[i], flashes.size[i] / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 粒（正方形）を、見えるものだけ描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/impactFx.js').ImpactSparkLook} sparks 粒の見た目
 * @returns {void}
 */
function drawSparks(ctx, sparks) {
  const half = sparks.size / 2;
  for (let i = 0; i < sparks.count; i++) {
    if (sparks.visible[i] === 0) continue;
    ctx.globalAlpha = sparks.alpha[i];
    ctx.fillStyle = sparks.repair[i] === 1 ? REPAIR_SPARK_COLOR : DAMAGE_SPARK_COLOR;
    ctx.fillRect(sparks.x[i] - half, sparks.y[i] - half, sparks.size, sparks.size);
  }
}

/**
 * 「-N」を、見えるものだけふち付きで描く（N は数字ごとの量）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/impactFx.js').ImpactPopLook} pops 数字の見た目
 * @returns {void}
 */
function drawPops(ctx, pops) {
  ctx.font = `bold ${pops.size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = POP_OUTLINE_WIDTH;
  ctx.strokeStyle = POP_OUTLINE_COLOR;
  for (let i = 0; i < pops.count; i++) {
    if (pops.visible[i] === 0) continue;
    ctx.globalAlpha = pops.alpha[i];
    ctx.fillStyle = pops.castle[i] === 1 ? CASTLE_POP_COLOR : ENEMY_POP_COLOR;
    const text = damagePopText(pops.amount[i]);
    ctx.strokeText(text, pops.x[i], pops.y[i]);
    ctx.fillText(text, pops.x[i], pops.y[i]);
  }
}

/**
 * 当たりのエフェクト（白い光 → 粒 → 「-1」の順）を描く。見えるものだけ描き、引数は書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/impactFx.js').ImpactFxLook} fx 当たりのエフェクトの見た目
 * @returns {void}
 */
export function drawImpactFx(ctx, fx) {
  ctx.save();
  drawFlashes(ctx, fx.flashes);
  drawSparks(ctx, fx.sparks);
  drawPops(ctx, fx.pops);
  ctx.restore();
}

/**
 * 戦闘の段の暗さ（黒）と撃つ瞬間の光（白）を、段の矩形に濃さで重ねる。0 のものは描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} area 戦闘の段の矩形
 * @param {import('../anim/stageFx.js').StageFxLook} stage 段の見た目（dim・flash を読む）
 * @returns {void}
 */
export function drawStageOverlay(ctx, area, stage) {
  if (stage.dim <= 0 && stage.flash <= 0) return;
  ctx.save();
  if (stage.dim > 0) {
    ctx.globalAlpha = stage.dim;
    ctx.fillStyle = DIM_COLOR;
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }
  if (stage.flash > 0) {
    ctx.globalAlpha = stage.flash;
    ctx.fillStyle = STAGE_FLASH_COLOR;
    ctx.fillRect(area.x, area.y, area.w, area.h);
  }
  ctx.restore();
}
