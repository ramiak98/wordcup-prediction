import assert from "node:assert/strict";
import test from "node:test";
import {
  clearLegacyPredictionIdentity,
  getStoredSubmission,
  getOrCreateVoteToken,
  SUBMITTED_PREDICTION_STORAGE_KEY,
  VOTE_TOKEN_STORAGE_KEY
} from "../lib/vote-token.ts";
import { findPredictionByVoteToken } from "../lib/prediction-duplicates.ts";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test("separate browsers receive different random vote tokens", () => {
  const firstBrowser = createStorage();
  const secondBrowser = createStorage();

  const firstToken = getOrCreateVoteToken(
    firstBrowser,
    () => "11111111-1111-4111-8111-111111111111"
  );
  const secondToken = getOrCreateVoteToken(
    secondBrowser,
    () => "22222222-2222-4222-8222-222222222222"
  );

  assert.notEqual(firstToken, secondToken);
  assert.equal(firstBrowser.getItem(VOTE_TOKEN_STORAGE_KEY), firstToken);
  assert.equal(secondBrowser.getItem(VOTE_TOKEN_STORAGE_KEY), secondToken);
});

test("the same browser reuses its random vote token", () => {
  const storage = createStorage({
    [VOTE_TOKEN_STORAGE_KEY]: "11111111-1111-4111-8111-111111111111"
  });

  const token = getOrCreateVoteToken(storage, () => {
    throw new Error("A stored token should be reused.");
  });

  assert.equal(token, "11111111-1111-4111-8111-111111111111");
});

test("legacy collision-prone identity keys are removed", () => {
  const storage = createStorage({
    wc_vote_token: "shared-device-fingerprint",
    wc_prediction_submitted_id: "another-users-prediction",
    [SUBMITTED_PREDICTION_STORAGE_KEY]: "current-prediction"
  });

  clearLegacyPredictionIdentity(storage);

  assert.equal(storage.getItem("wc_vote_token"), null);
  assert.equal(storage.getItem("wc_prediction_submitted_id"), null);
  assert.equal(
    storage.getItem(SUBMITTED_PREDICTION_STORAGE_KEY),
    "current-prediction"
  );
});

test("existing voters retain their legacy saved prediction until they reset it", () => {
  const storage = createStorage({
    wc_prediction_submitted_id: "existing-prediction"
  });

  assert.deepEqual(getStoredSubmission(storage), {
    id: "existing-prediction",
    source: "legacy"
  });
});

test("the current saved prediction takes precedence over a legacy value", () => {
  const storage = createStorage({
    wc_prediction_submitted_id: "legacy-prediction",
    [SUBMITTED_PREDICTION_STORAGE_KEY]: "current-prediction"
  });

  assert.deepEqual(getStoredSubmission(storage), {
    id: "current-prediction",
    source: "current"
  });
});

test("duplicate lookup uses only the random vote token", async () => {
  const calls = [];
  const supabase = {
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) {
          calls.push(["select", columns]);
          return {
            eq(column, value) {
              calls.push(["eq", column, value]);
              return {
                async limit(count) {
                  calls.push(["limit", count]);
                  return { data: [], error: null };
                }
              };
            }
          };
        }
      };
    }
  };

  await findPredictionByVoteToken(
    supabase,
    "11111111-1111-4111-8111-111111111111"
  );

  assert.deepEqual(calls, [
    ["from", "users_predictions"],
    ["select", "id"],
    ["eq", "vote_token", "11111111-1111-4111-8111-111111111111"],
    ["limit", 1]
  ]);
});
