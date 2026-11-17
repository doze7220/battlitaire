/**
 * 段の並びから、段の時刻・兵の名簿（1人＝1体）・HP の変化・数字の浮き出し・燃える札の記録・音のきっかけの時刻を組み立てて時間割にする。
 * きっかけの時刻の式はここだけにある。描画も状態の変更も行わない。
 * 段取りの間に待っていた自軍の兵の引き継ぎも行う。時間は BATTLE_ANIM、位置は TroopLayout・盤面の Layout から読む。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { createHpChange } from './hpTrack.js';
import { createPopTrack, popTrackEnd } from './popTrack.js';
import { burnCardOffsets, burnStepDuration, createBurnTracks } from './burnTrack.js';
import {
  chargeTo,
  clashPairs,
  createTroopRoster,
  enterCastle,
  fadeTroops,
  finishTroops,
  marchSquad,
  OWN_KINDS,
  rosterEndTime,
  rosterEndTimes,
  spawnTroops,
} from './troopRoster.js';
import { createTroopCounter } from './troopCounter.js';

/**
 * 時刻つきの段。BattleStep に start・end（ms）と、音のきっかけの時刻 cueTimes（絶対時刻 ms。なければ空）を足したもの。
 * @typedef {import('./battleSteps.js').BattleStep & {start: number, end: number, cueTimes: number[]}} TimedStep
 */

/**
 * 攻防の演出の時間割。
 * @typedef {Object} BattleTimeline
 * @property {TimedStep[]} steps 時刻つきの段
 * @property {import('./troopRoster.js').TroopRoster} roster 兵1体ずつの名簿
 * @property {import('./troopCounter.js').TroopCounter} troopCounter 攻撃・防御・修理の人数の表示値
 * @property {import('./hpTrack.js').HpChange[]} castleHpChanges 城の HP の表示値の変化
 * @property {import('./hpTrack.js').HpChange[]} enemyHpChanges 敵の HP の表示値の変化
 * @property {import('./popTrack.js').PopTrack[]} enemyHealPops 敵の回復の量の浮き出し
 * @property {import('./burnTrack.js').BurnTrack[]} burns 燃える札の記録（なければ空）
 * @property {number} castleHpStart 城の HP の表示値の初期値
 * @property {number} enemyHpStart 敵の HP の表示値の初期値
 * @property {number} endTime 演出の終わりの時刻（ms）。段がなければ 0
 */

/**
 * 組み立て中の状態。
 * @typedef {Object} BuildState
 * @property {import('./troopRoster.js').TroopRoster} roster 兵の名簿
 * @property {import('./hpTrack.js').HpChange[]} castleChanges 城の HP の変化
 * @property {import('./hpTrack.js').HpChange[]} enemyChanges 敵の HP の変化
 * @property {import('./popTrack.js').PopTrack[]} enemyHealPops 敵の回復の量の浮き出し
 * @property {number} castleShown 城の HP の今の表示値
 * @property {number} enemyShown 敵の HP の今の表示値
 * @property {import('./burnTrack.js').BurnTrack[]} burns 燃える札の記録
 * @property {boolean} frontFaded 敵兵の余りをすでに消し始めたか
 * @property {number[]} cueTimes いま組み立てている段の音のきっかけの時刻（絶対 ms。段ごとに空にして、builder が足す）
 * @property {import('../view/layout.js').Layout} boardLayout 盤面の配置（columnCardRects・discard だけ使う）
 */

/** 敵兵の余りを消し始める段（最初に来たもの）。 */
const FRONT_FADE_STEPS = new Set(['march', 'enemyBlock', 'armorBlock', 'enemyHit', 'heal', 'enemyHeal', 'burn']);

