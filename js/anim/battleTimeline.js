/**
 * 段の並びから、段の時刻（同時に始める段を含む）・兵の名簿・敵の体・ヒットマーク・当たりの記録・HP の変化・浮き出し・燃える札・音のきっかけの時刻を組み立てて時間割にする。
 * きっかけの時刻の式はここだけにある。描画も状態の変更も行わない。待っていた自軍の兵・子の引き継ぎも行う。
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
  finishTroops,
  marchSquad,
  markAutoTroops,
  markEliteTroops,
  OWN_KINDS,
  rosterEndTime,
  rosterEndTimes,
  rosterPointDrops,
  spawnTroops,
} from './troopRoster.js';
import { createTroopCounter } from './troopCounter.js';
import { enterEnemyTroops, strikeCastle, strikeTroops } from './enemyAttacks.js';
import { dashBack, dashForward } from './figureDash.js';
import { enemyPace } from './enemyShows.js';
import { createEnemyBody, defeatEnemyBody, enemyBodyEnd, hitEnemyBody, hitEnemyShield, isEnemyFigureDown } from './enemyBody.js';
import { createHitMarkList, hitMarksEnd } from './hitMarks.js';
import { createImpactLog, recordStepImpacts, watchStep } from './impactLog.js';
import { battleFxEnd } from './battleFx.js';
import { checkWaitingMinions, hatchMinions, marchMinions, placeWaitingMinions } from './minionShow.js';

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
 * @property {import('./enemyBody.js').EnemyBody} body 敵の体（群れ・シールド・倒れる絵）の記録
 * @property {import('./hitMarks.js').HitMarkList} hitMarks ヒットマークの記録
 * @property {import('./impactLog.js').ImpactLog} impacts 当たりの記録（時刻・位置・種類・大きな一撃か・段の番号）
 * @property {number} castleHpStart 城の HP の表示値の初期値
 * @property {number} enemyHpStart 敵の HP の表示値の初期値
 * @property {number} endTime 演出の終わりの時刻（ms。エフェクトが消える時刻を含む）。段がなければ 0
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
 * @property {import('./enemyBody.js').EnemyBody|null} body 敵の体（名簿の用意の後に作る）
 * @property {import('./hitMarks.js').HitMarkList} hitMarks ヒットマークの記録
 * @property {import('./impactLog.js').ImpactLog} impacts 当たりの記録
 * @property {string} typeId 敵の種類の識別子
 * @property {number} unit 敵の1体のポイント（`before.enemyUnit`。1 以上の整数）
 * @property {number[]} cueTimes いま組み立てている段の音のきっかけの時刻（絶対 ms。段ごとに空にして、builder が足す）
 * @property {import('../view/layout.js').Layout} boardLayout 盤面の配置（columnCardRects・discard と、敵の体・敵の側の兵の出る位置の battle を使う）
 */

/**
 * 敵の守りが画面の外（攻撃の兵の後ろ）から守りの陣地へ跳ねて現れる段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addForm(state, step, t) {
  return enterEnemyTroops(state.roster, state.boardLayout.battle, state.typeId, 'enemyGuard', 'offscreenBack', step.enemyGuards ?? 0, state.unit, t) - t;
}

/**
 * 敵の側の兵が画面の外・口から出て、防御の兵とぶつかる位置まで進む段。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addEnemyMarch(state, step, t) {
  const kind = step.kind ?? 'enemy';
  const arrived = enterEnemyTroops(state.roster, state.boardLayout.battle, state.typeId, kind, step.from ?? 'offscreen', step.amount, state.unit, t);
  return (
    arrived -
    t +
    marchSquad(state.roster, {
      kind,
      partnerKind: 'defense',
      pairs: step.pairs ?? 0,
      dir: -1,
      advanceX: state.roster.layout.enemyAdvanceX,
      t: arrived,
      moveScale: enemyPace(state.typeId).moveScale,
      partnerScale: 1,
    })
  );
}

/**
 * 相打ちの段の、ぶつかって落ち始める時刻。段の始め t と、名簿の組（進む側が kind で、両方ともまだ終わっていないもの）の2体の
 * 行進が終わる時刻（freeAt）の遅い方。行進の段の長さには「遅れの広がり」が含まれるのでふつうは t のままだが、
 * 組の片方の行進が終わる前に落ちて2体の時刻がずれることがないよう、ここで必ず行進の後にそろえる。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} kind 落ちる側の種類
 * @param {number} t 段の始め（ms）
 * @returns {number} ぶつかる時刻（ms。t 以上）
 */
