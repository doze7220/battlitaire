/**
 * 責務: 画面の最上部のゲージ（城と敵の HP・敵の名前とレベルと「疲弊」・「TURN」の区画と戦闘ごとのターン番号・金貨）を描く。
 * 状態は変えず、値は呼ぶ側から受け取る。ルール層・anim は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { enemyLabelText } from './battleText.js';

/**
 * 最上部のゲージの描画に渡す値。
 * @typedef {Object} TopGaugeValues
 * @property {number} turn いまの敵との戦闘で何ターン目か（1 から）
 * @property {{ hp: number, maxHp: number }} castle 城の HP（表示値）と最大 HP
 * @property {{ name: string, hp: number, maxHp: number }} enemy 敵の名前と HP（表示値）と最大 HP
 * @property {number} level 敵のレベル（ステージの番号。名前に「Lv」を付けて描く）
 * @property {boolean} fatigued 敵が疲弊しているか
 * @property {number} coins 金貨の表示値
 * @property {{ per: number, maxBonus: number }} coinConversion 金貨の換算（満タン = per。1 ブロック＝金貨 1 枚）
 */

/** @type {string} フェーズの見出しの文字。 */
const PHASE_LABEL = 'TURN';

/** @type {string} 「TURN」の区画の塗りの色（試遊で決め直す）。 */
const TURN_BOX_FILL = 'rgba(0, 0, 0, 0.45)';
/** @type {string} 「TURN」の区画の枠の色（試遊で決め直す）。 */
const TURN_BOX_STROKE = '#ffe680';
/** @type {number} 「TURN」の区画の枠の太さ（試遊で決め直す）。 */
const TURN_BOX_LINE_WIDTH = 3;
/** @type {number} 「TURN」の区画の角の丸み（試遊で決め直す）。 */
const TURN_BOX_RADIUS = 10;

/** @type {string} 城の HP ゲージの色（試遊で決め直す）。 */
const CASTLE_COLOR = '#3d8bff';
/** @type {string} 敵の HP ゲージの色（試遊で決め直す）。 */
const ENEMY_COLOR = '#e8453c';
/** @type {string} HP ゲージの空の部分の色（試遊で決め直す）。 */
const HP_EMPTY_COLOR = '#1c2130';
/** @type {string} ゲージの縁の色。 */
const EDGE_COLOR = 'rgba(0, 0, 0, 0.8)';
/** @type {number} ゲージの縁の線の太さ。 */
const EDGE_WIDTH = 2;
/** @type {string} 文字の縁取りの色。 */
const TEXT_STROKE_COLOR = '#101418';
/** @type {number} 文字の縁取りの線の太さ。 */
const TEXT_STROKE_WIDTH = 6;
/** @type {string} 文字の色。 */
const TEXT_COLOR = '#ffffff';
/** @type {string} HP の数字のフォント。 */
const HP_FONT = 'bold 28px sans-serif';
/** @type {string} 「PHASE」のフォント。 */
const PHASE_LABEL_FONT = 'bold 16px sans-serif';
/** @type {string} フェーズの番号のフォント。 */
const PHASE_VALUE_FONT = 'bold 30px sans-serif';

/** @type {string} 敵の名前・「疲弊」のフォント。 */
const ENEMY_LABEL_FONT = 'bold 20px sans-serif';
/** @type {number} 敵の名前・「疲弊」の縁取りの線の太さ。 */
const ENEMY_LABEL_STROKE_WIDTH = 5;
/** @type {string} 敵が疲弊しているときに出す文字。 */
const FATIGUE_LABEL = '疲弊';
/** @type {string} 「疲弊」の文字の色（試遊で決め直す）。 */
const FATIGUE_COLOR = '#ff7a4d';

