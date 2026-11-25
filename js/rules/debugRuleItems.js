/**
 * 責務: DEBUG タブで変えられるルールの値の項目の表（RULE_ITEMS）を、`RULES` の形から城と敵の順番・行動の決まりの種類ごとに組み立てて持つ。
 * 状態を持たない純粋な表と引く関数（ルール層）。
 */

import { RULES } from './config.js';

/**
 * DEBUG タブで変えられるルールの値の項目。
 * @typedef {Object} RuleItem
 * @property {string} id 識別子（例 'castle.maxHp'、'goblins.attack.min'）。
 * @property {string} group 組（'castle' か敵の種類の識別子）。
 * @property {string} kind 値の種類（'castleMaxHp'|'enemyMaxHp'|'armor'|'amount'|'chance'|'cycleLength'|'burn'）。
 * @property {string} name 項目の名前の識別子（DEBUG タブが文字を引く）。
 * @property {string} timing 今の敵（城）のときに効く時期（'now'|'nextIntent'|'nextCycle'|'nextBattle'）。
 * @property {string|null} pairId 最小と最大の組の相手の id（組でなければ null）。
 * @property {'min'|'max'|null} side 組の中で自分が最小か最大か（組でなければ null）。
 * @property {(config: any) => number} get 設定から値を読む。
 * @property {(config: any, value: number) => void} set 設定の値を書く（写しにだけ使う）。
 */

/**
 * 項目を作る（凍結して返す）。
 * @param {string} id 識別子
 * @param {string} group 組
 * @param {string} kind 値の種類
 * @param {string} name 項目の名前の識別子
 * @param {string} timing 効く時期
 * @param {string|null} pairId 組の相手の id
 * @param {'min'|'max'|null} side 組の中の側
 * @param {(config: any) => number} get 読む関数
 * @param {(config: any, value: number) => void} set 書く関数
 * @returns {Readonly<RuleItem>} 項目
 */
function item(id, group, kind, name, timing, pairId, side, get, set) {
  return Object.freeze({ id, group, kind, name, timing, pairId, side, get, set });
}

/**
 * 最小と最大の組の2項目を作る。
 * @param {string} baseId 'T.xxx' の部分（'.min'・'.max' を足して id にする）
 * @param {string} group 組
 * @param {string} baseName 項目の名前の前半（'attack' なら 'attackMin'・'attackMax'）
 * @param {string} kind 値の種類
 * @param {(config: any) => { min: number, max: number }} rangeOf 設定から範囲のオブジェクトを引く
 * @returns {Readonly<RuleItem>[]} [最小, 最大]
 */
function rangeItems(baseId, group, baseName, kind, rangeOf) {
  const minId = `${baseId}.min`;
  const maxId = `${baseId}.max`;
  return [
    item(minId, group, kind, `${baseName}Min`, 'nextIntent', maxId, 'min',
      (c) => rangeOf(c).min, (c, v) => { rangeOf(c).min = v; }),
    item(maxId, group, kind, `${baseName}Max`, 'nextIntent', minId, 'max',
      (c) => rangeOf(c).max, (c, v) => { rangeOf(c).max = v; }),
  ];
}

/**
 * 行動の決まりの種類ごとの、敵の行動の項目（最大 HP・常時防御力より後）の組み立ての表。
 * @type {Readonly<Object<string, (typeId: string, behavior: any) => Readonly<RuleItem>[]>>}
 */
const BEHAVIOR_ITEMS = Object.freeze({
  steady: (typeId) => rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount',
    (c) => c.enemies[typeId].behavior.attackRange),
  cycle: (typeId, behavior) => {
    const items = [
      item(`${typeId}.cycleLength`, typeId, 'cycleLength', 'cycleLength', 'nextCycle', null, null,
        (c) => c.enemies[typeId].behavior.cycleLength,
        (c, v) => { c.enemies[typeId].behavior.cycleLength = v; }),
      ...rangeItems(`${typeId}.attack`, typeId, 'attack', 'amount', (c) => c.enemies[typeId].behavior.attackRange),
    ];
    if (behavior.attackHeal) {
      items.push(
        item(`${typeId}.heal.chance`, typeId, 'chance', 'healChance', 'nextBattle', null, null,
          (c) => c.enemies[typeId].behavior.attackHeal.chance,
          (c, v) => { c.enemies[typeId].behavior.attackHeal.chance = v; }),
        item(`${typeId}.heal.amount`, typeId, 'amount', 'healAmount', 'nextBattle', null, null,
          (c) => c.enemies[typeId].behavior.attackHeal.amount,
          (c, v) => { c.enemies[typeId].behavior.attackHeal.amount = v; }),
      );
    }
    return items;
  },
  inhale: (typeId) => [
    ...rangeItems(`${typeId}.claw`, typeId, 'claw', 'amount', (c) => c.enemies[typeId].behavior.claw.range),
    ...rangeItems(`${typeId}.breath`, typeId, 'breath', 'amount', (c) => c.enemies[typeId].behavior.breath.range),
    ...rangeItems(`${typeId}.burn`, typeId, 'burn', 'burn', (c) => c.enemies[typeId].behavior.breath.burn),
    item(`${typeId}.inhaleChance`, typeId, 'chance', 'inhaleChance', 'nextIntent', null, null,
      (c) => c.enemies[typeId].behavior.inhaleChance,
      (c, v) => { c.enemies[typeId].behavior.inhaleChance = v; }),
  ],
});

/**
 * 設定から項目の表を組み立てる（城 → enemyOrder の順の敵）。
 * @param {any} rules ルールの調整値
 * @returns {readonly Readonly<RuleItem>[]} 項目の並び
 * @throws {Error} 知らない行動の決まりの種類のとき
 */
function buildItems(rules) {
  const items = [
    item('castle.maxHp', 'castle', 'castleMaxHp', 'maxHp', 'now', null, null,
      (c) => c.castleMaxHp, (c, v) => { c.castleMaxHp = v; }),
  ];
  for (const typeId of rules.enemyOrder) {
    const behavior = rules.enemies[typeId].behavior;
    const build = BEHAVIOR_ITEMS[behavior.type];
    if (!build) throw new Error(`unknown enemy behavior type: ${behavior.type}`);
    items.push(
      item(`${typeId}.maxHp`, typeId, 'enemyMaxHp', 'maxHp', 'now', null, null,
        (c) => c.enemies[typeId].maxHp, (c, v) => { c.enemies[typeId].maxHp = v; }),
      item(`${typeId}.armor`, typeId, 'armor', 'armor', 'now', null, null,
        (c) => c.enemies[typeId].armor, (c, v) => { c.enemies[typeId].armor = v; }),
      ...build(typeId, behavior),
    );
  }
  return items;
}

/**
 * 変えられるルールの値の項目の並び（凍結。城 → 敵の順）。
 * @type {readonly Readonly<RuleItem>[]}
 */
export const RULE_ITEMS = Object.freeze(buildItems(RULES));

/**
 * 識別子から項目を引く。
 * @param {string} id 項目の識別子
 * @returns {Readonly<RuleItem>|null} 項目。なければ null
 */
export function ruleItemById(id) {
  return RULE_ITEMS.find((it) => it.id === id) ?? null;
}
