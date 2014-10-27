"use strict";
var Configuration = require("./Configuration");
var Hapi          = require("hapi");
var Q             = require("q");

var configuration = new Configuration();

var server        = module.exports = new Hapi.Server(
	configuration.server.hostname(),
	configuration.server.port(),
	{
		location : configuration.server.url()
	}
);

Q.ninvoke(
	server.pack,
	"register",
	[
		{
			plugin : require("bell")
		},
		{
			plugin : require("good")
		},
		{
			plugin : require("hapi-auth-cookie")
		},
		{
			plugin  : require("outflux"),
			options : {
				url : configuration.database.url()
			}
		},
		{
			plugin  : require("./plugins/github"),
			options : {
				secret : configuration.github.secret()
			}
		},
		{
			plugin  : require("./plugins/lurker"),
			options : {
				github : {
					client : {
						id     : configuration.github.client.id(),
						secret : configuration.github.client.secret()
					},

					organization : configuration.github.organization()
				}
			}
		}
	]
)
.then(function () {
	server.start();
})
.done();
