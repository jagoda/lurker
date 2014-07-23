"use strict";
var util = require("util");
var _    = require("lodash");

function log (plugin, tags) {
	var message = Array.prototype.slice.call(arguments, 2);

	return plugin.log(tags, util.format.apply(util, message));
}

function Logger (plugin, tags) {
	var logger = this;

	_.each([ "error", "info", "warn" ], function (tag) {
		logger[tag] = log.bind(null, plugin, [ tag ].concat(tags || []));
	});
}

exports.register = function (plugin, options, done) {
	var log = new Logger(plugin, [ "utilities" ]);

	plugin.events.on("start", function () {
		_.each(plugin.servers, function (server) {
			log.info("server started at %s", server.info.uri);
		});
	});

	plugin.expose("logger", function (plugin, tags) {
		return new Logger(plugin, tags);
	});

	done();
};

exports.register.attributes = {
	name    : "utilities",
	version : "0.0.0"
};
