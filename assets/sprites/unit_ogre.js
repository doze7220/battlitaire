/**
 * オーガの仮のスプライト（原点は体の中ほど。ゴブリンと同じ枠）。
 * 手で書いた仮のスプライトで、source を持つため OZ Vector Editor の「開く」で開ける（エディタの書き出しに差し替える予定）。
 * 既定のexportは、スプライトデータ（format・formatVersion・bounds・elements・source）と描く draw(ctx)。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 2,
  "bounds": {
    "minX": -106,
    "minY": -105,
    "maxX": 106,
    "maxY": 105
  },
  "elements": [
    {
      "kind": "ellipse",
      "id": "shape-1",
      "x": 0,
      "y": 0,
      "radiusX": 98,
      "radiusY": 97,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 16,
      "fillColor": "#a0522d"
    },
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": -58,
          "y": -52
        },
        {
          "x": -26,
          "y": -52
        },
        {
          "x": -42,
          "y": -80
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#f0e0b0"
    },
    {
      "kind": "polyline",
      "id": "shape-3",
      "points": [
        {
          "x": 26,
          "y": -52
        },
        {
          "x": 58,
          "y": -52
        },
        {
          "x": 42,
          "y": -80
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#f0e0b0"
    },
    {
      "kind": "ellipse",
      "id": "shape-4",
      "x": -36,
      "y": 2,
      "radiusX": 16,
      "radiusY": 14,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#ffffff"
    },
    {
      "kind": "ellipse",
      "id": "shape-5",
      "x": 36,
      "y": 2,
      "radiusX": 16,
      "radiusY": 14,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#ffffff"
    },
    {
      "kind": "ellipse",
      "id": "shape-6",
      "x": -32,
      "y": 4,
      "radiusX": 7,
      "radiusY": 7,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 2,
      "fillColor": "#000000"
    },
    {
      "kind": "ellipse",
      "id": "shape-7",
      "x": 32,
      "y": 4,
      "radiusX": 7,
      "radiusY": 7,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 2,
      "fillColor": "#000000"
    },
    {
      "kind": "polyline",
      "id": "shape-8",
      "points": [
        {
          "x": -70,
          "y": -34
        },
        {
          "x": -10,
          "y": -8
        },
        {
          "x": -10,
          "y": 8
        },
        {
          "x": -70,
          "y": -18
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#000000"
    },
    {
      "kind": "polyline",
      "id": "shape-9",
      "points": [
        {
          "x": 70,
          "y": -34
        },
        {
          "x": 10,
          "y": -8
        },
        {
          "x": 10,
          "y": 8
        },
        {
          "x": 70,
          "y": -18
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#000000"
    },
    {
      "kind": "polyline",
      "id": "shape-10",
      "points": [
        {
          "x": -50,
          "y": 38
        },
        {
          "x": 50,
          "y": 38
        },
        {
          "x": 50,
          "y": 62
        },
        {
          "x": -50,
          "y": 62
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#3a0d0d"
    },
    {
      "kind": "polyline",
      "id": "shape-11",
      "points": [
        {
          "x": -46,
          "y": 58
        },
        {
          "x": -16,
          "y": 58
        },
        {
          "x": -31,
          "y": 22
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#f0e0b0"
    },
    {
      "kind": "polyline",
      "id": "shape-12",
      "points": [
        {
          "x": 16,
          "y": 58
        },
        {
          "x": 46,
          "y": 58
        },
        {
          "x": 31,
          "y": 22
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#f0e0b0"
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 2,
    "shapes": [
      {
        "type": "circle",
        "id": "shape-1",
        "points": [
          {
            "x": 0,
            "y": 0
          },
          {
            "x": 98,
            "y": 0
          },
          {
            "x": 0,
            "y": -97
          },
          {
            "x": 98,
            "y": 0
          },
          {
            "x": 98,
            "y": 0
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 16,
        "fillColor": "#a0522d"
      },
      {
        "type": "path",
        "id": "shape-2",
        "points": [
          {
            "x": -58,
            "y": -52
          },
          {
            "x": -26,
            "y": -52
          },
          {
            "x": -42,
            "y": -80
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#f0e0b0"
      },
      {
        "type": "path",
        "id": "shape-3",
        "points": [
          {
            "x": 26,
            "y": -52
          },
          {
            "x": 58,
            "y": -52
          },
          {
            "x": 42,
            "y": -80
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#f0e0b0"
      },
      {
        "type": "circle",
        "id": "shape-4",
        "points": [
          {
            "x": -36,
            "y": 2
          },
          {
            "x": -20,
            "y": 2
          },
          {
            "x": -36,
            "y": -12
          },
          {
            "x": -20,
            "y": 2
          },
          {
            "x": -20,
            "y": 2
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#ffffff"
      },
      {
        "type": "circle",
        "id": "shape-5",
        "points": [
          {
            "x": 36,
            "y": 2
          },
          {
            "x": 52,
            "y": 2
          },
          {
            "x": 36,
            "y": -12
          },
          {
            "x": 52,
            "y": 2
          },
          {
            "x": 52,
            "y": 2
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#ffffff"
      },
      {
        "type": "circle",
        "id": "shape-6",
        "points": [
          {
            "x": -32,
            "y": 4
          },
          {
            "x": -25,
            "y": 4
          },
          {
            "x": -32,
            "y": -3
          },
          {
            "x": -25,
            "y": 4
          },
          {
            "x": -25,
            "y": 4
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 2,
        "fillColor": "#000000"
      },
      {
        "type": "circle",
        "id": "shape-7",
        "points": [
          {
            "x": 32,
            "y": 4
          },
          {
            "x": 39,
            "y": 4
          },
          {
            "x": 32,
            "y": -3
          },
          {
            "x": 39,
            "y": 4
          },
          {
            "x": 39,
            "y": 4
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 2,
        "fillColor": "#000000"
      },
      {
        "type": "path",
        "id": "shape-8",
        "points": [
          {
            "x": -70,
            "y": -34
          },
          {
            "x": -10,
            "y": -8
          },
          {
            "x": -10,
            "y": 8
          },
          {
            "x": -70,
            "y": -18
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#000000"
      },
      {
        "type": "path",
        "id": "shape-9",
        "points": [
          {
            "x": 70,
            "y": -34
          },
          {
            "x": 10,
            "y": -8
          },
          {
            "x": 10,
            "y": 8
          },
          {
            "x": 70,
            "y": -18
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#000000"
      },
      {
        "type": "path",
        "id": "shape-10",
        "points": [
          {
            "x": -50,
            "y": 38
          },
          {
            "x": 50,
            "y": 38
          },
          {
            "x": 50,
            "y": 62
          },
          {
            "x": -50,
            "y": 62
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#3a0d0d"
      },
      {
        "type": "path",
        "id": "shape-11",
        "points": [
          {
            "x": -46,
            "y": 58
          },
          {
            "x": -16,
            "y": 58
          },
          {
            "x": -31,
            "y": 22
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#f0e0b0"
      },
      {
        "type": "path",
        "id": "shape-12",
        "points": [
          {
            "x": 16,
            "y": 58
          },
          {
            "x": 46,
            "y": 58
          },
          {
            "x": 31,
            "y": 22
          }
        ],
        "closed": true,
        "segments": [
          {
            "kind": "line"
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#f0e0b0"
      }
    ]
  }
};

const DEFAULT_STROKE_WIDTH = 2;

/**
 * スプライトを ctx へ描く。ctx の現在の変換の上に、原点(0, 0)を基準に描く。呼び出し前後で ctx の状態は変わらない。
 * @param {CanvasRenderingContext2D} ctx - 描画先の2Dコンテキスト
 */
