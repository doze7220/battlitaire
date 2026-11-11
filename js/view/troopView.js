/**
 * 責務: 兵（小さな兵・大きなユニット。守備兵・兵士・大工・敵兵・敵の守り）の仮の図形を描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';

/**
 * 種類ごとの見た目。
 * @typedef {object} TroopStyle
 * @property {string} color 人形の色
 * @property {'shield'|'spear'|'hammer'} item 持ち物
 * @property {1|-1} facing 向き（1 が右、-1 が左）
 */

/** 種類ごとの見た目の表。 */
const TROOP_STYLES = Object.freeze({
  guard: Object.freeze({ color: '#4a8fe0', item: 'shield', facing: 1 }),
  soldier: Object.freeze({ color: '#f0c040', item: 'spear', facing: 1 }),
  carpenter: Object.freeze({ color: '#5cbf6a', item: 'hammer', facing: 1 }),
  enemy: Object.freeze({ color: '#e05050', item: 'spear', facing: -1 }),
  enemyGuard: Object.freeze({ color: '#9a5cc8', item: 'shield', facing: -1 }),
});

/** 持ち物・旗の色。 */
const ITEM_COLOR = '#e8e8e8';
/** 旗の色。 */
const FLAG_COLOR = '#ffffff';
/** 人形の縁の色。 */
const OUTLINE_COLOR = 'rgba(0, 0, 0, 0.55)';
/** 縁の太さの、人形の幅に対する割合。 */
const OUTLINE_RATIO = 0.06;
/** 胴の高さの、人形の高さに対する割合。 */
const BODY_H_RATIO = 0.62;
/** 頭の直径の、人形の高さに対する割合（人形の幅を上限にする）。 */
const HEAD_D_RATIO = 0.3;
/** 胴の角の半径の、胴の幅に対する割合。 */
const BODY_CORNER_RATIO = 0.25;
/** 盾の幅の、人形の幅に対する割合。 */
const SHIELD_W_RATIO = 0.28;
/** 盾の高さの、胴の高さに対する割合。 */
const SHIELD_H_RATIO = 0.8;
/** 盾の中心の、胴の中心からの前方へのずれ（人形の幅に対する割合）。 */
const SHIELD_FORWARD_RATIO = 0.5;
/** 槍の線の太さの、人形の幅に対する割合。 */
const SPEAR_LINE_RATIO = 0.08;
/** 槍の長さの、人形の高さに対する割合。 */
const SPEAR_LEN_RATIO = 0.75;
/** 槍の傾き（足元側から先端側への、横の移動量の縦の移動量に対する比）。 */
const SPEAR_SLANT = 0.35;
/** 槍の根元の、胴の中心からの前方へのずれ（人形の幅に対する割合）。 */
const SPEAR_FORWARD_RATIO = 0.45;
/** 金づちの線の太さの、人形の幅に対する割合。 */
const HAMMER_LINE_RATIO = 0.09;
/** 金づちの柄の長さの、人形の高さに対する割合。 */
const HAMMER_HANDLE_RATIO = 0.45;
/** 金づちの頭の幅の、人形の幅に対する割合。 */
const HAMMER_HEAD_RATIO = 0.5;
/** 金づちの柄の根元の、胴の中心からの前方へのずれ（人形の幅に対する割合）。 */
const HAMMER_FORWARD_RATIO = 0.5;
/** 旗の竿の高さの、人形の高さに対する割合。 */
const FLAG_POLE_RATIO = 0.35;
/** 旗の三角の幅の、人形の幅に対する割合。 */
const FLAG_W_RATIO = 0.4;
/** 旗の三角の高さの、旗の竿の高さに対する割合。 */
const FLAG_H_RATIO = 0.5;
/** 旗の竿の線の太さの、人形の幅に対する割合。 */
const FLAG_LINE_RATIO = 0.05;

/**
 * 盾（縦長の矩形）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 人形の中心の x
 * @param {number} bodyCy 胴の中心の y
 * @param {number} w 人形の幅
 * @param {number} bodyH 胴の高さ
 * @param {1|-1} facing 向き
 * @returns {void}
 */
function drawShield(ctx, x, bodyCy, w, bodyH, facing) {
  const sw = w * SHIELD_W_RATIO;
  const sh = bodyH * SHIELD_H_RATIO;
  const cx = x + facing * w * SHIELD_FORWARD_RATIO;
  ctx.fillStyle = ITEM_COLOR;
  ctx.fillRect(cx - sw / 2, bodyCy - sh / 2, sw, sh);
}

