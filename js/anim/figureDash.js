/**
 * 絵の敵の駆け寄り・戻りの記録（脚の並び）を作り、時計からの横のずれと跳ねの高さを求める。
 * 行き先の x の式と、駆け寄りの進み方・跳ねの式はここだけに置く。描画も状態の変更もしない。
 */

import { DASH_STYLES } from './battleAnimConfig.js';
import { easeInOutQuad } from './easing.js';
import { frontTroopX } from './troopRoster.js';

/**
 * 駆け寄り・戻りの1区間（脚）。横のずれ `dx` は絵の元の位置からの右向きの距離（px。左へ行くと負）。
 * @typedef {Object} DashLeg
 * @property {number} start 脚の始まりの時刻（ms）
 * @property {number} end 脚の終わりの時刻（ms）
 * @property {number} fromDx 元の横のずれ
 * @property {number} toDx 先の横のずれ
 * @property {number} hops 跳ねの回数
 * @property {number} hopHeight 跳ねの高さ（px）
 * @property {number|null} power 進み具合の累乗（null なら `easeInOutQuad`）
 */

/**
 * 絵の駆け寄りの記録。
 * @typedef {Object} FigureDash
 * @property {DashLeg[]} legs 脚の並び（時刻の昇順）
 * @property {number} dx 作るときだけ使う。最後の脚の終わりの横のずれ（いま駆け寄っている位置）
 */

/**
 * 時計からの駆け寄りの見た目の入れ物（`sampleFigureDash` が書き込む）。
 * @typedef {Object} FigureDashLook
 * @property {number} dx 横のずれ（px）
 * @property {number} lift 跳ねの持ち上がり（px。上向きが正）
 */

/**
 * 行き先の名前 → 絵の左の縁が着く x を求める関数の表。
 * `castle` は城に当たる位置、`defense` は一番前の防御の兵の右（兵がいなければ `castle`）。
 * @type {Readonly<Record<string, function(import('./troopRoster.js').TroopRoster): number>>}
 */
const DASH_TARGETS = Object.freeze({
  castle: (roster) => roster.layout.castleHitX,
  defense: (roster) => {
    const x = frontTroopX(roster, 'defense');
    return x === null ? DASH_TARGETS.castle(roster) : x + roster.layout.contactGap;
  },
});

/**
 * 見せ方の名前から値を引く。
 * @param {string} style 見せ方の名前
 * @returns {Readonly<import('./battleAnimConfig.js').DashStyle>}
 * @throws {Error} 未知の名前のとき
 */
function styleOf(style) {
  if (!Object.prototype.hasOwnProperty.call(DASH_STYLES, style)) {
    throw new Error(`figureDash: 未知の駆け寄りの見せ方 ${style}`);
  }
  return DASH_STYLES[style];
}

/**
 * 駆け寄りの記録を作る（脚はまだない）。
 * @returns {FigureDash}
 */
export function createFigureDash() {
  return { legs: [], dx: 0 };
}

/**
 * 駆け寄りの脚を足す。
 * @param {FigureDash} dash 記録
 * @param {number} start 始まりの時刻（ms）
 * @param {number} duration 長さ（ms）
 * @param {number} toDx 先の横のずれ
 * @param {number} hops 跳ねの回数
 * @param {number} hopHeight 跳ねの高さ（px）
 * @param {number|null} power 進み具合の累乗（null なら戻りの進み方）
 * @returns {number} 脚の長さ（ms）
 */
function addDashLeg(dash, start, duration, toDx, hops, hopHeight, power) {
  dash.legs.push({ start, end: start + duration, fromDx: dash.dx, toDx, hops, hopHeight, power });
  dash.dx = toDx;
  return duration;
}

/**
 * 絵を行き先へ駆け寄らせる脚を足す。絵の左の縁（`contactX`）が行き先の x に着く横のずれにする。
 * すでに駆け寄っている（最初の行きの後）ときの2本目は、短く詰める（`advanceMs`・`advanceHops`）。
 * @param {FigureDash} dash 記録
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿（行き先の防御の兵・城の位置を読む）
 * @param {number} contactX 絵の左の縁の x（駆け寄る前の位置。体の倍率をかけた値）
 * @param {string} to 行き先の名前（`castle`・`defense`）
 * @param {string} style 見せ方の名前（`DASH_STYLES` の項目名）
 * @param {number} t 段の始め（ms）
 * @returns {number} 段の長さ（ms）
 * @throws {Error} 未知の行き先・見せ方のとき
 */
export function dashForward(dash, roster, contactX, to, style, t) {
  if (!Object.prototype.hasOwnProperty.call(DASH_TARGETS, to)) {
    throw new Error(`figureDash: 未知の駆け寄りの行き先 ${to}`);
  }
  const s = styleOf(style);
  const toDx = DASH_TARGETS[to](roster) - contactX;
  const last = dash.legs.length > 0 ? dash.legs[dash.legs.length - 1] : null;
  const advancing = last !== null && last.power !== null;
  return advancing
    ? addDashLeg(dash, t, s.advanceMs, toDx, s.advanceHops, s.hopHeight, s.power)
    : addDashLeg(dash, t, s.goMs, toDx, s.hops, s.hopHeight, s.power);
}

/**
 * 絵を元の位置へ戻す脚を足す。
 * @param {FigureDash} dash 記録
 * @param {string} style 見せ方の名前（`DASH_STYLES` の項目名）
 * @param {number} t 段の始め（ms）
 * @returns {number} 段の長さ（ms）
 * @throws {Error} 未知の見せ方のとき
 */
export function dashBack(dash, style, t) {
  const s = styleOf(style);
  return addDashLeg(dash, t, s.backMs, 0, s.backHops, s.hopHeight, null);
}

/**
 * 時計からの横のずれ・跳ねの高さを `out` に書き込む（オブジェクトを作らない）。
 * 脚の間（段の隙間）は直前の脚の先のまま。最初の脚の前は 0。
 * @param {FigureDash} dash 記録
 * @param {number} clock 時計の値（ms）
 * @param {FigureDashLook} out 書き込み先
 * @returns {void}
 */
export function sampleFigureDash(dash, clock, out) {
  out.dx = 0;
  out.lift = 0;
  for (let i = dash.legs.length - 1; i >= 0; i--) {
    const leg = dash.legs[i];
    if (clock < leg.start) continue;
    if (clock >= leg.end) {
      out.dx = leg.toDx;
      return;
    }
    const u = (clock - leg.start) / (leg.end - leg.start);
    const p = leg.power === null ? easeInOutQuad(u) : Math.pow(u, leg.power);
    out.dx = leg.fromDx + (leg.toDx - leg.fromDx) * p;
    out.lift = leg.hops > 0 ? leg.hopHeight * Math.abs(Math.sin(Math.PI * leg.hops * u)) : 0;
    return;
  }
}
