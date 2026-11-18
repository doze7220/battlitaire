/**
 * 責務: 遊び方の画面（背景・見出し・ページ番号・区切り線・折り返した本文・まえへ／タイトルへ／つぎへのボタン）を描く。
 * 状態は変えず、座標は配置（HowToLayout）からだけ読む。
 */

import { roundRectPath } from './cardView.js';
import { HOW_TO_PAGES, HOW_TO_LABELS } from './howToText.js';

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
 * 行頭に置いてはいけない文字（直前の文字の単位に付ける）。
 * @type {ReadonlySet<string>}
 */
const NO_LINE_START = Object.freeze(new Set(['、', '。', '）', '」']));

/**
 * 遊び方の画面の描画に渡す状態。
 * @typedef {Object} HowToViewState
 * @property {number} page 今のページの番号（0 始まり）。
 * @property {number} count ページ数。
 * @property {boolean} canPrev 「まえへ」が押せるか。
 * @property {boolean} canNext 「つぎへ」が押せるか。
 */

/**
 * 段落を、行頭禁止の文字を直前の文字に付けた「単位」に分ける。
 * @param {string} text 段落
 * @returns {string[]} 単位の並び
 */
function splitUnits(text) {
  /** @type {string[]} */
  const units = [];
  for (const ch of text) {
    if (NO_LINE_START.has(ch) && units.length > 0) units[units.length - 1] += ch;
    else units.push(ch);
  }
  return units;
}

/**
 * 段落を幅に合わせて折り返す。行頭禁止の文字は、収まれば前の行の末尾にぶら下げる。
 * 呼ぶ前に ctx.font を本文のフォントにしておくこと。
 * @param {CanvasRenderingContext2D} ctx 文字の幅を測る描画先
 * @param {string} text 段落（文章の中の1行）
 * @param {number} maxW 1行の最大の幅
 * @param {number} hangW ぶら下げてよい幅
 * @returns {string[]} 折り返した行の並び
 */
function wrapParagraph(ctx, text, maxW, hangW) {
  /** @type {string[]} */
  const lines = [];
  let line = '';
  let lineW = 0;
  for (const unit of splitUnits(text)) {
    const unitW = ctx.measureText(unit).width;
    if (line === '' || lineW + unitW <= maxW) {
      line += unit;
      lineW += unitW;
      continue;
    }
    const firstW = ctx.measureText(Array.from(unit)[0]).width;
    if (lineW + firstW <= maxW && lineW + unitW <= maxW + hangW) {
      line += unit;
      lineW += unitW;
      continue;
    }
    lines.push(line);
    if (unit === ' ') {
      line = '';
      lineW = 0;
    } else {
      line = unit;
      lineW = unitW;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

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
 * 遊び方の画面（背景・見出し・ページ番号・区切り線・本文・3つのボタン）を描く。
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

  ctx.textAlign = 'left';
  ctx.font = BODY_FONT;
  ctx.fillStyle = BODY_COLOR;
  const lineH = BODY_FONT_PX * BODY_LINE_RATIO;
  let row = 0;
  for (const paragraph of page.paragraphs) {
    for (const line of wrapParagraph(ctx, paragraph, body.w, BODY_FONT_PX)) {
      ctx.fillText(line, body.x, body.y + lineH * (row + 0.5));
      row += 1;
    }
  }
  ctx.restore();

  const textMaxW = howToLayout.buttonTextMaxW;
  drawButton(ctx, howToLayout.prevButton, HOW_TO_LABELS.prev, textMaxW, view.canPrev);
  drawButton(ctx, howToLayout.backButton, HOW_TO_LABELS.back, textMaxW, true);
  drawButton(ctx, howToLayout.nextButton, HOW_TO_LABELS.next, textMaxW, view.canNext);
}
