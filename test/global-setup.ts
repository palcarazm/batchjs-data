module.exports = () => {
  if (process.env.CI !== "true") {
    require("dotenv").config();
  }
};
