module.exports = {
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
  hooks: {
    release: {
      pre: ['yarn ci'],
    },
  },
};
