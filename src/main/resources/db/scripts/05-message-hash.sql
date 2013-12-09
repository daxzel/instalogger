ALTER TABLE message ADD hash integer;

CREATE TABLE repeated_message (
  id SERIAL PRIMARY KEY,
  server_id INTEGER,
  hash INTEGER,
  text TEXT DEFAULT '',
  log_level int not null,
  name varchar(100) NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL
);

ALTER TABLE repeated_message ADD CONSTRAINT repeated_message_server FOREIGN KEY (server_id) REFERENCES server(id) MATCH SIMPLE ON DELETE CASCADE;

