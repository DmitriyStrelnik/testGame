import * as PIXI from "./pixi/pixi.mjs";

let app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0x413E3D,
});
document.body.appendChild(app.view);
const KEYS = {
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  SPACE: " ",
};
let paddle,
  ball,
  blocks = [],
  hearts = [],
  lives = 3,
  gameOverText,
  gameWinText,
  sound= new Audio("./sounds/bump.mp3");;

function setup() {
  ball = new PIXI.Graphics();
  ball.beginFill(0xff0000);
  ball.drawCircle(0, 0, 10);
  ball.endFill();
  ball.x = app.renderer.width / 2;
  ball.y = app.renderer.height - 30;
  ball.vx = 0;
  ball.vy = 0;
  ball.velocity = 2;
  ball.onPaddle = true;
  ball.start = function () {
    this.vy = -this.velocity;
    this.vx = random(-this.velocity, this.velocity);
    this.onPaddle = false;
  };
  app.stage.addChild(ball);

  paddle = new PIXI.Graphics();
  paddle.beginFill(0x66ccff);
  paddle.drawRect(0, 0, 100, 10);
  paddle.endFill();
  paddle.velocity = 6;
  paddle.dx = 0;
  paddle.x = (app.renderer.width - 100) / 2;
  paddle.y = app.renderer.height - 20;
  paddle.ball = ball;
  paddle.fire = function () {
    if (this.ball.onPaddle) {
      this.ball.start();
    }
  };
  paddle.start = function (direction) {
    if (direction === KEYS.LEFT) {
      this.dx = -this.velocity;
    } else if (direction === KEYS.RIGHT) {
      this.dx = this.velocity;
    }
  };

  paddle.stop = function () {
    this.dx = 0;
  };

  paddle.move = function () {
    if (this.dx) {
      this.x += this.dx;
      this.x = Math.max(0, Math.min(this.x, app.renderer.width - 100));
      if (this.ball.onPaddle) {
        this.ball.x = this.x + this.width / 2;
      }
    }
  };
  app.stage.addChild(paddle);

  createHearts(hearts);
  createBlocks(blocks);
  gameWinText = new PIXI.Text("RoundWin!\nCONGRATULATION!\nPress R to Restart", {
    fontSize: 36,
    fill: 0xffffff,
    align: "center",
  });
  gameWinText.x = app.renderer.width / 2 - gameWinText.width / 2;
  gameWinText.y = app.renderer.height / 2 - gameWinText.height / 2;
  gameWinText.visible = false;
  app.stage.addChild(gameWinText);
  gameOverText = new PIXI.Text("Game Over!\nPress R to Restart", {
    fontSize: 36,
    fill: 0xffffff,
    align: "center",
  });
  gameOverText.x = app.renderer.width / 2 - gameOverText.width / 2;
  gameOverText.y = app.renderer.height / 2 - gameOverText.height / 2;
  gameOverText.visible = false;
  app.stage.addChild(gameOverText);

  app.ticker.add((delta) => gameLoop(delta));

  window.addEventListener("keydown", (e) => {
    if (e.key === KEYS.SPACE) {
      paddle.fire();
    } else if (e.key === KEYS.LEFT || e.key === KEYS.RIGHT) {
      paddle.start(e.key);
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === KEYS.LEFT || e.key === KEYS.RIGHT) {
      paddle.stop();
    }
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyR") {
      resetGame();
    }
  });
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function gameLoop(delta) {
  if (lives <= 0) return;

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x <= 10 || ball.x >= app.renderer.width - 10) {
    ball.vx *= -1;
  }
  if (ball.y <= 10) {
    ball.vy *= -1;
  }

  if (
    ball.vy > 0 &&
    ball.y + 10 >= paddle.y &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + 100
  ) {
    sound.play();
    let impactPoint = ball.x - (paddle.x + paddle.width / 2);
    ball.vx = impactPoint * 0.1;
    ball.vy *= -1;
    ball.y = paddle.y - 10;
  }

  if (ball.y > app.renderer.height) {
    let heart = hearts.pop();
    app.stage.removeChild(heart);
    loseLife();
  }

  blocks.forEach((block, index) => {
    if (hitTestRectangle(ball, block)) {
      sound.play();
      ball.vy *= -1;
      app.stage.removeChild(block);
      blocks.splice(index, 1);
    }
  });
  paddle.move();
  if (blocks.length === 0) {
    roundWon();
  }
}

function createHearts(hearts) {
  const heartTexture = PIXI.Texture.from("./images/Heart_PNG_Clipart-1003.png");
  for (let i = 0; i < 3; i++) {
    const heart = new PIXI.Sprite(heartTexture);

    heart.width = 35;
    heart.height = 35;
    heart.x = i * (10 + heart.width) + 20;
    heart.y = 10;
    hearts.push(heart);
    app.stage.addChild(heart);
  }
}

function createBlocks(blocks) {
  let rows = 5,
    cols = 10,
    blockWidth = 60,
    blockHeight = 20;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let block = new PIXI.Graphics();
      block.beginFill(0xFFFFFF);
      block.drawRect(0, 0, blockWidth, blockHeight);
      block.endFill();
      block.x = j * (blockWidth + 10) + 35;
      block.y = i * (blockHeight + 10) + 50;
      blocks.push(block);
      app.stage.addChild(block);
    }
  }
}

function hitTestRectangle(r1, r2) {
  let combinedHalfWidths = r1.width / 2 + r2.width / 2;
  let combinedHalfHeights = r1.height / 2 + r2.height / 2;
  let vx = r1.x + r1.width / 2 - (r2.x + r2.width / 2);
  let vy = r1.y + r1.height / 2 - (r2.y + r2.height / 2);

  return (
    Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeights
  );
}

function loseLife() {
  lives--;

  if (lives > 0) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - 10;
    ball.vx = 0;
    ball.vy = 0;
    ball.onPaddle = true;
  } else {
    gameOver();
  }
}

function gameOver() {
  gameOverText.visible = true;
}
function roundWon(){
  gameWinText.visible=true;
  ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - 10;
    ball.vx = 0;
    ball.vy = 0;
    ball.onPaddle = true;
}
function resetGame() {
  lives = 3;
  gameOverText.visible = false;
  gameWinText.visible = false;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - 10;
  ball.vx = 0;
  ball.vy = 0;
  ball.onPaddle = true;
  hearts.forEach((heart) => {
    app.stage.removeChild(heart);
  });
  hearts = [];
  createHearts(hearts);
  blocks.forEach((block) => {
    app.stage.removeChild(block);
  });
  blocks = [];
  createBlocks(blocks);
}

setup();
