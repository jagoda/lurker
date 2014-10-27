"use strict";
var Configuration = require("../lib/Configuration");
var Environment   = require("apparition").Environment;
var expect        = require("chai").expect;

describe("A configuration helper", function () {
	var configuration;

	function describeOption (options) {
		var key = options.key.toUpperCase();

		describe("looking up the " + options.description, function () {
			describe("with the " + key + " environment variable", function () {
				var environment;

				before(function () {
					environment = new Environment();
					environment.set(key, options.testValue);
				});

				after(function () {
					environment.restore();
				});

				it("returns the " + key + " value", function () {
					expect(options.getter(), "value")
					.to.equal(options.testValue);
				});
			});

			describe(
				"without the " + key + " environment variable",
				function () {
					var environment;

					before(function () {
						environment = new Environment();
						environment.delete(key);
					});

					after(function () {
						environment.restore();
					});

					it("returns " + options.defaultValue, function () {
						expect(options.getter(), "default")
						.to.equal(options.defaultValue);
					});
				}
			);
		});
	}

	before(function () {
		configuration = new Configuration();
	});

	describeOption({
		defaultValue : null,
		description  : "server hostname",
		key          : "host",
		testValue    : "example.com",

		getter : function () {
			return configuration.server.hostname();
		},
	});

	describeOption({
		defaultValue : 0,
		description  : "server port",
		key          : "port",
		testValue    : 8080,

		getter : function () {
			return configuration.server.port();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "server shared secret",
		key          : "cookie_password",
		testValue    : "foobar",

		getter : function () {
			return configuration.server.secret();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "server URL",
		key          : "base_url",
		testValue    : "http://example.com",

		getter : function () {
			return configuration.server.url();
		}
	});

	describeOption({
		defaultValue : "http://localhost:8086/db/lurker/series?u=lurker&p=test",
		description  : "InfluxDB URL",
		key          : "influxdb_url",
		testValue    : "http://example.com:8086/db/test/series?u=foo&p=bar",

		getter : function () {
			return configuration.database.url();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "GitHub client ID",
		key          : "github_client_id",
		testValue    : "aclientapplication",

		getter : function () {
			return configuration.github.client.id();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "GitHub client secret",
		key          : "github_client_secret",
		testValue    : "asuperdupersecret",

		getter : function () {
			return configuration.github.client.secret();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "GitHub organization",
		key          : "github_organization",
		testValue    : "octocats",

		getter : function () {
			return configuration.github.organization();
		}
	});

	describeOption({
		defaultValue : null,
		description  : "GitHub shared secret",
		key          : "github_secret",
		testValue    : "asuperdupersecret",

		getter : function () {
			return configuration.github.secret();
		}
	});
});
