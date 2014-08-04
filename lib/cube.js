"use strict";
var URL = require("url");

exports.register = function (plugin, options, done) {
	var CLIENT_ID     = process.env.CLIENT_ID;
	var CLIENT_SECRET = process.env.CLIENT_SECRET;

	plugin.dependency("badge", function (plugin, done) {
		plugin.auth.strategy("token", "github-token", "required", {
			clientId     : CLIENT_ID,
			clientSecret : CLIENT_SECRET
		});

		plugin.route({
			method : "*",
			path   : "/collector",

			handler : {
				proxy : {
					mapUri : function (request, done) {
						var path = request.path.substring(
							request.route.path.length
						);
						// TODO: make cube URL configurable.
						done(null, URL.resolve("http://localhost:1080", path));
					}
				}
			}
		});

		done();
	});

	done();
};

exports.register.attributes = {
	name : "cube"
};
