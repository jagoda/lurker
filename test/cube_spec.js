"use strict";
var Browser = require("zombie");
var cube    = require("../lib/cube");
var Lab     = require("lab");
var nock    = require("nock");

var after    = Lab.after;
var before   = Lab.before;
var describe = Lab.describe;
var expect   = Lab.expect;
var it       = Lab.it;

describe("The cube plugin", function () {

	it("has a name", function (done) {
		expect(cube.register.attributes, "name")
		.to.have.property("name", "cube");

		done();
	});
});

describe("The cube pass-through API", function () {

	before(function (done) {
		nock.disableNetConnect();
		done();
	});

	after(function (done) {
		nock.enableNetConnect();
		done();
	});

	describe("/status", function () {
		var browser;
		var cubeRequest;

		before(function (done) {
			cubeRequest = nock("http://localhost:1081")
			.get("/")
			.reply(200, "cube page");

			browser = new Browser();
			browser.visit("/status").nodeify(done);
		});

		after(function (done) {
			nock.cleanAll();
			done();
		});

		it("proxies the request to the cube server", function (done) {
			expect(cubeRequest.isDone(), "cube request").to.be.true;
			done();
		});

		it("is the cube default evaluator", function (done) {
			expect(browser.text("body"), "page").to.equal("cube page");
			done();
		});
	});
});
