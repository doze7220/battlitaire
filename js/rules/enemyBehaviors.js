/**
 * 責務: 敵の行動の決まり（毎ターン攻撃だけを含む。種類ごとの状態の初期値・状態の形の確かめ・次の行動の決め方・数え下ろし・隙かの問い合わせ）の表と呼び分け、
 * 行動を作る小さな関数、行動の量の幅からの抽選、攻撃の直後の回復の抽選、親子の敵の局面ごとの行動。渡された乱数だけを使う純粋な関数（ルール層）。
 */

/**
 * 量の幅から、1体のポイント unit の倍数を1つ抽選する（幅の中の倍数から等確率）。`random()` は必ず1回呼ぶ。
 * min・max は整数で min ≤ max、かつ unit の倍数であること（設定の責任）。
 * 幅の中に倍数がないときは `ceil(min / unit) × unit` を返す。unit 1 では min・max を含む整数の等確率で、1体のポイントがない敵と同じ値になる。
 * @param {{ min: number, max: number }} range 量の幅
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（1 以上の整数。既定 1）
 * @returns {number} 抽選した量
 */
export function rollAmount(range, random, unit = 1) {
  const lo = Math.ceil(range.min / unit);
  const hi = Math.floor(range.max / unit);
  const count = Math.max(1, hi - lo + 1);
  return (lo + Math.floor(random() * count)) * unit;
}

/**
 * 振りかぶりの行動を作る（乱数は呼ばない）。
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function windupAction() {
  return { kind: 'windup', amount: 0 };
}

/**
 * 周期の決まり（巨人）の攻撃の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * @param {{ attackRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function cycleAttackAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.attackRange, random, unit) };
}

/**
 * 爪の攻撃の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * @param {{ claw: { range: { min: number, max: number } } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function clawAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.claw.range, random, unit), variant: 'claw' };
}

/**
 * ブレスの攻撃の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * 燃やす札の枚数の範囲は設定の写し（後から設定が変わっても予告は変わらない）。
 * @param {{ breath: { range: { min: number, max: number }, burn: { min: number, max: number } } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function breathAction(behavior, random, unit = 1) {
  return {
    kind: 'attack',
    amount: rollAmount(behavior.breath.range, random, unit),
    variant: 'breath',
    burn: { min: behavior.breath.burn.min, max: behavior.breath.burn.max },
  };
}

/**
 * 吸い込む（振りかぶりの一種）の行動を作る（乱数は呼ばない）。
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function inhaleAction() {
  return { kind: 'windup', amount: 0, variant: 'inhale' };
}

/**
 * ふつうの攻撃の行動を作る（毎ターン攻撃の決まり・溜めて大攻撃・攻撃か防御の決まりで共通）。量の抽選で `random()` を1回呼ぶ。
 * @param {{ attackRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function steadyAttackAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.attackRange, random, unit) };
}

/**
 * 溜める（振りかぶりの一種）の行動を作る（乱数は呼ばない）。
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function chargeAction() {
  return { kind: 'windup', amount: 0, variant: 'charge' };
}

/**
 * 大攻撃の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * @param {{ heavyRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function heavyAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.heavyRange, random, unit), variant: 'heavy' };
}

/**
 * 防御だけの行動を作る。防御の量（加算の前）の抽選で `random()` を1回呼ぶ。
 * @param {{ guardRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function guardAction(behavior, random, unit = 1) {
  return { kind: 'guard', amount: 0, guard: rollAmount(behavior.guardRange, random, unit) };
}

/**
 * 大防御（防御だけの行動の一種）を作る。防御の量（加算の前）の抽選で `random()` を1回呼ぶ。
 * @param {{ bigGuardRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1。1 では今と同じ値）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function bigGuardAction(behavior, random, unit = 1) {
  return { kind: 'guard', amount: 0, guard: rollAmount(behavior.bigGuardRange, random, unit), variant: 'bigGuard' };
}

/**
 * 「子どもたちを守る」（親子の敵の防御だけの行動）を作る。防御の量（加算の前）の抽選で `random()` を1回呼ぶ。
 * @param {{ protectRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function protectAction(behavior, random, unit = 1) {
  return { kind: 'guard', amount: 0, guard: rollAmount(behavior.protectRange, random, unit), variant: 'protect' };
}

/**
 * 怒った親の突進の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * @param {{ rushRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function rushAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.rushRange, random, unit), variant: 'rush' };
}

/**
 * 怒りを溜める（振りかぶりの一種）の行動を作る（乱数は呼ばない）。
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function rageAction() {
  return { kind: 'windup', amount: 0, variant: 'rage' };
}

/**
 * 大突進の行動を作る。量の抽選で `random()` を1回呼ぶ。
 * @param {{ bigRushRange: { min: number, max: number } }} behavior 行動の決まりの設定
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量はこの倍数。既定 1）
 * @returns {import('./combatants.js').EnemyAction} 新しい行動
 */
