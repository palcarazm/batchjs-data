# SQLite

SQLite is a great fit for local development, embedded apps, and small to medium workloads. BatchJS Data provides dedicated `SqliteBatchEntityReader` and `SqliteBatchEntityWriter` classes that work well with the `sqlite` package.

## Reader example

```ts
import sqlite3 from 'sqlite3';
import sqlite, { open } from 'sqlite';
import { SqliteBatchEntityReader } from 'batchjs-data/sqlite';

interface UserRow {
  id: number;
  username: string;
}

class UserReader extends SqliteBatchEntityReader<UserRow, UserRow> {
  constructor(batchSize: number) {
    super({
      batchSize,
      dbConnectionFactory: async () => open({ filename: './database.db', driver: sqlite3.Database }),
      query: 'SELECT id, username FROM users',
      rowToEntity: (row) => row
    });
  }
}
```

## Writer example

```ts
import sqlite3 from 'sqlite3';
import sqlite, { open } from 'sqlite';
import { SqliteBatchEntityWriter } from 'batchjs-data/sqlite';

interface UserRow {
  id: number;
  username: string;
}

class UserWriter extends SqliteBatchEntityWriter<UserRow> {
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
