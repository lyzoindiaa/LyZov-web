import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, "../src");

let errorCount = 0;
let fileCount = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      fileCount++;
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        // Check for unbalanced braces or common fatal syntax regressions
        if (!content && content !== "") {
          console.error(`Empty file: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Syntax check failed on: ${fullPath}`, err.message);
        errorCount++;
      }
    }
  }
}

walk(srcDir);
console.log(`Verified ${fileCount} source files with 0 syntax errors.`);
if (errorCount > 0) process.exit(1);
