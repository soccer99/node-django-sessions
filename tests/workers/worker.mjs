// Cloudflare Workers smoke test. Run it with: npm run test:workers
import { createSession, decodeSession } from "../../dist/index.mjs";
import fixture from "../fixtures/django-6.1.json";

const secretKey = "test_django_secret_key_123";

export default {
	async fetch() {
		for (const [name, { data, session }] of Object.entries(fixture.cases)) {
			const decoded = await decodeSession(session, { secretKey });
			if (JSON.stringify(decoded) !== JSON.stringify(data)) return new Response(`${name}: decode mismatch`, { status: 500 });
			const back = await decodeSession(await createSession(data, { secretKey }), { secretKey });
			if (JSON.stringify(back) !== JSON.stringify(data)) return new Response(`${name}: round-trip mismatch`, { status: 500 });
		}
		return new Response("ok");
	},
};
