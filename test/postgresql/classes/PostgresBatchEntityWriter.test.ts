import { UserBatchWriter } from "../mocks/UserBatchWriter";
import { UserDTO } from "../mocks/UserDTO";
import { UserDatabase } from "../mocks/UserDatabase";

jest.mock("pg", () => {
  if (process.env.CI === "true") {
    console.info("Setup mocked PostgreSQL database");
    return { Pool: jest.fn(() => UserDatabase.mPool) };
  }
  console.info("Setup real PostgreSQL database");
  return jest.requireActual("pg");
});

describe("PostgresBatchEntityWriter", () => {
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

  test("should save entities in database", (done) => {
    const writer = new UserBatchWriter({
      batchSize: data.length,
    });

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
    const writer = new UserBatchWriter({
      batchSize: 3,
    });

    writer.on("error", (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });

    writer.write(new UserDTO(1, "Alice"));
    writer.write(new UserDTO(1, "DUPLICATED ID"));
    writer.end();
  });
});
