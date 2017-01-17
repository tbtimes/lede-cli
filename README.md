#Lede-CLI
Lede-CLI is a command line interface for managing [Lede](http://github.com/tbtimes/lede) projects.

#### CLI commands
The following is a list of commands. The sub-bullets under the command are the options the command takes. A \* next to the command means that the command supports at least one additional subcommand.
* [new](#new)\*
    * inline
    * path
    * template
* [dev](#dev)
    * port
    * path
* [install](#install)\*
    * path
    * fetcher
* [save](#save)
    * path
    * fetcher
* [listmodules](#listmodules)
    * fetcher
* [configure](#configure)\*
    * token
    * npm
* [image](#image)
    * path
    * fetcher
    * clobber
    * bucket
* build (#build)

##### new
The `new` command allows you to quickly scaffold out new pieces for a lede project.
* Syntax: `lede new <type> <name> [options]`
* Aliases: none
* Subcommands:
    * Type: `project | bit | block | page`
    * Name: any string
* Options:
    * `--path | -p`: A string specifying a path where the command should be run. Defaults to `process.cwd()`.
    * `--inline | -i`: A boolean that specifies the new command should run in the current directory and not create a subdirectory. Defaults to `false`. __Only valid with type `project`__
    * `--template | -t`: A string specifying a template that should be used. Defaults to `default`.
* Examples:
    * `lede new project foo --inline --template photo` -> Create a new project named foo in the current directory using the photo template
    * `lede new bit bar` -> Create a new bit named bar in the current directory
    * `lede new block baz -t slider -p ~/foo/bar` -> Create a new block named baz at path `~/foo/bar` with the slider template

##### dev
The `dev` command builds a project and serves it. While `dev` is running, it watches all of the project's components and automatically rebuilds and refreshes the page if any changes are detected.
* Syntax: `lede dev [options]`
* Aliases: none
* Subcommands: none
* Options:
    * `--port | -x`: An int specifying a port for the dev server. Defaults to port 8000.
    * `--path | -p`: A string specifying a path where the command should be run. Defaults to `process.cwd()`.
* Examples:
    * `lede dev` -> Runs the dev server in the current directory listening to port 8000.
    * `lede dev --path ~/foobar -x 1337` -> Runs the project at path `~/foobar` with the dev server on port 1337.

##### install
The `install` command is used to install lede_modules from a registry.
* Syntax: `lede install [<module>...] [options]`
* Aliases: none
* Subcommands:
    * `[<module>...]` optionally specify one or more modules to install. If this subcommand is not specified, lede will look for a `ledeModules` property on the `package.json` and install the modules listed there. Modules are typically specified in the format `<moduleName>.v<versionNumber>` (ex: `photo.v1` would be version one of the photo module).
* Options:
    * `--path | -p`: A string specifying a path where the command should be run. Defaults to `process.cwd()`.
    * `--fetcher | -f`: A string specifying a fetcher to use to get the modules from the registry. Defaults to `default`.
* Examples:
    * `lede install --path ~/foo` -> installs lede_modules at path `~/foo` that are specified in the `ledeModules` property on `~/foo/package.json`.
    * `lede install foo.v14 -f gdoc` -> installs the version 14 of the `foo` module into the current project using the `gdoc` fetcher.

##### save
The `save` command saves a project to the registry as a lede module. To save a module to the registry, you must specify a unique, integer version number in the `projectSettings.js` file.
* Syntax: `lede save [options]`
* Aliases: none
* Subcommands: none
* Options:
    * `--path | -p`: A string specifying a path where the command should be run. Defaults to `process.cwd()`.
    * `--fetcher | -f`: A string specifying a fetcher to use to send the module to the registry. Defaults to `default`.
* Examples:
    * `lede save` -> saves the current project to the registry using the name and version number from the `projectSettings.js` file.
    * `lede save --path ~/foo/bar -f other` -> saves the project at `~/foo/bar` to the `other` registry using the name and version number from the `projectSettings.js` file.

##### listmodules
The `listmodules` command lists all available modules and their versions available in the registry.
* Syntax: `lede listmodules [options]`
* Aliases: `lm`
* Subcommands: none
* Options:
    * `--fetcher | -f`: A string specifying a fetcher to use to search the registry for modules. Defaults to `default`.
* Examples:
    * `lede lm` -> lists all modules and their versions on the registry
    * `lede listmodules -f borp` -> lists all modules and their versions on the registry using the `borp` fetcher.

##### configure
The `configure` command allows the user to pull in custom configurations from a github repo. Useful if you want access to a custom set of templates or fetchers. Installs configurations into `~/ledeConfig` (or `%USERPROFILE%\ledeConfig` on windows).
* Syntax: `lede configure <repo> [options]`
* Aliases: `config`
* Subcommands:
    * `<repo>` is a required subcommand that specifies a github repo to pull the configuration from. Uses the syntax `<owner>/<repoName>`.
* Options:
    * `--token | -t`: A string specifying a [github access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) to use for the request to github. Defaults to `GH_TOKEN` environment variable.
    * `--npm`: A string specifying an [npm script](https://docs.npmjs.com/misc/scripts) to be run after pulling the repo down and installing it's dependencies. Useful if you need to transpile your configurations before they can be used. If not specified, no npm script is run.
* Examples:
    * `lede config foo/lede-configs` -> installs configurations from the `foo` github user's `lede-configs` repo using the access token specified by `GH_TOKEN` environment variable.
    
##### image
The `image` command allows the user to send images off to be resized/hosted. The actual implementation of the image handling is defined by a fetcher. The default fetcher uses s3 and lambda for storing/resizing images.
* Syntax: `lede image [options]`
* Aliases: `images`
* Subcommands: none
* Options:
    * `--fetcher | -f`: A string specifying a fetcher to use to store the images. Defaults to `default`.
    * `--path | -p`: A string specifying a path where the command should be run. Defaults to `process.cwd()`.
    * `--clobber | -c`: A boolean specifying if lede should overwrite existing files with the same name.
    * `--bucket | -b`: A bucket name lede should save the images too. Defaults to "ledejs".

##### build
The `build` command builds the project for production and puts the output in the `outDir` specified by the CLI config. By default, this is the directory `dist` in the project root. From here, the project can be pushed up to a file server for hosting.