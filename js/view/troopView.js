/**
 * 責務: 状態は変えず、兵（攻撃・防御・修理の兵、敵兵・敵の守り・ゴブリン・シールド・炎）を1体ずつ描き、城・敵の絵の足元の y で奥・手前に分けて描くこと。
 * 見た目と大きさごとの焼き付けの一覧を作り、焼き付けがあればそれで描く（描き分けは drawTroop の1か所）。ルール層・anim は実行時に import しない。
 */

import { SPRITE_IDS, drawTroopFigure, troopFigureBakeBounds } from './spriteView.js';
import { gaugeSprite } from './suitStyle.js';
import { openTroopBakes, findTroopBake } from './troopBakes.js';

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
 * @property {string} bake 焼き付けの識別子（同じ見た目の種類は1枚を共有する）
 */

/**
 * 兵の種類 → 見た目の表。自軍は白い丸に剣・盾・ハンマー、敵の側は緑の丸（持ち物なし。goblin はゴブリンの軍勢の HP の群れ）、
 * shield は巨人・ドラゴンのシールド（盾の絵）、flame はブレスの炎（炎の絵）。
 * @type {Readonly<Object<string, TroopLook>>}
 */
const TROOP_LOOKS = Object.freeze({
  attack: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('attack'), bake: 'attack' }),
  defense: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('defense'), bake: 'defense' }),
  heal: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('heal'), bake: 'heal' }),
  enemy: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin' }),
  enemyGuard: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin' }),
  goblin: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin' }),
  shield: Object.freeze({ body: SPRITE_IDS.shield, item: null, bake: 'shield' }),
  flame: Object.freeze({ body: SPRITE_IDS.fire, item: null, bake: 'flame' }),
});

/**
 * シールドの焼き付けを用意する数の上限。DEBUG タブの常時防御力のスライダーの最大（`debugRuleSliders.js` の `RULE_SLIDERS.armor.max`）に合わせる。
 * 変えたら手で見直す。超えた数の大きさは焼き付けがなく直接描く（見た目は同じ）。ルールの値ではない。
 * @type {number}
 */
const SHIELD_BAKE_MAX_COUNT = 20;

/**
 * 焼き付ける大きさの並びを求める。シールド以外は配置の兵の大きさ1つ、シールドは絵を持つ敵のシールドの並べ先ごとの数 1〜SHIELD_BAKE_MAX_COUNT の1マスの大きさ（重ねない）。
 * @param {string} bake 焼き付けの識別子
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {number[]} 大きさの並び
 */
function bakeSizes(bake, battleLayout) {
  if (bake !== 'shield') return [battleLayout.troops.size];
  const bodies = [];
  for (const typeId of Object.keys(battleLayout.enemyFigures)) bodies.push(battleLayout.enemyFigures[typeId].shieldArea);
  const sizes = [];
  for (const body of bodies) {
    for (let n = 1; n <= SHIELD_BAKE_MAX_COUNT; n++) {
      for (const rect of battleLayout.shieldRects(n, body)) {
        if (!sizes.some((v) => Math.abs(v - rect.w) <= 1e-6)) sizes.push(rect.w);
      }
    }
  }
  return sizes;
}

/**
 * 兵の焼き付けの入れ物を作る。見た目（焼き付けの識別子）ごとに、大きさごとに1枚、足元を原点に今の大きさ・傾き 0・伸び縮み 1 で描いた絵を焼き付ける。
 * 盤面のシーンの init から呼び、戻り値を destroy で dispose() する（Engine.start の後に呼ぶ）。
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {import('./troopBakes.js').TroopBakeSet} 焼き付けの入れ物
 */
export function createTroopBakes(battleLayout) {
  const entries = [];
  const done = new Set();
  for (const kind of Object.keys(TROOP_LOOKS)) {
    const look = TROOP_LOOKS[kind];
    if (done.has(look.bake)) continue;
    done.add(look.bake);
    for (const size of bakeSizes(look.bake, battleLayout)) {
      const itemSize = size * ITEM_SIZE_RATIO;
      const itemDX = size * ITEM_DX_RATIO;
      const itemDY = size * ITEM_DY_RATIO;
      entries.push({
        look: look.bake,
        size,
        source: (ctx) => drawTroopFigure(ctx, look.body, look.item, 0, 0, size, 0, itemSize, itemDX, itemDY, 1, 1),
        bounds: troopFigureBakeBounds(look.body, look.item, size, itemSize, itemDX, itemDY),
      });
    }
  }
  return openTroopBakes(entries);
}

/**
 * 兵1体を描く。位置・大きさは引数で受ける（兵1体ごとにオブジェクトを作らないため）。
 * 焼き付けがあれば（findTroopBake）その画像を足元を軸に傾け・伸ばして貼り、なければスプライトを直接描く（描き分けはここ1か所。見た目は同じ）。
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
  const bake = findTroopBake(look.bake, size);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (bake !== null) {
    ctx.translate(x, footY);
    if (tilt !== 0) ctx.rotate(tilt);
    if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
    bake.draw(ctx);
  } else {
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
  }
  ctx.restore();
}

/**
 * 城・敵の絵の足元の y によらず、絵の手前に描く兵の種類（体に並ぶシールド・口から出る炎）。
 * @type {ReadonlySet<string>}
 */
const OVER_FIGURE_KINDS = Object.freeze(new Set(['shield', 'flame']));

/**
 * 兵の名簿の見た目を、order の順（奥から手前）に、見えている兵だけ描く。読むだけで書き換えない。
 * layer で、城・敵の絵の足元の y（depthY）を境目に奥の兵・手前の兵の片方だけを描ける。
 * 奥の兵は sortY が depthY より小さく、絵の手前に描く種類でない兵。手前の兵はそれ以外。
 * @param {CanvasRenderingContext2D} ctx 描画先
 * @param {import('../anim/troopSwarm.js').TroopSwarmLook} troops 名簿の見た目
 * @param {number} size 兵の大きさ（直径。兵ごとの大きさが 0 のときに使う）
 * @param {'all'|'back'|'front'} [layer='all'] 描く層（'all' 全員・'back' 奥の兵だけ・'front' 手前の兵だけ）
 * @param {number} [depthY=0] 奥と手前の境目の y（城・敵の絵の足元の y。'all' では使わない）
 * @returns {void}
 * @throws {Error} 未知の layer のとき
 */
export function drawTroopSwarm(ctx, troops, size, layer = 'all', depthY = 0) {
  if (layer !== 'all' && layer !== 'back' && layer !== 'front') throw new Error(`未知の層: ${layer}`);
  const { count, kinds, order, visible, sortY, x, footY, tilt, alpha, size: sizes, scaleX, scaleY } = troops;
  for (let n = 0; n < count; n++) {
    const i = order[n];
    if (visible[i] === 0) continue;
    if (layer !== 'all') {
      const isBack = sortY[i] < depthY && !OVER_FIGURE_KINDS.has(kinds[i]);
      if (isBack !== (layer === 'back')) continue;
    }
    drawTroop(ctx, kinds[i], x[i], footY[i], sizes[i] > 0 ? sizes[i] : size, tilt[i], alpha[i], scaleX[i], scaleY[i]);
  }
}
