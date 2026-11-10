/**
 * 責務: Engine.start の呼び出しと、レイヤーと最初の画面の流れ（boot 画面と次の画面）の定義を行う利用側のエントリポイント。
 */
import { Engine, Scene } from 'oz';
import { BootScene } from './scenes/BootScene.js';
import { BoardScene } from './scenes/BoardScene.js';

/** 解像度 */
const screen = { width: 1280, height: 720 };

/**
 * Engine.start に渡す設定。tickRate は書かない（既定の 60）。
 * scene: 最初の画面は boot 画面。next が次に進む画面（盤面のシーン）を作る関数で、乱数の関数 Math.random をここから渡す。
 * virtualPad: バーチャルパッドを使うなら true。false にすると表示も画像の読み込みもしない（今は使わないので false）。
 * @type {{canvas: HTMLCanvasElement, width: number, height: number, layers: string[], scene: Scene, debug?: boolean, virtualPad?: boolean}}
 */
const config = {
  canvas: document.querySelector('canvas'),
  width: screen.width,
  height: screen.height,
  layers: ['main'],
  scene: new BootScene({ screen, layer: 'main', next: () => new BoardScene({ screen, layer: 'main', random: Math.random }) }),
  virtualPad: false,
};


Engine.start(config);
