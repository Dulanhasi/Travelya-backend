const db = require("../config/database");

/* =========================================================
   UUID v4 validation
   Rejects any non-UUID value (including SQLite integer IDs)
========================================================= */
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value) {
  return typeof value === "string" && UUID_V4_RE.test(value);
}

/* =========================================================
   CREATE JOURNAL
   Idempotent: safe to call multiple times with same journalId.
   - 201: new journal created
   - 200: journal already existed (duplicate, treated as success)
   - 400: missing fields or journalId is not a valid UUID v4
========================================================= */
const createJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId, title, tripId, isPublic } = req.body;

    if (!isValidUUID(journalId)) {
      console.warn(
        `[createJournal] REJECTED invalid journalId | userId=${userId} journalId=${JSON.stringify(journalId)} ts=${new Date().toISOString()}`,
      );
      return res.status(400).json({
        success: false,
        message: "journalId must be a valid UUID v4",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    }

    console.log(
      `[createJournal] REQUEST | userId=${userId} journalId=${journalId} ts=${new Date().toISOString()}`,
    );

    const [travelers] = await db.query(
      "SELECT travelerId FROM travelers WHERE userId = ?",
      [userId],
    );

    if (travelers.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Traveler profile not found" });
    }

    const travelerId = travelers[0].travelerId;

    // ON DUPLICATE KEY UPDATE with a no-op (updatedAt = updatedAt) means:
    //   affectedRows = 1 → new row was inserted
    //   affectedRows = 0 → duplicate key, existing row unchanged (idempotent success)
    // We intentionally do NOT overwrite any fields on a duplicate because the
    // mobile may have already updated those fields after the initial create.
    const [result] = await db.query(
      `INSERT INTO journals
       (journalId, travelerId, tripId, title, isPublic, status, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', NOW(), NOW(), FALSE)
       ON DUPLICATE KEY UPDATE updatedAt = updatedAt`,
      [journalId, travelerId, tripId || null, title.trim(), isPublic ?? false],
    );

    const isNew = result.affectedRows === 1;

    console.log(
      `[createJournal] ${isNew ? "CREATED" : "DUPLICATE"} | userId=${userId} journalId=${journalId}`,
    );

    return res.status(isNew ? 201 : 200).json({
      success: true,
      created: isNew,
      data: { journalId },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE JOURNAL
   Idempotent: applying the same update twice produces the same state.
   - 200: update applied
   - 404: journal not found or already deleted
   - Only updates journals that belong to the authenticated user.
========================================================= */
const updateJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId } = req.params;
    const { title, isPublic, status } = req.body;

    console.log(
      `[updateJournal] REQUEST | userId=${userId} journalId=${journalId} ts=${new Date().toISOString()}`,
    );

    // Scope the update to the authenticated traveler to prevent cross-user writes
    const [result] = await db.query(
      `UPDATE journals j
       JOIN travelers t ON j.travelerId = t.travelerId
       SET j.title = ?, j.isPublic = ?, j.status = ?, j.updatedAt = NOW()
       WHERE j.journalId = ?
         AND t.userId = ?
         AND j.isDeleted = FALSE`,
      [title, isPublic, status, journalId, userId],
    );

    if (result.affectedRows === 0) {
      console.warn(
        `[updateJournal] NOT FOUND | userId=${userId} journalId=${journalId}`,
      );
      return res
        .status(404)
        .json({ success: false, message: "Journal not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SOFT DELETE JOURNAL
   Idempotent: deleting an already-deleted journal returns 200.
   Cascades soft-delete to all entries.
   - 200: deleted, or was already deleted (both are success for sync)
========================================================= */
const deleteJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId } = req.params;

    console.log(
      `[deleteJournal] REQUEST | userId=${userId} journalId=${journalId} ts=${new Date().toISOString()}`,
    );

    // Scoped to the authenticated traveler; works even if already deleted
    await db.query(
      `UPDATE journals j
       JOIN travelers t ON j.travelerId = t.travelerId
       SET j.isDeleted = TRUE, j.updatedAt = NOW()
       WHERE j.journalId = ?
         AND t.userId = ?`,
      [journalId, userId],
    );

    // Cascade to entries regardless — safe if entries are already deleted
    await db.query(
      `UPDATE journal_entries
       SET isDeleted = TRUE, updatedAt = NOW()
       WHERE journalId = ?`,
      [journalId],
    );

    // Always 200: "not found" = already deleted = success for mobile sync
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   ADD ENTRY
   Idempotent: safe to retry with same entryId.
   - 201: new entry created
   - 200: entry already existed (duplicate, treated as success)
   - 400: entryId is not a valid UUID v4
========================================================= */
const addJournalEntry = async (req, res, next) => {
  try {
    const { journalId } = req.params;
    const { entryId, placeName, content, visitDate, locationId, images, imageUrls } =
      req.body;

    if (!isValidUUID(entryId)) {
      return res.status(400).json({
        success: false,
        message: "entryId must be a valid UUID v4",
      });
    }

    console.log(
      `[addJournalEntry] REQUEST | journalId=${journalId} entryId=${entryId} ts=${new Date().toISOString()}`,
    );

    const [result] = await db.query(
      `INSERT INTO journal_entries
       (entryId, journalId, placeName, content, visitDate, locationId, images, imageUrls, createdAt, updatedAt, isDeleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), FALSE)
       ON DUPLICATE KEY UPDATE updatedAt = updatedAt`,
      [
        entryId,
        journalId,
        placeName,
        content || null,
        visitDate || null,
        locationId || null,
        images ? JSON.stringify(images) : null,
        imageUrls ? JSON.stringify(imageUrls) : null,
      ],
    );

    const isNew = result.affectedRows === 1;

    console.log(
      `[addJournalEntry] ${isNew ? "CREATED" : "DUPLICATE"} | journalId=${journalId} entryId=${entryId}`,
    );

    return res.status(isNew ? 201 : 200).json({ success: true, created: isNew });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE ENTRY
   Idempotent: applying the same update twice produces the same state.
   - 200: update applied
   - 404: entry not found or already deleted
========================================================= */
const updateJournalEntry = async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const { placeName, content, visitDate, imageUrls } = req.body;

    const [result] = await db.query(
      `UPDATE journal_entries
       SET placeName = ?, content = ?, visitDate = ?, imageUrls = ?, updatedAt = NOW()
       WHERE entryId = ?
         AND isDeleted = FALSE`,
      [
        placeName,
        content,
        visitDate,
        imageUrls ? JSON.stringify(imageUrls) : null,
        entryId,
      ],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   SOFT DELETE ENTRY
   Idempotent: deleting an already-deleted entry returns 200.
========================================================= */
const deleteJournalEntry = async (req, res, next) => {
  try {
    const { entryId } = req.params;

    await db.query(
      `UPDATE journal_entries
       SET isDeleted = TRUE, updatedAt = NOW()
       WHERE entryId = ?`,
      [entryId],
    );

    // Always 200: "not found" = already deleted = success for mobile sync
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET MY JOURNALS (ONLY NOT DELETED)
========================================================= */
const getMyJournals = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [travelers] = await db.query(
      "SELECT travelerId FROM travelers WHERE userId = ?",
      [userId],
    );

    if (travelers.length === 0) {
      return res.status(403).json({ success: false });
    }

    const travelerId = travelers[0].travelerId;

    const [journals] = await db.query(
      `SELECT * FROM journals
       WHERE travelerId = ? AND isDeleted = FALSE
       ORDER BY createdAt DESC`,
      [travelerId],
    );

    for (let journal of journals) {
      const [entries] = await db.query(
        `SELECT * FROM journal_entries
         WHERE journalId = ? AND isDeleted = FALSE`,
        [journal.journalId],
      );

      journal.entries = entries;
    }

    res.json({ success: true, data: journals });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   EXPORTS
========================================================= */
module.exports = {
  createJournal,
  updateJournal,
  deleteJournal,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getMyJournals,
};
