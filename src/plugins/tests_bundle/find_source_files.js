
import fromRoot from '../../utils/from_root';
import { chain, memoize } from 'lodash';
import { resolve } from 'path';
import { map, fromNode } from 'bluebird';
import glob from 'glob-all';

let findSourceFiles = async (patterns, cwd = fromRoot('.')) => {
  patterns = [].concat(patterns || []);

  const matches = await fromNode(cb => {
    glob(patterns, {
      cwd: cwd,
      ignore: [
        'node_modules/**/*',
        'bower_components/**/*',
        '**/_*.js'
      ],
      symlinks: findSourceFiles.symlinks,
      statCache: findSourceFiles.statCache,
      realpathCache: findSourceFiles.realpathCache,
      cache: findSourceFiles.cache
    }, cb);
  });

  return chain(matches)
  .flatten()
  .uniq()
  .map(match => resolve(cwd, match))
  .value();
};

findSourceFiles.symlinks = {};
findSourceFiles.statCache = {};
findSourceFiles.realpathCache = {};
findSourceFiles.cache = {};

module.exports = findSourceFiles;
