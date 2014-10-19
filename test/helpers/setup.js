"use strict";
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var Good        = require("good");
var mummy       = require("mummy");
var path        = require("path");
var sinon       = require("sinon");

var environment = new Environment();

before(function (done) {
	environment.set("CLIENT_ID", "aclientid");
	environment.set("CLIENT_SECRET", "aclientsecret");
	environment.set("ORGANIZATION", "octocats");
	environment.set("SECRET", "asecret");
	Browser.default.silent = true;

	// Squelch logging for the test run...
	sinon.stub(Good, "register").callsArg(2);

	mummy.extend(path.join(__dirname, "..", "..", "lib", "server.json"))
	.nodeify(done);
});

after(function (done) {
	Good.register.restore();
	environment.restore();
	done();
});
