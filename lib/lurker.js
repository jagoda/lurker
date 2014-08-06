"use strict";

exports.register = function (plugin, options, done) {

	plugin.dependency("badge", function (plugin, done) {
		var organization = process.env.ORGANIZATION;

		plugin.auth.strategy("basic", "github-basic", {
			organization : organization,
			realm        : "GitHub: " + organization
		});

		plugin.route({
			method : "GET",
			path   : "/",

			config : {
				auth : "basic"
			},

			handler : {
				proxy : {
					host : "localhost",
					port : 1081
				}
			}
		});

		done();
	});

	done();
};

exports.register.attributes = {
	name : "lurker"
};
