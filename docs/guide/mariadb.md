# MariaDB

MariaDB support is provided through `MariadbBatchEntityReader` and `MariadbBatchEntityWriter`, which are designed for pool-based access with prepared statements.

## Reader example

```ts
import { createPool } from 'mariadb';
import { MariadbBatchEntityReader } from 'batchjs-data/mariadb';

interface UserRow {
  id: number;
  username: string;
}

const pool = createPool({ host: 'localhost', user: 'root', password: 'secret', database: 'app' });

class UserReader extends MariadbBatchEntityReader<UserRow, UserRow> {
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
import { createPool } from 'mariadb';
import { MariadbBatchEntityWriter } from 'batchjs-data/mariadb';

interface UserRow {
  id: number;
  username: string;
}

const pool = createPool({ host: 'localhost', user: 'root', password: 'secret', database: 'app' });

class UserWriter extends MariadbBatchEntityWriter<UserRow, any[]> {
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
