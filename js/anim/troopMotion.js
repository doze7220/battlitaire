/**
 * 兵1体の動きの記録（脚・終わり方）の作成と追記、時計からの1体の見た目（位置・傾き・濃さ）を求める。
 * 弾む・揺れる・跳ねて落ちる・薄れる・城に入って消えるの式はここだけに置く。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';

/**
 * 兵の種類。自軍はゲージの識別子（attack・defense・heal）、敵の側は enemy・enemyGuard、ゴブリンの軍勢の絵は goblin。
 * @typedef {'attack'|'defense'|'heal'|'enemy'|'enemyGuard'|'goblin'} TroopKind
 */

/**
 * 移動の区間（脚）。位置は直線で補間する。
 * @typedef {Object} TroopLeg
 * @property {number} start 脚の始まりの時刻（ms）
 * @property {number} end 脚の終わりの時刻（ms）
 * @property {number} fromX 元の x
 * @property {number} fromY 元の足元の y
 * @property {number} toX 行き先の x
 * @property {number} toY 行き先の足元の y
 */

/**
 * 終わり方。
 * @typedef {Object} TroopEnd
 * @property {'fall'|'vanish'|'fade'} type 'fall'＝跳ねて落ちる／'vanish'＝その場で見えなくなる（城に入る）／'fade'＝薄れて消える
 * @property {number} time 終わり方の始まる時刻（ms）
 * @property {number} doneAt 見えなくなる時刻（ms）
 * @property {number} x 始まる位置の x
 * @property {number} y 始まる位置の足元の y
 */

/**
 * 兵1体の記録。攻防の始めに作り、毎フレームは書き換えない（作るときだけ x・y・freeAt・partner を使う）。
 * @typedef {Object} TroopUnit
 * @property {TroopKind} kind 種類
 * @property {number} index 種類の中の何番目か
 * @property {number} homeX 家の x
 * @property {number} homeY 家の足元の y
 * @property {number} appearAt 現れ始める時刻（ms）
 * @property {number} appearMs 現れる（濃くなる）時間（ms。0 ならすぐ）
 * @property {TroopLeg[]} legs 移動の区間の並び（時刻の昇順）
 * @property {TroopEnd|null} end 終わり方（まだなら null）
 * @property {number} x 作るときだけ使う。最後の脚の行き先の x（いまいる位置）
 * @property {number} y 作るときだけ使う。最後の脚の行き先の足元の y
 * @property {number} freeAt 作るときだけ使う。最後の脚の終わりの時刻（次の脚はこれ以降に始める）
 * @property {TroopUnit|null} partner 作るときだけ使う。相打ちの相手
 */

/**
 * 時計からの1体の見た目の入れ物。`sampleTroop` が書き込む（呼び出しごとにオブジェクトを作らないため）。
 * @typedef {Object} TroopSample
 * @property {boolean} visible 見えるか
 * @property {number} x 足元の x
 * @property {number} footY 足元の y（持ち上がり・跳ね・落ちを含む）
 * @property {number} sortY 描く順に使う地面の上の y（持ち上がり・跳ね・落ちを含まない）
 * @property {number} tilt 傾き（rad。足元を軸）
 * @property {number} alpha 濃さ（0〜1）
 */

/**
 * 兵1体の記録を作る。
 * @param {TroopKind} kind 種類
 * @param {number} index 種類の中の何番目か
 * @param {number} homeX 家の x
 * @param {number} homeY 家の足元の y
 * @param {number} appearAt 現れ始める時刻（ms）
 * @param {number} appearMs 現れる時間（ms。0 ならすぐ）
 * @returns {TroopUnit} 脚・終わり方・相手のない記録
 */
export function createTroopUnit(kind, index, homeX, homeY, appearAt, appearMs) {
  return {
    kind,
    index,
    homeX,
    homeY,
    appearAt,
    appearMs,
    legs: [],
    end: null,
    x: homeX,
    y: homeY,
    freeAt: appearAt,
    partner: null,
  };
}

/**
 * 兵に移動の脚を足す。元の位置はいまいる位置（`unit.x`・`unit.y`）で、足したあと行き先へ進める。
 * @param {TroopUnit} unit 兵
 * @param {number} start 脚の始まりの時刻（ms。`unit.freeAt` 以降）
 * @param {number} toX 行き先の x
 * @param {number} toY 行き先の足元の y
 * @param {number} duration 脚の長さ（ms）
 * @returns {void}
 * @throws {Error} `start` が `unit.freeAt` より前のとき
 */
export function addTroopLeg(unit, start, toX, toY, duration) {
  if (start < unit.freeAt) {
    throw new Error(`addTroopLeg: start(${start}) が freeAt(${unit.freeAt}) より前です`);
  }
  const end = start + duration;
  unit.legs.push({ start, end, fromX: unit.x, fromY: unit.y, toX, toY });
  unit.x = toX;
  unit.y = toY;
  unit.freeAt = end;
}

