/**
 * 敵の体（ゴブリンの群れ・シールドを名簿へ置く、攻撃の兵が当たる・シールドが剥がれる、倒れたとき絵が跳ねて落ちる記録）と、
 * 時計からの絵の見た目を求める。体の見せ方ごとの違いはこのファイルの表で分ける。描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { enemyBodyStyle } from './enemyShows.js';
import { createFigureDash, sampleFigureDash } from './figureDash.js';
import { createTroopUnit, sampleTroop, setTroopEnd } from './troopMotion.js';
import { chargePairs, chargeTo, placeTroops, popTroops } from './troopRoster.js';
import { bodyScale, scaledShieldArea, scaledX } from '../view/figureScale.js';

/**
 * 敵の体の記録。
 * @typedef {Object} EnemyBody
 * @property {'horde'|'figure'} style 体の見せ方
 * @property {number|null} hitX 絵に当たる位置の x（攻防の前の HP の倍率をかけた位置。群れは null）
 * @property {number|null} shieldHitX シールドに当たる位置の x（攻防の前の HP の倍率をかけた位置。群れはシールドがないので null）
 * @property {import('../view/enemyFigures.js').EnemyFigure|null} figure 絵の配置（体に当たる位置を HP の倍率で求めるのに読む。群れは null）
 * @property {number} maxHp 敵の最大 HP（倍率を求めるのに使う。群れは 0）
 * @property {import('./figureDash.js').FigureDash|null} dash 絵の駆け寄りの記録（絵だけ。群れは null）
 * @property {number|null} contactX 絵の左の縁の x（攻防の前の HP の倍率をかけた位置。駆け寄りの行き先から横のずれを求める。群れは null）
 * @property {import('./troopMotion.js').TroopUnit|null} fall 倒れる動きだけに使う1体（群れは null。名簿には入れない）
 * @property {number} fallOutY 絵が消える足元の y（群れは 0）
 */

/**
 * 倒れる絵の見た目（描画が読む）。
 * @typedef {Object} EnemyFigureLook
 * @property {boolean} visible 描くか
 * @property {number} dy 足元の y のずれ（倒れる動きと駆け寄りの跳ねの持ち上がりを合わせたもの）
 * @property {number} dx 足元の x のずれ（駆け寄り・戻り）
 */

/**
 * 駆け寄りの見た目を求める作業用の入れ物（毎フレームオブジェクトを作らないため。書いてすぐ読むだけで、持ち越さない）。
 * @type {import('./figureDash.js').FigureDashLook}
 */
const DASH_SCRATCH = { dx: 0, lift: 0 };

/**
 * 体の見せ方ごとの準備。群れ・絵を名簿へ置き、体の記録の一部とシールドの並べ先を返す（群れはシールドを置かないので null）。
 * @type {Readonly<Record<string, function(import('./troopRoster.js').TroopRoster, import('../view/layout.js').BattleLayout, string, number, number): {body: EnemyBody, shieldArea: import('../view/layout.js').Rect|null}>>}
 */
const BODY_SETUPS = Object.freeze({
  horde: (roster, battleLayout, typeId, hp, maxHp) => {
    const slots = battleLayout.hordeSlots(hp);
    const points = [];
    for (let i = slots.length - 1; i >= 0; i--) {
      points.push({ x: slots[i].x, y: slots[i].footY, size: slots[i].size });
    }
    placeTroops(roster, 'goblin', points, 0);
    return {
      body: {
        style: 'horde',
        hitX: null,
        shieldHitX: null,
        figure: null,
        maxHp: 0,
        dash: null,
        contactX: null,
        fall: null,
        fallOutY: 0,
      },
      shieldArea: null,
    };
  },
  figure: (roster, battleLayout, typeId, hp, maxHp) => {
    const figures = battleLayout.enemyFigures;
    if (!Object.prototype.hasOwnProperty.call(figures, typeId)) {
      throw new Error(`enemyBody: 絵を持たない敵 ${typeId}`);
    }
    const figure = figures[typeId];
    const scale = bodyScale(figure.minScale, hp, maxHp);
    const hitX = scaledX(figure, figure.hitX, scale);
    return {
      body: {
        style: 'figure',
        hitX,
        shieldHitX: hitX,
        figure,
        maxHp,
        dash: createFigureDash(),
        contactX: hitX,
        fall: createTroopUnit('figure', 0, figure.rect.x + figure.rect.w / 2, figure.rect.y + figure.rect.h, 0, 0),
        fallOutY: battleLayout.area.y + battleLayout.area.h + figure.rect.h,
      },
      shieldArea: scaledShieldArea(figure, scale),
    };
  },
});

/**
 * 体の見せ方ごとの、攻撃の兵が敵に当たる動き（着く時刻の昇順を返す）。
 * 敵に当たる間隔（`hitStaggerMs`・上限 `hitStaggerMaxMs`）で1体ずつずらす。
 * 絵は、k 体目の兵が「その前の表示 HP（shownHp − k）」の倍率の位置へ着く。
 * @type {Readonly<Record<string, function(EnemyBody, import('./troopRoster.js').TroopRoster, number, number, number): number[]>>}
 */
const BODY_HITS = Object.freeze({
  horde: (body, roster, count, t) => chargePairs(roster, 'attack', 'goblin', count, t, BATTLE_ANIM.hitMoveMs, 'hit'),
  figure: (body, roster, count, t, shownHp) => chargeTo(
    roster,
    'attack',
    count,
    (k) => scaledX(body.figure, body.figure.hitX, bodyScale(body.figure.minScale, shownHp - k, body.maxHp)),
    t,
    BATTLE_ANIM.hitMoveMs,
    'hit',
  ),
});

