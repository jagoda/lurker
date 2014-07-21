"use strict";
var Hapi  = require("hapi");
var hooks = require("../lib/hooks");
var Lab   = require("lab");

var before   = Lab.before;
var describe = Lab.describe;
var expect   = Lab.expect;
var it       = Lab.test;

describe("The hooks plugin", function () {
	var server;

	before(function (done) {
		// Copy the plugin object so that configuration isn't propagated to
		// other places.
		var plugin = Object.create(hooks);

		plugin.options = { secret : "a secret" };

		server = new Hapi.Server("localhost", 0);
		server.pack.register(plugin, done);
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

	describe("verifying a request", function () {
		var headers = {
			"x-hub-signature" : "sha1=9026f1a961b14cef5f4f6f5b222aefd09f16bcca"
		};

		describe("with a correct signature", function () {
			it("passes control to the next handler", function (done) {
				server.methods.verify(
					new Buffer("hello world"),
					headers,
					function (error) {
						expect(error, "failed to verify").not.to.exist;
						done();
					}
				);
			});
		});

		describe("with an incorrect signature", function () {
			it("generates an error", function (done) {
				server.methods.verify(
					new Buffer("different message"),
					headers,
					function (error) {
						expect(error, "no error").to.be.an.instanceOf(Error);

						expect(error.message, "bad message")
						.to.match(/checksum/);

						expect(error.output.statusCode, "bad status")
						.to.equal(400);

						done();
					}
				);
			});
		});

		describe("without a signature", function () {
			it("generates an error", function (done) {
				server.methods.verify(
					new Buffer("different message"),
					{},
					function (error) {
						expect(error, "no error").to.be.an.instanceOf(Error);

						expect(error.message, "bad message")
						.to.match(/checksum/);

						expect(error.output.statusCode, "bad status")
						.to.equal(400);

						done();
					}
				);
			});
		});
	});

	it("provides a /github endpoint", function (done) {
		var request = {
			method : "POST",
			url    : "/github"
		};

		server.inject(request, function (response) {
			expect(response.statusCode, "status code").not.to.equal(404);
			done();
		});
	});
});
