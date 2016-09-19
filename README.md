#Lede-CLI
Lede-CLI is a command line interface for managing [Lede](http://github.com/tbtimes/lede) projects.

## Installation
1. Install [nvm](https://github.com/creationix/nvm) [\[windows\]](https://github.com/coreybutler/nvm-windows) and the latest versions of node (v6.3.x) and npm (v3.x).
2. Create a [GitHub auth token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) and add the environment variable `GH_TOKEN=<your token>`.
3. Ask Eli Murray for the Google APIs auth token and set it to the environment variable `GAPI_KEY=<google auth token>`.
4. Install the cli with `npm install -g lede-cli`.
5. Install bunyan (`npm install -g bunyan`) and pipe lede command output to it for pretty logs.

### Configuration
TODO - explanation

### Commands
* `cd` - change into a lede project directory
* `dev` - launch a local dev server for a lede project
* `image` - send images to aws lambda for resizing
* `install` - fetch a lede project from github
* `ls` - list all installed lede projects
* `new` - create a new lede project/bit