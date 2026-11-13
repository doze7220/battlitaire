/**
 * 責務: 効果音の名前とパスの一覧（SOUND_FILES）と SE の音量の初期値（SE_VOLUME）を1か所に凍結して持つ。
 * 値だけを持ち、oz も js/ のほかのファイルも import しない。音を鳴らさない。
 */

/**
 * 効果音の名前 → ページ（index.html）からの相対パス。`Assets.load({ sounds: SOUND_FILES })` にそのまま渡す。
 * 本番の音に差し替えるときは、同じ名前のファイルを置き換えるか、ここのパスを書き換える。
 * @type {Readonly<Record<string, string>>}
 */
export const SOUND_FILES = Object.freeze({
  flip: './assets/sounds/flip.wav',
  place: './assets/sounds/place.wav',
  discard: './assets/sounds/discard.wav',
  release: './assets/sounds/release.wav',
  chain: './assets/sounds/chain.wav',
  turnEnd: './assets/sounds/turnEnd.wav',
  block: './assets/sounds/block.wav',
  castleHit: './assets/sounds/castleHit.wav',
  enemyHit: './assets/sounds/enemyHit.wav',
  heal: './assets/sounds/heal.wav',
  win: './assets/sounds/win.wav',
  lose: './assets/sounds/lose.wav',
});

/**
 * `Sound.seVolume` の初期値（0〜1）。試遊で決め直す。
 * @type {number}
 */
export const SE_VOLUME = 0.7;