export function bigRushAction(behavior, random, unit = 1) {
  return { kind: 'attack', amount: rollAmount(behavior.bigRushRange, random, unit), variant: 'bigRush' };
}

/**
 * 値がプレーンなオブジェクト（`null`・配列・関数でない）か。
 * @param {unknown} value 調べる値
 * @returns {boolean} プレーンなオブジェクトなら true
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 親子の敵（`brood`）の、局面 → 次の行動の決め方の表。表にない局面（`null` など）は呼ぶ側が Error にする。
 * 各行は (設定, 状態, 乱数, 1体のポイント) から行動を返す。
 * - `together`（子がいる間）: 毎ターン乱数2回。`random() < protectChance` なら守る（量1回）、外れれば子の攻撃（量1回）。
 * - `enraged`（怒り）: 直前が `rage` なら大突進（1回）、直前が `bigRush` なら突進（1回）、それ以外は `random() < rageChance` なら怒りを溜める（抽選1回）、外れれば突進（抽選1回＋量1回）。
 * - `young`（子だけ）: 子の攻撃（量1回）。
 * @type {Readonly<Object<string, (behavior: any, state: { lastVariant: string|null }, random: () => number, unit: number) => import('./combatants.js').EnemyAction>>}
 */
const BROOD_PLANS = Object.freeze({
  together: (behavior, state, random, unit) =>
    random() < behavior.protectChance
      ? protectAction(behavior, random, unit)
      : steadyAttackAction(behavior, random, unit),
  enraged: (behavior, state, random, unit) => {
    if (state.lastVariant === 'rage') return bigRushAction(behavior, random, unit);
    if (state.lastVariant === 'bigRush') return rushAction(behavior, random, unit);
    if (random() < behavior.rageChance) return rageAction();
    return rushAction(behavior, random, unit);
  },
  young: (behavior, state, random, unit) => steadyAttackAction(behavior, random, unit),
});

/**
 * 行動の決まりの種類ごとの、状態の初期値・状態の形の確かめ（isState）・次の行動の決め方・数え下ろしの問い合わせ・隙かの問い合わせ（isOpening）の表。
 * 次の行動の決め方の最後の引数 `situation`（親子の敵の局面。親子でない敵は `null`）は `brood` だけが読む。
 * @type {Readonly<Object<string, {
 *   initialState: (behavior: any) => object,
 *   isState: (state: unknown) => boolean,
 *   planNext: (behavior: any, state: object, random: () => number, unit: number, situation?: string|null) => { action: import('./combatants.js').EnemyAction, state: object },
 *   countdown: (behavior: any, state: object) => number|null,
 *   isOpening: (action: import('./combatants.js').EnemyAction) => boolean
 * }>>}
 */