/** @type {string} 金貨のゲージの左のラベルの文字。 */
const COIN_LABEL = 'GOLD';
/** @type {string} 金貨のゲージの左のラベルのフォント。 */
const COIN_LABEL_FONT = 'bold 14px sans-serif';
/** @type {number} 金貨のゲージの左のラベルの縁取りの線の太さ。 */
const COIN_LABEL_STROKE_WIDTH = 4;
/** @type {string} 金貨のゲージの基本の色（金貨のスートの色）。 */
const COIN_BASE_COLOR = '#e0a030';
/** @type {string} 金貨が満タンを超えた分を重ねる色。 */
const COIN_OVER_COLOR = '#fff0a0';
/** @type {string} 金貨のゲージの空の部分の色（半透明。下の表示が少し透ける）。 */
const COIN_EMPTY_COLOR = 'rgba(0, 0, 0, 0.45)';
/** @type {string} 金貨のバッジの塗りの色。 */
const BADGE_COLOR = '#e02424';
/** @type {string} 金貨のバッジの縁の色。 */
const BADGE_EDGE_COLOR = '#5a0d0d';

/**
 * 値を 0〜1 に収める。
 * @param {number} v 値
 * @returns {number} 0〜1 に収めた値
 */
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * HP の満たす割合を求める。割合 = clamp(hp / maxHp, 0, 1)。maxHp が 0 以下なら 0。
 * @param {number} hp HP
 * @param {number} maxHp 最大 HP
 * @returns {number} 満たす割合（0〜1）
 */
function hpRatio(hp, maxHp) {
  if (!(maxHp > 0)) return 0;
  return clamp01(hp / maxHp);
}

/**
 * 根元の側から割合ぶんだけ塗る。fromRight が true なら右端が根元（左へ伸びる）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} bar ゲージの矩形
 * @param {number} ratio 満たす割合（0〜1）
 * @param {boolean} fromRight 右端を根元にするか
 * @param {string} color 塗る色
 * @returns {void}
 */
function fillFromRoot(ctx, bar, ratio, fromRight, color) {
  const w = bar.w * ratio;
  if (w <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(fromRight ? bar.x + bar.w - w : bar.x, bar.y, w, bar.h);
}

/**
 * HP ゲージを描く。空の部分を暗い色で塗り、外側の端から根元（中央）へ縮む形で満たし、縁を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} bar ゲージの矩形
 * @param {number} ratio 満たす割合（0〜1）
 * @param {boolean} fromRight 右端が根元か（城は true、敵は false）
 * @param {string} color 満たす部分の色
 * @returns {void}
 */
function drawHpBar(ctx, bar, ratio, fromRight, color) {
  ctx.fillStyle = HP_EMPTY_COLOR;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  fillFromRoot(ctx, bar, ratio, fromRight, color);
  ctx.strokeStyle = EDGE_COLOR;
  ctx.lineWidth = EDGE_WIDTH;
  ctx.strokeRect(bar.x, bar.y, bar.w, bar.h);
}

/**
 * 縁取りつきの白い文字を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} text 文字
 * @param {number} x 基準の x
 * @param {number} y 中心 y
 * @param {CanvasTextAlign} align 横の寄せ
 * @param {string} font フォント
 * @param {string} [color] 文字の色（省くと白）
 * @param {number} [strokeWidth] 縁取りの線の太さ（省くと TEXT_STROKE_WIDTH）
 * @param {number} [maxW] 文字の最大の幅（省くと縮めない）
 * @returns {void}
 */
function drawOutlinedText(ctx, text, x, y, align, font, color = TEXT_COLOR, strokeWidth = TEXT_STROKE_WIDTH, maxW) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = TEXT_STROKE_COLOR;
  ctx.fillStyle = color;
  if (maxW === undefined) {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  } else {
    ctx.strokeText(text, x, y, maxW);
    ctx.fillText(text, x, y, maxW);
  }
}

/**
 * 金貨のゲージ（ブロック）と「GOLD」のラベルとバッジを描く。満タンの金貨 per（1 ブロック＝金貨 1 枚）。
 * v = max(0, floor(coins))。v < per は根元（ブロックの先頭）から min(n, v) 個を基本の色で塗る。
 * v >= per は全部を基本の色で塗り、根元から min(n, v % per) 個を別の色で重ねる。
 * バッジは floor(v / per) 個を赤い丸で描く。per が 0 以下なら空のブロックだけでバッジは描かない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').TopGaugeLayout} topLayout 最上部のゲージの配置
 * @param {number} coins 金貨の表示値
 * @param {{ per: number, maxBonus: number }} conv 金貨の換算（使うのは per だけ）
 * @returns {void}
 */
