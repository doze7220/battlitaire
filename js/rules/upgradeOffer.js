/**
 * 3択の候補の抽選（枠 → 枠の中の強化 → 足りなければ埋める → 値）と、候補の形の確かめ（ルール層。渡された乱数だけを使う）。
 */

import { effectOf } from './upgradeEffects.js';
import { upgradeIds, upgradeSpecOf, upgradeTakenOf } from './upgrades.js';

/**
 * 3択の候補1つ。
 * @typedef {Object} UpgradeChoice
 * @property {string} id 強化の種類の識別子。
 * @property {number} value 取ったときの値（3択が出たときに決まる）。
 */

/**
 * 3択の候補の一式。
 * @typedef {Object} UpgradeOffer
 * @property {UpgradeChoice[]} choices 候補（同じ強化は2つ出ない）。
 * @property {'stage'|'planning'} next 選んだ後の行き先（'stage'＝次のステージ、'planning'＝今の段取りへ戻る）。
 */

/**
 * 重みから1つ選ぶ。`random()` は必ず1回呼ぶ。`r = random() × 合計` から重みを順に引き、負になった番号を返す（端は最後の番号）。
 * @param {number[]} weights 重みの並び（1つ以上）
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {number} 選んだ番号
 */
export function pickWeighted(weights, random) {
  let total = 0;
  for (const w of weights) total += w;
  let r = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * 3択の候補を抽選する。乱数の順: 枠（1つにつき1回）→ 枠の中の強化（1つにつき1回）→ 足りなければ埋める（1つにつき1回）→ 値（効き方の `roll`）。
 * @param {{ upgrades: Object, upgradeSlots: Object<string, number>, upgradeChoiceCount: number }} config ルールの設定
 * @param {import('./upgrades.js').UpgradeState} state 取った強化の状態
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {UpgradeChoice[]} 候補（0〜`upgradeChoiceCount` 個。同じ強化は重ならない）
 */
export function drawUpgradeChoices(config, state, random) {
  const n = config.upgradeChoiceCount;
  const offerable = upgradeIds(config).filter((id) => {
    const spec = upgradeSpecOf(config, id);
    return spec.weight > 0 && effectOf(spec).canOffer(spec, upgradeTakenOf(state, id));
  });
  const slots = Object.keys(config.upgradeSlots).filter(
    (slot) =>
      config.upgradeSlots[slot] > 0 && offerable.some((id) => upgradeSpecOf(config, id).slot === slot),
  );
  /** @type {string[]} */
  const picked = [];
  const slotPool = [...slots];
  const slotOrder = [];
  while (slotOrder.length < Math.min(n, slots.length)) {
    const i = pickWeighted(slotPool.map((s) => config.upgradeSlots[s]), random);
    slotOrder.push(slotPool[i]);
    slotPool.splice(i, 1);
  }
  for (const slot of slotOrder) {
    const pool = offerable.filter((id) => upgradeSpecOf(config, id).slot === slot);
    picked.push(pool[pickWeighted(pool.map((id) => upgradeSpecOf(config, id).weight), random)]);
  }
  while (picked.length < n) {
    const pool = offerable.filter(
      (id) => !picked.includes(id) && slots.includes(upgradeSpecOf(config, id).slot),
    );
    if (pool.length === 0) break;
    picked.push(pool[pickWeighted(pool.map((id) => upgradeSpecOf(config, id).weight), random)]);
  }
  return picked.map((id) => {
    const spec = upgradeSpecOf(config, id);
    return { id, value: effectOf(spec).roll(spec, random) };
  });
}

/**
 * 値が3択の候補の一式の形か確かめる（例外を投げない）。
 * @param {unknown} value 確かめる値
 * @param {{ upgrades: Object, upgradeChoiceCount: number }} config ルールの設定
 * @returns {boolean} 形が合えば true
 */
export function isUpgradeOffer(value, config) {
  if (typeof value !== 'object' || value === null) return false;
  if (value.next !== 'stage' && value.next !== 'planning') return false;
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length > config.upgradeChoiceCount) return false;
  const seen = new Set();
  for (const c of choices) {
    if (typeof c !== 'object' || c === null) return false;
    if (typeof c.id !== 'string' || !Object.hasOwn(config.upgrades, c.id) || seen.has(c.id)) return false;
    if (!Number.isInteger(c.value) || c.value < 0) return false;
    seen.add(c.id);
  }
  return true;
}
