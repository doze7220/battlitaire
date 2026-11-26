/**
 * 責務: 状態は変えず、兵（攻撃・防御・修理の兵、敵兵・敵の守り・HP の群れの兵・シールド・炎）を1体ずつ描き、城・敵の絵の足元の y で奥・手前に分けて描くこと。
 * 見た目と大きさごとの焼き付けの一覧を作り、焼き付けがあればそれで描く（描き分けは drawTroop の1か所。自動兵士は薄いオレンジの体）。ルール層・anim は実行時に import しない。
 */

import { SPRITE_IDS, drawTroopFigure, drawSpriteCentered, troopFigureBakeBounds } from './spriteView.js';
import { gaugeSprite } from './suitStyle.js';
import { openTroopBakes, findTroopBake } from './troopBakes.js';
import { HORDE_SKINS, hordeSkinOf } from './hordeSkins.js';

/** 持ち物の大きさの、体の直径に対する割合。 */
const ITEM_SIZE_RATIO = 0.7;
/** 持ち物の横のずれ（前＝右へ）の、体の直径に対する割合。 */
const ITEM_DX_RATIO = 0.35;
/** 持ち物の縦のずれ（下へ）の、体の直径に対する割合。 */
const ITEM_DY_RATIO = 0.1;
/** 傷ついた体の、足元を軸にした傾き（rad）。試遊で決め直す値（ルールの値ではない）。 */
const WOUND_TILT = 0.25;
/** 傷ついた体の円に重ねる暗い色。試遊で決め直す値（ルールの値ではない）。 */
const WOUND_SHADE = 'rgba(0, 0, 0, 0.35)';
/** 自動兵士の体の円の内側を塗る薄いオレンジ。試遊で決め直す値（ルールの値ではない）。 */
const AUTO_BODY_COLOR = '#ffc98a';
/** 自動兵士の塗りの半径の、体の半径に対する割合（1 未満で体の黒い線を残す）。試遊で決め直す値（ルールの値ではない）。 */
const AUTO_FILL_RATIO = 0.84;

/**
 * 兵の見た目（体の絵と持ち物の絵。スプライトの識別子。持ち物なしは null）。
 * @typedef {Object} TroopLook
 * @property {string} body 体の絵
 * @property {string|null} item 持ち物の絵
 * @property {string} bake 焼き付けの識別子（同じ見た目の種類は1枚を共有する）
 * @property {boolean} [horde] 群れの敵の兵の種類か（真なら drawTroop の enemyTypeId の群れの絵で描く。この項目の体・持ち物は絵を引けないときの既定）
 * @property {boolean} [autoTint] 自動兵士の薄いオレンジの姿を持つか（真の見た目だけ、drawTroop の auto が効く。自軍の兵）
 */

/**
 * 兵の種類 → 見た目の表。自軍は白い丸に剣・盾・ハンマー、敵の側（enemy・enemyGuard・goblin＝HP の群れ）は群れの敵の絵（持ち物なし。既定はゴブリンの緑の丸。敵の種類ごとの絵は hordeSkins.js）、
 * shield はシールドを張る絵の敵（巨人・ドラゴン・スライム）のシールド（盾の絵）、flame はブレスの炎（炎の絵）。
 * @type {Readonly<Object<string, TroopLook>>}
 */
const TROOP_LOOKS = Object.freeze({
  attack: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('attack'), bake: 'attack', autoTint: true }),
  defense: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('defense'), bake: 'defense', autoTint: true }),
  heal: Object.freeze({ body: SPRITE_IDS.soldier, item: gaugeSprite('heal'), bake: 'heal', autoTint: true }),
  enemy: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin', horde: true }),
  enemyGuard: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin', horde: true }),
  goblin: Object.freeze({ body: SPRITE_IDS.goblin, item: null, bake: 'goblin', horde: true }),
  shield: Object.freeze({ body: SPRITE_IDS.shield, item: null, bake: 'shield' }),
  flame: Object.freeze({ body: SPRITE_IDS.fire, item: null, bake: 'flame' }),
});

/**
 * 傷ついた絵の焼き付けの識別子を返す。
 * @param {string} bake 焼き付けの識別子
 * @returns {string} 傷ついた絵の焼き付けの識別子（`${bake}:wounded`）
 */
function woundedBake(bake) {
  return `${bake}:wounded`;
}

/**
 * 傷ついた体の絵を、足元を原点に描く（焼き付けと直接描くときの両方がこの1つを呼ぶ）。
 * 体と持ち物を足元を軸に WOUND_TILT だけ傾けて描き、同じ傾きで体の円（中心 (0, −size/2)・半径 size/2）に WOUND_SHADE を重ねる。ctx の状態は戻す。
 * @param {CanvasRenderingContext2D} ctx 描画先（足元が原点）
 * @param {Readonly<TroopLook>} look 見た目
 * @param {number} size 体の直径
 * @returns {void}
 */
