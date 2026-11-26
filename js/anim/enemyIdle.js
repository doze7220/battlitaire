/**
 * 敵（群れの敵・絵の敵）の待機の伸び縮み。段取りの間の見た目の入れ物と、攻防の間の絵の姿勢を求める。
 * 絵の伸び縮みの式はここだけ（群れの兵は `troopBreath.js` の式）。描画も状態の変更もしない。
 */

import { BATTLE_ANIM } from './battleAnimConfig.js';
import { breathScale } from './troopBreath.js';
import { enemyBodyStyle } from './enemyShows.js';

/**
 * 段取りの間の敵の待機の見た目（描画が読む）。
 * @typedef {Object} EnemyIdleLook
 * @property {number} count 伸び縮みを書いた群れの数（群れでない敵は 0）
 * @property {Float64Array} scaleX 群れの並びの番号ごとの横の伸び縮み（先頭 count 個が有効）
 * @property {Float64Array} scaleY 群れの並びの番号ごとの縦の伸び縮み（先頭 count 個が有効）
 * @property {{tilt: number, scaleX: number, scaleY: number}} figure 絵の伸び縮み（傾きは常に 0）
 */

/**
 * 絵の待機の伸び縮みの量 s を返す（横は 1 − s / 2、縦は 1 + s）。
 * @param {number} clock 時計の値（ms）
 * @returns {number} 伸び縮みの量
 */
function figureBreath(clock) {
  return BATTLE_ANIM.figureBreathDepth * Math.sin((2 * Math.PI * clock) / BATTLE_ANIM.figureBreathPeriodMs);
}

/**
 * 攻防の間の絵の姿勢を `out` に書く（オブジェクトを作らない）。
 * ための姿勢に待機の伸び縮みを重ね、ための強さで弱め、倒れ始めたら重ねない。
 * @param {{tilt: number, scaleX: number, scaleY: number}} charge ための姿勢
 * @param {number} chargeK ための強さ（0〜1。ための段の外は 0、頂点で 1）
 * @param {boolean} falling 絵が倒れ始めているか
 * @param {number} clock 時計の値（ms）
 * @param {{tilt: number, scaleX: number, scaleY: number}} out 書き込み先
 * @returns {void}
 */
export function sampleFigurePose(charge, chargeK, falling, clock, out) {
  out.tilt = charge.tilt;
  if (falling) {
    out.scaleX = charge.scaleX;
    out.scaleY = charge.scaleY;
    return;
  }
  const s = figureBreath(clock) * (1 - chargeK);
  out.scaleX = charge.scaleX * (1 - s / 2);
  out.scaleY = charge.scaleY * (1 + s);
}

/**
 * 段取りの間の敵の待機の見た目の入れ物。自分の時計を持つ。
 */
export class EnemyIdle {
  constructor() {
    /** @type {number} 時計（ms。0 から） */
    this.clock = 0;
    /** @type {number} 伸び縮みを書いた群れの数 */
    this.count = 0;
    /** @type {Float64Array} 群れの並びの番号ごとの横の伸び縮み */
    this.scaleX = new Float64Array(0);
    /** @type {Float64Array} 群れの並びの番号ごとの縦の伸び縮み */
    this.scaleY = new Float64Array(0);
    /** @type {{tilt: number, scaleX: number, scaleY: number}} 絵の伸び縮み */
    this.figure = { tilt: 0, scaleX: 1, scaleY: 1 };
    /** @type {{scaleX: number, scaleY: number}} 1体ぶんを求める作業用の入れ物 */
    this._scale = { scaleX: 1, scaleY: 1 };
  }

  /**
   * 時計を進め、いまの敵の伸び縮みを入れ物に書く。
   * @param {number} ms 進める時間（ms）
   * @param {string} typeId 敵の種類の識別子
   * @param {number} count 群れの体の数（群れでない敵は見ない。1体のポイントが 2 以上の敵は HP でなく体の数）
   * @returns {void}
   */
  update(ms, typeId, count) {
    this.clock += ms;
    if (enemyBodyStyle(typeId) === 'horde') {
      const n = Math.max(0, count);
      if (n > this.scaleX.length) {
        this.scaleX = new Float64Array(n);
        this.scaleY = new Float64Array(n);
      }
      for (let i = 0; i < n; i++) {
        // 攻防の名簿は群れを逆順に置くので、番号 n − 1 − i にそろえて位相を合わせる
        breathScale('goblin', n - 1 - i, this.clock, this._scale);
        this.scaleX[i] = this._scale.scaleX;
        this.scaleY[i] = this._scale.scaleY;
      }
      this.count = n;
    } else {
      this.count = 0;
    }
    const s = figureBreath(this.clock);
    this.figure.scaleX = 1 - s / 2;
    this.figure.scaleY = 1 + s;
  }

  /**
   * 見た目の値（自分自身。読むだけ）を返す。状態は変えない。
   * @returns {EnemyIdleLook}
   */
  look() {
    return this;
  }
}
