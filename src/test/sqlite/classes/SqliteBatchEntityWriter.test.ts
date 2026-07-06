/// <reference types="jest" />
import { UserBatchWriter } from "../mocks/UserBatchWriter";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

describe("SqliteBatchEntityWriter", () => {
    beforeAll((done) => {
        UserDatabase.teardown().then(() => done());
    });
    
    beforeEach((done) => {
        UserDatabase.setup().then(() => done());
    });

    afterEach((done) => {
        UserDatabase.teardown().then(() => done());
    });

    test("should save entities in database", (done) => {
        const writer = new UserBatchWriter({
            batchSize: 3,
        });

        writer.once("finish", () => {
            UserDatabase.db
                .then((db) => db.prepare("SELECT * FROM users").all() as unknown as UserDTO[])
                .then((rows) => {
                    expect(rows).toEqual([
                        { id: 1, username: "Alice" },
                        { id: 2, username: "Bob" },
                        { id: 3, username: "Charlie" },
                    ]);
                }).finally(()=>done());
        });

        writer.write(new UserDTO(1, "Alice"));
        writer.write(new UserDTO(2, "Bob"));
        writer.write(new UserDTO(3, "Charlie"));
        writer.end();
    });

    test("should rollback on error (Duplicated ID)", (done) => {
        const writer = new UserBatchWriter({
            batchSize: 3,
        });

        writer.on("error", (err) => {
            expect(err.message).toBe("UNIQUE constraint failed: users.id")
            UserDatabase.db
                .then((db) => db.prepare("SELECT * FROM users").all() as unknown as UserDTO[])
                .then((rows) => {
                    expect(rows).toEqual([]);
                }).finally(()=>done());
        });

        writer.write(new UserDTO(1, "Alice"));
        writer.write(new UserDTO(1, "DUPLICATED ID"));
        writer.end();
    });
});