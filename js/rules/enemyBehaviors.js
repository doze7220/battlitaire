/**
 * 責務: 敵の行動の決まり（種類ごとの状態の初期値と次の行動の決め方）の表と呼び分け。渡された乱数だけを使う純粋な関数（ルール層）。
 */

/**
 * 重みによって行動を1つ選ぶ。`random()` は1回だけ呼ぶ。
 * @param {ReadonlyArray<{ kind: string, amount: number, weight: number }>} actions 行動の種類ごとの量と重み
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {import('./combatants.js').EnemyAction} 新しい行動オブジェクト（重みは含まない）
 */
export function pickWeighted(actions, random) {
  const total = actions.reduce((sum, spec) => sum + spec.weight, 0);
  const r = random() * total;
  let acc = 0;
  for (const spec of actions) {
    acc += spec.weight;
    if (acc > r) return { kind: spec.kind, amount: spec.amount };
  }
  const last = actions[actions.length - 1];
  return { kind: last.kind, amount: last.amount };
}

/**
 * 行動の決まりの種類ごとの、状態の初期値と次の行動の決め方の表。
 * @type {Readonly<Object<string, {
 *   initialState: (behavior: any) => object,
 *   planNext: (behavior: any, state: object, random: () => number) => { action: import('./combatants.js').EnemyAction, state: object }
 * }>>}
 */
const BEHAVIORS = Object.freeze({
  weighted: Object.freeze({
    initialState: () => ({}),
    planNext: (behavior, state, random) => ({
      action: pickWeighted(behavior.actions, random),
      state,
    }),
  }),
});

/**
 * 種類に対応する決まりの実装を引く。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {{ initialState: Function, planNext: Function }} 決まりの実装
 * @throws {Error} 未知の種類のとき
 */
function lookupBehavior(behavior) {
  const impl = BEHAVIORS[behavior.type];
  if (!impl) throw new Error(`unknown enemy behavior type: ${behavior.type}`);
  return impl;
}

/**
 * 行動の決まりの状態の初期値を作る。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {object} 決まりの状態の初期値
 * @throws {Error} 未知の種類のとき
 */
export function createBehaviorState(behavior) {
  return lookupBehavior(behavior).initialState(behavior);
}

/**
 * 次の行動を決める。引数の状態は書き換えず、新しい状態を返す。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {{ action: import('./combatants.js').EnemyAction, state: object }} 次の行動と、次の決まりの状態
 * @throws {Error} 未知の種類のとき
 */
export function planBehaviorAction(behavior, state, random) {
  return lookupBehavior(behavior).planNext(behavior, state, random);
}