function clashStartOf(state, kind, t) {
  let start = t;
  for (const { unit, partner } of state.roster.contacts) {
    if (unit.kind !== kind || unit.end !== null || partner.end !== null) continue;
    start = Math.max(start, unit.freeAt, partner.freeAt);
  }
  return start;
}

/**
 * 相打ちの段。組になった2体が、双方の行進が終わった後に、跳ねて落ちる。きっかけは最初の組がぶつかる時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {string} kind 落ちる側の種類（'enemy'・'attack'）
 * @param {number} amount 消し合うポイントの量（1体1ポイントなら組の数）
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
 * 当たった時刻の並びから、HP の表示が減る変化を足す（城・敵で共通）。最初の時刻から最後の時刻まで（下限 hpMs）で減る。
 * きっかけは最初の時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {'castle'|'enemy'} target 減る HP
 * @param {number} amount 減る量
 * @param {number[]} arrivals 当たった時刻（ms）の昇順（空なら t から hitMoveMs 後）
 * @param {number} t 段の開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function dropHp(state, target, amount, arrivals, t) {
  const T = BATTLE_ANIM;
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
 * 敵の HP の表示が、攻撃の兵が当たるたびに、その当たりのポイントだけ減る変化を足す（1体1ポイントなら 1 ずつ）。
 * 当たりのポイントの合計と量が同じときだけ当たりごとにし、違うときは dropHp に任せる。きっかけは当たりの時刻ごと。
 * @param {BuildState} state 組み立て中の状態
 * @param {number} amount 減る量
 * @param {import('./troopRoster.js').TroopHit[]} hits 当たり（着く時刻の昇順）
 * @param {number} t 段の開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function dropEnemyHpByHits(state, amount, hits, t) {
  const total = hits.reduce((sum, hit) => sum + hit.points, 0);
  if (amount <= 0 || total !== amount) {
    return dropHp(state, 'enemy', amount, hits.map((hit) => hit.time), t);
  }
  const first = hits[0].time;
  const last = hits[hits.length - 1].time;
  for (const hit of hits) {
    const to = state.enemyShown - hit.points;
    state.enemyChanges.push(createHpChange({ from: state.enemyShown, to, start: hit.time, duration: 0 }));
    state.enemyShown = to;
    state.cueTimes.push(hit.time);
  }
  return first + Math.max(BATTLE_ANIM.hpMs, last - first) - t;
}

/**
 * 敵の側の兵が城に当たる位置へ進んで落ち（炎は消え）、城の HP の表示が減る段。進む時間はその敵の `moveScale` 倍。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addCastleHit(state, step, t) {
  const arrivals = chargeTo(state.roster, step.kind ?? 'enemy', Infinity, state.roster.layout.castleHitX, t, BATTLE_ANIM.hitMoveMs * enemyPace(state.typeId).moveScale);
  return dropHp(state, 'castle', step.amount, arrivals, t);
}

/**
 * 攻撃の兵が敵に当たって（精鋭は自分のポイントを1回で使い）、敵の HP の表示が減る段。HP の表示は当たるたびにその当たりのポイントだけ減る。きっかけは当たりごと。
 * HP の表示が 0 になる時刻に、敵の体の倒れる動きを記録する。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addEnemyHit(state, step, t) {
  const hits = hitEnemyBody(state.body, state.roster, step.amount, t, state.enemyShown, step.part ?? null);
  const d = dropEnemyHpByHits(state, step.amount, hits, t);
  if (isEnemyFigureDown(state.body, state.enemyShown)) defeatEnemyBody(state.body, t + d);
  return d;
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
    moveScale: 1,
    partnerScale: enemyPace(state.typeId).moveScale,
  });
}

/**
 * 攻撃の兵が敵の当たる位置まで進み、量のポイントだけ使って（精鋭は1回で複数）同じ数のシールドが剥がれて落ちる段（絵を持つ敵の防御）。HP は変わらない。
 * きっかけは兵が当たる位置に着いた時刻ごと。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addShieldBlock(state, step, t) {
  const T = BATTLE_ANIM;
  const arrivals = hitEnemyShield(state.body, state.roster, step.amount, t);
  const first = arrivals.length > 0 ? arrivals[0] : t + T.hitMoveMs;
  const last = arrivals.length > 0 ? arrivals[arrivals.length - 1] : first;
  if (arrivals.length > 0) {
    for (const at of arrivals) state.cueTimes.push(at);
  } else {
    state.cueTimes.push(first);
  }
  return last - t + T.clashMs;
}

/**
 * 修理の兵が城へ入って消え、城の HP の表示が増える段。HP は1体目が着いた時刻から、入る兵の残りのポイントの累積が量に着いた時刻までかけて増える。
 * きっかけは最初の兵が城に入った時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addHeal(state, step, t) {
  const T = BATTLE_ANIM;
  const arrivals = enterCastle(state.roster, 'heal', t, T.healMoveMs);
  const first = arrivals.length > 0 ? arrivals[0].time : t + T.healMoveMs;
  const last = arrivals.length > 0 ? arrivals[arrivals.length - 1].time : first;
  let amountAt = first;
  let sum = 0;
  for (const arrival of arrivals) {
    amountAt = arrival.time;
    sum += arrival.points;
    if (sum >= step.amount) break;
  }
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
 * 飛ぶもののない打撃で、前からの防御の兵のポイントが打撃の量だけ使われ（精鋭は一部だけなら傷ついて残る）、打たれた兵にヒットマークが出る段。きっかけは最初の打撃の時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addStrikeBlock(state, step, t) {
  const times = strikeTroops(state.roster, state.hitMarks, 'defense', step.amount, t);
  state.cueTimes.push(times.length > 0 ? times[0] : t);
  return (times.length > 0 ? times[times.length - 1] : t) - t + BATTLE_ANIM.clashMs;
}

/**
 * 飛ぶもののない打撃で、城の当たりの範囲にヒットマークが1つずつ出て、城の HP の表示が減る段。きっかけは最初の打撃の時刻。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addStrikeCastle(state, step, t) {
  const times = strikeCastle(state.hitMarks, state.roster.layout.castleHitArea, step.amount, t);
  return dropHp(state, 'castle', step.amount, times, t);
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
 * ための段（巨人の振りかぶり・ドラゴンの吸い込み）。長さ `BATTLE_ANIM.chargeMs` を返すだけで、きっかけの時刻はない。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 */
