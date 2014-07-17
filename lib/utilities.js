"use strict";
var _ = require("lodash");

var LOG_TAGS = [ "plugin", "utilities" ];

exports.register = function (plugin, options, done) {
	plugin.events.on("start", function () {
		_.each(plugin.servers, function (server) {
			plugin.log(
				[ "info" ].concat(LOG_TAGS),
				"server started at " + server.info.uri
			);
		});
	});

	done();
};

exports.register.attributes = {
	name    : "utilities",
	version : "0.0.0"
};
