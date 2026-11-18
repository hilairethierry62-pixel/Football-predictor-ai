const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_FOOTBALL_KEY;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, apiKeyConfigured: Boolean(API_KEY) });
});

app.get("/api/fixtures", async (req, res) => {
  if (!API_KEY) {
    return res.status(503).json({
      error: "API_FOOTBALL_KEY pa konfigire nan Render Environment Variables."
    });
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "")
    ? req.query.date
    : new Date().toISOString().slice(0, 10);

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}`,
      { headers: { "x-apisports-key": API_KEY } }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: "API-Football pa retounen yon repons nòmal.",
        details: data
      });
    }

    const fixtures = (data.response || []).map((item) => ({
      id: item.fixture?.id,
      date: item.fixture?.date,
      status: item.fixture?.status?.long,
      league: item.league?.name,
      country: item.league?.country,
      home: item.teams?.home?.name,
      away: item.teams?.away?.name,
      homeGoals: item.goals?.home,
      awayGoals: item.goals?.away
    }));

    res.json({ date, count: fixtures.length, fixtures });
  } catch (_error) {
    res.status(500).json({ error: "Erè koneksyon pandan rechèch match yo." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Football Predictor AI ap koute sou pò ${PORT}`);
});
