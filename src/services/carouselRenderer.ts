import JSZip from 'jszip';
import { Player, StatCategory, BrandKit } from '../types';

export type GraphicFormat = '4:5' | '9:16' | '1:1';

export function getDimensions(format: GraphicFormat): { width: number; height: number } {
  switch (format) {
    case '4:5': return { width: 1080, height: 1350 };
    case '9:16': return { width: 1080, height: 1920 };
    case '1:1': return { width: 1080, height: 1080 };
  }
}

// Render a specific slide of a carousel
export function renderCarouselSlide(
  canvas: HTMLCanvasElement,
  slideIndex: number, // 0 = Cover, 1..N = Players, N+1 = Outro
  totalSlides: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  format: GraphicFormat = '4:5'
): void {
  const { width, height } = getDimensions(format);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  drawStaticBackground(ctx, width, height, brandKit);

  // Safe Header
  drawStaticBrandHeader(ctx, width, brandKit, `${slideIndex + 1}/${totalSlides}`);

  const rankingCount = Math.min(players.length, 10);

  if (slideIndex === 0) {
    // COVER SLIDE
    drawCoverSlide(ctx, width, height, players, statCategory, brandKit, rankingCount);
  } else if (slideIndex <= rankingCount) {
    // PLAYER SLIDE (1-indexed for players: slide 1 is player 1 or player 10 depending on design)
    const playerIndex = slideIndex - 1;
    const player = players[playerIndex];
    if (player) {
      drawPlayerSlide(ctx, width, height, player, playerIndex + 1, statCategory, brandKit);
    }
  } else {
    // OUTRO SLIDE
    drawOutroSlide(ctx, width, height, players, statCategory, brandKit, rankingCount);
  }

  // Footer
  drawStaticBrandFooter(ctx, width, height, brandKit);
}

// Render full Leaderboard (all players in a single image)
export function renderLeaderboardGraphic(
  canvas: HTMLCanvasElement,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  format: GraphicFormat = '9:16',
  count: number = 10
): void {
  const { width, height } = getDimensions(format);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const displayPlayers = players.slice(0, count);

  // Background
  drawStaticBackground(ctx, width, height, brandKit);

  // Header
  const topY = format === '9:16' ? 140 : 100;
  ctx.save();
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(brandKit.seasonTag.toUpperCase(), width / 2, topY);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 80px "Bebas Neue", sans-serif';
  ctx.fillText(`TOP ${count} · ${statCategory.label.toUpperCase()}`, width / 2, topY + 70);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${brandKit.brandName.toUpperCase()} · CLASIFICACIÓN OFICIAL`, width / 2, topY + 110);
  ctx.restore();

  // List container
  const startY = topY + 140;
  const availableH = height - startY - (format === '9:16' ? 140 : 100);
  const rowH = Math.min(availableH / count, 140);
  const paddingX = 60;
  const rowW = width - paddingX * 2;

  displayPlayers.forEach((player, idx) => {
    const rowY = startY + idx * rowH;
    const isFirst = idx === 0;

    ctx.save();

    // Row Card
    ctx.fillStyle = isFirst ? 'rgba(245, 158, 11, 0.16)' : 'rgba(18, 22, 32, 0.85)';
    ctx.strokeStyle = isFirst ? brandKit.primaryColor : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = isFirst ? 2 : 1;
    roundRect(ctx, paddingX, rowY + 6, rowW, rowH - 12, 16);
    ctx.fill();
    ctx.stroke();

    // Rank Number
    ctx.fillStyle = isFirst ? brandKit.primaryColor : '#ffffff';
    ctx.font = '900 38px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${idx + 1}`, paddingX + 45, rowY + rowH / 2 + 10);

    // Player Name & Team
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(player.name, paddingX + 90, rowY + rowH / 2 + 2);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${player.team} · ${player.position}`, paddingX + 90, rowY + rowH / 2 + 28);

    // Primary Stat Value
    const statVal = (player.stats[statCategory.id] || 0).toFixed(1);
    ctx.fillStyle = brandKit.primaryColor;
    ctx.font = '900 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(statVal, paddingX + rowW - 40, rowY + rowH / 2 + 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(statCategory.unit, paddingX + rowW - 40, rowY + rowH / 2 + 30);

    ctx.restore();
  });

  // Footer Watermark
  drawStaticBrandFooter(ctx, width, height, brandKit);
}

// Cover Slide for Carousel
function drawCoverSlide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  rankingCount: number
) {
  const midY = height * 0.44;

  ctx.save();

  // Highlight Box
  const boxW = width - 120;
  const boxH = height * 0.62;
  const boxX = 60;
  const boxY = height * 0.18;

  ctx.fillStyle = 'rgba(15, 20, 30, 0.88)';
  ctx.strokeStyle = hexToRgba(brandKit.primaryColor, 0.4);
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxW, boxH, 28);
  ctx.fill();
  ctx.stroke();

  // Kicker
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INFORME ESTADÍSTICO', width / 2, boxY + 80);

  // Huge Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 120px "Bebas Neue", sans-serif';
  ctx.fillText(`TOP ${rankingCount}`, width / 2, boxY + 200);

  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '900 80px "Bebas Neue", sans-serif';
  ctx.fillText(statCategory.label.toUpperCase(), width / 2, boxY + 285);

  // League badge & season
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${brandKit.seasonTag} · DATOS ACTUALIZADOS`, width / 2, boxY + 355);

  // Top 1 Preview Teaser
  const leader = players[0];
  if (leader) {
    const leaderY = boxY + 410;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, boxX + 40, leaderY, boxW - 80, 110, 18);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LÍDER ACTUAL DEL RANKING', boxX + 65, leaderY + 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(leader.name, boxX + 65, leaderY + 84);

    ctx.fillStyle = brandKit.primaryColor;
    ctx.font = '900 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${leader.stats[statCategory.id].toFixed(1)} ${statCategory.unit}`, boxX + boxW - 65, leaderY + 70);
  }

  // Hook Prompt at bottom
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Desliza para ver la tabla completa ➡️', width / 2, boxY + boxH - 45);

  ctx.restore();
}

