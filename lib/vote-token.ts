export const VOTE_TOKEN_STORAGE_KEY = "wc_vote_token_v2";
export const SUBMITTED_PREDICTION_STORAGE_KEY =
  "wc_prediction_submitted_id_v2";

const LEGACY_SUBMITTED_PREDICTION_STORAGE_KEY =
  "wc_prediction_submitted_id";

const LEGACY_STORAGE_KEYS = [
  "wc_vote_token",
  LEGACY_SUBMITTED_PREDICTION_STORAGE_KEY
] as const;

type TokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getOrCreateVoteToken(
  storage: TokenStorage,
  createToken: () => string = () => crypto.randomUUID()
) {
  const existing = storage.getItem(VOTE_TOKEN_STORAGE_KEY);
  if (existing) return existing;

  const token = createToken();
  storage.setItem(VOTE_TOKEN_STORAGE_KEY, token);
  return token;
}

export function clearLegacyPredictionIdentity(storage: TokenStorage) {
  for (const key of LEGACY_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

export function getStoredSubmission(storage: TokenStorage) {
  const currentId = storage.getItem(SUBMITTED_PREDICTION_STORAGE_KEY);
  if (currentId) return { id: currentId, source: "current" as const };

  const legacyId = storage.getItem(
    LEGACY_SUBMITTED_PREDICTION_STORAGE_KEY
  );
  if (legacyId) return { id: legacyId, source: "legacy" as const };

  return null;
}
