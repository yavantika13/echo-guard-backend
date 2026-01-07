import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const upload = multer();

// Health check
app.get("/", (req, res) => {
  res.send("Echo Guard Backend Running");
});

// Receive audio and send to Gemini
app.post("/analyze-audio", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const base64Audio = req.file.buffer.toString("base64");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "This is wildlife forest audio. Detect tiger, chainsaw, gunshot, human or normal forest. Reply only one word."
                },
                {
                  inlineData: {
                    mimeType: "audio/wav",
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const label =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "unknown";

    res.json({ label });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Echo Guard backend running on port", PORT);
});
