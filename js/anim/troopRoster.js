/**
 * 兵1体ずつの名簿（TroopRoster）を作り、段ごとに兵へ移動の脚と終わり方を割り当てる。
 * 前から遅らせる式（出る・相打ちで落ちる）はここの1か所だけに置く。乱数は使わない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { campSlot } from './campSlots.js';
import { addTroopLeg, createTroopUnit, setTroopEnd } from './troopMotion.js';

/**
 * 兵の名簿。攻防の始めに1回作り、段ごとに脚と終わり方を足していく。
 * @typedef {Object} TroopRoster
 * @property {import('../view/layout.js').TroopLayout} layout 兵の配置（陣地・当たる位置・落ちて消える y）
 * @property {import('./troopMotion.js').TroopUnit[]} units 全員（作った順）
 * @property {Object<string, import('./troopMotion.js').TroopUnit[]>} ranked 種類ごとの前からの並び（自軍は家の x の大きい順、敵の側は小さい順、同じなら番号順）
 */

/**
 * 種類 → 陣地（`layout.camps` の項目名）の表。敵兵と敵の守りは同じ陣地を共用する。
 * @type {Readonly<Record<string, string>>}
 */
const CAMP_OF = Object.freeze({
  attack: 'attack',
  defense: 'defense',
  heal: 'heal',
  enemy: 'enemy',
  enemyGuard: 'enemy',
});

/**
 * 自軍の兵の種類（前＝x の大きい方）。
 * @type {readonly string[]}
 */
const OWN_KINDS = Object.freeze(['attack', 'defense', 'heal']);

/**
 * 前から k 番目（0 から、n 体のうち）の遅れ（ms）。全体の広がりには上限がある。
 * @param {number} k 前から何番目か（0 から）
 * @param {number} n 全体の数
 * @param {number} staggerMs 1体ごとの遅れ（ms）
 * @param {number} maxMs 広がり全体の上限（ms）
 * @returns {number} 遅れ（ms）
 */
function staggerDelay(k, n, staggerMs, maxMs) {
  if (n <= 1) return 0;
  return (k / (n - 1)) * Math.min(staggerMs * (n - 1), maxMs);
}

/**
 * 移動の遅れ（前から k 番目、n 体のうち）。
 * @param {number} k 前から何番目か
 * @param {number} n 動く数
 * @returns {number} 遅れ（ms）
 */
function moveDelay(k, n) {
  return staggerDelay(k, n, BATTLE_ANIM.moveStaggerMs, BATTLE_ANIM.moveStaggerMaxMs);
}

/**
 * 相打ちで落ちる遅れ（前から k 番目、n 組のうち）。
 * @param {number} k 前から何番目か
 * @param {number} n 組の数
 * @returns {number} 遅れ（ms）
 */
function fallDelay(k, n) {
  return staggerDelay(k, n, BATTLE_ANIM.fallStaggerMs, BATTLE_ANIM.fallStaggerMaxMs);
}

/**
 * 遅れの広がり全体（最後の1体の遅れ）。
 * @param {number} n 数
 * @param {number} staggerMs 1体ごとの遅れ（ms）
 * @param {number} maxMs 広がり全体の上限（ms）
 * @returns {number} 広がり（ms）
 */
function spreadOf(n, staggerMs, maxMs) {
  return n <= 1 ? 0 : Math.min(staggerMs * (n - 1), maxMs);
}

/**
 * 種類の前からの並び（まだ終わりが決まっていない兵だけ）を返す。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @returns {import('./troopMotion.js').TroopUnit[]} 終わり方の未決定の兵（前から）
 */
function activeOf(roster, kind) {
  const list = roster.ranked[kind];
  if (!list) return [];
  return list.filter((u) => u.end === null);
}

/**
 * 名簿を作る（兵はまだいない）。
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @returns {TroopRoster} 空の名簿
 */
export function createTroopRoster(troopLayout) {
  return { layout: troopLayout, units: [], ranked: {} };
}

