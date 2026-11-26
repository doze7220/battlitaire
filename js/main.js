/**
 * 責務: Engine.start の呼び出しと、レイヤーと画面の流れ（BOOT → TITLE ⇄ 遊び方、TITLE → 盤面（新規か再開）→ 負け → 結果の画面 → 盤面（もう一度）かTITLE）を作る関数の定義を行う利用側のエントリポイント。
 * 起動の前の設定・中断データ・ベストの保存先の用意（Storage.open）と保存された設定の反映、効果音・BGM の読み込み、URL の ?debug を読んで起動設定に渡すこと、起動の直後の FPS の表示の消去、デバッグのゲームのルールの値の写し（debugRules）の保持も行う。
 */
import { Engine, Scene, Assets, Storage } from 'oz';
import { SOUND_FILES, BGM_FILES } from './audio/soundConfig.js';
import { SETTINGS_STORAGE, applySoundSettings } from './scenes/settingsStore.js';
import { DEBUG_MODE_LAYER } from './scenes/debugModeLayer.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { BoardScene } from './scenes/BoardScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { HowToScene } from './scenes/HowToScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { createMenuTabs } from './scenes/menuTabs.js';
import { createUpgradeTab } from './scenes/upgradeTab.js';
import { BoardDebug } from './scenes/boardDebug.js';
import { createDebugTab } from './scenes/debugTab.js';
import { createDebugRules } from './rules/debugRules.js';
import { todaySeed } from './scenes/dateSeed.js';
import { newPlayRng } from './scenes/playRng.js';
import { SUSPEND_DEFAULTS } from './scenes/suspendStore.js';
import { BEST_DEFAULTS } from './scenes/bestStore.js';

/** 解像度（縦長の画面。論理解像度 720×1280） */
const screen = { width: 720, height: 1280 };

/**
 * URL の検索部分（location.search）がデバッグ（?debug）を表すか。引数の文字列だけから答える。
 * ?debug・?debug=1・?a=1&debug は真。なし・?debug=0（ふつう）・?debugx=1 は偽。同じ名前が2つあるときは初めの値で決まる。
 * @param {string} search URL の検索部分（例: '?debug=1'）
 * @returns {boolean} デバッグなら true
 */
function isDebugQuery(search) {
  const value = new URLSearchParams(search).get('debug');
  return value !== null && value !== '0';
}

/**
 * 盤面のシーンを作る。デバッグ（Engine.debug が真）のときは createDebugBoard の盤面。
 * Engine.start の後だけ呼ばれる（タイトル画面のゲームスタート、結果の画面の「もう一度」）。ここで今日の日付の種（todaySeed）を1回だけ読み、盤面（デバッグのときは createDebugBoard）へ渡す。
 * プレイ用の乱数（newPlayRng）も1回だけ作り、ふつうの盤面・デバッグの盤面の両方へ渡す。
 * ふつうのときは乱数と種、結果の画面を作る関数、TURN の区画で積むメニューのシーンを作る関数を渡す（DEBUG タブなし）。
 * @returns {Scene} 新しい盤面のシーン
 */
function createBoard() {
  const seed = todaySeed();
  const rng = newPlayRng();
  if (Engine.debug) return createDebugBoard(seed, rng);
  return new BoardScene({ screen, layer: 'main', rng, seed, createResult, createMenu: createBoardMenu });
}

/**
 * 中断データから再開する盤面のシーンを作る（タイトル画面の「再開」で進むときだけ呼ばれる）。
 * 日付の種も乱数も新しく作らない（種 seed と乱数の状態 rng は中断データの中）。結果の画面を作る関数・メニューの窓を作る関数は新しい盤面と同じ。
 * @param {import('./rules/suspendData.js').SuspendData} suspend 中断データ（loadSuspend を通ったもの）
 * @returns {Scene} 再開する盤面のシーン
 */
function createResumedBoard(suspend) {
  return new BoardScene({ screen, layer: 'main', suspend, createResult, createMenu: createBoardMenu });
}

/**
 * デバッグのゲームが使うルールの値の写し（config.js の RULES と同じ形）。最初のデバッグのゲームで作り、ページを読み込み直すまで持つ。保存しない。
 * @type {import('./rules/config.js').Rules|null}
 */
let debugRules = null;

/**
 * デバッグのゲームの盤面のシーンを作る（ふつうの盤面と同じで、メニューの窓を作る関数だけ DEBUG タブ付きの createDebugMenu を渡す）。
 * ルールの値の写し（debugRules）を最初の1回だけ作り、盤面へ rules として渡す（同じ写しを次のデバッグのゲームにも渡すので、変えた値は残る）。
 * @param {number} seed 敵の並びを決める種（createBoard が読んだ今日の種）
 * @param {import('./rules/rng.js').Rng} rng プレイ用の乱数（createBoard が作ったもの）
 * @returns {Scene} 新しい盤面のシーン
 */
function createDebugBoard(seed, rng) {
  if (debugRules === null) debugRules = createDebugRules();
  return new BoardScene({ screen, layer: 'main', rng, seed, createResult, createMenu: createDebugMenu, rules: debugRules });
}

/**
 * 結果の画面のシーンを作る（負けの結果が出たとき、盤面から攻防の演出のシーンを通して呼ばれる）。
 * 「もう一度」は新しい盤面を作る関数（createBoard。その日の日付の種の新しいゲーム。デバッグではデバッグの盤面）、「タイトルへ」はタイトル画面を作る関数。
 * @param {Object} target 結果の画面に必要なもの
 * @param {import('./rules/Game.js').Game} target.game 負けたゲーム
 * @param {import('./view/layout.js').BattleLayout} target.battleLayout 盤面の攻防の配置
 * @param {{ today: { score: number, isNew: boolean }, best: { score: number, isNew: boolean } }|null} target.bests 記録したベスト（デバッグは null）
 * @returns {Scene} 新しい結果の画面のシーン
 */
