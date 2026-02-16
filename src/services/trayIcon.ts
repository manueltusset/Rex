import { invoke } from "@tauri-apps/api/core";

// Canvas @2x para Retina (44px = 22pt na barra de menu)
const ICON_SIZE = 36;
const ICON_X = 1;
const ICON_Y = 4;
const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 44;
const RADIUS = 17;
const STROKE = 3;
const TRACK_COLOR = "rgba(100, 116, 139, 0.4)";

// Circulos posicionados apos o logo
const CIRCLES = [
  { cx: 58, cy: 22 },
  { cx: 98, cy: 22 },
];

function arcColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 80) return "#f59e0b";
  if (pct >= 60) return "#34d399";
  return "#10b981";
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: string,
  lineWidth: number,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle, false);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawCircleProgress(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  pct: number,
) {
  // Track
  drawArc(ctx, cx, cy, RADIUS, 0, Math.PI * 2, TRACK_COLOR, STROKE);

  // Arco de progresso (comeca do topo: -PI/2)
  if (pct > 0) {
    const endAngle = -Math.PI / 2 + (pct / 100) * Math.PI * 2;
    drawArc(ctx, cx, cy, RADIUS, -Math.PI / 2, endAngle, arcColor(pct), STROKE);
  }

  // Texto (numero sem %)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(Math.round(pct)), cx, cy + 1);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function renderTrayIcon(
  fiveHour: number,
  sevenDay: number,
): Promise<void> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo transparente
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Desenha logo do Rex
    try {
      const logo = await loadImage("/rex-logo.png");
      ctx.drawImage(logo, ICON_X, ICON_Y, ICON_SIZE, ICON_SIZE);
    } catch {
      // Logo nao disponivel, continua sem ele
    }

    // Desenha os dois circulos de progresso
    drawCircleProgress(ctx, CIRCLES[0].cx, CIRCLES[0].cy, fiveHour);
    drawCircleProgress(ctx, CIRCLES[1].cx, CIRCLES[1].cy, sevenDay);

    // Extrai pixels RGBA
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const rgba = Array.from(imageData.data);

    await invoke("update_tray_icon", {
      rgba,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });
  } catch {
    // Fallback silencioso
  }
}
