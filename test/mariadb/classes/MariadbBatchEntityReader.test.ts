import { UserBatchReader } from "../mocks/UserBatchReader";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

jest.mock("mariadb", () => {
  if (process.env.CI === "true") {
    console.info("Setup mocked MariaDB database");
    return { createPool: jest.fn(() => UserDatabase.mPool) };
  }
  console.info("Setup real MariaDB database");
  return jest.requireActual("mariadb");
});

describe("MariadbBatchEntityReader", () => {
  const data = [
    { id: 1, username: "Alice" },
    { id: 2, username: "Bob" },
    { id: 3, username: "Charlie" },
  ];
  Object.freeze(data);

  beforeAll((done) => {
    UserDatabase.teardown()
      .then(() => done())
      .catch((error) => done(error));
  });

  beforeEach((done) => {
    UserDatabase.setup()
      .then(() => done())
      .catch((error) => done(error));
  });

  afterEach((done) => {
    UserDatabase.teardown()
      .then(() => done())
      .catch((error) => done(error));
  });

  test("should read users in batches", (done) => {
    UserDatabase.load(Object.assign([], data)).then(() => {
      const reader = new UserBatchReader({ batchSize: 2 });

      const result: UserDTO[] = [];
      reader.on("data", (chunk) => {
        result.push(chunk);
      });

      reader.on("error", (error) => {
        done(error);
      });

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
      reader.on("data", (chunk) => {
        result.push(chunk);
      });

      reader.on("error", (error) => {
        done(error);
      });

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

      const spyFinalizeStatement = jest.spyOn(
        reader as any,
        "finalizeStatement"
      );

      reader.on("data", () => {});

      reader.on("error", (error) => {
        done(error);
      });

      reader.on("close", () => {
        expect(reader["client"]).toBeNull();
        expect(reader["fetchEntityStatement"]).toBeNull();
        expect(spyFinalizeStatement).toHaveBeenCalled();
        done();
      });

      reader.read();
    });
  });

  test("should handle error on close", (done) => {
    UserDatabase.load([]).then(() => {
      const reader = new UserBatchReader({ batchSize: 2 });

      jest.spyOn(reader as any, "finalizeStatement").mockImplementation(() => {
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
