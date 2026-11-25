/**
 * 責務: 効果音と BGM の名前とパスの一覧・SE と BGM の音量の初期値・BGM のフェードと待ち時間・敵の種類 → ステージの曲の表・連鎖の音程の調整値を1か所に凍結して持つ。
 * 値だけを持ち、oz も js/ のほかのファイルも import しない。音を鳴らさない。
 */

/**
 * 効果音の名前 → ページ（index.html）からの相対パス。`BGM_FILES` と合わせて `Assets.load` の `sounds` に渡す。
 * 本番の音に差し替えるときは、同じ名前のファイルを置き換えるか、ここのパスを書き換える。
 * - ready: 「準備終了」のロゴが出たときの音
 * - battleStart: 「BATTLE!」のロゴが出たときの音
 * - win: 敵を倒したときの音
 * 今は ready・battleStart はどちらも仮に行動終了の音のファイル（turnEnd.wav）を指す。後で別の音に差し替える。
 * @type {Readonly<Record<string, string>>}
 */
export const SOUND_FILES = Object.freeze({
  flip: './assets/sounds/flip.wav',
  place: './assets/sounds/place.wav',
  discard: './assets/sounds/discard.wav',
  release: './assets/sounds/release.wav',
  chain: './assets/sounds/chain.wav',
  ready: './assets/sounds/turnEnd.wav',
  battleStart: './assets/sounds/turnEnd.wav',
  block: './assets/sounds/block.wav',
  castleHit: './assets/sounds/castleHit.wav',
  enemyHit: './assets/sounds/enemyHit.wav',
  heal: './assets/sounds/heal.wav',
  win: './assets/sounds/win.mp3',
  lose: './assets/sounds/lose.mp3',
  start: './assets/sounds/start.mp3',
  giantAttack: './assets/sounds/giantAttack.mp3',
  dragonClaw: './assets/sounds/dragonClaw.mp3',
  dragonBreath: './assets/sounds/dragonBreath.mp3',
});

/**
 * BGM の名前 → ページ（index.html）からの相対パス。効果音の一覧と同じ `Assets.load` の `sounds` に合わせて渡す（エンジンは SE と BGM を一覧で区別しない）。
 * 一覧を分けるのは BGM と効果音を見分けるためだけ。**`SOUND_FILES` と名前を重ねてはならない**（同じ `sounds` に入るため）。
 * @type {Readonly<Record<string, string>>}
 */
export const BGM_FILES = Object.freeze({
  title: './assets/bgm/title.mp3',
  stage: './assets/bgm/stage.mp3',
  dragon: './assets/bgm/dragon.mp3',
});

/**
 * `Sound.seVolume` の初期値（0〜1）。試遊で決め直す。
 * @type {number}
 */
export const SE_VOLUME = 0.7;

/**
 * `Sound.bgmVolume` の初期値（0〜1）。試遊で決め直す。
 * @type {number}
 */
export const BGM_VOLUME = 0.5;

/**
 * 敵の種類の識別子 → ステージの曲の名前（`BGM_FILES` の名前）。
 * 識別子はルール層の値（`game.enemy.typeId`）を文字として書いたもので、`js/rules/` は import しない。
 * @type {Readonly<Record<string, string>>}
 */
export const STAGE_BGM = Object.freeze({
  goblins: 'stage',
  giant: 'stage',
  dragon: 'dragon',
});

/**
 * BGM のフェードと待ち時間（すべてミリ秒。0 以上の有限数）。試遊で決め直す。
 * - titleFadeInMs: タイトルの曲のフェードイン
 * - startFadeOutMs: 「はじめる」でタイトルの曲を止めるフェードアウト
 * - startToStageMs: スタートの音を鳴らしてから最初のステージの曲を始めるまでの待ち時間（スタートの音の長さ 約 1.2 秒に合わせる）
 * - stageFadeInMs: ステージの曲のフェードイン（0 で頭からすぐ）
 * - knockoutFadeOutMs: HP が 0 になった瞬間に BGM を止めるフェードアウト
 * @type {Readonly<{titleFadeInMs: number, startFadeOutMs: number, startToStageMs: number, stageFadeInMs: number, knockoutFadeOutMs: number}>}
 */
export const BGM_TIMING = Object.freeze({
  titleFadeInMs: 0,
  startFadeOutMs: 300,
  startToStageMs: 1200,
  stageFadeInMs: 0,
  knockoutFadeOutMs: 300,
});

/**
 * 放った束の連鎖の音程の上がり方。試遊で決め直す。
 * - stepSemitones: 1枚ごとに上げる半音の数（2 なら全音ずつ上がる）
 * - maxSemitones: 上げ幅の上限の半音の数（12 なら1オクターブ上で頭打ち。それ以降の枚は同じ高さ）
 * @type {Readonly<{stepSemitones: number, maxSemitones: number}>}
 */
export const CHAIN_PITCH = Object.freeze({
  stepSemitones: 2,
  maxSemitones: 12,
});
