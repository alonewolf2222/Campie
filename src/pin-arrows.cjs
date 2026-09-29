const fs = require("fs");

const base = "C:/Users/MAN OF FAITH/Desktop/my research/aziz/src/components";
const targets = [
  { file: "FoodSection.tsx", from: 'className="flex items-center justify-center gap-3 mb-6"', to: 'className="flex items-center justify-between gap-3 mb-6 px-9"' },
  { file: "EventsSection.tsx", from: 'className="flex items-center justify-center gap-3 mb-4"', to: 'className="flex items-center justify-between gap-3 mb-4 px-9"' },
];

for (const t of targets) {
  const p = base + "/" + t.file;
  let s = fs.readFileSync(p, "utf8");
  if (s.includes(t.to)) {
    console.log(t.file + " ALREADY PINNED");
  } else if (s.includes(t.from)) {
    const n = s.split(t.from).join(t.to);
    fs.writeFileSync(p, n);
    console.log(t.file + " PINNED (justify-between + px-9)");
  } else {
    console.log(t.file + " ANCHOR MISSING -> " + t.from);
  }
}
