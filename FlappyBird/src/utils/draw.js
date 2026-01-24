export const drawBackground = (ctx, width, height) => {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#4ec0ca');
  gradient.addColorStop(1, '#1ba9c1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw clouds
  drawClouds(ctx, width, height);
};

const drawClouds = (ctx, width, height) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  
  // Cloud 1
  drawCloud(ctx, 80, 100, 40);
  // Cloud 2
  drawCloud(ctx, 250, 150, 35);
  // Cloud 3
  drawCloud(ctx, 150, 200, 30);
};

const drawCloud = (ctx, x, y, size) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
  ctx.arc(x + size * 1.5, y, size * 0.9, 0, Math.PI * 2);
  ctx.fill();
};

export const drawGround = (ctx, width, height, groundHeight, offsetX) => {
  const groundY = height - groundHeight;
  
  // Ground
  ctx.fillStyle = '#DEB887';
  ctx.fillRect(0, groundY, width, groundHeight);

  // Grass texture
  ctx.fillStyle = '#8B7355';
  for (let x = offsetX; x < width; x += 48) {
    ctx.fillRect(x, groundY, 24, 4);
  }

  // Ground details
  ctx.strokeStyle = '#A0826D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();
};
