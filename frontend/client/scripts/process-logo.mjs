import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "../src/assets");
const publicDir = path.join(__dirname, "../public");
const inputPath = path.join(assetsDir, "lyzov-logo.png");

async function processLogo(input, outputPath, { darkMode = false } = {}) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (r > 232 && g > 232 && b > 232) {
      pixels[i + 3] = 0;
      continue;
    }

    if (darkMode && lum < 95) {
      pixels[i] = 238;
      pixels[i + 1] = 238;
      pixels[i + 2] = 240;
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outputPath);

  console.log(`Wrote ${outputPath}`);
}

const lightOut = path.join(assetsDir, "lyzov-logo-transparent.png");
const darkOut = path.join(assetsDir, "lyzov-logo-dark.png");

await processLogo(inputPath, lightOut);
await processLogo(inputPath, darkOut, { darkMode: true });

for (const dir of [assetsDir, publicDir]) {
  fs.copyFileSync(lightOut, path.join(dir, "lyzov-logo.png"));
  fs.copyFileSync(darkOut, path.join(dir, "lyzov-logo-dark.png"));
}

fs.unlinkSync(lightOut);
console.log("Logo assets updated.");
