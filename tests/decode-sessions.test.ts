import { decodeSession } from "../src";

const djangoSecretKey = "test_django_secret_key_123";

test("decodes a basic django user session", async () => {
	const sessionData =
		"eyJfYXV0aF91c2VyX2lkIjoiMSIsInRlc3QiOiJ0ZXN0In0:1tTx0Z:lmnR-uT2WAz0QaKSOPBRcnmbFsLrCmU0tdPwpZwQH2c";
	const result = await decodeSession(sessionData, {
		secretKey: djangoSecretKey,
	});
	expect(result).toStrictEqual({ _auth_user_id: "1", test: "test" });
});

test("decode anonymous user session", async () => {
	const sessionData =
		"eyJ0ZXN0IjoidGVzdCJ9:1tTx2e:cLJA-rvF94U-ejQ_06paewGPjA78IC8Iz2Z_4xiKxlU";
	const result = await decodeSession(sessionData, {
		secretKey: djangoSecretKey,
	});
	expect(result).toStrictEqual({ test: "test" });
});

test("decode logged in user session with more data", async () => {
	const sessionData =
		".eJyrVipJLS5RsoJQOkrxiaUlGfGlxalF8ZkpQGFDVLGkxOTs1DyQREpWYl56vl5yfl5JUWaSHkiJHlS2WM83PyU1xwmqFsWAjMTiDJhttQDHuix7:1tTx5X:f22SIYKmSaV_yYEO1rYVSWr5-eIVXOWW6_Fh3orDXHs";
	const result = await decodeSession(sessionData, {
		secretKey: djangoSecretKey,
	});
	expect(result).toStrictEqual({
		_auth_user_backend: "django.contrib.auth.backends.ModelBackend",
		_auth_user_hash: "test",
		_auth_user_id: "1",
		test: "test",
	});
});

test("test invalid secret key", async () => {
	const sessionData =
		"eyJ0ZXN0IjoidGVzdCJ9:1tTx2e:cLJA-rvF94U-ejQ_06paewGPjA78IC8Iz2Z_4xiKxlU";
	await expect(
		decodeSession(sessionData, { secretKey: "invalid_key" }),
	).rejects.toThrow("Invalid signature");
});

test("test missing secret key", async () => {
	const sessionData =
		"eyJ0ZXN0IjoidGVzdCJ9:1tTx2e:cLJA-rvF94U-ejQ_06paewGPjA78IC8Iz2Z_4xiKxlU";
	await expect(decodeSession(sessionData)).rejects.toThrow(
		"No secret key provided. Pass it in the options param under key 'secretKey' or set DJANGO_SECRET_KEY environment variable.",
	);
});

test("test missing signature delimiter", async () => {
	const sessionData = "eyJ0ZXN0IjoidGVzdCJ9";
	await expect(
		decodeSession(sessionData, { secretKey: djangoSecretKey }),
	).rejects.toThrow("No signature delimiter found");
});
