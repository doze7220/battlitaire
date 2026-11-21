/**
 * 兵1体ずつの名簿を作り、段ごとに兵へ脚と終わり方を割り当てる
 * （出す・置く・行進・当たる・相打ち・落とす・城へ入る・右へ帰す・家へ跳ばす）。
 * 前から遅らせる式と、兵ごとのずれ（troopJitter.js）の足し方はここだけに置く。乱数は使わない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { campSlot } from './campSlots.js';
import { durationScale, startJitter } from './troopJitter.js';
import { addTroopLeg, createTroopUnit, setTroopEnd, troopHitEnd } from './troopMotion.js';

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
  flame: 'enemy',
});

/**
 * 最後に右の画面の外へ帰って消える、敵の側の種類（HP の群れ・シールドは含まない）。
 * @type {readonly string[]}
 */
const ENEMY_RUNNERS = Object.freeze(['enemy', 'enemyGuard', 'flame']);

/**
 * 自軍の兵の種類（前＝x の大きい方）。段取りの間の兵の種類にも使う。
 * @type {readonly string[]}
 */
export const OWN_KINDS = Object.freeze(['attack', 'defense', 'heal']);

/**
 * 前から k 番目（0 から、n 体のうち）の遅れ（ms）。全体の広がりには上限がある。
 * 遅れの式の1か所。打撃の時刻（`enemyAttacks.js`）からも使う。
 * @param {number} k 前から何番目か（0 から）
 * @param {number} n 全体の数
 * @param {number} staggerMs 1体ごとの遅れ（ms）
 * @param {number} maxMs 広がり全体の上限（ms）
 * @returns {number} 遅れ（ms）
 */
export function staggerDelay(k, n, staggerMs, maxMs) {
  if (n <= 1) return 0;
  return (k / (n - 1)) * Math.min(staggerMs * (n - 1), maxMs);
}

/**
 * 前から並んだ兵それぞれの動き出しの遅れ（前からの遅れ＋兵ごとのずれ）を求める。
 * 一番小さい遅れが 0 になるよう全員から引くので、一番早い兵は段の始めに出る。
 * @param {Array<{kind: string, index: number}>} units 前から並んだ兵（種類と番号を持つもの）
 * @param {number} staggerMs 1体ごとの遅れ（ms）
 * @param {number} maxMs 前からの遅れの広がり全体の上限（ms）
 * @param {number} jitterMs 兵ごとの動き出しのずれの最大（ms。0 ならずれなし）
 * @returns {number[]} 兵ごとの遅れ（ms。units と同じ順。最小は 0）
 */
function launchDelays(units, staggerMs, maxMs, jitterMs) {
  const n = units.length;
  const raw = units.map((u, k) => staggerDelay(k, n, staggerMs, maxMs) + jitterMs * startJitter(u.kind, u.index));
  if (n === 0) return raw;
  const min = Math.min(...raw);
  return raw.map((d) => d - min);
}

/**
 * 兵1体の動きの長さ（基準の長さにずれの倍率を掛ける）。
 * @param {string} kind 兵の種類
 * @param {number} index 種類の中の番号
 * @param {number} baseMs 基準の長さ（ms）
 * @param {number} spread 長さのばらつきの幅（割合）
 * @returns {number} 動きの長さ（ms）
 */
function legMs(kind, index, baseMs, spread) {
  return baseMs * durationScale(kind, index, spread);
}

/**
 * 当たりに行く動きの遅れの決め方の表（pace → `BATTLE_ANIM` の「1体ごとの遅れ」「広がりの上限」の設定名）。
 * @type {Readonly<Record<string, readonly [string, string]>>}
 */
const CHARGE_PACES = Object.freeze({
  move: Object.freeze(['moveStaggerMs', 'moveStaggerMaxMs']),
  hit: Object.freeze(['hitStaggerMs', 'hitStaggerMaxMs']),
});

/**
 * 当たりに行く動きの遅れ（前から k 番目、n 体のうち）。
 * @param {string} pace 遅れの決め方（`'move'` | `'hit'`）
 * @param {number} k 前から何番目か
 * @param {number} n 動く数
 * @returns {number} 遅れ（ms）
 * @throws {Error} pace が未知のとき
 */
