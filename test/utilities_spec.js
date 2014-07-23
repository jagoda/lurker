"use strict";
var EventEmitter = require("events").EventEmitter;
var Hapi         = require("hapi");
var Lab          = require("lab");
var Q            = require("q");
var sinon        = require("sinon");
var utilities    = require("../lib/utilities");

var before    = Lab.before;
var describe  = Lab.experiment;
var expect    = Lab.expect;
var it        = Lab.test;

describe("The utilities plugin", function () {

	it("has a name", function (done) {
		expect(utilities.register.attributes, "plugin name")
		.to.have.property("name", "utilities");

		done();
	});

	it("has a version", function (done) {
		expect(utilities.register.attributes, "plugin version")
		.to.have.property("version");

		done();
	});

	describe("on pack startup", function () {
		var loggedAfter;
		var loggedBefore;
		var logSpy;

		before(function (done) {
			var events = new EventEmitter();

			logSpy = sinon.spy();
			utilities.register(
				{
					events : events,
					expose : sinon.spy(),
					log    : logSpy,
					servers : [
						{
							info : { uri : "http://example.com:12345" }
						},
						{
							info : { uri : "http://example.com:54321" }
						}
					]
				},
				{},
				function () {
					loggedBefore = logSpy.callCount;
					events.emit("start");
					loggedAfter = logSpy.callCount;
					done();
				}
			);
		});

		it("logs the server start event", function (done) {
			expect(loggedBefore, "logged before start").to.equal(0);
			expect(loggedAfter, "failed to log").to.equal(2);

			done();
		});

		it("logs the server port for each server in the pack", function (done) {
			expect(logSpy.firstCall.args[1], "first server port")
			.to.match(/http:\/\/example.com:12345/);

			expect(logSpy.secondCall.args[1], "second server port")
			.to.match(/http:\/\/example.com:54321/);

			done();
		});
	});

	describe("creating a logger with tags", function () {
		var log;
		var logger;

		before(function (done) {
			var server = new Hapi.Server();
			var module;

			Q.ninvoke(server.pack, "register", utilities)
			.then(function () {
				log    = sinon.spy();
				module = { log : log };
				logger = server.plugins.utilities.logger(module, [ "atag" ]);

				logger.info("%s: %s", "test", "message");
				logger.warn("%s -> %s", "foo", "bar");
				logger.error("%d + %d = %d", 1, 2, 3);
			})
			.nodeify(done);
		});

		it("can create formatted 'info' messages", function (done) {
			expect(log.firstCall.args[0], "tags")
			.to.deep.equal([ "info", "atag" ]);

			expect(log.firstCall.args[1], "message")
			.to.equal("test: message");

			done();
		});

		it("can create formatted 'warn' messages", function (done) {
			expect(log.secondCall.args[0], "tags")
			.to.deep.equal([ "warn", "atag" ]);

			expect(log.secondCall.args[1], "message")
			.to.equal("foo -> bar");

			done();
		});

		it("can create formatted 'error' messages", function (done) {
			expect(log.thirdCall.args[0], "tags")
			.to.deep.equal([ "error", "atag" ]);

			expect(log.thirdCall.args[1], "message")
			.to.equal("1 + 2 = 3");

			done();
		});
	});

	describe("creating a logger with no tags", function () {
		var log;
		var logger;

		before(function (done) {
			var server = new Hapi.Server();
			var module;

			Q.ninvoke(server.pack, "register", utilities)
			.then(function () {
				log    = sinon.spy();
				module = { log : log };
				logger = server.plugins.utilities.logger(module);

				logger.info("%s: %s", "test", "message");
				logger.warn("%s -> %s", "foo", "bar");
				logger.error("%d + %d = %d", 1, 2, 3);
			})
			.nodeify(done);
		});

		it("can create formatted 'info' messages", function (done) {
			expect(log.firstCall.args[0], "tags")
			.to.deep.equal([ "info" ]);

			expect(log.firstCall.args[1], "message")
			.to.equal("test: message");

			done();
		});

		it("can create formatted 'warn' messages", function (done) {
			expect(log.secondCall.args[0], "tags")
			.to.deep.equal([ "warn" ]);

			expect(log.secondCall.args[1], "message")
			.to.equal("foo -> bar");

			done();
		});

		it("can create formatted 'error' messages", function (done) {
			expect(log.thirdCall.args[0], "tags")
			.to.deep.equal([ "error" ]);

			expect(log.thirdCall.args[1], "message")
			.to.equal("1 + 2 = 3");

			done();
		});
	});
});
