import { useEffect, useRef } from 'react';

function drawPart(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh) {
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function fallback(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#090b0e';
  ctx.fillRect(0, 0, width, height);
  const cx = width / 2;
  ctx.fillStyle = '#171a20';
  ctx.fillRect(cx - 28, 44, 56, 56);
  ctx.fillRect(cx - 28, 102, 56, 92);
  ctx.fillRect(cx - 56, 102, 26, 92);
  ctx.fillRect(cx + 30, 102, 26, 92);
  ctx.fillRect(cx - 28, 196, 26, 92);
  ctx.fillRect(cx + 2, 196, 26, 92);
  ctx.fillStyle = '#ff3d46';
  ctx.fillRect(cx - 28, 44, 5, 244);
  ctx.fillStyle = '#f5f6f8';
  ctx.font = '900 34px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('E', cx, 82);
}

export default function MinecraftSkinPreview({ dataUrl = '', variant = 'classic', className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    fallback(ctx, canvas.width, canvas.height);
    if (!dataUrl) return undefined;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const scale = 7;
      const arm = String(variant).toLowerCase() === 'slim' ? 3 : 4;
      const bodyX = Math.round((canvas.width - (8 + arm * 2) * scale) / 2);
      const headX = Math.round((canvas.width - 8 * scale) / 2);
      const top = 18;
      const headY = top;
      const torsoY = headY + 8 * scale + 4;
      const legY = torsoY + 12 * scale + 4;

      // Front body base layers.
      drawPart(ctx, image, 8, 8, 8, 8, headX, headY, 8 * scale, 8 * scale);
      drawPart(ctx, image, 20, 20, 8, 12, bodyX + arm * scale, torsoY, 8 * scale, 12 * scale);
      drawPart(ctx, image, 44, 20, arm, 12, bodyX, torsoY, arm * scale, 12 * scale);
      drawPart(ctx, image, 36, 52, arm, 12, bodyX + (arm + 8) * scale, torsoY, arm * scale, 12 * scale);
      drawPart(ctx, image, 4, 20, 4, 12, bodyX + arm * scale, legY, 4 * scale, 12 * scale);
      drawPart(ctx, image, 20, 52, 4, 12, bodyX + (arm + 4) * scale, legY, 4 * scale, 12 * scale);

      // Front overlay layers. Transparent pixels preserve the base layer.
      drawPart(ctx, image, 40, 8, 8, 8, headX, headY, 8 * scale, 8 * scale);
      if (image.height >= 64) {
        drawPart(ctx, image, 20, 36, 8, 12, bodyX + arm * scale, torsoY, 8 * scale, 12 * scale);
        drawPart(ctx, image, 44, 36, arm, 12, bodyX, torsoY, arm * scale, 12 * scale);
        drawPart(ctx, image, 52, 52, arm, 12, bodyX + (arm + 8) * scale, torsoY, arm * scale, 12 * scale);
        drawPart(ctx, image, 4, 36, 4, 12, bodyX + arm * scale, legY, 4 * scale, 12 * scale);
        drawPart(ctx, image, 4, 52, 4, 12, bodyX + (arm + 4) * scale, legY, 4 * scale, 12 * scale);
      }
    };
    image.onerror = () => !cancelled && fallback(ctx, canvas.width, canvas.height);
    image.src = dataUrl;
    return () => { cancelled = true; };
  }, [dataUrl, variant]);

  return <canvas ref={ref} width="188" height="306" className={`minecraft-skin-preview ${className}`} aria-label="Minecraft skin preview"/>;
}
