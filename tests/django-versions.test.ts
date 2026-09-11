import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createSession, decodeSession } from "../src";

// Real Django makes the fixtures with a fixed clock. See tests/fixtures/gen.sh.
const dir = join(__dirname, "fixtures");
const secretKey = "test_django_secret_key_123";
type Case = { data: unknown; session: string };
const fixtures: { django: string; cases: Record<string, Case> }[] = readdirSync(dir)
	.filter((f) => f.endsWith(".json"))
	.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

afterEach(() => jest.restoreAllMocks());

describe.each(fixtures)("Django $django", ({ cases }) => {
	test.each(Object.entries(cases))("%s: decode", async (_name, { data, session }) => {
		expect(await decodeSession(session, { secretKey })).toStrictEqual(data);
	});

	test.each(Object.entries(cases))("%s: create is byte-exact", async (_name, { data, session }) => {
		jest.spyOn(Date, "now").mockReturnValue(1735969655000);
		expect(await createSession(data, { secretKey })).toBe(session);
	});
});
