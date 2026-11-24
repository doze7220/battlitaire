/**
 * 責務: 遊び方の絵（識別子ごとに、どのスプライトを区画のどこにどの大きさで描くか）を組み立てて描く。
 * 描く口は spriteView.js・cardView.js・troopView.js の export だけで、焼き付けの資源には触れない。止まった絵で、状態は変えない。
 */
import { HOW_TO_ART_IDS, HOW_TO_ART_LABELS } from './howToText.js';
import {
  SPRITE_IDS,
  LOGO_IDS,
  INTENT_IDS,
  INTENT_CELL,
  spriteFitRect,
  drawSpriteFit,
  drawLogo,
  drawIntentIcon,
} from './spriteView.js';
import { drawCardFace, roundRectPath } from './cardView.js';
import { drawTroop } from './troopView.js';

/**
 * 絵の飾りの札。ルール層の札ではない（id は負の数）。
 * 数字は 1〜7 の中で盤面の置き方（ちょうど1つ下）を見せる並び。上から順に描く。
 * @type {ReadonlyArray<Readonly<{ id: number, suit: string, rank: number }>>}
 */
const ART_CARDS = Object.freeze([
  Object.freeze({ id: -1, suit: 'sword', rank: 5 }),
  Object.freeze({ id: -2, suit: 'sword', rank: 4 }),
  Object.freeze({ id: -3, suit: 'sword', rank: 3 }),
]);

/**
 * 1ページ目（welcome）の位置・大きさ。区画 rect に対する割合。
 * @type {Readonly<{ footY: number, castleH: number, castleX: number, troopSize: number, troopXs: readonly number[], troopKinds: readonly string[], dragonH: number, dragonX: number }>}
 */
const WELCOME = Object.freeze({
  footY: 0.95,
  castleH: 0.82,
  castleX: 0.14,
  troopSize: 0.2,
  troopXs: Object.freeze([0.34, 0.45, 0.56]),
  troopKinds: Object.freeze(['heal', 'attack', 'defense']),
  dragonH: 0.82,
  dragonX: 0.82,
});

/**
 * 2ページ目（cards）の位置・大きさ。区画 rect に対する割合と、札の縦横比（高さ ÷ 幅）。
 * @type {Readonly<{ cardH: number, step: number, aspect: number }>}
 */
const CARDS = Object.freeze({
  cardH: 0.6,
  step: 0.125,
  aspect: 1.4,
});

/**
 * 3ページ目（battle）の位置・大きさ。区画 rect に対する割合。
 * @type {Readonly<{ logoX: number, logoY: number, footY: number, giantH: number, giantX: number, troopSize: number, troopXs: readonly number[], troopKinds: readonly string[] }>}
 */
const BATTLE = Object.freeze({
  logoX: 0.5,
  logoY: 0.15,
  footY: 0.975,
  giantH: 0.53,
  giantX: 0.8,
  troopSize: 0.2,
  troopXs: Object.freeze([0.14, 0.27, 0.4]),
  troopKinds: Object.freeze(['heal', 'attack', 'defense']),
});

/**
 * 3ページ目のロゴの倍率。
 * @type {number}
 */
const BATTLE_LOGO_SCALE = 0.7;

/**
 * 盤面の予告の札（intentView.js）に似せた見た目。値は intentView.js と同じ（export されていないので写している）。
 * @type {Readonly<{ fill: string, edge: string, edgeWidth: number, radius: number, padX: number, padY: number, gap: number, gapAboveHead: number, font: string, textColor: string, strokeColor: string, strokeWidth: number }>}
 */
const INTENT_PLATE = Object.freeze({
  fill: 'rgba(20, 24, 36, 0.75)',
  edge: 'rgba(255, 255, 255, 0.7)',
  edgeWidth: 2,
  radius: 10,
  padX: 6,
  padY: 2,
  gap: 4,
  gapAboveHead: 6,
  font: 'bold 30px sans-serif',
  textColor: '#ffffff',
  strokeColor: '#111827',
  strokeWidth: 6,
});

/**
 * 4ページ目の段の絵の箱の大きさ。
 * @type {Readonly<{ marginX: number, maxH: number, marginY: number }>}
 * marginX: 区画の左右から内側への余白、maxH: 箱の高さの上限、marginY: 区画の高さから引く値（上限の代わりに rect.h − marginY）
 */