function draw(ctx) {
    ctx.save();
    try {
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 10;
        ctx.setLineDash([]);
        for (const element of spriteData.elements) {
            drawElement(ctx, element);
        }
    } finally {
        ctx.restore();
    }
}

/**
 * 描画要素1つの塗りと線を描く（パス → 塗り → 線の順）。
 * 塗るのは、fillColor が文字列で、かつ kind が polyline または ellipse で closed が true の要素だけ（fill() は引数なし）。
 * 線を描くのは strokeColor が文字列の要素だけ。どちらも描かない要素はパスも組み立てない。
 * 形の項目が足りない要素・未知の kind の要素は塗りも線も描かない。
 * @param {CanvasRenderingContext2D} ctx - 描画先の2Dコンテキスト
 * @param {Object} element - 描画要素
 */
function drawElement(ctx, element) {
    const shouldStroke = typeof element.strokeColor === 'string';
    const shouldFill = typeof element.fillColor === 'string' && element.closed === true
        && (element.kind === 'polyline' || element.kind === 'ellipse');
    if (!shouldStroke && !shouldFill) {
        return;
    }
    switch (element.kind) {
        case 'polyline': {
            const points = element.points;
            if (!Array.isArray(points) || points.length < 2) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            if (element.closed === true) {
                ctx.closePath();
            }
            break;
        }
        case 'quadratic': {
            const points = element.points;
            if (!Array.isArray(points) || points.length < 3) {
                return;
            }
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
            break;
        }
        case 'ellipse': {
            if (typeof element.radiusX !== 'number' || !(element.radiusX >= 0)
                || typeof element.radiusY !== 'number' || !(element.radiusY >= 0)) {
                return;
            }
            ctx.beginPath();
            ctx.ellipse(element.x, element.y, element.radiusX, element.radiusY, 0, element.startAngle, element.endAngle);
            if (element.closed === true) {
                ctx.closePath();
            }
            break;
        }
        default:
            return;
    }
    if (shouldFill) {
        ctx.fillStyle = element.fillColor;
        ctx.fill();
    }
    if (shouldStroke) {
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = typeof element.strokeWidth === 'number' && Number.isFinite(element.strokeWidth) && element.strokeWidth > 0
            ? element.strokeWidth
            : DEFAULT_STROKE_WIDTH;
        ctx.stroke();
    }
}

export default { ...spriteData, draw };
