import sharp from "sharp";
import fs from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = "./public/ChatGPT_Image_May_16_2025_05_08_10_PM.png";

fs.mkdirSync("./public/icons", { recursive: true });

for (const size of sizes) {
  await sharp(inputImage)
    .resize(size, size, {
      fit: "contain",
      background: { r: 10, g: 15, b: 30, alpha: 1 },
    })
    .png()
    .toFile(`./public/icons/icon-${size}x${size}.png`);
  console.log(`Generated ${size}x${size}`);
}

console.log("All icons generated in public/icons/");