const ROW_BOX = Object.freeze({ marginX: 12, maxH: 220, marginY: 24 });

/**
 * 4ページ目 goblins のゴブリン3体の位置・大きさ。箱に対する割合（奥の2体、手前の1体の順）。
 * @type {Readonly<{ size: number, backXs: readonly number[], backFootY: number, frontX: number, frontFootY: number }>}
 */
const GOBLINS = Object.freeze({
  size: 0.38,
  backXs: Object.freeze([0.27, 0.73]),
  backFootY: 0.62,
  frontX: 0.5,
  frontFootY: 0.95,
});

/**
 * 兵・ゴブリンを描く（傾き 0・濃さ 1・伸び縮み 1）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} kind 兵の種類
 * @param {number} x 足元の中心 x
 * @param {number} footY 足元の y
 * @param {number} size 体の直径
 * @returns {void}
 */
function drawPlainTroop(ctx, kind, x, footY, size) {
  drawTroop(ctx, kind, x, footY, size, 0, 1, 1, 1);
}

/**
 * 1ページ目: 城と兵3体、向かいにドラゴン。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 区画
 * @returns {void}
 */
function drawWelcome(ctx, rect) {
  ctx.save();
  const footY = rect.y + rect.h * WELCOME.footY;
  const castleRect = spriteFitRect(SPRITE_IDS.castle, rect.x + rect.w * WELCOME.castleX, footY, rect.h * WELCOME.castleH);
  drawSpriteFit(ctx, SPRITE_IDS.castle, castleRect);
  for (let i = 0; i < WELCOME.troopKinds.length; i += 1) {
    drawPlainTroop(ctx, WELCOME.troopKinds[i], rect.x + rect.w * WELCOME.troopXs[i], footY, rect.h * WELCOME.troopSize);
  }
  const dragonRect = spriteFitRect(SPRITE_IDS.dragon, rect.x + rect.w * WELCOME.dragonX, footY, rect.h * WELCOME.dragonH);
  drawSpriteFit(ctx, SPRITE_IDS.dragon, dragonRect);
  ctx.restore();
}

/**
 * 2ページ目: 盤面の列と同じように重ねた剣の 5・4・3。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 区画
 * @returns {void}
 */
function drawCards(ctx, rect) {
  ctx.save();
  const cardH = rect.h * CARDS.cardH;
  const cardW = cardH / CARDS.aspect;
  const step = rect.h * CARDS.step;
  const totalH = cardH + step * (ART_CARDS.length - 1);
  const left = rect.x + (rect.w - cardW) / 2;
  const top = rect.y + (rect.h - totalH) / 2;
  for (let i = 0; i < ART_CARDS.length; i += 1) {
    drawCardFace(ctx, left, top + step * i, cardW, cardH, ART_CARDS[i]);
  }
  ctx.restore();
}

/**
 * 巨人の頭の上の予告の札（板・攻撃の絵・数字）を描く。板の下端を頭の上端の gapAboveHead 上、横は centerX にそろえる。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {number} centerX 札の中心 x
 * @param {number} headTop 巨人の頭の上端 y
 * @returns {void}
 */
