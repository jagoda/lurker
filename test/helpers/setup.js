"use strict";
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var GitHub      = require("../../lib/github");
var Good        = require("good");
var mummy       = require("mummy");
var path        = require("path");
var sinon       = require("sinon");

var environment = new Environment();

before(function (done) {
	Browser.default.silent = true;
	// Set explicitly to simulate a real scenario.
	environment.set("GITHUB_SECRET", GitHub.DEFAULT_SECRET);

	// Squelch logging for the test run...
	sinon.stub(Good, "register").callsArg(2);

	mummy.extend(path.join(__dirname, "..", "..", "lib", "server.json"))
	.nodeify(done);
});

after(function () {
	environment.restore();
	Good.register.restore();
});
