"use strict";
var Browser = require("zombie");
var cube    = require("../lib/cube");
var expect  = require("chai").expect;
var nock    = require("nock");

describe("The cube plugin", function () {

	it("has a name", function (done) {
		expect(cube.register.attributes, "name")
		.to.have.property("name", "cube");

		done();
	});
});

describe("The cube pass-through API", function () {
	var TOKEN         = "atoken";
	var AUTHORIZATION = "token " + TOKEN;
	var GITHUB_API    = "https://api.github.com";
	var PASSWORD      = "password";
	var USERNAME      = "octocat";

	function tokenRequest () {
		return nock(GITHUB_API)
		.get(
			"/applications/" + process.env.CLIENT_ID + "/tokens/" +
			TOKEN
		)
		.reply(200, {
			user : { login : USERNAME }
		});
	}

	before(function (done) {
		nock.disableNetConnect();
		done();
	});

	after(function (done) {
		nock.enableNetConnect();
		done();
	});

	describe("/collector", function () {
		var browser;

		function collectorRequest () {
			return nock("http://localhost:1080")
			.get("/")
			.reply(200, "cube collector");
		}

		before(function (done) {
			browser = new Browser();
			done();
		});

		describe("when authenticated", function () {
			var request;
			var response;

			before(function (done) {
				request = collectorRequest();
				tokenRequest();

				browser.http({
					headers : {
						"Authorization": AUTHORIZATION
					},

					url : "/collector"
				})
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("forwards requests to the cube collector", function (done) {
				expect(request.isDone(), "cube request").to.be.true;
				expect(response.statusCode, "status").to.equal(200);
				expect(response.payload, "payload").to.equal("cube collector");
				done();
			});
		});

		describe("when not authenticated", function () {
			var request;
			var response;

			before(function (done) {
				request = collectorRequest();

				browser.http({ url : "/collector" })
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("rejects requests", function (done) {
				expect(request.isDone(), "cube request").to.be.false;
				expect(response.statusCode, "status").to.equal(401);
				done();
			});
		});
	});

	describe("/evaluator", function () {
		var browser;

		function evaluatorRequest () {
			return nock("http://localhost:1081")
			.get("/")
			.reply(200, "cube evaluator");
		}

		before(function (done) {
			browser = new Browser();
			done();
		});

		describe("when authenticated", function () {
			var request;
			var response;

			before(function (done) {
				request = evaluatorRequest();
				tokenRequest();

				browser.http({
					headers : {
						Authorization : AUTHORIZATION
					},

					url : "/evaluator"
				})
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("forwards requests to the cube evaluator", function (done) {
				expect(request.isDone(), "cube request").to.be.true;
				expect(response.statusCode, "status").to.equal(200);
				expect(response.payload, "payload").to.equal("cube evaluator");
				done();
			});
		});

		describe("when not authenticated", function () {
			var request;
			var response;

			before(function (done) {
				request = evaluatorRequest();

				browser.http({ url : "/evaluator" })
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("rejects requests", function (done) {
				expect(request.isDone(), "cube request").to.be.false;
				expect(response.statusCode, "status").to.equal(401);
				done();
			});
		});
	});

	describe("/token", function () {

		describe("when authenticated", function () {
			var response;

			before(function (done) {
				var authorization = "Basic " +
					(new Buffer(USERNAME + ":" + PASSWORD)).toString("base64");
				var browser = new Browser();

				nock(GITHUB_API)
				.get("/user")
				.reply(200, { login : USERNAME });

				nock(GITHUB_API)
				.get(
					"/orgs/" + process.env.ORGANIZATION + "/members/" +
					USERNAME
				)
				.reply(204);

				nock(GITHUB_API)
				.put("/authorizations/clients/" + process.env.CLIENT_ID)
				.reply(200, { token : TOKEN });

				browser.http({
					headers : {
						Authorization : authorization
					},

					url : "/token"
				})
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			after(function (done) {
				nock.cleanAll();
				done();
			});

			it("returns an access token", function (done) {
				expect(response.statusCode, "status").to.equal(200);
				expect(JSON.parse(response.payload), "payload").to.deep.equal({
					token : TOKEN
				});
				done();
			});
		});

		describe("when not authenticated", function () {
			var response;

			before(function (done) {
				var browser = new Browser();

				browser.http({ url : "/token" })
				.then(function (_response_) {
					response = _response_;
				})
				.nodeify(done);
			});

			it("rejects the request", function (done) {
				expect(response.statusCode, "status").to.equal(401);
				done();
			});
		});
	});
});
