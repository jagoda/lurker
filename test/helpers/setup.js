"use strict";
var Browser     = require("zombie");
var Environment = require("./Environment");
var Lab         = require("lab");
var mummy       = require("mummy");
var path        = require("path");

var before = Lab.before;

before(function (done) {
	var environment = new Environment();

	environment.set("SECRET", "asecret");
	Browser.default.silent = true;
	mummy.extend(path.join(__dirname, "..", "..", "lib", "server.json"))
	.nodeify(done);
});
