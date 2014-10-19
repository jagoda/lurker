"use strict";
var Configuration = require("../lib/Configuration");
var Environment   = require("apparition").Environment;
var expect        = require("chai").expect;

describe("A configuration helper", function () {
	var configuration;

	before(function () {
		configuration = new Configuration();
	});

	describe("looking up the server hostname", function () {
		describe("with the HOST environment variable", function () {
			var hostname = "example.com";

			var environment;

			before(function () {
				environment = new Environment();
				environment.set("host", hostname);
			});

			it("returns the HOST value", function () {
				expect(configuration.server.hostname(), "hostname")
				.to.equal(hostname);
			});
		});

		describe("without the HOST environment variable", function () {
			var environment;

			before(function () {
				environment = new Environment();
				environment.delete("host");
			});

			after(function () {
				environment.restore();
			});

			it("returns null", function () {
				expect(configuration.server.hostname(), "hostname").to.be.null;
			});
		});
	});

	describe("looking up the server port", function () {
		describe("with the PORT environment variable", function () {
			var port = 8080;

			var environment;

			before(function () {
				environment = new Environment();
				environment.set("port", port);
			});

			after(function () {
				environment.restore();
			});

			it("returns the PORT value", function () {
				var value = configuration.server.port();

				expect(value, "type").to.be.a("number");
				expect(value, "value").to.equal(8080);
			});
		});

		describe("without the PORT environment variable", function () {
			var environment;

			before(function () {
				environment = new Environment();
				environment.delete("port");
			});

			after(function () {
				environment.restore();
			});

			it("returns 0", function () {
				var value = configuration.server.port();

				expect(value, "type").to.be.a("number");
				expect(value, "value").to.equal(0);
			});
		});
	});

	describe("looking up the InfluxDB URL", function () {
		describe("with the INFLUXDB_URL environment variable", function () {
			var url = "http://example.com:8086/db/test/series?u=foo&p=bar";

			var environment;

			before(function () {
				environment = new Environment();
				environment.set("influxdb_url", url);
			});

			after(function () {
				environment.restore();
			});

			it("returns the INFLUXDB_URL value", function () {
				expect(configuration.database.url(), "database").to.equal(url);
			});
		});

		describe("without the INFLUXDB_URL environment variable", function () {
			var environment;

			before(function () {
				environment = new Environment();
				environment.delete("influxdb_url");
			});

			after(function () {
				environment.restore();
			});

			it("returns a local database URL", function () {
				expect(configuration.database.url(), "database")
				.to.equal(
					"http://localhost:8086/db/lurker/series?u=lurker&p=test"
				);
			});
		});
	});

	describe("looking up the GitHub shared secret", function () {
		describe("with the GITHUB_SECRET environment variable", function () {
			var secret = "asuperdupersecret";

			var environment;

			before(function () {
				environment = new Environment();
				environment.set("github_secret", secret);
			});

			after(function () {
				environment.restore();
			});

			it("returns the GITHUB_SECRET value", function () {
				expect(configuration.github.secret(), "secret")
				.to.equal(secret);
			});
		});

		describe("without the GITHUB_SECRET environment variable", function () {
			var environment;

			before(function () {
				environment = new Environment();
				environment.delete("github_secret");
			});

			after(function () {
				environment.restore();
			});

			it("returns null", function () {
				expect(configuration.github.secret(), "secret").to.be.null;
			});
		});
	});

	describe("looking up the GitHub organization", function () {
		describe(
			"with the GITHUB_ORGANIZATION environment variable",
			function () {
				var organization = "octocats";

				var environment;

				before(function () {
					environment = new Environment();
					environment.set("github_organization", organization);
				});

				after(function () {
					environment.restore();
				});

				it("returns the GITHUB_ORGANIZATION value", function () {
					expect(configuration.github.organization(), "organization")
					.to.equal(organization);
				});
			}
		);

		describe(
			"without the GITHUB_ORGANIZATION environment variable",
			function () {
				var environment;

				before(function () {
					environment = new Environment();
					environment.delete("github_organization");
				});

				after(function () {
					environment.restore();
				});

				it("returns null", function () {
					expect(configuration.github.organization(), "organization")
					.to.be.null;
				});
			}
		);
	});
});
