import { S3, s3 } from "aws-sdk";
import { join } from "path";
import { renameSync } from "fs";
import * as glob from "glob-promise";

import { Config } from "../../interfaces"
import { searchForProjectDir } from "../utils";


const jpgExtensions = ["jpeg", "jpg", "JPG", "JPEG"];
const pngExtensions = ["png", "PNG"];
const allExtensions = jpgExtensions.concat(pngExtensions);

export async function imageCommand(config: Config, args) {
  const path = args["p"] || args["path"] || process.cwd();
  const fname = args["f"] || args["fetcher"] || "default";
  const FETCHER = config.fetchers[fname];
  const workingDir = await searchForProjectDir(path);
  const clobber = args["c"] || args["clobber"] || false;
  const Bucket = args["b"] || args["bucket"] || "ledejs";

  let fullscreens = await glob(`*.{${allExtensions.join(",")}}`, {cwd: join(workingDir, "images", "fullscreen")});
  let mugs = await glob(`*.{${allExtensions.join(",")}}`, {cwd: join(workingDir, "images", "mugs")});

  // normalize extensions to lowercase
  mugs = await lowerCaseExtension({rawImages: mugs, logger: config.logger, basePath: join(workingDir, "images", "mugs")});
  fullscreens = await lowerCaseExtension({rawImages: fullscreens, logger: config.logger, basePath: join(workingDir, "images", "fullscreen")});

  // get project name
  const nameRegex = new RegExp(`(.*)\.projectSettings\.js`);
  const file = await glob(`*.projectSettings.js`, {cwd: workingDir});
  const [_, projName] = file[0].match(nameRegex);

  if (!clobber) {
    try {
      mugs = await FETCHER.filterImageList({Bucket, paths: mugs, logger: Config.logger, Key: `mugs/${projName}/`});
    } catch (err) {
      config.logger.error({err}, "An error occurred while checking for existing images on s3.");
    }

    try {
      fullscreens = await FETCHER.filterImageList({Bucket, paths: fullscreens, logger: Config.logger, Key: `fullscreen/${projName}/`});
    } catch (err) {
      config.logger.error({err}, "An error occurred while checking for existing images on s3.");
    }
  }
  // get keys for s3 and paths for uploading
  let mugPaths = mugs.map(p => {
    return {
      Key: `mugs/${projName}/${p}`,
      path: join(workingDir, "images", "mugs", p)
    }
  });
  let fullscreenPaths = fullscreens.map(p => {
    return {
      Key: `fullscreen/${projName}/${p}`,
      path: join(workingDir, "images", "fullscreen", p)
    }
  });

  try {
    await FETCHER.saveImages({Bucket, logger: config.logger, images: mugPaths});
    config.logger.info("Successfully uploaded all mugshots. It may take up to a minute before the resized images are available.");
  } catch (err) {
    config.logger.error({err}, "An error occurred while uploading mugshots to s3.");
  }
  try {
    await FETCHER.saveImages({Bucket, logger: config.logger, images: fullscreenPaths});
    config.logger.info("Successfully uploaded all mugshots. It may take up to a minute before the resized images are available.");
  } catch (err) {
    config.logger.error({err}, "An error occurred while uploading fullscreen images to s3.");
  }
}

async function lowerCaseExtension({rawImages, basePath, logger}) {
  return Promise.all(
    rawImages.map((path: string) => {
      const parts = path.split(".");
      let extension = parts[path.split(".").length -1];
      if (jpgExtensions.indexOf(extension) > -1) {
        parts[path.split('.').length -1] = "jpg";
      } else {
        parts[path.split(".").length -1] = "png";
      }
      let newPath = parts.join(".");

      if (path !== newPath) {
        let toReturn = newPath;
        path = join(basePath, path);
        newPath = join(basePath, newPath);
        logger.info(`Renaming ${path} to ${newPath}`);

        renameSync(path, newPath);
        return toReturn;
      }
      return path;
    })
  );
}