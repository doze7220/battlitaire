/**
 * 段の並びから、段の時刻・兵の群れの動きの記録・HP の変化を組み立てて時間割にする。
 * 描画も状態の変更も行わない。時間は BATTLE_ANIM、位置は TroopLayout から読む。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { addSquadKey, createSquadTrack, lastSquadKey, squadTrackEnd } from './squadTrack.js';
import { createHpChange } from './hpTrack.js';

/**
 * 時刻つきの段。BattleStep に start・end（ms）を足したもの。
 * @typedef {import('./battleSteps.js').BattleStep & {start: number, end: number}} TimedStep
 */

/**
 * 攻防の演出の時間割。
 * @typedef {Object} BattleTimeline
 * @property {TimedStep[]} steps 時刻つきの段
 * @property {import('./squadTrack.js').SquadTrack[]} squads 群れの動きの記録（キーのあるものだけ）
 * @property {import('./hpTrack.js').HpChange[]} castleHpChanges 城の HP の表示値の変化
 * @property {import('./hpTrack.js').HpChange[]} enemyHpChanges 敵の HP の表示値の変化
 * @property {number} castleHpStart 城の HP の表示値の初期値
 * @property {number} enemyHpStart 敵の HP の表示値の初期値
 * @property {number} endTime 演出の終わりの時刻（ms）。段がなければ 0
 */

/**
 * 組み立て中の状態。
 * @typedef {Object} BuildState
 * @property {Object<string, import('./squadTrack.js').SquadTrack>} tracks 種類ごとの群れの記録
 * @property {import('./hpTrack.js').HpChange[]} castleChanges 城の HP の変化
 * @property {import('./hpTrack.js').HpChange[]} enemyChanges 敵の HP の変化
 * @property {number} castleShown 城の HP の今の表示値
 * @property {number} enemyShown 敵の HP の今の表示値
 * @property {boolean} frontFaded 守備兵・敵兵の余りをすでに消し始めたか
 * @property {import('../view/layout.js').TroopLayout} layout 兵の配置
 */

/** 群れの種類の全部。 */
const ALL_KINDS = ['guard', 'enemyGuard', 'enemy', 'soldier', 'carpenter'];

/** 守備兵・敵兵の余りを消し始める段（最初に来たもの）。 */
const FRONT_FADE_STEPS = new Set(['march', 'enemyBlock', 'armorBlock', 'enemyHit', 'heal']);

/**
 * 群れの記録を（なければ作って）返す。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind} kind 群れの種類
 * @returns {import('./squadTrack.js').SquadTrack} 記録
 */
function trackOf(state, kind) {
  if (!state.tracks[kind]) state.tracks[kind] = createSquadTrack(kind);
  return state.tracks[kind];
}

/**
 * 群れの記録に点を足す。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind} kind 群れの種類
 * @param {number} time 時刻（ms）
 * @param {number} x 中心の x
 * @param {number} count 数
 * @param {number} alpha 濃さ
 * @returns {void}
 */
function key(state, kind, time, x, count, alpha) {
  addSquadKey(trackOf(state, kind), { time, x, count, alpha });
}

/**
 * 余った群れを fadeMs かけて消す記録を足す（時刻の位置は進めない）。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind} kind 群れの種類
 * @param {number} time 消し始める時刻（ms）
 * @returns {void}
 */
function fadeLeftover(state, kind, time) {
  const track = state.tracks[kind];
  if (!track) return;
  const last = lastSquadKey(track);
  if (last === null || last.count <= 0 || last.alpha <= 0) return;
  addSquadKey(track, { time, x: last.x, count: last.count, alpha: 1 });
  addSquadKey(track, { time: time + BATTLE_ANIM.fadeMs, x: last.x, count: last.count, alpha: 0 });
}

/**
 * 群れの最後の点の位置と数を返す。記録がなければ null。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind} kind 群れの種類
 * @returns {import('./squadTrack.js').SquadKey|null} 最後の点
 */
function nowOf(state, kind) {
  const track = state.tracks[kind];
  return track ? lastSquadKey(track) : null;
}