function addCharge(state, step, t) {
  return BATTLE_ANIM.chargeMs;
}

/**
 * 絵が駆け寄る段。行き先（防御の兵の前・城の前）に絵の左の縁が着く。きっかけの時刻はない。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 * @throws {Error} 駆け寄れない体（群れ）のとき
 */
function addDash(state, step, t) {
  const body = state.body;
  if (body.dash === null) throw new Error(`buildBattleTimeline: 駆け寄れない敵の体です（${state.typeId}）`);
  return dashForward(body.dash, state.roster, body.contactX, step.to ?? 'castle', step.style ?? '', t);
}

/**
 * 絵が元の位置へ戻る段。きっかけの時刻はない。
 * @param {BuildState} state 組み立て中の状態
 * @param {import('./battleSteps.js').BattleStep} step 段
 * @param {number} t 開始時刻（ms）
 * @returns {number} 段の長さ（ms）
 * @throws {Error} 駆け寄れない体（群れ）のとき
 */
function addDashBack(state, step, t) {
  const body = state.body;
  if (body.dash === null) throw new Error(`buildBattleTimeline: 駆け寄れない敵の体です（${state.typeId}）`);
  return dashBack(body.dash, step.style ?? '', t);
}

/**
 * 段の種類ごとの組み立て。段の開始時刻を受け取り、段の長さを返す（きっかけの時刻は `state.cueTimes` に足す）。
 * @type {Object<string, (state: BuildState, step: import('./battleSteps.js').BattleStep, t: number) => number>}
 */
