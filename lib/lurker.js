"use strict";
var Configuration = require("./Configuration");
var Mustache      = require("mustache");
var Path          = require("path");
var URL           = require("url");
var _             = require("lodash");

function MustacheEngine () {
	this.compile = function (template) {
		Mustache.parse(template);

		return function (view) {
			return Mustache.render(template, view);
		};
	};
}

exports.register = function (plugin, options, done) {
	var configuration = new Configuration();

	plugin.events.on("start", function () {
		plugin.log(
			[ "info", "lurker" ],
			"Lurker started at '" + plugin.servers[0].info.uri + "'."
		);
	});

	plugin.views({
		basePath         : Path.join(__dirname, "templates"),
		defaultExtension : "html",

		engines : {
			js : new MustacheEngine()
		}
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

		plugin.route({
			method : "GET",
			path   : "/config.js",

			handler : function (request, reply) {
				var influxdb = URL.parse(configuration.database.url(), true);
				var password = influxdb.query.p;
				var username = influxdb.query.u;

				var options  = _.pick(
					influxdb,
					[ "host", "pathname", "protocol" ]
				);

				var grafana = URL.resolve(URL.format(options), "../grafana");
				var lurker  = URL.resolve(URL.format(options), "../lurker");

				reply.view(
					"config.js",
					{
						lurker : {
							password : password,
							url      : lurker,
							username : username
						},

						grafana : {
							password : password,
							url      : grafana,
							username : username
						}
					}
				);
			}
		});

		done();
	});

	done();
};

exports.register.attributes = {
	name : "lurker"
};
