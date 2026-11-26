/**
 * 責務: 結果の画面（暗幕・板・見える範囲で切り抜いた中身・位置の表示・ボタン）を描く。
 * 状態は変えず、ルール層は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { drawEnemyPortrait } from './enemyPortrait.js';
import { PORTRAIT_HORDE, LOST_HORDE, scrollThumb } from './resultLayout.js';
import { RESULT_TEXT } from './resultText.js';

/** 画面全体の暗幕の色。 */
const CURTAIN_FILL = 'rgba(0, 0, 0, 0.7)';
/** 結果の板の塗りの色（不透明に近い暗い色）。 */
const PANEL_FILL = 'rgba(16, 20, 28, 0.94)';
/** 結果の板の縁の色。 */
const PANEL_STROKE = '#8a94a6';
/** 結果の板の縁の太さ。 */
const PANEL_LINE_WIDTH = 4;
/** 結果の板の角の丸み。 */
const PANEL_RADIUS = 24;
/** 負けの文字の色。 */
const LOSE_COLOR = '#ff7a7a';

/** 結果の画面の見出しの下線の色。 */
const SCREEN_LINE_COLOR = '#4a5568';
/** 結果の画面の文字の色。 */
const TEXT_COLOR = '#f0f0f0';
/** 結果の画面の見出しの色。 */
const HEADING_COLOR = '#9fb4d8';
/** NEW の色（金色）。 */
const GOLD_COLOR = '#ffd84a';
/** 負けた敵の絵の枠の色。 */
const LOST_FRAME_COLOR = '#ff7a7a';
/** 負けた敵の絵の枠の太さ。 */
const LOST_FRAME_WIDTH = 3;
/** 「負け」の文字のフォント。 */
const SCREEN_OUTCOME_FONT = 'bold 40px sans-serif';
/** 倒した数・スコアの項目名のフォント。 */
const HEADLINE_LABEL_FONT = '28px sans-serif';
/** 倒した数・スコアの値のフォント（中身でいちばん大きい文字）。 */
const HEADLINE_VALUE_FONT = 'bold 72px sans-serif';
/** 倒した数・スコアの項目名の中心の、部品の上端からの距離。 */
const HEADLINE_LABEL_DY = 20;
/** 倒した数・スコアの値の中心の、部品の上端からの距離。 */
const HEADLINE_VALUE_DY = 86;
/** 区切りの見出しのフォント。 */
const HEADING_FONT = 'bold 30px sans-serif';
/** 見出しの下線の、部品の下端からの距離。 */
const HEADING_LINE_DY = 6;
/** 見出しの下線の太さ。 */
const HEADING_LINE_H = 2;
/** 倒した数・スコアの欄の文字の最大幅を、欄の幅から減らす量。 */
const HEADLINE_TEXT_PAD = 8;
/** 行の項目名のフォント。 */
const ROW_LABEL_FONT = '30px sans-serif';
/** 行の値のフォント。 */
const ROW_VALUE_FONT = 'bold 32px sans-serif';
/** 行の項目名の最大幅の、行の幅に対する割合。 */
const ROW_LABEL_RATIO = 0.62;
/** NEW のフォント。 */
const NEW_FONT = 'bold 24px sans-serif';
/** 項目名と NEW の間。 */
const NEW_GAP = 12;
/** NEW の最大幅。 */
const NEW_MAX_W = 70;
/** 行の値の最大幅を、値の欄の幅から減らす量。 */
const ROW_VALUE_PAD = 12;
/** 負けた敵の名前のフォント。 */
const LOST_TEXT_FONT = 'bold 30px sans-serif';
/** 1行の文字のフォント。 */
const LINE_FONT = '26px sans-serif';
/** 位置の表示のつまみの色。 */
const THUMB_FILL = 'rgba(159, 180, 216, 0.7)';
/** ボタンの塗りの色。 */
const BUTTON_FILL = '#2f3d57';
/** 押している間のボタンの塗りの色（明るい）。 */
const BUTTON_FILL_PRESSED = '#5f7cb0';
/** ボタンの縁の色。 */
const BUTTON_STROKE = '#aab4c8';
/** ボタンの縁の太さ。 */
const BUTTON_LINE_WIDTH = 3;
/** ボタンの角の丸み。 */
const BUTTON_RADIUS = 16;
/** ボタンの文字のフォント。 */
const BUTTON_FONT = 'bold 34px sans-serif';

