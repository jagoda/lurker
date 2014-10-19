"use strict";
var Browser     = require("zombie");
var Good        = require("good");
var mummy       = require("mummy");
var path        = require("path");
var sinon       = require("sinon");

before(function (done) {
	Browser.default.silent = true;

	// Squelch logging for the test run...
	sinon.stub(Good, "register").callsArg(2);

	mummy.extend(path.join(__dirname, "..", "..", "lib", "server.json"))
	.nodeify(done);
});

after(function () {
	Good.register.restore();
});
