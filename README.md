[![GitHub license](https://img.shields.io/github/license/palcarazm/batchjs-data.svg?color=informational)](https://github.com/palcarazm/batchjs-data/blob/version/v1/LICENSE)
[![Latest release](https://img.shields.io/github/package-json/v/palcarazm/batchjs-data/version/v1?logo=github)](https://github.com/palcarazm/batchjs-data/releases)
[![NPM Badge](https://img.shields.io/npm/dm/batchjs-data?logo=npm)](https://www.npmjs.com/package/batchjs-data)
[![Build](https://img.shields.io/github/actions/workflow/status/palcarazm/batchjs-data/ci-workflow.yml?branch=version/v1&label=build&logo=Node.js&logoColor=white)](https://github.com/palcarazm/batchjs-data/actions/workflows/ci-workflow.yml)
[![Test](https://img.shields.io/github/actions/workflow/status/palcarazm/batchjs-data/ci-workflow.yml?branch=version/v1&label=test&logo=jest)](https://github.com/palcarazm/batchjs-data/actions/workflows/ci-workflow.yml)
[![Funding](https://img.shields.io/badge/sponsor-30363D?style=flat&logo=GitHub-Sponsors&logoColor=#white)](https://github.com/sponsors/palcarazm)

# BatchJS-Data

Extension of [Batch JS](https://github.com/palcarazm/batchjs) adding data storage support for databases.

---

- [BatchJS-Data](#batchjs-data)
- [Download](#download)
  - [NPM](#npm)
  - [Yarn](#yarn)
- [Usage](#usage)
- [Documentation](#documentation)
- [Collaborators welcome!](#collaborators-welcome)

---

# Download

[![Latest release](https://img.shields.io/github/package-json/v/palcarazm/batchjs-data/version/v1?logo=github)](https://github.com/palcarazm/batchjs-data/releases)

## NPM

[![NPM Badge](https://img.shields.io/npm/dm/batchjs-data?logo=npm)](https://www.npmjs.com/package/batchjs-data)

```sh
npm install batchjs-data --no-optional
npm install sqlite sqlite3  #For SQLite implementation
npm install mariadb         #For MariaDB implementation
npm install mysql2          #For MySQL implementation
npm install pg @types/pg    #For PostgreSQL implementation
```

## Yarn

```sh
yarn add batchjs-data --no-optional
yarn add mariadb         #For MariaDB implementation
yarn add mysql2          #For MySQL implementation
yarn add pg @types/pg    #For PostgreSQL implementation
yarn add sqlite sqlite3  #For SQLite implementation
```


# Usage

1. Create your reader
    ```typescript
    import sqlite3 from "sqlite3";
    import  {open} from "sqlite";
    import { SqliteBatchEntityReader } from "batchjs-data/sqlite";
    import { UserDTO } from "./UserDTO";

    export class UserBatchReader extends SqliteBatchEntityReader<UserDTO> {
        constructor(options:{batchSize:number,query?:string}) {
            super({
                batchSize: options.batchSize,
                dbConnectionFactory: () => { return open({filename: './database.db', driver: sqlite3.Database});},
                query: options.query || "SELECT id, username FROM users"
            });
        }
    
        protected rowToEntity(row: unknown): UserDTO {
            return row as UserDTO;
        }
    }
    ```
2. Create your writer
    ```typescript
    import sqlite3 from "sqlite3";
    import sqlite, {open} from "sqlite";
    import { SqliteBatchEntityWriter } from "batchjs-data/sqlite";
    import { UserDTO } from "./UserDTO";

    export class UserBatchWriter extends SqliteBatchEntityWriter<UserDTO> {
        constructor(options:{batchSize:number}){
            super({
                batchSize: options.batchSize,
                dbConnectionFactory: () => { return open({filename: './database.db', driver: sqlite3.Database});},
                prepareStatement: "INSERT INTO users (id, username) VALUES (@id, @username)"
            });
        }
        protected saveEntity(entity: UserDTO, stmt: sqlite.Statement): Promise<void> {
            return stmt.all<void>({'@id': entity.id, '@username': entity.username});
        }
    }
    ```
3. Use them in your BatchJS Job
    ```typescript
    import { Job, Step } from "batchjs";

    // Implement a step
    class StepImplementation extends Step {
        // Set a name to the step
        constructor(name: string = "DemoStep") {
            super(name);
        }

        // Implement the reader to load step data source
        protected _reader() {
            return new UserBatchReader({batchSize:2});
        }

        // Implement the processors to transform data sequently using our streams or your own streams
        protected _processors() {
            const opts: TransformOptions = {
                objectMode: true,
                transform(
                    chunk: unknown,
                    encoding: BufferEncoding,
                    callback: TransformCallback
                ) {
                    this.push(chunk);
                    callback();
                },
            };
            return [new Transform(opts), new Transform(opts)];
        }

        // Implement the write to stock final step data
        protected _writer() {
            return new UserBatchWriter({batchSize:2})
        }
    }

    // Implement a Job
    class JobImplementation extends Job {
        // Implement to set the steps to be sequently executed.
        protected _steps() {
            return [new StepImplementation(), new StepImplementation()];
        }
    }

    // Instance the Job
    const job = new JobImplementation("My job");

    // Set events listener
    job.on("stepStart", (step: step) => {
        console.log(`Starting step ${step.name}`);
    });

    // Launch the job
    job.run()
        .then(() => {
            console.log("Job completed successfully");
        })
        .catch((error) => {
            console.log("Job completed with errors");
        });
    ```

# Documentation

- [Core API](./docs/common-api.md)
- [MariaDB API](./docs/mariadb-api.md)
- [MySQL API](./docs/mysql-api.md)
- [PostgreSQL API](./docs/postgresql-api.md)
- [SQLite API](./docs/sqlite-api.md)

# Collaborators welcome!

- ¿Do you like the project? Give us a :star: in [GitHub](https://github.com/palcarazm/batchjs-data).
- :sos: ¿Do you need some help? Open a discussion in [GitHub help wanted](https://github.com/palcarazm/batchjs/discussions/new?category=q-a)
- :bug: ¿Do you find a bug? Open a issue in [GitHub bug report](https://github.com/palcarazm/batchjs-data/issues/new?assignees=&labels=bug&projects=&template=01-BUG_REPORT.yml)
- :bulb: ¿Do you have a great idea? Open a issue in [GitHub feature request](https://github.com/palcarazm/batchjs-data/issues/new?assignees=&labels=feature&projects=&template=02-FEATURE_REQUEST.yml)
- :computer: ¿Do you know how to fix a bug? Open a pull request in [GitHub pull request](https://github.com/palcarazm/batchjs-data/compare).
- ¿Do you know a security issue? Take a read to our [security strategy](https://github.com/palcarazm/batchjs-data/blob/version/v1/SECURITY.md).

[![GitHub Contributors](https://contrib.rocks/image?repo=palcarazm/batchjs-data)](https://github.com/palcarazm/batchjs-data/graphs/contributors)

[Subscribe our code of conduct](https://github.com/palcarazm/batchjs-data/blob/version/v1/CODE_OF_CONDUCT.md) and follow the [Contribution Guidelines](https://github.com/palcarazm/batchjs-data/blob/version/v1/CONTRIBUTING.md).