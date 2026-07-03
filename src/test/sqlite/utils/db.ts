import path from "path";

export class DB{
    static readonly folder = path.resolve(__dirname, "../tmp");
    static readonly dbPath = path.join(DB.folder, "test.db");
}