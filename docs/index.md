---
layout: home

hero:
  name: BatchJS Data
  text: Database batch readers and writers for BatchJS
  tagline: Read and write large datasets from SQLite, PostgreSQL, MariaDB, and MySQL with a consistent streaming API.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api

features:
  - title: Driver-specific readers
    details: Use dedicated reader streams for SQLite, PostgreSQL, MariaDB, and MySQL without changing your BatchJS job structure.
  - title: Transaction-safe writers
    details: Batch inserts and updates are grouped into transactions so your processing stays reliable and efficient.
  - title: Fully typed TypeScript
    details: Build database pipelines with strong typings and editor autocomplete for every reader and writer option.
  - title: Streaming by design
    details: Process large datasets incrementally, keeping memory usage predictable even for very large tables.
---

## What is BatchJS Data?

BatchJS Data extends BatchJS with database-oriented batch readers and writers. It gives you a small, consistent abstraction for streaming rows from a database and writing them back in chunks while keeping your job logic focused on transformation.

## Quick example

```ts
import { SqliteBatchEntityReader } from 'batchjs-data/sqlite';
import { SqliteBatchEntityWriter } from 'batchjs-data/sqlite';

class UserReader extends SqliteBatchEntityReader<UserDTO, UserDTO> {
  constructor(batchSize: number) {
    super({
      batchSize,
      dbConnectionFactory: async () => open({ filename: './database.db', driver: sqlite3.Database }),
      query: 'SELECT id, username FROM users',
      rowToEntity: (row) => row
    });
  }
}

class UserWriter extends SqliteBatchEntityWriter<UserDTO> {
  constructor(batchSize: number) {
    super({
      batchSize,
      dbConnectionFactory: async () => open({ filename: './database.db', driver: sqlite3.Database }),
      prepareStatement: 'INSERT INTO users (id, username) VALUES (@id, @username)',
      saveEntity: async (entity, stmt) => stmt.all({ '@id': entity.id, '@username': entity.username })
    });
  }
}
```

Choose a database guide to see the matching implementation patterns:

- [SQLite](/guide/sqlite)
- [PostgreSQL](/guide/postgresql)
- [MariaDB](/guide/mariadb)
- [MySQL](/guide/mysql)
