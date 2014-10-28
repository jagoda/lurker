"use strict";
var Bell          = require("bell");
var Browser       = require("zombie");
var Configuration = require("../../lib/Configuration");
var Cookie        = require("hapi-auth-cookie");
var expect        = require("chai").expect;
var Hapi          = require("hapi");
var Lurker        = require("../../lib/plugins/lurker");
var Mummy         = require("mummy");
var Nock          = require("nock");
var Q             = require("q");
var Sinon         = require("sinon");
var URL           = require("url");

// TODO: this should probably be something more real...
var CREDENTIALS = {};

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
			this.timeout(5000);
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

	describe("before logging in", function () {
		var BASE_URL     = "http://example.com";
		var GITHUB_LOGIN = "https://github.com/login/oauth/authorize";

		var browser;

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
			var configuration = new Configuration();

			var server = new Hapi.Server(
				null,
				null,
				{
					location : BASE_URL
				}
			);

			browser = new Browser();
			browser.resources.addHandler(githubHandler);
			browser.credentials.set(CREDENTIALS);

			startServer(
				server,
				browser,
				{
					github : {
						client : {
							id     : configuration.github.client.id(),
							secret : configuration.github.client.secret()
						},

						organization : configuration.github.organization()
					}
				}
			)
			// Grafana likes to thro errors...
			.fail(function () {
				browser.credentials.clear();
				return browser.visit("/login");
			})
			.nodeify(done);
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

		it("uses the base URL to compute the redirect URI", function () {
			var url         = URL.parse(browser.url, true);
			/* jshint -W106 */
			var redirectUrl = url.query.redirect_uri;
			/* jshint +W106 */

			expect(redirectUrl, "url").to.contain(BASE_URL);
		});

		it("does not create the session cookie", function () {
			expect(browser.getCookie(SESSION_COOKIE), "cookie").to.be.null;
		});
	});

	describe("after logging in", function () {
		var TOKEN    = "atoken";
		var USERNAME = "testy";

		var AUTHORIZATION = "Basic " + (new Buffer(TOKEN + ":x-oauth-basic"))
			.toString("base64");

		var CREDENTIALS = {
			profile : {
				username : USERNAME
			},

			token : TOKEN
		};

		var orgPath;

		function expectLandingPage (browser) {
			expect(browser.redirected, "redirected").to.be.true;
			expect(browser.url, "URL").to.contain(browser.site);
			expect(browser.url, "login").not.to.contain("/login");
		}

		function expectWarning (log, isExpected) {
			expect(
				log.calledWith(
					[ "warning", "lurker" ],
					Sinon.match(/organization/i)
				),
				"log"
			).to.equal(isExpected);
		}

		function getOrg () {
			return new Nock("https://api.github.com")
			.matchHeader("Authorization", AUTHORIZATION)
			.get(orgPath);
		}

		before(function () {
			var configuration = new Configuration();
			orgPath = "/orgs/" + configuration.github.organization() +
				"/members/" + USERNAME;
		});

		describe("with the correct organization", function () {
			var browser;
			var log;
			var orgRequest;

			before(function (done) {
				browser = new Browser();

				log = Sinon.stub(browser.pack, "log");

				orgRequest = getOrg().reply(204);

				browser.credentials.set(CREDENTIALS);
				// Grafana likes to throw errors.
				browser.visit("/login").finally(done);
			});

			after(function () {
				browser.credentials.clear();
				browser.deleteCookie(SESSION_COOKIE);
				log.restore();
				Nock.cleanAll();
			});

			it("checks organization membership", function () {
				orgRequest.done();
			});

			it("redirects to the Lurker landing page", function () {
				expectLandingPage(browser);
			});

			it("creates the session cookie", function () {
				expect(browser.getCookie(SESSION_COOKIE), "cookie")
				.not.to.be.null;
			});

			it("does not log a warning", function () {
				expectWarning(log, false);
			});
		});

		describe("with an incorrect organization", function () {
			var browser;
			var log;
			var orgRequest;

			before(function (done) {
				browser = new Browser();

				log = Sinon.stub(browser.pack, "log");

				orgRequest = getOrg().reply(404);

				browser.credentials.set(CREDENTIALS);
				// Grafana likes to throw errors.
				browser.visit("/login").finally(done);
			});

			after(function () {
				browser.credentials.clear();
				browser.deleteCookie(SESSION_COOKIE);
				log.restore();
				Nock.cleanAll();
			});

			it("checks organization membership", function () {
				orgRequest.done();
			});

			it("redirects to the Lurker landing page", function () {
				expectLandingPage(browser);
			});

			it("does not create the session cookie", function () {
				expect(browser.getCookie(SESSION_COOKIE), "cookie").to.be.null;
			});

			it("logs a warning", function () {
				expectWarning(log, true);
			});
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
