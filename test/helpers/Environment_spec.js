"use strict";
var Environment = require("./Environment");
var Lab         = require("lab");

var after    = Lab.after;
var before   = Lab.before;
var describe = Lab.experiment;
var expect   = Lab.expect;
var it       = Lab.it;

describe("An Environment helper", function () {

	function get (key) {
		return process.env[key];
	}

	function set (key, value) {
		if ("undefined" === typeof previous) {
			delete process.env[key];
		}
		else {
			process.env[key] = value;
		}
	}

	describe("setting a value", function () {
		var environment;
		var previous;

		before(function (done) {
			environment = new Environment();
			previous    = get("FOO");
			environment.set("FOO", "bar");
			done();
		});

		after(function (done) {
			set("FOO", previous);
			done();
		});

		it("updates the process environment", function (done) {
			expect(get("FOO"), "value not set").to.equal("bar");
			done();
		});
	});

	describe("with values set", function () {
		var bar;
		var foo;

		before(function (done) {
			bar = get("BAR");
			foo = get("FOO");
			set("BAR", "bar");
			set("FOO", "foo");
			done();
		});

		after(function (done) {
			set("BAR", bar);
			set("FOO", foo);
			done();
		});

		describe("setting a value", function () {
			var environment;

			before(function (done) {
				environment = new Environment();
				environment.set("FOO", "bar");
				done();
			});

			after(function (done) {
				set("FOO", foo);
				done();
			});

			it("updates the environment variable value", function (done) {
				expect(get("FOO"), "unexpected value").to.equal("bar");
				done();
			});
		});

		describe("restoring the environment", function () {
			var environment;

			before(function (done) {
				environment = new Environment();
				environment.set("FOO", "bar");
				environment.restore();
				done();
			});

			after(function (done) {
				set("BAR", foo);
				set("FOO", bar);
				done();
			});

			it("reverts to the previous values", function (done) {
				expect(get("FOO"), "value still set").not.to.equal("bar");
				expect(get("FOO"), "incorrect FOO value").to.equal(foo);
				expect(get("BAR"), "incorrect BAR value").to.equal(bar);
				done();
			});
		});
	});

	describe("without values set", function () {
		var foo;

		before(function (done) {
			foo = get("FOO");
			set("FOO");
			done();
		});

		after(function (done) {
			set("FOO", foo);
			done();
		});

		describe("setting a value", function () {
			var environment;

			before(function (done) {
				environment = new Environment();
				environment.set("FOO", "bar");
				done();
			});

			after(function (done) {
				set("FOO");
				done();
			});

			it("creates a new environment variable", function (done) {
				expect(get("FOO"), "not set").to.equal("bar");
				done();
			});
		});

		describe("restoring the environment", function () {
			var environment;

			before(function (done) {
				environment = new Environment();
				environment.set("FOO", "bar");
				environment.restore();
				done();
			});

			after(function (done) {
				set("FOO");
				done();
			});

			it("removes the environment variables", function (done) {
				expect(get("FOO"), "value set").to.be.undefined;
				done();
			});
		});
	});
});
