/**
 * 責務: 絵で描く敵（巨人・毒キノコ・ネクロマンサー・ドラゴンなど）ごとの配置の表 `ENEMY_FIGURES` を持ち、絵の矩形・シールドの並べ先・当たる位置・口・回復の文字・予告の札の置き場所を組み立てる。
 * 画面全体の配置は持たず、必要な基準の値は引数で受け取る。ルール層は import せず、状態は変えない。
 */

import { SPRITE_IDS, spriteFitRect } from './spriteView.js';

/**
 * 矩形。
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 */

/**
 * 予告の札の置き場所（札の上端の基準）。札が段の右端からはみ出すときは、`intentView.js` が左へ寄せる。
 * @typedef {Object} IntentSpot
 * @property {number} x 札の中心の基準の x（札が右端に収まるときの中心。収まらないと左へ寄る）
 * @property {number} y 札の上端の y
 */

/**
 * 敵の絵1体の配置。
 * @typedef {Object} EnemyFigure
 * @property {string} sprite スプライトの識別子（SPRITE_IDS の値）
 * @property {Rect} rect 絵の矩形（足元が地面）
 * @property {Rect|null} shieldArea シールドマークを並べる矩形（シールドを張らない敵は null）
 * @property {number} hitX 攻撃の兵が当たって止まる足元の x（`rect.x + rect.w × hit`）
 * @property {{ x: number, y: number }|null} mouth 炎が出る口の位置（口のない敵は null）
 * @property {{ x: number, y: number }} healText 敵の回復の量の文字の中心
 * @property {IntentSpot} intent 予告の札の上端の基準（中央。右端からはみ出すときは左へ寄る。`gap` が null の敵は札の下端が人数の表示の枠の下端にそろい、持つ敵は札の下端が絵の上端の `gap` 上にくる）
 * @property {number} minScale HP が 0 に近いときの体の倍率（1 なら縮まない）
 */

/**
 * 敵の種類の識別子ごとの絵の設定。height は絵の高さ、shield はシールドマークを並べる矩形（絵の矩形に対する割合。
 * cx・cy は中心、w・h は幅・高さ。シールドを張らない敵は null）、hit は攻撃の兵が当たって止まる x の絵の矩形の幅に対する割合（左端から。試遊で決め直す）、
 * mouth は炎が出る位置の絵の矩形に対する割合 {x, y}（口のない敵は null。試遊で決め直す）、
 * intent は予告の札の中心の x の絵の矩形に対する割合 {x}（試遊で決め直す）と、絵の上端と札の下端の間 gap（px。null なら札の下端を人数の表示の枠の下端にそろえる）、
 * minScale は HP が 0 に近いときの体の倍率（1 なら縮まない）。
 */
const ENEMY_FIGURES = Object.freeze({
  wolf: Object.freeze({
    sprite: SPRITE_IDS.wolf,
    height: 110,
    shield: null,
    hit: 0.12,
    mouth: null,
    intent: Object.freeze({ x: 0.5, gap: 30 }),
    minScale: 1,
  }),
  boar: Object.freeze({
    sprite: SPRITE_IDS.boar,
    height: 100,
    shield: Object.freeze({ cx: 0.35, cy: 0.55, w: 0.55, h: 0.6 }),
    hit: 0.12,
    mouth: null,
    intent: Object.freeze({ x: 0.5, gap: null }),
    minScale: 1,
  }),
  slime: Object.freeze({
    sprite: SPRITE_IDS.slime,
    height: 120,
    shield: Object.freeze({ cx: 0.5, cy: 0.55, w: 0.75, h: 0.5 }),
    hit: 0.12,
    mouth: null,
    intent: Object.freeze({ x: 0.5, gap: 30 }),
    minScale: 0.5,
  }),
  mushroom: Object.freeze({
    sprite: SPRITE_IDS.mushroom,
    height: 120,
    shield: Object.freeze({ cx: 0.5, cy: 0.55, w: 0.75, h: 0.5 }),
    hit: 0.12,
    mouth: null,
    intent: Object.freeze({ x: 0.5, gap: 30 }),
    minScale: 1,
  }),
  giant: Object.freeze({
    sprite: SPRITE_IDS.giant,
    height: 200,
    shield: Object.freeze({ cx: 0.41, cy: 0.39, w: 0.7, h: 0.3 }),
    hit: 0.15,
    mouth: null,
    intent: Object.freeze({ x: 0.32, gap: null }),
    minScale: 1,
  }),
  necromancer: Object.freeze({
    sprite: SPRITE_IDS.necromancer,
    height: 160,
    shield: Object.freeze({ cx: 0.41, cy: 0.39, w: 0.7, h: 0.3 }),
    hit: 0.15,
    mouth: null,
    intent: Object.freeze({ x: 0.32, gap: null }),
    minScale: 1,
  }),
  dragon: Object.freeze({
    sprite: SPRITE_IDS.dragon,
    height: 200,
    shield: Object.freeze({ cx: 0.47, cy: 0.49, w: 0.6, h: 0.3 }),
    hit: 0.15,
    mouth: Object.freeze({ x: 0.03, y: 0.3 }),
    intent: Object.freeze({ x: 0.25, gap: null }),
    minScale: 1,
  }),
});

/**
 * 敵の絵の配置の表を組み立てる。表の敵ごとに、絵の矩形（中心 x が centerX、足元が groundY、高さは `height` と maxHeight の小さい方）と、
 * シールドの並べ先・回復の文字・予告の札の置き場所・当たる位置・口を求める。
 * @param {Object} params 引数
 * @param {number} params.groundY 絵の足元の y（地面の下端）
 * @param {number} params.centerX 絵の中心の x
 * @param {number} params.maxHeight 絵の高さの上限
 * @param {number} params.intentTop 予告の札の上端の y（`intent.gap` が null の敵が使う）
 * @param {number} params.badgeH 予告の札（板）の高さ（`intent.gap` を持つ敵の札の上端を求める）
 * @param {number} params.healTextRatio 回復の文字の中心 y の、絵の上端からの距離の高さに対する割合
 * @returns {Object<string, EnemyFigure>} 敵の種類の識別子 → 絵の配置（凍結）
 */
export function createEnemyFigures({ groundY, centerX, maxHeight, intentTop, badgeH, healTextRatio }) {
  /** @type {Object<string, EnemyFigure>} */
  const figures = {};
  for (const [typeId, def] of Object.entries(ENEMY_FIGURES)) {
    const rect = spriteFitRect(def.sprite, centerX, groundY, Math.min(def.height, maxHeight));
    let shieldArea = null;
    if (def.shield !== null) {
      const sw = rect.w * def.shield.w;
      const sh = rect.h * def.shield.h;
      shieldArea = {
        x: rect.x + rect.w * def.shield.cx - sw / 2,
        y: rect.y + rect.h * def.shield.cy - sh / 2,
        w: sw,
        h: sh,
      };
    }
    figures[typeId] = Object.freeze({
      sprite: def.sprite,
      rect,
      shieldArea,
      healText: { x: rect.x + rect.w / 2, y: rect.y + rect.h * healTextRatio },
      intent: {
        x: rect.x + rect.w * def.intent.x,
        y: def.intent.gap === null ? intentTop : rect.y - def.intent.gap - badgeH,
      },
      hitX: rect.x + rect.w * def.hit,
      mouth: def.mouth === null ? null : { x: rect.x + rect.w * def.mouth.x, y: rect.y + rect.h * def.mouth.y },
      minScale: def.minScale,
    });
  }
  return Object.freeze(figures);
}
