let desktopImage, mobileImage, topLayerImg;
let maskGraphics;
let coin;
let dustParticles = [];
let scratchedAmount = 0; // Track how much of the scratchcard has been scratched
let isMobile;

let scratchSound;
let scratchTimeout;

function preload() {
  // Load images for desktop and mobile
  desktopImage = loadImage("scratch me desktop.webp");
  mobileImage = loadImage("scratch me mobile.webp");
  coin = loadImage("coin.png");

  soundFormats('mp3', 'ogg'); // Optional if using different audio types
  scratchSound = loadSound('scratch.mp3'); // Make sure the file name is correct
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container'); // Attach canvas to the container

  noCursor();
  
  isMobile = windowWidth < 768; // Check if the screen is mobile-sized
  topLayerImg = isMobile ? mobileImage : desktopImage; // Select correct image

  // Prevent default touch gestures
  document.addEventListener("touchmove", function(event) {
    event.preventDefault();
  }, { passive: false });

  // Create a mask graphics layer for scratching effect
  maskGraphics = createGraphics(width, height);
  maskGraphics.background(0); // Black mask covers the image

  imageMode(CORNER);

  // Disable buttons initially
  disableButtons();

  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }
}

function draw() {
  clear(); // Ensure background is transparent

  // Apply the mask to the selected image
  topLayerImg.mask(maskGraphics);
  image(topLayerImg, 0, 0, width, height);

  // Update and display dust particles
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    dustParticles[i].update();
    dustParticles[i].display();

    if (dustParticles[i].alpha <= 0 || dustParticles[i].y > height) {
      dustParticles.splice(i, 1);
    }
  }

  // Display coin cursor
  let x = mouseIsPressed ? mouseX : (touches.length > 0 ? touches[0].x : mouseX);
  let y = mouseIsPressed ? mouseY : (touches.length > 0 ? touches[0].y : mouseY);
  image(coin, x - 50, y - 50, 100, 100);

  // Calculate how much area has been scratched off
  scratchedAmount = countScratchedPixels();
  
  // If enough area is scratched off, enable buttons
  if (scratchedAmount > 0.5) {  // 50% scratched off
    enableButtons();
  }
}

// Scratch effect on mouse drag
function mouseDragged() {
  scratch(mouseX, mouseY, pmouseX, pmouseY);
}

// Scratch effect on touch move
function touchMoved(event) {
  if (touches.length > 0) {
    let touch = touches[0];
    scratch(touch.x, touch.y, touch.x - (touch.x - pmouseX), touch.y - (touch.y - pmouseY));
  }
  return false; // Prevent scrolling
}

function scratch(x, y, px, py) {
  if (!scratchSound.isPlaying()) {
    scratchSound.loop();
  }

  clearTimeout(scratchTimeout);
  scratchTimeout = setTimeout(() => {
    scratchSound.stop();
  }, 200);
  
  maskGraphics.push();
  maskGraphics.erase(255, 255); // Erase white pixels (make them transparent in the mask)

  // Add multiple random strokes with spacing
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

  // Create dust particles
  for (let i = 0; i < 5; i++) {
    dustParticles.push(new Dust(x, y));
  }
}

// Count scratched pixels (by checking transparency in the mask layer)
function countScratchedPixels() {
  let count = 0;
  maskGraphics.loadPixels();
  for (let i = 0; i < maskGraphics.pixels.length; i += 4) {
    if (maskGraphics.pixels[i + 3] < 255) {  // Check alpha channel
      count++;
    }
  }
  return count / (width * height); // Return a percentage of scratched pixels
}

// Enable buttons after sufficient scratch area is revealed
function enableButtons() {
  const buttons = document.querySelectorAll(".link-image");
  buttons.forEach(button => {
    button.style.pointerEvents = 'auto'; // Enable clicking on buttons
  });
}

// Disable buttons initially
function disableButtons() {
  const buttons = document.querySelectorAll(".link-image");
  buttons.forEach(button => {
    button.style.pointerEvents = 'none'; // Disable clicking on buttons
  });
}

// Resize canvas when screen size changes (Preserve scratch progress)
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  let newMaskGraphics = createGraphics(width, height);
  newMaskGraphics.background(0);
  newMaskGraphics.image(maskGraphics, 0, 0, width, height); // Preserve scratches
  maskGraphics = newMaskGraphics;

  isMobile = windowWidth < 768;
  topLayerImg = isMobile ? mobileImage : desktopImage;
}

// Dust particle class
class Dust {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(3, 5);
    this.size = random(2, 4);
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

