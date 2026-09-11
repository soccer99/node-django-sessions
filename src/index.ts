/**
 * Read and write Django session data in Node.js, Deno, and Bun.
 *
 * The format is the same as `django.core.signing.dumps(..., compress=True)`.
 * Django 4.2, 5.2, and 6.1 can read the output.
 *
 * @example
 * ```ts
 * import { createSession, decodeSession } from "@soccer99/node-django-sessions";
 *
 * const session = await createSession({ _auth_user_id: "1" }, { secretKey: "django-secret" });
 * const data = await decodeSession(session, { secretKey: "django-secret" });
 * ```
 *
 * @module
 */
import { Buffer } from "node:buffer";
import * as crypto from "node:crypto";
import * as zlib from "node:zlib";

const DEFAULT_SALT = "django.contrib.sessions.SessionStore";
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Options for {@link decodeSession} and {@link createSession}. */
export interface SessionOptions {
	/** The Django `SECRET_KEY`. If not set, the `DJANGO_SECRET_KEY` env var is used. */
	secretKey?: string;
	/** The signing salt. The default is the Django session salt. Change it only if your Django config does. */
	salt?: string;
}

function resolveOptions(options: SessionOptions) {
	const secretKey = options.secretKey || process.env.DJANGO_SECRET_KEY;
	if (!secretKey) {
		throw new Error(
			"No secret key provided. Pass it in the options param under key 'secretKey' or set DJANGO_SECRET_KEY environment variable.",
		);
	}
	return { secretKey, salt: options.salt || DEFAULT_SALT };
}

// Same as django.core.signing.Signer.signature.
// The HMAC-SHA256 key is sha256(salt + "signer" + key).
function signature(value: string, key: string, salt: string): string {
	const keyHash = crypto.createHash("sha256").update(`${salt}signer${key}`).digest();
	return crypto.createHmac("sha256", keyHash).update(value).digest("base64url");
}

// Same as django.core.signing.b62_encode.
function b62(n: number): string {
	let out = "";
	do {
		out = B62[n % 62] + out;
		n = Math.floor(n / 62);
	} while (n > 0);
	return out;
}

/**
 * Read a Django session string and return its data.
 *
 * The function checks the signature first. Then it decodes the base64 data.
 * If the data is compressed, the function inflates it.
 *
 * @param sessionData The `session_data` value from the `django_session` table.
 * @param options The secret key and salt.
 * @returns The session data as a JSON value.
 * @throws Error if the secret key is missing, the format is wrong, or the signature does not match.
 */
export async function decodeSession(
	sessionData: string,
	options: SessionOptions = {},
): Promise<unknown> {
	const { secretKey, salt } = resolveOptions(options);

	const sep = sessionData.lastIndexOf(":");
	if (sep === -1) {
		throw new Error("No signature delimiter found");
	}
	const value = sessionData.slice(0, sep);
	const sig = Buffer.from(sessionData.slice(sep + 1));
	const expected = Buffer.from(signature(value, secretKey, salt));
	if (Buffer.byteLength(sig) !== Buffer.byteLength(expected) || !crypto.timingSafeEqual(sig, expected)) {
		throw new Error("Invalid signature");
	}

	const [payload] = value.split(":"); // Remove the TimestampSigner timestamp.
	const compressed = payload.startsWith(".");
	let data: Buffer = Buffer.from(compressed ? payload.slice(1) : payload, "base64url");
	if (compressed) {
		data = zlib.inflateSync(data);
	}
	return JSON.parse(data.toString("latin1"));
}

/**
 * Make a Django session string from data.
 *
 * Django can read the output. The output is the same as
 * `django.core.signing.dumps(data, salt, compress=True)`.
 *
 * @param data Any JSON value. Django reads it as a dict, list, or scalar.
 * @param options The secret key and salt.
 * @returns The signed session string. Store it in the `django_session` table.
 * @throws Error if the secret key is missing.
 */
export async function createSession(
	data: unknown,
	options: SessionOptions = {},
): Promise<string> {
	const { secretKey, salt } = resolveOptions(options);

	// Make the same bytes as the Django JSONSerializer:
	// json.dumps(ensure_ascii=True).encode("latin-1")
	const json = JSON.stringify(data).replace(
		/[^\x00-\x7f]/g,
		(c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
	);
	const bytes = Buffer.from(json, "latin1");

	// Same as Signer.sign_object(compress=True). Use zlib only if it makes the data smaller.
	let payload = bytes.toString("base64url");
	const compressed = zlib.deflateSync(bytes);
	if (Buffer.byteLength(compressed) < Buffer.byteLength(bytes) - 1) {
		payload = "." + compressed.toString("base64url");
	}

	const value = `${payload}:${b62(Math.floor(Date.now() / 1000))}`;
	return `${value}:${signature(value, secretKey, salt)}`;
}
