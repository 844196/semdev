module.exports = {
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
  hooks: {
    release: {
      pre: [
        'yarn ci:type',
        'yarn ci:lint',
        'yarn ci:test --no-coverage',
        'yarn build',
      ],
    },
  },
};
