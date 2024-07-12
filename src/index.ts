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

/* eslint-disable promise/always-return */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable no-console */
import {readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import yaml from 'yaml';
import {glob} from 'glob';
import {exec} from 'node:child_process';
import {EOL} from 'node:os';
import {cwd} from 'node:process';
import chalk from 'chalk';

interface Dependency {
  [name: string]: string;
}

interface PackageDeps {
  [name: string]: Dependency;
}

type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'unknown';

const WORKSPACE = 'pnpm-workspace.yaml';
const PACKAGE_MANIFEST = 'package.json';
const BUILD_SCRIPT = 'pnpm --filter PACKAGE run build';
const SKIP_BUILD = process.env['SKIP_BUILD'] === 'yes';
const DEBUG = process.env['DEBUG'] === 'yes';
const SMART_BUKLDER_IGNORE = '.sbignore';

const lockFiles: Record<PackageManager, string> = {
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
  unknown: '',
};

const exists = async (file: string) => {
  try {
    const stats = await stat(file);
    return stats.isFile();
  } catch {
    return false;
  }
};

const whichPackageManager = async (): Promise<PackageManager> => {
  const check = Object.entries(lockFiles);
  const found: PackageManager[] = [];

  for (const checking of check) {
    const [manager, file] = checking;
    const lockFileExists = await exists(join(cwd(), file));
    if (lockFileExists) {
      found.push(manager as PackageManager);
    }
  }

  if (found.length === 0) {
    throw new Error('No package manager found');
  }

  if (found.length > 1) {
    throw new Error(`Multiple package managers found ${found.join(',')}`);
  }

  return found[0] ?? 'unknown';
};

const getSmartBuilderIgnoreFile = async (): Promise<string[]> => {
  try {
    const raw = await readFile(join(cwd(), SMART_BUKLDER_IGNORE), 'utf-8');
    return raw.split(EOL).map((str) => str.trim());
  } catch {
    return [];
  }
};

const loadWorkspace = async () => {
  try {
    console.log(process.cwd());
    const raw = await readFile(join(cwd(), WORKSPACE), 'utf-8');
    return yaml.parse(raw);
  } catch {
    throw new Error('No workspace file found');
  }
};

const getPackages = async (): Promise<string[]> => {
  const workspace = await loadWorkspace();
  return workspace.packages;
};

const getPackageDeps = async (path: string): Promise<PackageDeps> => {
  const raw = await readFile(path, 'utf-8');
  const pkg = JSON.parse(raw);
  return {[pkg.name]: pkg.dependencies};
};

const convetToLocalOnly = (dependencies: PackageDeps): PackageDeps => {
  const dependenciesEntries = Object.entries(dependencies);
  const localOnly = dependenciesEntries.map(([name, deps]) => {
    if (!deps) {
      return [name, {}];
    }
    const localDeps = Object.entries(deps).filter(([, deps]) =>
      deps.startsWith('workspace:')
    );
    return [name, Object.fromEntries(localDeps)];
  });
  return Object.fromEntries(localOnly);
};

const getBuildOrder = (allPackages: PackageDeps[]): string[] => {
  const orderToBuild: string[] = [];

  allPackages.forEach((huh) => {
    const [data] = Object.entries(huh);

    if (!data) {
      return;
    }

    const [name, dependencies] = data;
    const packageDependencies = Object.keys(dependencies);

    //if we don't have any dependencies, add to the build order first
    if (packageDependencies.length === 0) {
      console.log(`Skipping ${name} as it has no dependencies`);
      orderToBuild.unshift(name);
    } else {
      packageDependencies.forEach((dep) => {
        if (!orderToBuild.includes(dep)) {
          orderToBuild.unshift(dep);
        } else {
          const index = orderToBuild.indexOf(dep);
          orderToBuild.splice(index, 0, dep);
        }
      });

      orderToBuild.push(name);
    }
  });

  return [...new Set(orderToBuild)];
};

const filterDependancies = (buildOrder: string[], ignoring: string[] = []) =>
  buildOrder.filter((name) => !ignoring.includes(name));

const getAllPackagesUnderAPackage = async (path: string): Promise<string[]> => {
  const pathMinusGlob = path.split('/').reverse().slice(1).reverse().join('/');
  const pattern = join(process.cwd(), pathMinusGlob, '**', PACKAGE_MANIFEST);
  const list: string[] = await glob(pattern);
  return list.filter((packagePath) => !packagePath.includes('node_modules'));
};

const build = (usePackage: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const command = BUILD_SCRIPT.replace('PACKAGE', usePackage);
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
};

const buildBuildList = async (buildList: string[]) => {
  for (const buildItem of buildList) {
    console.log(`Building ${buildItem}`);
    await build(buildItem);
  }
};

const pad = (string: string): string => ` ${string} `;

const main = async () => {
  const packageManager = await whichPackageManager();

  if (packageManager !== 'pnpm') {
    throw new Error(`ONLY PNPM is support ${packageManager} found`);
  }

  console.log(
    'SEARCHING for packages using',
    chalk.bgGreenBright.bold(pad(packageManager.toUpperCase()))
  );

  const packages = await getPackages();
  const ignore = await getSmartBuilderIgnoreFile();
  const list = await Promise.all(packages.map(getAllPackagesUnderAPackage));
  const allPackages = await Promise.all(list.flat().map(getPackageDeps));
  const localOnly = allPackages.map((dependencies) =>
    convetToLocalOnly(dependencies)
  );
  const buildOrder = filterDependancies(getBuildOrder(localOnly), ignore);

  console.log('About to build the following package');
  console.log(buildOrder.join(EOL));

  if (!SKIP_BUILD) {
    await buildBuildList(buildOrder);
  } else {
    console.log('Skip build is set! Skipping');
  }
  console.log('DONE!');
};

main().catch((error) => {
  console.log(
    chalk.redBright.bold('Build failed:'),
    chalk.bgRedBright(pad(error.message ?? 'Unknown error'))
  );
  if (DEBUG) {
    console.error(error);
  }
  process.exit(1);
});
