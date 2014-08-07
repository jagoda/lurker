"use strict";
var URL = require("url");

exports.register = function (plugin, options, done) {
	var CLIENT_ID     = process.env.CLIENT_ID;
	var CLIENT_SECRET = process.env.CLIENT_SECRET;
	var ORGANIZATION  = process.env.ORGANIZATION;

	function stripPath (request) {
		return request.path.substring(request.route.path.length);
	}

	plugin.dependency("badge", function (plugin, done) {
		plugin.auth.strategy("basic-token", "github-basic", {
			application : {
				clientId     : CLIENT_ID,
				clientSecret : CLIENT_SECRET,
				note         : "Lurker",
				scopes       : [],
				// FIXME: make this more meaningful..
				url          : "https://github.com/jagoda/lurker"
			},

			organization : ORGANIZATION,
			realm        : "GitHub: " + ORGANIZATION
		});

		plugin.auth.strategy("token", "github-token", {
			clientId     : CLIENT_ID,
			clientSecret : CLIENT_SECRET
		});

		plugin.route({
			method : "*",
			path   : "/collector",

			config : {
				auth : "token"
			},

			handler : {
				proxy : {
					mapUri : function (request, done) {
						var path = stripPath(request);
						// TODO: make cube URL configurable.
						done(null, URL.resolve("http://localhost:1080", path));
					}
				}
			}
		});

		plugin.route({
			method : "*",
			path   : "/evaluator",

			config : {
				auth : "token"
			},

			handler : {
				proxy : {
					mapUri : function (request, done) {
						var path = stripPath(request);
						// TODO: make cube URL configurable.
						done(null, URL.resolve("http://localhost:1081", path));
					}
				}
			}
		});

		plugin.route({
			method : "GET",
			path   : "/token",

			config : {
				auth : "basic-token"
			},

			handler : function (request, reply) {
				reply({ token : request.auth.artifacts.token });
			}
		});

		done();
	});

	done();
};

exports.register.attributes = {
	name : "cube"
};
