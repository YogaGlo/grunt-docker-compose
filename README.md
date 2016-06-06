# grunt-docker-compose

> docker tooling for Grunt, using mostly `docker-compose`

## Getting Started
This plugin requires:

	- Grunt `^0.4.5`
	- `grunt-shell`
	- `grunt-concurrent`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin and its dependencies with this command:

```shell
	npm install grunt grunt-docker-compose grunt-shell grunt-concurrent --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-docker-compose');
```

### Prerequisite: Docker
It is assumed you already have your docker toolchain installed and working:

 - `docker-compose` `>1.7.1`, 
 - `docker` `>1.11.1`,
 - latest `docker-machine` if applicable

You should have at least a `docker-compose.yml` file in the working directory.

If you are not familiar with Docker, please see `http://docker.io` to get started.

## The "dockerCompose" task

### Overview
In your project's Gruntfile, add a section named `dockerCompose` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  dockerCompose: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

##### Example



### Options

##### Order of precedence

	- sane defaults set by the plugin
	- Gruntfile
	- env.vars
	- command line args


#### options.composeFile

Name of the `docker-compose` file to use. Defaults to `docker-compose.yml`.

#### options.dockerRegistry

Docker Registry. Defaults to an empty string, which corresponds to DockerHub. If set, this option will set a `DOCKER_REGISTRY` environment variable before running each command. Use it by interpolation in your `docker-compose.yml` file, e.g.:

```
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


### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  dockerCompose: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  dockerCompose: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
