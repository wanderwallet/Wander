const fs = require("fs");

try {
  console.log("Patching @plasmohq/parcel-bundler for Firefox bundle splitting");

  const bundlerPath = require.resolve("@plasmohq/parcel-bundler/dist/index.js");
  let content = fs.readFileSync(bundlerPath, "utf-8");

  const target = "minBundles:2,minBundleSize:1e3,maxParallelRequests:100";

  if (content.includes(target)) {
    console.log("Already patched");
  } else {
    // Match any variant of the EXTENSION_OPTIONS pattern
    const re = /minBundles:\s*[\d.e]+\s*,\s*minBundleSize:\s*[\d.e]+\s*,\s*maxParallelRequests:\s*[\d.e]+/;
    if (re.test(content)) {
      content = content.replace(re, target);
      fs.writeFileSync(bundlerPath, content);
      console.log("Patched: minBundles->2, minBundleSize->1000, maxParallelRequests->100");
    } else {
      console.error("Could not find EXTENSION_OPTIONS pattern in bundler - skipping patch");
    }
  }
} catch (err) {
  console.error("Failed to patch @plasmohq/parcel-bundler:", err.message);
}
