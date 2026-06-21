import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadAudio(
  buffer: Buffer,
  folder: string = "voicereview"
): Promise<{ url: string; duration: number; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary uses "video" for audio files
        folder,
        format: "mp3",
        transformation: [{ audio_codec: "mp3", bit_rate: "64k" }],
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          duration: result.duration ?? 0,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}