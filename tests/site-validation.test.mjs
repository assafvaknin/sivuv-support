import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { expectedPages, validateSite } from "../scripts/validate-site.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "sivuv-support-test-"));
  for (const file of [...expectedPages, "styles.css"]) {
    cpSync(resolve(repositoryRoot, file), resolve(directory, file));
  }
  return directory;
}

function withFixture(run) {
  const directory = fixture();
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("the current support site passes validation", () => {
  assert.deepEqual(validateSite(repositoryRoot), []);
});

test("a broken local link is reported", () => withFixture((directory) => {
  const path = resolve(directory, "index.html");
  const html = readFileSync(path, "utf8").replace('href="privacy.html"', 'href="missing.html"');
  writeFileSync(path, html);
  assert(validateSite(directory).some((error) => error.includes('broken local link "missing.html"')));
}));

test("a missing aria-labelledby target is reported", () => withFixture((directory) => {
  const path = resolve(directory, "index.html");
  const html = readFileSync(path, "utf8").replace('aria-labelledby="contact-title"', 'aria-labelledby="missing-title"');
  writeFileSync(path, html);
  assert(validateSite(directory).some((error) => error.includes('missing id "missing-title"')));
}));

test("an insecure external link is reported", () => withFixture((directory) => {
  const path = resolve(directory, "terms.html");
  const html = readFileSync(path, "utf8").replace("</main>", '<a href="http://example.com">example</a></main>');
  writeFileSync(path, html);
  assert(validateSite(directory).some((error) => error.includes("insecure link")));
}));
