/**
 * 責務: Engine.start の呼び出しと、レイヤーと画面の流れ（BOOT → TITLE → 盤面 → 決着 → TITLE）を作る関数の定義を行う利用側のエントリポイント。
 * 起動の前の音の読み込みと SE の音量の設定も行う。
 */
import { Engine, Scene, Assets, Sound } from 'oz';
import { SOUND_FILES, SE_VOLUME } from './audio/soundConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { BoardScene } from './scenes/BoardScene.js';

/** 解像度（縦長の画面。論理解像度 720×1280） */
const screen = { width: 720, height: 1280 };

/**
 * 盤面のシーンを作る（乱数の関数 Math.random とタイトル画面を作る関数を渡す）。
 * @returns {Scene} 新しい盤面のシーン
 */
function createBoard() {
  return new BoardScene({ screen, layer: 'main', random: Math.random, createTitle });
}

/**
 * タイトル画面のシーンを作る。進む先は盤面のシーンを作る関数。
 * @returns {Scene} 新しいタイトル画面のシーン
 */
function createTitle() {
  return new TitleScene({ screen, layer: 'main', next: createBoard });
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
 * scene: 最初の画面は BOOT。BOOT の next はタイトル画面を作る関数、タイトル画面の next は盤面を作る関数で、盤面のシーンにはタイトル画面を作る関数を渡す（決着後は TITLE へ戻り、BOOT へは戻らない）。
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

// 起動の前の準備: SE の音量を設定し、効果音を読み込み終えてから Engine.start を呼ぶ（盤面で鳴らす音が未ロードにならないようにする）
Sound.seVolume = SE_VOLUME;
await Assets.load({ sounds: SOUND_FILES });

Engine.start(config);
