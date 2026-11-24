/**
 * 責務: 遊び方の画面（背景・見出し・ページ番号・区切り線・絵・色付きの本文・4ページ目の敵ごとの段・まえへ／タイトルへ／つぎへのボタン）を組み立てて描く。
 * 状態は変えず、座標は配置（HowToLayout）からだけ読む。本文の割り付けは howToRichText.js、絵は howToArt.js。
 */

import { roundRectPath } from './cardView.js';
import { HOW_TO_PAGES, HOW_TO_LABELS } from './howToText.js';
import { SUIT_LOOKS } from './suitStyle.js';
import { wrapRichText, drawRichLines } from './howToRichText.js';
import { drawHowToArt } from './howToArt.js';

/** 背景の色（タイトル画面と同じ暗い色）。 */
const BACKGROUND_FILL = '#101820';
/** 見出しのフォント。 */
const HEADING_FONT = 'bold 44px sans-serif';
/** 見出しの文字の色。 */
const HEADING_COLOR = '#ffe680';
/** ページ番号のフォント。 */
const PAGE_NUMBER_FONT = '28px sans-serif';
/** ページ番号の文字の色。 */
const PAGE_NUMBER_COLOR = '#9fb3c0';
/** 区切り線の色。 */
const RULE_COLOR = '#3a4a58';
/** 区切り線の太さ。 */
const RULE_LINE_WIDTH = 2;
/** 本文の文字の大きさ（px）。 */
const BODY_FONT_PX = 34;
/** 本文のフォント（BODY_FONT_PX から作る）。 */
const BODY_FONT = `${BODY_FONT_PX}px sans-serif`;
/** 本文の文字の色。 */
const BODY_COLOR = '#e8eef2';
/** 本文の行の間隔（文字の大きさに対する倍率）。 */
const BODY_LINE_RATIO = 1.5;
/** 色を付けた言葉のフォント（太字。大きさは本文と同じ）。 */
const BODY_TONE_FONT = `bold ${BODY_FONT_PX}px sans-serif`;
/** 段落と段落の間に足す空き（行の高さに対する倍率）。 */
const BODY_PARAGRAPH_GAP_RATIO = 0.5;
/**
 * 色の種類 → 色の表。絵柄の色は SUIT_LOOKS から読む（hammer はスート識別子 potion、gold は muscle）。
 * @type {Readonly<Record<string, string>>}
 */
const TONE_COLORS = Object.freeze({
  key: HEADING_COLOR,
  sword: SUIT_LOOKS.sword.color,
  shield: SUIT_LOOKS.shield.color,
  hammer: SUIT_LOOKS.potion.color,
  gold: SUIT_LOOKS.muscle.color,
});
/**
 * 本文の見た目。
 * @type {Readonly<import('./howToRichText.js').RichTextStyle>}
 */
const BODY_TEXT_STYLE = Object.freeze({
  font: BODY_FONT,
  toneFont: BODY_TONE_FONT,
  color: BODY_COLOR,
  toneColors: TONE_COLORS,
});
/** 4ページ目の敵の名前の文字の大きさ（px）。 */
const ENEMY_NAME_FONT_PX = 40;
/** 4ページ目の敵の名前のフォント。 */
const ENEMY_NAME_FONT = `bold ${ENEMY_NAME_FONT_PX}px sans-serif`;
/** 4ページ目の敵の名前の行の高さ（文字の大きさに対する倍率）。 */
const ENEMY_NAME_LINE_RATIO = 1.4;
/** ボタンの縁の色。 */
const BUTTON_STROKE = '#bfe8cf';
/** ボタンの縁の太さ。 */
const BUTTON_LINE_WIDTH = 3;
/** ボタンの角の丸み。 */
const BUTTON_RADIUS = 20;
/** ボタンの文字のフォント。 */
const BUTTON_FONT = 'bold 34px sans-serif';
/** ボタンの文字の色。 */
const BUTTON_TEXT_COLOR = '#ffffff';
/** 押せないボタンを薄く描くときの透明度。 */
const HOWTO_DISABLED_ALPHA = 0.3;

/**
 * 遊び方の画面の描画に渡す状態。
 * @typedef {Object} HowToViewState
 * @property {number} page 今のページの番号（0 始まり）。
 * @property {number} count ページ数。
 * @property {boolean} canPrev 「まえへ」が押せるか。
 * @property {boolean} canNext 「つぎへ」が押せるか。
 */

/**
 * ボタンを1つ描く（角丸の縁だけの枠と中央の文字）。押せないときは薄く描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect ボタンの範囲
 * @param {string} label ボタンの文字
 * @param {number} textMaxW 文字の最大の幅
 * @param {boolean} enabled 押せるか
 * @returns {void}
 */
function drawButton(ctx, rect, label, textMaxW, enabled) {
  ctx.save();
  if (!enabled) ctx.globalAlpha = HOWTO_DISABLED_ALPHA;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, BUTTON_RADIUS);
  ctx.lineWidth = BUTTON_LINE_WIDTH;
  ctx.strokeStyle = BUTTON_STROKE;
  ctx.stroke();
  ctx.font = BUTTON_FONT;
  ctx.fillStyle = BUTTON_TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2, textMaxW);
  ctx.restore();
}

