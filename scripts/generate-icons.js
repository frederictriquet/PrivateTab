// Script to generate extension icons

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes needed for the extension
const sizes = [16, 48, 128];

// Color scheme
const colors = {
  primary: '#667eea', // Purple
  secondary: '#764ba2', // Darker purple
  background: '#ffffff',
  lockBody: '#667eea',
  lockShackle: '#667eea',
};

/**
 * Draw a lock icon on the canvas
 */
function drawLockIcon(ctx, size) {
  const scale = size / 128; // Base design on 128px
  const centerX = size / 2;
  const centerY = size / 2;

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, size, size);

  // Add subtle circular background
  const bgRadius = size * 0.48;
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, bgRadius, 0, Math.PI * 2);
  ctx.fill();

  // Lock body (rounded rectangle)
  const lockWidth = size * 0.35;
  const lockHeight = size * 0.4;
  const lockX = centerX - lockWidth / 2;
  const lockY = centerY - lockHeight / 2 + size * 0.08;
  const radius = size * 0.05;

  ctx.fillStyle = colors.background;
  ctx.beginPath();
  ctx.moveTo(lockX + radius, lockY);
  ctx.lineTo(lockX + lockWidth - radius, lockY);
  ctx.quadraticCurveTo(lockX + lockWidth, lockY, lockX + lockWidth, lockY + radius);
  ctx.lineTo(lockX + lockWidth, lockY + lockHeight - radius);
  ctx.quadraticCurveTo(
    lockX + lockWidth,
    lockY + lockHeight,
    lockX + lockWidth - radius,
    lockY + lockHeight
  );
  ctx.lineTo(lockX + radius, lockY + lockHeight);
  ctx.quadraticCurveTo(lockX, lockY + lockHeight, lockX, lockY + lockHeight - radius);
  ctx.lineTo(lockX, lockY + radius);
  ctx.quadraticCurveTo(lockX, lockY, lockX + radius, lockY);
  ctx.closePath();
  ctx.fill();

  // Lock shackle (semi-circle arc)
  const shackleRadius = lockWidth * 0.4;
  const shackleY = lockY - shackleRadius * 0.3;
  const shackleLineWidth = size * 0.06;

  ctx.strokeStyle = colors.background;
  ctx.lineWidth = shackleLineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(centerX, shackleY, shackleRadius, Math.PI * 0.8, Math.PI * 2.2);
  ctx.stroke();

  // Keyhole
  const keyholeSize = size * 0.08;
  const keyholeY = centerY + size * 0.02;

  // Keyhole circle
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(centerX, keyholeY, keyholeSize * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Keyhole slot
  ctx.fillRect(
    centerX - keyholeSize * 0.15,
    keyholeY,
    keyholeSize * 0.3,
    keyholeSize * 0.8
  );
}

/**
 * Generate icon at specific size
 */
function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the icon
  drawLockIcon(ctx, size);

  // Save to file
  const iconsDir = join(__dirname, '..', 'public', 'icons');
  mkdirSync(iconsDir, { recursive: true });

  const buffer = canvas.toBuffer('image/png');
  const filename = join(iconsDir, `icon${size}.png`);
  writeFileSync(filename, buffer);

  console.log(`✓ Generated icon${size}.png`);
}

/**
 * Generate locked icon variant (for badge)
 */
function generateLockedIcon() {
  const size = 48;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Red circular background
  const centerX = size / 2;
  const centerY = size / 2;
  const bgRadius = size * 0.45;

  ctx.fillStyle = '#ef4444'; // Red
  ctx.beginPath();
  ctx.arc(centerX, centerY, bgRadius, 0, Math.PI * 2);
  ctx.fill();

  // White lock icon (smaller)
  const scale = 0.6;
  const scaledSize = size * scale;
  const offsetX = (size - scaledSize) / 2;
  const offsetY = (size - scaledSize) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Lock body
  const lockWidth = scaledSize * 0.4;
  const lockHeight = scaledSize * 0.45;
  const lockX = scaledSize / 2 - lockWidth / 2;
  const lockY = scaledSize / 2 - lockHeight / 2 + scaledSize * 0.08;
  const radius = scaledSize * 0.05;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(lockX + radius, lockY);
  ctx.lineTo(lockX + lockWidth - radius, lockY);
  ctx.quadraticCurveTo(lockX + lockWidth, lockY, lockX + lockWidth, lockY + radius);
  ctx.lineTo(lockX + lockWidth, lockY + lockHeight - radius);
  ctx.quadraticCurveTo(
    lockX + lockWidth,
    lockY + lockHeight,
    lockX + lockWidth - radius,
    lockY + lockHeight
  );
  ctx.lineTo(lockX + radius, lockY + lockHeight);
  ctx.quadraticCurveTo(lockX, lockY + lockHeight, lockX, lockY + lockHeight - radius);
  ctx.lineTo(lockX, lockY + radius);
  ctx.quadraticCurveTo(lockX, lockY, lockX + radius, lockY);
  ctx.closePath();
  ctx.fill();

  // Lock shackle
  const shackleRadius = lockWidth * 0.4;
  const shackleY = lockY - shackleRadius * 0.3;
  const shackleLineWidth = scaledSize * 0.06;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = shackleLineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(scaledSize / 2, shackleY, shackleRadius, Math.PI * 0.8, Math.PI * 2.2);
  ctx.stroke();

  ctx.restore();

  // Save to file
  const iconsDir = join(__dirname, '..', 'public', 'icons');
  const buffer = canvas.toBuffer('image/png');
  const filename = join(iconsDir, 'icon-locked.png');
  writeFileSync(filename, buffer);

  console.log('✓ Generated icon-locked.png');
}

// Main execution
console.log('Generating PrivateTab icons...\n');

try {
  // Generate standard icons
  sizes.forEach(size => generateIcon(size));

  // Generate locked variant
  generateLockedIcon();

  console.log('\n✓ All icons generated successfully!');
  console.log('  Location: public/icons/');
  console.log('  Files: icon16.png, icon48.png, icon128.png, icon-locked.png');
} catch (error) {
  console.error('\n✗ Error generating icons:', error.message);
  console.error('\nTroubleshooting:');
  console.error('  1. Make sure canvas package is installed: npm install');
  console.error('  2. On Linux, you may need: sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++');
  console.error('  3. On macOS with Homebrew: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
  process.exit(1);
}
