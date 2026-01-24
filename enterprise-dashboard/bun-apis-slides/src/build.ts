import { presentation, sections } from "./data";
import { M3_COLORS } from "./google-bun-bridge";
import type { Slide, SlideType } from "./types";

/**
 * Theme using Material 3 (M3) Design System
 * Aligned with Google's official color specifications
 */
const THEME = {
  dark: {
    bg: M3_COLORS.dark.surface,              // #141218
    bgSecondary: M3_COLORS.dark.surfaceContainer, // #211F26
    text: M3_COLORS.dark.onSurface,          // #E6E0E9
    textMuted: M3_COLORS.dark.outline,       // #938F99
    accent: M3_COLORS.dark.primary,          // #D0BCFF
    accentSecondary: M3_COLORS.dark.error,   // #FFB4AB
    border: M3_COLORS.dark.outline,          // #938F99
    code: "#1E1B21",
  },
  light: {
    bg: M3_COLORS.surface,                   // #FEF7FF
    bgSecondary: M3_COLORS.surfaceVariant,   // #E7E0EC
    text: M3_COLORS.onSurface,               // #1D1B20
    textMuted: M3_COLORS.onSurfaceVariant,   // #49454F
    accent: M3_COLORS.primary,               // #6750A4
    accentSecondary: M3_COLORS.error,        // #BA1A1A
    border: M3_COLORS.outline,               // #79747E
    code: M3_COLORS.surfaceVariant,          // #E7E0EC
  },
};

