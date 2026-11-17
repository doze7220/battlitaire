/**
 * 当たりの白い光・ダメージの数字（「-1」）・粒（ダメージ・修理）の見た目を、攻防の始めに1回作った型付き配列の入れ物へ時計から書く。
 * 粒の散り方の式はここだけ（乱数なし）。描画も状態の変更もしない。
 */
import { BATTLE_ANIM } from './battleAnimConfig.js';
import { IMPACT_KINDS } from './impactLog.js';

/** 黄金比の小数部（粒の散り方を番号から決める。乱数の代わり）。 @type {number} */
const GOLDEN = 0.6180339887;

/** 粒の速さの下限の割合（最大の速さ `sparkSpeed` に対する割合）。 @type {number} */
const SPARK_SPEED_MIN = 0.6;

/**
 * 小数部を返す。
 * @param {number} v 値
 * @returns {number} v − floor(v)
 */
function frac(v) {
  return v - Math.floor(v);
}

/**
 * 白い光の見た目（`repair` 以外の当たり）。
 * @typedef {Object} ImpactFlashLook
 * @property {number} count 光の数
 * @property {Uint8Array} visible 見えるか（1 または 0）
 * @property {Float64Array} x 中心の x
 * @property {Float64Array} y 中心の y
 * @property {Float64Array} size 直径（px）
 * @property {Float64Array} alpha 濃さ（0〜1）
 */

/**
 * 「-1」の見た目（`enemyDamage`・`castleDamage` の当たり）。
 * @typedef {Object} ImpactPopLook
 * @property {number} count 数字の数
 * @property {Uint8Array} visible 見えるか（1 または 0）
 * @property {Float64Array} x 中心の x
 * @property {Float64Array} y 中心の y（浮き上がった後）
 * @property {Float64Array} alpha 濃さ（0〜1）
 * @property {Uint8Array} castle 1＝城の HP が減る／0＝敵の HP が減る
 * @property {number} size 文字の大きさ（px）
 */

/**
 * 粒の見た目（ダメージの当たり × sparkCount ＋ 修理 × repairSparkCount）。
 * @typedef {Object} ImpactSparkLook
 * @property {number} count 粒の数
 * @property {Uint8Array} visible 見えるか（1 または 0。見える数は sparkMax まで）
 * @property {Float64Array} x 中心の x
 * @property {Float64Array} y 中心の y
 * @property {Float64Array} alpha 濃さ（0〜1）
 * @property {Uint8Array} repair 1＝修理の粒（緑）／0＝ダメージの粒
 * @property {number} size 粒の大きさ（px。正方形の辺）
 */

/**
 * 当たりのエフェクトの見た目（描画が読む。毎回同じ入れ物）。
 * @typedef {Object} ImpactFxLook
 * @property {ImpactFlashLook} flashes 白い光
 * @property {ImpactPopLook} pops 「-1」
 * @property {ImpactSparkLook} sparks 粒
 */

/**
 * 当たりの光・数字・粒の見た目を型付き配列に書く入れ物。作るのは1回だけで、毎フレームは `sample` が書くだけ（オブジェクトを作らない）。
 * `flashes`・`pops`・`sparks` が `ImpactFxLook` として読める。
 */
export class ImpactFx {
  /**
   * @param {import('./impactLog.js').ImpactLog} log 時間割が記録した当たりの記録
   */
  constructor(log) {
    const total = log.time.length;
    const flashIdx = [];
    const popIdx = [];
    const sparkHit = [];
    const sparkJ = [];
    const sparkN = [];
    const sparkRepair = [];
    for (let i = 0; i < total; i++) {
      const kind = log.kind[i];
      if (kind !== IMPACT_KINDS.repair) flashIdx.push(i);
      if (kind === IMPACT_KINDS.enemyDamage || kind === IMPACT_KINDS.castleDamage) {
        popIdx.push(i);
        for (let j = 0; j < BATTLE_ANIM.sparkCount; j++) {
          sparkHit.push(i);
          sparkJ.push(j);
          sparkN.push(BATTLE_ANIM.sparkCount);
          sparkRepair.push(0);
        }
      } else if (kind === IMPACT_KINDS.repair) {
        for (let j = 0; j < BATTLE_ANIM.repairSparkCount; j++) {
          sparkHit.push(i);
          sparkJ.push(j);
          sparkN.push(BATTLE_ANIM.repairSparkCount);
          sparkRepair.push(1);
        }
      }
    }

    const fc = flashIdx.length;
    /** @type {ImpactFlashLook} */
    this.flashes = {
      count: fc,
      visible: new Uint8Array(fc),
      x: new Float64Array(fc),
      y: new Float64Array(fc),
      size: new Float64Array(fc),
      alpha: new Float64Array(fc),
    };
    /** @type {Float64Array} 光の元の x */
    this.flashX0 = Float64Array.from(flashIdx, (i) => log.x[i]);
    /** @type {Float64Array} 光の元の y */
    this.flashY0 = Float64Array.from(flashIdx, (i) => log.y[i]);
    /** @type {Float64Array} 光が出る時刻（ms） */
    this.flashTime = Float64Array.from(flashIdx, (i) => log.time[i]);

    const pc = popIdx.length;
    /** @type {ImpactPopLook} */
    this.pops = {
      count: pc,
      visible: new Uint8Array(pc),
      x: new Float64Array(pc),
      y: new Float64Array(pc),
      alpha: new Float64Array(pc),
      castle: Uint8Array.from(popIdx, (i) => (log.kind[i] === IMPACT_KINDS.castleDamage ? 1 : 0)),
      size: BATTLE_ANIM.damagePopSize,
    };
    /** @type {Float64Array} 数字の元の x */
    this.popX0 = Float64Array.from(popIdx, (i) => log.x[i]);
    /** @type {Float64Array} 数字の元の y */
    this.popY0 = Float64Array.from(popIdx, (i) => log.y[i]);
    /** @type {Float64Array} 数字が出る時刻（ms） */
    this.popTime = Float64Array.from(popIdx, (i) => log.time[i]);

    const sc = sparkHit.length;
    /** @type {ImpactSparkLook} */
    this.sparks = {
      count: sc,
      visible: new Uint8Array(sc),
      x: new Float64Array(sc),
      y: new Float64Array(sc),
      alpha: new Float64Array(sc),
      repair: Uint8Array.from(sparkRepair),
      size: BATTLE_ANIM.sparkSize,
    };
    /** @type {Float64Array} 粒の元の x */
    this.sparkX0 = Float64Array.from(sparkHit, (i) => log.x[i]);
    /** @type {Float64Array} 粒の元の y */
    this.sparkY0 = Float64Array.from(sparkHit, (i) => log.y[i]);
    /** @type {Float64Array} 粒が出る時刻（ms） */
    this.sparkTime = Float64Array.from(sparkHit, (i) => log.time[i]);
    /** @type {Int32Array} 粒の当たりの番号（当たりの記録の中の番号） */
    this.sparkHit = Int32Array.from(sparkHit);
    /** @type {Int32Array} 粒の番号（その当たりの中） */
    this.sparkJ = Int32Array.from(sparkJ);
    /** @type {Int32Array} その当たりの粒の数 */
    this.sparkN = Int32Array.from(sparkN);
  }

