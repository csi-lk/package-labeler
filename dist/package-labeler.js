"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github = __importStar(require("@actions/github"));
const multimatch_1 = __importDefault(require("multimatch"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = core_1.getInput("repo-token", { required: true });
            const workspace = core_1.getInput("workspace", { required: true });
            core_1.debug(`workspace: ${workspace}`);
            const prefix = core_1.getInput("prefix", { required: false });
            core_1.debug(`prefix: ${prefix}`);
            const pullRequest = github.context.payload.pull_request;
            if (!pullRequest) {
                core_1.error("could not find pull request number");
                core_1.setFailed("could not find pull request number");
                return;
            }
            const prNumber = pullRequest.number;
            const client = new github.GitHub(token);
            core_1.debug(`fetching changed files for pr #${prNumber}`);
            const changedFiles = yield getChangedFiles(client, prNumber);
            console.log(changedFiles);
            const subDirs = (workspace.match(/\//g) || []).length;
            const labels = multimatch_1.default(changedFiles, [
                `${workspace}/**/*`
            ]).map(dir => `${prefix}${dir.split("/")[1 + subDirs]}`);
            if (labels.length > 0) {
                yield addLabels(client, prNumber, labels);
            }
            else {
                core_1.debug("no labels to add");
            }
        }
        catch (err) {
            core_1.error(err);
            core_1.setFailed(err.message);
        }
    });
}
function getChangedFiles(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const listFilesResponse = yield client.pulls.listFiles({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber
        });
        const changedFiles = listFilesResponse.data.map(f => f.filename);
        core_1.debug("found changed files:");
        for (const file of changedFiles) {
            core_1.debug("  " + file);
        }
        return changedFiles;
    });
}
function addLabels(client, prNumber, labels) {
    return __awaiter(this, void 0, void 0, function* () {
        core_1.debug(`labels to add: ${labels}`);
        yield client.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prNumber,
            labels: labels
        });
    });
}
run();
