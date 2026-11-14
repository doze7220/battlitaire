/**
 * 責務: 敵の行動の決まり（種類ごとの状態の初期値・次の行動の決め方・攻防後の状態・数え下ろしとチャージの問い合わせ）の表と呼び分け、攻撃の直後の回復の抽選。
 * 渡された乱数だけを使う純粋な関数（ルール層）。
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
 * 行動の決まりの種類ごとの、状態の初期値・次の行動の決め方・数え下ろしの問い合わせの表。
 * settle は行動の攻防が行われた後の状態、charge はブレスチャージの問い合わせ（持たない決まりは null）。
 * @type {Readonly<Object<string, {
 *   initialState: (behavior: any) => object,
 *   planNext: (behavior: any, state: object, random: () => number) => { action: import('./combatants.js').EnemyAction, state: object },
 *   settle: (behavior: any, state: object, action: import('./combatants.js').EnemyAction) => object,
 *   charge: (behavior: any, state: object) => { current: number, max: number }|null,
 *   countdown: (behavior: any, state: object) => number|null
 * }>>}
 */
const BEHAVIORS = Object.freeze({
  weighted: Object.freeze({
    initialState: () => ({}),
    planNext: (behavior, state, random) => ({
      action: pickWeighted(behavior.actions, random),
      state,
    }),
    settle: (behavior, state) => state,
    charge: () => null,
    countdown: () => null,
  }),
  cycle: Object.freeze({
    initialState: () => ({ countdown: null }),
    planNext: (behavior, state) => {
      const countdown =
        state.countdown === null || state.countdown <= 0 ? behavior.cycleLength - 1 : state.countdown - 1;
      const action =
        countdown === 0 ? { kind: 'attack', amount: behavior.attack } : { kind: 'windup', amount: 0 };
      return { action, state: { countdown } };
    },
    settle: (behavior, state) => state,
    charge: () => null,
    countdown: (behavior, state) => state.countdown,
  }),
  charge: Object.freeze({
    initialState: () => ({ charge: 0 }),
    planNext: (behavior, state, random) => {
      const claw = { kind: 'attack', amount: behavior.claw.amount, variant: 'claw' };
      if (state.charge < behavior.chargeMax) return { action: claw, state };
      if (random() < behavior.breathChance) {
        const action = {
          kind: 'attack',
          amount: behavior.breath.amount,
          variant: 'breath',
          burn: behavior.breath.burn,
        };
        return { action, state };
      }
      return { action: claw, state };
    },
    settle: (behavior, state, action) => {
      if (action.variant === 'claw') return { charge: Math.min(state.charge + 1, behavior.chargeMax) };
      if (action.variant === 'breath') return { charge: 0 };
      return state;
    },
    charge: (behavior, state) => ({ current: state.charge, max: behavior.chargeMax }),
    countdown: () => null,
  }),
});

/**
 * 種類に対応する決まりの実装を引く。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {{ initialState: Function, planNext: Function, settle: Function, charge: Function, countdown: Function }} 決まりの実装
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

/**
 * いまのフェーズの攻撃までの残りフェーズ数を答える（0 は攻撃するフェーズ）。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @returns {number|null} 残りフェーズ数。数え下ろしを持たない決まりは null
 * @throws {Error} 未知の種類のとき
 */
export function behaviorCountdown(behavior, state) {
  return lookupBehavior(behavior).countdown(behavior, state);
}

/**
 * 行動の攻防が行われた後の決まりの状態を求める。引数の状態は書き換えず、新しい状態（または同じ状態）を返す。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @param {import('./combatants.js').EnemyAction} action 行われた敵の行動
 * @returns {object} 攻防の後の決まりの状態
 * @throws {Error} 未知の種類のとき
 */
export function settleBehaviorAction(behavior, state, action) {
  return lookupBehavior(behavior).settle(behavior, state, action);
}

/**
 * ブレスチャージの現在値と満ちる数を答える。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @returns {{ current: number, max: number }|null} チャージ。持たない決まりは null
 * @throws {Error} 未知の種類のとき
 */
export function behaviorCharge(behavior, state) {
  return lookupBehavior(behavior).charge(behavior, state);
}

/**
 * 攻撃の直後の回復の候補の量を抽選する。最大 HP での頭打ちは行わない（battle.js が行う）。
 * 攻撃以外の行動・回復の設定がない・量が 0 以下のときは乱数を呼ばず 0。それ以外は `random()` を1回だけ呼ぶ。
 * @param {{ attackHeal?: { chance: number, amount: number } }} behavior 行動の決まりの設定
 * @param {import('./combatants.js').EnemyAction} action このフェーズの敵の行動
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {number} 回復の候補の量（外れ・対象外は 0）
 */
export function rollAttackHeal(behavior, action, random) {
  const heal = behavior.attackHeal;
  if (action.kind !== 'attack' || !heal || heal.amount <= 0) return 0;
  return random() < heal.chance ? heal.amount : 0;
}
