import { useEffect, useRef } from 'react';

const fallbackPalette = ['#2a0c0e', '#301014', '#241014', '#351116'];

function paintFallback(ctx, username, size) {
  const seed = [...String(username || '?')].reduce((n, c) => n + c.charCodeAt(0), 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = fallbackPalette[seed % fallbackPalette.length];
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ff4149';
  ctx.fillRect(0, 0, size, 3);
  ctx.fillStyle = '#f3f3f5';
  ctx.font = `800 ${Math.floor(size * 0.48)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(username || '?').slice(0, 1).toUpperCase(), size / 2, size / 2 + 1);
}

export default function MinecraftHead({ skinUrl = '', username = '?', size = 36, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    paintFallback(ctx, username, size);
    if (!skinUrl) return undefined;

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      try {
        ctx.clearRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 8, 8, 8, 8, 0, 0, size, size);
        // Hat/helmet layer. Transparent pixels preserve the base face.
        ctx.drawImage(image, 40, 8, 8, 8, 0, 0, size, size);
      } catch {
        paintFallback(ctx, username, size);
      }
    };
    image.onerror = () => !cancelled && paintFallback(ctx, username, size);
    image.src = skinUrl;
    return () => { cancelled = true; };
  }, [skinUrl, username, size]);

  return <canvas ref={canvasRef} width={size} height={size} className={`minecraft-head ${className}`} aria-label={`${username} Minecraft avatar`} />;
}