/**
 * 部品の描き方。
 * @callback PieceDrawer
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./resultLayout.js').ResultPiece} piece 部品
 * @param {number} top 部品の上端の画面の y（スクロール後）
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置（敵の絵に使う）
 * @returns {void}
 */

/**
 * 「負け」の部品を描く。
 * @type {PieceDrawer}
 */
function drawOutcomePiece(ctx, piece, top) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = SCREEN_OUTCOME_FONT;
  ctx.fillStyle = LOSE_COLOR;
  ctx.fillText(piece.text, piece.x + piece.w / 2, top + piece.h / 2, piece.w);
}

/**
 * 倒した数とスコアの部品を描く。
 * @type {PieceDrawer}
 */
function drawHeadlinePiece(ctx, piece, top) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const cell of piece.cells) {
    const cx = cell.x + cell.w / 2;
    ctx.font = HEADLINE_LABEL_FONT;
    ctx.fillStyle = HEADING_COLOR;
    ctx.fillText(RESULT_TEXT.headlineLabels[cell.key], cx, top + HEADLINE_LABEL_DY, cell.w - HEADLINE_TEXT_PAD);
    ctx.font = HEADLINE_VALUE_FONT;
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(cell.value, cx, top + HEADLINE_VALUE_DY, cell.w - HEADLINE_TEXT_PAD);
  }
}

/**
 * 区切りの見出しの部品を描く。
 * @type {PieceDrawer}
 */
function drawHeadingPiece(ctx, piece, top) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = HEADING_FONT;
  ctx.fillStyle = HEADING_COLOR;
  ctx.fillText(RESULT_TEXT.headings[piece.key], piece.x, top + piece.h / 2, piece.w);
  ctx.fillStyle = SCREEN_LINE_COLOR;
  ctx.fillRect(piece.x, top + piece.h - HEADING_LINE_DY, piece.w, HEADING_LINE_H);
}

/**
 * 項目名と値の行の部品を描く（更新したときは項目名の右に金色の NEW）。
 * @type {PieceDrawer}
 */
function drawRowPiece(ctx, piece, top) {
  const y = top + piece.h / 2;
  const labelMaxW = piece.w * ROW_LABEL_RATIO;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = ROW_LABEL_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(piece.label, piece.x, y, labelMaxW);
  if (piece.isNew) {
    const labelW = Math.min(ctx.measureText(piece.label).width, labelMaxW);
    ctx.font = NEW_FONT;
    ctx.fillStyle = GOLD_COLOR;
    ctx.fillText(RESULT_TEXT.newMark, piece.x + labelW + NEW_GAP, y, NEW_MAX_W);
  }
  ctx.textAlign = 'right';
  ctx.font = ROW_VALUE_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(piece.value, piece.x + piece.w, y, piece.w * (1 - ROW_LABEL_RATIO) - ROW_VALUE_PAD);
}

/**
 * 倒した敵の絵の並びの部品を描く。
 * @type {PieceDrawer}
 */
function drawPortraitsPiece(ctx, piece, top, battleLayout) {
  for (const item of piece.items) {
    const rect = { x: item.rect.x, y: top + (item.rect.y - piece.y), w: item.rect.w, h: item.rect.h };
    drawEnemyPortrait(ctx, battleLayout, item.typeId, rect, PORTRAIT_HORDE);
  }
}

/**
 * 負けた敵の部品（絵を赤い枠で囲み、右に名前と Lv）を描く。
 * @type {PieceDrawer}
 */
