/**
 * 責務: 戦闘の段の左上に、攻撃・防御・修理の兵の人数（スートの絵と数の文字。精鋭の上振れがあれば数をオレンジにして右下に「+◯」）を枠つきで描く。
 * 状態は変えず、数は渡された値をそのまま文字にする。ルール層・演出の記録は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { drawSpriteCentered } from './spriteView.js';
import { gaugeSprite } from './suitStyle.js';
import { ELITE_ACCENT_COLOR } from './eliteStyle.js';

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
/** 上振れ「+◯」のフォント（数の約半分の大きさ） */
const EXTRA_FONT = 'bold 11px sans-serif';
/** 数の右端と「+◯」の左端の間隔 */
const EXTRA_GAP_X = 2;
/** 「+◯」の中心 y の、数の中心 y からの下へのずれ（右下に置く） */
const EXTRA_DY = 6;
/** 上振れがないときの上振れの値 */
const NO_EXTRAS = Object.freeze({ attack: 0, defense: 0, heal: 0 });

/**
 * 人数の表示（枠・役割ごとの絵と文字）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout['troopCounter']} counterLayout 配置（枠・絵の大きさ・項目ごとの位置。項目は ROLE_ORDER の順）
 * @param {{ attack: number, defense: number, heal: number }} counts 役割ごとの数（人数 + 精鋭の上振れ）
 * @param {{ attack: number, defense: number, heal: number }} [extras] 役割ごとの上振れ（0 より大きいと数をオレンジにして右下に「+◯」を出す。省略は 0）
 * @returns {void}
 */
export function drawTroopCounter(ctx, counterLayout, counts, extras = NO_EXTRAS) {
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
    const extra = extras[role] ?? 0;
    const text = String(counts[role]);
    if (extra > 0) {
      ctx.font = COUNT_FONT;
      ctx.fillStyle = ELITE_ACCENT_COLOR;
      ctx.fillText(text, item.textX, item.textY);
      const textW = ctx.measureText(text).width;
      ctx.font = EXTRA_FONT;
      ctx.fillText(`+${extra}`, item.textX + textW + EXTRA_GAP_X, item.textY + EXTRA_DY);
      ctx.font = COUNT_FONT;
      ctx.fillStyle = COUNT_COLOR;
    } else {
      ctx.fillText(text, item.textX, item.textY);
    }
  }
  ctx.restore();
}