/**
 * 足元が `startY` から跳ねて落ち始めてから、`fallOutY` に着くまでの時間（ms）を求める。
 * @param {number} startY 跳ね始める足元の y
 * @param {number} fallOutY 消える y（足元がこれより下に来たら消える）
 * @returns {number} 跳ね始めから消えるまでの時間（ms）
 */
export function fallDuration(startY, fallOutY) {
  const { popHeight, popMs, fallAccel } = BATTLE_ANIM;
  const drop = Math.max(0, fallOutY - (startY - popHeight));
  return popMs + Math.sqrt((2 * drop) / fallAccel);
}

/**
 * 兵に終わり方を決める。位置はいまいる位置（`unit.x`・`unit.y`）。
 * @param {TroopUnit} unit 兵
 * @param {'fall'|'vanish'|'fade'} type 終わり方
 * @param {number} time 終わり方の始まる時刻（ms）
 * @param {number} fallOutY 落ちる兵が消える y（'fall' のときだけ使う）
 * @returns {void}
 * @throws {Error} すでに終わり方があるとき・未知の種類のとき
 */
export function setTroopEnd(unit, type, time, fallOutY) {
  if (unit.end !== null) {
    throw new Error('setTroopEnd: すでに終わり方が決まっています');
  }
  let doneAt;
  if (type === 'fall') {
    doneAt = time + fallDuration(unit.y, fallOutY);
  } else if (type === 'fade') {
    doneAt = time + BATTLE_ANIM.fadeMs;
  } else if (type === 'vanish') {
    doneAt = time;
  } else {
    throw new Error(`setTroopEnd: 未知の終わり方 ${type}`);
  }
  unit.end = { type, time, doneAt, x: unit.x, y: unit.y };
}

/**
 * 時計からの1体の見た目を `out` に書き込む（オブジェクトを作らない）。
 * @param {TroopUnit} unit 兵
 * @param {number} clock 時計の値（ms）
 * @param {TroopSample} out 書き込み先
 * @returns {void}
 * @throws {Error} `BATTLE_ANIM.moveStyle` が未知のとき
 */
export function sampleTroop(unit, clock, out) {
  const style = BATTLE_ANIM.moveStyle;
  if (style !== 'hop' && style !== 'sway') {
    throw new Error(`sampleTroop: 未知の moveStyle ${style}`);
  }

  out.visible = false;
  out.tilt = 0;
  out.alpha = 1;
  if (clock < unit.appearAt) return;

  const end = unit.end;
  if (end !== null && clock >= end.time) {
    if (end.type === 'vanish') return;
    if (clock >= end.doneAt) return;
    out.visible = true;
    out.x = end.x;
    out.sortY = end.y;
    if (end.type === 'fade') {
      out.footY = end.y;
      out.alpha = 1 - (clock - end.time) / BATTLE_ANIM.fadeMs;
    } else {
      const { popHeight, popMs, fallAccel } = BATTLE_ANIM;
      const tau = clock - end.time;
      let dy;
      if (tau <= popMs) {
        const v0 = (2 * popHeight) / popMs;
        const g1 = (2 * popHeight) / (popMs * popMs);
        dy = -(v0 * tau - (g1 * tau * tau) / 2);
      } else {
        const d = tau - popMs;
        dy = -popHeight + (fallAccel * d * d) / 2;
      }
      out.footY = end.y + dy;
    }
    return;
  }

  out.visible = true;
  if (unit.appearMs > 0) {
    out.alpha = Math.min(1, (clock - unit.appearAt) / unit.appearMs);
  }

  let x = unit.homeX;
  let y = unit.homeY;
  let lift = 0;
  const legs = unit.legs;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    if (clock >= leg.end) {
      x = leg.toX;
      y = leg.toY;
      continue;
    }
    if (clock < leg.start) break;
    const length = leg.end - leg.start;
    const u = (clock - leg.start) / length;
    x = leg.fromX + (leg.toX - leg.fromX) * u;
    y = leg.fromY + (leg.toY - leg.fromY) * u;
    if (style === 'hop') {
      const n = Math.max(1, Math.round(length / BATTLE_ANIM.hopPeriodMs));
      lift = BATTLE_ANIM.hopHeight * Math.abs(Math.sin(Math.PI * n * u));
    } else {
      const n = Math.max(1, Math.round(length / BATTLE_ANIM.swayPeriodMs));
      out.tilt = BATTLE_ANIM.swayAngle * Math.sin(2 * Math.PI * n * u);
    }
    break;
  }
  out.x = x;
  out.sortY = y;
  out.footY = y - lift;
}
