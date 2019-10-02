# package-labeler

> Github action to dynamically label pull requests affecting packages in a monorepo / workspace

_This is currently work in progress and should not be used in production yet_

## Usage

```yml
name: Workspace Package Labeler
on: [pull_request]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: csi-lk/package-labeler
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          workspace: "packages" # (default)
          name: "folder" # (default) / 'package.json'
          prefix: "pkg: "
```

If any pull request code changes match `./packages/**/*` they will be labeled per decendent folder with prefix of `pkg:`

For example if I have a folder structure of

```
packages/
    core/
        core.js
    tools/
        tools.js
```

And I make a code change to `core.js` the PR will be labelled with `pkg: core`

---

Work inspired by the [actions/labeler](https://github.com/actions/labeler) project from Github
