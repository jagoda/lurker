"use strict";
var Path = require("path");

exports.register = function (plugin, options, done) {
	plugin.events.on("start", function () {
		plugin.log(
			[ "info", "lurker" ],
			"Lurker started at '" + plugin.servers[0].info.uri + "'."
		);
	});

	plugin.dependency("badge", function (plugin, done) {
		var organization = options.github.organization;

		if (organization) {
			plugin.auth.strategy("basic", "github-basic", true, {
				organization : organization,
				realm        : "GitHub: " + organization
			});
		}
		else {
			plugin.log(
				[ "warning", "lurker" ],
				"No GitHub organization specified. Security disabled."
			);
		}

		plugin.route({
			method : "GET",
			path   : "/{file*}",

			handler : {
				directory : {
					path : Path.join(__dirname, "..", "vendor", "grafana-1.8.1")
				}
			}
		});

		done();
	});

	done();
};

exports.register.attributes = {
	name : "lurker"
};
