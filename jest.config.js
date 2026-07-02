/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.env.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        esModuleInterop: true,
        moduleResolution: "node",
      },
    }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^next/link$": "<rootDir>/__tests__/mocks/NextLink.tsx",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: [
    "**/__tests__/**/*.test.(ts|tsx)",
    "**/*.test.(ts|tsx)",
  ],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "components/**/*.{ts,tsx}",
    "hooks/**/*.ts",
    "services/**/*.ts",
    "store/**/*.ts",
    "!**/*.d.ts",
  ],
};

module.exports = config;
