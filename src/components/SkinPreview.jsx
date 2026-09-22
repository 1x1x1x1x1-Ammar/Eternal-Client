import { useEffect, useRef, useState } from 'react';

export default function SkinPreview({ url, variant = 'classic', back = false }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const canvas = ref.current, ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!url) return;
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      ctx.imageSmoothingEnabled = false;
      const arm = variant === 'slim' ? 3 : 4;
      const draw = (sx, sy, w, h, x, y) => ctx.drawImage(image, sx, sy, w, h, x * 7, y * 7, w * 7, h * 7);
      const face = back ? 24 : 8;
      draw(face, 8, 8, 8, 10, 2); draw(face + 32, 8, 8, 8, 10, 2);
      draw(back ? 32 : 20, 20, 8, 12, 10, 10);
      draw(back ? 12 : 4, 20, 4, 12, 10, 22);
      draw(back ? 48 + arm : 44, 20, arm, 12, 10 - arm, 10);
      const modern = image.height === 64;
      draw(modern ? (back ? 28 : 20) : (back ? 12 : 4), modern ? 52 : 20, 4, 12, 14, 22);
      draw(modern ? (back ? 40 + arm : 36) : (back ? 48 + arm : 44), modern ? 52 : 20, arm, 12, 18, 10);
      if (modern) {
        draw(back ? 32 : 20, 36, 8, 12, 10, 10);
        draw(back ? 48 + arm : 44, 36, arm, 12, 10 - arm, 10);
        draw(back ? 56 + arm : 52, 52, arm, 12, 18, 10);
        draw(back ? 12 : 4, 36, 4, 12, 10, 22);
        draw(back ? 12 : 4, 52, 4, 12, 14, 22);
      }
    };
    image.onerror = () => !cancelled && setFailed(true);
    image.src = url;
    return () => { cancelled = true; };
  }, [url, variant, back]);
  return <div className="skin-preview"><canvas ref={ref} width={196} height={252} aria-label={`${back ? 'Back' : 'Front'} of Minecraft skin`}/>{(!url || failed) && <span>{failed ? 'Preview unavailable' : 'Choose a skin PNG'}</span>}</div>;
}
