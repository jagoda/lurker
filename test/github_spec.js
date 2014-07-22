"use strict";
var crypto      = require("crypto");
var Environment = require("./helpers/Environment");
var github      = require("../lib/github");
var Hapi        = require("hapi");
var Lab         = require("lab");
var nock        = require("nock");
var util        = require("util");

var after    = Lab.after;
var before   = Lab.before;
var describe = Lab.describe;
var expect   = Lab.expect;
var it       = Lab.test;

describe("The github plugin", function () {
	var DIGEST        = "sha1";
	var DIGEST_FORMAT = "hex";
	var SECRET        = "a secret";

	var environment;
	var server;

	before(function (done) {
		// Copy the plugin object so that configuration isn't propagated to
		// other places.
		var plugin = Object.create(github);

		environment = new Environment();
		environment.set("SECRET", SECRET);
		nock.disableNetConnect();

		server = new Hapi.Server("localhost", 0);
		server.pack.register(plugin, done);
	});

	after(function (done) {
		environment.restore();
		nock.enableNetConnect();
		done();
	});

	it("has a name", function (done) {
		expect(github.register.attributes, "plugin name")
		.to.have.property("name", "github");

		done();
	});

	it("has a version", function (done) {
		expect(github.register.attributes, "plugin version")
		.to.have.property("version");

		done();
	});

	describe("without a secret", function () {
		var environment;

		before(function (done) {
			environment = new Environment();
			environment.set("SECRET");
			done();
		});

		after(function (done) {
			environment.restore();
			done();
		});

		it("fails to start", function (done) {
			var server = new Hapi.Server("localhost", 0);

			server.pack.register(github, function (error) {
				expect(error, "no error").to.be.an.instanceOf(Error);

				expect(error.message, "bad message")
				.to.match(/secret is required/i);

				done();
			});
		});
	});

	describe("receiving a github event", function () {
		var CUBE_BASE      = "http://localhost:1080";
		var EVENT_ENDPOINT = "/1.0/event/put";

		function badChecksum (done, response) {
			expect(response.statusCode, "bad status")
			.to.equal(400);

			expect(response.payload, "bad message")
			.to.match(/checksum/i);

			done();
		}

		function githubEvent (headers, payload, done) {
			server.inject(
				{
					headers : headers,
					method  : "POST",
					payload : payload,
					url     : "/github"
				},
				done
			);
		}

		function sign (payload) {
			var hmac = crypto.createHmac(DIGEST, SECRET);

			hmac.update(payload);
			return util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));
		}

		describe("with an invalid signature", function () {
			it("generates an error", function (done) {
				githubEvent(
					{
						"X-Hub-Signature" : "sha1=foo"
					},
					JSON.stringify({ foo : "bar" }),
					badChecksum.bind(null, done)
				);
			});
		});

		describe("without a signature", function () {
			it("generates an error", function (done) {
				githubEvent(
					{},
					JSON.stringify({ foo : "bar" }),
					badChecksum.bind(null, done)
				);
			});
		});

		describe("with a valid signature", function () {
			var cubeRequest;
			var response;

			before(function (done) {
				var payload = JSON.stringify({ action : "opened" });

				cubeRequest = nock(CUBE_BASE)
				.post(
					EVENT_ENDPOINT,
					{
						data : {
							action : "opened"
						},

						type : "pull_request"
					}
				)
				.reply(200);

				githubEvent(
					{
						"X-GitHub-Event"  : "pull_request",
						"X-Hub-Signature" : sign(payload)
					},
					payload,
					function (result) {
						response = result;
						done();
					}
				);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("responds with code 200", function (done) {
				expect(response.statusCode, "bad status").to.equal(200);
				done();
			});

			it("creates a new cube event", function (done) {
				expect(cubeRequest.isDone(), "no cube request").to.be.true;

				done();
			});
		});

		describe("failing to create a cube event", function () {
			var cubeRequest;
			var response;

			before(function (done) {
				var payload = JSON.stringify({ head : "foo" });

				cubeRequest = nock(CUBE_BASE)
				.post(EVENT_ENDPOINT)
				.reply(503);

				githubEvent(
					{
						"X-GitHub-Event"  : "push",
						"X-Hub-Signature" : sign(payload)
					},
					payload,
					function (result) {
						response = result;
						done();
					}
				);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("responds with code 500", function (done) {
				expect(cubeRequest.isDone(), "no cube request").to.be.true;
				expect(response.statusCode, "bad status").to.equal(500);

				done();
			});
		});
	});
});