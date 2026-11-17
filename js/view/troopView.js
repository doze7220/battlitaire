/**
 * 責務: 兵（攻撃・防御・修理の兵、敵兵・敵の守り・ゴブリン・シールド・炎）を1体ずつ、体と持ち物のスプライトで描く。
 * 状態は変えず、ルール層・anim は実行時に import しない。
 */

import { SPRITE_IDS, drawTroopFigure } from './spriteView.js';
import { gaugeSprite } from './suitStyle.js';

/** 持ち物の大きさの、体の直径に対する割合。 */
const ITEM_SIZE_RATIO = 0.7;
/** 持ち物の横のずれ（前＝右へ）の、体の直径に対する割合。 */
const ITEM_DX_RATIO = 0.35;
/** 持ち物の縦のずれ（下へ）の、体の直径に対する割合。 */
const ITEM_DY_RATIO = 0.1;

/**
 * 兵の見た目（体の絵と持ち物の絵。スプライトの識別子。持ち物なしは null）。
 * @typedef {Object} TroopLook
 * @property {string} body 体の絵
 * @property {string|null} item 持ち物の絵
 */

/**
 * 兵の種類 → 見た目の表。自軍は白い丸に剣・盾・ハンマー、敵の側は緑の丸（持ち物なし。goblin はゴブリンの軍勢の HP の群れ）、
 * shield は巨人・ドラゴンのシールド（盾の絵）、flame はブレスの炎（炎の絵）。
 * @type {Readonly<Object<string, TroopLook>>}
 */
const TROOP_LOOKS = Object.freeze({
  attack: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('attack') }),
  defense: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('defense') }),
  heal: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('heal') }),
  enemy: Object.freeze({ body: SPRITE_IDS.goblin, item: null }),
  enemyGuard: Object.freeze({ body: SPRITE_IDS.goblin, item: null }),
  goblin: Object.freeze({ body: SPRITE_IDS.goblin, item: null }),
  shield: Object.freeze({ body: SPRITE_IDS.shield, item: null }),
  flame: Object.freeze({ body: SPRITE_IDS.fire, item: null }),
});

/**
 * 兵1体を描く。位置・大きさは引数で受ける（兵1体ごとにオブジェクトを作らないため）。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {string} kind 兵の種類（'attack'・'defense'・'heal'・'enemy'・'enemyGuard'・'goblin'・'shield'・'flame'）
 * @param {number} x 足元の中心 x
 * @param {number} footY 足元の y
 * @param {number} size 体の直径
 * @param {number} tilt 足元を軸にした傾き（ラジアン）
 * @param {number} alpha 濃さ（0〜1）
 * @param {number} scaleX 横の伸び縮み（1 で元の大きさ。足元が軸）
 * @param {number} scaleY 縦の伸び縮み（1 で元の大きさ。足元が軸）
 * @returns {void}
 * @throws {Error} 未知の種類のとき
 */
export function drawTroop(ctx, kind, x, footY, size, tilt, alpha, scaleX, scaleY) {
  const look = Object.prototype.hasOwnProperty.call(TROOP_LOOKS, kind) ? TROOP_LOOKS[kind] : undefined;
  if (look === undefined) throw new Error(`未知の兵の種類: ${kind}`);
  ctx.save();
  ctx.globalAlpha = alpha;
  drawTroopFigure(
    ctx,
    look.body,
    look.item,
    x,
    footY,
    size,
    tilt,
    size * ITEM_SIZE_RATIO,
    size * ITEM_DX_RATIO,
    size * ITEM_DY_RATIO,
    scaleX,
    scaleY,
  );
  ctx.restore();
}

/**
 * 兵の名簿の見た目を、order の順（奥から手前）に、見えている兵だけ描く。読むだけで書き換えない。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/troopSwarm.js').TroopSwarmLook} troops 名簿の見た目
 * @param {number} size 兵の大きさ（直径。兵ごとの大きさが 0 のときに使う）
 * @returns {void}
 */
export function drawTroopSwarm(ctx, troops, size) {
  const { count, kinds, order, visible, x, footY, tilt, alpha, size: sizes, scaleX, scaleY } = troops;
  for (let n = 0; n < count; n++) {
    const i = order[n];
    if (visible[i] === 0) continue;
    drawTroop(ctx, kinds[i], x[i], footY[i], sizes[i] > 0 ? sizes[i] : size, tilt[i], alpha[i], scaleX[i], scaleY[i]);
  }
}
