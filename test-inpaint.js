const fs = require('fs');
const FormData = require('form-data');

// Create test images (small black and white images)
const { createCanvas } = require('canvas');

// Create a simple test image (64x64 red square)
const imageCanvas = createCanvas(64, 64);
const imageCtx = imageCanvas.getContext('2d');
imageCtx.fillStyle = '#ff0000';
imageCtx.fillRect(0, 0, 64, 64);

// Create a simple test mask (64x64 white square in the center)
const maskCanvas = createCanvas(64, 64);
const maskCtx = maskCanvas.getContext('2d');
maskCtx.fillStyle = '#000000';
maskCtx.fillRect(0, 0, 64, 64);
maskCtx.fillStyle = '#ffffff';
maskCtx.fillRect(16, 16, 32, 32);

// Save to temporary files
const imageBuffer = imageCanvas.toBuffer('image/png');
const maskBuffer = maskCanvas.toBuffer('image/png');

fs.writeFileSync('test-image.png', imageBuffer);
fs.writeFileSync('test-mask.png', maskBuffer);

console.log('Test images created: test-image.png, test-mask.png');
