/*
 * grunt-docker-compose
 * https://github.com/YogaGlo/grunt-docker-compose
 *
 * Copyright (c) 2016 YogaGlo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-shell');

	var spawn = require('child_process').spawnSync;

	var mergeConfig = function () {
		pkg: grunt.file.readJSON('package.json'),

		grunt.config.merge({
			// TAG, DOCKER_REGISTRY, DOCKER_REGISTRY_NAMESPACE defaults
			// May be overridden globally by exporting these env.vars to the shell,
			// TAG may be overridden per task at runtime (see individual tasks for specific usage)
			dockerCompose: {
				options: {
					tag: process.env.TAG,
					dockerRegistry: process.env.DOCKER_REGISTRY,
					dockerRegistryNamespace: process.env.DOCKER_REGISTRY_NAMESPACE,
					composeFile: grunt.config.get('dockerCompose.options.composeFile') || 'docker-compose.yml',
					composeFileContent: grunt.file.readYAML('docker-compose.yml'),
					mappedComposeFile: grunt.config.get('dockerCompose.options.mappedComposeFile') || 'docker-compose.yml',
					debugComposeFile: grunt.config.get('dockerCompose.options.debugComposeFile') || 'docker-compose.yml'
				}
			},

			// Shell command wrappers
			shell: {
				runCommand: {
					command: '<%= dockerCompose.options.cmd %>'
				},
				runLongTailCommand: {
					options: {
						execOptions: {
							maxBuffer: Infinity
						}
					},
					command: '<%= dockerCompose.options.cmd %>'
				},
				runStdinCommand: {
					options: {
						stdin: true,
						stdinRawMode: true
					},
					execOptions: {
						maxBuffer: Infinity
					},
					command: '<%= dockerCompose.options.cmd %>'
				}
			}
		});
	};

	var buildCommandSkeleton = function () {
		var cmd = [];
		var options = grunt.config.getRaw('dockerCompose.options') || {};
		if (options.tag) {
			cmd.push('TAG=<%= dockerCompose.options.tag %>');
		}
		if (options.dockerRegistry) {
			cmd.push('DOCKER_REGISTRY=<%= dockerCompose.options.dockerRegistry %>');
		}
		if (options.dockerRegistryNamespace) {
			cmd.push('DOCKER_REGISTRY_NAMESPACE=<%= dockerCompose.options.dockerRegistryNamespace %>');
		}
		return cmd;
	};

	var logCommand = function () {
		grunt.log.header('Executing Command:');
		grunt.log.ok(grunt.config.get('dockerCompose.options.cmd'));
	};

	/*****	MAIN task  *****/
	grunt.registerTask('dockerCompose', 'Grunt task wrappers for docker-compose', function() {
		mergeConfig();
		var	args = this.args,
			task = 'dockerCompose',
			target;
		if (args.length > 0) {
			target = args[0];
			args.shift();
		}
		else {
			grunt.warn('Target not specified!');
		}

		switch (target) {
			case 'up':
				task = 'dockerComposeUp';
				break;
			case 'down':
				task = 'dockerComposeDown';
				break;
			case 'stop':
				task = 'dockerComposeStop';
				break;
			case 'restart':
				task = 'dockerComposeRestart';
				break;
			case 'logs':
				task = 'dockerComposeLogs';
				break;
			case 'build':
				task = 'dockerComposeBuild';
				break;
			case 'pull':
				task = 'dockerComposePull';
				break;
			case 'exec':
				task = 'dockerComposeExec';
				break;
			case 'config':
				task = 'dockerComposeConfig';
				break;
		}

		if (args.length > 0) {
			task += ':';
		}

		grunt.task.run(task + args.join(':'));
	});


	/**
		* dockerComposeUp launches the stack. Wraps `docker-compose up`.
		* @param {string} tag - specify an image tag to operate with (optional).
		*
		* Will build images as required.
		* Prefers building to pulling. Use `grunt dockerComposePull` to pull images from the registry first, if needed.
		*	Usage:
		*		- grunt dockerComposeUp[:tag] [--baked | --debug]
		*/
	grunt.registerTask('dockerComposeUp', 'Launch the docker-compose stack', function (tag) {
		if (tag) {
			grunt.config.set('dockerCompose.options.tag', tag);
		}

		// only do this AFTER setting the tag. Otherwise it won't be merged into the command.
		var cmd = buildCommandSkeleton();

		cmd.push('docker-compose');
		if (!grunt.option('baked') && !grunt.option('debug')) {
			cmd.push('-f <%= dockerCompose.options.mappedComposeFile %>');
		}
		else if (grunt.option('debug')) {
			cmd.push('-f <%= dockerCompose.options.debugComposeFile %>');
		}
		cmd.push('up -d');

		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});


	/**
		*	dockerComposeDown tears down the stack. Wraps `docker-compose down`.
		* Usage:
		*		- grunt dockerComposeDown
		*/
	grunt.registerTask('dockerComposeDown', 'Tear down the stack', function () {
		var cmd = buildCommandSkeleton();
		cmd.push('docker-compose down -v; exit 0'); // exit 0: hack to not throw a warning when other stacks' containers are still attached to this network
		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});


	/**
		* dockerComposeStop stops the stack, leaving all resources (containers, networks) intact.
		* Wraps `docker-compose stop`.
		* Usage:
		*		- grunt dockerComposeStop
		*/
	grunt.registerTask('dockerComposeStop', 'Stop all containers in the stack', function () {
		var cmd = buildCommandSkeleton();
		cmd.push('docker-compose stop');
		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});


	/**
		* dockerComposeRestart restarts services in the stack. Wraps `docker-compose restart`.
	  * @param {string} service - specify one and only one service to restart (optional).
		* Usage:
		*		- grunt dockerComposeRestart[:service]
		*/
	grunt.registerTask('dockerComposeRestart', 'Restart containers stack or service', function (service) {
		var cmd = buildCommandSkeleton();
		cmd.push('docker-compose restart');
		if (service) {
			cmd.push(service);
		}
		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});


	/**
		* dockerComposeLogs displays logs. Wraps `docker-compose logs`.
		* The name of the "main" service is determined from the `name` field in package.json.
		* @param {string} service - name of the service to target. May be set to a special value 'all' to tail logs for all services.
		* supports the `bunyan` CLI tool if installed, or passes through raw output (--raw). The latter is implied for `:all`.
		* Usage:
		*		- grunt dockerComposeLogs[:service |:all] [--raw]
	*/
	// TODO this does the job for now, but really this whole thing should be refactored.
	grunt.registerTask('dockerComposeLogs', 'Display container logs', function (service) {

		// is bunyan cli installed?
		var bunyanExists = (spawn('which',['bunyan']).status === 0);

		var cmd = buildCommandSkeleton();
		cmd.push('docker-compose logs --tail=0 -f');

		// If service is unspecified, only tail the main service's logs.
		if (!service) {
			service = '<%= pkg.name %>';

			// TODO This should use `docker-compose logs` when service name can be removed from the log entry, and `bunyan` cooperates
			cmd = [
				'docker logs --tail=10 -f',
				'$(',
				// these are here just to avoid annoying warnings in the shell
				'TAG=""',
				'DOCKER_REGISTRY=""',
				'DOCKER_REGISTRY_NAMESPACE=""',
				'docker-compose ps -q',
				service,
				')'];
		}
		else if (service !== 'all') {
			cmd.push(service);
		}

		if (!grunt.option('raw') && bunyanExists) {
			cmd.push('| bunyan --color -o short');
		}

		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));

		// TODO: if all services are stopped, recursion makes this command run indefinitely, and it must be terminated manually.
		// Implement a check to run logs ONLY if at least 1 service is running. (how?)
		// (May be resolved when bunyan cooperates - will not need recursion then?)
		logCommand();
		grunt.task.run('shell:runLongTailCommand', 'dockerComposeLogs');
	});

	/** dockerComposeBuild builds containers for services that have an 'build` key specified in the docker-compose file.
		* @param {string} service - name of the service to build (optional); the default is to build all images that can be built
		* @param {string} tag - specify tag to apply to the new image; the tag must be used in the docker-compose file via variable interpolation;
		* @param {bool} --no-cache - equivalent to the `--no-cache` option for docker-compose
		* @param {bool} --debug - build the debug image using the `debugComposeFile`.
		* Usage:
		*		- grunt dockerComposeBuild[:service][:tag] [--no-cache] [--debug]
	  */
	grunt.registerTask('dockerComposeBuild', 'Build all images that can be built from the compose file', function (service, tag) {
		if (tag) {
			grunt.config.set('dockerCompose.options.tag', tag);
		}

		var cmd = buildCommandSkeleton();

		cmd.push('docker-compose');

		// Build debug
		if (grunt.option('debug')) {
			cmd.push('-f <%= debugComposeFile %>');
		}

		cmd.push('build');

		// Rebuild
		if (grunt.option('no-cache')) {
			cmd.push('--no-cache');
		}

		if (service) {
			cmd.push(service);
		}

		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});

	/** dockerComposePull pulls docker images specified in `docker-compose` file.
		*	@param {string} tag - specify the tag (optional)
		*	@param {string} service - specify the service (optional)
		* Usage:
		*		- grunt dockerComposePull[:service][:tag]
		*/
	grunt.registerTask('dockerComposePull', 'Pull docker image(s) specified in the compose file', function (service, tag) {
		if (tag) {
			grunt.config.set('dockerCompose.options.tag', tag);
		}

		var cmd = buildCommandSkeleton();

		cmd.push('docker-compose', 'pull', '--ignore-pull-failures');

		if (service) {
			cmd.push(service);
		}

		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});

	/** dockerComposeExec executes a command in a container.
		* By default, executes the `ash` shell in the service matching the `name` key in package.json.
		*	@param {string} exec - specify the command to run (optional)
		*	@param {string} service - specify the service (optional)
		* Usage:
		*		- grunt dockerComposeExec
		*		- grunt dockerComposeExec[:service][:exec]
		*		- grunt dockerComposeExec:redis:redis-cli
		*/
	grunt.registerTask('dockerComposeExec', 'Execute a command in a containter', function (service, exec) {
		if (!service) {
			service = '<%= pkg.name %>';
		}

		var cmd = buildCommandSkeleton();

		// default executable to run
		if (!exec) {
			exec = 'ash';
		}

		cmd.push ('docker-compose exec', service, exec);

		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runStdinCommand');
	});

	/** dockerComposeConfig prints compiled config for all services from `docker-compose` files.
		*	Usage:
		*		- grunt dockerComposeConfig
		*/
	grunt.registerTask('dockerComposeConfig', 'Get compiled docker-compose config for the stack', function () {
		var cmd = buildCommandSkeleton();
		cmd.push('docker-compose config');
		grunt.config.set('dockerCompose.options.cmd', cmd.join(' '));
		logCommand();
		grunt.task.run('shell:runCommand');
	});
};
