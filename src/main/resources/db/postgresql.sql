CREATE TABLE MESSAGE (
    id SERIAL PRIMARY KEY,
    text TEXT DEFAULT '',
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_level int not null
  );