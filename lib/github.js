"use strict";
var crypto = require("crypto");
var util   = require("util");

var DIGEST           = "sha1";
var DIGEST_FORMAT    = "hex";
var EVENT_HEADER     = "x-github-event";
var SIGNATURE_HEADER = "x-hub-signature";

exports.register = function (plugin, options, done) {
	// The console object is only used if the plugin dependencies fail to load.
	var log    = console;
	var secret = process.env.SECRET;

	function validateSignature (headers, validateOptions, done) {
		var hmac = crypto.createHmac(DIGEST, secret);
		var signature;

		hmac.update(validateOptions.context.payload);
		signature = util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));

		if (headers[SIGNATURE_HEADER] === signature) {
			done(null, headers);
			return;
		}
		else {
			log.info("signature verification failed");
			done(plugin.hapi.error.badRequest("checksum failure"));
			return;
		}
	}

	// Validate plugin options.
	if (!secret) {
		log.error(
			"No GitHub secret found. Please set the SECRET environment " +
			"variable."
		);

		done(new Error("a secret is required"));
		return;
	}

	plugin.dependency([ "utilities" ], function (plugin, done) {
		log         = plugin.plugins.utilities.logger(plugin, [ "github" ]);
		done();
	});

	plugin.route({
		config : {
			auth : false,

			payload : {
				output : "data",
				parse  : false
			},

			validate : {
				headers : validateSignature
			}
		},

		handler : function (request, reply) {
			var payload;

			// Attempt to parse the request payload.
			try {
				payload = JSON.parse(request.payload.toString());
			}
			catch (error) {
				log.error("failed to parse request: %s", error.message);
				reply(plugin.hapi.error.badRequest("parse error", error));
				return;
			}

			payload.event = request.headers[EVENT_HEADER];
			plugin.plugins.outflux.point("github", payload);
			reply(null);
		},

		method  : "POST",
		path    : "/github"
	});

	done();
};

exports.register.attributes = {
	name    : "github"
};
