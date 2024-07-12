![DotMH](https://github.com/dotmh/dotmh/raw/master/logo.png)

# DotMH Smart Builder

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-%23FE5196?style=for-the-badge&logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)](https://prettier.io/)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge&)](https://opensource.org/licenses/Apache-2.0)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=for-the-badge&)](code_of_conduct.md)

> [!WARNING]
> This project is pre-release and so may contain bugs or not work as expected. It is also likely to change

## Introduction

A tool to build Monorepos based on the dependency graph. This allows you to build the packages in the right order.

It will read the pnpm-workspace.yaml file to get the list of packages and determine the order to build them in
It will then run the build command set up in the BUILD_SCRIPT variable
It is designed to **ONLY** Work with pnpm workspaces not npm or yarn at the moment

## Running

> [!WARNING]
> This project is pre-release and so may contain bugs or not work as expected. It is also likely to change

```bash
$ pnpm add @dotmh/smart-builder
$ pnpm exec smart-builder
```

It needs to run from the root project folder (that is the folder that contains `pnpm-workspaces.yaml` or `pnpm-lock.yaml`)

### Configuration

This uses environment variables to configure its behaviour.

- `SKIP_BUILD` - set to `yes` to enable - will allow you to see what it is going to build and in what order
- `DEBUG` - set to `yes` to enable - will allow you to see more logging

## Ignoring

To ignore a package from the build list add it to the .sbignore file at the root of the project
Add the package names to ignore on a new line for each.

## License

This repo is set up with an [Apache 2.0](https://opensource.org/license/apache-2-0) license and this will carry over to any projects that are
generated from the template unless you remove it.
