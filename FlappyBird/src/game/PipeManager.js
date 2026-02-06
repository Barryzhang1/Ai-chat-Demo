import Pipe from './Pipe';

class PipeManager {
  constructor(canvasWidth, canvasHeight, groundHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundHeight = groundHeight;
    this.pipes = [];
    this.spawnTimer = 0;
    this.spawnInterval = 100; // 增加管道生成间隔，从90帧增加到110帧，让管道更稀疏
    this.gapHeight = 150;
  }

  update() {
    // Update existing pipes
    this.pipes.forEach(pipe => pipe.update());

    // Remove off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isOffScreen());

    // Spawn new pipes
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnPipe();
      this.spawnTimer = 0;
    }
  }

  spawnPipe() {
    const minGapY = 100;
    const maxGapY = this.canvasHeight - this.groundHeight - this.gapHeight - 100;
    const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

    const pipe = new Pipe(
      this.canvasWidth,
      this.canvasHeight,
      this.groundHeight,
      gapY,
      this.gapHeight
    );

    this.pipes.push(pipe);
  }

  draw(ctx) {
    this.pipes.forEach(pipe => pipe.draw(ctx));
  }
}

export default PipeManager;
