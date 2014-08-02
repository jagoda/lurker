"use strict";
var Nipple = require("nipple");
var Q      = require("q");
var _      = require("lodash");

exports.register = function (plugin, options, done) {
	// The console API is only used if the plugin dependencies fail to load.
	var log = console;

	plugin.dependency("utilities", function (plugin, done) {
		log = plugin.plugins.utilities.logger(plugin, [ "metrics" ]);
		done();
	});

	plugin.method("createEvent", function (options, done) {
		Q.ninvoke(
			Nipple, "post",
			// FIXME: should externalize the cube config.
			"http://localhost:1080/1.0/event/put",
			{
				payload : JSON.stringify([
					_.pick(options, [ "id", "data", "type" ])
				])
			}
		)
		.spread(
			function (response, payload) {
				if (response.statusCode !== 200) {
					log.error("cube request failed: %s", payload);
					throw plugin.hapi.error.internal("cube request failed");
				}
			},
			function (error) {
				log.error("unexpected error: %s", error.message);
				throw plugin.hapi.error.internal("unexpected error", error);
			}
		)
		.nodeify(done);
	});

	done();
};

exports.register.attributes = {
	name    : "metrics"
};
