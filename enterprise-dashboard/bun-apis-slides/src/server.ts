import { presentation } from "./data";

const PORT = parseInt(Bun.env.PORT || "3000");
const args = new Set(Bun.argv.slice(2));

const CHROME_PROFILE = "bun-apis-slides";

// Parse flags
const shouldOpen = args.has("--open") || args.has("-o");
const shouldHelp = args.has("--help") || args.has("-h");

if (shouldHelp) {
  console.log(`
🎨 Bun APIs Slides Server

Usage: bun run serve [options]

Options:
  -o, --open    Open Chrome with dedicated profile
  -h, --help    Show this help message

Environment:
  PORT          Server port (default: 3000)
`);
  process.exit(0);
}

// Check if dist exists, build if not
const distExists = await Bun.file("./dist/index.html").exists();
if (!distExists) {
  console.log("Building slides...");
  await Bun.spawn(["bun", "run", "build"], { cwd: import.meta.dirname + "/.." }).exited;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API endpoint for slide data
    if (url.pathname === "/api/slides") {
      return Response.json(presentation);
    }

    // Serve static files from dist
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const file = Bun.file("./dist/index.html");
      return new Response(file, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`\n🎨 Bun APIs Slides Server`);
console.log(`${"─".repeat(40)}`);
console.log(`Local:   http://localhost:${server.port}`);
console.log(`Profile: ${CHROME_PROFILE}`);
console.log(`Slides:  ${presentation.slides.length} total`);
console.log(`\nKeyboard shortcuts:`);
console.log(`  → / Space  Next slide`);
console.log(`  ←          Previous slide`);
console.log(`  Home       First slide`);
console.log(`  End        Last slide`);
console.log(`\nPress Ctrl+C to stop\n`);

// Open Chrome with dedicated profile
if (shouldOpen) {
  const url = `http://localhost:${server.port}`;
  console.log(`Opening Chrome (${CHROME_PROFILE})...`);

  if (process.platform === "darwin") {
    Bun.spawn([
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      `--profile-directory=${CHROME_PROFILE}`,
      url,
    ]);
  } else if (process.platform === "win32") {
    Bun.spawn(["cmd", "/c", "start", "chrome", `--profile-directory=${CHROME_PROFILE}`, url]);
  } else {
    Bun.spawn(["google-chrome", `--profile-directory=${CHROME_PROFILE}`, url]);
  }
}
