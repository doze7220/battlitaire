/**
 * 責務: Engine.start の呼び出しと、レイヤーと画面の流れ（BOOT → TITLE ⇄ 遊び方、TITLE → 盤面 → 決着 → TITLE）を作る関数の定義を行う利用側のエントリポイント。
 * 起動の前の保存された設定の反映（settingsStore.js の口を呼ぶ）と効果音・BGM の読み込みも行う。
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

/** 解像度（縦長の画面。論理解像度 720×1280） */
const screen = { width: 720, height: 1280 };

/**
 * 盤面のシーンを作る（乱数の関数 Math.random とタイトル画面を作る関数、TURN の区画で積むメニューのシーンを作る関数を渡す）。
 * @returns {Scene} 新しい盤面のシーン
 */
function createBoard() {
  return new BoardScene({ screen, layer: 'main', random: Math.random, createTitle, createMenu });
}

/**
 * 遊び方の画面のシーンを作る。戻る先はタイトル画面のシーンを作る関数。
 * @returns {Scene} 新しい遊び方の画面のシーン（1ページ目から始まる）
 */
function createHowTo() {
  return new HowToScene({ screen, layer: 'main', back: createTitle });
}

/**
 * メニューの窓のシーンを作る（標準のタブの一覧で組み立てる。開くたびに新しい窓）。
 * @returns {Scene} 新しいメニューのシーン
 */
function createMenu() {
  return new MenuScene({ layer: 'main', tabs: createMenuTabs() });
}

/**
 * タイトル画面のシーンを作る。進む先は盤面のシーンを作る関数と遊び方の画面のシーンを作る関数、「設定」で積むメニューのシーンを作る関数。
 * @returns {Scene} 新しいタイトル画面のシーン
 */
function createTitle() {
  return new TitleScene({ screen, layer: 'main', next: createBoard, howTo: createHowTo, menu: createMenu });
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
 * scene: 最初の画面は BOOT。BOOT の next はタイトル画面を作る関数、タイトル画面の next は盤面を作る関数、howTo は遊び方の画面を作る関数（遊び方の画面の back はタイトル画面を作る関数）で、盤面のシーンにはタイトル画面を作る関数とメニューの窓を作る関数を渡す（決着後は TITLE へ戻り、BOOT へは戻らない。メニューの窓はタイトル画面の「設定」と盤面の TURN の区画のどちらからも同じ関数で開く）。
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