function chargeDelay(pace, k, n) {
  if (!Object.prototype.hasOwnProperty.call(CHARGE_PACES, pace)) {
    throw new Error(`chargeDelay: 未知の pace です（${pace}）`);
  }
  const [staggerKey, maxKey] = CHARGE_PACES[pace];
  return staggerDelay(k, n, BATTLE_ANIM[staggerKey], BATTLE_ANIM[maxKey]);
}

/**
 * 当たる・城に入る脚の行き先の y を、陣地の範囲（`fieldTop`〜`fieldBottom`）での高さの割合のまま、
 * 当たる・城に入るときの足元の範囲（`contactTop`〜`contactBottom`）へ縮めて求める。
 * @param {TroopRoster} roster 名簿
 * @param {number} y 兵の今の y
 * @returns {number} `contactTop`〜`contactBottom` へ縮めた y
 */
function contactY(roster, y) {
  const { fieldTop, fieldBottom, contactTop, contactBottom } = roster.layout;
  const span = fieldBottom - fieldTop;
  const u = span > 0 ? Math.min(1, Math.max(0, (y - fieldTop) / span)) : 1;
  return contactTop + (contactBottom - contactTop) * u;
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
 * 種類の前からの並びを並べ替える（自軍は家の x の大きい順、敵の側は小さい順、同じなら番号順）。
 * @param {import('./troopMotion.js').TroopUnit[]} list 並べ替える並び（その場で並べ替える）
 * @param {string} kind 種類
 * @returns {void}
 */
function sortRanked(list, kind) {
  const sign = OWN_KINDS.includes(kind) ? -1 : 1;
  list.sort((a, b) => sign * (a.homeX - b.homeX) || a.index - b.index);
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
  sortRanked(list, kind);
}

/**
 * 段取りの間に、種類の兵を count 体、陣地の中心（fromX, fromY）から家へ跳ばせて足す。
 * 兵は t（に1体ごとの遅れとずれ）から、ずれた長さで家へ 1本の脚で動く。家の番号は、その種類のすでにいる兵の続き。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類（attack・defense・heal・enemy・enemyGuard）
 * @param {number} count 人数（0 以下なら何もしない）
 * @param {number} fromX 飛び出す位置の x
 * @param {number} fromY 飛び出す位置の足元の y
 * @param {number} t 跳び始める時刻（ms）
 * @param {number} moveMs 家へ跳ぶ時間（ms）
 * @returns {number} 全員が家に着く時刻（ms。count が 0 以下なら t）
 * @throws {Error} 未知の種類のとき
 */
export function landTroops(roster, kind, count, fromX, fromY, t, moveMs) {
  const { landStaggerMs, landStaggerMaxMs, landJitterMs, speedSpread } = BATTLE_ANIM;
  return jumpTroops(
    'landTroops', roster, kind, count, fromX, fromY, t, moveMs,
    landStaggerMs, landStaggerMaxMs, landJitterMs, speedSpread,
  );
}

/**
 * 種類の兵を count 体、(fromX, fromY) から家へ1本の脚で動かして足す（landTroops・enterTroops の共通部分）。
 * @param {string} name 呼び出し元の名前（Error の文の頭）
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} count 人数（0 以下なら何もしない）
 * @param {number} fromX 飛び出す位置の x
 * @param {number|null} fromY 飛び出す位置の足元の y（null なら兵ごとの家の y）
 * @param {number} t 動き始める時刻（ms）
 * @param {number} moveMs 家へ動く時間（ms）
 * @param {number} staggerMs 1体ごとの遅れ（ms）
 * @param {number} maxMs 遅れの広がり全体の上限（ms）
 * @param {number} jitterMs 兵ごとの動き出しのずれの最大（ms。0 ならずれなし）
 * @param {number} spread 動きの長さのばらつきの幅（割合。0 ならずれなし）
 * @returns {number} 全員が家に着く時刻（ms。全員の「t＋遅れ＋長さ」の最大。count が 0 以下なら t）
 * @throws {Error} 未知の種類のとき
 */
function jumpTroops(name, roster, kind, count, fromX, fromY, t, moveMs, staggerMs, maxMs, jitterMs, spread) {
  const campName = CAMP_OF[kind];
  if (campName === undefined) throw new Error(`${name}: 未知の種類 ${kind}`);
  const camp = roster.layout.camps[campName];
  const list = roster.ranked[kind] || (roster.ranked[kind] = []);
  const first = list.length;
  const n = Math.max(0, count);
  const ids = [];
  for (let i = 0; i < n; i++) ids.push({ kind, index: first + i });
  const delays = launchDelays(ids, staggerMs, maxMs, jitterMs);
  let end = t;
  for (let i = 0; i < n; i++) {
    const index = first + i;
    const home = campSlot(camp, index);
    const start = t + delays[i];
    const ms = legMs(kind, index, moveMs, spread);
    const unit = createTroopUnit(kind, index, home.x, home.y, start, 0);
    unit.x = fromX;
    unit.y = fromY === null ? home.y : fromY;
    addTroopLeg(unit, start, home.x, home.y, ms);
    roster.units.push(unit);
    list.push(unit);
    end = Math.max(end, start + ms);
  }
  sortRanked(list, kind);
  return end;
}

/**
 * 敵の側の兵を count 体、画面の外・口（fromX, fromY）から陣地の家へ跳ねながら動かして足す。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類（enemy・enemyGuard・flame）
 * @param {number} count 人数（0 以下なら何もしない）
 * @param {number} fromX 出る位置の x
 * @param {number|null} fromY 出る位置の足元の y（null なら兵ごとの家の y）
 * @param {number} t 出始める時刻（ms）
 * @param {number} moveMs 家へ動く時間（ms）
 * @returns {number} 全員が家に着く時刻（ms。count が 0 以下なら t）
 * @throws {Error} 未知の種類のとき
 */
export function enterTroops(roster, kind, count, fromX, fromY, t, moveMs) {
  const { moveStaggerMs, moveStaggerMaxMs } = BATTLE_ANIM;
  return jumpTroops('enterTroops', roster, kind, count, fromX, fromY, t, moveMs, moveStaggerMs, moveStaggerMaxMs, 0, 0);
}

/**
 * 種類の兵を、決まった足元の位置に時刻 t から置く。渡した順を前からの並びにする（並べ替えない。陣地は使わない）。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {Array<{x: number, y: number, size?: number}>} points 足元の位置と描く大きさ（前から）
 * @param {number} t 現れる時刻（ms）
 * @returns {void}
 */
export function placeTroops(roster, kind, points, t) {
  const list = roster.ranked[kind] || (roster.ranked[kind] = []);
  const first = list.length;
  for (let k = 0; k < points.length; k++) {
    const p = points[k];
    const unit = createTroopUnit(kind, first + k, p.x, p.y, t, 0);
    unit.size = p.size ?? 0;
    roster.units.push(unit);
    list.push(unit);
  }
}

/**
 * まだ終わっていない kind の兵を前から times.length 体選び、k 番目を times[k]（と動きの終わりの遅い方）に落とす。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number[]} times 落とす時刻（ms。前から順）
 * @returns {import('./troopMotion.js').TroopUnit[]} 選んだ兵（前から）
 * @throws {Error} 兵が足りないとき
 */
export function popTroops(roster, kind, times) {
  const active = activeOf(roster, kind);
  if (times.length > active.length) {
    throw new Error(`popTroops: ${kind} が足りません（必要 ${times.length}、いる ${active.length}）`);
  }
  const chosen = active.slice(0, times.length);
  for (let k = 0; k < chosen.length; k++) {
    const unit = chosen[k];
    setTroopEnd(unit, troopHitEnd(kind), Math.max(times[k], unit.freeAt), roster.layout.fallOutY);
  }
  return chosen;
}

/**
 * kind の前から count 体と partnerKind の前から同じ数が1対1の組になり、kind が相手の手前へ進んで着いた時刻に2体とも終わる。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 進む側の種類
 * @param {string} partnerKind 相手の種類
 * @param {number} count 組の数
 * @param {number} t 段の始め（ms）
 * @param {number} moveMs 進む時間（ms）
 * @param {string} [pace] 遅れの決め方（`'move'`＝移動の遅れ、`'hit'`＝敵に当たる間隔。省くと `'move'`）
 * @returns {number[]} 着く時刻の昇順の配列（行き先の y は相手の y）
 * @throws {Error} どちらかの兵が足りないとき、または pace が未知のとき
 */
export function chargePairs(roster, kind, partnerKind, count, t, moveMs, pace = 'move') {
  const m = Math.max(0, count);
  const squad = activeOf(roster, kind);
  const partners = activeOf(roster, partnerKind);
  if (m > squad.length || m > partners.length) {
    throw new Error(
      `chargePairs: 組の数 ${m} に対して兵が足りません（${kind}=${squad.length}, ${partnerKind}=${partners.length}）`,
    );
  }
  const arrivals = [];
  for (let k = 0; k < m; k++) {
    const unit = squad[k];
    const partner = partners[k];
    const side = partner.x >= unit.x ? 1 : -1;
    const start = Math.max(t + chargeDelay(pace, k, m), unit.freeAt);
    addTroopLeg(unit, start, partner.x - side * roster.layout.contactGap, partner.y, moveMs);
    setTroopEnd(unit, troopHitEnd(kind), unit.freeAt, roster.layout.fallOutY);
    setTroopEnd(partner, troopHitEnd(partnerKind), Math.max(unit.freeAt, partner.freeAt), roster.layout.fallOutY);
    arrivals.push(unit.freeAt);
  }
  return arrivals.sort((a, b) => a - b);
}

/**
 * 行進の段。kind の前から k 番目（k < pairs）は partnerKind の前から k 番目と組になり、
 * 相手が前へ踏み出した位置の手前まで進む。組でない兵は家から advanceX だけ進む。
 * @param {TroopRoster} roster 名簿
 * @param {{ kind: string, partnerKind: string, pairs: number, dir: number, advanceX: number, t: number }} spec
 *   kind＝進む側、partnerKind＝相手、pairs＝組の数、dir＝進む向き（右 1・左 -1）、advanceX＝組でない兵が進む距離、t＝段の始め
 * @returns {number} 段の長さ（全員の「遅れ＋長さ」の最大。兵がいなければ marchMs。ms）
 * @throws {Error} 組の数に対して兵が足りないとき
 */
export function marchSquad(roster, spec) {
  const { kind, partnerKind, pairs, dir, advanceX, t } = spec;
  const { marchMs, moveStaggerMs, moveStaggerMaxMs, moveJitterMs, speedSpread } = BATTLE_ANIM;
  const squad = activeOf(roster, kind);
  const partners = activeOf(roster, partnerKind);
  if (pairs > squad.length || pairs > partners.length) {
    throw new Error(
      `marchSquad: 組の数 ${pairs} に対して兵が足りません（${kind}=${squad.length}, ${partnerKind}=${partners.length}）`,
    );
  }
  const n = squad.length;
  const delays = launchDelays(squad, moveStaggerMs, moveStaggerMaxMs, moveJitterMs);
  let span = marchMs;
  for (let k = 0; k < n; k++) {
    const unit = squad[k];
    const delay = delays[k];
    const ms = legMs(unit.kind, unit.index, marchMs, speedSpread);
    if (k < pairs) {
      const partner = partners[k];
      unit.partner = partner;
      partner.partner = unit;
      const partnerX = partner.x - dir * roster.layout.blockStepX;
      const partnerStart = Math.max(t + delay, partner.freeAt);
      addTroopLeg(partner, partnerStart, partnerX, partner.y, ms);
      const start = Math.max(t + delay, unit.freeAt);
      addTroopLeg(unit, start, partnerX - dir * roster.layout.contactGap, partner.y, ms);
    } else {
      const start = Math.max(t + delay, unit.freeAt);
      addTroopLeg(unit, start, unit.homeX + dir * advanceX, unit.y, ms);
    }
    span = k === 0 ? delay + ms : Math.max(span, delay + ms);
  }
  return span;
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
    setTroopEnd(unit, troopHitEnd(unit.kind), Math.max(time, unit.freeAt), roster.layout.fallOutY);
    setTroopEnd(partner, troopHitEnd(partner.kind), Math.max(time, partner.freeAt), roster.layout.fallOutY);
  }
  return spreadOf(m, fallStaggerMs, fallStaggerMaxMs);
}

