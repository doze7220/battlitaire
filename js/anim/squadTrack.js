/**
 * 兵の群れ1つの動きの記録（時刻ごとの位置・数・濃さ）と、時計からの見た目を求める。
 * 描画も状態の変更も行わない純粋な関数だけを持つ。
 */

import { clamp01, lerp, easeInOutQuad } from './easing.js';

/**
 * 群れの種類。守備兵・敵の守り・敵兵・兵士・大工。
 * @typedef {'guard'|'enemyGuard'|'enemy'|'soldier'|'carpenter'} SquadKind
 */

/**
 * 動きの記録の1点。
 * @typedef {Object} SquadKey
 * @property {number} time 時刻（ms）
 * @property {number} x 群れの中心の x
 * @property {number} count 兵の数
 * @property {number} alpha 濃さ（0〜1）
 */

/**
 * 群れ1つの動きの記録。keys は time の昇順（同じ時刻が続いてよい）。
 * @typedef {Object} SquadTrack
 * @property {SquadKind} kind 群れの種類
 * @property {SquadKey[]} keys 動きの記録の点
 */

/**
 * ある時刻の群れの見た目。
 * @typedef {Object} SquadSample
 * @property {SquadKind} kind 群れの種類
 * @property {number} x 群れの中心の x
 * @property {number} count 兵の数
 * @property {number} alpha 濃さ（0〜1）
 */

/**
 * 空の動きの記録を作る。
 * @param {SquadKind} kind 群れの種類
 * @returns {SquadTrack} キーのない記録
 */
export function createSquadTrack(kind) {
  return { kind, keys: [] };
}

/**
 * 記録の最後に点を足す。
 * @param {SquadTrack} track 記録（書き換える）
 * @param {SquadKey} key 足す点（最後の点より前の時刻なら Error）
 * @returns {void}
 */
export function addSquadKey(track, key) {
  const last = lastSquadKey(track);
  if (last !== null && key.time < last.time) {
    throw new Error(`addSquadKey: time ${key.time} is before last key time ${last.time} (${track.kind})`);
  }
  track.keys.push(key);
}

/**
 * 記録の最後の点を返す。
 * @param {SquadTrack} track 記録
 * @returns {SquadKey|null} 最後の点。なければ null
 */
export function lastSquadKey(track) {
  return track.keys.length > 0 ? track.keys[track.keys.length - 1] : null;
}

/**
 * 記録の終わりの時刻を返す。
 * @param {SquadTrack} track 記録
 * @returns {number} 最後の点の時刻（ms）。点がなければ 0
 */
export function squadTrackEnd(track) {
  const last = lastSquadKey(track);
  return last === null ? 0 : last.time;
}

/**
 * 時計の値での群れの見た目を求める。
 * @param {SquadTrack} track 記録
 * @param {number} clock 時計（ms）
 * @returns {SquadSample|null} 見た目。まだ出ていない・見えない（数 0 以下・濃さ 0 以下）なら null
 */
export function sampleSquadTrack(track, clock) {
  const keys = track.keys;
  let i = -1;
  for (let k = 0; k < keys.length; k++) {
    if (keys[k].time <= clock) i = k;
    else break;
  }
  if (i < 0) return null;
  const cur = keys[i];
  let x = cur.x;
  let alpha = cur.alpha;
  if (i + 1 < keys.length) {
    const next = keys[i + 1];
    const span = next.time - cur.time;
    const u = span <= 0 ? 1 : clamp01((clock - cur.time) / span);
    x = lerp(cur.x, next.x, easeInOutQuad(u));
    alpha = lerp(cur.alpha, next.alpha, u);
  }
  if (cur.count <= 0 || alpha <= 0) return null;
  return { kind: track.kind, x, count: cur.count, alpha };
}
