/**
 * 責務: デバッグのゲームが使うルールの値の写しを作り、その値の問い合わせと、変える・元に戻す操作（すぐ効く値は城・今の敵に効かせる）を持つ。
 * 段取り中で、写しを使うゲームだけに効く（ルール層）。
 */

import { RULES } from './config.js';
import { RULE_ITEMS, ruleItemById } from './debugRuleItems.js';
import { fitPartsToMax } from './enemyParts.js';
import { castleMaxHpBonus } from './upgrades.js';
import { grownMaxHp } from './stageBonus.js';
import { unitPointsOf } from './unitPoints.js';

/**
 * プレーンなオブジェクトと配列だけを再帰で深く写す（凍結は引き継がない）。
 * @param {any} value 写す値
 * @returns {any} 写し
 */
function copyPlain(value) {
  if (Array.isArray(value)) return value.map(copyPlain);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) out[key] = copyPlain(value[key]);
    return out;
  }
  return value;
}

/**
 * `RULES` と同じ形の、凍結していない写しを作る。
 * @returns {any} ルールの値の写し
 */
export function createDebugRules() {
  return copyPlain(RULES);
}

/**
 * 値を変えてよいゲームか（写しを使うゲームで、段取り中）。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 変えてよいなら true
 */
function isTunable(game) {
  return game.config !== RULES && game.stage === 'planning';
}

/**
 * 値の種類ごとの、値の確かめ方の表。
 * @type {Readonly<Object<string, (v: number) => boolean>>}
 */
const VALIDATORS = Object.freeze({
  castleMaxHp: (v) => Number.isInteger(v) && v >= 1,
  enemyMaxHp: (v) => Number.isInteger(v) && v >= 1,
  cycleLength: (v) => Number.isInteger(v) && v >= 1,
  chargeTurns: (v) => Number.isInteger(v) && v >= 1,
  defense: (v) => Number.isInteger(v) && v >= 0,
  amount: (v) => Number.isInteger(v) && v >= 0,
  burn: (v) => Number.isInteger(v) && v >= 0,
  chance: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1,
  percent: (v) => Number.isInteger(v) && v >= 0 && v <= 100,
});

/**
 * 値が項目の種類に合うか。
 * @param {string} kind 値の種類
 * @param {any} value 値
 * @returns {boolean} 合えば true
 */
function isValidValue(kind, value) {
  const check = VALIDATORS[kind];
  return !!check && check(value);
}

/**
 * すぐ効く値を、城・今の敵の状態に効かせる（城の最大 HP は強化で増えた分を足す。敵の最大 HP は今のステージの加算後。今の HP は上げず、超えるときだけ下げる。親と子を持つ敵は、親と子の HP を新しい最大に合わせ、HP は合計にする）。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {import('./debugRuleItems.js').RuleItem} item 項目
 * @returns {void}
 */
function applyNow(game, item) {
  if (item.timing !== 'now') return;
  const value = item.get(game.config);
  if (item.kind === 'castleMaxHp') {
    const maxHp = value + castleMaxHpBonus(game.config, game.upgrades);
    game.castle.maxHp = maxHp;
    if (game.castle.hp > maxHp) game.castle.hp = maxHp;
    return;
  }
  if (item.group !== game.enemy.typeId) return;
  if (item.kind === 'enemyMaxHp') {
    const grown = grownMaxHp(value, game.stageBonus(), unitPointsOf(game.config.enemies[item.group]));
    game.enemy.maxHp = grown;
    const brood = game.config.enemies[item.group].brood;
    if (brood && game.enemy.parts) {
      game.enemy.parts = fitPartsToMax(brood, grown, game.enemy.parts);
      game.enemy.hp = game.enemy.parts.parent + game.enemy.parts.child;
      return;
    }
    if (game.enemy.hp > grown) game.enemy.hp = grown;
  }
}

/**
 * 組の並びを答える（城 → 敵の順）。
 * @param {any} config ルールの設定（写し）
 * @returns {{ group: string, enemyName: string|null, itemIds: string[] }[]} 組の並び
 */
export function ruleGroups(config) {
  const groups = [];
  for (const it of RULE_ITEMS) {
    let g = groups.find((x) => x.group === it.group);
    if (!g) {
      g = {
        group: it.group,
        enemyName: it.group === 'castle' ? null : config.enemies[it.group].name,
        itemIds: [],
      };
      groups.push(g);
    }
    g.itemIds.push(it.id);
  }
  return groups;
}

/**
 * 項目の種類と名前を答える。
 * @param {string} id 項目の識別子
 * @returns {{ kind: string, name: string, unit: number|null }|null} `unit` は1体のポイントの刻み（量の項目以外は null）。知らない id は null
 */
export function ruleItemInfo(id) {
  const it = ruleItemById(id);
  return it ? { kind: it.kind, name: it.name, unit: it.unit } : null;
}

/**
 * ゲームの設定から項目の値を読む。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} id 項目の識別子
 * @returns {number|null} 値。知らない id は null
 */
export function ruleValue(game, id) {
  const it = ruleItemById(id);
  return it ? it.get(game.config) : null;
}

/**
 * 項目がいつから効くかを答える。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} id 項目の識別子
 * @returns {string|null} 'now'|'nextIntent'|'nextCycle'|'nextCharge'|'nextBattle'|'onAppear'。知らない id は null
 */
export function ruleTiming(game, id) {
  const it = ruleItemById(id);
  if (!it) return null;
  if (it.group !== 'castle' && it.group !== game.enemy.typeId) return 'onAppear';
  return it.timing;
}

/**
 * ルールの値を変える。組の決まり（最小 ≤ 最大）を守り、すぐ効く値は効かせる。
 * 項目に1体のポイントの刻み（`unit`）があるときは、その倍数でない値は変えない。
 * @param {import('./Game.js').Game} game ゲーム
 * @param {string} id 項目の識別子
 * @param {number} value 新しい値
 * @returns {boolean} 変えたら true
 */
export function setRuleValue(game, id, value) {
  if (!isTunable(game)) return false;
  const item = ruleItemById(id);
  if (!item) return false;
  if (!isValidValue(item.kind, value)) return false;
  if (item.unit !== null && value % item.unit !== 0) return false;
  if (item.get(game.config) === value) return false;
  item.set(game.config, value);
  const pair = item.pairId ? ruleItemById(item.pairId) : null;
  if (pair) {
    const other = pair.get(game.config);
    if ((item.side === 'min' && value > other) || (item.side === 'max' && value < other)) {
      pair.set(game.config, value);
    }
  }
  applyNow(game, item);
  return true;
}

/**
 * 全部の項目を `RULES` の値に戻し、すぐ効く値を今の状態に効かせる。
 * @param {import('./Game.js').Game} game ゲーム
 * @returns {boolean} 戻したら true（条件外は false）
 */
export function resetRuleValues(game) {
  if (!isTunable(game)) return false;
  for (const it of RULE_ITEMS) it.set(game.config, it.get(RULES));
  for (const it of RULE_ITEMS) applyNow(game, it);
  return true;
}
