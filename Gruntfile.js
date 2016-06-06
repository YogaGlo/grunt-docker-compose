/*
 * grunt-docker-compose
 * https://github.com/YogaGlo/grunt-docker-compose
 *
 * Copyright (c) 2016 YogaGlo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Shell command wrappers
		shell: {
			echoCommand: {
				command: [
					'printf',
					'"\nExecuting: ',
					'\\033[0;33m',
					'<%= cmd %>',
					'\\033[0m\n"'
				].join(' ')
			},
			runCommand: {
				command: '<%= cmd %>'
			},
			runLongTailCommand: {
				options: {
					execOptions: {
						maxBuffer: Infinity
					}
				},
				command: '<%= cmd %>'
			},
			runStdinCommand: {
				options: {
					stdin: true,
					stdinRawMode: true
				},
				execOptions: {
					maxBuffer: Infinity
				},
				command: '<%= cmd %>'
			},
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}

	});

	require('load-grunt-tasks')(grunt);

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	// grunt.registerTask('test', ['clean', 'dockerCompose', 'nodeunit']);
	grunt.registerTask('test', ['clean', 'dockerCompose']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
