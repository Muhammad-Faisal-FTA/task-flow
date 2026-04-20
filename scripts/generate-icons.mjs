// scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "../public");
const iconsDir  = join(publicDir, "icons");

// Create icons directory
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate a simple blue checkmark icon programmatically
// Replace svgSource with your actual logo SVG if you have one
const svgSource = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#071A2E"/>
  <rect width="512" height="512" rx="80" fill="#1565A8" opacity="0.9"/>
  <polyline
    points="140,256 220,336 372,176"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="52"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`;

const svgBuffer = Buffer.from(svgSource);

async function generateIcons() {
  console.log("Generating PWA icons...");

  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Also generate apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png");

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, "favicon-32x32.png"));
  console.log("  ✓ favicon-32x32.png");

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);