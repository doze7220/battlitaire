/**
 * 責務: 合図（準備終了の暗幕とロゴ・BATTLE!・フェーズとステージの始まりのロゴ・数字・予告の文字・敵の名前の文字）の描画。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { LOGO_IDS, drawLogo, drawDigits } from './spriteView.js';
import { enemyActionText, countdownText } from './battleText.js';

/** 準備終了の暗幕の色。 */
const READY_DIM_COLOR = '#000000';
/** 準備終了の暗幕の最大の濃さ（`look.dim` が 1 のとき）。試遊で決め直す。 */
const READY_DIM_ALPHA = 0.35;
/** 文字の中身の色（白）。 */
const TEXT_FILL = '#ffffff';
/** 文字の縁の色（暗い色）。 */
const TEXT_STROKE = '#111827';
/** 文字の縁の太さ（px）。 */
const TEXT_STROKE_WIDTH = 8;
/** 予告の文字のフォント。 */
const INTENT_FONT = 'bold 40px sans-serif';
/** 数え下ろしの文字のフォント。 */
const COUNTDOWN_FONT = 'bold 30px sans-serif';
/** ステージの始まりの敵の名前のフォント。 */
const ENEMY_NAME_FONT = 'bold 60px sans-serif';
/** ステージの始まりの敵の名前の縁の太さ（px）。 */
const ENEMY_NAME_STROKE_WIDTH = 12;

/**
 * 描くときにシーンが渡すゲームの値（ルール層の問い合わせから作る）。
 * @typedef {Object} BannerValues
 * @property {number} turn いまの敵との戦闘で何ターン目か（1 から。始まりの演出の TURN N）
 * @property {number} stageNumber ステージの番号（1 から。何体目の敵か）
 * @property {string} enemyName 敵の名前（ステージの始まりに文字で描く）
 * @property {string} enemyTypeId 敵の種類の識別子（予告の文字の子の名前を選ぶ）
 * @property {import('../rules/combatants.js').EnemyIntent|null} intent 敵の予告（なければ null）
 * @property {number|null} countdown 攻撃までの残りフェーズ数（数え下ろしがなければ null）
 */

/**
 * 縁取りの文字を中央ぞろえで描く（縁 → 中身の順）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} text 文字
 * @param {string} font フォント
 * @param {number} x 中心の x
 * @param {number} y 中心の y
 * @param {number} maxW 文字の最大の幅
 * @param {number} [scale] 倍率（既定 1。文字の中心を軸にする。0 以下なら描かない）
 * @param {number} [strokeWidth] 縁の太さ（px。既定は TEXT_STROKE_WIDTH）
 * @returns {void}
 */
function drawOutlinedText(ctx, text, font, x, y, maxW, scale = 1, strokeWidth = TEXT_STROKE_WIDTH) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = TEXT_STROKE;
  ctx.fillStyle = TEXT_FILL;
  ctx.strokeText(text, 0, 0, maxW);
  ctx.fillText(text, 0, 0, maxW);
  ctx.restore();
}

/**
 * 準備終了（暗幕とロゴ）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 見た目
 * @returns {void}
 */
function drawReady(ctx, bannerLayout, look) {
  const { screen, ready } = bannerLayout;
  ctx.save();
  ctx.globalAlpha = look.alpha * READY_DIM_ALPHA * look.dim;
  ctx.fillStyle = READY_DIM_COLOR;
  ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
  ctx.restore();
  drawLogo(ctx, LOGO_IDS.ready, ready.x, ready.y, look.scale);
}

/**
 * BATTLE! のロゴを描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 見た目
 * @returns {void}
 */
function drawBattle(ctx, bannerLayout, look) {
  const { battle } = bannerLayout;
  drawLogo(ctx, LOGO_IDS.battle, battle.x, battle.y, look.scale);
}

/**
 * フェーズの始まり（PHASE・番号・予告の文字・数え下ろし）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 見た目
 * @param {BannerValues} values ゲームの値
 * @returns {void}
 */
function drawPhaseIntro(ctx, bannerLayout, look, values) {
  const { intro } = bannerLayout;
  drawLogo(ctx, LOGO_IDS.phase, intro.x, intro.logoY, look.scale);
  drawDigits(ctx, values.turn, intro.x, intro.numberY, look.scale);
  if (values.intent !== null) {
    drawOutlinedText(ctx, enemyActionText(values.intent, values.enemyTypeId), INTENT_FONT, intro.x, intro.textY, intro.maxW);
  }
  if (values.countdown !== null) {
    drawOutlinedText(ctx, countdownText(values.countdown), COUNTDOWN_FONT, intro.x, intro.subTextY, intro.maxW);
  }
}

/**
 * ステージの始まり（STAGE・番号・敵の名前の文字）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 見た目
 * @param {BannerValues} values ゲームの値
 * @returns {void}
 */
function drawStageIntro(ctx, bannerLayout, look, values) {
  const { intro } = bannerLayout;
  drawLogo(ctx, LOGO_IDS.stage, intro.x, intro.logoY, look.scale);
  drawDigits(ctx, values.stageNumber, intro.x, intro.numberY, look.scale);
  drawOutlinedText(ctx, values.enemyName, ENEMY_NAME_FONT, intro.x, intro.nameY, intro.maxW, look.scale, ENEMY_NAME_STROKE_WIDTH);
}

/**
 * いま出ている合図を描く。`look.kind` が null なら何もしない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 合図の見た目（種類・倍率・濃さ・暗幕）
 * @param {BannerValues} values ゲームの値
 * @returns {void}
 */
export function drawBanner(ctx, bannerLayout, look, values) {
  if (look.kind === null) return;
  ctx.save();
  ctx.globalAlpha = look.alpha;
  if (look.kind === 'ready') drawReady(ctx, bannerLayout, look);
  else if (look.kind === 'battle') drawBattle(ctx, bannerLayout, look);
  else if (look.kind === 'phase') drawPhaseIntro(ctx, bannerLayout, look, values);
  else if (look.kind === 'stage') drawStageIntro(ctx, bannerLayout, look, values);
  ctx.restore();
}
