import sharp from "sharp";

export async function convertImage(input: Buffer<ArrayBuffer> | string): Promise<Buffer<ArrayBufferLike>> {
  return sharp(input).resize({ width: 500, height: 500, withoutEnlargement: true, fit: "cover" }).toBuffer();
}
