"use strict";

function Configuration () {
}

function getEnv (name, defaultValue) {
	name = name.toUpperCase();

	return name in process.env ? process.env[name] : defaultValue;
}

Configuration.prototype.database = {
	url : getEnv.bind(
		null,
		"influxdb_url",
		"http://localhost:8086/db/lurker/series?u=lurker&p=test"
	)
};

Configuration.prototype.github = {
	client : {
		id     : getEnv.bind(null, "github_client_id", null),
		secret : getEnv.bind(null, "github_client_secret", null)
	},

	organization : getEnv.bind(null, "github_organization", null),
	secret       : getEnv.bind(null, "github_secret", null)
};

Configuration.prototype.server = {
	hostname : getEnv.bind(null, "host", null),

	port     : function () {
		return Number(getEnv("port", 0));
	}
};

module.exports = Configuration;
