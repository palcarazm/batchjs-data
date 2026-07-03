/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserBatchReader } from "../mocks/UserBatchReader";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

describe("MysqlBatchEntityReader", () => {
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

    test("should read users in batches", (done) => {
        UserDatabase.load([...data]).then(() => {
            const reader = new UserBatchReader({ batchSize: 2 });
            const result: UserDTO[] = [];

            reader.on("data", (chunk) => result.push(chunk));
            reader.on("error", done);
            reader.on("end", () => {
                expect(result).toEqual(data);
                done();
            });

            reader.read();
        });
    });

    test("should handle empty result", (done) => {
        UserDatabase.load([]).then(() => {
            const reader = new UserBatchReader({ batchSize: 2 });
            const result: UserDTO[] = [];

            reader.on("data", (chunk) => result.push(chunk));
            reader.on("error", done);
            reader.on("end", () => {
                expect(result).toEqual([]);
                done();
            });

            reader.read();
        });
    });

    test("should destroy the connection properly", (done) => {
        UserDatabase.load([]).then(() => {
            const reader = new UserBatchReader({ batchSize: 2 });
  
            const spyDisconnectDatabase = jest.spyOn(
          reader as any,
          "disconnectDatabase"
            );
  
            reader.on("data", () => {});
  
            reader.on("error", (error) => {
                done(error);
            });
  
            reader.on("close", () => {
                expect(reader["client"]).toBeNull();
                expect(spyDisconnectDatabase).toHaveBeenCalled();
                done();
            });
  
            reader.read();
        });
    });

    test("should handle error on close", (done) => {
        UserDatabase.load([]).then(() => {
            const reader = new UserBatchReader({ batchSize: 2 });
  
            jest.spyOn(reader as any, "disconnectDatabase").mockImplementation(() => {
                return Promise.reject(new Error("Error on close"));
            });
  
            reader.on("data", () => {});
  
            reader.on("error", (error) => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe("Error on close");
                done();
            });
  
            reader.read();
        });
    });
});