/**
 * 槍（斜めの線）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 人形の中心の x
 * @param {number} footY 足元の y
 * @param {number} w 人形の幅
 * @param {number} h 人形の高さ
 * @param {1|-1} facing 向き
 * @returns {void}
 */
function drawSpear(ctx, x, footY, w, h, facing) {
  const len = h * SPEAR_LEN_RATIO;
  const baseX = x + facing * w * SPEAR_FORWARD_RATIO;
  ctx.strokeStyle = ITEM_COLOR;
  ctx.lineWidth = w * SPEAR_LINE_RATIO;
  ctx.beginPath();
  ctx.moveTo(baseX, footY);
  ctx.lineTo(baseX + facing * len * SPEAR_SLANT, footY - len);
  ctx.stroke();
}

/**
 * 金づち（T字の線）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 人形の中心の x
 * @param {number} bodyCy 胴の中心の y
 * @param {number} w 人形の幅
 * @param {number} h 人形の高さ
 * @param {1|-1} facing 向き
 * @returns {void}
 */
function drawHammer(ctx, x, bodyCy, w, h, facing) {
  const baseX = x + facing * w * HAMMER_FORWARD_RATIO;
  const handle = h * HAMMER_HANDLE_RATIO;
  const half = (w * HAMMER_HEAD_RATIO) / 2;
  const topY = bodyCy - handle / 2;
  ctx.strokeStyle = ITEM_COLOR;
  ctx.lineWidth = w * HAMMER_LINE_RATIO;
  ctx.beginPath();
  ctx.moveTo(baseX, bodyCy + handle / 2);
  ctx.lineTo(baseX, topY);
  ctx.moveTo(baseX - half, topY);
  ctx.lineTo(baseX + half, topY);
  ctx.stroke();
}

/**
 * 大きなユニットの旗（竿と三角の旗）を頭の上に描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} x 人形の中心の x
 * @param {number} headTopY 頭の上端の y
 * @param {number} w 人形の幅
 * @param {number} h 人形の高さ
 * @param {1|-1} facing 向き
 * @returns {void}
 */
function drawFlag(ctx, x, headTopY, w, h, facing) {
  const pole = h * FLAG_POLE_RATIO;
  const topY = headTopY - pole;
  const flagH = pole * FLAG_H_RATIO;
  const flagW = w * FLAG_W_RATIO;
  ctx.strokeStyle = ITEM_COLOR;
  ctx.lineWidth = w * FLAG_LINE_RATIO;
  ctx.beginPath();
  ctx.moveTo(x, headTopY);
  ctx.lineTo(x, topY);
  ctx.stroke();
  ctx.fillStyle = FLAG_COLOR;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x + facing * flagW, topY + flagH / 2);
  ctx.lineTo(x, topY + flagH);
  ctx.closePath();
  ctx.fill();
}

/**
 * 兵・ユニット1体を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ kind: string, big: boolean, x: number, footY: number, w: number, h: number, alpha: number }} unit 1体の見た目
 * @returns {void}
 */
function drawUnit(ctx, unit) {
  const style = TROOP_STYLES[unit.kind];
  if (style === undefined) throw new Error(`未知の兵の種類: ${unit.kind}`);
  const { x, footY, w, h } = unit;
  const bodyH = h * BODY_H_RATIO;
  const headD = Math.min(h * HEAD_D_RATIO, w);
  const bodyTopY = footY - bodyH;
  const bodyCy = footY - bodyH / 2;
  const headTopY = bodyTopY - headD;

  ctx.save();
  ctx.globalAlpha = unit.alpha;
  ctx.fillStyle = style.color;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.lineWidth = w * OUTLINE_RATIO;
  roundRectPath(ctx, x - w / 2, bodyTopY, w, bodyH, w * BODY_CORNER_RATIO);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, bodyTopY - headD / 2, headD / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (style.item === 'shield') drawShield(ctx, x, bodyCy, w, bodyH, style.facing);
  else if (style.item === 'spear') drawSpear(ctx, x, footY, w, h, style.facing);
  else drawHammer(ctx, x, bodyCy, w, h, style.facing);
  if (unit.big) drawFlag(ctx, x, headTopY, w, h, style.facing);
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
