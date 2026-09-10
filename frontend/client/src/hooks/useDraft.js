/**
 * useDraft — lightweight localStorage-based draft persistence hook.
 *
 * All product drafts are stored under keys matching the pattern:
 *   product_draft_<lyId>
 *
 * A draft index is kept at `product_draft_index` (array of lyIds)
 * so the products page can discover all pending drafts without
 * iterating every localStorage key.
 */

const DRAFT_PREFIX = "product_draft_";
const DRAFT_INDEX_KEY = "product_draft_index";

/** Returns all draft lyIds stored in the index. */
export const getDraftIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY) || "[]");
  } catch {
    return [];
  }
};

/** Adds a lyId to the draft index (idempotent). */
const addToIndex = (lyId) => {
  const index = getDraftIndex();
  if (!index.includes(lyId)) {
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify([...index, lyId]));
  }
};

/** Removes a lyId from the draft index. */
const removeFromIndex = (lyId) => {
  const index = getDraftIndex().filter((id) => id !== lyId);
  localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(index));
};

/**
 * Save a draft.
 * @param {string} lyId
 * @param {object} data — { formValues, categorySelections, currentStep, existingImages }
 */
export const saveDraft = (lyId, data) => {
  if (!lyId) return;
  const payload = {
    ...data,
    lyId,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(`${DRAFT_PREFIX}${lyId}`, JSON.stringify(payload));
  addToIndex(lyId);
};

/**
 * Load a draft by lyId.
 * @returns {object|null}
 */
export const loadDraft = (lyId) => {
  if (!lyId) return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${lyId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Load the most recently saved draft (by savedAt timestamp).
 * @returns {object|null}
 */
export const loadLatestDraft = () => {
  const index = getDraftIndex();
  if (index.length === 0) return null;

  let latest = null;
  for (const lyId of index) {
    const draft = loadDraft(lyId);
    if (!draft) continue;
    if (!latest || new Date(draft.savedAt) > new Date(latest.savedAt)) {
      latest = draft;
    }
  }
  return latest;
};

/**
 * Clear a draft by lyId.
 */
export const clearDraft = (lyId) => {
  if (!lyId) return;
  localStorage.removeItem(`${DRAFT_PREFIX}${lyId}`);
  removeFromIndex(lyId);
};

/**
 * Clear ALL saved drafts.
 */
export const clearAllDrafts = () => {
  const index = getDraftIndex();
  index.forEach((lyId) => localStorage.removeItem(`${DRAFT_PREFIX}${lyId}`));
  localStorage.removeItem(DRAFT_INDEX_KEY);
};

/**
 * React hook — provides draft helpers bound to a specific lyId.
 * @param {string|null} lyId
 */
const useDraft = (lyId) => {
  const save = (data) => saveDraft(lyId, data);
  const load = () => loadDraft(lyId);
  const clear = () => clearDraft(lyId);
  const hasDraft = Boolean(lyId && loadDraft(lyId));

  return { save, load, clear, hasDraft };
};

export default useDraft;