/**
 * 守りが並ぶ段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addForm(state, step, t) {
  const T = BATTLE_ANIM;
  const guards = step.guards ?? 0;
  const enemyGuards = step.enemyGuards ?? 0;
  if (guards > 0) {
    key(state, 'guard', t, state.layout.guardX, guards, 0);
    key(state, 'guard', t + T.formMs, state.layout.guardX, guards, 1);
  }
  if (enemyGuards > 0) {
    key(state, 'enemyGuard', t, state.layout.enemyGuardX, enemyGuards, 0);
    key(state, 'enemyGuard', t + T.formMs, state.layout.enemyGuardX, enemyGuards, 1);
  }
  return T.formMs;
}

/**
 * 敵兵が出てぶつかる位置まで進む段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addEnemyMarch(state, step, t) {
  const T = BATTLE_ANIM;
  key(state, 'enemy', t, state.layout.enemyGuardX, step.amount, 1);
  key(state, 'enemy', t + T.marchMs, state.layout.defenseClashX, step.amount, 1);
  return T.marchMs;
}

/**
 * 2つの群れがぶつかって、中間で同じ数だけ減る段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind[]} kinds ぶつかる2つの群れ
 * @param {number} amount 減る数
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addClash(state, kinds, amount, t) {
  const T = BATTLE_ANIM;
  const tm = t + T.clashMs / 2;
  for (const kind of kinds) {
    const now = nowOf(state, kind);
    if (now === null) continue;
    key(state, kind, t, now.x, now.count, 1);
    key(state, kind, tm, now.x, Math.max(0, now.count - amount), 1);
  }
  return T.clashMs;
}

/**
 * 残った兵が目標へ進んで当たって消え、HP の表示が減る段（城・敵で共通）。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./squadTrack.js').SquadKind} kind 当たる群れ
 * @param {number} targetX 当たる位置の x
 * @param {'castle'|'enemy'} target 減る HP
 * @param {number} amount 減る量
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addHit(state, kind, targetX, target, amount, t) {
  const T = BATTLE_ANIM;
  const now = nowOf(state, kind);
  if (now !== null) {
    key(state, kind, t, now.x, now.count, 1);
    key(state, kind, t + T.hitMoveMs, targetX, now.count, 1);
    key(state, kind, t + T.hitMoveMs, targetX, 0, 0);
  }
  if (target === 'castle') {
    const to = state.castleShown - amount;
    state.castleChanges.push(createHpChange({ from: state.castleShown, to, start: t + T.hitMoveMs, duration: T.hpMs }));
    state.castleShown = to;
  } else {
    const to = state.enemyShown - amount;
    state.enemyChanges.push(createHpChange({ from: state.enemyShown, to, start: t + T.hitMoveMs, duration: T.hpMs }));
    state.enemyShown = to;
  }
  return T.hitMoveMs + T.hpMs;
}

/**
 * 兵士が出てぶつかる位置まで進む段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addMarch(state, step, t) {
  const T = BATTLE_ANIM;
  key(state, 'soldier', t, state.layout.guardX, step.amount, 1);
  key(state, 'soldier', t + T.marchMs, state.layout.offenseClashX, step.amount, 1);
  return T.marchMs;
}

/**
 * 兵士が敵のシールドマークまで進み、当たって量だけ消える段（常時防御力）。HP は変わらない。
 * 当たりの時刻（`t + hitMoveMs`）は `battleCues.js` の `CUE_OFFSET_MS.armorBlock` と合わせること。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addArmorBlock(state, step, t) {
  const T = BATTLE_ANIM;
  const now = nowOf(state, 'soldier');
  if (now !== null) {
    const armorX = state.layout.armorHitX;
    key(state, 'soldier', t, now.x, now.count, 1);
    key(state, 'soldier', t + T.hitMoveMs, armorX, now.count, 1);
    key(state, 'soldier', t + T.hitMoveMs + T.clashMs / 2, armorX, Math.max(0, now.count - step.amount), 1);
  }
  return T.hitMoveMs + T.clashMs;
}

/**
 * 大工が現れて城を直し、消える段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addHeal(state, step, t) {
  const T = BATTLE_ANIM;
  const x = state.layout.carpenterX;
  const h = step.amount;
  key(state, 'carpenter', t, x, h, 0);
  key(state, 'carpenter', t + T.formMs, x, h, 1);
  key(state, 'carpenter', t + T.formMs + T.hpMs, x, h, 1);
  key(state, 'carpenter', t + T.formMs + T.hpMs + T.fadeMs, x, h, 0);
  const to = state.castleShown + h;
  state.castleChanges.push(createHpChange({ from: state.castleShown, to, start: t + T.formMs, duration: T.hpMs }));
  state.castleShown = to;
  return T.formMs + T.hpMs + T.fadeMs;
}

/**
 * 段の種類ごとの組み立て。段の開始時刻を受け取り、段の長さを返す。
 * @type {Object<string, (state: BuildState, step: import('./battleSteps.js').BattleStep, t: number) => number>}
 */
