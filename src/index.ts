import * as crypto from "node:crypto";
import zlib from "zlib";

const DEFAULT_SALT = "django.contrib.sessions.SessionStore";

async function calculateSignature(
	value: string,
	key: string,
	salt: string,
): Promise<string> {
	const keyData = Buffer.from(`${salt}signer${key}`);
	const keyHash = crypto.createHash("sha256").update(keyData).digest();

	const hmac = crypto.createHmac("sha256", keyHash);
	const signature = hmac.update(value).digest();

	return signature
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

function decodeBase64(s: string): Uint8Array {
	const mod = s.length % 4;
	const padding = "=".repeat(mod === 0 ? 0 : 4 - mod);

	const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");

	const binaryStr = atob(base64.split(":")[0]);
	const bytes = new Uint8Array(binaryStr.length);
	for (let i = 0; i < binaryStr.length; i++) {
		bytes[i] = binaryStr.charCodeAt(i);
	}
	return bytes;
}

async function verifyAndExtractData(
	signedValue: string,
	key: string,
	salt: string,
): Promise<string> {
	const lastColon = signedValue.lastIndexOf(":");
	if (lastColon === -1) {
		throw new Error("No signature delimiter found");
	}

	const value = signedValue.slice(0, lastColon);
	const signature = signedValue.slice(lastColon + 1);
	const expectedSignature = await calculateSignature(value, key, salt);

	if (signature !== expectedSignature) {
		throw new Error("Invalid signature");
	}

	return value;
}

interface SessionOptions {
	secretKey?: string;
	salt?: string;
}

export async function decodeSession(
	sessionData: string,
	options: SessionOptions = {},
): Promise<unknown> {
	const secretKey = options.secretKey || process.env.DJANGO_SECRET_KEY;
	if (!secretKey) {
		throw new Error(
			"No secret key provided. Pass it in the options param under key 'secretKey' or set DJANGO_SECRET_KEY environment variable.",
		);
	}
	const salt = options.salt || DEFAULT_SALT;
	const value = await verifyAndExtractData(sessionData, secretKey, salt);

	const isCompressed = value.startsWith(".");
	const b64Data = isCompressed ? value.slice(1) : value;
	let data = decodeBase64(b64Data);

	if (isCompressed) {
		data = zlib.inflateSync(data);
	}

	return JSON.parse(new TextDecoder("latin1").decode(data));
}
