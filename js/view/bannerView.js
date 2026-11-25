/**
 * 責務: 合図（準備終了の暗幕とロゴ・BATTLE!・フェーズとステージの始まりのロゴ・数字・予告の文字）の描画と、敵の種類 → 名前のロゴの表を持つ。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { LOGO_IDS, drawLogo, drawDigits } from './spriteView.js';
import { enemyActionText, countdownText } from './battleText.js';

/**
 * 敵の種類の識別子 → 名前のロゴの識別子の表。識別子はルール層の敵の種類を文字として書いたもの（この表1か所）。
 * @type {Readonly<Record<string, string>>}
 */
export const ENEMY_NAME_LOGOS = Object.freeze({
  goblins: LOGO_IDS.nameGoblins,
  giant: LOGO_IDS.nameGiant,
  dragon: LOGO_IDS.nameDragon,
});

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

/**
 * 描くときにシーンが渡すゲームの値（ルール層の問い合わせから作る）。
 * @typedef {Object} BannerValues
 * @property {number} turn いまの敵との戦闘で何ターン目か（1 から。始まりの演出の TURN N）
 * @property {number} enemyIndex 敵の番号（0 から。ステージの番号は +1）
 * @property {string} enemyTypeId 敵の種類の識別子
 * @property {import('../rules/combatants.js').EnemyIntent|null} intent 敵の予告（なければ null）
 * @property {number|null} countdown 攻撃までの残りフェーズ数（数え下ろしがなければ null）
 */

/**
 * 敵の種類の識別子から名前のロゴの識別子を引く。
 * @param {string} typeId 敵の種類の識別子
 * @returns {string|null} ロゴの識別子。表になければ null
 */
export function nameLogoOf(typeId) {
  return Object.prototype.hasOwnProperty.call(ENEMY_NAME_LOGOS, typeId) ? ENEMY_NAME_LOGOS[typeId] : null;
}

/**
 * 縁取りの文字を中央ぞろえで描く（縁 → 中身の順）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} text 文字
 * @param {string} font フォント
 * @param {number} x 中心の x
 * @param {number} y 中心の y
 * @param {number} maxW 文字の最大の幅
 * @returns {void}
 */
function drawOutlinedText(ctx, text, font, x, y, maxW) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = TEXT_STROKE_WIDTH;
  ctx.strokeStyle = TEXT_STROKE;
  ctx.fillStyle = TEXT_FILL;
  ctx.strokeText(text, x, y, maxW);
  ctx.fillText(text, x, y, maxW);
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
    drawOutlinedText(ctx, enemyActionText(values.intent), INTENT_FONT, intro.x, intro.textY, intro.maxW);
  }
  if (values.countdown !== null) {
    drawOutlinedText(ctx, countdownText(values.countdown), COUNTDOWN_FONT, intro.x, intro.subTextY, intro.maxW);
  }
}

/**
 * ステージの始まり（STAGE・番号・敵の名前のロゴ）を描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./bannerLayout.js').BannerLayout} bannerLayout 合図の配置
 * @param {import('../anim/bannerShow.js').BannerLook} look 見た目
 * @param {BannerValues} values ゲームの値
 * @returns {void}
 */
function drawStageIntro(ctx, bannerLayout, look, values) {
  const { intro } = bannerLayout;
  drawLogo(ctx, LOGO_IDS.stage, intro.x, intro.logoY, look.scale);
  drawDigits(ctx, values.enemyIndex + 1, intro.x, intro.numberY, look.scale);
  const nameLogo = nameLogoOf(values.enemyTypeId);
  if (nameLogo !== null) drawLogo(ctx, nameLogo, intro.x, intro.nameY, look.scale);
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
