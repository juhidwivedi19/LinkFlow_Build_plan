-- This is an empty migration.
CREATE INDEX "Link_title_fts_idx"
ON "Link"
USING GIN (to_tsvector('english', "title"));