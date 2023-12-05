const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  roots: ['src', 'test'],
  coveragePathIgnorePatterns: ['test', 'src/data/schema.ts', 'src/config/controller.ts', 'src/utils'],
  setupFilesAfterEnv: ['./test/setup.ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/'
  })
};