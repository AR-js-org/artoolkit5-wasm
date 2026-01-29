import { execSync } from "node:child_process";
import { globSync } from "glob";
import process from "node:process";

// Check if clang-format is available
try {
    execSync("clang-format --version", { stdio: "ignore" });
} catch (e) {
    console.error("Error: clang-format is not found in PATH.");
    console.error("Please install it or add it to your PATH.");
    process.exit(1);
}

const args = process.argv.slice(2);
const isLint = args.includes("--lint");

// Find C++ files
const files = globSync("cpp/**/*.{cpp,h,c,hpp}", { windowsPathsNoEscape: true });

if (files.length === 0) {
    console.log("No C++ files found.");
    process.exit(0);
}

console.log(`Found ${files.length} files.`);

// Construct command
const command = isLint
    ? `clang-format --dry-run -Werror ${files.map(f => `"${f}"`).join(" ")}`
    : `clang-format -i ${files.map(f => `"${f}"`).join(" ")}`;

try {
    console.log(`Running: ${isLint ? "Linting" : "Formatting"}...`);
    execSync(command, { stdio: "inherit" });
    console.log(isLint ? "Lint passed!" : "Formatting complete!");
} catch (e) {
    console.error(isLint ? "Lint failed! Run 'npm run format:cpp' to fix." : "Formatting failed.");
    process.exit(1);
}
