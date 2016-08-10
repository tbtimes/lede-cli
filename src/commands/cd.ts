import { resolve } from 'path';
import { stat } from 'sander';


export async function cdCommand({workingDir, args, logger}) {
  let name = args['_'][0];

  try {
    let status = await stat(resolve(workingDir, name, "projectSettings.js"));
    if (!status.isFile()) {
      logger.error(`${resolve(workingDir, name)} is not a lede project.`);
    } else {
      console.log(resolve(workingDir, name))
    }
  } catch(err) {
    if (err.code !== "ENOENT") {
      logger.error({err}, `An error occurred while looking for ${resolve(workingDir, name, "projectSettings.js")}`);
    } else {
      logger.error(`${resolve(workingDir, name)} is not a lede project.`);
    }
  }
}