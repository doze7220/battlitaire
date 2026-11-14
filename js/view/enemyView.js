/**
 * 責務: 戦闘の段の敵の仮の図形（巨人・ドラゴンの玉、ゴブリンの軍勢の兵の群れ）と、常時防御力のシールドマークを描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { drawTroops } from './troopView.js';

/** 表にない敵の種類の玉の色。 */
const DEFAULT_ORB_COLOR = '#b5463f';
/** ゴブリンの群れの兵の数（HP とは連動しない）。 */
const HORDE_COUNT = 12;
/** 群れの兵の種類（troopView.js の種類）。 */
const HORDE_KIND = 'goblin';
/** シールドマークの塗りの色。 */
const SHIELD_FILL_COLOR = '#9fb4d0';
/** シールドマークが光っているときの塗りの色。 */
const SHIELD_FLASH_COLOR = '#fff6c0';
/** シールドマークの縁の色。 */
const SHIELD_STROKE_COLOR = '#1f2a3d';
/** シールドマークの縁の太さの、マークの幅に対する割合。 */
const SHIELD_STROKE_RATIO = 0.08;
/** 盾の形の、側面が下へ延びる位置の、マークの高さに対する割合（ここから下がとがる）。 */
const SHIELD_SHOULDER_RATIO = 0.55;

/**
 * 敵の種類ごとの見た目。
 * @typedef {object} EnemyLook
 * @property {'horde'|'orb'} shape 図形の種類（兵の群れ・玉）
 * @property {string} [color] 玉の色（玉のとき）
 */

/**
 * 敵の種類の識別子 → 見た目の表。
 * @type {Readonly<Record<string, Readonly<EnemyLook>>>}
 */
const ENEMY_LOOKS = Object.freeze({
  goblins: Object.freeze({ shape: 'horde' }),
  giant: Object.freeze({ shape: 'orb', color: '#5c9a4a' }),
  dragon: Object.freeze({ shape: 'orb', color: '#c0392b' }),
});

/**
 * 玉（矩形に内接する丸）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 敵の矩形
 * @param {string} color 玉の色
 * @returns {void}
 */
function drawOrb(ctx, rect, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * ゴブリンの軍勢の兵の群れを描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {void}
 */
function drawHorde(ctx, battleLayout) {
  const units = battleLayout.hordeSlots(HORDE_COUNT).map((slot) => ({
    kind: HORDE_KIND,
    big: false,
    x: slot.x,
    footY: slot.footY,
    w: slot.w,
    h: slot.h,
    alpha: 1,
  }));
  drawTroops(ctx, units);
}

/**
 * シールドマーク（上が平らで下がとがった五角形）を1つ描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect マークの矩形
 * @param {boolean} flash 光らせるか
 * @returns {void}
 */
function drawShieldMark(ctx, rect, flash) {
  const { x, y, w, h } = rect;
  const shoulderY = y + h * SHIELD_SHOULDER_RATIO;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, shoulderY);
  ctx.lineTo(x + w / 2, y + h);
  ctx.lineTo(x, shoulderY);
  ctx.closePath();
  ctx.fillStyle = flash ? SHIELD_FLASH_COLOR : SHIELD_FILL_COLOR;
  ctx.fill();
  ctx.strokeStyle = SHIELD_STROKE_COLOR;
  ctx.lineWidth = w * SHIELD_STROKE_RATIO;
  ctx.stroke();
  ctx.restore();
}

/**
 * 敵の図形（玉または兵の群れ）と、常時防御力の数のシールドマークを描く。引数は読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @param {{ typeId: string, armor: number }} enemy 描く敵（種類の識別子と常時防御力）
 * @param {{ shieldFlash: boolean }} options 表示の指定（shieldFlash: シールドマークを明るく描くか）
 * @returns {void}
 */
export function drawEnemyFigure(ctx, battleLayout, enemy, { shieldFlash }) {
  ctx.save();
  const look = Object.prototype.hasOwnProperty.call(ENEMY_LOOKS, enemy.typeId) ? ENEMY_LOOKS[enemy.typeId] : null;
  if (look !== null && look.shape === 'horde') drawHorde(ctx, battleLayout);
  else drawOrb(ctx, battleLayout.enemy, look !== null ? look.color : DEFAULT_ORB_COLOR);
  if (enemy.armor > 0) {
    for (const rect of battleLayout.shieldRects(enemy.armor)) drawShieldMark(ctx, rect, shieldFlash);
  }
  ctx.restore();
}
