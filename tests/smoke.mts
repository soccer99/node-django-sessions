// Runtime smoke test. Run it with: npm run test:runtimes
// It checks the built package in Node, Deno, and Bun. tsc checks the types.
import { readFileSync } from "node:fs";
import { createSession, decodeSession } from "../dist/index.mjs";

const secretKey = "test_django_secret_key_123";
const fixture = JSON.parse(readFileSync(new URL("./fixtures/django-6.1.json", import.meta.url), "utf8"));

for (const [name, { data, session }] of Object.entries(fixture.cases) as [string, { data: unknown; session: string }][]) {
	const decoded = await decodeSession(session, { secretKey });
	if (JSON.stringify(decoded) !== JSON.stringify(data)) throw new Error(`${name}: decode mismatch`);
	const made = await createSession(data, { secretKey });
	const back = await decodeSession(made, { secretKey });
	if (JSON.stringify(back) !== JSON.stringify(data)) throw new Error(`${name}: round-trip mismatch`);
}
console.log("ok");
