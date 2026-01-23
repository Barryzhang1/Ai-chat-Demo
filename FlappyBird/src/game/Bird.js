class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.velocity = 0;
    this.gravity = 0.5;
    this.jumpForce = -9;
    this.rotation = 0;
    this.maxRotation = Math.PI / 4;
    this.minRotation = -Math.PI / 2;
  }

  flap() {
    this.velocity = this.jumpForce;
  }

  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    // Update rotation based on velocity
    if (this.velocity < 0) {
      this.rotation = Math.max(this.velocity / 10, this.minRotation);
    } else {
      this.rotation = Math.min(this.velocity / 5, this.maxRotation);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Draw bird body (yellow circle)
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw wing
    ctx.beginPath();
    ctx.ellipse(-5, 3, 8, 5, Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFA500';
    ctx.fill();

    // Draw eye
    ctx.beginPath();
    ctx.arc(5, -3, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -3, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Draw beak
    ctx.beginPath();
    ctx.moveTo(this.radius - 5, 0);
    ctx.lineTo(this.radius + 5, -2);
    ctx.lineTo(this.radius + 5, 2);
    ctx.closePath();
    ctx.fillStyle = '#FF6347';
    ctx.fill();

    ctx.restore();
  }
}

export default Bird;
