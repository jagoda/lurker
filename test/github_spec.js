"use strict";
var Browser     = require("zombie");
var Crypto      = require("crypto");
var Environment = require("apparition").Environment;
var expect      = require("chai").expect;
var GitHub      = require("../lib/github");
var Hapi        = require("hapi");
var Nock        = require("nock");
var Sinon       = require("sinon");
var Util        = require("util");

describe("The github plugin", function () {
	before(function (done) {
		Nock.disableNetConnect();
		done();
	});

	after(function (done) {
		Nock.enableNetConnect();
		done();
	});

	it("has a name", function (done) {
		expect(GitHub.register.attributes, "plugin name")
		.to.have.property("name", "github");

		done();
	});

	describe("without a secret", function () {
		var consoleStub;
		var environment;

		before(function (done) {
			// Supress console output.
			consoleStub = Sinon.stub(console, "error");
			environment = new Environment();
			environment.delete("SECRET");
			done();
		});

		after(function (done) {
			consoleStub.restore();
			environment.restore();
			done();
		});

		it("fails to start", function (done) {
			var server = new Hapi.Server();

			server.pack.register(GitHub, function (error) {
				expect(error, "no error").to.be.an.instanceOf(Error);

				expect(error.message, "bad message")
				.to.match(/secret is required/i);

				done();
			});
		});
	});
});

describe("The /github webhook", function () {
	var DIGEST        = "sha1";
	var DIGEST_FORMAT = "hex";
	var SECRET;

	var browser;

	before(function (done) {
		SECRET = process.env.SECRET;

		Nock.disableNetConnect();
		browser = new Browser();
		done();
	});

	after(function (done) {
		Nock.enableNetConnect();
		done();
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

			it("responds with code 200", function (done) {
				expect(response.statusCode, "bad status").to.equal(200);
				done();
			});

			it("creates a new event", function (done) {
				expect(pointStub.callCount, "no event").to.equal(1);
				expect(
					pointStub.calledWith("github", Sinon.match.object),
					"payload"
				).to.be.true;

				done();
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

			it("responds with code 400", function (done) {
				expect(response.statusCode, "bad status").to.equal(400);
				done();
			});
		});
	});
});