/**
 * まだ終わっていない kind の兵を前から count 体、targetX へ前から遅らせて移動させ、着いた時刻に跳ねて落ちさせる。
 * 行き先の y は、兵の今の y を陣地での高さの割合のまま、当たる・城に入るときの範囲（`contactTop`〜`contactBottom`）へ縮めたもの。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} count 動かす数（Infinity で全員）
 * @param {number} targetX 行き先の x
 * @param {number} t 段の始め（ms）
 * @param {number} moveMs 移動の時間（ms）
 * @param {string} [pace] 遅れの決め方（`'move'`＝移動の遅れ、`'hit'`＝敵に当たる間隔。省くと `'move'`）
 * @returns {number[]} 着く時刻の昇順の配列（1体も動かさなければ空）
 * @throws {Error} pace が未知のとき
 */
export function chargeTo(roster, kind, count, targetX, t, moveMs, pace = 'move') {
  const chosen = activeOf(roster, kind).slice(0, Math.max(0, count));
  const m = chosen.length;
  const arrivals = [];
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const start = Math.max(t + chargeDelay(pace, k, m), unit.freeAt);
    addTroopLeg(unit, start, targetX, contactY(roster, unit.y), moveMs);
    setTroopEnd(unit, troopHitEnd(kind), unit.freeAt, roster.layout.fallOutY);
    arrivals.push(unit.freeAt);
  }
  return arrivals.sort((a, b) => a - b);
}

