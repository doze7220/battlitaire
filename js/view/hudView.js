/**
 * 責務: 右側パネルのゲージの名前と数値、残りの行動回数、「行動終了」の表示を描く。
 * 押せるときは攻防へ進むボタンとしての見た目にする。状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { gaugeLabel } from './suitStyle.js';

const PANEL_FILL = 'rgba(0, 0, 0, 0.25)';
const PANEL_CORNER = 12;
const ROW_FILL = 'rgba(255, 255, 255, 0.08)';
const ROW_CORNER = 8;
const ROW_PADDING_X = 16;
const LABEL_FONT = 'bold 24px sans-serif';
const VALUE_FONT = 'bold 30px sans-serif';
const TEXT_COLOR = '#f0f0f0';
const ACTIONS_FONT = 'bold 26px sans-serif';
const ACTIONS_LABEL = '行動';
const END_TEXT = '行動終了';
const END_FONT = 'bold 44px sans-serif';
const END_FILL = 'rgba(160, 30, 30, 0.8)';
const END_COLOR = '#ffffff';
const END_READY_STROKE = '#ffe680';
const END_READY_STROKE_WIDTH = 4;
const END_READY_MAIN_OFFSET = -0.2;
const END_READY_SUB_OFFSET = 0.28;
const END_READY_SUB_TEXT = 'タップで攻防へ';
const END_READY_SUB_FONT = 'bold 22px sans-serif';

/**
 * 右側パネルを描く。ゲージは gauges のキーの順に並べる。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').HudLayout} hudLayout パネルの配置
 * @param {Object<string, number>} gauges ゲージ（識別子 → 値）
 * @param {number} actionsLeft 残りの行動回数
 * @param {number} actionsMax 行動回数の最大
 * @param {boolean} outOfActions 行動を使い切ったか（true なら「行動終了」を出す）
 * @param {boolean} battleReady 攻防へ進めるか（true なら「行動終了」を押せるボタンの見た目にする）
 * @returns {void}
 */
export function drawHud(ctx, hudLayout, gauges, actionsLeft, actionsMax, outOfActions, battleReady) {
  const { panel, actions, actionEnd, gaugeH } = hudLayout;
  ctx.save();
  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, PANEL_CORNER);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();

  ctx.textBaseline = 'middle';
  const keys = Object.keys(gauges);
  for (let i = 0; i < keys.length; i++) {
    const y = hudLayout.gaugeY(i);
    roundRectPath(ctx, actions.x, y, actions.w, gaugeH, ROW_CORNER);
    ctx.fillStyle = ROW_FILL;
    ctx.fill();
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'left';
    ctx.font = LABEL_FONT;
    ctx.fillText(gaugeLabel(keys[i]), actions.x + ROW_PADDING_X, y + gaugeH / 2);
    ctx.textAlign = 'right';
    ctx.font = VALUE_FONT;
    ctx.fillText(String(gauges[keys[i]]), actions.x + actions.w - ROW_PADDING_X, y + gaugeH / 2);
  }

  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'left';
  ctx.font = ACTIONS_FONT;
  ctx.fillText(ACTIONS_LABEL, actions.x + ROW_PADDING_X, actions.y + actions.h / 2);
  ctx.textAlign = 'right';
  ctx.fillText(`${actionsLeft} / ${actionsMax}`, actions.x + actions.w - ROW_PADDING_X, actions.y + actions.h / 2);

  if (outOfActions) {
    roundRectPath(ctx, actionEnd.x, actionEnd.y, actionEnd.w, actionEnd.h, ROW_CORNER);
    ctx.fillStyle = END_FILL;
    ctx.fill();
    ctx.fillStyle = END_COLOR;
    ctx.textAlign = 'center';
    ctx.font = END_FONT;
    const cx = actionEnd.x + actionEnd.w / 2;
    const cy = actionEnd.y + actionEnd.h / 2;
    if (battleReady) {
      ctx.strokeStyle = END_READY_STROKE;
      ctx.lineWidth = END_READY_STROKE_WIDTH;
      ctx.stroke();
      ctx.fillText(END_TEXT, cx, cy + actionEnd.h * END_READY_MAIN_OFFSET);
      ctx.font = END_READY_SUB_FONT;
      ctx.fillText(END_READY_SUB_TEXT, cx, cy + actionEnd.h * END_READY_SUB_OFFSET);
    } else {
      ctx.fillText(END_TEXT, cx, cy);
    }
  }
  ctx.restore();
}
