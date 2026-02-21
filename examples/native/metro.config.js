const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the library source so Metro picks up live changes
config.watchFolders = [libraryRoot];

// All modules resolve from the example's node_modules so there is
// only ever one copy of react / react-native in the bundle.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Point Metro at the TypeScript source rather than the pre-compiled CJS
// bundle. Metro + babel-preset-expo compiles it with the same transforms
// as the rest of the app, guaranteeing a single React instance.
//
// We also force react / react-native to always resolve from the example's
// node_modules. The library root has React 19 installed (pulled in by
// tsup's dependencies), and Metro's standard directory traversal finds
// it first when processing files under libraryRoot/src/. This would
// produce two different React instances and break $$typeof checks.
const EXAMPLE_MODULES = new Set([
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'devtools-log-popover') {
    return {
      filePath: path.resolve(libraryRoot, 'src/index.native.ts'),
      type: 'sourceFile',
    };
  }
  if (EXAMPLE_MODULES.has(moduleName)) {
    // Re-run resolution anchored to the example root so Metro always
    // finds examples/native/node_modules/react (18.x) rather than
    // libraryRoot/node_modules/react (19.x).
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'package.json') },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