/**
 * まだ終わっていない kind の兵を全員、城に入る位置へ前から遅らせて移動させ、着いた時刻に消す。
 * 行き先の y は、兵の今の y を陣地での高さの割合のまま、当たる・城に入るときの範囲（`contactTop`〜`contactBottom`）へ縮めたもの。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} t 段の始め（ms）
 * @param {number} moveMs 移動の基準の時間（ms。兵ごとにずれる）
 * @returns {number[]} 着く時刻の昇順の配列（1体も動かさなければ空）
 */
export function enterCastle(roster, kind, t, moveMs) {
  const { moveStaggerMs, moveStaggerMaxMs, moveJitterMs, speedSpread } = BATTLE_ANIM;
  const chosen = activeOf(roster, kind);
  const m = chosen.length;
  const delays = launchDelays(chosen, moveStaggerMs, moveStaggerMaxMs, moveJitterMs);
  const arrivals = [];
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const start = Math.max(t + delays[k], unit.freeAt);
    addTroopLeg(unit, start, roster.layout.castleEntryX, contactY(roster, unit.y), legMs(unit.kind, unit.index, moveMs, speedSpread));
    setTroopEnd(unit, 'vanish', unit.freeAt, roster.layout.fallOutY);
    arrivals.push(unit.freeAt);
  }
  return arrivals.sort((a, b) => a - b);
}