  /**
   * 時計の時刻での光・数字・粒の見た目を書く。
   * @param {number} clock 演出の時計（ms）
   * @returns {void}
   */
  sample(clock) {
    this.sampleFlashes(clock);
    this.samplePops(clock);
    this.sampleSparks(clock);
  }

  /**
   * 白い光を書く。大きさは flashSize の半分から flashSize へ広がり、濃さは 1 から 0 へ。
   * @param {number} clock 演出の時計（ms）
   * @returns {void}
   */
  sampleFlashes(clock) {
    const f = this.flashes;
    const ms = BATTLE_ANIM.flashMs;
    for (let i = 0; i < f.count; i++) {
      const tau = clock - this.flashTime[i];
      if (tau >= 0 && tau < ms) {
        f.visible[i] = 1;
        f.x[i] = this.flashX0[i];
        f.y[i] = this.flashY0[i];
        f.size[i] = BATTLE_ANIM.flashSize * (0.5 + (0.5 * tau) / ms);
        f.alpha[i] = 1 - tau / ms;
      } else {
        f.visible[i] = 0;
      }
    }
  }

  /**
   * 「-1」を書く。damagePopRise だけ浮き上がり、濃さは前半 1・後半で 1 から 0 へ。
   * @param {number} clock 演出の時計（ms）
   * @returns {void}
   */
  samplePops(clock) {
    const p = this.pops;
    const ms = BATTLE_ANIM.damagePopMs;
    const half = ms / 2;
    for (let i = 0; i < p.count; i++) {
      const tau = clock - this.popTime[i];
      if (tau >= 0 && tau < ms) {
        p.visible[i] = 1;
        p.x[i] = this.popX0[i];
        p.y[i] = this.popY0[i] - BATTLE_ANIM.damagePopRise * (tau / ms);
        p.alpha[i] = tau < half ? 1 : 1 - (tau - half) / half;
      } else {
        p.visible[i] = 0;
      }
    }
  }

  /**
   * 粒を書く。当たり i の j 番目の粒は角度 θ = 2π (j + frac(i×G)) / n、速さ v = sparkSpeed × (MIN + (1 − MIN) × frac((i + j + 1)×G))、
   * x = x0 + cosθ·v·τ、y = y0 + sinθ·v·τ + g·τ²/2（g はダメージの粒は sparkGravity、修理の粒は −sparkGravity）、濃さ 1 − τ / sparkMs。
   * 見える粒は番号の順に sparkMax まで（その後の粒は見えない）。
   * @param {number} clock 演出の時計（ms）
   * @returns {void}
   */
  sampleSparks(clock) {
    const s = this.sparks;
    const ms = BATTLE_ANIM.sparkMs;
    const g0 = BATTLE_ANIM.sparkGravity;
    let shown = 0;
    for (let k = 0; k < s.count; k++) {
      const tau = clock - this.sparkTime[k];
      if (tau >= 0 && tau < ms && shown < BATTLE_ANIM.sparkMax) {
        shown++;
        const i = this.sparkHit[k];
        const j = this.sparkJ[k];
        const theta = (2 * Math.PI * (j + frac(i * GOLDEN))) / this.sparkN[k];
        const v = BATTLE_ANIM.sparkSpeed * (SPARK_SPEED_MIN + (1 - SPARK_SPEED_MIN) * frac((i + j + 1) * GOLDEN));
        const g = s.repair[k] === 1 ? -g0 : g0;
        s.visible[k] = 1;
        s.x[k] = this.sparkX0[k] + Math.cos(theta) * v * tau;
        s.y[k] = this.sparkY0[k] + Math.sin(theta) * v * tau + (g * tau * tau) / 2;
        s.alpha[k] = 1 - tau / ms;
      } else {
        s.visible[k] = 0;
      }
    }
  }
}
