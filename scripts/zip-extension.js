// Script to package extension for store submission

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function zipDirectory(source, out) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = createWriteStream(out);

  return new Promise((resolve, reject) => {
    archive
      .directory(source, false)
      .on('error', err => reject(err))
      .pipe(stream);

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

async function packageExtension() {
  const distDir = path.join(rootDir, 'dist');
  const chromeDir = path.join(distDir, 'chrome');
  const firefoxDir = path.join(distDir, 'firefox');

  // Check if build directories exist
  if (!fs.existsSync(chromeDir) || !fs.existsSync(firefoxDir)) {
    console.error('Error: Build directories not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Create packages directory
  const packagesDir = path.join(rootDir, 'packages');
  if (!fs.existsSync(packagesDir)) {
    fs.mkdirSync(packagesDir, { recursive: true });
  }

  console.log('Packaging extension for Chrome...');
  const chromeZip = path.join(packagesDir, 'privatetab-chrome.zip');
  await zipDirectory(chromeDir, chromeZip);
  console.log(`✓ Chrome package created: ${chromeZip}`);

  console.log('Packaging extension for Firefox...');
  const firefoxZip = path.join(packagesDir, 'privatetab-firefox.zip');
  await zipDirectory(firefoxDir, firefoxZip);
  console.log(`✓ Firefox package created: ${firefoxZip}`);

  console.log('\n✓ Extension packages ready for submission!');
  console.log('  Chrome:', chromeZip);
  console.log('  Firefox:', firefoxZip);
}

packageExtension().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
