module.exports = {
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "test-results/jest" }]
  ],
  testEnvironment: "node"
};