/**
 * 敵の守りが陣地に現れる段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addForm(state, step, t) {
  const T = BATTLE_ANIM;
  spawnTroops(state.roster, 'enemyGuard', step.enemyGuards ?? 0, t, T.formMs);
  return T.formMs;
}

/**
 * 敵兵が出て、防御の兵とぶつかる位置まで進む段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addEnemyMarch(state, step, t) {
  spawnTroops(state.roster, 'enemy', step.amount, t, 0);
  return marchSquad(state.roster, {
    kind: 'enemy',
    partnerKind: 'defense',
    pairs: step.pairs ?? 0,
    dir: -1,
    advanceX: state.roster.layout.enemyAdvanceX,
    t,
  });
}

/**
 * 相打ちの段の、ぶつかって落ち始める時刻。段の始め t と、組になる2体（相手が決まっていて、まだ終わっていない兵と、その相手）の
 * 行進が終わる時刻（freeAt）の遅い方。行進の段の長さには「遅れの広がり」が含まれるのでふつうは t のままだが、
 * 組の片方の行進が終わる前に落ちて2体の時刻がずれることがないよう、ここで必ず行進の後にそろえる。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} kind 落ちる側の種類
 * @param {number} t 段の始め（ms）
 * @returns {number} ぶつかる時刻（ms。t 以上）
 */
function clashStartOf(state, kind, t) {
  let start = t;
  for (const unit of state.roster.ranked[kind] ?? []) {
    const partner = unit.partner;
    if (unit.end !== null || partner === null || partner.end !== null) continue;
    start = Math.max(start, unit.freeAt, partner.freeAt);
  }
  return start;
}