/**
 * 種類の兵を count 体、陣地の家に置く（現れる時刻と濃くなる時間を記録する）。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類（attack・defense・heal・enemy・enemyGuard）
 * @param {number} count 人数（0 以上の整数）
 * @param {number} t 現れ始める時刻（ms）
 * @param {number} appearMs 濃くなる時間（ms。0 ならすぐ）
 * @returns {void}
 * @throws {Error} 未知の種類のとき
 */
export function spawnTroops(roster, kind, count, t, appearMs) {
  const campName = CAMP_OF[kind];
  if (campName === undefined) throw new Error(`spawnTroops: 未知の種類 ${kind}`);
  const camp = roster.layout.camps[campName];
  const list = roster.ranked[kind] || (roster.ranked[kind] = []);
  const first = list.length;
  for (let i = 0; i < count; i++) {
    const index = first + i;
    const home = campSlot(camp, index);
    const unit = createTroopUnit(kind, index, home.x, home.y, t, appearMs);
    roster.units.push(unit);
    list.push(unit);
  }
  const sign = OWN_KINDS.includes(kind) ? -1 : 1;
  list.sort((a, b) => sign * (a.homeX - b.homeX) || a.index - b.index);
}

/**
 * 行進の段。kind の前から k 番目（k < pairs）は partnerKind の前から k 番目と組になり、
 * 相手が前へ踏み出した位置の手前まで進む。組でない兵は家から advanceX だけ進む。
 * @param {TroopRoster} roster 名簿
 * @param {{ kind: string, partnerKind: string, pairs: number, dir: number, advanceX: number, t: number }} spec
 *   kind＝進む側、partnerKind＝相手、pairs＝組の数、dir＝進む向き（右 1・左 -1）、advanceX＝組でない兵が進む距離、t＝段の始め
 * @returns {number} 段の長さ（marchMs＋遅れの広がり。ms）
 * @throws {Error} 組の数に対して兵が足りないとき
 */
export function marchSquad(roster, spec) {
  const { kind, partnerKind, pairs, dir, advanceX, t } = spec;
  const { marchMs, moveStaggerMs, moveStaggerMaxMs } = BATTLE_ANIM;
  const squad = activeOf(roster, kind);
  const partners = activeOf(roster, partnerKind);
  if (pairs > squad.length || pairs > partners.length) {
    throw new Error(
      `marchSquad: 組の数 ${pairs} に対して兵が足りません（${kind}=${squad.length}, ${partnerKind}=${partners.length}）`,
    );
  }
  const n = squad.length;
  for (let k = 0; k < n; k++) {
    const unit = squad[k];
    const delay = moveDelay(k, n);
    if (k < pairs) {
      const partner = partners[k];
      unit.partner = partner;
      partner.partner = unit;
      const partnerX = partner.x - dir * roster.layout.blockStepX;
      const partnerStart = Math.max(t + delay, partner.freeAt);
      addTroopLeg(partner, partnerStart, partnerX, partner.y, marchMs);
      const start = Math.max(t + delay, unit.freeAt);
      addTroopLeg(unit, start, partnerX - dir * roster.layout.contactGap, partner.y, marchMs);
    } else {
      const start = Math.max(t + delay, unit.freeAt);
      addTroopLeg(unit, start, unit.homeX + dir * advanceX, unit.y, marchMs);
    }
  }
  return marchMs + spreadOf(n, moveStaggerMs, moveStaggerMaxMs);
}

/**
 * 相打ちの段。kind のうち相手のいる兵を前から amount 組、前から遅らせて2体とも跳ねて落ちさせる。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} amount 相打ちの組の数
 * @param {number} t 段の始め（ms）
 * @returns {number} 遅れの広がり（ms）
 */
export function clashPairs(roster, kind, amount, t) {
  const { fallStaggerMs, fallStaggerMaxMs } = BATTLE_ANIM;
  const chosen = activeOf(roster, kind)
    .filter((u) => u.partner !== null && u.partner.end === null)
    .slice(0, Math.max(0, amount));
  const m = chosen.length;
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const partner = unit.partner;
    const time = t + fallDelay(k, m);
    setTroopEnd(unit, 'fall', Math.max(time, unit.freeAt), roster.layout.fallOutY);
    setTroopEnd(partner, 'fall', Math.max(time, partner.freeAt), roster.layout.fallOutY);
  }
  return spreadOf(m, fallStaggerMs, fallStaggerMaxMs);
}