function getSlideStyles(type: SlideType, theme: keyof typeof THEME): string {
  const t = THEME[theme];

  const base = `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100vh;
    padding: 4rem;
    box-sizing: border-box;
    background: ${t.bg};
    color: ${t.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const typeStyles: Record<SlideType, string> = {
    cover: `${base} text-align: center;`,
    toc: `${base} align-items: flex-start;`,
    section: `${base} background: linear-gradient(135deg, ${t.accent}22, ${t.bg});`,
    subsection: `${base} background: linear-gradient(135deg, ${t.accent}11, ${t.bg});`,
    content: `${base} align-items: flex-start;`,
    code: `${base} align-items: flex-start; background: ${t.bgSecondary};`,
    demo: `${base} align-items: flex-start; background: linear-gradient(135deg, ${t.accentSecondary}11, ${t.bg});`,
    summary: `${base} align-items: flex-start;`,
    final: `${base} background: linear-gradient(135deg, ${t.accentSecondary}22, ${t.bg}); text-align: center;`,
  };

  return typeStyles[type];
}

function renderToc(theme: keyof typeof THEME): string {
  const t = THEME[theme];
  return sections
    .map(
      (s, i) => `
      <li style="margin: 0.75rem 0; display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">${s.icon}</span>
        <span style="color: ${t.text}; font-weight: 500;">${s.title}</span>
        <span style="color: ${t.textMuted}; font-size: 0.9rem; margin-left: auto;">${s.category}</span>
      </li>`
    )
    .join("");
}

function renderSlide(slide: Slide, theme: keyof typeof THEME): string {
  const t = THEME[theme];
  const styles = getSlideStyles(slide.type, theme);
  const section = slide.sectionId ? sections.find((s) => s.id === slide.sectionId) : null;

  const isLargeTitle = slide.type === "cover" || slide.type === "section" || slide.type === "final";
  const titleSize = isLargeTitle ? "3.5rem" : "2.5rem";

  // Icon display
  const iconHtml = slide.icon
    ? `<span style="font-size: ${isLargeTitle ? "4rem" : "2rem"}; margin-bottom: 1rem; display: block;">${slide.icon}</span>`
    : "";

  // Subtitle display
  const subtitleHtml = slide.subtitle
    ? `<p style="font-size: 1.5rem; color: ${t.accent}; margin-bottom: 1rem; font-weight: 500;">${Bun.escapeHTML(slide.subtitle)}</p>`
    : "";

  // Tags display
  const tagsHtml = slide.tags?.length
    ? `<div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; flex-wrap: wrap;">
        ${slide.tags.map((tag) => `<span style="padding: 0.25rem 0.75rem; background: ${t.bgSecondary}; border: 1px solid ${t.border}; border-radius: 1rem; font-size: 0.8rem; color: ${t.textMuted};">${tag}</span>`).join("")}
       </div>`
    : "";

  // Section breadcrumb
  const breadcrumbHtml = section
    ? `<div style="position: absolute; top: 2rem; left: 2rem; color: ${t.textMuted}; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>${section.icon}</span>
        <span>${section.title}</span>
       </div>`
    : "";

  // Content based on type
  let contentHtml = "";
  if (slide.type === "toc") {
    contentHtml = `<ol style="font-size: 1.2rem; list-style: none; padding: 0; width: 100%; max-width: 600px;">${renderToc(theme)}</ol>`;
  } else {
    contentHtml = `<p style="font-size: 1.4rem; color: ${t.textMuted}; max-width: 800px; line-height: 1.8;">${Bun.escapeHTML(slide.content)}</p>`;
  }

  // Type indicator for code/demo slides
  const typeIndicator =
    slide.type === "code"
      ? `<span style="position: absolute; top: 2rem; right: 2rem; padding: 0.25rem 0.75rem; background: ${t.accent}22; color: ${t.accent}; border-radius: 0.25rem; font-size: 0.8rem; font-family: monospace;">CODE</span>`
      : slide.type === "demo"
        ? `<span style="position: absolute; top: 2rem; right: 2rem; padding: 0.25rem 0.75rem; background: ${t.accentSecondary}22; color: ${t.accentSecondary}; border-radius: 0.25rem; font-size: 0.8rem;">DEMO</span>`
        : "";

  return `
    <section class="slide" data-slide="${slide.number}" data-id="${slide.id}" data-type="${slide.type}" style="${styles}">
      ${breadcrumbHtml}
      ${typeIndicator}
      <div style="max-width: 1000px; width: 100%;">
        ${iconHtml}
        <h1 style="font-size: ${titleSize}; margin-bottom: 0.5rem; color: ${slide.type === "section" ? t.accent : t.text};">
          ${Bun.escapeHTML(slide.title)}
        </h1>
        ${subtitleHtml}
        ${contentHtml}
        ${tagsHtml}
        <div style="position: absolute; bottom: 2rem; right: 2rem; color: ${t.textMuted}; font-size: 0.9rem;">
          ${slide.number} / ${presentation.slides.length}
        </div>
      </div>
    </section>
  `;
}

function generateHTML(theme: keyof typeof THEME = "dark"): string {
  const t = THEME[theme];
  const slidesHtml = presentation.slides.map((slide) => renderSlide(slide, theme)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${Bun.escapeHTML(presentation.meta.title)} - ${Bun.escapeHTML(presentation.meta.subtitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-snap-type: y mandatory; }
    body { background: ${t.bg}; overflow-x: hidden; }
    .slide { scroll-snap-align: start; scroll-snap-stop: always; position: relative; }
    .controls {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 1rem;
      z-index: 100;
    }
    .controls button {
      padding: 0.75rem 1.5rem;
      background: ${t.bgSecondary};
      border: 1px solid ${t.border};
      color: ${t.text};
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .controls button:hover { background: ${t.accent}33; border-color: ${t.accent}; }
    .slide-nav {
      position: fixed;
      right: 2rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 100;
    }
    .slide-nav button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid ${t.border};
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
      padding: 0;
    }
    .slide-nav button:hover { border-color: ${t.accent}; }
    .slide-nav button.active { background: ${t.accent}; border-color: ${t.accent}; }
    .slide-nav button.section { width: 16px; height: 16px; }
    @media print {
      .controls, .slide-nav { display: none; }
      .slide { page-break-after: always; height: 100vh; }
    }
  </style>
</head>
<body>
  ${slidesHtml}
  <div class="controls">
    <button onclick="prevSlide()">← Prev</button>
    <button onclick="nextSlide()">Next →</button>
  </div>
  <nav class="slide-nav" id="slideNav"></nav>

  <!-- Feedback Button -->
  <button id="feedback-btn" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${t.accent};
    color: ${t.bg};
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    z-index: 1000;
    transition: transform 0.2s;
  " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
    💬 Feedback
  </button>

  <!-- Feedback Modal -->
  <div id="feedback-modal" style="
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    justify-content: center;
    align-items: center;
    z-index: 2000;
  ">
    <div style="
      background: ${t.bgSecondary};
      padding: 24px;
      border-radius: 12px;
      width: 400px;
      max-width: 90%;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; color: ${t.text};">Send Feedback</h3>
        <button id="feedback-close" style="background: none; border: none; color: ${t.textMuted}; font-size: 24px; cursor: pointer;">×</button>
      </div>
      <form id="feedback-form">
        <input type="hidden" name="slide" id="feedback-slide" />
        <input type="hidden" name="selection" id="feedback-selection" />
        <div id="feedback-context" style="
          display: none;
          margin-bottom: 12px;
          padding: 8px 12px;
          background: ${t.bg};
          border-left: 3px solid ${t.accent};
          border-radius: 4px;
          font-size: 13px;
          color: ${t.textMuted};
          font-style: italic;
        "></div>
        <label style="display: block; margin-bottom: 12px; color: ${t.textMuted};">
          Type:
          <select name="type" style="
            width: 100%;
            padding: 8px;
            margin-top: 4px;
            background: ${t.bg};
            border: 1px solid ${t.border};
            border-radius: 6px;
            color: ${t.text};
          ">
            <option value="suggestion">💡 Suggestion</option>
            <option value="bug">🐛 Bug/Issue</option>
            <option value="question">❓ Question</option>
            <option value="praise">⭐ Praise</option>
          </select>
        </label>
        <label style="display: block; margin-bottom: 16px; color: ${t.textMuted};">
          Comment:
          <textarea name="comment" required rows="4" style="
            width: 100%;
            padding: 8px;
            margin-top: 4px;
            background: ${t.bg};
            border: 1px solid ${t.border};
            border-radius: 6px;
            color: ${t.text};
            resize: vertical;
            box-sizing: border-box;
          " placeholder="Your feedback about this slide..."></textarea>
        </label>
        <button type="submit" style="
          width: 100%;
          padding: 12px;
          background: ${t.accent};
          color: ${t.bg};
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">Submit Feedback</button>
        <p id="feedback-status" style="margin: 8px 0 0; text-align: center; font-size: 14px;"></p>
      </form>
    </div>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const nav = document.getElementById('slideNav');

    // Build navigation dots
    slides.forEach((slide, i) => {
      const btn = document.createElement('button');
      btn.dataset.index = i;
      btn.title = slide.dataset.id;
      if (slide.dataset.type === 'section' || slide.dataset.type === 'cover') {
        btn.classList.add('section');
      }
      btn.onclick = () => goToSlide(i);
      nav.appendChild(btn);
    });

    function updateNav() {
      nav.querySelectorAll('button').forEach((btn, i) => {
        btn.classList.toggle('active', i === currentSlide);
      });
    }

    function goToSlide(n) {
      currentSlide = Math.max(0, Math.min(n, totalSlides - 1));
      slides[currentSlide].scrollIntoView({ behavior: 'smooth' });
      updateNav();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    document.addEventListener('keydown', (e) => {
      // Skip if typing in textarea/input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
      if (e.key === 'Home') { e.preventDefault(); goToSlide(0); }
      if (e.key === 'End') { e.preventDefault(); goToSlide(totalSlides - 1); }
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); openFeedback(); }
      if (e.key === 'Escape') { feedbackModal.style.display = 'none'; }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          currentSlide = parseInt(entry.target.dataset.slide) - 1;
          updateNav();
        }
      });
    }, { threshold: 0.5 });

    slides.forEach((slide) => observer.observe(slide));
    updateNav();

    // Feedback functionality
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackStatus = document.getElementById('feedback-status');
    const feedbackContext = document.getElementById('feedback-context');
    const feedbackSelection = document.getElementById('feedback-selection');

    function openFeedback() {
      // Capture any selected text
      const selection = window.getSelection().toString().trim();
      document.getElementById('feedback-slide').value = currentSlide + 1;

      if (selection) {
        feedbackSelection.value = selection;
        feedbackContext.textContent = '"' + (selection.length > 100 ? selection.slice(0, 100) + '...' : selection) + '"';
        feedbackContext.style.display = 'block';
      } else {
        feedbackSelection.value = '';
        feedbackContext.style.display = 'none';
      }

      feedbackModal.style.display = 'flex';
      document.querySelector('#feedback-form textarea').focus();
    }

    feedbackBtn.addEventListener('click', openFeedback);

    feedbackClose.addEventListener('click', () => {
      feedbackModal.style.display = 'none';
    });

    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) feedbackModal.style.display = 'none';
    });

    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(feedbackForm);
      const selection = formData.get('selection');
      const data = {
        slide: parseInt(formData.get('slide')),
        type: formData.get('type'),
        comment: formData.get('comment'),
        selection: selection || null,
        timestamp: new Date().toISOString(),
      };

      try {
        const res = await fetch('http://localhost:3001/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          feedbackStatus.textContent = '✓ Feedback submitted!';
          feedbackStatus.style.color = '#4ade80';
          feedbackForm.reset();
          setTimeout(() => { feedbackModal.style.display = 'none'; feedbackStatus.textContent = ''; }, 1500);
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        feedbackStatus.textContent = '✗ Could not submit. Is feedback server running?';
        feedbackStatus.style.color = '#f87171';
      }
    });
  </script>
</body>
</html>`;
}