/**
 * 相打ちの段。組になった2体が、双方の行進が終わった後に、跳ねて落ちる。きっかけは最初の組がぶつかる時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} kind 落ちる側の種類（'enemy'・'attack'）
 * @param {number} amount 相打ちの組の数
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addClash(state, kind, amount, t) {
  const start = clashStartOf(state, kind, t);
  const spread = clashPairs(state.roster, kind, amount, start);
  state.cueTimes.push(start);
  return start - t + spread + BATTLE_ANIM.clashMs;
}

/**
 * 敵兵・攻撃の兵が当たる位置へ進んで跳ねて落ち、HP の表示が減る段（城・敵で共通）。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} kind 当たる側の種類（'enemy'・'attack'）
 * @param {number} targetX 当たる位置の x
 * @param {'castle'|'enemy'} target 減る HP
 * @param {number} amount 減る量
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addHit(state, kind, targetX, target, amount, t) {
  const T = BATTLE_ANIM;
  const arrivals = chargeTo(state.roster, kind, Infinity, targetX, t, T.hitMoveMs);
  const first = arrivals.length > 0 ? arrivals[0] : t + T.hitMoveMs;
  const last = arrivals.length > 0 ? arrivals[arrivals.length - 1] : first;
  const hpDuration = Math.max(T.hpMs, last - first);
  if (target === 'castle') {
    const to = state.castleShown - amount;
    state.castleChanges.push(createHpChange({ from: state.castleShown, to, start: first, duration: hpDuration }));
    state.castleShown = to;
  } else {
    const to = state.enemyShown - amount;
    state.enemyChanges.push(createHpChange({ from: state.enemyShown, to, start: first, duration: hpDuration }));
    state.enemyShown = to;
  }
  state.cueTimes.push(first);
  return first + hpDuration - t;
}

/**
 * 攻撃の兵が出て、敵の守りとぶつかる位置まで進む段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addMarch(state, step, t) {
  return marchSquad(state.roster, {
    kind: 'attack',
    partnerKind: 'enemyGuard',
    pairs: step.pairs ?? 0,
    dir: 1,
    advanceX: state.roster.layout.attackAdvanceX,
    t,
  });
}

/**
 * 攻撃の兵が敵のシールドマークまで進み、当たって量だけ跳ねて落ちる段（常時防御力）。HP は変わらない。
 * きっかけは最初の兵が当たる位置に着いた時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addArmorBlock(state, step, t) {
  const T = BATTLE_ANIM;
  const arrivals = chargeTo(state.roster, 'attack', step.amount, state.roster.layout.armorHitX, t, T.hitMoveMs);
  const first = arrivals.length > 0 ? arrivals[0] : t + T.hitMoveMs;
  const last = arrivals.length > 0 ? arrivals[arrivals.length - 1] : first;
  state.cueTimes.push(first);
  return last - t + T.clashMs;
}

/**
 * 修理の兵が城へ入って消え、城の HP の表示が増える段。HP は1体目が着いた時刻から、量番目の兵が着いた時刻までかけて増える。
 * きっかけは最初の兵が城に入った時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addHeal(state, step, t) {
  const T = BATTLE_ANIM;
  const arrivals = enterCastle(state.roster, 'heal', t, T.healMoveMs);
  const first = arrivals.length > 0 ? arrivals[0] : t + T.healMoveMs;
  const last = arrivals.length > 0 ? arrivals[arrivals.length - 1] : first;
  const amountIndex = Math.min(step.amount, arrivals.length) - 1;
  const amountAt = amountIndex >= 0 ? arrivals[amountIndex] : first;
  const hpDuration = Math.max(T.hpMs, amountAt - first);
  const to = state.castleShown + step.amount;
  state.castleChanges.push(createHpChange({ from: state.castleShown, to, start: first, duration: hpDuration }));
  state.castleShown = to;
  state.cueTimes.push(first);
  return Math.max(first + hpDuration, last) - t;
}

/**
 * 巨人が回復し、敵の HP の表示が増えて、量が浮き出る段。きっかけは回復の時刻（`t + formMs`）。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addEnemyHeal(state, step, t) {
  const T = BATTLE_ANIM;
  state.enemyHealPops.push(
    createPopTrack(step.amount, [
      { time: t, alpha: 0 },
      { time: t + T.formMs, alpha: 1 },
      { time: t + T.formMs + T.hpMs, alpha: 1 },
      { time: t + T.formMs + T.hpMs + T.fadeMs, alpha: 0 },
    ]),
  );
  const to = state.enemyShown + step.amount;
  state.enemyChanges.push(createHpChange({ from: state.enemyShown, to, start: t + T.formMs, duration: T.hpMs }));
  state.enemyShown = to;
  state.cueTimes.push(t + T.formMs);
  return T.formMs + T.hpMs + T.fadeMs;
}

/**
 * 札が燃える段。1枚ごとの記録を作り、きっかけは1枚ごとの飛び立ちの時刻（式は `burnTrack.js` の `burnCardOffsets` だけにある）。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addBurn(state, step, t) {
  const burns = step.burns ?? [];
  state.burns.push(...createBurnTracks(burns, t, state.boardLayout));
  for (let k = 0; k < step.amount; k++) state.cueTimes.push(t + burnCardOffsets(k).fly);
  return burnStepDuration(burns.length);
}

/**
 * 段の種類ごとの組み立て。段の開始時刻を受け取り、段の長さを返す（きっかけの時刻は `state.cueTimes` に足す）。
 * @type {Object<string, (state: BuildState, step: import('./battleSteps.js').BattleStep, t: number) => number>}
 */
const STEP_BUILDERS = {
  form: addForm,
  enemyMarch: addEnemyMarch,
  block: (state, step, t) => addClash(state, 'enemy', step.amount, t),
  castleHit: (state, step, t) => addHit(state, 'enemy', state.roster.layout.castleHitX, 'castle', step.amount, t),
  march: addMarch,
  enemyBlock: (state, step, t) => addClash(state, 'attack', step.amount, t),
  armorBlock: addArmorBlock,
  enemyHit: (state, step, t) => addHit(state, 'attack', state.roster.layout.enemyHitX, 'enemy', step.amount, t),
  heal: addHeal,
  enemyHeal: addEnemyHeal,
  burn: addBurn,
};

