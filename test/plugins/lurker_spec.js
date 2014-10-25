"use strict";
var Bell    = require("bell");
var Browser = require("zombie");
var Cookie  = require("hapi-auth-cookie");
var expect  = require("chai").expect;
var Hapi    = require("hapi");
var Lurker  = require("../../lib/plugins/lurker");
var Mummy   = require("mummy");
var Q       = require("q");
var Sinon   = require("sinon");

// TODO: this should probably be something more real...
var CREDENTIALS = {};

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
					plugin : Bell
				},
				{
					plugin : Cookie
				},
				{
					plugin  : Lurker,
					options : options
				}
			]
		)
		.then(function () {
			Mummy.embalm(server, browser);
			return browser.visit("/index.html");
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

			startServer(
				server,
				browser,
				{
					github : {
						organization : "octocats"
					}
				}
			).finally(done);
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
						client : {
							id     : "clientId",
							secret : "clientSecret",
						},

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

describe("The Lurker landing page", function () {
	var GRAFANA_TITLE = /grafana/i;
	var LOGIN_TITLE   = /welcome/i;

	var browser;

	before(function () {
		browser = new Browser();
	});

	describe("before logging in", function () {
		before(function (done) {
			// Grafana likes to throw errors.
			browser.visit("/").finally(done);
		});

		it("does not show the Grafana dashboard", function () {
			expect(browser.text("title"), "title").not.to.match(GRAFANA_TITLE);
		});

		it("shows a public login prompt", function () {
			expect(browser.text("title"), "title").to.match(LOGIN_TITLE);
		});
	});

	describe("after logging in", function () {
		before(function (done) {
			browser.credentials.set(CREDENTIALS);
			// Grafana likes to throw errors.
			browser.visit("/").finally(done);
		});

		after(function () {
			browser.credentials.clear();
		});

		it("shows the Grafana dashboard", function () {
			expect(browser.text("title"), "title").to.match(GRAFANA_TITLE);
		});

		it("does not show a login prompt", function () {
			expect(browser.text("title"), "title").not.to.match(LOGIN_TITLE);
		});
	});
});

describe("The Lurker login page", function () {
	var SESSION_COOKIE = "sid";

	var browser;

	before(function () {
		browser = new Browser();
	});

	describe("before logging in", function () {
		var GITHUB_LOGIN = "https://github.com/login/oauth/authorize";

		function githubHandler (request, next) {
			if (0 === request.url.indexOf(GITHUB_LOGIN)) {
				next(null, {
					statusCode : 200
				});
			}
			else {
				next();
			}
		}

		before(function (done) {
			browser.resources.addHandler(githubHandler);
			browser.visit("/login").nodeify(done);
		});

		after(function () {
			var index = browser.resources.pipeline.indexOf(githubHandler);
			// Remove the GitHub handler.
			browser.resources.pipeline.splice(index, 1);
		});

		it("redirects to the GitHub login page", function () {
			expect(browser.redirected, "redirected").to.be.true;
			expect(browser.url, "URL").to.contain(GITHUB_LOGIN);
		});

		it("does not create the session cookie", function () {
			expect(browser.getCookie(SESSION_COOKIE), "cookie").to.be.null;
		});
	});

	describe("after logging in", function () {
		before(function (done) {
			browser.credentials.set(CREDENTIALS);
			// Grafana likes to throw errors.
			browser.visit("/login").finally(done);
		});

		after(function () {
			browser.credentials.clear();
			browser.deleteCookie(SESSION_COOKIE);
		});

		it("redirects to the Lurker landing page", function () {
			expect(browser.redirected, "redirected").to.be.true;
			expect(browser.url, "URL").to.contain(browser.site);
			expect(browser.url, "login").not.to.contain("/login");
		});

		it("creates the session cookie", function () {
			expect(browser.getCookie(SESSION_COOKIE), "cookie").not.to.be.null;
		});
	});
});

describe("The Grafana configuration", function () {
	var settings;

	before(function (done) {
		var browser = new Browser();

		browser.credentials.set(CREDENTIALS);

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
