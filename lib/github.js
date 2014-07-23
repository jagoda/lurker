"use strict";
var crypto = require("crypto");
var Nipple = require("nipple");
var Q      = require("q");
var util   = require("util");

var DIGEST           = "sha1";
var DIGEST_FORMAT    = "hex";
var EVENT_HEADER     = "x-github-event";
var ID_HEADER        = "x-github-delivery";
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

	plugin.dependency("utilities", function (plugin, done) {
		log = plugin.plugins.utilities.logger(plugin, [ "github" ]);
		done();
	});

	plugin.route({
		config : {
			payload : {
				output : "data",
				parse  : false
			},

			validate : {
				headers : validateSignature
			}
		},

		handler : function (request, reply) {
			var event   = request.headers[EVENT_HEADER];
			var id      = request.headers[ID_HEADER];
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

			Q.ninvoke(
				Nipple, "post",
				// FIXME: should externalize the cube config.
				"http://localhost:1080/1.0/event/put",
				{
					payload : JSON.stringify([
						{
							data : payload,
							id   : id,
							type : event
						}
					])
				}
			)
			.spread(function (response, payload) {
				if (response.statusCode !== 200) {
					log.error("cube request failed: %s", payload);
					reply(plugin.hapi.error.internal("cube request failed"));
					return;
				}

				reply();
			})
			.fail(function (error) {
				log.error("unexpected error: %s", error.message);
				reply(plugin.hapi.error.internal("unexpected error", error));
			})
			.done();
		},

		method  : "POST",
		path    : "/github"
	});

	done();
};

exports.register.attributes = {
	name    : "github",
	version : "0.0.0"
};