/**
 * 段落の並びを幅に割り付けて、左上 (x, top) から描く。段落の間は半行空ける（最後の段落の後には空けない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {readonly string[]} paragraphs 段落（印つき）
 * @param {number} x 左端
 * @param {number} top 1行目の上端
 * @param {number} width 1行の最大の幅
 * @returns {number} 使った高さ
 */
function drawParagraphs(ctx, paragraphs, x, top, width) {
  const lineH = BODY_FONT_PX * BODY_LINE_RATIO;
  const gap = lineH * BODY_PARAGRAPH_GAP_RATIO;
  let y = top;
  paragraphs.forEach((paragraph, i) => {
    const lines = wrapRichText(ctx, paragraph, width, BODY_FONT_PX, BODY_TEXT_STYLE);
    drawRichLines(ctx, lines, x, y, lineH, BODY_TEXT_STYLE);
    y += lines.length * lineH + (i < paragraphs.length - 1 ? gap : 0);
  });
  return y - top;
}

/**
 * 段落の並びを幅に割り付けたときの高さ（段落の間を含む）を数える。
 * @param {CanvasRenderingContext2D} ctx 文字の幅を測る描画先
 * @param {readonly string[]} paragraphs 段落（印つき）
 * @param {number} width 1行の最大の幅
 * @returns {number} 高さ
 */
function measureParagraphs(ctx, paragraphs, width) {
  const lineH = BODY_FONT_PX * BODY_LINE_RATIO;
  const gap = lineH * BODY_PARAGRAPH_GAP_RATIO;
  let h = 0;
  paragraphs.forEach((paragraph, i) => {
    const lines = wrapRichText(ctx, paragraph, width, BODY_FONT_PX, BODY_TEXT_STYLE);
    h += lines.length * lineH + (i < paragraphs.length - 1 ? gap : 0);
  });
  return h;
}

/**
 * 4ページ目の敵ごとの段を描く（左に絵、右に名前と説明。右の塊は段の縦の中央）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').HowToLayout} howToLayout 遊び方の画面の配置
 * @param {readonly Readonly<import('./howToText.js').HowToEnemyRow>[]} rows 敵ごとの段
 * @returns {void}
 */
function drawEnemyRows(ctx, howToLayout, rows) {
  const slots = howToLayout.enemyRows(rows.length);
  const nameH = ENEMY_NAME_FONT_PX * ENEMY_NAME_LINE_RATIO;
  rows.forEach((row, i) => {
    const slot = slots[i];
    drawHowToArt(ctx, row.art, slot.art);
    const blockH = nameH + measureParagraphs(ctx, row.paragraphs, slot.text.w);
    const top = slot.text.y + (slot.text.h - blockH) / 2;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = ENEMY_NAME_FONT;
    ctx.fillStyle = HEADING_COLOR;
    ctx.fillText(row.name, slot.text.x, top + nameH / 2, slot.text.w);
    ctx.restore();
    drawParagraphs(ctx, row.paragraphs, slot.text.x, top + nameH, slot.text.w);
  });
}

/**
 * 遊び方の画面（背景・見出し・ページ番号・区切り線・絵・本文または敵ごとの段・3つのボタン）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').HowToLayout} howToLayout 遊び方の画面の配置
 * @param {HowToViewState} view 描画に渡す状態
 * @returns {void}
 */
export function drawHowTo(ctx, howToLayout, view) {
  const { screen, heading, pageNumber, rule, body } = howToLayout;
  const page = HOW_TO_PAGES[view.page];
  ctx.save();
  ctx.fillStyle = BACKGROUND_FILL;
  ctx.fillRect(0, 0, screen.width, screen.height);
  ctx.textBaseline = 'middle';

  ctx.textAlign = 'left';
  ctx.font = HEADING_FONT;
  ctx.fillStyle = HEADING_COLOR;
  ctx.fillText(page.heading, heading.x, heading.y, heading.maxW);

  ctx.textAlign = 'right';
  ctx.font = PAGE_NUMBER_FONT;
  ctx.fillStyle = PAGE_NUMBER_COLOR;
  const numberText = `${view.page + 1}${HOW_TO_LABELS.pageSeparator}${view.count}`;
  ctx.fillText(numberText, pageNumber.x, pageNumber.y, pageNumber.maxW);

  ctx.beginPath();
  ctx.moveTo(rule.x, rule.y);
  ctx.lineTo(rule.x + rule.w, rule.y);
  ctx.lineWidth = RULE_LINE_WIDTH;
  ctx.strokeStyle = RULE_COLOR;
  ctx.stroke();
  ctx.restore();

  if (page.rows.length > 0) {
    drawEnemyRows(ctx, howToLayout, page.rows);
  } else {
    if (page.art !== null) drawHowToArt(ctx, page.art, howToLayout.art);
    drawParagraphs(ctx, page.paragraphs, body.x, body.y, body.w);
  }

  const textMaxW = howToLayout.buttonTextMaxW;
  drawButton(ctx, howToLayout.prevButton, HOW_TO_LABELS.prev, textMaxW, view.canPrev);
  drawButton(ctx, howToLayout.backButton, HOW_TO_LABELS.back, textMaxW, true);
  drawButton(ctx, howToLayout.nextButton, HOW_TO_LABELS.next, textMaxW, view.canNext);
}
