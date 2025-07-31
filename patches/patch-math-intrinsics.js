const fs = require("fs");

try {
  console.log("🔍 Patching math-intrinsics");

  const pkgPath = require.resolve("math-intrinsics/package.json");
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
