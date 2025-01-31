import { UserBatchReader } from "../mocks/UserBatchReader";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

jest.mock("mysql2/promise", () => {
  if (process.env.CI === "true") {
    console.info("Setup mocked MySQL database");
    return { createPool: jest.fn(() => UserDatabase.mPool) };
  }
  console.info("Setup real MySQL database");
  return jest.requireActual("mysql2/promise");
});

describe("MysqlBatchEntityReader", () => {
  const data = [
    { id: 1, username: "Alice" },
    { id: 2, username: "Bob" },
    { id: 3, username: "Charlie" },
  ];
  Object.freeze(data);

  beforeAll((done) => {
    UserDatabase.teardown().then(() => done()).catch(done);
  });

  beforeEach((done) => {
    UserDatabase.setup().then(() => done()).catch(done);
  });

  afterEach((done) => {
    UserDatabase.teardown().then(() => done()).catch(done);
  });

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