const BEHAVIORS = Object.freeze({
  steady: Object.freeze({
    initialState: () => ({}),
    isState: (state) => isPlainObject(state),
    planNext: (behavior, state, random, unit) => ({
      action: steadyAttackAction(behavior, random, unit),
      state,
    }),
    countdown: () => null,
    isOpening: () => false,
  }),
  /**
   * 毎ターン攻撃だけの決まり（防御しない）。乱数は量の抽選の1回だけ。状態は持たない・数え下ろしは持たない。
   * 隙はすべてのターン（防御は常に 0）。
   */
  assault: Object.freeze({
    initialState: () => ({}),
    isState: (state) => isPlainObject(state),
    planNext: (behavior, state, random, unit) => ({
      action: steadyAttackAction(behavior, random, unit),
      state,
    }),
    countdown: () => null,
    isOpening: () => true,
  }),
  cycle: Object.freeze({
    initialState: () => ({ countdown: null }),
    isState: (state) => isPlainObject(state) && Number.isInteger(state.countdown) && state.countdown >= 0,
    planNext: (behavior, state, random, unit) => {
      const countdown =
        state.countdown === null || state.countdown <= 0 ? behavior.cycleLength - 1 : state.countdown - 1;
      const action =
        countdown === 0
          ? cycleAttackAction(behavior, random, unit)
          : windupAction();
      return { action, state: { countdown } };
    },
    countdown: (behavior, state) => state.countdown,
    isOpening: (action) => action.kind === 'attack',
  }),
  inhale: Object.freeze({
    initialState: () => ({ lastVariant: null }),
    isState: (state) => isPlainObject(state) && ['claw', 'inhale', 'breath'].includes(state.lastVariant),
    planNext: (behavior, state, random, unit) => {
      let action;
      if (state.lastVariant === 'inhale') {
        action = breathAction(behavior, random, unit);
      } else if (state.lastVariant === 'breath') {
        action = clawAction(behavior, random, unit);
      } else if (random() < behavior.inhaleChance) {
        action = inhaleAction();
      } else {
        action = clawAction(behavior, random, unit);
      }
      return { action, state: { lastVariant: action.variant } };
    },
    countdown: () => null,
    isOpening: (action) => action.variant === 'inhale',
  }),
  buildup: Object.freeze({
    initialState: () => ({ turnsToHeavy: null, chargeTurns: 0 }),
    isState: (state) =>
      isPlainObject(state) &&
      (state.turnsToHeavy === null || (Number.isInteger(state.turnsToHeavy) && state.turnsToHeavy >= 0)) &&
      Number.isInteger(state.chargeTurns) &&
      state.chargeTurns >= 0,
    planNext: (behavior, state, random, unit) => {
      const idle = { turnsToHeavy: null, chargeTurns: 0 };
      if (state.turnsToHeavy !== null && state.turnsToHeavy >= 2) {
        return {
          action: chargeAction(),
          state: { turnsToHeavy: state.turnsToHeavy - 1, chargeTurns: state.chargeTurns },
        };
      }
      if (state.turnsToHeavy === 1) {
        return {
          action: heavyAction(behavior, random, unit),
          state: { turnsToHeavy: 0, chargeTurns: state.chargeTurns },
        };
      }
      if (state.turnsToHeavy === 0) {
        return { action: steadyAttackAction(behavior, random, unit), state: idle };
      }
      if (random() < behavior.chargeChance) {
        return {
          action: chargeAction(),
          state: { turnsToHeavy: behavior.chargeTurns, chargeTurns: behavior.chargeTurns },
        };
      }
      return { action: steadyAttackAction(behavior, random, unit), state: idle };
    },
    countdown: (behavior, state) =>
      state.chargeTurns >= 2 && state.turnsToHeavy !== null && state.turnsToHeavy >= 1 ? state.turnsToHeavy : null,
    isOpening: () => true,
  }),
  either: Object.freeze({
    initialState: () => ({}),
    isState: (state) => isPlainObject(state),
    planNext: (behavior, state, random, unit) => {
      let action;
      if (random() < behavior.attackChance) {
        action = steadyAttackAction(behavior, random, unit);
      } else if (random() < behavior.bigGuardChance) {
        action = bigGuardAction(behavior, random, unit);
      } else {
        action = guardAction(behavior, random, unit);
      }
      return { action, state };
    },
    countdown: () => null,
    isOpening: (action) => action.kind === 'attack',
  }),
  brood: Object.freeze({
    initialState: () => ({ lastVariant: null }),
    isState: (state) =>
      isPlainObject(state) && [null, 'protect', 'rush', 'rage', 'bigRush'].includes(state.lastVariant),
    planNext: (behavior, state, random, unit, situation = null) => {
      const plan = BROOD_PLANS[situation];
      if (!plan) throw new Error(`unknown brood situation: ${situation}`);
      const action = plan(behavior, state, random, unit);
      return { action, state: { lastVariant: action.variant ?? null } };
    },
    countdown: () => null,
    isOpening: (action) => action.kind !== 'guard',
  }),
});