const STEP_BUILDERS = {
  form: addForm,
  enemyMarch: addEnemyMarch,
  minionMarch: (state, step, t) => marchMinions(state.roster, step, t, enemyPace(state.typeId).moveScale),
  minionSpawn: (state, step, t) => hatchMinions(state.roster, state.boardLayout.battle, state.typeId, step.amount, t),
  block: (state, step, t) => addClash(state, step.kind ?? 'enemy', step.amount, t),
  castleHit: addCastleHit,
  strikeBlock: addStrikeBlock,
  strikeCastle: addStrikeCastle,
  march: addMarch,
  enemyBlock: (state, step, t) => addClash(state, 'attack', step.amount, t),
  shieldBlock: addShieldBlock,
  enemyHit: addEnemyHit,
  heal: addHeal,
  enemyHeal: addEnemyHeal,
  burn: addBurn,
  charge: addCharge,
  dash: addDash,
  dashBack: addDashBack,
};

/**
 * 段の並びから時間割を組み立てる。段取りの間に待っていた自軍の兵と、敵の体（群れ・シールド）を、時刻 0 から置く。
 * 段ごとに、その段で終わり方が決まった兵とヒットマークから当たりの記録（`impacts`）も作る（時刻は名簿・打撃の値を写す）。
 * `parallel` の段は直前の段と同じ時刻に始め、時計を進めない。使われなかった兵は最後の段（`parallel` の段を含む）の終わりから帰る。
 * @param {import('./battleSteps.js').BattleStep[]} steps 段の並び
 * @param {import('./battleSteps.js').BattleSnapshot} before 攻防の前の値
 * @param {import('../view/layout.js').TroopLayout} troopLayout 兵の配置
 * @param {import('../view/layout.js').Layout} boardLayout 盤面の配置（燃える札の位置と、敵の体・敵の側の兵の出る位置 battle に使う）
 * @param {{attack: number, defense: number, heal: number}} waiting 段取りの間に待っていた兵の数（家の番号は 0 から数−1。`before` の値 − 精鋭の上振れと同じでなければ Error）
 * @param {{attack: number, defense: number, heal: number}} [waitingAuto] 待っていた兵のうち自動兵士の数（番号 0 から数−1 に印を付ける。見た目だけの印。省くと印なし）
 * @param {{attack: Array<{index: number, points: number}>, defense: Array<{index: number, points: number}>, heal: Array<{index: number, points: number}>}} [waitingElites] 待っていた精鋭（番号と1体のポイント。
 *   種類ごとに `before.elites` の数・上振れ（Σ(points − 1)）と合わなければ Error。省くと空の並び3つ）
 * @returns {BattleTimeline} 時間割
 */
