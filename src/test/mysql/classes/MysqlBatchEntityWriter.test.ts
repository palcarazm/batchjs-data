/// <reference types="jest" />
/// <reference types="node" />

import { UserBatchWriter } from "../mocks/UserBatchWriter";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

describe("MysqlBatchEntityWriter", () => {
    const data = [
        { id: 1, username: "Alice" },
        { id: 2, username: "Bob" },
        { id: 3, username: "Charlie" },
    ];
    Object.freeze(data);

    beforeAll(async () => {
        await UserDatabase.startContainer();
    }, 60000);

    beforeEach(async () => {
        await UserDatabase.setup();
    }, 10000);

    afterEach(async () => {
        await UserDatabase.teardown();
    }, 10000);

    afterAll(async () => {
        await UserDatabase.stopContainer();
    }, 60000);

    test("should save entities in database", (done) => {
        const writer = new UserBatchWriter({ batchSize: data.length });

        writer.on("error", done);
        writer.once("finish", () => {
            UserDatabase.fetch().then((results) => {
                expect(results).toHaveLength(data.length);
                expect(results).toEqual(data);
                done();
            });
        });

        data.forEach((user) => writer.write(user));
        writer.end();
    });

    test("should rollback on error", (done) => {
        const writer = new UserBatchWriter({ batchSize: 3 });

        writer.on("error", (err) => {
            expect(err).toBeInstanceOf(Error);
            done();
        });

        writer.write(new UserDTO(1, "Alice"));
        writer.write(new UserDTO(1, "DUPLICATED ID"));
        writer.end();
    });
});