# MySQL

MySQL support uses `MysqlBatchEntityReader` and `MysqlBatchEntityWriter` with `mysql2/promise`, which makes them a good choice for connection-pool based applications.

## Reader example

```ts
import { createPool } from 'mysql2/promise';
import { MysqlBatchEntityReader } from 'batchjs-data/mysql';

interface UserRow {
  id: number;
  username: string;
}

const pool = createPool({ host: 'localhost', user: 'root', password: 'secret', database: 'app' });

class UserReader extends MysqlBatchEntityReader<UserRow, UserRow> {
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
import { createPool } from 'mysql2/promise';
import { MysqlBatchEntityWriter } from 'batchjs-data/mysql';

interface UserRow {
  id: number;
  username: string;
}

const pool = createPool({ host: 'localhost', user: 'root', password: 'secret', database: 'app' });

class UserWriter extends MysqlBatchEntityWriter<UserRow, any[]> {
  constructor(batchSize: number) {
    super({
      batchSize,
      pool,
      prepareStatement: 'INSERT INTO users (id, username) VALUES (?, ?)',
      entityToRow: (entity) => [entity.id, entity.username]
    });
  }
}
```
