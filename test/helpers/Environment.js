"use strict";
var _ = require("lodash");

function Environment () {
	var previous = Object.create(null);

	function set (key, value) {
		if ("undefined" === typeof value) {
			delete process.env[key];
		}
		else {
			process.env[key] = value;
		}
	}

	this.restore = function () {
		_.each(previous, function (value, key) {
			set(key, value);
		});
		previous = Object.create(null);
	};

	this.set = function (key, value) {
		if (!(key in previous)) {
			previous[key] = process.env[key];
		}

		set(key, value);
	};
}

module.exports = Environment;
