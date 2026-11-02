import express from "express";

const app = express();
app.use(express.json({ limit: "32kb" }));

const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "";

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (SITE_ORIGIN && origin === SITE_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", SITE_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (_req, res) => res.json({ service: "Ajedrez IA", ready: Boolean(HF_TOKEN) }));

app.post("/move", async (req, res) => {
  try {
    if (req.body?.test === true) return res.json({ ok: true });
    if (!HF_TOKEN) return res.status(503).json({ error: "Falta configurar HF_TOKEN en el servidor." });

    const { fen, legalMoves } = req.body || {};
    if (typeof fen !== "string" || fen.length > 200 || !Array.isArray(legalMoves) ||
        legalMoves.length === 0 || legalMoves.length > 250 ||
        !legalMoves.every(m => typeof m === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m))) {
      return res.status(400).json({ error: "Posición o lista de movimientos no válida." });
    }

    const prompt = [
      "Eres un motor de ajedrez. Elige la mejor jugada para negras.",
      "Debes elegir EXCLUSIVAMENTE una jugada de la lista legalMoves.",
      "Devuelve solo JSON válido con esta forma: {\"move\":\"e7e5\"}. Sin explicación.",
      `FEN: ${fen}`,
      `legalMoves: ${JSON.stringify(legalMoves)}`
    ].join("\n");

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 60
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Hugging Face error:", response.status, detail.slice(0, 500));
      return res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429 ? "Cuota o límite temporal alcanzado." : "El proveedor de IA no respondió correctamente."
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) return res.status(502).json({ error: "El modelo no devolvió una jugada válida." });

    const parsed = JSON.parse(match[0]);
    const move = String(parsed.move || "").trim().toLowerCase();
    if (!legalMoves.includes(move)) {
      return res.status(502).json({ error: "El modelo propuso una jugada que no está en la lista legal." });
    }
    return res.json({ move });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno procesando la jugada." });
  }
});

app.listen(PORT, () => console.log(`Ajedrez IA escuchando en ${PORT}`));
