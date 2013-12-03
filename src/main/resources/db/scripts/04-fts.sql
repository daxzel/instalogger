ALTER TABLE message ADD text_tsvector tsvector;

CREATE TRIGGER message_tsvector BEFORE INSERT OR UPDATE ON message
FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger('text_tsvector', 'pg_catalog.english', 'text');

UPDATE message SET text_tsvector = to_tsvector('english', text);
