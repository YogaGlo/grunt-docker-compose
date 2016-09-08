# grunt-docker-compose

> `docker-compose` interface for Grunt

## Getting Started
This plugin requires:

	- grunt: "^1.0.1"
	- grunt-shell

**Important**: `grunt-shell` is a `peerDependency`. as NPM v3+ deprecates `peerDependencies`, you need to explicitly specify `grunt-shell` in your project's `devDependencies`:

`npm install grunt-shell --save-dev` 

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin and its dependencies with this command:

```bash
npm install grunt grunt-docker-compose grunt-shell grunt-concurrent --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-docker-compose');
```

### Prerequisite: Docker
It is assumed you already have your Docker toolchain installed and working:

 - `docker-compose: >1.7.1`, 
 - `docker: >1.11.1`

You should have at least a `docker-compose.yml` file in the working directory.

If you are not familiar with Docker, please see `http://docker.io` to get started.

### Tasks setup
Add this to your Gruntfile.js to register all of the tasks as aliases to your `grunt` command:

```js
// register all dockerCompose targets
['up','down','stop','restart','logs','build','pull','exec','config'].forEach(function (target) {
	grunt.registerTask(target, function () {
		var args = '';
		if (this.args.length > 0) {
			args += ':' + this.args.join(':')
		}
		grunt.task.run('dockerCompose:' + target + args);
	});
})
```

Now you can:

- `grunt up` will execute `docker-compose up`
- `grunt down` will execute `docker-compose down`
- etc...


## The "dockerCompose" task

### Overview
In your project's Gruntfile, add a section named `dockerCompose` to the data object passed into `grunt.initConfig()`.

##### Example

```js
grunt.initConfig({
	// ....... stuff .......
	dockerCompose: {
   		options: {
   			mappedComposeFile: 'docker-compose-mapped.yml',
   			dockerRegistryNamespace: 'my-web-app'
   		}
	}
});
```

### Options

To use the `tag`, `dockerRegistry`, and `dockerRegistryNamespace` options, you must utilize environment variable interpolation in your `docker-compose.yml`:

```yaml
version: '2'
services:
  redis:
    image: redis

  my-web-app:
    build: .
    image: ${DOCKER_REGISTRY}/${DOCKER_REGISTRY_NAMESPACE}/my-web-app:${TAG}
    ports:
      - 80:80
.....
```


##### Order of precedence (higher options override lower ones)

0. sane defaults set by the plugin
0. Gruntfile
0. environment variables
0. command line arguments

E.g.:

- `grunt up:foo` will set the `foo` tag instead of default `latest`,
- `TAG=foobar grunt up` will set the `foobar` tag instead of default `latest`,
- `TAG=baz grunt up:foo` will set the `foo` tag instead of default `latest`. Note that `TAG` is overridden, being lower precedence.

#### options.dockerRegistry

Docker Registry. Defaults to an empty string, which corresponds to DockerHub. If set, this option will set a `DOCKER_REGISTRY` environment variable before running each command. Use it by interpolation in your `docker-compose.yml` file, e.g.:

```yaml
myapp:
	image: ${DOCKER_REGISTRY}/myNamespace/myapp:some-tag
```

If you aren't using it this way in your `docker-compose` files, setting this option has no effect.

#### options.dockerRegistryNamespace

Docker Registry Namespace. If using this option, you should specify your DockerHub username or organization here. Defaults to an empty string.

Used in the same way as `dockerRegistry`:

```yaml
myapp:
	image: ${DOCKER_REGISTRY}/${DOCKER_REGISTRY_NAMESPACE}/myapp:some-tag
```


#### options.tag

Image tag. Defaults to 'latest'. Use by interpolation in your `docker-compose` files.

```yaml
myapp:
	image: ${DOCKER_REGISTRY}/${DOCKER_REGISTRY_NAMESPACE}/myapp:${TAG}
```


#### options.mappedComposeFile

An optional `docker-compose` YAML file that extends the default, and allows for mounting host directories into the container for development. Defaults to `docker-compose.yml` (functionally identical to not using any extra `docker-compose` files).

You would use this option if your `docker-compose.yml` doesn't mount any volumes into your container by default, and you had another file like `docker-compose-volumes.yml` extending it and specifying mounted volumes, e.g.:

`docker-compose.yml:`
```yaml
myapp:
	build: .
	ports: 80:80
	...
```

`docker-compose-mapped-volumes.yml`:
```yaml
myapp:
	extends:
		file: docker-compose.yml
		service: myapp
	volumes: 
		- ./src:/usr/local/src/myapp
```


#### options.debugComposeFile

Another optional `docker-compose` YAML file that extends the default and uses a different Dockerfile or other options for debug use (or whatever other purpose you may have). Same idea as above.


#### options.composeFile (NOT YET IMPLEMENTED)

Name of the `docker-compose` file to use. Defaults to `docker-compose.yml`.

### Usage Examples

```
grunt dockerCompose:up
grunt dockerCompose:up:v1.0-tag
grunt dockerCompose:up:v1.0-tag --baked
grunt dockerCompose:up --debug

grunt dockerCompose:down

grunt dockerCompose:restart
grunt dockerCompose:restart:my-app

grunt dockerCompose:logs
grunt dockerCompose:logs:my-app
grunt dockerCompose:logs --raw

grunt dockerCompose:build
grunt dockerCompose:build:my-app
grunt dockerCompose:build:my-app:v1.0-tag
grunt dockerCompose:build:my-app:v1.0-tag --no-cache
grunt dockerCompose:build:my-app:v1.0-tag --debug

grunt dockerCompose:pull
grunt dockerCompose:pull:my-app
grunt dockerCompose:pull:my-app:v1.0-tag

grunt dockerCompose:exec
grunt dockerCompose:exec:some-service
grunt dockerCompose:exec:some-service:some-executable
grunt dockerCompose:exec:redis:redis-cli

grunt dockerCompose:config
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
06/15/2016 0.1.0 Initial release
