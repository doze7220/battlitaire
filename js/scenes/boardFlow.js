/**
 * 責務: 盤面のシーンの区切りの段階（スタートの待ち → ステージの始まり → フェーズの始まり → 段取り → 準備終了 → BATTLE!）を管理する。
 * ルール層の問い合わせを読み、ステージの曲・準備終了・BATTLE! の音を鳴らし、BannerShow を進める。ルールの操作は呼ばない（Scene を継承しない）。
 */
import { BannerShow } from '../anim/bannerShow.js';
import { BGM_TIMING } from '../audio/soundConfig.js';
import { playStageBgm } from './bgmCues.js';
import { playReadySe, playBattleStartSe } from './soundCues.js';

/**
 * 盤面の段階の管理。`BoardScene` が毎ティック `update` を呼び、入力の頭で `tap` を呼び、`draw` で `entranceLook`・`bannerLook` を読む。
 */
export class BoardFlow {
  /**
   * @param {number} enterDistance 敵の入りの始めの右へのずれ（px。`bannerLayout.enemyEntryDX`）
   */
  constructor(enterDistance) {
    /**
     * いま出ている合図の管理。
     * @type {BannerShow}
     */
    this.banner = new BannerShow(enterDistance);
    /**
     * 最初のステージの始まりまでの、スタートの待ちの残り時間（ミリ秒）。0 になるまで待つ。
     * @type {number}
     */
    this.stageWaitMs = BGM_TIMING.startToStageMs;
    /**
     * ステージの始まりを出した敵の番号。まだ出していなければ null。
     * @type {number|null}
     */
    this.stageEnemyIndex = null;
    /**
     * フェーズの始まりを出したフェーズの番号。まだ出していなければ null。
     * @type {number|null}
     */
    this.introPhase = null;
  }

  /**
   * 毎ティックの段階の進行。次の順に上から1つだけ判断する。
   * 1. BATTLE! が終わった → BATTLE! を消して true を返す（呼ぶ側が攻防に入る）。
   * 2. 合図が出ている → 何もしない。
   * 3. ステージの始まりをまだ出していない敵 → スタートの待ちが残っていれば待ち、0 ならステージの曲とステージの始まりを同時に始める。
   * 4. フェーズの始まりをまだ出していない → フェーズの始まりを出す。
   * 5. 段取りが止まっていて攻防を計算できる → 準備終了を出し、音を鳴らす。
   * @param {number} dt 経過時間（ミリ秒）
   * @param {{enemyIndex: number, phase: number, enemy: {typeId: string}, canResolveBattle: function(): boolean}} game ルール層の状態（読むだけ）
   * @param {boolean} boardIdle 札・玉・兵の動きが全部止まっているか
   * @returns {boolean} BATTLE! が終わって攻防に入る時なら true
   */
  update(dt, game, boardIdle) {
    this.banner.update(dt);
    this.stageWaitMs = Math.max(0, this.stageWaitMs - dt);

    if (this.banner.isBattleCallOver()) {
      this.banner.clear();
      return true;
    }
    if (!this.banner.isIdle()) return false;

    if (this.stageEnemyIndex !== game.enemyIndex) {
      if (this.stageWaitMs > 0) return false;
      this.stageEnemyIndex = game.enemyIndex;
      playStageBgm(game.enemy.typeId);
      this.banner.showStage();
      return false;
    }
    if (this.introPhase !== game.phase) {
      this.introPhase = game.phase;
      this.banner.showPhase();
      return false;
    }
    if (boardIdle && game.canResolveBattle()) {
      this.banner.showReady();
      playReadySe();
    }
    return false;
  }

  /**
   * 盤面のタップ（`'down'`）の頭で呼ぶ。
   * 準備終了が出きっていれば BATTLE! を始めて音を鳴らす（盤面の操作はしない）。
   * 合図が出ている間、またはステージ・フェーズの始まりの待ちの間は盤面を触らせない。
   * @param {{enemyIndex: number, phase: number}} game ルール層の状態（読むだけ）
   * @returns {boolean} 盤面の処理へ進んでよければ true。false なら呼ぶ側は選択を外して戻る
   */
  tap(game) {
    if (this.banner.isWaitingTap()) {
      this.banner.showBattle();
      playBattleStartSe();
      return false;
    }
    if (!this.banner.isIdle()) return false;
    if (this.isPending(game)) return false;
    return true;
  }

  /**
   * ステージまたはフェーズの始まりを、まだ出していない（待っている）か。
   * `BattleShowScene` が外れた直後のフレームでは `BoardScene.update` より先に入力が届くことがあるため、
   * 合図が空でもこの待ちの間は盤面を触らせないために `tap` が見る。
   * @param {{enemyIndex: number, phase: number}} game ルール層の状態（読むだけ）
   * @returns {boolean} 待っていれば true
   */
  isPending(game) {
    return this.stageEnemyIndex !== game.enemyIndex || this.introPhase !== game.phase;
  }

  /**
   * 盤面の最上部の TURN の区画を押してメニューの窓を開いてよいか（読むだけ。状態は変えない）。
   * 真になる間: ステージ・フェーズの始まりを出し終えて合図が空のとき（札・玉・兵が動いている途中、行動を使い切ってから準備終了が出るまでの間を含む）。
   * 偽になる間: スタートの待ち・ステージとフェーズの始まりの待ちと合図の間、準備終了が出ている間・BATTLE! の間。
   * @param {{enemyIndex: number, phase: number}} game ルール層の状態（読むだけ）
   * @returns {boolean} 開いてよければ true
   */
  canOpenMenu(game) {
    return this.banner.isIdle() && !this.isPending(game);
  }

  /**
   * 段取りの間の敵の絵の入りの見た目。状態は変えず、毎回新しいオブジェクトを返す。
   * ステージの始まりを出す前の敵は描かない（入れ替わった直後の `draw` が `update` より先に来ても元の位置に見せないため）。
   * @param {{enemyIndex: number}} game ルール層の状態（読むだけ）
   * @returns {import('../anim/enemyEntrance.js').EnemyEntranceLook} 見えるか・右へのずれ
   */
  entranceLook(game) {
    return { visible: this.stageEnemyIndex === game.enemyIndex, dx: this.banner.enemyOffset() };
  }

  /**
   * いま出ている合図の見た目（読むだけ）。
   * @returns {import('../anim/bannerShow.js').BannerLook} 種類・倍率・濃さ・暗幕
   */
  bannerLook() {
    return this.banner.look();
  }
}
