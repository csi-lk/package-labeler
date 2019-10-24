import { getInput, debug, error, setFailed } from "@actions/core"
import * as github from "@actions/github"
import multimatch from "multimatch"

async function run() {
  try {
    const token = getInput("repo-token", { required: true })
    const workspace = getInput("workspace", { required: true })
    debug(`workspace: ${workspace}`)
    const prefix = getInput("prefix", { required: false })
    debug(`prefix: ${prefix}`)
    const pullRequest = github.context.payload.pull_request
    if (!pullRequest) {
      error("could not find pull request number")
      setFailed("could not find pull request number")
      return
    }
    const prNumber = pullRequest.number
    const client = new github.GitHub(token)
    debug(`fetching changed files for pr #${prNumber}`)
    const changedFiles: string[] = await getChangedFiles(client, prNumber)
    console.log(changedFiles)
    const subDirs = (workspace.match(/\//g) || []).length
    const labels: string[] = multimatch(changedFiles, [
      `${workspace}/**/*`
    ]).map(dir => `${prefix}${dir.split("/")[1 + subDirs]}`)

    if (labels.length > 0) {
      await addLabels(client, prNumber, labels)
    } else {
      debug("no labels to add")
    }
  } catch (err) {
    error(err)
    setFailed(err.message)
  }
}

async function getChangedFiles(
  client: github.GitHub,
  prNumber: number
): Promise<string[]> {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  })

  const changedFiles = listFilesResponse.data.map(f => f.filename)

  debug("found changed files:")
  for (const file of changedFiles) {
    debug("  " + file)
  }

  return changedFiles
}

async function addLabels(
  client: github.GitHub,
  prNumber: number,
  labels: string[]
) {
  debug(`labels to add: ${labels}`)

  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels
  })
}

run()
