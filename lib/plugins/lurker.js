"use strict";
var Configuration = require("../Configuration");
var Joi           = require("joi");
var Mustache      = require("mustache");
var Path          = require("path");
var URL           = require("url");
var _             = require("lodash");

var DEFAULT_PASSWORD = "supersecretpassword";

var OPTIONS_SCHEMA = Joi.object().keys({
	github : Joi.object().keys({
		clientId     : Joi.string().required(),
		clientSecret : Joi.string().required(),
		organization : Joi.string().required()
	}).required(),

	password : Joi.string().optional().default(DEFAULT_PASSWORD)
});

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

	options = Joi.validate(options, OPTIONS_SCHEMA, { abortEarly : false });

	plugin.events.on("start", function () {
		plugin.log(
			[ "info", "lurker" ],
			"Lurker started at '" + plugin.servers[0].info.uri + "'."
		);
	});

	plugin.views({
		basePath         : Path.join(__dirname, "..", "templates"),
		defaultExtension : "html",

		engines : {
			js : new MustacheEngine()
		}
	});

	plugin.dependency([ "bell", "hapi-auth-cookie" ], function (plugin, done) {
		if (DEFAULT_PASSWORD === options.value.password) {
			plugin.log(
				[ "warning", "lurker" ],
				"No cookie password specified. Using the default password."
			);
		}

		if (options.error) {
			plugin.log(
				[ "warning", "lurker" ],
				"Invalid GitHub OAuth configuration. Security is disabled."
			);
		}
		else {
			plugin.auth.strategy("github", "bell", false, {
				clientId     : options.value.github.clientId,
				clientSecret : options.value.github.clientSecret,
				password     : options.value.password,
				provider     : "github"
			});

			plugin.auth.strategy("session", "cookie", true, {
				password : options.value.password
			});
		}

		plugin.route({
			method : "GET",
			path   : "/{file*}",

			handler : {
				directory : {
					path : Path.join(
						__dirname, "..", "..", "vendor", "grafana-1.8.1"
					)
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