/**
 * 種類に対応する決まりの実装を引く。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @returns {{ initialState: Function, isState: Function, planNext: Function, countdown: Function, isOpening: Function }} 決まりの実装
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
 * 値が、その決まりの状態の形か（保存したデータの確かめ用。乱数は呼ばない）。
 * 決まりごと（steady・assault・either: プレーンなオブジェクト。cycle: `countdown` が 0 以上の整数。inhale: `lastVariant` が 'claw'・'inhale'・'breath'。
 * brood: `lastVariant` が null か 'protect'・'rush'・'rage'・'bigRush'。
 * buildup: `turnsToHeavy` が null か 0 以上の整数、`chargeTurns` が 0 以上の整数）。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {unknown} state 調べる値
 * @returns {boolean} 形が合えば true
 * @throws {Error} 未知の種類のとき
 */
export function isBehaviorState(behavior, state) {
  return lookupBehavior(behavior).isState(state);
}

/**
 * 次の行動を決める。引数の状態は書き換えず、新しい状態を返す。
 * 乱数の使い方は決まりごと（steady: 攻撃の量。assault: 攻撃の量。cycle: 攻撃のフェーズだけ量。inhale: ブレス・爪は量、それ以外は吸い込むの抽選→外れなら爪の量。
 * buildup: 溜めていないターンは溜める抽選1回（外れれば量1回が続く）・溜めの続きは0回・大攻撃は量1回・大攻撃の次は量1回。
 * either: 攻撃の抽選1回→当たれば量1回、外れれば大防御の抽選1回→量1回。
 * brood: 局面ごと（together: 毎ターン2回。enraged: 溜めの抽選のターンは溜める1回・突進2回、大突進1回、大突進の次の突進1回。young: 1回））。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @param {number} [unit] 1体のポイント（量の抽選の刻み。既定 1。乱数を呼ぶ順・回数は変わらない）
 * @param {'together'|'enraged'|'young'|null} [situation] 親子の敵の局面（`brood` だけが読む。ほかの決まりは無視する。既定 null）
 * @returns {{ action: import('./combatants.js').EnemyAction, state: object }} 次の行動と、次の決まりの状態
 * @throws {Error} 未知の種類のとき、`brood` で局面が表にない（null など）とき
 */
export function planBehaviorAction(behavior, state, random, unit = 1, situation = null) {
  return lookupBehavior(behavior).planNext(behavior, state, random, unit, situation);
}

/**
 * いまのフェーズの攻撃までの残りフェーズ数を答える（0 は攻撃するフェーズ）。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {object} state いまの決まりの状態
 * @returns {number|null} 残りフェーズ数。数え下ろしを持たない決まりは null（`buildup` も、溜めていないターン・大攻撃のターン・溜めが1ターンの敵では null）
 * @throws {Error} 未知の種類のとき
 */
export function behaviorCountdown(behavior, state) {
  return lookupBehavior(behavior).countdown(behavior, state);
}

/**
 * その行動が隙（敵が防御を張らないターン）かを答える（乱数は呼ばない）。
 * @param {{ type: string }} behavior 行動の決まりの設定
 * @param {import('./combatants.js').EnemyAction} action 敵の行動
 * @returns {boolean} 隙なら true
 * @throws {Error} 未知の種類のとき
 */
export function isOpeningAction(behavior, action) {
  return lookupBehavior(behavior).isOpening(action);
}

/**
 * 攻撃の直後の回復の候補の量を抽選する。最大 HP での頭打ちは行わない（battle.js が行う）。
 * 攻撃以外の行動・回復の設定がない・量が 0 以下のときは乱数を呼ばず 0。
 * 予告に `sureHeal: true`（デバッグの指定）があれば乱数を呼ばず回復の量を返す。それ以外は `random()` を1回だけ呼ぶ。
 * @param {{ attackHeal?: { chance: number, amount: number } }} behavior 行動の決まりの設定
 * @param {import('./combatants.js').EnemyAction} action このフェーズの敵の行動
 * @param {() => number} random 0以上1未満を返す乱数の関数
 * @returns {number} 回復の候補の量（外れ・対象外は 0）
 */
export function rollAttackHeal(behavior, action, random) {
  const heal = behavior.attackHeal;
  if (action.kind !== 'attack' || !heal || heal.amount <= 0) return 0;
  if (action.sureHeal === true) return heal.amount;
  return random() < heal.chance ? heal.amount : 0;
}