export function buildBattleTimeline(steps, before, troopLayout, boardLayout, waiting, waitingAuto = { attack: 0, defense: 0, heal: 0 }, waitingElites = { attack: [], defense: [], heal: [] }) {
  /** @type {BuildState} */
  const state = {
    roster: createTroopRoster(troopLayout),
    castleChanges: [],
    enemyChanges: [],
    enemyHealPops: [],
    castleShown: before.castleHp,
    enemyShown: before.enemyHp,
    burns: [],
    body: null,
    hitMarks: createHitMarkList(),
    impacts: createImpactLog(),
    typeId: before.enemyTypeId,
    unit: before.enemyUnit,
    cueTimes: [],
    boardLayout,
  };
  let waitingTotal = 0;
  for (const kind of OWN_KINDS) {
    const eliteState = before.elites[kind];
    if (waiting[kind] !== before[kind] - eliteState.extra) {
      throw new Error(`buildBattleTimeline: 待っていた兵の数 ${kind}=${waiting[kind]} が攻防の前の値 ${before[kind]} − 精鋭の上振れ ${eliteState.extra} と違います`);
    }
    const elites = waitingElites[kind] ?? [];
    if (elites.length !== eliteState.count) {
      throw new Error(`buildBattleTimeline: 待っていた精鋭の数 ${kind}=${elites.length} が攻防の前の精鋭の数 ${eliteState.count} と違います`);
    }
    if (elites.reduce((sum, e) => sum + e.points - 1, 0) !== eliteState.extra) {
      throw new Error(`buildBattleTimeline: 待っていた精鋭の上振れ ${kind} が攻防の前の上振れ ${eliteState.extra} と違います`);
    }
    spawnTroops(state.roster, kind, waiting[kind], 0, 0);
    markAutoTroops(state.roster, kind, waitingAuto[kind] ?? 0);
    markEliteTroops(state.roster, kind, elites);
    waitingTotal += waiting[kind];
  }
  state.body = createEnemyBody(state.roster, boardLayout.battle, before.enemyTypeId, before.enemyHp, before.enemyDefense, before.enemyMaxHp, before.enemyUnit, before.enemyParts);
  placeWaitingMinions(state.roster, before.enemyMinions);
  checkWaitingMinions(steps, before.enemyMinions);
  /** @type {TimedStep[]} */
  const timed = [];
  let t = 0;
  let parallelEnd = 0;
  steps.forEach((step, index) => {
    const builder = STEP_BUILDERS[step.type];
    if (builder === undefined) throw new Error(`buildBattleTimeline: unknown step type ${step.type}`);
    if (index > 0 && steps[index - 1].parallel !== true) t += BATTLE_ANIM.stepGapMs;
    state.cueTimes = [];
    const watch = watchStep(state.roster, state.hitMarks);
    const duration = builder(state, step, t);
    recordStepImpacts(state.impacts, watch, step, index, state.body.style);
    timed.push({ ...step, start: t, end: t + duration, cueTimes: state.cueTimes });
    if (step.parallel === true) {
      parallelEnd = Math.max(parallelEnd, t + duration);
    } else {
      t += duration;
    }
  });
  const stepEnd = timed.length > 0 ? Math.max(t, parallelEnd) : 0;
  if (timed.length > 0 || waitingTotal > 0) finishTroops(state.roster, stepEnd);
  const troopCounter = createTroopCounter([
    ...OWN_KINDS.map((kind) => ({
      role: kind,
      initial: before[kind],
      heads: waiting[kind],
      drops: rosterPointDrops(state.roster, kind),
      ends: rosterEndTimes(state.roster, kind),
    })),
  ]);
  let endTime = Math.max(stepEnd, rosterEndTime(state.roster));
  for (const track of state.enemyHealPops) endTime = Math.max(endTime, popTrackEnd(track));
  for (const burn of state.burns) endTime = Math.max(endTime, burn.tween.delay + burn.tween.duration);
  endTime = Math.max(endTime, enemyBodyEnd(state.body), hitMarksEnd(state.hitMarks));
  endTime = Math.max(endTime, battleFxEnd(state.impacts, timed));
  return {
    steps: timed,
    roster: state.roster,
    troopCounter,
    castleHpChanges: state.castleChanges,
    enemyHpChanges: state.enemyChanges,
    enemyHealPops: state.enemyHealPops,
    burns: state.burns,
    body: state.body,
    hitMarks: state.hitMarks,
    impacts: state.impacts,
    castleHpStart: before.castleHp,
    enemyHpStart: before.enemyHp,
    endTime,
  };
}
