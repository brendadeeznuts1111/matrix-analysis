import { presentation, sections, slides } from "./data";
import type { SlideType } from "./types";

const TYPE_ICONS: Record<SlideType, string> = {
  cover: "🎯",
  toc: "📋",
  section: "📖",
  subsection: "📑",
  content: "📄",
  code: "💻",
  demo: "🎮",
  summary: "📊",
  final: "🚀",
};

console.log("\n🎨 Bun Advanced APIs - Presentation Structure\n");
console.log("═".repeat(70));

// Meta info
console.log(`\n📦 ${presentation.meta.title}`);
console.log(`   ${presentation.meta.subtitle} (v${presentation.meta.version})\n`);

// Sections overview
console.log("📚 Sections\n");
const sectionTable = sections.map((s) => ({
  Icon: s.icon,
  ID: s.id,
  Title: s.title,
  API: s.api,
  Category: s.category,
  Slides: s.slides.length,
}));
console.log(Bun.inspect.table(sectionTable, undefined, { colors: true }));

// Full slide hierarchy
console.log("\n📑 Slide Hierarchy\n");

const slideTable = slides.map((s) => {
  const section = s.sectionId ? sections.find((sec) => sec.id === s.sectionId) : null;
  const indent = s.type === "section" || s.type === "cover" || s.type === "final" ? "" : "  ";

  return {
    "#": String(s.number).padStart(2, "0"),
    Type: `${TYPE_ICONS[s.type]} ${s.type}`,
    Section: section ? section.icon : "—",
    ID: s.id,
    Title: indent + (s.title.length > 30 ? s.title.slice(0, 27) + "..." : s.title),
    Subtitle: s.subtitle ? (s.subtitle.length > 25 ? s.subtitle.slice(0, 22) + "..." : s.subtitle) : "—",
  };
});
console.log(Bun.inspect.table(slideTable, undefined, { colors: true }));

// Stats
console.log("\n📊 Statistics\n");

const typeCounts = slides.reduce(
  (acc, slide) => {
    acc[slide.type] = (acc[slide.type] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

const statsTable = Object.entries(typeCounts).map(([type, count]) => ({
  Type: `${TYPE_ICONS[type as SlideType]} ${type}`,
  Count: count,
  Pct: `${Math.round((count / slides.length) * 100)}%`,
}));
console.log(Bun.inspect.table(statsTable, undefined, { colors: true }));

console.log(`\nTotal: ${slides.length} slides across ${sections.length} sections`);
console.log("\n─".repeat(70));
console.log("Commands:");
console.log("  bun run build        Generate HTML slides");
console.log("  bun run build light  Generate with light theme");
console.log("  bun run serve        Start preview server");
console.log("");
