/**
 * OZ Vector Editor 形式のスプライト（ESモジュール）。他のファイルに依存しない。
 * 既定のexportは、スプライトデータと draw(ctx) を持つ1つのオブジェクト（単位px、基準点は原点、y軸は下向き）。
 * 「STAGE」のロゴの仮のスプライト（原点が絵の中心）で、OZ Vector Editor で描き直して差し替える。
 */
const spriteData = {
  "format": "oz-vector-editor-sprite",
  "formatVersion": 2,
  "bounds": {
    "minX": -117,
    "minY": -38,
    "maxX": 117,
    "maxY": 38
  },
  "elements": [
    {
      "kind": "polyline",
      "id": "shape-1",
      "points": [
        {
          "x": -114,
          "y": -35
        },
        {
          "x": 114,
          "y": -35
        },
        {
          "x": 114,
          "y": 35
        },
        {
          "x": -114,
          "y": 35
        }
      ],
      "closed": true,
      "strokeColor": "#ffffff",
      "strokeWidth": 6,
      "fillColor": "#c2410c"
    },
    {
      "kind": "polyline",
      "id": "shape-2",
      "points": [
        {
          "x": -62,
          "y": -21
        },
        {
          "x": -90,
          "y": -21
        },
        {
          "x": -90,
          "y": 0
        },
        {
          "x": -62,
          "y": 0
        },
        {
          "x": -62,
          "y": 21
        },
        {
          "x": -90,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-3",
      "points": [
        {
          "x": -52,
          "y": -21
        },
        {
          "x": -24,
          "y": -21
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-4",
      "points": [
        {
          "x": -38,
          "y": -21
        },
        {
          "x": -38,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-5",
      "points": [
        {
          "x": -14,
          "y": 21
        },
        {
          "x": -14,
          "y": -14
        },
        {
          "x": -7,
          "y": -21
        },
        {
          "x": 7,
          "y": -21
        },
        {
          "x": 14,
          "y": -14
        },
        {
          "x": 14,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-6",
      "points": [
        {
          "x": -14,
          "y": 0
        },
        {
          "x": 14,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-7",
      "points": [
        {
          "x": 52,
          "y": -14
        },
        {
          "x": 52,
          "y": -21
        },
        {
          "x": 24,
          "y": -21
        },
        {
          "x": 24,
          "y": 21
        },
        {
          "x": 52,
          "y": 21
        },
        {
          "x": 52,
          "y": 0
        },
        {
          "x": 38,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-8",
      "points": [
        {
          "x": 90,
          "y": -21
        },
        {
          "x": 62,
          "y": -21
        },
        {
          "x": 62,
          "y": 21
        },
        {
          "x": 90,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-9",
      "points": [
        {
          "x": 62,
          "y": 0
        },
        {
          "x": 83,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#3d1303",
      "strokeWidth": 15,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-10",
      "points": [
        {
          "x": -62,
          "y": -21
        },
        {
          "x": -90,
          "y": -21
        },
        {
          "x": -90,
          "y": 0
        },
        {
          "x": -62,
          "y": 0
        },
        {
          "x": -62,
          "y": 21
        },
        {
          "x": -90,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-11",
      "points": [
        {
          "x": -52,
          "y": -21
        },
        {
          "x": -24,
          "y": -21
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-12",
      "points": [
        {
          "x": -38,
          "y": -21
        },
        {
          "x": -38,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-13",
      "points": [
        {
          "x": -14,
          "y": 21
        },
        {
          "x": -14,
          "y": -14
        },
        {
          "x": -7,
          "y": -21
        },
        {
          "x": 7,
          "y": -21
        },
        {
          "x": 14,
          "y": -14
        },
        {
          "x": 14,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-14",
      "points": [
        {
          "x": -14,
          "y": 0
        },
        {
          "x": 14,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-15",
      "points": [
        {
          "x": 52,
          "y": -14
        },
        {
          "x": 52,
          "y": -21
        },
        {
          "x": 24,
          "y": -21
        },
        {
          "x": 24,
          "y": 21
        },
        {
          "x": 52,
          "y": 21
        },
        {
          "x": 52,
          "y": 0
        },
        {
          "x": 38,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-16",
      "points": [
        {
          "x": 90,
          "y": -21
        },
        {
          "x": 62,
          "y": -21
        },
        {
          "x": 62,
          "y": 21
        },
        {
          "x": 90,
          "y": 21
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
    },
    {
      "kind": "polyline",
      "id": "shape-17",
      "points": [
        {
          "x": 62,
          "y": 0
        },
        {
          "x": 83,
          "y": 0
        }
      ],
      "closed": false,
      "strokeColor": "#ffffff",
      "strokeWidth": 9,
      "fillColor": null
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
            "x": -114,
            "y": -35
          },
          {
            "x": 114,
            "y": -35
          },
          {
            "x": 114,
            "y": 35
          },
          {
            "x": -114,
            "y": 35
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
        "strokeColor": "#ffffff",
        "strokeWidth": 6,
        "fillColor": "#c2410c"
      },
      {
        "type": "path",
        "id": "shape-2",
        "points": [
          {
            "x": -62,
            "y": -21
          },
          {
            "x": -90,
            "y": -21
          },
          {
            "x": -90,
            "y": 0
          },
          {
            "x": -62,
            "y": 0
          },
          {
            "x": -62,
            "y": 21
          },
          {
            "x": -90,
            "y": 21
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-3",
        "points": [
          {
            "x": -52,
            "y": -21
          },
          {
            "x": -24,
            "y": -21
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-4",
        "points": [
          {
            "x": -38,
            "y": -21
          },
          {
            "x": -38,
            "y": 21
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-5",
        "points": [
          {
            "x": -14,
            "y": 21
          },
          {
            "x": -14,
            "y": -14
          },
          {
            "x": -7,
            "y": -21
          },
          {
            "x": 7,
            "y": -21
          },
          {
            "x": 14,
            "y": -14
          },
          {
            "x": 14,
            "y": 21
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-6",
        "points": [
          {
            "x": -14,
            "y": 0
          },
          {
            "x": 14,
            "y": 0
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-7",
        "points": [
          {
            "x": 52,
            "y": -14
          },
          {
            "x": 52,
            "y": -21
          },
          {
            "x": 24,
            "y": -21
          },
          {
            "x": 24,
            "y": 21
          },
          {
            "x": 52,
            "y": 21
          },
          {
            "x": 52,
            "y": 0
          },
          {
            "x": 38,
            "y": 0
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-8",
        "points": [
          {
            "x": 90,
            "y": -21
          },
          {
            "x": 62,
            "y": -21
          },
          {
            "x": 62,
            "y": 21
          },
          {
            "x": 90,
            "y": 21
          }
        ],
        "closed": false,
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
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-9",
        "points": [
          {
            "x": 62,
            "y": 0
          },
          {
            "x": 83,
            "y": 0
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#3d1303",
        "strokeWidth": 15,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-10",
        "points": [
          {
            "x": -62,
            "y": -21
          },
          {
            "x": -90,
            "y": -21
          },
          {
            "x": -90,
            "y": 0
          },
          {
            "x": -62,
            "y": 0
          },
          {
            "x": -62,
            "y": 21
          },
          {
            "x": -90,
            "y": 21
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-11",
        "points": [
          {
            "x": -52,
            "y": -21
          },
          {
            "x": -24,
            "y": -21
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-12",
        "points": [
          {
            "x": -38,
            "y": -21
          },
          {
            "x": -38,
            "y": 21
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-13",
        "points": [
          {
            "x": -14,
            "y": 21
          },
          {
            "x": -14,
            "y": -14
          },
          {
            "x": -7,
            "y": -21
          },
          {
            "x": 7,
            "y": -21
          },
          {
            "x": 14,
            "y": -14
          },
          {
            "x": 14,
            "y": 21
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-14",
        "points": [
          {
            "x": -14,
            "y": 0
          },
          {
            "x": 14,
            "y": 0
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-15",
        "points": [
          {
            "x": 52,
            "y": -14
          },
          {
            "x": 52,
            "y": -21
          },
          {
            "x": 24,
            "y": -21
          },
          {
            "x": 24,
            "y": 21
          },
          {
            "x": 52,
            "y": 21
          },
          {
            "x": 52,
            "y": 0
          },
          {
            "x": 38,
            "y": 0
          }
        ],
        "closed": false,
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
          },
          {
            "kind": "line"
          },
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-16",
        "points": [
          {
            "x": 90,
            "y": -21
          },
          {
            "x": 62,
            "y": -21
          },
          {
            "x": 62,
            "y": 21
          },
          {
            "x": 90,
            "y": 21
          }
        ],
        "closed": false,
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
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
      },
      {
        "type": "path",
        "id": "shape-17",
        "points": [
          {
            "x": 62,
            "y": 0
          },
          {
            "x": 83,
            "y": 0
          }
        ],
        "closed": false,
        "segments": [
          {
            "kind": "line"
          }
        ],
        "strokeColor": "#ffffff",
        "strokeWidth": 9,
        "fillColor": null
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
