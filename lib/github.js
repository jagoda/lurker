"use strict";
var crypto = require("crypto");
var Nipple = require("nipple");
var Q      = require("q");
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
			var payload = JSON.parse(request.payload);
			var event   = request.headers["x-github-event"];

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