const STEP_BUILDERS = {
  form: addForm,
  enemyMarch: addEnemyMarch,
  block: (state, step, t) => addClash(state, ['guard', 'enemy'], step.amount, t),
  castleHit: (state, step, t) => addHit(state, 'enemy', state.layout.castleHitX, 'castle', step.amount, t),
  march: addMarch,
  enemyBlock: (state, step, t) => addClash(state, ['soldier', 'enemyGuard'], step.amount, t),
  armorBlock: addArmorBlock,
  enemyHit: (state, step, t) => addHit(state, 'soldier', state.layout.enemyHitX, 'enemy', step.amount, t),
  heal: addHeal,
};

/**
 * 段の始まりで、使われずに余った群れを消し始める。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} type 段の種類
 * @param {number} t 段の開始時刻（ms）
 * @returns {void}
 */
function fadeLeftoversAtStart(state, type, t) {
  if (!state.frontFaded && FRONT_FADE_STEPS.has(type)) {
    state.frontFaded = true;
    fadeLeftover(state, 'guard', t);
    fadeLeftover(state, 'enemy', t);
  }
  if (type === 'heal') {
    fadeLeftover(state, 'enemyGuard', t);
    fadeLeftover(state, 'soldier', t);
  }
}

/**
 * 段の並びから時間割を組み立てる。
 * @param {import('./battleSteps.js').BattleStep[]} steps 段の並び
 * @param {import('./battleSteps.js').BattleSnapshot} before 攻防の前の値
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @returns {BattleTimeline} 時間割
 */
export function buildBattleTimeline(steps, before, troopLayout) {
  /** @type {BuildState} */
  const state = {
    tracks: {},
    castleChanges: [],
    enemyChanges: [],
    castleShown: before.castleHp,
    enemyShown: before.enemyHp,
    frontFaded: false,
    layout: troopLayout,
  };
  /** @type {TimedStep[]} */
  const timed = [];
  let t = 0;
  let stepEnd = 0;
  steps.forEach((step, index) => {
    const builder = STEP_BUILDERS[step.type];
    if (builder === undefined) throw new Error(`buildBattleTimeline: unknown step type ${step.type}`);
    if (index > 0) t += BATTLE_ANIM.stepGapMs;
    fadeLeftoversAtStart(state, step.type, t);
    const duration = builder(state, step, t);
    timed.push({ ...step, start: t, end: t + duration });
    t += duration;
    stepEnd = t;
  });
  if (timed.length > 0) {
    for (const kind of ALL_KINDS) fadeLeftover(state, kind, stepEnd);
  }
  const squads = ALL_KINDS.filter((kind) => state.tracks[kind]).map((kind) => state.tracks[kind]);
  let endTime = stepEnd;
  for (const track of squads) endTime = Math.max(endTime, squadTrackEnd(track));
  return {
    steps: timed,
    squads,
    castleHpChanges: state.castleChanges,
    enemyHpChanges: state.enemyChanges,
    castleHpStart: before.castleHp,
    enemyHpStart: before.enemyHp,
    endTime,
  };
}