// Build output
const outputDir = "./dist";
const args = Bun.argv.slice(2);
const theme = (args.find(a => a === "light" || a === "dark") as keyof typeof THEME) || "dark";
const watchMode = args.includes("--watch") || args.includes("-w");

async function build() {
  await Bun.write(`${outputDir}/index.html`, generateHTML(theme));
  console.log(`Built slides to ${outputDir}/index.html (theme: ${theme})`);
  console.log(`Total slides: ${presentation.slides.length}`);
  console.log(`Sections: ${sections.length}`);
}

await build();

// Watch mode: auto-rebuild on data.ts changes
if (watchMode) {
  console.log(`\n🔄 Watch mode - monitoring src/data.ts for changes`);
  console.log(`   Press Ctrl+C to exit\n`);

  const { watch } = await import("fs");
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch("./src/data.ts", async (eventType) => {
    if (eventType !== "change") return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\n🔄 data.ts changed, rebuilding...`);
      try {
        // Re-import fresh data (Bun caches imports, need dynamic import with cache bust)
        const timestamp = Date.now();
        const freshData = await import(`./data.ts?t=${timestamp}`);
        Object.assign(presentation, freshData.presentation);
        await build();
        console.log(`✓ Rebuilt at ${new Date().toLocaleTimeString()}`);
      } catch (err) {
        console.error(`✗ Build failed:`, (err as Error).message);
      }
    }, 100);
  });

  // Keep process alive
  await new Promise(() => {});
}
