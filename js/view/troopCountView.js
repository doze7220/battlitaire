/**
 * 責務: 戦闘の段の左上に、攻撃・防御・修理の兵の人数（スートの絵と人数の文字）を枠つきで描く。
 * 状態は変えず、人数は渡された値をそのまま文字にする。ルール層・演出の記録は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { drawSpriteCentered } from './spriteView.js';
import { gaugeSprite } from './suitStyle.js';

/**
 * 人数を表示する役割の順（攻撃・防御・修理）。
 * @type {ReadonlyArray<string>}
 */
export const ROLE_ORDER = Object.freeze(['attack', 'defense', 'heal']);

/** 枠の塗りの色 */
const BOX_FILL = 'rgba(20, 24, 36, 0.6)';
/** 枠の角の半径 */
const BOX_RADIUS = 8;
/** 人数の文字のフォント */
const COUNT_FONT = 'bold 20px sans-serif';
/** 人数の文字の色 */
const COUNT_COLOR = '#ffffff';

/**
 * 人数の表示（枠・役割ごとの絵と文字）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout['troopCounter']} counterLayout 配置（枠・絵の大きさ・項目ごとの位置。項目は ROLE_ORDER の順）
 * @param {{ attack: number, defense: number, heal: number }} counts 役割ごとの人数
 * @returns {void}
 */
export function drawTroopCounter(ctx, counterLayout, counts) {
  const { box, iconSize, items } = counterLayout;
  ctx.save();
  roundRectPath(ctx, box.x, box.y, box.w, box.h, BOX_RADIUS);
  ctx.fillStyle = BOX_FILL;
  ctx.fill();
  ctx.font = COUNT_FONT;
  ctx.fillStyle = COUNT_COLOR;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < ROLE_ORDER.length; i += 1) {
    const role = ROLE_ORDER[i];
    const item = items[i];
    const spriteId = gaugeSprite(role);
    if (spriteId !== null) drawSpriteCentered(ctx, spriteId, item.iconX, item.iconY, iconSize);
    ctx.fillText(String(counts[role]), item.textX, item.textY);
  }
  ctx.restore();
}
