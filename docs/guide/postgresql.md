# PostgreSQL

PostgreSQL support uses `PostgresBatchEntityReader` and `PostgresBatchEntityWriter` with a `pg` pool. These helpers are useful when you want streaming reads and transaction-safe writes over a connection pool.

## Reader example

```ts
import { Pool } from 'pg';
import { PostgresBatchEntityReader } from 'batchjs-data/postgresql';

interface UserRow {
  id: number;
  username: string;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class UserReader extends PostgresBatchEntityReader<UserRow, UserRow> {
  constructor(batchSize: number) {
    super({
      batchSize,
      pool,
      query: 'SELECT id, username FROM users',
      rowToEntity: (row) => row
    });
  }
}
```

## Writer example

```ts
import { Pool } from 'pg';
import { PostgresBatchEntityWriter } from 'batchjs-data/postgresql';

interface UserRow {
  id: number;
  username: string;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class UserWriter extends PostgresBatchEntityWriter<UserRow> {
  constructor(batchSize: number) {
    super({
      batchSize,
      pool,
      saveEntity: async (entity, client) => {
        await client.query('INSERT INTO users (id, username) VALUES ($1, $2)', [entity.id, entity.username]);
      }
    });
  }
}
```
