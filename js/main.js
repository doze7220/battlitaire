/**
 * 責務: Engine.start の呼び出しと、レイヤーと画面の流れ（BOOT → TITLE ⇄ 遊び方、TITLE → 盤面（ふつう／デバッグスタート）→ 決着 → TITLE）を作る関数の定義を行う利用側のエントリポイント。
 * 起動の前の保存された設定の反映と効果音・BGM の読み込み、デバッグを有効にする定数 DEBUG_TOOLS_ENABLED と、デバッグスタートのルールの値の写し（debugRules）の保持も行う。
 */
import { Engine, Scene, Assets, Storage } from 'oz';
import { SOUND_FILES, BGM_FILES } from './audio/soundConfig.js';
import { SETTINGS_STORAGE, applySoundSettings } from './scenes/settingsStore.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { BoardScene } from './scenes/BoardScene.js';
import { HowToScene } from './scenes/HowToScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { createMenuTabs } from './scenes/menuTabs.js';
import { BoardDebug } from './scenes/boardDebug.js';
import { createDebugTab } from './scenes/debugTab.js';
import { createDebugRules } from './rules/debugRules.js';

/** 解像度（縦長の画面。論理解像度 720×1280） */
const screen = { width: 720, height: 1280 };

/**
 * デバッグの入口（タイトル画面の「デバッグスタート」）を出すか。Phase 06 の間は ON（true）でコミットする。
 * OFF にすると、デバッグスタート・DEBUG タブ・FPS の表示はどこにも出ない。読むのは createTitle だけ。
 * @type {boolean}
 */
const DEBUG_TOOLS_ENABLED = true;

/**
 * 盤面のシーンを作る（乱数の関数 Math.random とタイトル画面を作る関数、TURN の区画で積むメニューのシーンを作る関数を渡す）。DEBUG タブは付かない。
 * @returns {Scene} 新しい盤面のシーン
 */
function createBoard() {
  return new BoardScene({ screen, layer: 'main', random: Math.random, createTitle, createMenu });
}

/**
 * デバッグスタートのゲームが使うルールの値の写し（config.js の RULES と同じ形）。最初のデバッグスタートで作り、ページを読み込み直すまで持つ。保存しない。
 * @type {import('./rules/config.js').Rules|null}
 */
let debugRules = null;

/**
 * デバッグスタートの盤面のシーンを作る（createBoard と同じで、メニューの窓を作る関数だけ DEBUG タブ付きの createDebugMenu を渡す）。
 * ルールの値の写し（debugRules）を最初の1回だけ作り、盤面へ rules として渡す（同じ写しを次のデバッグスタートにも渡すので、変えた値は残る）。
 * @returns {Scene} 新しい盤面のシーン
 */
function createDebugBoard() {
  if (debugRules === null) debugRules = createDebugRules();
  return new BoardScene({ screen, layer: 'main', random: Math.random, createTitle, createMenu: createDebugMenu, rules: debugRules });
}

/**
 * 遊び方の画面のシーンを作る。戻る先はタイトル画面のシーンを作る関数。
 * @returns {Scene} 新しい遊び方の画面のシーン（1ページ目から始まる）
 */
function createHowTo() {
  return new HowToScene({ screen, layer: 'main', back: createTitle });
}

/**
 * メニューの窓のシーンを作る（標準のタブの一覧で組み立てる。開くたびに新しい窓）。盤面から渡される引数は使わない（DEBUG タブなし）。
 * @returns {Scene} 新しいメニューのシーン
 */
function createMenu() {
  return new MenuScene({ layer: 'main', tabs: createMenuTabs() });
}

/**
 * DEBUG タブ付きのメニューの窓のシーンを作る（標準のタブの一覧の後ろに DEBUG タブを足す。開くたびに新しい窓）。
 * @param {import('./scenes/boardDebug.js').BoardMenuTarget} target 盤面の部品（game・releaseShow・flow）
 * @returns {Scene} 新しいメニューのシーン
 */
function createDebugMenu(target) {
  return new MenuScene({ layer: 'main', tabs: [...createMenuTabs(), createDebugTab(new BoardDebug(target))] });
}

/**
 * タイトル画面のシーンを作る。進む先は盤面のシーンを作る関数と遊び方の画面のシーンを作る関数、「設定」で積むメニューのシーンを作る関数。
 * 「デバッグスタート」で進む先は、DEBUG_TOOLS_ENABLED が ON のときだけ createDebugBoard（OFF なら null でボタンは出ない。定数を読むのはここだけ）。
 * @returns {Scene} 新しいタイトル画面のシーン
 */
function createTitle() {
  return new TitleScene({ screen, layer: 'main', next: createBoard, howTo: createHowTo, menu: createMenu, debugNext: DEBUG_TOOLS_ENABLED ? createDebugBoard : null });
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
 * scene: 最初の画面は BOOT。BOOT の next はタイトル画面を作る関数、タイトル画面の next は盤面を作る関数、howTo は遊び方の画面を作る関数（遊び方の画面の back はタイトル画面を作る関数）で、盤面のシーンにはタイトル画面を作る関数とメニューの窓を作る関数を渡す（決着後は TITLE へ戻り、BOOT へは戻らない。メニューの窓はタイトル画面の「設定」と盤面の TURN の区画から開く。タイトル画面の「デバッグスタート」は定数が ON のときだけ出て、DEBUG タブ付きのメニューを渡した盤面へ進む）。
 * debug は書かない（FPS の出し入れは DEBUG タブから）。
 * virtualPad: バーチャルパッドを使うなら true。false にすると表示も画像の読み込みもしない（今は使わないので false）。
 * @type {{canvas: HTMLCanvasElement, width: number, height: number, layers: string[], scene: Scene, debug?: boolean, virtualPad?: boolean}}
 */
const config = {
  canvas: document.querySelector('canvas'),
  width: screen.width,
  height: screen.height,
  layers: ['main'],
  scene: createBoot(),
  virtualPad: false,
};

// 起動の前の準備: 設定を開いて保存された音量を反映し、効果音と BGM を読み込み終えてから Engine.start を呼ぶ（盤面で鳴らす音が未ロードにならないようにする）
Storage.open(SETTINGS_STORAGE);
applySoundSettings();
await Assets.load({ sounds: { ...SOUND_FILES, ...BGM_FILES } });

Engine.start(config);
