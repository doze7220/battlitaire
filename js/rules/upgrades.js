/**
 * 取った強化の状態（種類 → 回数と効いた量）の生成・問い合わせ・取る・外す、城の修理の量、取る前と後の値（ルール層。純粋な計算だけ）。
 */

import { effectOf } from './upgradeEffects.js';

/**
 * 取った強化の状態。取った種類だけが入る。
 * @typedef {Object<string, import('./upgradeEffects.js').UpgradeTaken>} UpgradeState
 */

/**
 * 城の修理の取る前と後。
 * @typedef {Object} RepairPreview
 * @property {number} amount 回復する量。
 * @property {number} before 修理の前の HP。
 * @property {number} after 修理の後の HP。
 */

/**
 * 取った強化がない状態を作る。
 * @returns {UpgradeState} 空の状態
 */
export function createUpgradeState() {
  return {};
}

/**
 * 強化の種類の識別子の一覧（設定に書いた順）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @returns {string[]} 識別子の並び
 */
export function upgradeIds(config) {
  return Object.keys(config.upgrades);
}

/**
 * 強化の種類の設定を引く。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {string} id 強化の種類の識別子
 * @returns {import('./config.js').UpgradeSpec} 設定
 * @throws {Error} 知らない識別子のとき
 */
export function upgradeSpecOf(config, id) {
  if (!Object.hasOwn(config.upgrades, id)) throw new Error(`unknown upgrade: ${id}`);
  return config.upgrades[id];
}

/**
 * ある種類の取った記録を返す（取っていなければ回数・量とも 0）。
 * @param {UpgradeState} state 取った強化の状態
 * @param {string} id 強化の種類の識別子
 * @returns {import('./upgradeEffects.js').UpgradeTaken} 記録の写し
 */
export function upgradeTakenOf(state, id) {
  const taken = Object.hasOwn(state, id) ? state[id] : null;
  return taken === null ? { count: 0, amount: 0 } : { count: taken.count, amount: taken.amount };
}

/**
 * 取った種類だけを、一覧の順に並べる。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {UpgradeState} state 取った強化の状態
 * @returns {{ id: string, count: number, amount: number }[]} 取った種類の並び
 */
export function takenUpgradeList(config, state) {
  const list = [];
  for (const id of upgradeIds(config)) {
    const taken = upgradeTakenOf(state, id);
    if (taken.count > 0) list.push({ id, count: taken.count, amount: taken.amount });
  }
  return list;
}

/**
 * 強化を1つ取る。`game.upgrades` を新しいオブジェクトにして回数と量を足し、効き方の `take` を呼ぶ。
 * @param {{ config: Object, upgrades: UpgradeState, castle: { hp: number, maxHp: number } }} game ゲーム
 * @param {string} id 強化の種類の識別子
 * @param {number} value 効いた量（0 以上の整数）
 * @throws {Error} 知らない識別子、または値が 0 以上の整数でないとき
 */
export function takeUpgrade(game, id, value) {
  const spec = upgradeSpecOf(game.config, id);
  if (!Number.isInteger(value) || value < 0) throw new Error(`invalid upgrade value: ${value}`);
  const before = upgradeTakenOf(game.upgrades, id);
  game.upgrades = { ...game.upgrades, [id]: { count: before.count + 1, amount: before.amount + value } };
  effectOf(spec).take(game, spec, value);
}

/**
 * 取った強化をすべて外す（DEBUG 用）。種類ごとに効き方の `untake` を呼び、状態を空にする。
 * @param {{ config: Object, upgrades: UpgradeState, castle: { hp: number, maxHp: number } }} game ゲーム
 */
export function clearUpgrades(game) {
  for (const id of upgradeIds(game.config)) {
    const taken = upgradeTakenOf(game.upgrades, id);
    if (taken.count > 0) {
      const spec = upgradeSpecOf(game.config, id);
      effectOf(spec).untake(game, spec, taken);
    }
  }
  game.upgrades = {};
}

/**
 * DEBUG の「+1」で取る値（乱数なし）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {string} id 強化の種類の識別子
 * @returns {number} 値
 */
export function fixedUpgradeValue(config, id) {
  const spec = upgradeSpecOf(config, id);
  return effectOf(spec).fixedValue(spec);
}

/**
 * 強化で城の最大 HP に足している量の合計。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {UpgradeState} state 取った強化の状態
 * @returns {number} 足している量
 */
export function castleMaxHpBonus(config, state) {
  let total = 0;
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    total += effectOf(spec).castleMaxHpBonus(spec, upgradeTakenOf(state, id));
  }
  return total;
}

/**
 * ターンの頭にゲージへ足す量（ゲージごとの合計。0 のゲージは入れない）。
 * @param {{ upgrades: Object }} config ルールの設定
 * @param {UpgradeState} state 取った強化の状態
 * @returns {Object<string, number>} ゲージの識別子 → 量
 */
export function turnGainsOf(config, state) {
  /** @type {Object<string, number>} */
  const gains = {};
  for (const id of upgradeIds(config)) {
    const spec = upgradeSpecOf(config, id);
    const part = effectOf(spec).turnGains(spec, upgradeTakenOf(state, id));
    for (const gauge of Object.keys(part)) {
      if (part[gauge] > 0) gains[gauge] = (gains[gauge] ?? 0) + part[gauge];
    }
  }
  return gains;
}

/**
 * 城を修理で戻す量（最大 HP の百分率を切り捨て、最大 HP で頭打ち。満タンなら 0）。
 * @param {{ hp: number, maxHp: number }} castle 城
 * @param {number} percent 戻す割合の百分率
 * @returns {number} 戻す量
 */
export function castleRepairAmount(castle, percent) {
  return Math.min(Math.floor((castle.maxHp * percent) / 100), castle.maxHp - castle.hp);
}

/**
 * 強化を取る前と後の値（状態は変えない）。
 * @param {{ config: Object, upgrades: UpgradeState, castle: { hp: number, maxHp: number } }} game ゲーム
 * @param {string} id 強化の種類の識別子
 * @param {number} value 取ったときの値
 * @returns {import('./upgradeEffects.js').UpgradePreview} 取る前と後
 */
export function upgradePreview(game, id, value) {
  const spec = upgradeSpecOf(game.config, id);
  return effectOf(spec).preview(game, spec, upgradeTakenOf(game.upgrades, id), value);
}

/**
 * 城の修理の量と前後の HP（状態は変えない）。
 * @param {{ hp: number, maxHp: number }} castle 城
 * @param {number} percent 戻す割合の百分率
 * @returns {RepairPreview} 修理の量と前後の HP
 */
export function castleRepairPreview(castle, percent) {
  const amount = castleRepairAmount(castle, percent);
  return { amount, before: castle.hp, after: castle.hp + amount };
}

/**
 * 値が取った強化の状態の形か確かめる（例外を投げない）。
 * @param {unknown} value 確かめる値
 * @param {{ upgrades: Object }} config ルールの設定
 * @returns {boolean} 形が合えば true
 */
export function isUpgradeState(value, config) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false;
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(config.upgrades, key)) return false;
    const taken = value[key];
    if (typeof taken !== 'object' || taken === null) return false;
    if (!Number.isInteger(taken.count) || taken.count < 1) return false;
    if (!Number.isInteger(taken.amount) || taken.amount < 0) return false;
  }
  return true;
}
