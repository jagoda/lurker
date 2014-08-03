"use strict";

exports.register = function (plugin, options, done) {

	plugin.route({
		method : "GET",
		path   : "/",

		handler : {
			proxy : {
				mapUri : function (request, done) {
					// FIXME: need a configurable cube.
					done(null, "http://localhost:1081/");
				}
			}
		}
	});

	done();
};

exports.register.attributes = {
	name : "cube"
};
