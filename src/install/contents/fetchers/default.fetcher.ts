const firebase = require("firebase");
import { S3, s3, config } from "aws-sdk";

import { Fetcher, Manifest } from "../../../interfaces";


export default class DependencyFetcher implements Fetcher {
  firebase: any;
  database: any;
  registryBucket: any;

  constructor({FIREBASECONFIG, AWSCONFIG}) {
    this.firebase = firebase.initializeApp(FIREBASECONFIG);
    this.database = this.firebase.database();
    this.registryBucket = AWSCONFIG.Bucket;
    config.update({ accessKeyId: AWSCONFIG["aws_access_key_id"], secretAccessKey: AWSCONFIG["aws_secret_access_key"], region: AWSCONFIG["region"]});
  };

  async save(manifest) {
    const registryItems = await this.database.ref("registry").once("value");
    registryItems.forEach(child => {
      const {id, version} = child.val();
      if (id === manifest.project && version === manifest.version) {
        throw new Error(`${manifest.project} version ${manifest.version} already exists on the registry and you do not have permission to overwrite it.` +
                        `Try incrementing the version and saving again.`)
      }
    });
    const id = `${manifest.project}.v${manifest.version}`;
    const { Bucket, Key } = await this.saveToS3(id, manifest);
    await this.database.ref("registry").push({ id: manifest.project, version: manifest.version, Bucket, Key });
    return;
  }

  async load({version, name}) {
    const registryItems = await this.database.ref("registry").once("value");
    const items = [];
    registryItems.forEach(child => {
      items.push(child.val());
    });
    const item = items.find(x => x.id === name && x.version === version);
    return await this.loadFromS3(item);
  }

  async listModules() {
    const registryItems = await this.database.ref("registry").once("value");
    const items = [];
    registryItems.forEach(child => {
      items.push(child.val());
    });
    return items.reduce((state, item) => {
      const index = state.findIndex(x => x.id === item.id);
      if (index === -1) {
        state.push({id: item.id, versions: [item.version]});
        return state;
      }
      state[index].versions.push(item.version);
      return state
    },[]);
  }

  async saveToS3(id, manifest) {
    const s3 = new S3();
    return new Promise((resolve, reject) => {
      s3.upload({ Body: JSON.stringify(manifest), Bucket: this.registryBucket, Key: id}, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      })
    });
  }

  async loadFromS3({ Bucket, Key }): Promise<Manifest> {
    const s3 = new S3();
    return new Promise((resolve, reject) => {
      s3.getObject({ Bucket, Key })
        .on("httpDone", x => {
          resolve(JSON.parse(x.httpResponse.body.toString()));
        })
        .send();
    });
  }
}
