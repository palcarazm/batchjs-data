import { UserBatchReader } from "../mocks/UserBatchReader";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

describe("SqliteBatchEntityReader", () => {
  const data = [
    { id: 1, username: "Alice" },
    { id: 2, username: "Bob" },
    { id: 3, username: "Charlie" },
  ];
  Object.freeze(data);

  beforeAll((done) => {
    UserDatabase.teardown().then(() => done());
  });

  beforeEach((done) => {
    UserDatabase.setup()
      .then(() => UserDatabase.mockData(data))
      .then(() => done());
  });

  afterEach((done) => {
    UserDatabase.teardown().then(() => done());
  });

  test("should read users in batches", (done) => {
    const reader = new UserBatchReader({
      batchSize: 2,
    });

    const result: UserDTO[] = [];

    reader.on("data", (chunk) => {
      result.push(chunk);
    });

    reader.on("error", (error) => {
      fail(error);
    });

    reader.on("end", () => {
      expect(result).toEqual(data);
      done();
    });

    reader.read();
  });

  test("should handle empty result", (done) => {
    const reader = new UserBatchReader({
      batchSize: 2,
      query: "SELECT * FROM users WHERE 1=0",
    });

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

  test("should destroy the connection properly", (done) => {
    const reader = new UserBatchReader({
      batchSize: 2,
    });

    const spyFinalizeStatement = jest.spyOn(reader as any, "finalizeStatement");

    reader.on("data", () => {});

    reader.on("error", (error) => {
      fail(error);
    });

    reader.on("close", () => {
      expect(reader["dbConnection"]).toBeNull();
      expect(spyFinalizeStatement).toHaveBeenCalled();
      done();
    });

    reader.read();
  });

  test("should handle error on close", (done) => {
    const reader = new UserBatchReader({
      batchSize: 2,
    });

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
