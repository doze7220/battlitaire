/**
 * 狼の仮のスプライト（左向き。原点は体の中ほど、足元は範囲の下端）。
 * 手で書いた仮のスプライトで、source を持つため OZ Vector Editor の「開く」で開ける（エディタの書き出しに差し替える予定）。
 * 既定のexportは、スプライトデータ（format・formatVersion・bounds・elements・source）と描く draw(ctx)。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 2,
  "bounds": {
    "minX": -157,
    "minY": -107,
    "maxX": 152,
    "maxY": 110
  },
  "elements": [
    {
      "kind": "polyline",
      "id": "shape-1",
      "points": [
        {
          "x": 100,
          "y": -15
        },
        {
          "x": 150,
          "y": -75
        },
        {
          "x": 145,
          "y": -20
        },
        {
          "x": 118,
          "y": 25
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#5f656e"
    },
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": 70,
          "y": 40
        },
        {
          "x": 95,
          "y": 40
        },
        {
          "x": 92,
          "y": 108
        },
        {
          "x": 60,
          "y": 108
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#5f656e"
    },
    {
      "kind": "polyline",
      "id": "shape-3",
      "points": [
        {
          "x": -20,
          "y": 40
        },
        {
          "x": 5,
          "y": 40
        },
        {
          "x": 5,
          "y": 108
        },
        {
          "x": -30,
          "y": 108
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#5f656e"
    },
    {
      "kind": "ellipse",
      "id": "shape-4",
      "x": 30,
      "y": 0,
      "radiusX": 100,
      "radiusY": 55,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#8d939c"
    },
    {
      "kind": "polyline",
      "id": "shape-5",
      "points": [
        {
          "x": 80,
          "y": 40
        },
        {
          "x": 105,
          "y": 40
        },
        {
          "x": 108,
          "y": 108
        },
        {
          "x": 75,
          "y": 108
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#8d939c"
    },
    {
      "kind": "polyline",
      "id": "shape-6",
      "points": [
        {
          "x": -45,
          "y": 40
        },
        {
          "x": -20,
          "y": 40
        },
        {
          "x": -15,
          "y": 108
        },
        {
          "x": -52,
          "y": 108
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#8d939c"
    },
    {
      "kind": "polyline",
      "id": "shape-7",
      "points": [
        {
          "x": -100,
          "y": -50
        },
        {
          "x": -92,
          "y": -105
        },
        {
          "x": -62,
          "y": -58
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#5f656e"
    },
    {
      "kind": "polyline",
      "id": "shape-8",
      "points": [
        {
          "x": -62,
          "y": -55
        },
        {
          "x": -40,
          "y": -98
        },
        {
          "x": -30,
          "y": -45
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#5f656e"
    },
    {
      "kind": "ellipse",
      "id": "shape-9",
      "x": -85,
      "y": -15,
      "radiusX": 50,
      "radiusY": 42,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#8d939c"
    },
    {
      "kind": "polyline",
      "id": "shape-10",
      "points": [
        {
          "x": -115,
          "y": -32
        },
        {
          "x": -150,
          "y": -8
        },
        {
          "x": -145,
          "y": 15
        },
        {
          "x": -100,
          "y": 22
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#8d939c"
    },
    {
      "kind": "polyline",
      "id": "shape-11",
      "points": [
        {
          "x": -140,
          "y": 14
        },
        {
          "x": -130,
          "y": 32
        },
        {
          "x": -122,
          "y": 18
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 3,
      "fillColor": "#ffffff"
    },
    {
      "kind": "polyline",
      "id": "shape-12",
      "points": [
        {
          "x": -118,
          "y": 20
        },
        {
          "x": -110,
          "y": 38
        },
        {
          "x": -102,
          "y": 22
        }
      ],
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 3,
      "fillColor": "#ffffff"
    },
    {
      "kind": "ellipse",
      "id": "shape-13",
      "x": -148,
      "y": -8,
      "radiusX": 7,
      "radiusY": 6,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#000000"
    },
    {
      "kind": "ellipse",
      "id": "shape-14",
      "x": -90,
      "y": -28,
      "radiusX": 6,
      "radiusY": 6,
      "startAngle": 0,
      "endAngle": 6.283185307179586,
      "closed": true,
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "fillColor": "#000000"
    }
  ],
  "source": {
    "format": "oz-vector-editor",
    "version": 2,
    "shapes": [
      {
        "type": "path",
        "id": "shape-1",
        "points": [
          {
            "x": 100,
            "y": -15
          },
          {
            "x": 150,
            "y": -75
          },
          {
            "x": 145,
            "y": -20
          },
          {
            "x": 118,
            "y": 25
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
        "fillColor": "#5f656e"
      },
      {
        "type": "path",
        "id": "shape-2",
        "points": [
          {
            "x": 70,
            "y": 40
          },
          {
            "x": 95,
            "y": 40
          },
          {
            "x": 92,
            "y": 108
          },
          {
            "x": 60,
            "y": 108
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
        "fillColor": "#5f656e"
      },
      {
        "type": "path",
        "id": "shape-3",
        "points": [
          {
            "x": -20,
            "y": 40
          },
          {
            "x": 5,
            "y": 40
          },
          {
            "x": 5,
            "y": 108
          },
          {
            "x": -30,
            "y": 108
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
        "fillColor": "#5f656e"
      },
      {
        "type": "circle",
        "id": "shape-4",
        "points": [
          {
            "x": 30,
            "y": 0
          },
          {
            "x": 130,
            "y": 0
          },
          {
            "x": 30,
            "y": -55
          },
          {
            "x": 130,
            "y": 0
          },
          {
            "x": 130,
            "y": 0
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#8d939c"
      },
      {
        "type": "path",
        "id": "shape-5",
        "points": [
          {
            "x": 80,
            "y": 40
          },
          {
            "x": 105,
            "y": 40
          },
          {
            "x": 108,
            "y": 108
          },
          {
            "x": 75,
            "y": 108
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
        "fillColor": "#8d939c"
      },
      {
        "type": "path",
        "id": "shape-6",
        "points": [
          {
            "x": -45,
            "y": 40
          },
          {
            "x": -20,
            "y": 40
          },
          {
            "x": -15,
            "y": 108
          },
          {
            "x": -52,
            "y": 108
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
        "fillColor": "#8d939c"
      },
      {
        "type": "path",
        "id": "shape-7",
        "points": [
          {
            "x": -100,
            "y": -50
          },
          {
            "x": -92,
            "y": -105
          },
          {
            "x": -62,
            "y": -58
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
        "fillColor": "#5f656e"
      },
      {
        "type": "path",
        "id": "shape-8",
        "points": [
          {
            "x": -62,
            "y": -55
          },
          {
            "x": -40,
            "y": -98
          },
          {
            "x": -30,
            "y": -45
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
        "fillColor": "#5f656e"
      },
      {
        "type": "circle",
        "id": "shape-9",
        "points": [
          {
            "x": -85,
            "y": -15
          },
          {
            "x": -35,
            "y": -15
          },
          {
            "x": -85,
            "y": -57
          },
          {
            "x": -35,
            "y": -15
          },
          {
            "x": -35,
            "y": -15
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#8d939c"
      },
      {
        "type": "path",
        "id": "shape-10",
        "points": [
          {
            "x": -115,
            "y": -32
          },
          {
            "x": -150,
            "y": -8
          },
          {
            "x": -145,
            "y": 15
          },
          {
            "x": -100,
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
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#8d939c"
      },
      {
        "type": "path",
        "id": "shape-11",
        "points": [
          {
            "x": -140,
            "y": 14
          },
          {
            "x": -130,
            "y": 32
          },
          {
            "x": -122,
            "y": 18
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
        "strokeWidth": 3,
        "fillColor": "#ffffff"
      },
      {
        "type": "path",
        "id": "shape-12",
        "points": [
          {
            "x": -118,
            "y": 20
          },
          {
            "x": -110,
            "y": 38
          },
          {
            "x": -102,
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
        "strokeWidth": 3,
        "fillColor": "#ffffff"
      },
      {
        "type": "circle",
        "id": "shape-13",
        "points": [
          {
            "x": -148,
            "y": -8
          },
          {
            "x": -141,
            "y": -8
          },
          {
            "x": -148,
            "y": -14
          },
          {
            "x": -141,
            "y": -8
          },
          {
            "x": -141,
            "y": -8
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#000000"
      },
      {
        "type": "circle",
        "id": "shape-14",
        "points": [
          {
            "x": -90,
            "y": -28
          },
          {
            "x": -84,
            "y": -28
          },
          {
            "x": -90,
            "y": -34
          },
          {
            "x": -84,
            "y": -28
          },
          {
            "x": -84,
            "y": -28
          }
        ],
        "strokeColor": "#000000",
        "strokeWidth": 4,
        "fillColor": "#000000"
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
