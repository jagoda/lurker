"use strict";
var crypto = require("crypto");
var Hapi   = require("hapi");
var hooks  = require("../lib/hooks");
var Lab    = require("lab");
var nock   = require("nock");
var util   = require("util");

var after    = Lab.after;
var before   = Lab.before;
var describe = Lab.describe;
var expect   = Lab.expect;
var it       = Lab.test;

describe("The hooks plugin", function () {
	var DIGEST        = "sha1";
	var DIGEST_FORMAT = "hex";
	var SECRET        = "a secret";
	var server;

	before(function (done) {
		// Copy the plugin object so that configuration isn't propagated to
		// other places.
		var plugin = Object.create(hooks);

		nock.disableNetConnect();
		plugin.options = { secret : SECRET };

		server = new Hapi.Server("localhost", 0);
		server.pack.register(plugin, done);
	});

	after(function (done) {
		nock.enableNetConnect();
		done();
	});

	it("has a name", function (done) {
		expect(hooks.register.attributes, "plugin name")
		.to.have.property("name", "hooks");

		done();
	});

	it("has a version", function (done) {
		expect(hooks.register.attributes, "plugin version")
		.to.have.property("version");

		done();
	});

	it("requires a secret", function (done) {
		var server = new Hapi.Server("localhost", 0);

		server.pack.register(hooks, function (error) {
			expect(error, "no error").to.be.an.instanceOf(Error);

			expect(error.message, "bad message")
			.to.match(/secret is required/i);

			done();
		});
	});

	describe("receiving a github event", function () {
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

		describe("with an invalid signature", function () {
			it("generates an error", function (done) {
				githubEvent(
					{
						"x-hub-signature" : "sha1=foo"
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
			var response;

			function sign (payload) {
				var hmac = crypto.createHmac(DIGEST, SECRET);

				hmac.update(payload);
				return util.format("%s=%s", DIGEST, hmac.digest(DIGEST_FORMAT));
			}

			before(function (done) {
				var payload = JSON.stringify({ action : "opened" });

				githubEvent(
					{
						"x-hub-signature" : sign(payload)
					},
					payload,
					function (result) {
						response = result;
						done();
					}
				);
			});

			it("responds with code 200", function (done) {
				expect(response.statusCode, "bad status").to.equal(200);
				done();
			});
		});
	});
});
