import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");

const readCsv = (name) =>
  parse(fs.readFileSync(path.join(dataDir, name), "utf8"), {
    columns: true,
    skip_empty_lines: true
  });

const training = readCsv("training_source.csv");
const normalized = readCsv("normalized_output.csv");

const detailsByKey = new Map(
  normalized.map(row => [
    String(row["Museum Object Id"]),
    row
  ])
);
console.log("details " + JSON.stringify(detailsByKey));
const supportedInstruments = new Set(["Pakhawaj", "Been", "Manjira"]);

const parseInstruments = (value = "") => {
  // training_source stores a Python-style list of quoted strings.
  const matches = value.match(/'([^']+)'/g) || [];
  return matches
    .map(x => x.slice(1, -1))
    .filter(name => supportedInstruments.has(name));
};

const paintings = training.map(row => {
  const details =
    detailsByKey.get(String(row.id)) || {};
  return {
    id: String(row.id),
    museum: row.museum_index,
    title: row.title,
    imageUrl: row.image_url,
    sourceUrl: details["Source Url"] || "",
    approxDate: details["Approx Date"] || "",
    dynasty: details["Dynesty"] || "",
    artist: details["Name of the artist if available"] || "",
    comments: details["Comments"] || "",
    instruments: parseInstruments(row.instruments)
  };
});

const museumInfo = {
  met: { id: "met", name: "The Metropolitan Museum of Art", shortName: "The Met", location: "New York" },
  cma: { id: "cma", name: "Cleveland Museum of Art", shortName: "Cleveland Museum of Art", location: "Cleveland" }
};

const app = express();

app.get("/api/museums", (_req, res) => {
  res.json(Object.values(museumInfo).map(m => ({
    ...m,
    count: paintings.filter(p => p.museum === m.id).length
  })));
});

app.get("/api/paintings", (req, res) => {
  let result = paintings;
  if (req.query.museum) result = result.filter(p => p.museum === req.query.museum);
  if (req.query.instrument) result = result.filter(p => p.instruments.includes(req.query.instrument));
  res.json(result);
});

app.get("/api/instruments", (_req, res) => {
  const counts = {};
  paintings.forEach(p => p.instruments.forEach(i => counts[i] = (counts[i] || 0) + 1));
  res.json(Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name)));
});

app.get("/api/paintings/:museum/:id", (req, res) => {
  const painting = paintings.find(p => p.museum === req.params.museum && p.id === req.params.id);
  if (!painting) return res.status(404).json({ error: "Painting not found" });
  console.log(painting)
  res.json(painting);
});

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(3001, () => console.log("Nād-Chitra server running on http://localhost:3001"));
