import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../app/dashboard/hackathons/[id]/register/page.tsx", import.meta.url),
  "utf8",
);

test("team registration page posts to the team registration endpoint", () => {
  assert.match(source, /\/teams\/\$\{selected\.team\.id\}\/register\/\$\\?hackathonId/);
});

test("team registration page does not substitute individual registration", () => {
  assert.doesNotMatch(source, /\/participants\/join\//);
  assert.match(source, /only team owners can register a team/i);
});

test("team registration is restricted to teams owned by the current user", () => {
  assert.match(source, /team\.owner_id === user\.id/);
  assert.match(source, /selected\.team\.owner_id === currentUser\.id/);
});
