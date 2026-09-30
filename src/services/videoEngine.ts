import { Player, StatCategory, BrandKit, VideoSettings } from '../types';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  players: Player[];
  statCategory: StatCategory;
  brandKit: BrandKit;
  settings: VideoSettings;
  currentTime: number; // in seconds
  totalDuration: number;
}

// Pre-load images cache to prevent flickering during video rendering
const imageCache = new Map<string, HTMLImageElement>();

export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.filter(Boolean).map(url => {
    if (imageCache.has(url)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(url, img);
        resolve();
      };
      img.onerror = () => {
        // Fallback: don't crash, just proceed
        resolve();
      };
      img.src = url;
    });
  });
  await Promise.all(promises);
}

// Calculate total video duration
export function calculateTotalDuration(settings: VideoSettings): number {
  return settings.introDuration + (settings.rankingCount * settings.durationPerPlayer) + settings.outroDuration;
}

// Draw a single frame of the 9:16 video at given timestamp
export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  settings: VideoSettings,
  time: number
): void {
  const totalDuration = calculateTotalDuration(settings);
  const introEnd = settings.introDuration;
  const playersEnd = introEnd + (settings.rankingCount * settings.durationPerPlayer);

  // 1. Draw Background
  drawBackground(ctx, width, height, brandKit, time);

  // 2. Draw Universal Header / Watermark (Safe area for TikTok / Reels)
  drawTopBrandBar(ctx, width, height, brandKit, statCategory);

  // 3. Determine scene
  if (time < introEnd) {
    // Intro Scene
    drawIntroScene(ctx, width, height, statCategory, brandKit, settings, time);
  } else if (time < playersEnd) {
    // Player Showcase Scene
    const playerElapsed = time - introEnd;
    const playerIndex = Math.min(
      Math.floor(playerElapsed / settings.durationPerPlayer),
      settings.rankingCount - 1
    );
    const progressInPlayer = (playerElapsed % settings.durationPerPlayer) / settings.durationPerPlayer;

    // Determine ranking order
    // In 'climax' mode: player #10 is first, #1 is last
    // In 'direct' mode: player #1 is first, #10 is last
    const actualPlayer = settings.order === 'climax'
      ? players[settings.rankingCount - 1 - playerIndex]
      : players[playerIndex];

    const currentRank = settings.order === 'climax'
      ? settings.rankingCount - playerIndex
      : playerIndex + 1;

    if (actualPlayer) {
      drawPlayerScene(ctx, width, height, actualPlayer, currentRank, statCategory, brandKit, settings, progressInPlayer, time);
    }
  } else {
    // Outro Scene
    const outroElapsed = time - playersEnd;
    drawOutroScene(ctx, width, height, players, statCategory, brandKit, settings, outroElapsed);
  }

  // 4. Draw Footer Progress Line & Brand Handle
  drawFooterProgress(ctx, width, height, time, totalDuration, brandKit);
}

