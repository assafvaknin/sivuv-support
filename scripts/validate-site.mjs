import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const expectedPages = [
  "index.html",
  "privacy.html",
  "terms.html",
  "accessibility.html",
];

function attributes(source) {
  const result = new Map();
  const pattern = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

function tags(html, name) {
  const pattern = new RegExp(`<${name}\\b([^>]*)>`, "gi");
  return [...html.matchAll(pattern)].map((match) => attributes(match[1]));
}

function tagCount(html, name) {
  return (html.match(new RegExp(`<${name}\\b`, "gi")) ?? []).length;
}

function pageIds(html) {
  return tags(html, "[a-z][a-z0-9:-]*")
    .map((tag) => tag.get("id"))
    .filter(Boolean);
}

function allTags(html) {
  const pattern = /<[a-z][a-z0-9:-]*\b([^>]*)>/gi;
  return [...html.matchAll(pattern)].map((match) => attributes(match[1]));
}

function addError(errors, file, message) {
  errors.push(`${file}: ${message}`);
}

export function validateSite(rootDirectory) {
  const root = resolve(rootDirectory);
  const errors = [];
  const pageContents = new Map();
  const idsByPage = new Map();

  for (const page of expectedPages) {
    const path = resolve(root, page);
    if (!existsSync(path)) {
      addError(errors, page, "required page is missing");
      continue;
    }
    const html = readFileSync(path, "utf8");
    pageContents.set(page, html);
    idsByPage.set(page, new Set(pageIds(html)));
  }

  for (const [page, html] of pageContents) {
    if (!/^\s*<!doctype html>/i.test(html)) {
      addError(errors, page, "must start with an HTML doctype");
    }

    const htmlTag = tags(html, "html")[0];
    if (!htmlTag || htmlTag.get("lang") !== "he" || htmlTag.get("dir") !== "rtl") {
      addError(errors, page, 'must declare <html lang="he" dir="rtl">');
    }

    const metas = tags(html, "meta");
    const charset = metas.find((meta) => meta.has("charset"))?.get("charset")?.toLowerCase();
    if (charset !== "utf-8") addError(errors, page, "must declare UTF-8 encoding");

    const viewport = metas.find((meta) => meta.get("name")?.toLowerCase() === "viewport");
    if (!viewport?.get("content")) addError(errors, page, "must include a viewport meta tag");

    const description = metas.find((meta) => meta.get("name")?.toLowerCase() === "description");
    if (!description?.get("content")?.trim()) addError(errors, page, "must include a description");

    const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    if (!title) addError(errors, page, "must include a non-empty title");
    if (tagCount(html, "main") !== 1) addError(errors, page, "must contain exactly one main element");
    if (tagCount(html, "h1") !== 1) addError(errors, page, "must contain exactly one h1");

    const ids = pageIds(html);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    for (const id of duplicateIds) addError(errors, page, `duplicate id "${id}"`);

    const ownIds = idsByPage.get(page) ?? new Set();
    for (const tag of allTags(html)) {
      for (const id of (tag.get("aria-labelledby") ?? "").split(/\s+/).filter(Boolean)) {
        if (!ownIds.has(id)) addError(errors, page, `aria-labelledby points to missing id "${id}"`);
      }
    }

    const stylesheets = tags(html, "link").filter((link) =>
      (link.get("rel") ?? "").toLowerCase().split(/\s+/).includes("stylesheet"),
    );
    if (stylesheets.length === 0) addError(errors, page, "must link a stylesheet");

    for (const tag of [...tags(html, "a"), ...stylesheets]) {
      const href = tag.get("href")?.trim();
      if (!href) {
        addError(errors, page, "link is missing an href");
        continue;
      }
      if (/^http:\/\//i.test(href)) {
        addError(errors, page, `insecure link "${href}"`);
        continue;
      }
      if (/^(?:https:|mailto:|tel:|data:|\/\/)/i.test(href)) continue;

      const [rawPath, fragment] = href.split("#", 2);
      const cleanPath = decodeURIComponent(rawPath.split("?", 1)[0]);
      const targetPath = resolve(root, dirname(page), cleanPath || page);
      const relativeTarget = relative(root, targetPath);
      if (isAbsolute(relativeTarget) || relativeTarget.startsWith("..")) {
        addError(errors, page, `local link escapes the site root: "${href}"`);
        continue;
      }
      if (!existsSync(targetPath)) {
        addError(errors, page, `broken local link "${href}"`);
        continue;
      }
      if (fragment && extname(targetPath).toLowerCase() === ".html") {
        const targetPage = relativeTarget || page;
        const targetIds = idsByPage.get(targetPage);
        if (!targetIds?.has(decodeURIComponent(fragment))) {
          addError(errors, page, `link points to missing anchor "${href}"`);
        }
      }
    }

    if (page !== "index.html" && !tags(html, "a").some((link) => link.get("href") === "index.html")) {
      addError(errors, page, "must link back to index.html");
    }
  }

  const home = pageContents.get("index.html");
  if (home) {
    const homeLinks = new Set(tags(home, "a").map((link) => link.get("href")));
    for (const page of expectedPages.slice(1)) {
      if (!homeLinks.has(page)) addError(errors, "index.html", `must link to ${page}`);
    }
  }

  const stylesheetPath = resolve(root, "styles.css");
  if (!existsSync(stylesheetPath)) {
    addError(errors, "styles.css", "required stylesheet is missing");
  } else {
    const css = readFileSync(stylesheetPath, "utf8");
    for (const feature of [":focus-visible", "@media (max-width", "prefers-color-scheme: dark"]) {
      if (!css.includes(feature)) addError(errors, "styles.css", `missing required responsive/accessibility rule: ${feature}`);
    }
  }

  return errors;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const errors = validateSite(repositoryRoot);
  if (errors.length > 0) {
    console.error(`Site validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${expectedPages.length} HTML pages and styles.css successfully.`);
  }
}
