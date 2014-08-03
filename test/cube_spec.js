"use strict";
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

	// TODO: add API endpoints
});
