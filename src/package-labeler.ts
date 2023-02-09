import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import multimatch from "multimatch";

async function run() {
  try {
    const token = core.getInput("repo-token", { required: true });
    if (!token) {
      core.error(
        "failed to provide a GitHub token for accessing the GitHub REST API."
      );
    }
    const workspace = core.getInput("workspace", { required: true });
    core.debug(`workspace: ${workspace}`);
    const prefix = core.getInput("prefix", { required: false });
    core.debug(`prefix: ${prefix}`);
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
      core.error("could not find pull request number");
      core.setFailed("could not find pull request number");
      return;
    }
    const prNumber = pullRequest.number;
    const client = new Octokit({
      auth: token,
    });
    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles: string[] = await getChangedFiles(client, prNumber);
    console.log(changedFiles);
    const subDirs = (workspace.match(/\//g) || []).length;
    const labels: string[] = multimatch(changedFiles, [
      `${workspace}/**/*`,
    ]).map((dir) => `${prefix}${dir.split("/")[1 + subDirs]}`);

    if (labels.length > 0) {
      await addLabels(client, prNumber, labels);
    } else {
      core.debug("no labels to add");
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      core.error(err);
      core.setFailed(err.message);
    }
  }
}

async function getChangedFiles(
  client: Octokit,
  prNumber: number
): Promise<string[]> {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const changedFiles = listFilesResponse.data.map((f) => f.filename);

  core.debug("found changed files:");
  for (const file of changedFiles) {
    core.debug("  " + file);
  }

  return changedFiles;
}

async function addLabels(client: Octokit, prNumber: number, labels: string[]) {
  core.debug(`labels to add: ${labels}`);

  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
    labels: labels,
  });
}

run();
