/**
 * 責務: 敵の頭の上の予告の札（攻撃の側・防御の側の絵と量の数字・ブレスと大攻撃の目立たせ。右端からはみ出さない）と、その下の数え下ろしの文字の描画。
 * 予告の種類 → 絵の表を持つ。状態は変えず、ルール層・anim は実行時に import しない。
 */

import { roundRectPath } from './cardView.js';
import { intentAmountText, intentDefenseText, unknownIntentText, countdownText } from './battleText.js';
import { intentParts } from './intentParts.js';
import { INTENT_IDS, drawIntentIcon } from './spriteView.js';

/**
 * 予告の攻撃の側の種類（variant があれば variant、なければ kind）→ 予告の絵の識別子の表。
 * @type {Readonly<Record<string, string>>}
 */
const INTENT_ICONS = Object.freeze({
  attack: INTENT_IDS.attack,
  windup: INTENT_IDS.windup,
  claw: INTENT_IDS.claw,
  inhale: INTENT_IDS.inhale,
  breath: INTENT_IDS.breath,
  charge: INTENT_IDS.windup,
  heavy: INTENT_IDS.attack,
});

/** 予告の札の防御の側の絵の識別子。 */
const DEFENSE_ICON = INTENT_IDS.defend;

/**
 * 札を目立たせる行動の中の種類（variant）の集合。
 * @type {Set<string>}
 */
const EMPHASIZED_VARIANTS = new Set(['breath', 'heavy']);

/** 札の角の半径。 */
const BADGE_CORNER = 10;
/** ふつうの札の塗りの色。 */
const BADGE_FILL = 'rgba(20, 24, 36, 0.75)';
/** ふつうの札の縁の色。 */
const BADGE_STROKE = 'rgba(255, 255, 255, 0.7)';
/** ふつうの札の縁の太さ。 */
const BADGE_STROKE_WIDTH = 2;
/** 目立たせる札（ブレス・大攻撃）の塗りの色。 */
const EMPHASIS_FILL = 'rgba(170, 20, 20, 0.92)';
/** 目立たせる札（ブレス・大攻撃）の縁の色。 */
const EMPHASIS_STROKE = '#ffe45c';
/** 目立たせる札（ブレス・大攻撃）の縁の太さ。 */
const EMPHASIS_STROKE_WIDTH = 3;
/** 量の数字の芯の色（ふつう）。 */
const AMOUNT_COLOR = '#ffffff';
/** 量の数字の芯の色（目立たせる札）。 */
const EMPHASIS_AMOUNT_COLOR = '#ffe45c';
/** 量の数字・「？」のフォント。 */
const AMOUNT_FONT = 'bold 30px sans-serif';
/** 量の数字・数え下ろしの文字の縁取りの色。 */
const OUTLINE_COLOR = '#111827';
/** 量の数字の縁取りの太さ。 */
const AMOUNT_OUTLINE_WIDTH = 6;
/** 数え下ろしの文字の芯の色。 */
const COUNTDOWN_COLOR = '#ffffff';
/**
 * 数え下ろしの文字のフォント。文字の大きさ（20px）は layout.js の INTENT_COUNTDOWN_LINE_H と合わせること
 * （片方だけ変えると文字の位置がずれる）。
 */
const COUNTDOWN_FONT = 'bold 20px sans-serif';
/** 数え下ろしの文字の縁取りの太さ。 */
const COUNTDOWN_OUTLINE_WIDTH = 5;

/**
 * 縁取りつきの文字を1つ描く（縁取りを先に描き、芯を重ねる）。ctx の設定は呼ぶ側の save／restore の中で行うこと。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} text 出す文字
 * @param {number} x 文字の基準の x（textAlign による）
 * @param {number} y 文字の中央の y
 * @param {{ font: string, align: CanvasTextAlign, color: string, outlineWidth: number, maxW?: number }} style 見た目（maxW: 最大の幅。省くと制限なし）
 * @returns {void}
 */
function drawOutlinedText(ctx, text, x, y, style) {
  ctx.font = style.font;
  ctx.textAlign = style.align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = style.outlineWidth;
  ctx.strokeStyle = OUTLINE_COLOR;
  ctx.fillStyle = style.color;
  if (style.maxW === undefined) {
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  } else {
    ctx.strokeText(text, x, y, style.maxW);
    ctx.fillText(text, x, y, style.maxW);
  }
}

