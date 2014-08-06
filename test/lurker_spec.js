"use strict";
var Browser = require("zombie");
var Lab     = require("lab");
var lurker  = require("../lib/lurker");
var nock    = require("nock");

var after    = Lab.after;
var before   = Lab.before;
var describe = Lab.describe;
var expect   = Lab.expect;
var it       = Lab.it;

describe("The lurker plugin", function () {

	it("has a name", function (done) {
		expect(lurker.register.attributes, "name")
		.to.have.property("name", "lurker");

		done();
	});
});

describe("The lurker status page", function () {
	var GITHUB_API = "https://api.github.com";
	var USERNAME   = "octocat";

	function cubeRequest () {
		return nock("http://localhost:1081")
		.get("/")
		.reply(200, "cube evaluator");
	}

	function orgRequest () {
		return nock(GITHUB_API)
		.get("/orgs/" + process.env.ORGANIZATION + "/members/" + USERNAME)
		.reply(204);
	}

	function userRequest () {
		return nock(GITHUB_API)
		.get("/user")
		.reply(200, { login : USERNAME });
	}

	before(function (done) {
		nock.disableNetConnect();
		done();
	});

	after(function (done) {
		nock.enableNetConnect();
		done();
	});

	describe("when authenticated", function () {
		var browser;
		var cubeNock;
		var orgNock;
		var userNock;

		before(function (done) {
			browser  = new Browser();
			cubeNock = cubeRequest();
			orgNock  = orgRequest();
			userNock = userRequest();

			browser.authenticate().basic(USERNAME, "password");
			browser.visit("/").nodeify(done);
		});

		after(function (done) {
			nock.cleanAll();
			done();
		});

		it("authenticates the user with GitHub", function (done) {
			expect(userNock.isDone(), "user request").to.be.true;
			expect(orgNock.isDone(), "org request").to.be.true;
			done();
		});

		it("forwards the request to the cube evaluator", function (done) {
			expect(cubeNock.isDone(), "cube request").to.be.true;
			expect(browser.text("body"), "response").to.equal("cube evaluator");
			done();
		});
	});

	describe("when not authenticated", function () {
		var browser;
		var cubeNock;

		before(function (done) {
			browser  = new Browser();
			cubeNock = cubeRequest();

			browser.visit("/", function () {
				done();
			});
		});

		after(function (done) {
			nock.cleanAll();
			done();
		});

		it("does not forward the request", function (done) {
			expect(cubeNock.isDone(), "cube request").to.be.false;
			done();
		});

		it("rejects the request", function (done) {
			expect(browser.statusCode, "status").to.equal(401);
			done();
		});
	});
});
