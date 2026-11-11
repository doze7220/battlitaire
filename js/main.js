/**
 * 責務: Engine.start の呼び出しと、レイヤーと最初の画面の流れ（boot 画面と次の画面）の定義を行う利用側のエントリポイント。
 */
import { Engine, Scene } from 'oz';
import { BootScene } from './scenes/BootScene.js';
import { BoardScene } from './scenes/BoardScene.js';

/** 解像度（縦長の画面。論理解像度 720×1280） */
const screen = { width: 720, height: 1280 };

/**
 * 盤面のシーンを作る（乱数の関数 Math.random とタイトルを作る関数を渡す）。
 * @returns {Scene} 新しい盤面のシーン
 */
function createBoard() {
  return new BoardScene({ screen, layer: 'main', random: Math.random, createTitle });
}

/**
 * タイトルの画面（boot 画面）を作る。進む先は盤面のシーンを作る関数。
 * @returns {Scene} 新しいタイトルの画面
 */
function createTitle() {
  return new BootScene({ screen, layer: 'main', next: createBoard });
}

/**
 * Engine.start に渡す設定。tickRate は書かない（既定の 60）。
 * scene: 最初の画面はタイトル（boot 画面）。決着後もここへ戻る。タイトルの next は盤面のシーンを作る関数で、盤面のシーンにはタイトルを作る関数を渡す。
 * virtualPad: バーチャルパッドを使うなら true。false にすると表示も画像の読み込みもしない（今は使わないので false）。
 * @type {{canvas: HTMLCanvasElement, width: number, height: number, layers: string[], scene: Scene, debug?: boolean, virtualPad?: boolean}}
 */
const config = {
  canvas: document.querySelector('canvas'),
  width: screen.width,
  height: screen.height,
  layers: ['main'],
  scene: createTitle(),
  virtualPad: false,
};

Engine.start(config);
