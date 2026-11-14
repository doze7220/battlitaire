/**
 * 責務: タイトル画面（暗い背景・ゲーム名・「はじめる」ボタン）を描く。
 * 状態は変えず、座標は配置（TitleLayout）からだけ読む。
 */

import { roundRectPath } from './cardView.js';
import { TITLE_TEXT } from './titleText.js';

/** 背景の色（暗い色）。 */
const BACKGROUND_FILL = '#101820';
/** ゲーム名のフォント。 */
const TITLE_FONT = 'bold 96px sans-serif';
/** ゲーム名の文字の色。 */
const TITLE_COLOR = '#ffe680';
/** ボタンの塗りの色。 */
const BUTTON_FILL = '#2a6f4a';
/** ボタンの縁の色。 */
const BUTTON_STROKE = '#bfe8cf';
/** ボタンの縁の太さ。 */
const BUTTON_LINE_WIDTH = 4;
/** ボタンの角の丸み。 */
const BUTTON_RADIUS = 24;
/** ボタンの文字のフォント。 */
const BUTTON_FONT = 'bold 48px sans-serif';
/** ボタンの文字の色。 */
const BUTTON_TEXT_COLOR = '#ffffff';

/**
 * タイトル画面（背景・ゲーム名・「はじめる」ボタン）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').TitleLayout} titleLayout タイトル画面の配置
 * @returns {void}
 */
export function drawTitle(ctx, titleLayout) {
  const { screen, title, startButton: b } = titleLayout;
  ctx.save();
  ctx.fillStyle = BACKGROUND_FILL;
  ctx.fillRect(0, 0, screen.width, screen.height);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = TITLE_FONT;
  ctx.fillStyle = TITLE_COLOR;
  ctx.fillText(TITLE_TEXT.gameName, title.x, title.y, title.maxW);

  roundRectPath(ctx, b.x, b.y, b.w, b.h, BUTTON_RADIUS);
  ctx.fillStyle = BUTTON_FILL;
  ctx.fill();
  ctx.lineWidth = BUTTON_LINE_WIDTH;
  ctx.strokeStyle = BUTTON_STROKE;
  ctx.stroke();

  ctx.font = BUTTON_FONT;
  ctx.fillStyle = BUTTON_TEXT_COLOR;
  ctx.fillText(TITLE_TEXT.start, b.x + b.w / 2, b.y + b.h / 2, titleLayout.startTextMaxW);
  ctx.restore();
}
