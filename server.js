import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY fehlt. Trage sie in .env ein.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "4mb" }));
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const webSearch = Boolean(req.body.webSearch);

    const response = await client.responses.create({
      model,
      instructions:
        "Du bist Nova, ein moderner hilfreicher KI-Assistent. " +
        "Antworte standardmäßig auf Deutsch, wenn der Nutzer Deutsch schreibt. " +
        "Sei direkt, verständlich und hilfreich. " +
        "Wenn Websuche aktiviert ist, nutze aktuelle Webinformationen. " +
        "Wenn der Nutzer YouTube verlangt, gib am Ende eine kurze Zeile mit " +
        "YOUTUBE_SEARCH: <Suchbegriff> aus.",
      input: messages,
      ...(webSearch ? { tools: [{ type: "web_search_preview" }] } : {})
    });

    res.json({ text: response.output_text || "Keine Antwort erhalten." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err?.message || "Die Anfrage konnte nicht verarbeitet werden."
    });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "Kein Prompt." });

    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt
    });

    const item = result.data?.[0];
    if (item?.b64_json) {
      return res.json({ image: `data:image/png;base64,${item.b64_json}` });
    }
    if (item?.url) return res.json({ image: item.url });

    res.status(500).json({ error: "Kein Bild zurückgegeben." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err?.message || "Bild konnte nicht generiert werden."
    });
  }
});

app.get("*splat", (_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, () => {
  console.log(`Nova AI läuft auf http://localhost:${port}`);
});