
let icons = [], iconValues = [];
let grid = [];
let cols = 3, rows = 3;
let cellSize, resultAreaHeight;
let padding = 10;
let winnerMessage = "";
let totalValue = 0;
let scratchedAmount = 0;
let maskGraphics;
let resultState = "hidden";
let resultTimer = 0;

let customFont;
let resultAlpha = 0;
let fadeSpeed = 5;

let bgImage, bgDesktop, bgMobile;
let topLayerImg;
let resizedTopLayerImg;
let isMobile;

let coin;
let dustParticles = [];
let streamers = [];

let raindrops = [];
let rainStartTime = 0;
let showRain = false;

let lightningState = false;
let lightningTimer = 0;
let lightningDuration = 50;
let lightningDelay = 50;

let scratchSound, streamersSound, rainSound;
let scratchTimeout;

let cardX, cardY;
let scaleFactor;
let canvasWidth, canvasHeight;

function preload() {
  bgDesktop = loadImage("play bg desktop.webp");
  bgMobile = loadImage("play bg mobile.webp");
  topLayerImg = loadImage("scratch me play.webp");

  icons.push(loadImage('lucky coin.png'));
  icons.push(loadImage('lucky cat.png'));
  icons.push(loadImage('ladybug.png'));
  icons.push(loadImage('horseshoe.png'));
  icons.push(loadImage('diamond.png'));
  icons.push(loadImage('clover.png'));
  iconValues = [100, 1000, 10000, 50000, 100000, 111111];

  coin = loadImage("coin.png");
  customFont = loadFont("Decoy Bold.ttf");

  soundFormats('mp3', 'wav');
  scratchSound = loadSound('scratch.mp3');
  streamersSound = loadSound('winner.mp3');
  rainSound = loadSound('loser.mp3');
}

function setup() {
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1);
  noCursor();

  isMobile = windowWidth < 768;
  bgImage = isMobile ? bgMobile : bgDesktop;

  scaleFactor = windowHeight / 600;
  cellSize = 105 * scaleFactor;
  resultAreaHeight = 90 * scaleFactor;

  let cardWidth = cols * cellSize;
  let cardHeight = rows * cellSize + resultAreaHeight - 20;
  cardX = (canvasWidth - cardWidth) / 2;
  cardY = (canvasHeight - cardHeight) / 2;

  maskGraphics = createGraphics(cols * cellSize, rows * cellSize);
  maskGraphics.background(0);

  resetGrid();

  document.addEventListener("touchmove", function (e) {
    e.preventDefault();
  }, { passive: false });

  resizedTopLayerImg = topLayerImg.get();
  resizedTopLayerImg.resize(cols * cellSize, rows * cellSize);
}

function resetGrid() {
  grid = [];
  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      let r = floor(random(icons.length));
      grid[i][j] = { icon: icons[r], value: iconValues[r] };
    }
  }
  calculateTotalValue();
  winnerMessage = checkWinner();
  resultState = "hidden";
}

