import * as glob from "glob-promise";
import * as Git from "nodegit";
import { existsSync } from "fs";
import * as rmrf from "rimraf";

import { resolve, join } from "path"
import { Config } from "../../interfaces"
import { searchForProjectDir, getProjectName } from "../utils";

export async function stageCommand(config: Config, args) {
  const logger = config.logger;
  const path = args["p"] || args["path"] || process.cwd();
  const workingDir = await searchForProjectDir(path);
  const projectName = await getProjectName(workingDir);

  const remoteUrl = await Git.Repository.open(workingDir).then(function(repository) {
    return repository.getRemote("origin").then(function(remote) {
      return remote.url();
    });
  });
  const serveUrl = "https://tbtimes.github.io/" + projectName + "/";

  let servePath = join(workingDir, config.caches.DEPLOY_DIR, projectName);
  const projectDirs = await glob(`*/`, {cwd: servePath});
  const servePathGit = servePath + "/.git/";

  if (existsSync(servePathGit)) {
    logger.info("Deleting existing .git directory.")
    rmrf.sync(servePathGit);
  }

  let repo, index, oid;
  const token = args["t"] || args["token"] || config.GH_TOKEN || process.env.GH_TOKEN;
  if (!token)
      logger.error(`Must specify a token to access github.`) && process.exit(1);
  const pushOpts = {
      callbacks: {
          credentials: function () {
              return Git.Cred.userpassPlaintextNew(token, "x-oauth-basic");
          }
      }
  };
  if (process.platform === "darwin") {
      pushOpts.callbacks.certificateCheck = function () { return 1; };
  }
  const signature = Git.Signature.now("newsroom-user", "ejmurra2@gmail.com");

  await Git.Repository.init(servePath, 0)
    .then(function(repository) {
      repo = repository;
      return repo.refreshIndex().then(function(indexResult) {
        index = indexResult;
        return index.addAll()
          .then(function() {
            return index.write();
          })
          .then(function() {
            return index.writeTree();
          });
      });
    })
    .then(function(oidResult) {
      oid = oidResult;
      return repo.createCommit("HEAD", signature, signature, "lede stage", oid);
    })
    .then(function(o) {
      return repo.createBranch("gh-pages", o);
    })
    .then(function() {
      return repo.checkoutBranch("gh-pages");
    })
    .then(function() {
      return Git.Remote.create(repo, "origin", remoteUrl).then(function(remote) {
        logger.info("Pushing to GitHub.");
        return remote.push("+refs/heads/gh-pages:refs/heads/gh-pages", pushOpts)
          .then(function() {
            return projectDirs.map(dir=> logger.info(dir.slice(0,-1) + " served at " + serveUrl + dir));
          })
        })
      }, function(err) { logger.error(err); });
}
