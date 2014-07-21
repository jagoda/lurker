"use strict";
var crypto = require("crypto");
var util   = require("util");

var DIGEST        = "sha1";
var DIGEST_FORMAT = "hex";
var HEADER        = "x-hub-signature";

exports.register = function (plugin, options, done) {
	function validateSignature (headers, validateOptions, done) {
		var hmac = crypto.createHmac(DIGEST, options.secret);
		var signature;

		hmac.update(validateOptions.context.payload);
		signature = util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));

		if (headers[HEADER] === signature) {
			done(null, headers);
			return;
		}
		else {
			done(plugin.hapi.error.badRequest("checksum failure"));
			return;
		}
	}

	// Validate plugin options.
	if (!options.secret) {
		done(new Error("a secret is required"));
		return;
	}

	plugin.route({
		config : {
			payload : {
				parse : false
			},

			validate : {
				headers : validateSignature
			}
		},

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
