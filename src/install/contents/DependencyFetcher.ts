const firebase = require("firebase");
const google = require("googleapis");

import { Fetcher } from "../../interfaces";


export default class DependencyFetcher implements Fetcher {
  firebase: any;
  database: any;
  gconf: any;

  constructor(firebaseConfig: any, googleConfig: any) {
    this.firebase = firebase.initializeApp(firebaseConfig);
    this.database = this.firebase.database();
    this.gconf = googleConfig;
  };

  async save(manifest) {
    // await this.database.ref("registry").push({ id: "x", version: 5, location: "womp"})
    const registryItems = await this.database.ref("registry").once("value");
    registryItems.forEach(child => {
      const {id, version} = child.val();
      if (id === manifest.project && version === manifest.version) {
        throw new Error(`${manifest.project} version ${manifest.version} already exists on the registry and you do not have permission to overwrite it.` +
                        `Try incrementing the version and saving again.`)
      }
    });
    const id = `${manifest.project}.v${manifest.version}`;
    const driveResult = await this.saveGdoc(id, manifest);
    await this.database.ref("registry").push({ id: manifest.project, version: manifest.version, location: driveResult.id });
    return;
  }

  async saveGdoc(id, manifest) {
    const data = JSON.stringify(manifest);
    const {client, token} = await this.authenticateGoogle();
    const drive = google.drive({ version: "v3", auth: client });
    return await this.writeFileToDrive(drive, id, data);
  }

  writeFileToDrive(drive: any, name: string, data: string) {
    return new Promise((resolve, reject) => {
      drive.files.create({
        resource: {
          name,
          mimeType: "text/plain"
        },
        media: {
          mimeType: "text/plain",
          body: data
        }
      }, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      })
    });
  }

  authenticateGoogle() {
    const client = new google.auth.JWT(this.gconf.client_email, null, this.gconf.private_key, ["https://www.googleapis.com/auth/drive"], null);
    return new Promise((resolve, reject) => {
      client.authorize((err, token) => {
        if (err) return reject(err);
        return resolve({client, token})
      })
    });
  }
}
