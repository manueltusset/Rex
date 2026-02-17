import { invoke } from "@tauri-apps/api/core";

// Canvas @2x para Retina (44px = 22pt na barra de menu)
const CANVAS_HEIGHT = 44;
const CANVAS_WIDTH = 148;

// Logo
const LOGO_SIZE = 32;
const LOGO_X = 2;
const LOGO_Y = 6;

// Circulos individuais
const RADIUS = 15;
const STROKE = 3;
const CY = CANVAS_HEIGHT / 2;
const CIRCLES = [
  { cx: 54, color: "#10b981", track: "rgba(16, 185, 129, 0.25)" },   // Session
  { cx: 88, color: "#a78bfa", track: "rgba(167, 139, 250, 0.25)" },  // Weekly
  { cx: 122, color: "#60a5fa", track: "rgba(96, 165, 250, 0.25)" },  // Sonnet
];

function effectiveColor(pct: number, baseColor: string): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 80) return "#f59e0b";
  return baseColor;
}

function drawCircleProgress(
  ctx: CanvasRenderingContext2D,
  cx: number,
  pct: number,
  config: typeof CIRCLES[0],
) {
  // Track
  ctx.beginPath();
  ctx.arc(cx, CY, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = config.track;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.stroke();

  // Arco de progresso
  if (pct > 0) {
    const endAngle = -Math.PI / 2 + (Math.min(pct, 100) / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, CY, RADIUS, -Math.PI / 2, endAngle, false);
    ctx.strokeStyle = effectiveColor(pct, config.color);
    ctx.lineWidth = STROKE;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Texto percentual
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(Math.round(pct)), cx, CY + 1);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Cache para evitar re-rendering desnecessario
let lastKey = "";

export async function renderTrayIcon(
  fiveHour: number,
  sevenDay: number,
  sonnet: number,
): Promise<void> {
  const key = `${Math.round(fiveHour)}_${Math.round(sevenDay)}_${Math.round(sonnet)}`;
  if (key === lastKey) return;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Logo do Rex
    try {
      const logo = await loadImage("/rex-logo.png");
      ctx.drawImage(logo, LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // Logo nao disponivel
    }

    // 3 circulos de progresso com % dentro
    const values = [fiveHour, sevenDay, sonnet];
    CIRCLES.forEach((circle, i) => {
      drawCircleProgress(ctx, circle.cx, values[i], circle);
    });

    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const rgba = Array.from(imageData.data);

    await invoke("update_tray_icon", {
      rgba,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    lastKey = key;
  } catch {
    // Fallback silencioso
  }
}
