"use strict";
var crypto = require("crypto");

var DIGEST = "sha1";
var HEADER = "x-hub-signature";

exports.register = function (plugin, options, done) {
	if (!options.secret) {
		done(new Error("a secret is required"));
		return;
	}

	plugin.method(
		"verify",
		function (payload, headers, done) {
			var hmac = crypto.createHmac(DIGEST, options.secret);

			hmac.update(payload);
			if (headers[HEADER] === "sha1=" + hmac.digest("hex")) {
				done();
				return;
			}
			else {
				done(plugin.hapi.error.badRequest("checksum failed"));
			}
		}
	);

	plugin.route({
		handler : function (request, reply) {
			reply("Hello github!");
		},

		method  : "POST",
		path    : "/github"
	});

	done();
};

exports.register.attributes = {
	name    : "hooks",
	version : "0.0.0"
};