function draw() {
  background(255);
  image(bgImage, 0, 0, canvasWidth, canvasHeight);

  push();
  translate(cardX, cardY);

  fill(255, 244, 214);
  noStroke();
  rect(0, 0, cols * cellSize, rows * cellSize + resultAreaHeight);

  drawGrid();

  let masked = resizedTopLayerImg.get();
masked.mask(maskGraphics);
image(masked, 0, 0);


  updateDust();

  // Clear and draw result area before rendering text
  fill(255, 244, 214);
  noStroke();
  rect(0, rows * cellSize, cols * cellSize, resultAreaHeight);
  drawResult();

  pop();

  drawCoinCursor();

  scratchedAmount = countScratchedPixels();
  if (resultState === "hidden" && scratchedAmount > 0.8) {
    resultState = "showResult";
    resultTimer = millis();
  }
  if (resultState === "showResult" && millis() - resultTimer > 2000) {
    resultState = "showValue";
  }

  if (resultState === "showResult" || resultState === "showValue") {
    if (resultAlpha < 255) {
      resultAlpha += fadeSpeed;
      resultAlpha = constrain(resultAlpha, 0, 255);
    }
  } else {
    resultAlpha = 0; // Reset when not displaying result
  }

  if (resultState === "showResult" && winnerMessage === "You are a WINNER!" && millis() - resultTimer < 5000) {
    for (let i = 0; i < 2; i++) {
      streamers.push(new Streamer());
    }

    if (!streamersSound.isPlaying()) {
      streamersSound.play(); // Play the streamers sound
    }
  }

  for (let i = streamers.length - 1; i >= 0; i--) {
    streamers[i].update();
    streamers[i].display();
    if (streamers[i].isOffScreen()) {
      streamers.splice(i, 1);
    }
  }

  if (resultState === "showResult" && winnerMessage === "You are a LOSER!" && millis() - resultTimer < 3000) {
    showRain = true;
    rainStartTime = millis();
    for (let i = 0; i < 10; i++) {
      raindrops.push(new Raindrop());
    }

    if (!rainSound.isPlaying()) {
      rainSound.play(); // Play the rain sound
    }
  }

  if (showRain) {
    for (let i = raindrops.length - 1; i >= 0; i--) {
      raindrops[i].update();
      raindrops[i].display();
      if (raindrops[i].isOffScreen()) {
        raindrops.splice(i, 1);
      }
    }

    if (millis() - rainStartTime > 3000) {
      showRain = false;
      raindrops = [];
    }

    if (millis() - lightningTimer > lightningDelay) {
      lightningState = random(1) < 0.1;
      if (lightningState) {
        lightningTimer = millis();
      }
    }

    if (lightningState) {
      fill(255, 255, 255, random(180, 255));
      noStroke();
      rect(0, 0, canvasWidth, canvasHeight);
    }
  }
}

function drawGrid() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let x = j * cellSize;
      let y = i * cellSize;
      let imgSize = cellSize - 2 * padding * scaleFactor;
      image(grid[i][j].icon, x + padding * scaleFactor, y + padding * scaleFactor, imgSize, imgSize);
      stroke(0);
      noFill();
      rect(x, y, cellSize, cellSize);
    }
  }
}

function mouseDragged() {
  if (mouseX > cardX && mouseX < cardX + cols * cellSize &&
    mouseY > cardY && mouseY < cardY + rows * cellSize) {
    scratch(mouseX - cardX, mouseY - cardY, pmouseX - cardX, pmouseY - cardY);

    if (!scratchSound.isPlaying()) {
      scratchSound.loop(); // Play scratch sound while dragging
    }
    
    clearTimeout(scratchTimeout);
  scratchTimeout = setTimeout(() => {
    scratchSound.stop();
  }, 200);
  }
}

function touchMoved(event) {
  if (touches.length > 0) {
    let touch = touches[0];
    if (touch.x > cardX && touch.x < cardX + cols * cellSize &&
      touch.y > cardY && touch.y < cardY + rows * cellSize) {
      scratch(touch.x - cardX, touch.y - cardY,
        touch.x - (touch.x - pmouseX) - cardX,
        touch.y - (touch.y - pmouseY) - cardY);
    }
  }
  return false;
}

function scratch(x, y, px, py) {
  maskGraphics.push();
  maskGraphics.erase(255, 255);
  for (let i = 0; i < 3; i++) {
    let offsetX = random(-3, 3);
    let offsetY = random(-3, 3);
    let spacing = random(10, 15);
    let startX = px + offsetX + random(-spacing, spacing);
    let startY = py + offsetY + random(-spacing, spacing);
    let endX = x + offsetX + random(-spacing, spacing);
    let endY = y + offsetY + random(-spacing, spacing);
    maskGraphics.strokeWeight(random(5, 10));
    maskGraphics.line(startX, startY, endX, endY);
  }
  maskGraphics.noErase();
  maskGraphics.pop();

  for (let i = 0; i < 5; i++) {
    dustParticles.push(new Dust(x, y));
  }
}

function countScratchedPixels() {
  let count = 0;
  maskGraphics.loadPixels();
  for (let i = 0; i < maskGraphics.pixels.length; i += 4) {
    if (maskGraphics.pixels[i + 3] < 255) count++;
  }
  return count / (cols * cellSize * rows * cellSize);
}

