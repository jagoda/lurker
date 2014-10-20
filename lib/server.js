"use strict";
var Configuration = require("./Configuration");
var Hapi          = require("hapi");
var Q             = require("q");

var configuration = new Configuration();

var server        = module.exports = new Hapi.Server(
	configuration.server.hostname(),
	configuration.server.port()
);

Q.ninvoke(
	server.pack,
	"register",
	[
		{
			plugin : require("badge")
		},
		{
			plugin : require("good")
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
