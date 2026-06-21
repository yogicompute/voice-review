import Groq from "groq-sdk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function transcribeAudio(
  buffer: Buffer,
  filename: string = "audio.mp3"
): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `vr_${Date.now()}_${filename}`);

  try {
    fs.writeFileSync(tmpPath, buffer);

    // response_format: "text" returns a plain string directly
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "whisper-large-v3",
      response_format: "verbose_json", // ← use verbose_json instead, always returns an object
      language: "en",
    });

    const text = transcription.text?.trim() ?? "";
    console.log("✅ Transcript:", text);
    return text;

  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}