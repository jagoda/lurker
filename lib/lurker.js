"use strict";

exports.register = function (plugin, options, done) {

	plugin.dependency("badge", function (plugin, done) {
		var organization = process.env.ORGANIZATION;

		plugin.auth.strategy("basic", "github-basic", {
			organization : organization,
			realm        : "GitHub: " + organization
		});

		plugin.route({
			method : "*",
			// This is a 'catch-all' route. Any unmatched authenticated request
			// will be redirected to the Cube evaluator.
			path   : "/{p*}",

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
