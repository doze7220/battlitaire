/**
 * 責務: 最下段（UI）の残りの行動回数と「行動終了」の表示を描く。
 * 押せるときは攻防へ進むボタンとしての見た目にする。状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';

/** 段の背景の塗りつぶしの色。 */
const PANEL_FILL = 'rgba(0, 0, 0, 0.25)';
/** 行動の枠の塗りつぶしの色。 */
const ROW_FILL = 'rgba(255, 255, 255, 0.08)';
/** 枠の角の半径。 */
const ROW_CORNER = 8;
/** 枠の左端から文字までの余白。 */
const ROW_PADDING_X = 16;
/** 文字の色。 */
const TEXT_COLOR = '#f0f0f0';
/** 行動の枠の文字のフォント。 */
const ACTIONS_FONT = 'bold 26px sans-serif';
/** 行動の枠の見出し。 */
const ACTIONS_LABEL = '行動';
/** 行動終了の文字。 */
const END_TEXT = '行動終了';
/** 行動終了の文字のフォント。 */
const END_FONT = 'bold 44px sans-serif';
/** 行動終了の塗りつぶしの色。 */
const END_FILL = 'rgba(160, 30, 30, 0.8)';
/** 行動終了の文字の色。 */
const END_COLOR = '#ffffff';
/** 押せるときの行動終了の縁の色。 */
const END_READY_STROKE = '#ffe680';
/** 押せるときの行動終了の縁の太さ。 */
const END_READY_STROKE_WIDTH = 4;
/** 押せるときの「行動終了」の文字の位置のずれ（枠の高さに対する割合）。 */
const END_READY_MAIN_OFFSET = -0.2;
/** 押せるときの補助文の位置のずれ（枠の高さに対する割合）。 */
const END_READY_SUB_OFFSET = 0.28;
/** 押せるときの補助文。 */
const END_READY_SUB_TEXT = 'タップで攻防へ';
/** 押せるときの補助文のフォント。 */
const END_READY_SUB_FONT = 'bold 22px sans-serif';

/**
 * 最下段（UI）を描く（残りの行動回数と「行動終了」。ゲージは gaugeView.js が描く）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').HudLayout} hudLayout 最下段の配置
 * @param {number} actionsLeft 残りの行動回数
 * @param {number} actionsMax 行動回数の最大
 * @param {boolean} outOfActions 行動を使い切ったか（true なら「行動終了」を出す）
 * @param {boolean} battleReady 攻防へ進めるか（true なら「行動終了」を押せるボタンの見た目にする）
 * @returns {void}
 */
export function drawHud(ctx, hudLayout, actionsLeft, actionsMax, outOfActions, battleReady) {
  const { panel, actions, actionEnd } = hudLayout;
  ctx.save();
  ctx.fillStyle = PANEL_FILL;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

  ctx.textBaseline = 'middle';

  roundRectPath(ctx, actions.x, actions.y, actions.w, actions.h, ROW_CORNER);
  ctx.fillStyle = ROW_FILL;
  ctx.fill();
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