/**
 * 段の始まりで、使われずに余った敵の側の兵を薄れて消し始める（自軍の余りは最後に城へ帰る）。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} type 段の種類
 * @param {number} t 段の開始時刻（ms）
 * @returns {void}
 */
function fadeLeftoversAtStart(state, type, t) {
  if (!state.frontFaded && FRONT_FADE_STEPS.has(type)) {
    state.frontFaded = true;
    fadeTroops(state.roster, 'enemy', t);
  }
  if (type === 'heal') {
    fadeTroops(state.roster, 'enemyGuard', t);
  }
}

/**
 * 段の並びから時間割を組み立てる。段取りの間に待っていた自軍の兵を、時刻 0 から同じ家に置く。
 * @param {import('./battleSteps.js').BattleStep[]} steps 段の並び
 * @param {import('./battleSteps.js').BattleSnapshot} before 攻防の前の値
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @param {import('../view/layout.js').Layout} boardLayout 盤面の配置（燃える札の位置に使う）
 * @param {{attack: number, defense: number, heal: number}} waiting 段取りの間に待っていた兵の数（家の番号は 0 から数−1。`before` の値と同じでなければ Error）
 * @returns {BattleTimeline} 時間割
 */
export function buildBattleTimeline(steps, before, troopLayout, boardLayout, waiting) {
  /** @type {BuildState} */
  const state = {
    roster: createTroopRoster(troopLayout),
    castleChanges: [],
    enemyChanges: [],
    enemyHealPops: [],
    castleShown: before.castleHp,
    enemyShown: before.enemyHp,
    burns: [],
    frontFaded: false,
    cueTimes: [],
    boardLayout,
  };
  let waitingTotal = 0;
  for (const kind of OWN_KINDS) {
    if (waiting[kind] !== before[kind]) {
      throw new Error(`buildBattleTimeline: 待っていた兵の数 ${kind}=${waiting[kind]} が攻防の前の値 ${before[kind]} と違います`);
    }
    spawnTroops(state.roster, kind, waiting[kind], 0, 0);
    waitingTotal += waiting[kind];
  }
  /** @type {TimedStep[]} */
  const timed = [];
  let t = 0;
  let stepEnd = 0;
  steps.forEach((step, index) => {
    const builder = STEP_BUILDERS[step.type];
    if (builder === undefined) throw new Error(`buildBattleTimeline: unknown step type ${step.type}`);
    if (index > 0) t += BATTLE_ANIM.stepGapMs;
    fadeLeftoversAtStart(state, step.type, t);
    state.cueTimes = [];
    const duration = builder(state, step, t);
    timed.push({ ...step, start: t, end: t + duration, cueTimes: state.cueTimes });
    t += duration;
    stepEnd = t;
  });
  if (timed.length > 0 || waitingTotal > 0) finishTroops(state.roster, stepEnd);
  const troopCounter = createTroopCounter([
    { role: 'attack', initial: before.attack, times: rosterEndTimes(state.roster, 'attack') },
    { role: 'defense', initial: before.defense, times: rosterEndTimes(state.roster, 'defense') },
    { role: 'heal', initial: before.heal, times: rosterEndTimes(state.roster, 'heal') },
  ]);
  let endTime = Math.max(stepEnd, rosterEndTime(state.roster));
  for (const track of state.enemyHealPops) endTime = Math.max(endTime, popTrackEnd(track));
  for (const burn of state.burns) endTime = Math.max(endTime, burn.tween.delay + burn.tween.duration);
  return {
    steps: timed,
    roster: state.roster,
    troopCounter,
    castleHpChanges: state.castleChanges,
    enemyHpChanges: state.enemyChanges,
    enemyHealPops: state.enemyHealPops,
    burns: state.burns,
    castleHpStart: before.castleHp,
    enemyHpStart: before.enemyHp,
    endTime,
  };
}