function drawWoundedFigure(ctx, look, size) {
  drawTroopFigure(ctx, look.body, look.item, 0, 0, size, WOUND_TILT, size * ITEM_SIZE_RATIO, size * ITEM_DX_RATIO, size * ITEM_DY_RATIO, 1, 1);
  ctx.save();
  ctx.rotate(WOUND_TILT);
  ctx.fillStyle = WOUND_SHADE;
  ctx.beginPath();
  ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 自動兵士の焼き付けの識別子を返す。
 * @param {string} bake 焼き付けの識別子
 * @returns {string} 自動兵士の絵の焼き付けの識別子（`${bake}:auto`）
 */
function autoBake(bake) {
  return `${bake}:auto`;
}

/**
 * 自動兵士の絵を、足元を原点に描く（焼き付けと直接描くときの両方がこの1つを呼ぶ）。
 * 体の絵 → 体の円（中心 (0, −size/2)・半径 size/2 × AUTO_FILL_RATIO）の AUTO_BODY_COLOR の塗り → 持ち物の絵（ふつうの兵と同じ大きさ・ずれ）の順。ctx の状態は戻す。
 * @param {CanvasRenderingContext2D} ctx 描画先（足元が原点）
 * @param {Readonly<TroopLook>} look 見た目
 * @param {number} size 体の直径
 * @returns {void}
 */
function drawAutoFigure(ctx, look, size) {
  drawTroopFigure(ctx, look.body, null, 0, 0, size, 0, size * ITEM_SIZE_RATIO, size * ITEM_DX_RATIO, size * ITEM_DY_RATIO, 1, 1);
  ctx.save();
  ctx.fillStyle = AUTO_BODY_COLOR;
  ctx.beginPath();
  ctx.arc(0, -size / 2, (size / 2) * AUTO_FILL_RATIO, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (look.item !== null) {
    drawSpriteCentered(ctx, look.item, size * ITEM_DX_RATIO, -size / 2 + size * ITEM_DY_RATIO, size * ITEM_SIZE_RATIO);
  }
}

/**
 * 焼き付ける範囲を、足元を原点に WOUND_TILT 回した外接の矩形にする。
 * @param {{minX: number, minY: number, maxX: number, maxY: number}} b 傾けない範囲
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 傾けた範囲
 */
function tiltedBounds(b) {
  const c = Math.cos(WOUND_TILT);
  const s = Math.sin(WOUND_TILT);
  const xs = [];
  const ys = [];
  for (const [x, y] of [[b.minX, b.minY], [b.maxX, b.minY], [b.minX, b.maxY], [b.maxX, b.maxY]]) {
    xs.push(x * c - y * s);
    ys.push(x * s + y * c);
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/**
 * シールドの焼き付けを用意する数の上限。防御の量はステージの加算で増え、ステージ 50 ほどまでは 30 以内。
 * 超えた数は直接描く（見た目は同じ）。変えたら手で見直す。ルールの値ではない。
 * @type {number}
 */
const SHIELD_BAKE_MAX_COUNT = 30;

/**
 * 焼き付ける大きさの並びを求める。シールド以外は配置の兵の大きさ1つ、シールドは絵を持つ敵のシールドの並べ先（シールドを張らない敵は飛ばす）ごとの数 1〜SHIELD_BAKE_MAX_COUNT の1マスの大きさ（重ねない）。
 * @param {string} bake 焼き付けの識別子
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {number[]} 大きさの並び
 */
function bakeSizes(bake, battleLayout) {
  if (bake !== 'shield') return [battleLayout.troops.size];
  const bodies = [];
  for (const typeId of Object.keys(battleLayout.enemyFigures)) {
    const area = battleLayout.enemyFigures[typeId].shieldArea;
    if (area !== null) bodies.push(area);
  }
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
 * 兵の焼き付けの入れ物を作る。見た目（兵の種類の表と群れの敵の絵の表。焼き付けの識別子）ごとに、大きさごとに1枚、足元を原点に今の大きさ・傾き 0・伸び縮み 1 で描いた絵を焼き付ける。
 * 群れの敵の絵は、その敵の種類の体の大きさ（hordePlaces）でも焼き付け、傷ついた絵（`:wounded`。傷の傾きを含む）も1枚ずつ焼き付ける。
 * 自軍の兵（autoTint の見た目）は、自動兵士の薄いオレンジの絵（`:auto`）も配置の兵の大きさで1枚ずつ焼き付ける。
 * 盤面のシーンの init から呼び、戻り値を destroy で dispose() する（Engine.start の後に呼ぶ）。
 * @param {import('./layout.js').BattleLayout} battleLayout 戦闘の段の配置
 * @returns {import('./troopBakes.js').TroopBakeSet} 焼き付けの入れ物
 */
export function createTroopBakes(battleLayout) {
  const entries = [];
  const done = new Set();
  /**
   * 同じ識別子・大きさは1枚だけ足す。
   * @param {Readonly<TroopLook>} look 見た目
   * @param {number} size 体の直径
   * @param {boolean} wounded 傷ついた絵か
   * @param {boolean} [auto=false] 自動兵士（薄いオレンジ）の絵か（wounded が偽のときだけ）
   */
  const add = (look, size, wounded, auto = false) => {
    const id = wounded ? woundedBake(look.bake) : auto ? autoBake(look.bake) : look.bake;
    const key = `${id}@${size}`;
    if (done.has(key)) return;
    done.add(key);
    const itemSize = size * ITEM_SIZE_RATIO;
    const itemDX = size * ITEM_DX_RATIO;
    const itemDY = size * ITEM_DY_RATIO;
    const bounds = troopFigureBakeBounds(look.body, look.item, size, itemSize, itemDX, itemDY);
    entries.push({
      look: id,
      size,
      source: wounded
        ? (ctx) => drawWoundedFigure(ctx, look, size)
        : auto
          ? (ctx) => drawAutoFigure(ctx, look, size)
          : (ctx) => drawTroopFigure(ctx, look.body, look.item, 0, 0, size, 0, itemSize, itemDX, itemDY, 1, 1),
      bounds: wounded ? tiltedBounds(bounds) : bounds,
    });
  };
  const looks = [...Object.values(TROOP_LOOKS), ...Object.values(HORDE_SKINS)];
  const seen = new Set();
  for (const look of looks) {
    if (seen.has(look.bake)) continue;
    seen.add(look.bake);
    for (const size of bakeSizes(look.bake, battleLayout)) add(look, size, false);
  }
  for (const typeId of Object.keys(HORDE_SKINS)) {
    const place = battleLayout.hordePlaces[typeId];
    if (place === undefined) throw new Error(`群れの敵の大きさと並ぶ場所の行がありません: ${typeId}`);
    add(HORDE_SKINS[typeId], place.size, false);
    add(HORDE_SKINS[typeId], place.size, true);
  }
  for (const look of Object.values(TROOP_LOOKS)) {
    if (look.autoTint !== true) continue;
    for (const size of bakeSizes(look.bake, battleLayout)) add(look, size, false, true);
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
 * @param {string|null} [enemyTypeId=null] 敵の種類の識別子（群れの敵の兵の種類 enemy・enemyGuard・goblin だけが見る。null・表にない種類は既定のゴブリンの絵。ほかの種類は見ない）
 * @param {boolean} [wounded=false] 傷ついた姿で描くか（傾いて暗い。焼き付けがあればそれを貼る。傾き tilt は傷の傾きに重ねる）
 * @param {boolean} [auto=false] 自動兵士の薄いオレンジの姿で描くか（autoTint の見た目で、wounded が偽のときだけ効く。焼き付けがあればそれを貼る）
 * @returns {void}
 * @throws {Error} 未知の種類のとき
 */
export function drawTroop(ctx, kind, x, footY, size, tilt, alpha, scaleX, scaleY, enemyTypeId = null, wounded = false, auto = false) {
  let look = Object.prototype.hasOwnProperty.call(TROOP_LOOKS, kind) ? TROOP_LOOKS[kind] : undefined;
  if (look === undefined) throw new Error(`未知の兵の種類: ${kind}`);
  if (look.horde === true) {
    const skin = hordeSkinOf(enemyTypeId);
    if (skin !== null) look = skin;
  }
  const tinted = auto && !wounded && look.autoTint === true;
  const bakeId = wounded ? woundedBake(look.bake) : tinted ? autoBake(look.bake) : look.bake;
  const bake = findTroopBake(bakeId, size);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (bake !== null) {
    ctx.translate(x, footY);
    if (tilt !== 0) ctx.rotate(tilt);
    if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
    bake.draw(ctx);
  } else if (wounded) {
    ctx.translate(x, footY);
    if (tilt !== 0) ctx.rotate(tilt);
    if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
    drawWoundedFigure(ctx, look, size);
  } else if (tinted) {
    ctx.translate(x, footY);
    if (tilt !== 0) ctx.rotate(tilt);
    if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
    drawAutoFigure(ctx, look, size);
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
 * @param {string|null} [enemyTypeId=null] 敵の種類の識別子（群れの敵の兵の絵を選ぶ。null は既定のゴブリンの絵）
 * @returns {void}
 * @throws {Error} 未知の layer のとき
 */
export function drawTroopSwarm(ctx, troops, size, layer = 'all', depthY = 0, enemyTypeId = null) {
  if (layer !== 'all' && layer !== 'back' && layer !== 'front') throw new Error(`未知の層: ${layer}`);
  const { count, kinds, order, visible, sortY, x, footY, tilt, alpha, size: sizes, scaleX, scaleY, wounded, auto } = troops;
  for (let n = 0; n < count; n++) {
    const i = order[n];
    if (visible[i] === 0) continue;
    if (layer !== 'all') {
      const isBack = sortY[i] < depthY && !OVER_FIGURE_KINDS.has(kinds[i]);
      if (isBack !== (layer === 'back')) continue;
    }
    drawTroop(ctx, kinds[i], x[i], footY[i], sizes[i] > 0 ? sizes[i] : size, tilt[i], alpha[i], scaleX[i], scaleY[i], enemyTypeId, wounded[i] === 1, auto[i] === 1);
  }
}