/**
 * まだ終わっていない kind の兵を全員、前から遅らせて右の画面の外（toX）へ走らせ、着いた時刻に消す。
 * @param {TroopRoster} roster 名簿
 * @param {string} kind 種類
 * @param {number} toX 行き先の x（画面の外）
 * @param {number} t 走り始める時刻（ms）
 * @param {number} moveMs 移動の基準の時間（ms。兵ごとにずれる）
 * @returns {void}
 */
export function exitTroops(roster, kind, toX, t, moveMs) {
  const { moveStaggerMs, moveStaggerMaxMs, moveJitterMs, speedSpread } = BATTLE_ANIM;
  const chosen = activeOf(roster, kind);
  const m = chosen.length;
  const delays = launchDelays(chosen, moveStaggerMs, moveStaggerMaxMs, moveJitterMs);
  for (let k = 0; k < m; k++) {
    const unit = chosen[k];
    const start = Math.max(t + delays[k], unit.freeAt);
    addTroopLeg(unit, start, toX, unit.y, legMs(unit.kind, unit.index, moveMs, speedSpread));
    setTroopEnd(unit, 'vanish', unit.freeAt, roster.layout.fallOutY);
  }
}

/**
 * 最後に、使われなかった兵の終わり方を決める。自軍は城へ帰って消え、敵の側（群れ・シールドを除く）は右の画面の外へ走って消える。
 * @param {TroopRoster} roster 名簿
 * @param {number} t 最後の段が終わった時刻（ms）
 * @returns {void}
 */
export function finishTroops(roster, t) {
  for (const kind of OWN_KINDS) {
    enterCastle(roster, kind, t, BATTLE_ANIM.returnMs);
  }
  for (const kind of ENEMY_RUNNERS) {
    exitTroops(roster, kind, roster.layout.offscreenX, t, BATTLE_ANIM.returnMs);
  }
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
