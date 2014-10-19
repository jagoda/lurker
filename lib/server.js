"use strict";
var Hapi = require("hapi");
var Q    = require("q");

var server = module.exports = new Hapi.Server(undefined, process.env.PORT);

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
				url : process.env.INFLUXDB_URL
			}
		},
		{
			plugin  : require("./github"),
			options : {
				secret : process.env.GITHUB_SECRET
			}
		},
		{
			plugin  : require("./lurker"),
			options : {
				github : {
					organization : process.env.GITHUB_ORGANIZATION
				}
			}
		}
	]
)
.then(function () {
	server.start();
})
.done();
