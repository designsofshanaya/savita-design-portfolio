const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  const file = path.resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : pathname),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(data);
  });
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.TEST_BROWSER_PATH
      ? { executablePath: process.env.TEST_BROWSER_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage();
    const errors = [],
      badResponses = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) badResponses.push(r.url());
    });
    await page.addInitScript(() => {
      window.audioContextsCreated = 0;
      const Original = window.AudioContext;
      if (Original)
        window.AudioContext = class extends Original {
          constructor(...args) {
            super(...args);
            window.audioContextsCreated++;
          }
        };
    });
    for (const file of [
      "index.html",
      "keymitra.html",
      "stories-between-the-letters.html",
      "dear-zindagi.html",
      "tomorrow-in-motion.html",
      "resume.html",
    ]) {
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + file, { waitUntil: "networkidle" });
        const state = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          failedImages: [...document.images].filter(
            (i) => i.complete && !i.naturalWidth,
          ).length,
        }));
        assert.equal(
          state.scrollWidth,
          state.width,
          `${file}: horizontal overflow at ${width}px`,
        );
        assert.equal(state.failedImages, 0, `${file}: failed image`);
        assert.equal(
          await page.getByRole("heading", { level: 1 }).count(),
          1,
          `${file}: missing/duplicate main heading`,
        );
      }
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(
        violations,
        [],
        `${file}: accessibility violations ${JSON.stringify(violations)}`,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base);
    for (const [category, count] of [
      ["Interaction", 1],
      ["Graphics", 1],
      ["Motion", 2],
      ["All", 4],
    ]) {
      await page.locator(`[data-filter="${category}"]`).click();
      assert.equal(await page.locator("[data-project]:visible").count(), count);
      assert.equal(
        await page
          .locator(`[data-filter="${category}"]`)
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.match(
        await page.locator("#project-status").innerText(),
        new RegExp(`^${count} `),
      );
    }
    assert.equal(
      await page.evaluate(() => window.audioContextsCreated),
      0,
      "Ordinary clicks must stay silent",
    );
    assert.equal(
      await page.locator("#character-video").getAttribute("src"),
      null,
      "Character MP4 must not load before opt-in",
    );
    await page.getByRole("button", { name: "Enable character motion" }).click();
    await page.waitForFunction(
      () => document.getElementById("character-video").readyState >= 2,
    );
    assert.equal(
      await page.locator("#motion-toggle").getAttribute("aria-pressed"),
      "true",
    );
    await page
      .getByRole("button", { name: "Disable character motion" })
      .click();
    assert.equal(await page.locator("#character-video").isHidden(), true);
    await page.getByRole("button", { name: "Play lo-fi music" }).click();
    assert.equal(
      await page.locator("#lofi-toggle").getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await page.evaluate(() => window.audioContextsCreated), 1);
    await page.getByRole("button", { name: "Pause lo-fi music" }).click();
    assert.equal(
      await page.locator("#lofi-toggle").getAttribute("aria-pressed"),
      "false",
    );
    await page.locator('a[href="keymitra.html"]').first().click();
    assert.match(page.url(), /keymitra\.html$/);
    assert.match(
      await page.locator("main").innerText(),
      /user flows, wireframes, and interface designs/,
    );
    assert.match(
      await page.locator("main").innerText(),
      /qualitative usability testing is reported/i,
    );
    await page.goBack();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    assert.equal(await page.locator("#site-navigation").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#site-navigation").isHidden(), true);
    assert.equal(
      await page
        .locator(".menu-toggle")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.getElementById("motion-toggle").disabled,
    );
    assert.equal(await page.locator("#character-video").isHidden(), true);
    await page.goto(base + "resume.html");
    assert.match(
      await page.locator("main").innerText(),
      /Somaiya School of Design/,
    );
    assert.match(
      await page.locator("main").innerText(),
      /English · Hindi · Marathi/,
    );
    const download = await page
      .getByRole("link", { name: /Download résumé PDF/ })
      .getAttribute("href");
    const response = await page.request.get(base + download);
    assert.equal(response.status(), 200);
    assert.equal((await response.body()).subarray(0, 4).toString(), "%PDF");
    const noScript = await browser.newPage({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await noScript.goto(base);
    assert.equal(
      await noScript
        .getByRole("link", { name: "About", exact: true })
        .isVisible(),
      true,
      "Navigation must work without JavaScript",
    );
    assert.equal(await noScript.locator("[data-project]:visible").count(), 4);
    await noScript.close();
    const noAudio = await browser.newPage();
    const fallbackErrors = [];
    noAudio.on("pageerror", (e) => fallbackErrors.push(e.message));
    await noAudio.addInitScript(() => {
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
    });
    await noAudio.goto(base);
    assert.equal(await noAudio.locator("#lofi-toggle").isHidden(), true);
    assert.deepEqual(
      fallbackErrors,
      [],
      "Unsupported audio must degrade gracefully",
    );
    await noAudio.close();
    assert.deepEqual(errors, [], "Browser runtime errors");
    assert.deepEqual(badResponses, [], "Broken local assets or links");
    console.log(
      "PASS: six pages at four widths; accessibility rules; filters; project navigation; menu/keyboard; opt-in audio/motion; reduced motion; readable résumé and PDF.",
    );
  } finally {
    await browser.close();
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.close());
