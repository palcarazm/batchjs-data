import dotenv from "dotenv";

export default function globalSetup() {
    if (process.env.CI !== "true") {
        dotenv.config();
    }
}
