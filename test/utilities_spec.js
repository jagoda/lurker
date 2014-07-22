"use strict";
var EventEmitter = require("events").EventEmitter;
var Lab          = require("lab");
var sinon        = require("sinon");
var utilities    = require("../lib/utilities");

var before   = Lab.before;
var describe = Lab.experiment;
var expect   = Lab.expect;
var it       = Lab.test;

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
});
