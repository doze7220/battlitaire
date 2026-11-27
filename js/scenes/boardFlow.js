/**
 * 責務: 盤面のシーンの区切りの段階（スタートの待ち → ステージの始まり → フェーズの始まり → 段取り → ひとりでに放つ → 準備終了 → BATTLE!）を管理する。
 * ルール層の問い合わせを読み、戦闘の曲（ふだん・激昂。デバッグで入れ替わった敵の曲を含む）・準備終了・BATTLE! の音を鳴らし、BannerShow を進める。中断データから戻した盤面（TURN 2 以降・3択の段階）の始まり方も決める。3択の間は盤面を触らせず、メニューを開かせない。ルールの操作は呼ばない（Scene を継承しない）。
 */
import { BannerShow } from '../anim/bannerShow.js';
import { BGM_TIMING } from '../audio/soundConfig.js';
import { playBattleBgm, matchBattleBgm } from './bgmCues.js';
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
     * 最初のステージの始まり（再開の盤面ではフェーズの始まりと曲）までの、スタートの待ちの残り時間（ミリ秒）。0 になるまで待つ。
     * @type {number}
     */
    this.stageWaitMs = BGM_TIMING.startToStageMs;
    /**
     * ステージの始まりを出したステージの番号。まだ出していなければ null。
     * @type {number|null}
     */
    this.introStageNumber = null;
    /**
     * フェーズの始まりを出したフェーズの番号。まだ出していなければ null。
     * @type {number|null}
     */
    this.introPhase = null;
    /**
     * 再開した盤面（TURN 2 以降）で、スタートの待ちが終わったときにステージの曲を鳴らす約束が残っているか。`resumeFrom` が立て、鳴らしたら false に戻る。
     * @type {boolean}
     */
    this.resumeBgmPending = false;
  }

  /**
   * 中断データから戻した盤面の始まり方を決める（`init` で作った直後に1回呼ぶ）。
   * 3択の段階なら、倒した敵のステージの始まりを出さず（`introStageNumber`・`introPhase` を今のステージ・フェーズにし、スタートの待ちを 0 にする。曲の約束は立てない）、選んだ後のステージの始まりをすぐ出せるようにする。
   * そうでなく戦闘のターンが 1 ならふつうにステージへ入ったときと同じ流れにするので何もしない。
   * 2 以上なら「STAGE N」を出さず（`introStageNumber` を今のステージの番号にする。敵は初めから立つ）、スタートの待ちが終わったときに曲を鳴らす約束（`resumeBgmPending`）を立てる。
   * @param {{stageNumber: number, phase: number, battleTurn: number, isChoosingUpgrade: function(): boolean}} game ルール層の状態（読むだけ）
   * @returns {void}
   */
  resumeFrom(game) {
    if (game.isChoosingUpgrade()) {
      this.introStageNumber = game.stageNumber;
      this.introPhase = game.phase;
      this.stageWaitMs = 0;
      this.resumeBgmPending = false;
      return;
    }
    if (game.battleTurn <= 1) return;
    this.introStageNumber = game.stageNumber;
    this.resumeBgmPending = true;
  }

  /**
   * 毎ティックの段階の進行。次の順に上から1つだけ判断する。
   * 1. BATTLE! が終わった → BATTLE! を消して 'battle' を返す（呼ぶ側が攻防に入る）。
   * 2. 合図が出ている → 何もしない。
   * 3. ステージの始まりをまだ出していないステージの番号 → スタートの待ちが残っていれば待ち、0 なら戦闘の曲とステージの始まりを同時に始める。
   * 4. フェーズの始まりをまだ出していない → スタートの待ちが残っていれば待ち（ふつうの流れでは 3 で 0 になっているので待たない。再開の盤面だけここで待つ）、0 なら（再開の曲の約束があれば曲を鳴らし、なければ激昂の状態に合う曲へ合わせて）フェーズの始まりを出し、'turn' を返す（呼ぶ側が自動兵士を陣地に現す）。
   * 5. 段取りが止まっていて、ひとりでに放つ印が残っている → 'mark' を返す（呼ぶ側が印の列の束を放つ。準備終了の前。ルールの操作は呼ばない）。
   * 6. 段取りが止まっていて攻防を計算できる → 準備終了を出し、音を鳴らす。
   * @param {number} dt 経過時間（ミリ秒）
   * @param {{stageNumber: number, phase: number, enemyRage: function(): {enraged: boolean}, canResolveBattle: function(): boolean, canReleaseMarked: function(): boolean}} game ルール層の状態（読むだけ）
   * @param {boolean} boardIdle 札・玉・兵の動きが全部止まっているか
   * @returns {'battle'|'turn'|'mark'|null} BATTLE! が終わって攻防に入る時なら 'battle'、フェーズの始まり（TURN）を出した update なら 'turn'、ひとりでに放つ時なら 'mark'、ほかは null
   */
  update(dt, game, boardIdle) {
    this.banner.update(dt);
    this.stageWaitMs = Math.max(0, this.stageWaitMs - dt);

    if (this.banner.isBattleCallOver()) {
      this.banner.clear();
      return 'battle';
    }
    if (!this.banner.isIdle()) return null;

    if (this.introStageNumber !== game.stageNumber) {
      if (this.stageWaitMs > 0) return null;
      this.introStageNumber = game.stageNumber;
      playBattleBgm(game.enemyRage().enraged);
      this.banner.showStage();
      return null;
    }
    if (this.introPhase !== game.phase) {
      if (this.stageWaitMs > 0) return null;
      if (this.resumeBgmPending) {
        this.resumeBgmPending = false;
        playBattleBgm(game.enemyRage().enraged);
      } else {
        matchBattleBgm(game.enemyRage().enraged);
      }
      this.introPhase = game.phase;
      this.banner.showPhase();
      return 'turn';
    }
    if (boardIdle && game.canReleaseMarked()) return 'mark';
    if (boardIdle && game.canResolveBattle()) {
      this.banner.showReady();
      playReadySe();
    }
    return null;
  }

  /**
   * フェーズの始まり（TURN の表示）をまだ出していないか（読むだけ。状態は変えない）。
   * 真の間は、自動兵士がまだ陣地に現れていないので、人数の表示から引く量（`ReleaseShow.view` の `held`）を渡す目印になる。
   * @param {{phase: number}} game ルール層の状態（読むだけ）
   * @returns {boolean} まだ出していなければ true
   */
  isTurnStartPending(game) {
    return this.introPhase !== game.phase;
  }

  /**
   * デバッグで入れ替わった敵（敵の切り替え・ステージを移ったときの両方）を、ステージの始まりを出したことにして、そのときの激昂の状態に合う戦闘の曲を流す（敵が替わると戦闘のターンは 1 で激昂していない）。
   * ステージの始まりの演出は出さない（`update` が出さなくなり、`entranceLook` は見える・ずれなしになる）。
   * フェーズの始まりの印（`introPhase`）は触らない。同じ曲ならエンジンが何もしないので、流れたままになる。
   * @param {{stageNumber: number, enemyRage: function(): {enraged: boolean}}} game ルール層の状態（読むだけ）
   */
  enterSwitchedEnemy(game) {
    this.introStageNumber = game.stageNumber;
    playBattleBgm(game.enemyRage().enraged);
  }

  /**
   * DEBUG で戦闘のターンの番号・激昂の値を変えたとき、今の激昂の状態に合う曲へ合わせる（同じ曲なら何も起きない。別の曲ならクロスフェード）。
   * @param {{enemyRage: function(): {enraged: boolean}}} game ルール層の状態（読むだけ）
   * @returns {void}
   */
  matchRageBgm(game) {
    matchBattleBgm(game.enemyRage().enraged);
  }

  /**
   * 盤面のタップ（`'down'`）の頭で呼ぶ。
   * 準備終了が出きっていれば BATTLE! を始めて音を鳴らす（盤面の操作はしない）。
   * 合図が出ている間、またはステージ・フェーズの始まりの待ちの間は盤面を触らせない。
   * 3択の間は盤面を触らせない。
   * @param {{stageNumber: number, phase: number, isChoosingUpgrade: function(): boolean}} game ルール層の状態（読むだけ）
   * @returns {boolean} 盤面の処理へ進んでよければ true。false なら呼ぶ側は選択を外して戻る
   */
  tap(game) {
    if (game.isChoosingUpgrade()) return false;
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
   * ステージまたはフェーズの始まりを、まだ出していない（待っている。再開の盤面のスタートの待ちを含む）か。
   * `BattleShowScene` が外れた直後のフレームでは `BoardScene.update` より先に入力が届くことがあるため、
   * 合図が空でもこの待ちの間は盤面を触らせないために `tap` が見る。
   * @param {{stageNumber: number, phase: number}} game ルール層の状態（読むだけ）
   * @returns {boolean} 待っていれば true
   */
  isPending(game) {
    return this.introStageNumber !== game.stageNumber || this.introPhase !== game.phase;
  }

  /**
   * 盤面の最上部の TURN の区画を押してメニューの窓を開いてよいか（読むだけ。状態は変えない）。
   * 真になる間: ステージ・フェーズの始まりを出し終えて合図が空のとき（札・玉・兵が動いている途中、行動を使い切ってから準備終了が出るまでの間を含む）。
   * 偽になる間: スタートの待ち・ステージとフェーズの始まりの待ちと合図の間、準備終了が出ている間・BATTLE! の間、3択の間。
   * @param {{stageNumber: number, phase: number, isChoosingUpgrade: function(): boolean}} game ルール層の状態（読むだけ）
   * @returns {boolean} 開いてよければ true
   */
  canOpenMenu(game) {
    return this.banner.isIdle() && !this.isPending(game) && !game.isChoosingUpgrade();
  }

  /**
   * 段取りの間の敵の絵の入りの見た目。状態は変えず、毎回新しいオブジェクトを返す。
   * ステージの始まりを出す前の敵は描かない（入れ替わった直後の `draw` が `update` より先に来ても元の位置に見せないため）。
   * 倒した敵（HP 0）も描かない（3択の画面の後ろに倒した敵を残さないため）。
   * @param {{stageNumber: number, enemy: {hp: number}}} game ルール層の状態（読むだけ）
   * @returns {import('../anim/enemyEntrance.js').EnemyEntranceLook} 見えるか・右へのずれ
   */
  entranceLook(game) {
    return { visible: this.introStageNumber === game.stageNumber && game.enemy.hp > 0, dx: this.banner.enemyOffset() };
  }

  /**
   * いま出ている合図の見た目（読むだけ）。
   * @returns {import('../anim/bannerShow.js').BannerLook} 種類・倍率・濃さ・暗幕
   */
  bannerLook() {
    return this.banner.look();
  }
}
