"use strict";
var Browser = require("zombie");
var expect  = require("chai").expect;
var Lurker  = require("../lib/lurker");

describe("The lurker plugin", function () {
	it("has a name", function (done) {
		expect(Lurker.register.attributes, "name")
		.to.have.property("name", "lurker");

		done();
	});
});

describe("The lurker status page", function () {
	describe("when not authenticated", function () {
		var browser;

		before(function (done) {
			browser = new Browser();
			browser.visit("/").fin(done);
		});

		it("challenges the request", function () {
			expect(browser.statusCode, "status").to.equal(401);
		});
	});

	describe("when authenticated", function () {
		var browser;

		before(function (done) {
			browser = new Browser();

			browser.credentials.set({ username : "octocat" });
			// Grafana likes to throw errors...
			browser.visit("/").fin(done);
		});

		it("shows the Grafana dashboard", function () {
			expect(browser.text("title"), "title").to.match(/grafana/i);
		});
	});
});
