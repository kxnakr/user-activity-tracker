import express from "express";

const app = express();

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

const port = Number(Bun.env.PORT ?? 8000);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