// Background renderer
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brandKit: BrandKit,
  time: number
) {
  const isCyber = brandKit.cardStyle === 'cyber' || brandKit.template?.theme.badgeStyle === 'cyber-shield';
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const secondaryColor = brandKit.secondaryColor || '#f59e0b';

  // 1. Base dark fill
  ctx.fillStyle = isCyber ? '#05070f' : '#080a12';
  ctx.fillRect(0, 0, width, height);

  // 2. Custom Background Image (Crisp and visible!)
  const bgImg = imageCache.get(brandKit.customBgUrl || brandKit.template?.assets.backgroundUrl || '');
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.65;
    const scale = Math.max(width / bgImg.width, height / bgImg.height);
    const x = (width - bgImg.width * scale) / 2;
    const y = (height - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
    ctx.restore();
  }

  // 3. Tactical court overlay image if provided
  const overlayUrl = brandKit.courtOverlayUrl || brandKit.template?.assets.courtOverlayUrl;
  if (overlayUrl) {
    const overlayImg = imageCache.get(overlayUrl);
    if (overlayImg) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      const scale = Math.max(width / overlayImg.width, height / overlayImg.height);
      const x = (width - overlayImg.width * scale) / 2;
      const y = (height - overlayImg.height * scale) / 2;
      ctx.drawImage(overlayImg, x, y, overlayImg.width * scale, overlayImg.height * scale);
      ctx.restore();
    }
  }

  // 4. Cinematic Vignette & Ambient Glow
  const glowX = width * 0.5 + Math.sin(time * 0.8) * (width * 0.08);
  const glowY = height * 0.38 + Math.cos(time * 0.6) * (height * 0.04);

  const radial = ctx.createRadialGradient(glowX, glowY, 40, glowX, glowY, width * 0.9);
  radial.addColorStop(0, hexToRgba(primaryColor, 0.24));
  radial.addColorStop(0.45, hexToRgba(secondaryColor, 0.08));
  radial.addColorStop(1, 'rgba(5, 7, 14, 0.80)');

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // 5. Basketball Court Tactical Vector Lines & Grid
  ctx.save();
  if (isCyber) {
    // CYBER DATA LAB: Tech HUD Grid + Glowing Cyan Court Arc & Lines
    ctx.strokeStyle = hexToRgba(primaryColor, 0.24);
    ctx.lineWidth = 2.5;

    // Glowing 3-point key arc & basket hoop
    const courtCenterY = height * 0.40;
    ctx.beginPath();
    ctx.arc(width / 2, courtCenterY, 280, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // Free-throw key box
    ctx.strokeRect(width / 2 - 120, courtCenterY - 140, 240, 280);

    // Free throw circle
    ctx.beginPath();
    ctx.arc(width / 2, courtCenterY + 140, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Tech HUD Crosshair markers (+)
    ctx.strokeStyle = hexToRgba(primaryColor, 0.35);
    ctx.lineWidth = 1.5;
    const hudPoints = [
      { x: 100, y: 240 }, { x: width - 100, y: 240 },
      { x: 100, y: height - 160 }, { x: width - 100, y: height - 160 },
      { x: width / 2, y: 320 }
    ];
    hudPoints.forEach(pt => {
      ctx.beginPath();
      ctx.moveTo(pt.x - 10, pt.y);
      ctx.lineTo(pt.x + 10, pt.y);
      ctx.moveTo(pt.x, pt.y - 10);
      ctx.lineTo(pt.x, pt.y + 10);
      ctx.stroke();
    });

    // Tech grid telemetry watermark
    ctx.fillStyle = hexToRgba(primaryColor, 0.35);
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('SYS // 2026.BASKETDATA.LAB · TELEMETRY ACTIVE', 70, height - 120);
    ctx.textAlign = 'right';
    ctx.fillText('DATA-DRIVEN RANKINGS', width - 70, height - 120);
    ctx.textAlign = 'left';
  } else {
    // CLASSIC BROADCAST: Warm stadium light rays & court line accents
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    const gridStep = 140;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Brand Bar at top
function drawTopBrandBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
  brandKit: BrandKit,
  _statCategory: StatCategory
) {
  const topY = 130; // TikTok safe margin at top
  const isCyber = brandKit.cardStyle === 'cyber' || brandKit.template?.theme.badgeStyle === 'cyber-shield';
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const logoUrl = brandKit.logoUrl || brandKit.template?.assets.logoUrl || '';
  const brandName = (brandKit.brandName || brandKit.template?.name || 'BASKETDATA').toUpperCase();
  const seasonTag = (brandKit.seasonTag || brandKit.template?.assets.bannerTag || 'OFICIAL · 2025-26').toUpperCase();

  ctx.save();

  // Left: Brand Logo & Wordmark
  const logo = imageCache.get(logoUrl);
  let logoOffset = 70;
  if (logo) {
    ctx.save();
    // Rounded frame with glowing border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0d1322';
    roundRect(ctx, logoOffset, topY - 24, 56, 56, isCyber ? 6 : 14);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    roundRect(ctx, logoOffset + 2, topY - 22, 52, 52, isCyber ? 4 : 12);
    ctx.clip();
    ctx.drawImage(logo, logoOffset + 2, topY - 22, 52, 52);
    ctx.restore();

    ctx.restore();
    logoOffset += 70;
  } else {
    // Stylized high-tech brand shield emblem if logo not loaded
    ctx.save();
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = hexToRgba(primaryColor, 0.15);
    ctx.lineWidth = 2;
    roundRect(ctx, logoOffset, topY - 24, 56, 56, isCyber ? 6 : 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = primaryColor;
    ctx.font = '900 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(brandName.slice(0, 2), logoOffset + 28, topY + 12);
    ctx.restore();
    logoOffset += 70;
  }

  // Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = isCyber ? '900 32px "JetBrains Mono", monospace' : '800 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(brandName, logoOffset, topY + 12);

  if (isCyber) {
    // Subtitle indicator
    ctx.fillStyle = primaryColor;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('// ANALYTICS LAB', logoOffset, topY + 30);
  }

  // Right: Season Tag / Banner Tag
  if (seasonTag) {
    ctx.font = isCyber ? '700 20px "JetBrains Mono", monospace' : '700 22px "Plus Jakarta Sans", sans-serif';
    const tagMetrics = ctx.measureText(seasonTag);
    const boxW = tagMetrics.width + 32;
    const boxH = 44;
    const boxX = width - 70 - boxW;
    const boxY = topY - 18;

    ctx.fillStyle = isCyber ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    roundRect(ctx, boxX, boxY, boxW, boxH, isCyber ? 6 : 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isCyber ? '#38bdf8' : primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText(seasonTag, boxX + boxW / 2, boxY + 28);
  }

  ctx.restore();
}

// Intro Scene: Dramatic countdown & Title Reveal
function drawIntroScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  statCategory: StatCategory,
  brandKit: BrandKit,
  settings: VideoSettings,
  time: number
) {
  const isCyber = brandKit.cardStyle === 'cyber' || brandKit.template?.theme.badgeStyle === 'cyber-shield';
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const logoUrl = brandKit.logoUrl || brandKit.template?.assets.logoUrl || '';
  const seasonTag = (brandKit.seasonTag || brandKit.template?.assets.bannerTag || 'OFICIAL · BASKETDATA').toUpperCase();

  const introProgress = time / settings.introDuration; // 0 to 1
  const scale = 0.95 + easeOutBack(Math.min(introProgress * 1.5, 1)) * 0.05;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-width / 2, -height / 2);

  // Glowing Backdrop Box
  const boxW = width - 140;
  const boxH = 540;
  const boxX = 70;
  const boxY = height / 2 - 270;

  ctx.fillStyle = isCyber ? 'rgba(7, 12, 22, 0.95)' : 'rgba(15, 19, 28, 0.90)';
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;

  if (isCyber) {
    // Chamfered tech polygon
    const c = 24;
    ctx.beginPath();
    ctx.moveTo(boxX + c, boxY);
    ctx.lineTo(boxX + boxW - c, boxY);
    ctx.lineTo(boxX + boxW, boxY + c);
    ctx.lineTo(boxX + boxW, boxY + boxH - c);
    ctx.lineTo(boxX + boxW - c, boxY + boxH);
    ctx.lineTo(boxX + c, boxY + boxH);
    ctx.lineTo(boxX, boxY + boxH - c);
    ctx.lineTo(boxX, boxY + c);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corner tech markers
    ctx.fillStyle = primaryColor;
    ctx.fillRect(boxX + 16, boxY + 16, 12, 12);
    ctx.fillRect(boxX + boxW - 28, boxY + 16, 12, 12);
  } else {
    roundRect(ctx, boxX, boxY, boxW, boxH, 24);
    ctx.fill();
    ctx.stroke();
  }

  // Brand Logo at top of intro if available
  const logo = imageCache.get(logoUrl);
  let contentOffsetY = boxY + 50;
  if (logo) {
    ctx.save();
    const lSize = 72;
    roundRect(ctx, width / 2 - lSize / 2, contentOffsetY, lSize, lSize, isCyber ? 8 : 16);
    ctx.clip();
    ctx.drawImage(logo, width / 2 - lSize / 2, contentOffsetY, lSize, lSize);
    ctx.restore();
    contentOffsetY += 90;
  }

  // Kicker label
  ctx.fillStyle = primaryColor;
  ctx.font = isCyber ? '800 24px "JetBrains Mono", monospace' : '700 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(seasonTag, width / 2, contentOffsetY);

  // Main Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = isCyber ? '900 110px "JetBrains Mono", monospace' : '900 115px "Bebas Neue", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(`TOP ${settings.rankingCount}`, width / 2, contentOffsetY + 105);

  ctx.fillStyle = isCyber ? '#38bdf8' : '#f4f4f5';
  ctx.font = '800 64px "Bebas Neue", sans-serif';
  ctx.fillText(statCategory.label.toUpperCase(), width / 2, contentOffsetY + 180);

  // Subtitle / Hook
  ctx.fillStyle = '#94a3b8';
  ctx.font = isCyber ? '600 24px "JetBrains Mono", monospace' : '500 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    settings.order === 'climax' ? 'Cuenta atrás hacia el Nº 1 · ¿Estás de acuerdo?' : 'Los líderes definitivos de la temporada',
    width / 2,
    contentOffsetY + 240
  );

  // Animated pulse dot
  const pulseR = 8 + Math.sin(time * 12) * 3;
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(width / 2, contentOffsetY + 285, pulseR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Player Scene: Spotlight card, photo cutout, animated stat bar & numbers
function drawPlayerScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  player: Player,
  currentRank: number,
  statCategory: StatCategory,
  brandKit: BrandKit,
  _settings: VideoSettings,
  progress: number, // 0 to 1 inside this player's duration
  _time: number
) {
  const isCyber = brandKit.cardStyle === 'cyber' || brandKit.template?.theme.badgeStyle === 'cyber-shield';
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const secondaryColor = brandKit.secondaryColor || '#f59e0b';
  const isNumberOne = currentRank === 1;

  // Smooth entrance
  const entrance = easeOutCubic(Math.min(progress * 2.5, 1));
  const cardOffsetY = (1 - entrance) * 120;
  const cardAlpha = Math.min(progress * 4, 1);

  ctx.save();
  ctx.globalAlpha = cardAlpha;

  // 1. Giant Background Rank Watermark (Clean, editorial styling)
  ctx.save();
  ctx.font = isCyber ? '900 360px "JetBrains Mono", monospace' : '900 360px "Bebas Neue", sans-serif';
  ctx.fillStyle = isCyber ? hexToRgba(primaryColor, 0.08) : 'rgba(255, 255, 255, 0.04)';
  ctx.textAlign = 'center';
  ctx.fillText(`#${currentRank}`, width / 2, height * 0.44 + cardOffsetY);
  ctx.restore();

  // 2. Player Cutout / Portrait Area
  const photoY = height * 0.22 + cardOffsetY;
  const photoSize = 620;

  // Team halo ring behind player
  const haloRadius = 260;
  const haloGradient = ctx.createRadialGradient(
    width / 2,
    photoY + photoSize * 0.55,
    60,
    width / 2,
    photoY + photoSize * 0.55,
    haloRadius
  );
  haloGradient.addColorStop(0, hexToRgba(isCyber ? primaryColor : (player.teamColor || primaryColor), 0.38));
  haloGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haloGradient;
  ctx.fillRect(width / 2 - haloRadius, photoY, haloRadius * 2, haloRadius * 2);

  // Player Photo
  const playerImg = imageCache.get(player.photoUrl);
  if (playerImg) {
    ctx.save();
    // Scale up slightly for dramatic presence
    const pScale = 0.96 + entrance * 0.04;
    ctx.translate(width / 2, photoY + photoSize / 2);
    ctx.scale(pScale, pScale);
    ctx.drawImage(playerImg, -photoSize / 2, -photoSize / 2, photoSize, photoSize);
    ctx.restore();
  } else {
    // Stylized Fallback Avatar with jersey number & initials
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = player.teamColor || primaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, photoY + photoSize / 2, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 130px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${player.number}`, width / 2, photoY + photoSize / 2 + 30);

    ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(player.position, width / 2, photoY + photoSize / 2 + 85);
    ctx.restore();
  }

  // 3. Floating Rank Badge
  drawRankBadge(ctx, 90, height * 0.23 + cardOffsetY, currentRank, brandKit, entrance);

  // 4. Lower Info Broadcast Card
  const cardW = width - 140;
  const cardH = 590;
  const cardX = 70;
  const cardY = height * 0.58 + cardOffsetY;

  if (isCyber) {
    // CYBER DATA LAB CARD: Chamfered tech cut corners, cyan luminous border, HUD corner brackets
    const c = 24;
    ctx.save();
    ctx.fillStyle = 'rgba(7, 12, 22, 0.95)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = isNumberOne ? 3.5 : 2.5;
    if (isNumberOne) {
      ctx.shadowColor = hexToRgba(primaryColor, 0.6);
      ctx.shadowBlur = 18;
    }

    ctx.beginPath();
    ctx.moveTo(cardX + c, cardY);
    ctx.lineTo(cardX + cardW - c, cardY);
    ctx.lineTo(cardX + cardW, cardY + c);
    ctx.lineTo(cardX + cardW, cardY + cardH - c);
    ctx.lineTo(cardX + cardW - c, cardY + cardH);
    ctx.lineTo(cardX + c, cardY + cardH);
    ctx.lineTo(cardX, cardY + cardH - c);
    ctx.lineTo(cardX, cardY + c);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Top tech accent strip
    ctx.fillStyle = primaryColor;
    ctx.fillRect(cardX + 44, cardY, 180, 4);

    // Top-right HUD Tag in Cyber Card
    ctx.fillStyle = hexToRgba(primaryColor, 0.85);
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`[ DATA // #0${currentRank} VERIFIED ]`, cardX + cardW - 36, cardY + 45);
    ctx.textAlign = 'left';
  } else {
    // CLASSIC BROADCAST CARD: Frosted glass rounded card with gold/amber accent
    ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
    ctx.strokeStyle = isNumberOne ? primaryColor : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = isNumberOne ? 4 : 2;
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = player.teamColor || primaryColor;
    ctx.fillRect(cardX + 40, cardY, 180, 5);
  }

  // Player Name & Team info
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px "Bebas Neue", sans-serif';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '1px';
  ctx.fillText(player.name.toUpperCase(), cardX + 44, cardY + 92);

  // Team & League unboxed metadata
  ctx.fillStyle = '#94a3b8';
  ctx.font = isCyber ? '600 24px "JetBrains Mono", monospace' : '600 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${player.team.toUpperCase()} · ${player.league} · #${player.number} · ${player.position}`, cardX + 44, cardY + 138);

  // Divider
  ctx.strokeStyle = isCyber ? hexToRgba(primaryColor, 0.25) : 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(cardX + 44, cardY + 170);
  ctx.lineTo(cardX + cardW - 44, cardY + 170);
  ctx.stroke();

  // Primary Stat Highlight (Count-up animation)
  const statVal = player.stats[statCategory.id] || 0;
  const animatedStat = (statVal * Math.min(progress * 2.2, 1)).toFixed(1);

  ctx.fillStyle = primaryColor;
  ctx.font = '900 115px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(animatedStat, cardX + 44, cardY + 295);

  // Unit and Stat Label
  ctx.fillStyle = '#e2e8f0';
  ctx.font = isCyber ? '800 32px "JetBrains Mono", monospace' : '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(statCategory.shortLabel, cardX + 44, cardY + 345);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(statCategory.unit, cardX + 130, cardY + 345);

  // Dynamic Animated Progress Bar
  const maxStatVal = getStatMaxReference(statCategory.id);
  const barProgress = Math.min((statVal / maxStatVal), 1) * Math.min(progress * 2, 1);
  const barW = cardW - 88;
  const barH = 18;
  const barX = cardX + 44;
  const barY = cardY + 380;

  if (isCyber) {
    // Segmented Cyber Metric Bar (14 tactical segments in luminous cyan)
    const segmentCount = 14;
    const gap = 5;
    const segW = (barW - (gap * (segmentCount - 1))) / segmentCount;
    const activeSegments = Math.round(barProgress * segmentCount);

    for (let s = 0; s < segmentCount; s++) {
      const sx = barX + s * (segW + gap);
      const isActive = s < activeSegments;
      ctx.fillStyle = isActive ? primaryColor : 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, sx, barY, segW, barH, 3);
      ctx.fill();
    }
  } else {
    // Smooth Broadcast Gradient Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    roundRect(ctx, barX, barY, barW, barH, 9);
    ctx.fill();

    const fillGradient = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    fillGradient.addColorStop(0, primaryColor);
    fillGradient.addColorStop(1, secondaryColor || '#ffffff');
    ctx.fillStyle = fillGradient;
    roundRect(ctx, barX, barY, Math.max(barW * barProgress, 18), barH, 9);
    ctx.fill();
  }

  // Secondary Supporting Stats Grid (3 columns)
  drawSecondaryStats(ctx, cardX + 44, cardY + 435, cardW - 88, player, statCategory, isCyber, primaryColor);

  ctx.restore();
}

// Draw the iconic Rank Badge (#10 .. #1)
function drawRankBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rank: number,
  brandKit: BrandKit,
  entrance: number
) {
  const isNumberOne = rank === 1;
  const isCyber = brandKit.cardStyle === 'cyber' || brandKit.template?.theme.badgeStyle === 'cyber-shield';
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const badgeW = 132;
  const badgeH = 108;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(entrance, entrance);

  if (isCyber) {
    // Cyber Shield Badge with Chamfered Tech Corners
    ctx.save();
    ctx.fillStyle = isNumberOne ? hexToRgba(primaryColor, 0.25) : 'rgba(7, 14, 26, 0.94)';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = isNumberOne ? 3.5 : 2.5;

    ctx.shadowColor = hexToRgba(primaryColor, 0.7);
    ctx.shadowBlur = isNumberOne ? 24 : 12;

    // Chamfered polygon path
    const c = 18;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.lineTo(badgeW - c, 0);
    ctx.lineTo(badgeW, c);
    ctx.lineTo(badgeW, badgeH - c);
    ctx.lineTo(badgeW - c, badgeH);
    ctx.lineTo(c, badgeH);
    ctx.lineTo(0, badgeH - c);
    ctx.lineTo(0, c);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isNumberOne ? '#38bdf8' : '#ffffff';
    ctx.font = '900 60px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, badgeW / 2, 74);

    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillStyle = primaryColor;
    ctx.fillText('DATA // RANK', badgeW / 2, 26);
    ctx.restore();
  } else {
    // Classic Broadcast Badge
    if (isNumberOne) {
      const goldGrad = ctx.createLinearGradient(0, 0, badgeW, badgeH);
      goldGrad.addColorStop(0, primaryColor);
      goldGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = goldGrad;
      ctx.shadowColor = hexToRgba(primaryColor, 0.6);
      ctx.shadowBlur = 24;
    } else {
      ctx.fillStyle = 'rgba(24, 28, 38, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
    }

    roundRect(ctx, 0, 0, badgeW, badgeH, 18);
    ctx.fill();
    if (!isNumberOne) ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isNumberOne ? '#000000' : '#ffffff';
    ctx.font = '900 60px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, badgeW / 2, 72);

    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(isNumberOne ? 'LÍDER' : 'PUESTO', badgeW / 2, 26);
  }

  ctx.restore();
}

// Draw secondary stats (e.g. FG%, PIR, Games)
function drawSecondaryStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  player: Player,
  primaryStat: StatCategory,
  isCyber: boolean = false,
  primaryColor: string = '#06b6d4'
) {
  const colW = width / 3;

  // Determine which 3 secondary stats to show (exclude the primary one)
  const secondaryList = [
    { label: 'VALORACIÓN', val: player.stats.pir.toFixed(1) },
    { label: 'TIRO CAMPO', val: `${player.stats.fgPct}%` },
    { label: 'PARTIDOS', val: `${player.stats.gamesPlayed}` },
  ];

  if (primaryStat.id === 'pir') {
    secondaryList[0] = { label: 'PUNTOS', val: `${player.stats.ppg}` };
  }

  secondaryList.forEach((stat, i) => {
    const colX = x + i * colW;

    ctx.fillStyle = isCyber ? hexToRgba(primaryColor, 0.75) : '#64748b';
    ctx.font = isCyber ? '700 17px "JetBrains Mono", monospace' : '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(stat.label, colX, y + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = isCyber ? '900 34px "JetBrains Mono", monospace' : '800 32px "JetBrains Mono", monospace';
    ctx.fillText(stat.val, colX, y + 68);
  });
}

