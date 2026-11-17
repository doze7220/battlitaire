/**
 * 敵の側の兵（ゴブリン・炎）を画面の外・ドラゴンの口から陣地の家へ出すことと、飛ぶもののない打撃の時刻（式はここだけ）と、
 * 当たった防御の兵・城のヒットマークの記録を作る。描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { campSlot } from './campSlots.js';
import { addHitMark } from './hitMarks.js';
import { enterTroops, popTroops, staggerDelay } from './troopRoster.js';

/**
 * 出る場所の名前 → 出る位置（x と足元の y。y が null なら兵ごとの家の y）を求める関数の表。
 * @type {Readonly<Record<string, function(import('./troopRoster.js').TroopRoster, import('../view/layout.js').BattleLayout, string): {x: number, y: number|null}>>}
 */
const ENTRANCES = Object.freeze({
  offscreen: (roster) => ({ x: roster.layout.offscreenX, y: null }),
  mouth: (roster, battleLayout, typeId) => {
    const figures = battleLayout.enemyFigures;
    const figure = Object.prototype.hasOwnProperty.call(figures, typeId) ? figures[typeId] : null;
    if (figure === null || figure.mouth === null) {
      throw new Error(`enemyAttacks: 炎の出る口のない敵 ${typeId}`);
    }
    return { x: figure.mouth.x, y: figure.mouth.y };
  },
});

/**
 * 敵の側の兵を count 体、画面の外・口から陣地の家へ跳ねながら（炎は真っすぐ）動かして足す。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('../view/layout.js').BattleLayout} battleLayout 最上段の配置（口の位置を読む）
 * @param {string} typeId 敵の種類の識別子
 * @param {string} kind 兵の種類（enemy・enemyGuard・flame）
 * @param {string} from 出る場所（offscreen・mouth）
 * @param {number} count 人数
 * @param {number} t 出始める時刻（ms）
 * @returns {number} 全員が家に着く時刻（ms。count が 0 以下なら t）
 * @throws {Error} 未知の出る場所のとき・口のない敵から口を使うとき
 */
export function enterEnemyTroops(roster, battleLayout, typeId, kind, from, count, t) {
  const entrance = Object.prototype.hasOwnProperty.call(ENTRANCES, from) ? ENTRANCES[from] : null;
  if (entrance === null) throw new Error(`enemyAttacks: 未知の出る場所 ${from}`);
  const pos = entrance(roster, battleLayout, typeId);
  return enterTroops(roster, kind, count, pos.x, pos.y, t, BATTLE_ANIM.enterMs);
}

/**
 * 打撃が1つずつ当たる時刻（k 番目は t に前からの遅れを足す。打撃の時刻の式の1か所）。
 * @param {number} count 打撃の数
 * @param {number} t 段の始め（ms）
 * @returns {number[]} 時刻（ms）の昇順
 */
export function strikeTimes(count, t) {
  const { strikeStaggerMs, strikeStaggerMaxMs } = BATTLE_ANIM;
  const times = [];
  for (let k = 0; k < count; k++) {
    times.push(t + staggerDelay(k, count, strikeStaggerMs, strikeStaggerMaxMs));
  }
  return times;
}

/**
 * 前からの kind の兵を count 体、打撃の時刻に跳ねて落とし、その兵の体の中心にヒットマークを記録する。
 * @param {import('./troopRoster.js').TroopRoster} roster 名簿
 * @param {import('./hitMarks.js').HitMarkList} marks ヒットマークの記録（足す）
 * @param {string} kind 打たれる兵の種類
 * @param {number} count 打たれる数
 * @param {number} t 段の始め（ms）
 * @returns {number[]} 打たれた時刻（ms）の昇順
 * @throws {Error} 兵が足りないとき
 */
export function strikeTroops(roster, marks, kind, count, t) {
  const units = popTroops(roster, kind, strikeTimes(count, t));
  const hit = [];
  for (const unit of units) {
    addHitMark(marks, unit.end.x, unit.end.y - roster.layout.size / 2, unit.end.time);
    hit.push(unit.end.time);
  }
  return hit;
}

/**
 * 城の当たりの範囲の中へ、打撃の時刻ごとにヒットマークを1つずつ記録する。
 * @param {import('./hitMarks.js').HitMarkList} marks ヒットマークの記録（足す）
 * @param {import('../view/layout.js').Rect} area 城の当たりの範囲
 * @param {number} count 打撃の数
 * @param {number} t 段の始め（ms）
 * @returns {number[]} 打たれた時刻（ms）の昇順
 */
export function strikeCastle(marks, area, count, t) {
  const times = strikeTimes(count, t);
  for (let k = 0; k < times.length; k++) {
    const slot = campSlot(area, k);
    addHitMark(marks, slot.x, slot.y, times[k]);
  }
  return times;
}
