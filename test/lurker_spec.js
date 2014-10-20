"use strict";
var Badge   = require("badge");
var Browser = require("zombie");
var expect  = require("chai").expect;
var Hapi    = require("hapi");
var Lurker  = require("../lib/lurker");
var Mummy   = require("mummy");
var Q       = require("q");
var Sinon   = require("sinon");

describe("The lurker plugin", function () {
	it("has a name", function () {
		expect(Lurker.register.attributes, "name")
		.to.have.property("name", "lurker");
	});

	describe("without authentication configured", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			Q.ninvoke(
				server.pack,
				"register",
				[
					{
						plugin : Badge
					},
					{
						plugin  : Lurker,
						options : {
							github : {}
						}
					}
				]
			)
			.then(function () {
				Mummy.embalm(server, browser);
				return browser.visit("/");
			})
			.fail(function () {
				// Grafana likes to throw errors...
			})
			.nodeify(done);
		});

		it("logs a warning message", function () {
			expect(
				log.calledWith(
					[ "warning", "lurker" ],
					Sinon.match(/security/i)
				),
				"log"
			).to.be.true;
		});

		it("allows insecure requests", function () {
			expect(browser.statusCode, "status").to.equal(200);
		});
	});

	describe("with authentication configured", function () {
		var browser;
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			browser = new Browser();
			log     = Sinon.stub(server.pack, "log");

			Q.ninvoke(
				server.pack,
				"register",
				[
					{
						plugin : Badge
					},
					{
						plugin  : Lurker,
						options : {
							github : {
								organization : "octocats"
							}
						}
					}
				]
			)
			.then(function () {
				Mummy.embalm(server, browser);
				return browser.visit("/");
			})
			.fail(function () {
				// Grafana likes to throw errors...
			})
			.nodeify(done);
		});

		it("does not log a warning message", function () {
			expect(
				log.calledWith(
					[ "warning", "lurker" ],
					Sinon.match(/security/i)
				),
				"log"
			).to.be.false;
		});

		it("does not allow insecure requests", function () {
			expect(browser.statusCode, "status").to.equal(401);
		});
	});
});

describe("The lurker status page", function () {
	var browser;

	before(function (done) {
		browser = new Browser();
		// Grafana likes to throw errors.
		browser.visit("/").fin(done);
	});

	it("shows the Grafana dashboard", function () {
		expect(browser.text("title"), "title").to.match(/grafana/i);
	});
});
