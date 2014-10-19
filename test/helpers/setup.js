"use strict";
var Browser     = require("zombie");
var Environment = require("apparition").Environment;
var Hapi        = require("hapi");
var GitHub      = require("../../lib/github");
var Good        = require("good");
var Mummy       = require("mummy");
var Sinon       = require("sinon");

var environment = new Environment();

before(function () {
	Browser.default.silent = true;

	// Badge requires a GitHub organization.
	environment.set("GITHUB_ORGANIZATION", "allthepeoples");
	// Set explicitly to simulate a real scenario.
	environment.set("GITHUB_SECRET", GitHub.DEFAULT_SECRET);
	// Outflux requires a URL value.
	environment.set(
		"INFLUXDB_URL",
		"https://example.com/db/test/series?u=foo&p=bar"
	);

	// Disable server start.
	Sinon.stub(Hapi.Server.prototype, "start");
	// Squelch logging for the test run...
	Sinon.stub(Good, "register").callsArg(2);

	Browser.extend(new Mummy(require("../../lib/server")));
});

after(function () {
	environment.restore();
	Good.register.restore();
	Hapi.Server.prototype.start.restore();
});
