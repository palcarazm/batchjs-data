# SQLite

SQLite is a great fit for local development, embedded apps, and small to medium workloads. BatchJS Data provides dedicated `SqliteBatchEntityReader` and `SqliteBatchEntityWriter` classes that work with Node.js built-in `node:sqlite` module.

## Reader example

```ts
import { DatabaseSync } from "node:sqlite";
import { SqliteBatchEntityReader } from "batchjs-data/sqlite";

interface UserRow {
  id: number;
  username: string;
}

class UserReader extends SqliteBatchEntityReader<UserRow, UserRow> {
  constructor(batchSize: number) {
    super({
      batchSize,
      dbConnectionFactory: async () =>
        Promise.resolve(new DatabaseSync("./database.db")),
      query: "SELECT id, username FROM users",
      rowToEntity: (row) => row,
    });
  }
}
```

## Writer example

```ts
import { DatabaseSync, StatementSync } from "node:sqlite";
import { SqliteBatchEntityWriter } from "batchjs-data/sqlite";

interface UserRow {
  id: number;
  username: string;
}

class UserWriter extends SqliteBatchEntityWriter<UserRow> {
  constructor(batchSize: number) {
    super({
      batchSize,
      dbConnectionFactory: async () =>
        Promise.resolve(new DatabaseSync("./database.db")),
      prepareStatement: "INSERT INTO users (id, username) VALUES (?, ?)",
      saveEntity: async (entity, stmt: StatementSync) => {
        stmt.run(entity.id, entity.username);
      },
    });
  }
}
```
