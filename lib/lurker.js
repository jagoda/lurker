"use strict";

exports.register = function (plugin, options, done) {

	plugin.dependency("badge", function (plugin, done) {

		plugin.auth.strategy("basic", "github-basic", { realm : "GitHub" });

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
