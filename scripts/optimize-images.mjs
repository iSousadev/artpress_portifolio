import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "portfolio", "assets", "optimized");

const images = [
  {
    input: ["portfolio", "images", "foto 7.png"],
    output: "hero-main.webp",
    width: 1400,
    quality: 78,
  },
  {
    input: ["portfolio", "images", "foto 5.png"],
    output: "about-main.webp",
    width: 1400,
    quality: 76,
  },
  {
    input: ["portfolio", "img", "Impressão Digital.png"],
    output: "service-digital.webp",
    width: 1400,
    quality: 76,
  },
  {
    input: ["portfolio", "img", "Banners e Faixas.png"],
    output: "service-banners.webp",
    width: 1200,
    quality: 76,
  },
  {
    input: ["portfolio", "img", "Cartões de Visita.png"],
    output: "service-cards.webp",
    width: 1200,
    quality: 76,
  },
  {
    input: ["portfolio", "img", "Embalagens Personalizadas.png"],
    output: "service-packaging.webp",
    width: 1200,
    quality: 76,
  },
  {
    input: ["portfolio", "img", "Fachadas & C. Visual.png"],
    output: "service-facades.webp",
    width: 1600,
    quality: 76,
  },
  {
    input: ["portfolio", "images", "foto 1.png"],
    output: "portfolio-1.webp",
    width: 1100,
    quality: 74,
  },
  {
    input: ["portfolio", "images", "foto 2.png"],
    output: "portfolio-2.webp",
    width: 1100,
    quality: 74,
  },
  {
    input: ["portfolio", "images", "foto 3.png"],
    output: "portfolio-3.webp",
    width: 1100,
    quality: 74,
  },
  {
    input: ["portfolio", "images", "foto 4.png"],
    output: "portfolio-4.webp",
    width: 1100,
    quality: 74,
  },
  {
    input: ["portfolio", "images", "foto 5.png"],
    output: "portfolio-5.webp",
    width: 1100,
    quality: 74,
  },
  {
    input: ["portfolio", "images", "foto 6.png"],
    output: "portfolio-6.webp",
    width: 1100,
    quality: 74,
  },
];

await fs.mkdir(outputDir, { recursive: true });

const results = [];

for (const image of images) {
  const inputPath = path.join(rootDir, ...image.input);
  const outputPath = path.join(outputDir, image.output);
  const before = await fs.stat(inputPath);

  await sharp(inputPath)
    .rotate()
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: image.quality, effort: 5 })
    .toFile(outputPath);

  const after = await fs.stat(outputPath);
  results.push({
    file: path.relative(rootDir, outputPath),
    before: before.size,
    after: after.size,
    saved: before.size - after.size,
  });
}

const totalBefore = results.reduce((sum, item) => sum + item.before, 0);
const totalAfter = results.reduce((sum, item) => sum + item.after, 0);
const formatMb = (value) => `${(value / 1024 / 1024).toFixed(2)} MB`;

console.table(
  results.map((item) => ({
    file: item.file,
    before: formatMb(item.before),
    after: formatMb(item.after),
    saved: formatMb(item.saved),
  })),
);

console.log(
  `Optimized ${results.length} images: ${formatMb(totalBefore)} -> ${formatMb(totalAfter)} (${formatMb(totalBefore - totalAfter)} saved)`,
);