function drawIntentPlate(ctx, centerX, headTop) {
  const P = INTENT_PLATE;
  ctx.save();
  ctx.font = P.font;
  const label = HOW_TO_ART_LABELS.intentAmount;
  const textW = ctx.measureText(label).width;
  const plateW = P.padX * 2 + INTENT_CELL.w + P.gap + textW;
  const plateH = INTENT_CELL.h + P.padY * 2;
  const x = centerX - plateW / 2;
  const y = headTop - P.gapAboveHead - plateH;
  roundRectPath(ctx, x, y, plateW, plateH, P.radius);
  ctx.fillStyle = P.fill;
  ctx.fill();
  ctx.lineWidth = P.edgeWidth;
  ctx.strokeStyle = P.edge;
  ctx.stroke();
  drawIntentIcon(ctx, INTENT_IDS.attack, x + P.padX + INTENT_CELL.w / 2, y + plateH / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = P.strokeWidth;
  ctx.strokeStyle = P.strokeColor;
  ctx.strokeText(label, x + P.padX + INTENT_CELL.w + P.gap, y + plateH / 2);
  ctx.fillStyle = P.textColor;
  ctx.fillText(label, x + P.padX + INTENT_CELL.w + P.gap, y + plateH / 2);
  ctx.restore();
}

/**
 * 3ページ目: 上に BATTLE!、下に兵3体と巨人、巨人の頭の上に攻撃の予告の札。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 区画
 * @returns {void}
 */
function drawBattle(ctx, rect) {
  ctx.save();
  const footY = rect.y + rect.h * BATTLE.footY;
  drawLogo(ctx, LOGO_IDS.battle, rect.x + rect.w * BATTLE.logoX, rect.y + rect.h * BATTLE.logoY, BATTLE_LOGO_SCALE);
  for (let i = 0; i < BATTLE.troopKinds.length; i += 1) {
    drawPlainTroop(ctx, BATTLE.troopKinds[i], rect.x + rect.w * BATTLE.troopXs[i], footY, rect.h * BATTLE.troopSize);
  }
  const giantX = rect.x + rect.w * BATTLE.giantX;
  const giantRect = spriteFitRect(SPRITE_IDS.giant, giantX, footY, rect.h * BATTLE.giantH);
  drawSpriteFit(ctx, SPRITE_IDS.giant, giantRect);
  drawIntentPlate(ctx, giantX, giantRect.y);
  ctx.restore();
}

/**
 * 4ページ目の段の絵の箱（区画の左右から内側、縦は区画の中央）を求める。
 * @param {import('./layout.js').Rect} rect 段の左の絵の区画
 * @returns {import('./layout.js').Rect} 絵の箱
 */
function rowBox(rect) {
  const h = Math.min(ROW_BOX.maxH, rect.h - ROW_BOX.marginY);
  return {
    x: rect.x + ROW_BOX.marginX,
    y: rect.y + (rect.h - h) / 2,
    w: rect.w - ROW_BOX.marginX * 2,
    h,
  };
}

/**
 * 4ページ目: ゴブリン3体（奥の2体 → 手前の1体の順）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 段の左の絵の区画
 * @returns {void}
 */
function drawGoblins(ctx, rect) {
  ctx.save();
  const box = rowBox(rect);
  const size = box.w * GOBLINS.size;
  for (const fx of GOBLINS.backXs) {
    drawPlainTroop(ctx, 'goblin', box.x + box.w * fx, box.y + box.h * GOBLINS.backFootY, size);
  }
  drawPlainTroop(ctx, 'goblin', box.x + box.w * GOBLINS.frontX, box.y + box.h * GOBLINS.frontFootY, size);
  ctx.restore();
}

/**
 * 4ページ目: 巨人。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 段の左の絵の区画
 * @returns {void}
 */
function drawGiant(ctx, rect) {
  ctx.save();
  drawSpriteFit(ctx, SPRITE_IDS.giant, rowBox(rect));
  ctx.restore();
}

/**
 * 4ページ目: ドラゴン。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('./layout.js').Rect} rect 段の左の絵の区画
 * @returns {void}
 */
function drawDragon(ctx, rect) {
  ctx.save();
  drawSpriteFit(ctx, SPRITE_IDS.dragon, rowBox(rect));
  ctx.restore();
}

/**
 * 絵の識別子（HOW_TO_ART_IDS の値）→ 描く関数の凍結した表。
 * @type {Readonly<Record<string, function(CanvasRenderingContext2D, import('./layout.js').Rect): void>>}
 */
const ART_DRAWERS = Object.freeze({
  [HOW_TO_ART_IDS.welcome]: drawWelcome,
  [HOW_TO_ART_IDS.cards]: drawCards,
  [HOW_TO_ART_IDS.battle]: drawBattle,
  [HOW_TO_ART_IDS.goblins]: drawGoblins,
  [HOW_TO_ART_IDS.giant]: drawGiant,
  [HOW_TO_ART_IDS.dragon]: drawDragon,
});

/**
 * 遊び方の絵を1つ、区画 rect に描く（状態は変えない）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} artId 絵の識別子（HOW_TO_ART_IDS の値）
 * @param {import('./layout.js').Rect} rect 絵を描く区画
 * @returns {void}
 * @throws {Error} 未知の識別子のとき
 */
export function drawHowToArt(ctx, artId, rect) {
  if (!Object.prototype.hasOwnProperty.call(ART_DRAWERS, artId)) {
    throw new Error(`howToArt: 未知の絵の識別子です: ${artId}`);
  }
  ART_DRAWERS[artId](ctx, rect);
}
