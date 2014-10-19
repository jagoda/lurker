"use strict";
var Browser     = require("zombie");
var Crypto      = require("crypto");
var expect      = require("chai").expect;
var GitHub      = require("../lib/github");
var Hapi        = require("hapi");
var Nock        = require("nock");
var Sinon       = require("sinon");
var Util        = require("util");

describe("The github plugin", function () {
	before(function () {
		Nock.disableNetConnect();
	});

	after(function () {
		Nock.enableNetConnect();
	});

	it("has a name", function () {
		expect(GitHub.register.attributes, "plugin name")
		.to.have.property("name", "github");
	});

	it("has a default secret", function () {
		expect(GitHub, "secret")
		.to.have.property("DEFAULT_SECRET", "lurkersecret");
	});

	describe("without a secret", function () {
		var log;

		before(function (done) {
			var server = new Hapi.Server();

			log = Sinon.stub(server.pack, "log");
			server.pack.register(GitHub, {}, done);
		});

		after(function () {
			log.restore();
		});

		it("logs a warning message", function () {
			expect(log.callCount, "log").to.equal(1);
			expect(log.firstCall.args[0], "tags").to.include("warning");

			expect(log.firstCall.args[1], "message")
			.to.match(/default secret/i);
		});
	});
});

describe("The /github webhook", function () {
	var DIGEST        = "sha1";
	var DIGEST_FORMAT = "hex";
	var SECRET        = GitHub.DEFAULT_SECRET;

	var browser;

	before(function () {
		Nock.disableNetConnect();
		browser = new Browser();
	});

	after(function () {
		Nock.enableNetConnect();
	});

	describe("receiving a github event", function () {
		function badChecksum (response) {
			expect(response.statusCode, "bad status")
			.to.equal(400);

			expect(response.payload, "bad message")
			.to.match(/checksum/i);
		}

		function githubEvent (headers, payload) {
			return browser.http(
				{
					headers : headers,
					method  : "POST",
					payload : payload,
					url     : "/github"
				}
			);
		}

		function sign (payload) {
			var hmac = Crypto.createHmac(DIGEST, SECRET);

			hmac.update(payload);
			return Util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));
		}

		describe("with an invalid signature", function () {
			it("generates an error", function (done) {
				githubEvent(
					{
						"X-Hub-Signature" : "sha1=foo"
					},
					JSON.stringify({ foo : "bar" })
				)
				.then(badChecksum)
				.nodeify(done);
			});
		});

		describe("without a signature", function () {
			it("generates an error", function (done) {
				githubEvent(
					{},
					JSON.stringify({ foo : "bar" })
				)
				.then(badChecksum)
				.nodeify(done);
			});
		});

		describe("with a valid signature", function () {
			var pointStub;
			var response;

			before(function (done) {
				var payload = JSON.stringify({ action : "opened" });

				pointStub = Sinon.stub(browser.pack.plugins.outflux, "point");

				githubEvent(
					{
						"X-GitHub-Delivery" : "auniqueid",
						"X-GitHub-Event"    : "pull_request",
						"X-Hub-Signature"   : sign(payload)
					},
					payload
				)
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			it("responds with code 200", function () {
				expect(response.statusCode, "bad status").to.equal(200);
			});

			it("creates a new event", function () {
				expect(pointStub.callCount, "no event").to.equal(1);
				expect(
					pointStub.calledWith("github", Sinon.match.object),
					"payload"
				).to.be.true;
			});
		});

		describe("failing to parse the incoming payload", function () {
			var response;

			before(function (done) {
				var payload = "foo";

				githubEvent(
					{
						"X-GitHub-Event"  : "push",
						"X-Hub-Signature" : sign(payload)
					},
					payload
				)
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			it("responds with code 400", function () {
				expect(response.statusCode, "bad status").to.equal(400);
			});
		});
	});
});
