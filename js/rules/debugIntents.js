/**
 * 責務: 行動の決まりの種類ごとに、指定できる次の行動の識別子と、指定した行動からの行動・決まりの状態の作り方、今の予告がどれに当たるかを持つ。
 * 渡された乱数だけを使う純粋な関数（ルール層。デバッグ用）。
 */

import {
  steadyAttackAction,
  windupAction,
  cycleAttackAction,
  clawAction,
  breathAction,
  inhaleAction,
} from './enemyBehaviors.js';

/**
 * 決まりの種類ごとの、指定できる行動の表。
 * - `ids`: 指定できる行動の識別子の並び（毎回新しい配列）
 * - `plan`: 識別子から `{ action, state }` を作る（表にない識別子は Error）
 * - `chosen`: 今の予告に当たる識別子（当たるものがなければ null）
 * @type {Readonly<Object<string, {
 *   ids: (behavior: any) => string[],
 *   plan: (behavior: any, id: string, random: () => number) => { action: import('./combatants.js').EnemyAction, state: object },
 *   chosen: (behavior: any, intent: import('./combatants.js').EnemyAction) => string|null
 * }>>}
 */
const INTENT_TABLE = Object.freeze({
  steady: Object.freeze({
    ids: () => ['attackDefend'],
    plan: (behavior, id, random) => {
      if (id !== 'attackDefend') throw new Error(`unknown intent id: ${id}`);
      return { action: steadyAttackAction(behavior, random), state: {} };
    },
    chosen: () => 'attackDefend',
  }),
  cycle: Object.freeze({
    ids: (behavior) => {
      const ids = ['windup', 'attack'];
      if (behavior.attackHeal && behavior.attackHeal.amount > 0) ids.push('attackHeal');
      return ids;
    },
    plan: (behavior, id, random) => {
      if (id === 'windup') {
        return { action: windupAction(), state: { countdown: behavior.cycleLength - 1 } };
      }
      if (id === 'attack') {
        return { action: cycleAttackAction(behavior, random), state: { countdown: 0 } };
      }
      if (id === 'attackHeal') {
        return { action: { ...cycleAttackAction(behavior, random), sureHeal: true }, state: { countdown: 0 } };
      }
      throw new Error(`unknown intent id: ${id}`);
    },
    chosen: (behavior, intent) => {
      if (intent.kind === 'windup') return 'windup';
      return intent.sureHeal === true ? 'attackHeal' : 'attack';
    },
  }),
  inhale: Object.freeze({
    ids: () => ['claw', 'inhale', 'breath'],
    plan: (behavior, id, random) => {
      let action;
      if (id === 'claw') action = clawAction(behavior, random);
      else if (id === 'inhale') action = inhaleAction();
      else if (id === 'breath') action = breathAction(behavior, random);
      else throw new Error(`unknown intent id: ${id}`);
      return { action, state: { lastVariant: action.variant } };
    },
    chosen: (behavior, intent) => intent.variant ?? null,
  }),
});

/**
 * 決まりの種類に対応する表の項目を引く。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {{ ids: Function, plan: Function, chosen: Function }} 表の項目
 * @throws {Error} 未知の種類のとき
 */
function lookupIntent(behavior) {
  const impl = INTENT_TABLE[behavior.type];
  if (!impl) throw new Error(`unknown enemy behavior type: ${behavior.type}`);
  return impl;
}

/**
 * 指定できる次の行動の識別子の並びを返す。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {string[]} 識別子の並び（毎回新しい配列）
 * @throws {Error} 未知の種類のとき
 */
export function intentChoiceIds(behavior) {
  return lookupIntent(behavior).ids(behavior);
}

/**
 * 指定した行動から、行動と決まりの状態を作る。量の抽選は渡された乱数だけを使う。
 * 識別子は呼ぶ側が `intentChoiceIds` で確かめてから渡すこと。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {string} id 指定する行動の識別子
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {{ action: import('./combatants.js').EnemyAction, state: object }} 行動と、決まりの状態
 * @throws {Error} 未知の種類、または表にない識別子のとき
 */
export function planChosenIntent(behavior, id, random) {
  return lookupIntent(behavior).plan(behavior, id, random);
}

/**
 * 今の予告がどの識別子に当たるかを返す。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {import('./combatants.js').EnemyAction|null} intent 今の予告
 * @returns {string|null} 当たる識別子。予告が null、または当たるものがなければ null
 * @throws {Error} 未知の種類のとき
 */
export function chosenIntentOf(behavior, intent) {
  const impl = lookupIntent(behavior);
  if (intent === null) return null;
  return impl.chosen(behavior, intent);
}