function drawLostPiece(ctx, piece, top, battleLayout) {
  const rect = { x: piece.rect.x, y: top + (piece.rect.y - piece.y), w: piece.rect.w, h: piece.rect.h };
  drawEnemyPortrait(ctx, battleLayout, piece.typeId, rect, LOST_HORDE);
  ctx.lineWidth = LOST_FRAME_WIDTH;
  ctx.strokeStyle = LOST_FRAME_COLOR;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = LOST_TEXT_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(piece.text, piece.textX, top + piece.h / 2, piece.textW);
}

/**
 * 1行の文字の部品を描く（`text` がなければ文字の表の `key` で引く）。
 * @type {PieceDrawer}
 */
function drawLinePiece(ctx, piece, top) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = LINE_FONT;
  ctx.fillStyle = TEXT_COLOR;
  const text = piece.text !== undefined ? piece.text : RESULT_TEXT.lines[piece.key];
  ctx.fillText(text, piece.x, top + piece.h / 2, piece.w);
}

/**
 * 部品の種類 → 描き方の表。
 * @type {Readonly<Record<string, PieceDrawer>>}
 */
const PIECE_DRAWERS = Object.freeze({
  outcome: drawOutcomePiece,
  headline: drawHeadlinePiece,
  heading: drawHeadingPiece,
  row: drawRowPiece,
  portraits: drawPortraitsPiece,
  lost: drawLostPiece,
  line: drawLinePiece,
});

/**
 * ボタン1つを描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./resultLayout.js').Rect} rect ボタンの矩形
 * @param {string} text 文字
 * @param {boolean} pressed 押している間か
 * @param {number} textMaxW 文字の最大幅
 * @returns {void}
 */
function drawResultButton(ctx, rect, text, pressed, textMaxW) {
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, BUTTON_RADIUS);
  ctx.fillStyle = pressed ? BUTTON_FILL_PRESSED : BUTTON_FILL;
  ctx.fill();
  ctx.lineWidth = BUTTON_LINE_WIDTH;
  ctx.strokeStyle = BUTTON_STROKE;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = BUTTON_FONT;
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2, textMaxW);
}

/**
 * 結果の画面（暗幕・板・見える範囲で切り抜いた中身・位置の表示（帯とつまみ）・ボタン2つ）を描く。状態は変えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./resultLayout.js').ResultLayout} layout 結果の画面の配置
 * @param {import('./layout.js').BattleLayout} battleLayout 盤面の攻防の配置（敵の絵に使う）
 * @param {{ pieces: import('./resultLayout.js').ResultPiece[], height: number }} placed 並べた中身
 * @param {number} scrollY 中身のスクロールの量（0 は一番上）。中身が見える範囲より高いときだけ位置の表示も描く
 * @param {'retry'|'title'|null} pressed 押している間のボタン（なければ null）
 * @returns {void}
 */
export function drawResultScreen(ctx, layout, battleLayout, placed, scrollY, pressed) {
  const { curtain, panel, viewport } = layout;
  ctx.save();
  ctx.fillStyle = CURTAIN_FILL;
  ctx.fillRect(curtain.x, curtain.y, curtain.w, curtain.h);

  roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, PANEL_RADIUS);
  ctx.fillStyle = PANEL_FILL;
  ctx.fill();
  ctx.lineWidth = PANEL_LINE_WIDTH;
  ctx.strokeStyle = PANEL_STROKE;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
  ctx.clip();
  for (const piece of placed.pieces) {
    const top = viewport.y + piece.y - scrollY;
    if (top + piece.h < viewport.y || top > viewport.y + viewport.h) continue;
    ctx.save();
    PIECE_DRAWERS[piece.type](ctx, piece, top, battleLayout);
    ctx.restore();
  }
  ctx.restore();

  const thumb = scrollThumb(layout, placed.height, scrollY);
  if (thumb !== null) {
    roundRectPath(ctx, thumb.x, thumb.y, thumb.w, thumb.h, thumb.w / 2);
    ctx.fillStyle = THUMB_FILL;
    ctx.fill();
  }

  for (const name of ['retry', 'title']) {
    drawResultButton(ctx, layout.buttons[name], RESULT_TEXT.buttons[name], pressed === name, layout.buttonTextMaxW);
  }
  ctx.restore();
}
