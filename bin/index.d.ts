/**
 * Smart Builder
 * =============
 *
 * This file is used to build the packages in the correct order
 * It will read the pnpm-workspace.yaml file to get the list of packages
 * and determine the order to build them in
 * It will then run the build command set up in the BUILD_SCRIPT variable
 * It is designed to __ONLY__ Work with pnpm workspaces not npm or yarn at the moment
 *
 * To run it use [TSX](https://www.npmjs.com/package/tsx)
 * IT needs to run from the root project folder
 *
 *  `tsx scripts/smart-builder.ts`
 *
 * To ignore a package from the build list add it to the .sbignore file at the root of the project
 */
export {};
