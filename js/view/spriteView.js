/**
 * 責務: スプライトJSの import と識別子・絵の範囲の表を持ち、位置と大きさを合わせて draw(ctx) を呼ぶ。
 * assets/sprites/ を import するのはこのモジュールだけ。状態は変えず、ルール層・anim は import しない。
 */

import background from 'assets/sprites/background.js';
import unitCastle from 'assets/sprites/unit_castle.js';
import unitGiant from 'assets/sprites/unit_giant.js';
import unitDragon from 'assets/sprites/unit_dragon.js';
import unitSolder from 'assets/sprites/unit_solder.js';
import unitGoblin from 'assets/sprites/unit_goblin.js';
import suitSword from 'assets/sprites/suit_sword.js';
import suitShield from 'assets/sprites/suit_shield.js';
import suitHammer from 'assets/sprites/suit_hammer.js';
import suitGold from 'assets/sprites/suit_gold.js';

/**
 * 矩形。
 * @typedef {object} Rect
 * @property {number} x 左端
 * @property {number} y 上端
 * @property {number} w 幅
 * @property {number} h 高さ
 */

/**
 * スプライトの識別子（呼ぶ側はこの定数で絵を指す）。
 * @type {Readonly<{background: string, castle: string, giant: string, dragon: string, soldier: string, goblin: string, sword: string, shield: string, hammer: string, gold: string}>}
 */
export const SPRITE_IDS = Object.freeze({
  background: 'background',
  castle: 'castle',
  giant: 'giant',
  dragon: 'dragon',
  soldier: 'soldier',
  goblin: 'goblin',
  sword: 'sword',
  shield: 'shield',
  hammer: 'hammer',
  gold: 'gold',
});

/**
 * 絵の範囲（基準点 (0, 0) から見た範囲。単位 px、y は下向き）。スプライトの bounds は実行時に読まない。
 * @typedef {object} SpriteEntry
 * @property {{draw: function(CanvasRenderingContext2D): void}} sprite import したスプライト
 * @property {number} minX x の最小
 * @property {number} maxX x の最大
 * @property {number} minY y の最小
 * @property {number} maxY y の最大（足元）
 */

/**
 * 識別子 → 絵と絵の範囲の凍結した表。
 * @type {Readonly<Record<string, Readonly<SpriteEntry>>>}
 */
const SPRITE_TABLE = Object.freeze({
  [SPRITE_IDS.background]: Object.freeze({ sprite: background, minX: -360, maxX: 360, minY: -260, maxY: 100 }),
  [SPRITE_IDS.castle]: Object.freeze({ sprite: unitCastle, minX: -115, maxX: 101, minY: -292, maxY: 150 }),
  [SPRITE_IDS.giant]: Object.freeze({ sprite: unitGiant, minX: -113, maxX: 160, minY: -153, maxY: 243 }),
  [SPRITE_IDS.dragon]: Object.freeze({ sprite: unitDragon, minX: -150, maxX: 168, minY: -196, maxY: 200 }),
  [SPRITE_IDS.soldier]: Object.freeze({ sprite: unitSolder, minX: -99, maxX: 99, minY: -98, maxY: 98 }),
  [SPRITE_IDS.goblin]: Object.freeze({ sprite: unitGoblin, minX: -99, maxX: 99, minY: -98, maxY: 98 }),
  [SPRITE_IDS.sword]: Object.freeze({ sprite: suitSword, minX: -39.5, maxX: 40.5, minY: -100.5, maxY: 99.5 }),
  [SPRITE_IDS.shield]: Object.freeze({ sprite: suitShield, minX: -80.5, maxX: 80.5, minY: -100.5, maxY: 100.5 }),
  [SPRITE_IDS.hammer]: Object.freeze({ sprite: suitHammer, minX: -60.5, maxX: 60.5, minY: -90.5, maxY: 90.5 }),
  [SPRITE_IDS.gold]: Object.freeze({ sprite: suitGold, minX: -70.5, maxX: 70.5, minY: -89.5, maxY: 85.5 }),
});

