import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
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
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: [
    "**/__tests__/**/*.test.(ts|tsx)",
    "**/*.test.(ts|tsx)",
  ],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "components/**/*.tsx",
    "hooks/**/*.ts",
    "services/**/*.ts",
    "!**/*.d.ts",
  ],
};

export default config;