// Outro Scene: Call to action
function drawOutroScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  players: Player[],
  statCategory: StatCategory,
  brandKit: BrandKit,
  settings: VideoSettings,
  _outroElapsed: number
) {
  ctx.save();

  // Outro Box
  const boxW = width - 140;
  const boxH = 750;
  const boxX = 70;
  const boxY = (height - boxH) / 2;

  ctx.fillStyle = 'rgba(12, 16, 24, 0.94)';
  ctx.strokeStyle = brandKit.primaryColor;
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxW, boxH, 28);
  ctx.fill();
  ctx.stroke();

  // Top Title
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RESUMEN DEL PODIO', width / 2, boxY + 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 70px "Bebas Neue", sans-serif';
  ctx.fillText(`TOP 3 · ${statCategory.label.toUpperCase()}`, width / 2, boxY + 145);

  // Top 3 Mini List
  const top3 = players.slice(0, 3);
  const rowH = 110;
  const listStartY = boxY + 190;

  top3.forEach((p, idx) => {
    const rowY = listStartY + idx * rowH;

    ctx.fillStyle = idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)';
    roundRect(ctx, boxX + 36, rowY, boxW - 72, 90, 16);
    ctx.fill();

    // Rank Number
    ctx.fillStyle = idx === 0 ? brandKit.primaryColor : '#ffffff';
    ctx.font = '900 48px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${idx + 1}`, boxX + 80, rowY + 62);

    // Player Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(p.name, boxX + 130, rowY + 56);

    // Stat
    const statVal = p.stats[statCategory.id] || 0;
    ctx.fillStyle = brandKit.primaryColor;
    ctx.font = '900 38px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${statVal.toFixed(1)} ${statCategory.unit}`, boxX + boxW - 65, rowY + 56);
  });

  // Call to action at bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¿ESTÁS DE ACUERDO CON EL RANKING?', width / 2, boxY + 575);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Déjalo en los comentarios y síguenos para más estadísticas', width / 2, boxY + 625);

  // Handle
  ctx.fillStyle = brandKit.primaryColor;
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(brandKit.handle, width / 2, boxY + 685);

  ctx.restore();
}