/**
 * 敵の頭の上の予告の札と、その下の数え下ろしを描く。引数は読むだけで書き換えない。
 * enemy.intent が null、または enemy.hp が 0 以下なら何も描かない（数え下ろしも）。
 * entrance が null でなく visible が偽なら何も描かず、dx が 0 でなければ右へずらして描く。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置（enemyFigures[typeId].intent・enemyIntent・intentBadge・area を読む）
 * @param {{ typeId: string, hp: number, intent: import('../rules/combatants.js').EnemyIntent|null }} enemy 表示する敵（ほかの項目は読まない）
 * @param {number|null} countdown 攻撃までの残りフェーズ数。null なら数え下ろしを描かない
 * @param {import('../anim/enemyEntrance.js').EnemyEntranceLook|null} entrance 段取りの間の敵の入りの見た目。攻防の演出中は null
 * @returns {void}
 */
export function drawEnemyIntent(ctx, battleLayout, enemy, countdown, entrance) {
  const action = enemy.intent;
  if (action === null || enemy.hp <= 0) return;
  if (entrance !== null && !entrance.visible) return;

  const spot = Object.prototype.hasOwnProperty.call(battleLayout.enemyFigures, enemy.typeId)
    ? battleLayout.enemyFigures[enemy.typeId].intent
    : battleLayout.enemyIntent;
  const badge = battleLayout.intentBadge;
  const area = battleLayout.area;
  const parts = intentParts(action);
  const iconKey = typeof action.variant === 'string' ? action.variant : action.kind;
  const hasIcon = Object.prototype.hasOwnProperty.call(INTENT_ICONS, iconKey);
  const emphasized = typeof action.variant === 'string' && EMPHASIZED_VARIANTS.has(action.variant);
  const amountColor = emphasized ? EMPHASIS_AMOUNT_COLOR : AMOUNT_COLOR;

  /** 札に並べる側（左から攻撃の側、防御の側）。iconId が null なら「？」を出す。 */
  const sides = [];
  if (parts.attack) {
    sides.push({ iconId: hasIcon ? INTENT_ICONS[iconKey] : null, amount: intentAmountText(action) });
  }
  if (parts.defense) {
    sides.push({ iconId: DEFENSE_ICON, amount: intentDefenseText(action) });
  }

  ctx.save();
  if (entrance !== null && entrance.dx !== 0) ctx.translate(entrance.dx, 0);

  ctx.font = AMOUNT_FONT;
  let w = badge.padX * 2 + badge.sideGap * Math.max(0, sides.length - 1);
  for (const side of sides) {
    side.amountW = side.amount === null ? 0 : ctx.measureText(side.amount).width;
    w += badge.iconW + (side.amount === null ? 0 : badge.gap + side.amountW);
  }
  const left = Math.min(spot.x - w / 2, area.x + area.w - badge.edge - w);
  const cy = spot.y + badge.h / 2;

  ctx.save();
  roundRectPath(ctx, left, spot.y, w, badge.h, BADGE_CORNER);
  ctx.fillStyle = emphasized ? EMPHASIS_FILL : BADGE_FILL;
  ctx.fill();
  ctx.lineWidth = emphasized ? EMPHASIS_STROKE_WIDTH : BADGE_STROKE_WIDTH;
  ctx.strokeStyle = emphasized ? EMPHASIS_STROKE : BADGE_STROKE;
  ctx.stroke();
  ctx.restore();

  let cursor = left + badge.padX;
  for (const side of sides) {
    const iconCx = cursor + badge.iconW / 2;
    if (side.iconId !== null) {
      drawIntentIcon(ctx, side.iconId, iconCx, cy);
    } else {
      ctx.save();
      drawOutlinedText(ctx, unknownIntentText(), iconCx, cy, {
        font: AMOUNT_FONT, align: 'center', color: amountColor, outlineWidth: AMOUNT_OUTLINE_WIDTH,
      });
      ctx.restore();
    }
    cursor += badge.iconW;
    if (side.amount !== null) {
      ctx.save();
      drawOutlinedText(ctx, side.amount, cursor + badge.gap, cy, {
        font: AMOUNT_FONT, align: 'left', color: amountColor, outlineWidth: AMOUNT_OUTLINE_WIDTH,
      });
      ctx.restore();
      cursor += badge.gap + side.amountW;
    }
    cursor += badge.sideGap;
  }

  if (countdown !== null) {
    ctx.save();
    drawOutlinedText(ctx, countdownText(countdown), left + w / 2, spot.y + badge.countdownDy, {
      font: COUNTDOWN_FONT, align: 'center', color: COUNTDOWN_COLOR,
      outlineWidth: COUNTDOWN_OUTLINE_WIDTH, maxW: badge.countdownMaxW,
    });
    ctx.restore();
  }

  ctx.restore();
}
