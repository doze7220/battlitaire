/**
 * 責務: タイトル画面（暗い背景・ゲーム名・中断データがあるときの「再開」ボタン・「はじめる」ボタン・縁だけの「遊び方」「設定」ボタン）を描く。
 * 状態は変えず、座標は配置（TitleLayout）からだけ読む。
 */

import { roundRectPath } from './cardView.js';
import { TITLE_TEXT, resumePlaceText } from './titleText.js';

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

/** 「再開」ボタンの塗りの色（「はじめる」の緑と見分けがつく橙）。 */
const RESUME_FILL = '#a3611a';
/** 「再開」ボタンの縁の色。 */
const RESUME_STROKE = '#ffe680';
/** 「再開」の下の STAGE・TURN の文字のフォント。 */
const RESUME_PLACE_FONT = 'bold 26px sans-serif';

/** 「遊び方」ボタンの縁の色（「はじめる」の縁と同じ）。 */
const HOWTO_STROKE = '#bfe8cf';
/** 「遊び方」ボタンの縁の太さ。 */
const HOWTO_LINE_WIDTH = 3;
/** 「遊び方」ボタンの文字のフォント（「はじめる」より小さい）。 */
const HOWTO_FONT = 'bold 40px sans-serif';
/** 「遊び方」ボタンの文字の色。 */
const HOWTO_TEXT_COLOR = '#bfe8cf';

/**
 * タイトル画面（背景・ゲーム名・中断データがあるときの「再開」ボタン・「はじめる」ボタン・縁だけの「遊び方」「設定」ボタン）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').TitleLayout} titleLayout タイトル画面の配置
 * @param {{ stageNumber: number, battleTurn: number }|null} resumePlace 「再開」の下に出す場所（中断データがないときは null。配置の resumeButton があるときだけ描く）
 * @returns {void}
 */
export function drawTitle(ctx, titleLayout, resumePlace) {
  const { screen, title, startButton: b, howToButton: h, settingsButton: s } = titleLayout;
  ctx.save();
  ctx.fillStyle = BACKGROUND_FILL;
  ctx.fillRect(0, 0, screen.width, screen.height);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.font = TITLE_FONT;
  ctx.fillStyle = TITLE_COLOR;
  ctx.fillText(TITLE_TEXT.gameName, title.x, title.y, title.maxW);

  if (titleLayout.resumeButton !== null && resumePlace !== null) {
    const r = titleLayout.resumeButton;
    roundRectPath(ctx, r.x, r.y, r.w, r.h, BUTTON_RADIUS);
    ctx.fillStyle = RESUME_FILL;
    ctx.fill();
    ctx.lineWidth = BUTTON_LINE_WIDTH;
    ctx.strokeStyle = RESUME_STROKE;
    ctx.stroke();

    ctx.font = BUTTON_FONT;
    ctx.fillStyle = BUTTON_TEXT_COLOR;
    ctx.fillText(TITLE_TEXT.resume, r.x + r.w / 2, titleLayout.resumeTextY, titleLayout.startTextMaxW);
    ctx.font = RESUME_PLACE_FONT;
    ctx.fillText(
      resumePlaceText(resumePlace.stageNumber, resumePlace.battleTurn),
      r.x + r.w / 2,
      titleLayout.resumePlaceY,
      titleLayout.startTextMaxW,
    );
  }

  roundRectPath(ctx, b.x, b.y, b.w, b.h, BUTTON_RADIUS);
  ctx.fillStyle = BUTTON_FILL;
  ctx.fill();
  ctx.lineWidth = BUTTON_LINE_WIDTH;
  ctx.strokeStyle = BUTTON_STROKE;
  ctx.stroke();

  ctx.font = BUTTON_FONT;
  ctx.fillStyle = BUTTON_TEXT_COLOR;
  ctx.fillText(TITLE_TEXT.start, b.x + b.w / 2, b.y + b.h / 2, titleLayout.startTextMaxW);

  roundRectPath(ctx, h.x, h.y, h.w, h.h, BUTTON_RADIUS);
  ctx.lineWidth = HOWTO_LINE_WIDTH;
  ctx.strokeStyle = HOWTO_STROKE;
  ctx.stroke();

  ctx.font = HOWTO_FONT;
  ctx.fillStyle = HOWTO_TEXT_COLOR;
  ctx.fillText(TITLE_TEXT.howTo, h.x + h.w / 2, h.y + h.h / 2, titleLayout.startTextMaxW);

  roundRectPath(ctx, s.x, s.y, s.w, s.h, BUTTON_RADIUS);
  ctx.lineWidth = HOWTO_LINE_WIDTH;
  ctx.strokeStyle = HOWTO_STROKE;
  ctx.stroke();

  ctx.font = HOWTO_FONT;
  ctx.fillStyle = HOWTO_TEXT_COLOR;
  ctx.fillText(TITLE_TEXT.settings, s.x + s.w / 2, s.y + s.h / 2, titleLayout.startTextMaxW);
  ctx.restore();
}
