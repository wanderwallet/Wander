const fs = require("fs");
const path = require("path");

// Skip if in production mode
if (process.env.NODE_ENV === "production") {
  console.log("🚫 Skipping patch: NODE_ENV is production");
  process.exit(0);
}

const pkgPath = path.join(__dirname, "..", "node_modules", "math-intrinsics", "package.json");

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  if (pkg.main === false) {
    delete pkg.main;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`✅ Removed "main: false" from math-intrinsics`);
  } else {
    console.log(`ℹ️ Nothing to patch in math-intrinsics`);
  }
} catch (err) {
  console.error(`❌ Failed to patch math-intrinsics:`, err.message);
}
