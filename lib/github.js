"use strict";
var crypto = require("crypto");
var Nipple = require("nipple");
var Q      = require("q");
var util   = require("util");

var DIGEST           = "sha1";
var DIGEST_FORMAT    = "hex";
var EVENT_HEADER     = "x-github-event";
var SIGNATURE_HEADER = "x-hub-signature";

var LOG_TAGS = [ "github" ];

exports.register = function (plugin, options, done) {
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
			done(plugin.hapi.error.badRequest("checksum failure"));
			return;
		}
	}

	// Validate plugin options.
	if (!secret) {
		plugin.log(
			[ "error" ].concat(LOG_TAGS),
			"No GitHub secret found. Please set the SECRET environment " +
			"variable."
		);

		done(new Error("a secret is required"));
		return;
	}

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
			var payload = JSON.parse(request.payload);
			var event   = request.headers[EVENT_HEADER];

			Q.ninvoke(
				Nipple, "post",
				// FIXME: should externalize the cube config.
				"http://localhost:1080/1.0/event/put",
				{
					payload : JSON.stringify({
						data : payload,
						type : event
					})
				}
			)
			.spread(function (response) {
				if (response.statusCode !== 200) {
					reply(plugin.hapi.error.internal("cube request failed"));
					return;
				}

				reply();
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