/**
 * 識別子から絵と絵の範囲を引く。未知の識別子は Error。
 * @param {string} id SPRITE_IDS の値
 * @returns {Readonly<SpriteEntry>} 絵と絵の範囲
 * @throws {Error} 未知の識別子のとき
 */
function lookupSprite(id) {
  if (!Object.prototype.hasOwnProperty.call(SPRITE_TABLE, id)) {
    throw new Error(`spriteView: 未知のスプライトの識別子です: ${id}`);
  }
  return SPRITE_TABLE[id];
}

/**
 * 絵の高さを height にしたときの、絵の範囲の矩形を求める（縦横比は絵の範囲から）。
 * 横は絵の範囲の中央を centerX に、下端を footY にそろえる。
 * @param {string} id SPRITE_IDS の値
 * @param {number} centerX 絵の中心の x
 * @param {number} footY 絵の下端（足元）の y
 * @param {number} height 絵の高さ
 * @returns {Rect} 絵の範囲の矩形
 */
export function spriteFitRect(id, centerX, footY, height) {
  const e = lookupSprite(id);
  const w = height * (e.maxX - e.minX) / (e.maxY - e.minY);
  return { x: centerX - w / 2, y: footY - height, w, h: height };
}

/**
 * 縦横比を保ったまま絵の範囲が rect に収まる最大の倍率で、横は中央・縦は下端をそろえて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id SPRITE_IDS の値
 * @param {Rect} rect 絵を収める矩形
 * @returns {void}
 */
export function drawSpriteFit(ctx, id, rect) {
  const e = lookupSprite(id);
  const bw = e.maxX - e.minX;
  const bh = e.maxY - e.minY;
  const s = Math.min(rect.w / bw, rect.h / bh);
  const left = rect.x + (rect.w - bw * s) / 2;
  ctx.save();
  ctx.translate(left - e.minX * s, rect.y + rect.h - e.maxY * s);
  ctx.scale(s, s);
  e.sprite.draw(ctx);
  ctx.restore();
}

/**
 * 絵の範囲の長い方の辺が size になる倍率で、絵の範囲の中心を (cx, cy) にそろえて描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} id SPRITE_IDS の値
 * @param {number} cx 絵の中心の x
 * @param {number} cy 絵の中心の y
 * @param {number} size 絵の範囲の長い方の辺の長さ
 * @returns {void}
 */
export function drawSpriteCentered(ctx, id, cx, cy, size) {
  const e = lookupSprite(id);
  const bw = e.maxX - e.minX;
  const bh = e.maxY - e.minY;
  const s = size / Math.max(bw, bh);
  ctx.save();
  ctx.translate(cx - ((e.minX + e.maxX) / 2) * s, cy - ((e.minY + e.maxY) / 2) * s);
  ctx.scale(s, s);
  e.sprite.draw(ctx);
  ctx.restore();
}

/**
 * 兵1体（体の絵＋持ち物の絵）を、足元を (x, footY) にそろえて描く。tilt が 0 でなければ足元を軸に傾ける。
 * 兵1体ごとにオブジェクトを作らないよう、引数は位置で受ける。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} bodyId 体の絵の識別子（SPRITE_IDS の値）
 * @param {string|null} itemId 持ち物の絵の識別子（null なら描かない）
 * @param {number} x 足元の x
 * @param {number} footY 足元の y
 * @param {number} size 体の直径（長い方の辺）
 * @param {number} tilt 傾き（rad。足元を軸）
 * @param {number} itemSize 持ち物の大きさ（長い方の辺）
 * @param {number} itemDX 持ち物の中心の x のずれ（体の中心から。前＝右が正）
 * @param {number} itemDY 持ち物の中心の y のずれ（体の中心から。下が正）
 * @returns {void}
 */
export function drawTroopFigure(ctx, bodyId, itemId, x, footY, size, tilt, itemSize, itemDX, itemDY) {
  ctx.save();
  ctx.translate(x, footY);
  if (tilt !== 0) ctx.rotate(tilt);
  drawSpriteCentered(ctx, bodyId, 0, -size / 2, size);
  if (itemId !== null) {
    drawSpriteCentered(ctx, itemId, itemDX, -size / 2 + itemDY, itemSize);
  }
  ctx.restore();
}
