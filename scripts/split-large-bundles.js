#!/usr/bin/env node

/**
 * Post-build script to split large JS bundles for Firefox AMO compliance.
 * Firefox's validator rejects JS files larger than 5MB (FILE_TOO_LARGE error).
 *
 * Approach (no eval required - CSP-safe for MV3):
 * 1. Parse the Parcel bundle to find the module registry boundaries
 * 2. Split module entries across multiple chunk files using Object.assign
 * 3. Each chunk contains real executable JS (not strings)
 * 4. Bootstrap file runs the Parcel runtime with the accumulated modules
 * 5. HTML files and manifest.json are updated to load chunks before bootstrap
 */

const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "../build/firefox-mv3-prod");
const MAX_CHUNK_BYTES = 4 * 1024 * 1024; // 4MB per chunk (safe margin under 5MB)
const GLOBAL_NAME = "__pm";

function findFilesWithExt(dir, ext) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesWithExt(full, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Find the Parcel module registry boundaries in the bundle code.
 * Returns { preambleAndRuntime, registryContent, postamble } or null.
 *
 * Parcel bundle structure:
 *   var r,n;"function"==typeof(r=globalThis.define)&&(n=r,r=null),
 *   function(n,i,s,o,a){ RUNTIME }({
 *     MODULE_REGISTRY
 *   },["entries"],"main","parcelRequireXXX"),globalThis.define=n;
 */
function parseParcelBundle(code) {
  // Find }({ which marks: runtime } + call ( + registry {
  // This is the boundary between the runtime function and the registry object
  const callOpen = code.indexOf("}({");
  if (callOpen === -1) return null;

  // Everything up to and including the runtime's closing }
  const preambleAndRuntime = code.slice(0, callOpen + 1);
  const registryOpenBrace = callOpen + 2; // position of {

  // Find "parcelRequire" from the end to locate the end of the bundle
  const pqIdx = code.lastIndexOf('"parcelRequire');
  if (pqIdx === -1) return null;

  // Find the closing } of the registry object by looking for }]} pattern
  // }]} means: } closes last deps obj, ] closes last module array, } closes registry
  let registryCloseBrace = -1;
  for (let i = pqIdx; i > pqIdx - 500 && i >= 0; i--) {
    if (code[i] === "}" && code[i + 1] === "]" && code[i + 2] === "}") {
      registryCloseBrace = i + 2; // the } that closes the registry
      break;
    }
  }

  if (registryCloseBrace === -1) return null;

  const registryContent = code.slice(registryOpenBrace, registryCloseBrace + 1); // {..}
  const postamble = code.slice(registryCloseBrace + 1); // ,["entries"],...),globalThis.define=n;

  return { preambleAndRuntime, registryContent, postamble };
}

/**
 * Find module boundaries in the registry using pattern matching.
 * Returns array of split positions (byte offsets into registryContent).
 */
function findModuleBoundaries(registryContent) {
  // Module boundary pattern: ],"identifier":[function( or ],identifier:[function(
  const pattern = /\],("?[a-zA-Z0-9_]{2,12}"?):\[function\(/g;
  const boundaries = [];
  let match;
  while ((match = pattern.exec(registryContent)) !== null) {
    // Split point is right after the ] (before the comma)
    boundaries.push(match.index + 1); // position of ,
  }
  return boundaries;
}

/**
 * Split registry content into groups that fit under MAX_CHUNK_BYTES.
 */
function splitRegistry(registryContent, boundaries) {
  if (boundaries.length === 0) {
    return [registryContent];
  }

  // Include the end of registry as an implicit boundary so the tail
  // content (after the last real boundary) is also size-checked.
  const endPos = registryContent.length - 1; // position of closing }
  const allPositions = [...boundaries, endPos];

  const groups = [];
  let groupStart = 1; // skip opening {
  let groupByteSize = 0;

  // Overhead per chunk: Object.assign wrapper (~80 bytes)
  const overhead = 100;

  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    const prevPos = i === 0 ? 1 : allPositions[i - 1];
    const segmentBytes = Buffer.byteLength(registryContent.slice(prevPos, pos), "utf8");

    if (groupByteSize + segmentBytes + overhead > MAX_CHUNK_BYTES && groupByteSize > 0) {
      // Current group is full, finalize it
      groups.push(registryContent.slice(groupStart, prevPos));
      groupStart = prevPos;
      groupByteSize = segmentBytes; // start new group with current segment
    } else {
      groupByteSize += segmentBytes;
    }
  }

  // Last group: from groupStart to end (before closing })
  const lastContent = registryContent.slice(groupStart, registryContent.length - 1);
  if (lastContent.length > 0) {
    groups.push(lastContent);
  }

  // Clean up: strip leading comma from groups
  return groups.map((g) => (g.startsWith(",") ? g.slice(1) : g));
}

/**
 * Verify split integrity by reconstructing the registry from chunks
 * and comparing byte-for-byte against the original.
 * Critical for wallet safety — a dropped module could break signing/transactions.
 */
function verifyIntegrity(registryContent, groups) {
  const reconstructed = "{" + groups.join(",") + "}";

  if (reconstructed.length !== registryContent.length) {
    console.error(
      `  INTEGRITY FAILURE: length mismatch (original=${registryContent.length}, reconstructed=${reconstructed.length})`,
    );
    return false;
  }

  if (reconstructed !== registryContent) {
    for (let i = 0; i < reconstructed.length; i++) {
      if (reconstructed[i] !== registryContent[i]) {
        console.error(`  INTEGRITY FAILURE: content mismatch at position ${i}`);
        console.error(`  Expected: ...${registryContent.slice(Math.max(0, i - 30), i + 30)}...`);
        console.error(`  Got:      ...${reconstructed.slice(Math.max(0, i - 30), i + 30)}...`);
        break;
      }
    }
    return false;
  }

  return true;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const fileSize = Buffer.byteLength(content, "utf8");

  if (fileSize <= 5 * 1024 * 1024) {
    return null;
  }

  console.log(`  Original size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

  const parsed = parseParcelBundle(content);
  if (!parsed) {
    console.error("  FATAL: Could not parse Parcel bundle structure for file >5MB — cannot split safely");
    process.exit(1);
  }

  const { preambleAndRuntime, registryContent, postamble } = parsed;
  console.log(`  Registry: ${(Buffer.byteLength(registryContent, "utf8") / 1024 / 1024).toFixed(2)}MB`);

  const boundaries = findModuleBoundaries(registryContent);
  console.log(`  Module boundaries found: ${boundaries.length}`);

  if (boundaries.length === 0) {
    console.error("  FATAL: No module boundaries found in file >5MB — cannot split safely");
    process.exit(1);
  }

  const groups = splitRegistry(registryContent, boundaries);

  if (groups.length <= 1) {
    console.error("  FATAL: Registry fits in one chunk but file >5MB — cannot split further");
    process.exit(1);
  }

  console.log(`  Split into ${groups.length} module chunks`);

  // Verify split integrity before writing any files
  if (!verifyIntegrity(registryContent, groups)) {
    console.error("  FATAL: Split integrity check failed — aborting to protect wallet code");
    process.exit(1);
  }
  console.log("  Integrity check passed");

  const baseName = path.basename(filePath, ".js").replace(/[^a-zA-Z0-9]/g, "_");
  const dir = path.dirname(filePath);
  const chunkPaths = [];

  // Write module chunks
  for (let i = 0; i < groups.length; i++) {
    const assignTarget =
      i === 0 ? `globalThis.${GLOBAL_NAME}=globalThis.${GLOBAL_NAME}||{}` : `globalThis.${GLOBAL_NAME}`;

    const chunkContent = `Object.assign(${assignTarget},{${groups[i]}});\n`;
    const chunkFileName = `${baseName}.p${i}.js`;
    const chunkPath = path.join(dir, chunkFileName);

    fs.writeFileSync(chunkPath, chunkContent);
    chunkPaths.push(chunkPath);

    const chunkBytes = Buffer.byteLength(chunkContent, "utf8");
    if (chunkBytes > 5 * 1024 * 1024) {
      console.error(
        `  FATAL: Chunk ${chunkFileName} is ${(chunkBytes / 1024 / 1024).toFixed(2)}MB (>5MB) — a single module may be too large to split`,
      );
      process.exit(1);
    }
    console.log(`  -> ${chunkFileName} (${(chunkBytes / 1024 / 1024).toFixed(2)}MB)`);
  }

  // Write bootstrap (replaces original file)
  // This runs the Parcel runtime with the accumulated module registry
  const bootstrap = `${preambleAndRuntime}(globalThis.${GLOBAL_NAME}${postamble}delete globalThis.${GLOBAL_NAME};\n`;
  fs.writeFileSync(filePath, bootstrap);

  const bootBytes = Buffer.byteLength(bootstrap, "utf8");
  console.log(`  -> ${path.basename(filePath)} (${(bootBytes / 1024).toFixed(1)}KB) [bootstrap]`);

  return { mainFile: filePath, chunkPaths };
}

function updateHtmlFiles(buildDir, mainFilePath, chunkPaths) {
  const relMain = "/" + path.relative(buildDir, mainFilePath).replace(/\\/g, "/");
  const htmlFiles = findFilesWithExt(buildDir, ".html");

  for (const htmlFile of htmlFiles) {
    let html = fs.readFileSync(htmlFile, "utf8");
    if (!html.includes(relMain)) continue;

    const chunkTags = chunkPaths
      .map((p) => "/" + path.relative(buildDir, p).replace(/\\/g, "/"))
      .map((rel) => `<script src="${rel}"></script>`)
      .join("");

    // Insert chunk scripts before the main (bootstrap) script
    // Handle both deferred and non-deferred script tags
    const deferTag = `<script src="${relMain}" defer></script>`;
    const plainTag = `<script src="${relMain}"></script>`;

    if (html.includes(deferTag)) {
      const chunkTagsDefer = chunkPaths
        .map((p) => "/" + path.relative(buildDir, p).replace(/\\/g, "/"))
        .map((rel) => `<script src="${rel}" defer></script>`)
        .join("");
      html = html.replace(deferTag, `${chunkTagsDefer}${deferTag}`);
    } else if (html.includes(plainTag)) {
      html = html.replace(plainTag, `${chunkTags}${plainTag}`);
    }

    fs.writeFileSync(htmlFile, html);
    console.log(`  Updated: ${path.basename(htmlFile)}`);
  }
}

function updateManifest(buildDir, mainFilePath, chunkPaths) {
  const relMain = path.relative(buildDir, mainFilePath).replace(/\\/g, "/");
  const manifestPath = path.join(buildDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) return;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (manifest.background && manifest.background.scripts) {
    const idx = manifest.background.scripts.indexOf(relMain);
    if (idx !== -1) {
      const chunkRels = chunkPaths.map((p) => path.relative(buildDir, p).replace(/\\/g, "/"));
      manifest.background.scripts.splice(idx, 0, ...chunkRels);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      console.log(`  Updated: manifest.json (background.scripts)`);
    }
  }
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`Build directory not found: ${BUILD_DIR}`);
    process.exit(1);
  }

  console.log(`Build dir: ${BUILD_DIR}`);
  console.log(`Max chunk size: ${(MAX_CHUNK_BYTES / 1024 / 1024).toFixed(1)}MB\n`);

  const jsFiles = findFilesWithExt(BUILD_DIR, ".js");
  const largeFiles = jsFiles.filter((f) => fs.statSync(f).size > 5 * 1024 * 1024);

  if (largeFiles.length === 0) {
    console.log("All files are under 5MB. No splitting needed.");
    return;
  }

  console.log(`Found ${largeFiles.length} file(s) exceeding 5MB:\n`);

  for (const file of largeFiles) {
    console.log(`Processing: ${path.relative(BUILD_DIR, file)}`);
    const result = processFile(file);
    if (result) {
      updateHtmlFiles(BUILD_DIR, result.mainFile, result.chunkPaths);
      updateManifest(BUILD_DIR, result.mainFile, result.chunkPaths);
    }
    console.log("");
  }

  // Final verification
  const remaining = findFilesWithExt(BUILD_DIR, ".js").filter((f) => fs.statSync(f).size > 5 * 1024 * 1024);

  if (remaining.length > 0) {
    console.error("WARNING: The following files still exceed 5MB:");
    for (const f of remaining) {
      const size = fs.statSync(f).size;
      console.error(`  ${path.relative(BUILD_DIR, f)} (${(size / 1024 / 1024).toFixed(2)}MB)`);
    }
    process.exit(1);
  }

  console.log("All files are now under 5MB.");
}

main();
