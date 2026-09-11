import { createSession, decodeSession } from "../src";

const djangoSecretKey = "test_django_secret_key_123";

afterEach(() => jest.restoreAllMocks());

test("round-trips compressed and non-ascii data", async () => {
	const data = {
		_auth_user_backend: "django.contrib.auth.backends.ModelBackend",
		_auth_user_hash: "test",
		_auth_user_id: "1",
		name: "Zoë 😀",
		pad: "x".repeat(200),
	};
	const session = await createSession(data, { secretKey: djangoSecretKey });
	expect(session.startsWith(".")).toBe(true);
	expect(session).toMatch(/^[A-Za-z0-9._:-]+$/);
	expect(await decodeSession(session, { secretKey: djangoSecretKey })).toStrictEqual(data);
});

test("uses DJANGO_SECRET_KEY env var", async () => {
	process.env.DJANGO_SECRET_KEY = djangoSecretKey;
	try {
		const session = await createSession({ a: 1 });
		expect(await decodeSession(session)).toStrictEqual({ a: 1 });
	} finally {
		delete process.env.DJANGO_SECRET_KEY;
	}
});

test("missing secret key", async () => {
	await expect(createSession({})).rejects.toThrow("No secret key provided");
});