// Individual Player Slide
function drawPlayerSlide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: Player,
  rank: number,
  statCategory: StatCategory,
  brandKit: BrandKit
) {
  ctx.save();

  // Floating Rank Pill (Top Left)
  ctx.fillStyle = rank === 1 ? brandKit.primaryColor : 'rgba(255, 255, 255, 0.1)';
  roundRect(ctx, 60, height * 0.16, 120, 60, 14);
  ctx.fill();

  ctx.fillStyle = rank === 1 ? '#000000' : '#ffffff';
  ctx.font = '900 42px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`#${rank}`, 120, height * 0.16 + 46);

  // Player Silhouette / Halo Area
  const avatarCenterY = height * 0.38;
  const haloR = 210;
  const haloGrad = ctx.createRadialGradient(width / 2, avatarCenterY, 30, width / 2, avatarCenterY, haloR);
  haloGrad.addColorStop(0, hexToRgba(player.teamColor || brandKit.primaryColor, 0.45));
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(width / 2, avatarCenterY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Player Name & Team Centerpiece
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.name.toUpperCase(), width / 2, height * 0.54);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${player.team} · ${player.league} · #${player.number} · ${player.position}`, width / 2, height * 0.58);

  // Stat Showcase Card (Bottom)
  const cardW = width - 120;
  const cardH = height * 0.28;
  const cardX = 60;
  const cardY = height * 0.63;

  ctx.fillStyle = 'rgba(15, 20, 30, 0.92)';
  ctx.strokeStyle = rank === 1 ? brandKit.primaryColor : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Primary Big Number
  const statVal = (player.stats[statCategory.id] || 0).toFixed(1);
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '900 90px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(statVal, width / 2, cardY + 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(statCategory.label.toUpperCase(), width / 2, cardY + 155);

  // Secondary stats row
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + 180);
  ctx.lineTo(cardX + cardW - 40, cardY + 180);
  ctx.stroke();

  const cols = [
    { label: 'VALORACIÓN', val: player.stats.pir.toFixed(1) },
    { label: '% TC', val: `${player.stats.fgPct}%` },
    { label: 'PARTIDOS', val: `${player.stats.gamesPlayed}` }
  ];

  cols.forEach((col, idx) => {
    const colX = cardX + (cardW / 3) * idx + (cardW / 6);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.label, colX, cardY + 220);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 26px "JetBrains Mono", monospace';
    ctx.fillText(col.val, colX, cardY + 258);
  });

  ctx.restore();
}

