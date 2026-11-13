/**
 * 責務: 効果音の名前とパスの一覧（SOUND_FILES）と SE の音量の初期値（SE_VOLUME）を1か所に凍結して持つ。
 * 連鎖の音程の調整値（CHAIN_PITCH）も持つ。
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