/**
 * まだ終わっていない kind の兵を前から count 体、targetX（y は今の y）へ前から遅らせて移動させ、着いた時刻に跳ねて落ちさせる。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} count 動かす数（Infinity で全員）
 * @param {number} targetX 行き先の x
 * @param {number} t 段の始め（ms）
 * @param {number} moveMs 移動の時間（ms）
 * @returns {number[]} 着く時刻の昇順の配列（1体も動かさなければ空）
 */
export function chargeTo(roster, kind, count, targetX, t, moveMs) {
  const chosen = activeOf(roster, kind).slice(0, Math.max(0, count));
  const m = chosen.length;
  const arrivals = [];
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const start = Math.max(t + moveDelay(k, m), unit.freeAt);
    addTroopLeg(unit, start, targetX, unit.y, moveMs);
    setTroopEnd(unit, 'fall', unit.freeAt, roster.layout.fallOutY);
    arrivals.push(unit.freeAt);
  }
  return arrivals.sort((a, b) => a - b);
}

/**
 * まだ終わっていない kind の兵を全員、城に入る位置へ前から遅らせて移動させ、着いた時刻に消す。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} t 段の始め（ms）
 * @param {number} moveMs 移動の時間（ms）
 * @returns {number[]} 着く時刻の昇順の配列（1体も動かさなければ空）
 */
export function enterCastle(roster, kind, t, moveMs) {
  const chosen = activeOf(roster, kind);
  const m = chosen.length;
  const arrivals = [];
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const start = Math.max(t + moveDelay(k, m), unit.freeAt);
    addTroopLeg(unit, start, roster.layout.castleEntryX, unit.y, moveMs);
    setTroopEnd(unit, 'vanish', unit.freeAt, roster.layout.fallOutY);
    arrivals.push(unit.freeAt);
  }
  return arrivals.sort((a, b) => a - b);
}

/**
 * まだ終わっていない kind の兵を全員、薄れて消えさせる（始まりは t と、その兵の動きが終わる時刻の遅い方）。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} t 薄れ始める時刻（ms）
 * @returns {void}
 */
export function fadeTroops(roster, kind, t) {
  for (const unit of activeOf(roster, kind)) {
    setTroopEnd(unit, 'fade', Math.max(t, unit.freeAt), roster.layout.fallOutY);
  }
}

/**
 * 最後に、使われなかった兵の終わり方を決める。自軍は城へ帰って消え、敵の側は薄れて消える。
 * @param {TroopRoster} roster 名簿
 * @param {number} t 最後の段が終わった時刻（ms）
 * @returns {void}
 */
export function finishTroops(roster, t) {
  for (const kind of OWN_KINDS) {
    enterCastle(roster, kind, t, BATTLE_ANIM.returnMs);
  }
  fadeTroops(roster, 'enemy', t);
  fadeTroops(roster, 'enemyGuard', t);
}

/**
 * 全員が見えなくなる時刻（終わり方のある兵の `doneAt` の最大。いなければ 0）。
 * @param {TroopRoster} roster 名簿
 * @returns {number} 時刻（ms）
 */
export function rosterEndTime(roster) {
  let max = 0;
  for (const unit of roster.units) {
    if (unit.end !== null && unit.end.doneAt > max) max = unit.end.doneAt;
  }
  return max;
}

/**
 * ある種類の兵の終わり方の始まる時刻（人数が1減る時刻）の昇順の並び。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @returns {number[]} 時刻（ms）の昇順
 */
export function rosterEndTimes(roster, kind) {
  const list = roster.ranked[kind] || [];
  const times = [];
  for (const unit of list) {
    if (unit.end !== null) times.push(unit.end.time);
  }
  return times.sort((a, b) => a - b);
}