// Outro Slide for Carousel
function drawOutroSlide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  rankingCount: number
) {
  ctx.save();

  const boxW = width - 120;
  const boxH = height * 0.72;
  const boxX = 60;
  const boxY = height * 0.14;

  ctx.fillStyle = 'rgba(15, 20, 30, 0.94)';
  ctx.strokeStyle = brandKit.primaryColor;
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxW, boxH, 28);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RESUMEN DE RESULTADOS', width / 2, boxY + 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Bebas Neue", sans-serif';
  ctx.fillText(`EL TOP 3 DEFINITIVO`, width / 2, boxY + 140);

  // Top 3 list
  const top3 = players.slice(0, 3);
  top3.forEach((p, idx) => {
    const rowY = boxY + 180 + idx * 105;
    ctx.fillStyle = idx === 0 ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.04)';
    roundRect(ctx, boxX + 40, rowY, boxW - 80, 85, 14);
    ctx.fill();

    ctx.fillStyle = idx === 0 ? brandKit.primaryColor : '#ffffff';
    ctx.font = '900 36px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${idx + 1}`, boxX + 80, rowY + 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(p.name, boxX + 130, rowY + 52);

    ctx.fillStyle = brandKit.primaryColor;
    ctx.font = '900 30px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${p.stats[statCategory.id].toFixed(1)} ${statCategory.unit}`, boxX + boxW - 65, rowY + 52);
  });

  // Call to action
  const ctaY = boxY + boxH - 180;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¿A QUIÉN ECHAS EN FALTA EN ESTE TOP?', width / 2, ctaY);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Guarda este carrusel y comparte tu opinión en comentarios 👇', width / 2, ctaY + 45);

  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(brandKit.handle, width / 2, ctaY + 105);

  ctx.restore();
}

// Image cache for carousels
const carouselImageCache = new Map<string, HTMLImageElement>();

function getOrLoadImage(url?: string): HTMLImageElement | null {
  if (!url) return null;
  let img = carouselImageCache.get(url);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    carouselImageCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Background
function drawStaticBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandKit: BrandKit
) {
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, width, height);

  // 1. Draw custom background image if available
  if (brandKit.customBgUrl) {
    const bgImg = getOrLoadImage(brandKit.customBgUrl);
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      const scale = Math.max(width / bgImg.width, height / bgImg.height);
      const x = (width - bgImg.width * scale) / 2;
      const y = (height - bgImg.height * scale) / 2;
      ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
      ctx.restore();
    }
  }

  // 2. Draw tactical court overlay if available
  if (brandKit.courtOverlayUrl) {
    const overlayImg = getOrLoadImage(brandKit.courtOverlayUrl);
    if (overlayImg) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      const scale = Math.max(width / overlayImg.width, height / overlayImg.height);
      const x = (width - overlayImg.width * scale) / 2;
      const y = (height - overlayImg.height * scale) / 2;
      ctx.drawImage(overlayImg, x, y, overlayImg.width * scale, overlayImg.height * scale);
      ctx.restore();
    }
  }

  // Gradient lighting
  const grad = ctx.createRadialGradient(width / 2, height * 0.35, 50, width / 2, height * 0.35, width * 0.85);
  grad.addColorStop(0, hexToRgba(brandKit.primaryColor, 0.25));
  grad.addColorStop(0.6, hexToRgba(brandKit.secondaryColor, 0.08));
  grad.addColorStop(1, 'rgba(7, 9, 14, 0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStaticBrandHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  brandKit: BrandKit,
  pageIndicator?: string
) {
  const topY = 70;
  ctx.save();

  let leftOffset = 60;

  // Draw Logo if available
  if (brandKit.logoUrl) {
    const logoImg = getOrLoadImage(brandKit.logoUrl);
    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(leftOffset + 18, topY - 8, 20, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, leftOffset - 2, topY - 28, 40, 40);
      ctx.restore();
      leftOffset += 48;
    }
  }

  // Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(brandKit.brandName.toUpperCase(), leftOffset, topY);

  // Slide indicator (e.g. "1/6")
  if (pageIndicator) {
    ctx.fillStyle = brandKit.primaryColor;
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(pageIndicator, width - 60, topY);
  }

  ctx.restore();
}

function drawStaticBrandFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandKit: BrandKit
) {
  const footY = height - 50;
  ctx.save();
  ctx.fillStyle = '#71717a';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(brandKit.handle, width / 2, footY);
  ctx.restore();
}

// Helpers
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16) || 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Export single canvas to PNG download
export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Export all slides into a ZIP file
export async function downloadAllSlidesAsZip(
  totalSlides: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  format: GraphicFormat,
  zipFilename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const offscreen = document.createElement('canvas');

  for (let i = 0; i < totalSlides; i++) {
    renderCarouselSlide(offscreen, i, totalSlides, players, statCategory, brandKit, format);
    const dataUrl = offscreen.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    const slideName = i === 0
      ? '01_Portada.png'
      : i === totalSlides - 1
        ? `${String(totalSlides).padStart(2, '0')}_Resumen_Final.png`
        : `${String(i + 1).padStart(2, '0')}_Top_${i}.png`;

    zip.file(slideName, base64Data, { base64: true });
    if (onProgress) onProgress(i + 1, totalSlides);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  a.click();
  URL.revokeObjectURL(url);
}