function checkWinner() {
  for (let i = 0; i < rows; i++) {
    if (grid[i][0].icon === grid[i][1].icon && grid[i][0].icon === grid[i][2].icon) return "You are a WINNER!";
  }
  for (let j = 0; j < cols; j++) {
    if (grid[0][j].icon === grid[1][j].icon && grid[0][j].icon === grid[2][j].icon) return "You are a WINNER!";
  }
  if (grid[0][0].icon === grid[1][1].icon && grid[0][0].icon === grid[2][2].icon) return "You are a WINNER!";
  if (grid[0][2].icon === grid[1][1].icon && grid[0][2].icon === grid[2][0].icon) return "You are a WINNER!";
  return "You are a LOSER!";
}

function calculateTotalValue() {
  totalValue = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      totalValue += grid[i][j].value;
    }
  }
}

function drawResult() {
  // Fade-in logic
  if (resultAlpha < 255) {
    resultAlpha += 5; // Speed of fade-in; adjust as needed
  }

  fill(0, resultAlpha); // Fade-in using alpha
  textSize(24 * scaleFactor);
  textAlign(CENTER, CENTER);
  textFont(customFont);

  let resultY = rows * cellSize + resultAreaHeight / 2;
  let verticalOffset = -7.5 * scaleFactor;

  if (resultState === "showResult") {
    text(winnerMessage, cols * cellSize / 2, resultY + verticalOffset);
  } else if (resultState === "showValue") {
    text("Total Value: $" + totalValue, cols * cellSize / 2, resultY + verticalOffset);
  }
}


function updateDust() {
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    dustParticles[i].update();
    dustParticles[i].display();
    if (dustParticles[i].alpha <= 0 || dustParticles[i].y > cardY + rows * cellSize + resultAreaHeight) {
      dustParticles.splice(i, 1);
    }
  }
}

function drawCoinCursor() {
  let x = mouseIsPressed ? mouseX : (touches.length > 0 ? touches[0].x : mouseX);
  let y = mouseIsPressed ? mouseY : (touches.length > 0 ? touches[0].y : mouseY);
  let coinSize = 100;
  image(coin, x - coinSize / 2, y - coinSize / 2, coinSize, coinSize);
}

class Dust {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(3, 5);
    this.size = random(2, 4) * scaleFactor;
    this.alpha = 200;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }
  display() {
    noStroke();
    fill(102, 102, 102, this.alpha);
    ellipse(this.x, this.y, this.size, this.size);
  }
}

class Streamer {
  constructor() {
    this.x = random(0, canvasWidth);
    this.y = random(-50, -100);
    this.speed = random(2, 3);
    this.alpha = 255;
    this.size = random(8, 20);
    this.color = color(random(255), random(255), random(255));
    const shapes = ['ellipse', 'rect', 'star'];
    this.shape = random(shapes);
    this.angle = random(TWO_PI);
  }

  update() {
    this.y += this.speed;
    if (this.y > canvasHeight) this.alpha -= 2;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    if (this.shape === 'ellipse') {
      ellipse(0, 0, this.size, this.size * 0.6);
    } else if (this.shape === 'rect') {
      rectMode(CENTER);
      rect(0, 0, this.size * 0.4, this.size);
    } else if (this.shape === 'star') {
      this.drawStar(0, 0, this.size * 0.3, this.size * 0.6, 5);
    }
    pop();
  }

  drawStar(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  isOffScreen() {
    return this.y > canvasHeight || this.alpha <= 0;
  }
}

class Raindrop {
  constructor() {
    this.x = random(0, canvasWidth);
    this.y = random(-100, 0);
    this.length = random(10, 20);
    this.speed = random(4, 8);
    this.weight = random(1, 2);
    this.color = color(100, 100, 255, 200);
  }

  update() {
    this.y += this.speed;
  }

  display() {
    stroke(this.color);
    strokeWeight(this.weight);
    line(this.x, this.y, this.x, this.y + this.length);
  }

  isOffScreen() {
    return this.y > canvasHeight + this.length;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}






