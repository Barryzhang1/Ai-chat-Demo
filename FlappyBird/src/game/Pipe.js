class Pipe {
  constructor(x, canvasHeight, groundHeight, gapY, gapHeight) {
    this.x = x;
    this.width = 60;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.canvasHeight = canvasHeight;
    this.groundHeight = groundHeight;
    this.speed = 2;
    this.passed = false;

    // Top pipe
    this.topHeight = gapY;
    // Bottom pipe starts after gap
    this.bottomY = gapY + gapHeight;
    this.bottomHeight = canvasHeight - groundHeight - this.bottomY;
  }

  update() {
    this.x -= this.speed;
  }

  draw(ctx) {
    const pipeColor = '#4CAF50';
    const pipeBorderColor = '#388E3C';
    const pipeCapHeight = 30;
    const pipeCapWidth = this.width + 10;

    // Draw top pipe
    // Pipe body
    ctx.fillStyle = pipeColor;
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    ctx.strokeStyle = pipeBorderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, 0, this.width, this.topHeight);

    // Pipe cap
    ctx.fillRect(
      this.x - (pipeCapWidth - this.width) / 2,
      this.topHeight - pipeCapHeight,
      pipeCapWidth,
      pipeCapHeight
    );
    ctx.strokeRect(
      this.x - (pipeCapWidth - this.width) / 2,
      this.topHeight - pipeCapHeight,
      pipeCapWidth,
      pipeCapHeight
    );

    // Draw bottom pipe
    // Pipe body
    ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
    ctx.strokeRect(this.x, this.bottomY, this.width, this.bottomHeight);

    // Pipe cap
    ctx.fillRect(
      this.x - (pipeCapWidth - this.width) / 2,
      this.bottomY,
      pipeCapWidth,
      pipeCapHeight
    );
    ctx.strokeRect(
      this.x - (pipeCapWidth - this.width) / 2,
      this.bottomY,
      pipeCapWidth,
      pipeCapHeight
    );
  }

  checkCollision(bird) {
    const birdLeft = bird.x - bird.radius;
    const birdRight = bird.x + bird.radius;
    const birdTop = bird.y - bird.radius;
    const birdBottom = bird.y + bird.radius;

    const pipeLeft = this.x;
    const pipeRight = this.x + this.width;

    // Check if bird is in pipe's x range
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // Check if bird hits top or bottom pipe
      if (birdTop < this.topHeight || birdBottom > this.bottomY) {
        return true;
      }
    }

    return false;
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }
}

export default Pipe;
