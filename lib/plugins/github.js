"use strict";
var Crpyto = require("crypto");
var Util   = require("util");

var DIGEST           = "sha1";
var DIGEST_FORMAT    = "hex";
var EVENT_HEADER     = "x-github-event";
var SIGNATURE_HEADER = "x-hub-signature";

exports.DEFAULT_SECRET = "lurkersecret";

exports.register = function (plugin, options, done) {
	var secret = options.secret;

	function validateSignature (headers, validateOptions, done) {
		var hmac = Crpyto.createHmac(DIGEST, secret);
		var signature;

		hmac.update(validateOptions.context.payload);
		signature = Util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));

		if (headers[SIGNATURE_HEADER] === signature) {
			done(null, headers);
			return;
		}
		else {
			plugin.log(
				[ "warning", "github" ],
				"signature verification failed"
			);
			done(plugin.hapi.error.badRequest("checksum failure"));
			return;
		}
	}

	// Validate plugin options.
	if (!secret) {
		plugin.log(
			[ "warning", "github" ],
			"No GitHub secret found. Using default secret value."
		);

		secret = exports.DEFAULT_SECRET;
	}

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
				plugin.log(
					[ "error", "github" ],
					"failed to parse request: %s", error.message
				);
				reply(plugin.hapi.error.badRequest("parse error", error));
				return;
			}

			payload.event = request.headers[EVENT_HEADER];
			plugin.plugins.outflux.point("github", payload);
			reply(null);
		},

		method : "POST",
		path   : "/github"
	});

	done();
};

exports.register.attributes = {
	name : "github"
};
