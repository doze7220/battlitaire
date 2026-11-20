/**
 * いま出ている合図（準備終了・BATTLE!・ステージ／フェーズの始まり）の種類と時計、見た目の値、敵の入りのずれを持ち答える。
 * 描画・ゲームの状態の変更・音は行わない。
 */

import { BANNER_ANIM } from './bannerConfig.js';
import { clamp01, lerp, easeOutCubic, easeOutBack } from './easing.js';
import { enemyEntranceOffset } from './enemyEntrance.js';

/**
 * 合図の見た目。
 * @typedef {Object} BannerLook
 * @property {'ready'|'battle'|'stage'|'phase'|null} kind 合図の種類（なければ null）
 * @property {number} scale ロゴ・数字にかける倍率
 * @property {number} alpha 全体の濃さ（0〜1）
 * @property {number} dim 準備終了の暗幕の進み（0〜1。実際の濃さは描画側で掛ける）
 */

/**
 * 始まりの合図（'stage'・'phase'）の長さを返す。
 * @param {'stage'|'phase'} kind 合図の種類
 * @returns {number} 長さ（ミリ秒）
 */
function introLength(kind) {
  return kind === 'stage' ? BANNER_ANIM.stageMs : BANNER_ANIM.phaseMs;
}

/**
 * 合図の種類と時計から見た目を求めて out に書く（純粋）。
 * @param {'ready'|'battle'|'stage'|'phase'|null} kind 合図の種類
 * @param {number} clock 合図を出してからの経過時間（ミリ秒）
 * @param {BannerLook} out 書き込み先
 * @returns {BannerLook} out
 */
export function sampleBannerLook(kind, clock, out) {
  out.kind = kind;
  if (kind === 'ready') {
    const t = clamp01(clock / BANNER_ANIM.readyPopMs);
    out.scale = easeOutBack(t);
    out.alpha = 1;
    out.dim = t;
  } else if (kind === 'battle') {
    const tp = clamp01(clock / BANNER_ANIM.battlePopMs);
    const tf = clamp01(
      (clock - (BANNER_ANIM.battleMs - BANNER_ANIM.battleFadeMs)) / BANNER_ANIM.battleFadeMs,
    );
    out.scale = easeOutBack(tp) * lerp(1, BANNER_ANIM.battleFadeScale, tf);
    out.alpha = 1 - tf;
    out.dim = 0;
  } else if (kind === 'stage' || kind === 'phase') {
    const d = introLength(kind);
    const ti = clamp01(clock / BANNER_ANIM.introFadeInMs);
    const to = clamp01((clock - (d - BANNER_ANIM.introFadeOutMs)) / BANNER_ANIM.introFadeOutMs);
    out.scale = lerp(BANNER_ANIM.introScaleFrom, 1, easeOutCubic(ti));
    out.alpha = ti * (1 - to);
    out.dim = 0;
  } else {
    out.scale = 1;
    out.alpha = 0;
    out.dim = 0;
  }
  return out;
}

/**
 * 合図の管理。種類と時計を持ち、見た目と敵の入りのずれを答える。
 */
export class BannerShow {
  /**
   * @param {number} enterDistance 敵の入りの始めの右へのずれ（px）
   */
  constructor(enterDistance) {
    /** @type {'ready'|'battle'|'stage'|'phase'|null} いま出ている合図の種類 */
    this.kind = null;
    /** @type {number} 合図を出してからの経過時間（ミリ秒） */
    this.clock = 0;
    /** @type {number} 敵の入りの始めの右へのずれ（px） */
    this.enterDistance = enterDistance;
    /** @type {BannerLook} 見た目の入れ物（sampleBannerLook で書く） */
    this.lookBox = { kind: null, scale: 1, alpha: 0, dim: 0 };
  }

  /**
   * 種類を替えて時計を 0 にし、見た目を書く。
   * @param {'ready'|'battle'|'stage'|'phase'|null} kind 合図の種類
   * @returns {void}
   */
  begin(kind) {
    this.kind = kind;
    this.clock = 0;
    sampleBannerLook(this.kind, this.clock, this.lookBox);
  }

  /**
   * 準備終了を出し始める。
   * @returns {void}
   */
  showReady() {
    this.begin('ready');
  }

  /**
   * BATTLE! を出し始める。
   * @returns {void}
   */
  showBattle() {
    this.begin('battle');
  }

  /**
   * ステージの始まりを出し始める。
   * @returns {void}
   */
  showStage() {
    this.begin('stage');
  }

  /**
   * フェーズの始まりを出し始める。
   * @returns {void}
   */
  showPhase() {
    this.begin('phase');
  }

  /**
   * 合図を消す。
   * @returns {void}
   */
  clear() {
    this.begin(null);
  }

  /**
   * 時計を進める。ステージ・フェーズの始まりは長さに達したら消える（準備終了は出したまま、BATTLE! は clear されるまで残る）。
   * @param {number} ms 経過時間（ミリ秒）
   * @returns {void}
   */
  update(ms) {
    if (this.kind === null) return;
    this.clock += ms;
    if ((this.kind === 'stage' || this.kind === 'phase') && this.clock >= introLength(this.kind)) {
      this.kind = null;
      this.clock = 0;
    }
    sampleBannerLook(this.kind, this.clock, this.lookBox);
  }

  /**
   * 合図が出ていないか。
   * @returns {boolean} 種類が null なら true
   */
  isIdle() {
    return this.kind === null;
  }

  /**
   * 準備終了が出きってタップを待っているか。
   * @returns {boolean} 'ready' で時計が出きる長さ以上なら true
   */
  isWaitingTap() {
    return this.kind === 'ready' && this.clock >= BANNER_ANIM.readyPopMs;
  }

  /**
   * BATTLE! を出し終えたか。
   * @returns {boolean} 'battle' で時計が全体の長さ以上なら true
   */
  isBattleCallOver() {
    return this.kind === 'battle' && this.clock >= BANNER_ANIM.battleMs;
  }

  /**
   * 敵の入りの右へのずれ。
   * @returns {number} ステージの始まりの間は入りのずれ（px）、ほかは 0
   */
  enemyOffset() {
    return this.kind === 'stage' ? enemyEntranceOffset(this.clock, this.enterDistance) : 0;
  }

  /**
   * 合図の見た目（読むだけ。書き換えない）。
   * @returns {BannerLook} 見た目の入れ物
   */
  look() {
    return this.lookBox;
  }
}
