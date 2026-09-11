// Start wrangler dev, call the worker one time, then stop wrangler.
import { spawn } from "node:child_process";
const port = 8799;
const wrangler = spawn("npx", ["wrangler", "dev", "--port", String(port)], { cwd: import.meta.dirname, stdio: "ignore" });
let text = "";
for (let i = 0; i < 60 && text !== "ok"; i++) {
	await new Promise((r) => setTimeout(r, 2000));
	text = await fetch(`http://localhost:${port}`).then((r) => r.text()).catch(() => "");
}
wrangler.kill();
console.log(text || "no response from wrangler");
if (text !== "ok") process.exit(1);
