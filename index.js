/**
 * Updates Bower components to the really latest versions.
 *
 * @author Artem Sapegin (http://sapegin.me)
 */

'use strict';

var chalk = require('chalk');
var bower = require('bower');
var _ = require('lodash');
var async = require('async');
var opts = require("opts");
var readlineSync = require('readline-sync');

module.exports = function(options, allDone) {

	var bowerConfig = {
		cwd: options.cwd
	};

	var getComponents = function(done) {
		bower.commands.list({
			map: true
		}, bowerConfig)
			.on('error', allDone)
			.on('end', done.bind(null, null))
		;
	};

	var updateComponents = function(data, done) {
		var components = _.values(data.dependencies);
		components = _.filter(components, isUpdateAvailable);
		if (!components.length) {
			done(null, []);
			return;
		}

		var endpoints = _.map(components, function(component) { return component.pkgMeta.name; });
		bower.commands.install(endpoints, {save: true, forceLatest: true}, bowerConfig)
			.on('end', function(installed) {
				installed = _.map(installed, function(component) {
					var name = component.pkgMeta.name;
					return {
						name: name,
						now: component.pkgMeta.version,
						then: data.dependencies[name].update.target
					};
				});
				done(null, installed);
			})
		;
	};

	var isUpdateAvailable = function(component) {
		if (opts.args()[0] == true) {
			console.log(component.pkgMeta.name + ':' +  chalk.red(component.update.latest) + ' → ' + chalk.green(component.update.latest));
			var q = "Upgrade now? [Y]es, [N]o";
			var answer = readlineSync.question(q);
		}
		return component.update.target !== component.update.latest;
	};

	async.waterfall([
		getComponents,
		updateComponents
	], allDone);

};
