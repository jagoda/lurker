"use strict";
var expect    = require("chai").expect;
var Hapi      = require("hapi");
var metrics   = require("../lib/metrics");
var Nipple    = require("nipple");
var nock      = require("nock");
var Q         = require("q");
var sinon     = require("sinon");
var utilities = require("../lib/utilities");

describe("The metrics plugin", function () {

	it("has a name", function (done) {
		expect(metrics.register.attributes, "no name")
		.to.have.property("name", "metrics");

		done();
	});

	describe("creating a new event", function () {
		var server;

		before(function (done) {
			nock.disableNetConnect();
			server = new Hapi.Server("localhost", 0);

			Q.all([
				Q.ninvoke(server.pack, "register", utilities),
				Q.ninvoke(server.pack, "register", metrics)
			])
			.then(function () {
				// Start the server to complete plugin lodaing.
				return Q.ninvoke(server, "start");
			})
			.nodeify(done);
		});

		after(function (done) {
			nock.enableNetConnect();
			Q.ninvoke(server, "stop").nodeify(done);
		});

		describe("without error", function () {
			var cubeRequest;
			var failure;

			before(function (done) {
				cubeRequest  = nock("http://localhost:1080")
				.post(
					"/1.0/event/put",
					[
						{
							type : "event",
							id   : "id",
							data : {
								payload : "data"
							}
						}
					]
				)
				.reply(200, {});

				server.methods.createEvent(
					{
						type : "event",
						id   : "id",
						data : {
							payload : "data"
						}
					},
					function (error) {
						failure = error;
						done();
					}
				);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("returns successfully", function (done) {
				expect(cubeRequest.isDone(), "no cube request").to.be.true;
				expect(failure, "failed").not.to.exist;
				done();
			});
		});

		describe("encountering a request error", function () {
			var cubeRequest;
			var failure;

			before(function (done) {
				cubeRequest = nock("http://localhost:1080")
				.post("/1.0/event/put")
				.reply(500, "boom!");

				server.methods.createEvent({}, function (error) {
					failure = error;
					done();
				});
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("returns an error", function (done) {
				expect(failure, "no error").to.be.an.instanceOf(Error);

				expect(failure.message, "error message")
				.to.match(/request failed/i);

				done();
			});
		});

		describe("encountering a connection error", function () {
			var failure;
			var postStub;

			before(function (done) {
				postStub = sinon.stub(
					Nipple, "post",
					function (uri, options, callback) {
						callback(new Error("boom!"));
					}
				);

				server.methods.createEvent({}, function (error) {
					failure = error;
					done();
				});
			});

			after(function (done) {
				postStub.restore();
				done();
			});

			it("returns an error", function (done) {
				expect(failure, "no error").to.be.an.instanceOf(Error);
				expect(failure.message).to.match(/boom!/i);

				done();
			});
		});
	});
});