function drawCoinGauge(ctx, topLayout, coins, conv) {
  const blocks = topLayout.coinBlocks;
  const n = blocks.length;
  const per = conv.per;
  const v = Math.max(0, Math.floor(coins));
  const valid = per > 0;
  let baseCount = 0;
  let overCount = 0;
  if (valid) {
    if (v < per) {
      baseCount = Math.min(n, v);
    } else {
      baseCount = n;
      overCount = Math.min(n, v % per);
    }
  }
  for (let i = 0; i < n; i++) {
    const r = blocks[i];
    ctx.fillStyle = COIN_EMPTY_COLOR;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (i < baseCount) {
      ctx.fillStyle = COIN_BASE_COLOR;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    if (i < overCount) {
      ctx.fillStyle = COIN_OVER_COLOR;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth = EDGE_WIDTH;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  drawOutlinedText(
    ctx, COIN_LABEL, topLayout.coinLabel.x, topLayout.coinLabel.y, 'right', COIN_LABEL_FONT,
    COIN_BASE_COLOR, COIN_LABEL_STROKE_WIDTH,
  );
  if (!valid) return;

  const count = Math.floor(v / per);
  for (let i = 0; i < count; i++) {
    const r = topLayout.coinBadge(i);
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = BADGE_COLOR;
    ctx.fill();
    ctx.strokeStyle = BADGE_EDGE_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/**
 * 「TURN」の区画（角丸の塗りと枠）を描く。文字より先に呼ぶ。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {{ x: number, y: number, w: number, h: number }} box 区画の矩形
 * @returns {void}
 */
function drawTurnBox(ctx, box) {
  roundRectPath(ctx, box.x, box.y, box.w, box.h, TURN_BOX_RADIUS);
  ctx.fillStyle = TURN_BOX_FILL;
  ctx.fill();
  ctx.strokeStyle = TURN_BOX_STROKE;
  ctx.lineWidth = TURN_BOX_LINE_WIDTH;
  ctx.stroke();
}

/**
 * 画面の最上部のゲージ（城と敵の HP・HP の数字・敵の名前とレベルと「疲弊」・「TURN」の区画と戦闘ごとのターン番号・金貨）を描く。状態は変えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').TopGaugeLayout} topLayout 最上部のゲージの配置
 * @param {TopGaugeValues} values 表示する値
 * @returns {void}
 */
export function drawTopGauges(ctx, topLayout, values) {
  ctx.save();
  drawTurnBox(ctx, topLayout.turnBox);
  drawHpBar(ctx, topLayout.castleBar, hpRatio(values.castle.hp, values.castle.maxHp), true, CASTLE_COLOR);
  drawHpBar(ctx, topLayout.enemyBar, hpRatio(values.enemy.hp, values.enemy.maxHp), false, ENEMY_COLOR);
  drawCoinGauge(ctx, topLayout, values.coins, values.coinConversion);
  drawOutlinedText(ctx, String(values.castle.hp), topLayout.castleValue.x, topLayout.castleValue.y, 'left', HP_FONT);
  drawOutlinedText(ctx, String(values.enemy.hp), topLayout.enemyValue.x, topLayout.enemyValue.y, 'right', HP_FONT);
  drawOutlinedText(ctx, PHASE_LABEL, topLayout.phaseLabel.x, topLayout.phaseLabel.y, 'center', PHASE_LABEL_FONT);
  drawOutlinedText(
    ctx, enemyLabelText(values.enemy.name, values.level), topLayout.enemyName.x, topLayout.enemyName.y, 'left', ENEMY_LABEL_FONT,
    TEXT_COLOR, ENEMY_LABEL_STROKE_WIDTH, topLayout.enemyName.maxW,
  );
  if (values.fatigued) {
    drawOutlinedText(
      ctx, FATIGUE_LABEL, topLayout.fatigue.x, topLayout.fatigue.y, 'right', ENEMY_LABEL_FONT,
      FATIGUE_COLOR, ENEMY_LABEL_STROKE_WIDTH,
    );
  }
  drawOutlinedText(ctx, String(values.turn), topLayout.phaseValue.x, topLayout.phaseValue.y, 'center', PHASE_VALUE_FONT);
  ctx.restore();
}
