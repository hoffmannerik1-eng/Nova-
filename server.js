const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Dein API-Key wird NICHT aus dem Code gelesen,
// sondern aus der Server-Umgebungsvariable.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY wurde nicht gefunden!");
    console.error("Setze deinen API-Key als Umgebungsvariable.");
    process.exit(1);
}

app.use(express.json());
app.use(express.static("public"));

app.post("/api/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Keine Nachricht erhalten."
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
            encodeURIComponent(API_KEY),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Fehler:", data);

            return res.status(response.status).json({
                error: "Die KI konnte nicht antworten."
            });
        }

        const answer =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Ich konnte leider keine Antwort erzeugen.";

        res.json({
            answer: answer
        });

    } catch (error) {
        console.error("Serverfehler:", error);

        res.status(500).json({
            error: "Interner Serverfehler."
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
