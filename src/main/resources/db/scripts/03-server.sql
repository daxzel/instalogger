CREATE TABLE server (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT ''
);


ALTER TABLE message ADD server_id integer;

ALTER TABLE message ADD CONSTRAINT message_server FOREIGN KEY (server_id) REFERENCES server(id) MATCH SIMPLE ON DELETE CASCADE;