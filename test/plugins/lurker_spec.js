"use strict";
var Badge   = require("badge");
var Browser = require("zombie");
var expect  = require("chai").expect;
var Hapi    = require("hapi");
var Lurker  = require("../../lib/plugins/lurker");
var Mummy   = require("mummy");
var Q       = require("q");
var Sinon   = require("sinon");

describe("The Lurker plugin", function () {
	function expectPassword (log, present) {
		expect(
			log.calledWith(
				[ "warning", "lurker" ],
				Sinon.match(/cookie password/i)
			),
			"log"
		).to.equal(!present);
	}

	function expectSecurity (log, enabled) {
		expect(
			log.calledWith(
				[ "warning", "lurker" ],
				Sinon.match(/security is disabled/i)
			),
			"log"
		).to.equal(enabled);
	}

	function startServer (server, browser, options) {
		return Q.ninvoke(
			server.pack,
			"register",
			[
				{
					plugin : Badge
				},
				{
					plugin  : Lurker,
					options : options
				}
			]
		)
		.then(function () {
			Mummy.embalm(server, browser);
			return browser.visit("/");
		});
	}

	it("has a name", function () {
		expect(Lurker.register.attributes, "name")
		.to.have.property("name", "lurker");
	});

	describe("with a cookie password", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			startServer(
				server,
				browser,
				{
					password : "abetterpassword"
				}
			).finally(done);
		});

		it("does not log a warning message", function () {
			expectPassword(log, true);
		});
	});

	describe("without a cookie password", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			startServer(server, browser).finally(done);
		});

		it("logs a warning message", function () {
			expectPassword(log, false);
		});
	});

	describe("without a valid authentication configuration", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			startServer(server, browser).finally(done);
		});

		it("logs a warning message", function () {
			expectSecurity(log, true);
		});

		it("allows insecure requests", function () {
			expect(browser.statusCode, "status").to.equal(200);
		});
	});

	describe("with a valid authentication configuration", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			startServer(
				server,
				browser,
				{
					github : {
						organization : "octocats"
					}
				}
			)
			.finally(done);
		});

		it("does not log a warning message", function () {
			expectSecurity(log, false);
		});

		it("does not allow insecure requests", function () {
			expect(browser.statusCode, "status").to.equal(401);
		});
	});
});

describe("The Lurker status page", function () {
	var browser;

	before(function (done) {
		browser = new Browser();
		// Grafana likes to throw errors.
		browser.visit("/").finally(done);
	});

	it("shows the Grafana dashboard", function () {
		expect(browser.text("title"), "title").to.match(/grafana/i);
	});
});

describe("The Grafana configuration", function () {
	var settings;

	before(function (done) {
		var browser = new Browser();

		browser.http({
			method : "GET",
			url    : "/config.js"
		})
		.then(function (response) {
			/* jshint -W054 */
			var load   = new Function("define", response.payload);
			/* jshint +W054 */

			function define (deps, factory) {
				function Settings (options) {
					return options;
				}

				settings = factory(Settings);
			}

			load(define);
		})
		.nodeify(done);
	});

	it("use the Lurker InfluxDB as the default data store", function () {
		expect(settings.datasources, "lurker db")
		.to.have.property("lurker").that.deep.equals({
			default  : true,
			type     : "influxdb",
			url      : "http://localhost:8086/db/lurker",
			username : "lurker",
			password : "test"
		});
	});

	it("uses the Lurker InfluxDB as the Grafana DB", function () {
		expect(settings.datasources, "grafana db")
		.to.have.property("grafana").that.deep.equals({
			grafanaDB : true,
			type      : "influxdb",
			url       : "http://localhost:8086/db/grafana",
			username  : "lurker",
			password  : "test"
		});
	});
});