// Footer timeline bar
function drawFooterProgress(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  totalDuration: number,
  brandKit: BrandKit
) {
  const footerY = height - 80;
  const progressRatio = Math.min(time / totalDuration, 1);
  const primaryColor = brandKit.primaryColor || '#06b6d4';
  const handle = brandKit.handle || brandKit.template?.assets.watermarkText || '@basketdata.rankings';

  ctx.save();

  // Progress Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(70, footerY + 22, width - 140, 6);

  ctx.fillStyle = primaryColor;
  ctx.fillRect(70, footerY + 22, (width - 140) * progressRatio, 6);

  // Watermark Handle (Bottom)
  if (handle) {
    ctx.font = '700 22px "JetBrains Mono", monospace';
    const textW = ctx.measureText(handle).width;

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(handle, width / 2, footerY);

    // Pulse dot
    const dotR = 4.5 + Math.sin(time * 8) * 1.5;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(width / 2 - textW / 2 - 16, footerY - 7, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Helpers
function getStatMaxReference(statId: string): number {
  switch (statId) {
    case 'ppg': return 35;
    case 'rpg': return 15;
    case 'apg': return 12;
    case 'spg': return 3;
    case 'bpg': return 4;
    case 'tpm': return 5.5;
    case 'pir': return 40;
    default: return 30;
  }
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
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

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Web Audio API synthesizer for hype beat & transition swooshes
export class VideoAudioSynthesizer {
  private ctx: AudioContext | null = null;
  public destination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    // Lazy initialize on user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.destination = this.ctx.createMediaStreamDestination();
    }
  }

  public playKick(timeOffset = 0) {
    if (!this.ctx || !this.destination) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime + timeOffset;

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.destination);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playWhoosh(timeOffset = 0) {
    if (!this.ctx || !this.destination) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime + timeOffset;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.destination);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }
}