/**
 * 敵の体を作り、群れ（ゴブリン）とシールドを時刻 0 から名簿へ置く。
 * 落とす順は、群れは番号の大きい方から、シールドは左の列から（同じ列は上から）。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('../view/layout.js').BattleLayout} battleLayout 最上段の配置
 * @param {string} typeId 敵の種類の識別子
 * @param {number} hp 攻防の前の敵の HP（群れの数）
 * @param {number} defense 攻防の前の敵の防御の量（絵を持つ敵のシールドの数。群れはシールドを置かない）
 * @param {number} maxHp 敵の最大 HP（絵の体の倍率を求める。シールドの並べ先は攻防の前の HP の倍率）
 * @returns {EnemyBody} 敵の体の記録
 * @throws {Error} 絵を持たない敵を絵の見せ方で作るとき
 */
export function createEnemyBody(roster, battleLayout, typeId, hp, defense, maxHp) {
  const style = enemyBodyStyle(typeId);
  const { body, shieldArea } = BODY_SETUPS[style](roster, battleLayout, typeId, hp, maxHp);
  if (shieldArea !== null && defense > 0) {
    const points = battleLayout.shieldRects(defense, shieldArea).map((r) => ({
      x: r.x + r.w / 2,
      y: r.y + r.h,
      size: r.w,
    }));
    points.sort((a, b) => a.x - b.x || a.y - b.y);
    placeTroops(roster, 'shield', points, 0);
  }
  return body;
}

/**
 * 攻撃の兵を count 体、シールドに当たる位置へ進め、着いた時刻に兵と前からのシールドを1つずつ跳ねて落とす（HP は変わらない）。
 * 敵に当たる間隔（`hitStaggerMs`・上限 `hitStaggerMaxMs`）で1体ずつずらす。
 * @param {EnemyBody} body 敵の体
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {number} count 剥がす数
 * @param {number} t 段の始め（ms）
 * @returns {number[]} 着く時刻（ms）の昇順
 * @throws {Error} シールドが足りないとき
 */
export function hitEnemyShield(body, roster, count, t) {
  const arrivals = chargeTo(roster, 'attack', count, body.shieldHitX, t, BATTLE_ANIM.hitMoveMs, 'hit');
  popTroops(roster, 'shield', arrivals);
  return arrivals;
}

/**
 * 攻撃の兵を count 体、敵に当たる位置へ進める（群れは1対1で2体とも落ち、絵は着いた時刻に兵が落ちる）。
 * 敵に当たる間隔（`hitStaggerMs`・上限 `hitStaggerMaxMs`）で1体ずつずらす。
 * @param {EnemyBody} body 敵の体
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {number} count 当たる数
 * @param {number} t 段の始め（ms）
 * @param {number} shownHp 段の始めの敵の HP の表示値（絵の当たる位置の倍率を求める。k 体目は `shownHp − k`）
 * @returns {number[]} 着く時刻（ms）の昇順
 * @throws {Error} 群れの数が足りないとき
 */
export function hitEnemyBody(body, roster, count, t, shownHp) {
  return BODY_HITS[body.style](body, roster, count, t, shownHp);
}

/**
 * 倒れたとき、絵が跳ねて落ちる終わり方を記録する（群れは `enemyHit` で全部落ちているので何もしない）。
 * @param {EnemyBody} body 敵の体
 * @param {number} time 倒れる（HP が 0 になる）時刻（ms）
 * @returns {void}
 */
export function defeatEnemyBody(body, time) {
  if (body.fall !== null && body.fall.end === null) {
    setTroopEnd(body.fall, 'fall', time, body.fallOutY);
  }
}

/**
 * 倒れる絵が見えなくなる時刻を返す。
 * @param {EnemyBody} body 敵の体
 * @returns {number} 時刻（ms。倒れる絵がなければ 0）
 */
export function enemyBodyEnd(body) {
  return body.fall !== null && body.fall.end !== null ? body.fall.end.doneAt : 0;
}

/**
 * 倒れる絵が、いまの時計までに倒れ始めているかを返す（群れ・倒れる記録がまだない絵は false）。
 * @param {EnemyBody} body 敵の体
 * @param {number} clock 時計の値（ms）
 * @returns {boolean} 倒れ始めていれば true
 */
export function enemyFigureFalling(body, clock) {
  return body.fall !== null && body.fall.end !== null && clock >= body.fall.end.time;
}

/**
 * 時計からの絵の見た目を `out` に書き込む（オブジェクトを作らない）。倒れる動きの `dy` に駆け寄りの跳ねの持ち上がりと横のずれ `dx` を合わせる。
 * @param {EnemyBody} body 敵の体
 * @param {number} clock 時計の値（ms）
 * @param {EnemyFigureLook} out 書き込み先
 * @param {import('./troopMotion.js').TroopSample} scratch 呼ぶ側が持つ作業用の入れ物
 * @returns {void}
 */
export function sampleEnemyFigure(body, clock, out, scratch) {
  if (body.fall === null) {
    out.visible = false;
    out.dy = 0;
    out.dx = 0;
    return;
  }
  sampleTroop(body.fall, clock, scratch);
  if (body.dash !== null) {
    sampleFigureDash(body.dash, clock, DASH_SCRATCH);
  } else {
    DASH_SCRATCH.dx = 0;
    DASH_SCRATCH.lift = 0;
  }
  out.visible = scratch.visible;
  out.dy = scratch.visible ? scratch.footY - body.fall.homeY - DASH_SCRATCH.lift : 0;
  out.dx = scratch.visible ? DASH_SCRATCH.dx : 0;
}