function createResult({ game, battleLayout, bests }) {
  return new ResultScene({ screen, layer: 'main', game, battleLayout, bests, retry: createBoard, title: createTitle });
}

/**
 * 遊び方の画面のシーンを作る。戻る先はタイトル画面のシーンを作る関数。
 * @returns {Scene} 新しい遊び方の画面のシーン（1ページ目から始まる）
 */
function createHowTo() {
  return new HowToScene({ screen, layer: 'main', back: createTitle });
}

/**
 * メニューの窓のシーンを作る（標準のタブの一覧で組み立てる。開くたびに新しい窓）。タイトル画面のメニュー（強化タブなし。盤面のメニューは createBoardMenu・createDebugMenu を使う）。
 * @returns {Scene} 新しいメニューのシーン
 */
function createMenu() {
  return new MenuScene({ layer: 'main', tabs: createMenuTabs() });
}

/**
 * 盤面のメニューの窓のシーンを作る（設定・強化・クレジット。開くたびに新しい窓。デバッグでないふつうの盤面が使う）。
 * @param {import('./scenes/boardDebug.js').BoardMenuTarget} target 盤面の部品（game・releaseShow・flow。game だけ使う）
 * @returns {Scene} 新しいメニューのシーン
 */
function createBoardMenu(target) {
  return new MenuScene({ layer: 'main', tabs: createMenuTabs([createUpgradeTab(target.game)]) });
}

/**
 * DEBUG タブ付きのメニューの窓のシーンを作る（標準のタブの一覧の後ろに DEBUG タブを足す。並びは 設定・強化・クレジット・DEBUG。開くたびに新しい窓。デバッグのゲームの盤面だけが使う）。
 * @param {import('./scenes/boardDebug.js').BoardMenuTarget} target 盤面の部品（game・releaseShow・flow）
 * @returns {Scene} 新しいメニューのシーン
 */
function createDebugMenu(target) {
  return new MenuScene({ layer: 'main', tabs: [...createMenuTabs([createUpgradeTab(target.game)]), createDebugTab(new BoardDebug(target))] });
}

/**
 * タイトル画面のシーンを作る。進む先は盤面のシーンを作る関数・再開する盤面のシーンを作る関数（createResumedBoard）と遊び方の画面のシーンを作る関数、「設定」で積むメニューのシーンを作る関数。
 * @returns {Scene} 新しいタイトル画面のシーン
 */
function createTitle() {
  return new TitleScene({
    screen,
    layer: 'main',
    next: createBoard,
    resume: createResumedBoard,
    howTo: createHowTo,
    menu: createMenu,
  });
}

/**
 * 最初の入力を受ける画面（BOOT。「TAP SCREEN」）を作る。進む先はタイトル画面のシーンを作る関数。
 * @returns {Scene} 新しい BOOT のシーン
 */
function createBoot() {
  return new BootScene({ screen, layer: 'main', next: createTitle });
}

/**
 * Engine.start に渡す設定。tickRate は書かない（既定の 60）。
 * layers: 奥から 'main'、いちばん手前に「DEBUG MODE」のレイヤー（デバッグのときだけ描かれる）。
 * scene: 最初の画面は BOOT。BOOT の next はタイトル画面を作る関数、タイトル画面の next は盤面を作る関数、resume は中断データから再開する盤面を作る関数（createResumedBoard）、howTo は遊び方の画面を作る関数（遊び方の画面の back はタイトル画面を作る関数）で、盤面のシーンには結果の画面を作る関数とメニューの窓を作る関数を渡す（負けると結果の画面が積まれ、「タイトルへ」で TITLE へ戻り、BOOT へは戻らない。メニューの窓はタイトル画面の「設定」と盤面の TURN の区画から開く）。
 * debug: URL に ?debug があるか（isDebugQuery。URL を読むのはここだけ）。真のとき、盤面はデバッグのゲーム（DEBUG タブ付き）になる。
 * virtualPad: バーチャルパッドを使うなら true。false にすると表示も画像の読み込みもしない（今は使わないので false）。
 * @type {{canvas: HTMLCanvasElement, width: number, height: number, layers: string[], scene: Scene, debug: boolean, virtualPad?: boolean}}
 */
const config = {
  canvas: document.querySelector('canvas'),
  width: screen.width,
  height: screen.height,
  layers: ['main', DEBUG_MODE_LAYER],
  scene: createBoot(),
  debug: isDebugQuery(location.search),
  virtualPad: false,
};

// 起動の前の準備: 設定・中断データ・ベストの名前を1つの Storage に開いて保存された音量を反映し（key・version は設定のまま）、効果音と BGM を読み込み終えてから Engine.start を呼ぶ（盤面で鳴らす音が未ロードにならないようにする）
Storage.open({ ...SETTINGS_STORAGE, defaults: { ...SETTINGS_STORAGE.defaults, ...SUSPEND_DEFAULTS, ...BEST_DEFAULTS } });
applySoundSettings();
await Assets.load({ sounds: { ...SOUND_FILES, ...BGM_FILES } });

Engine.start(config);
// デバッグでは FPS を左上に出した状態で始まるので消す（出し入れは DEBUG タブから）
Engine.fpsVisible = false;
