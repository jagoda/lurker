"use strict";
var fs       = require("fs");
var gulp     = require("gulp");
var jshint   = require("gulp-jshint");
var lab      = require("gulp-lab");
var path     = require("path");
var stylish  = require("jshint-stylish");
var _        = require("lodash");

var JSHINTRC     = ".jshintrc";
var SOURCE_FILES = [ "*.js", "lib/**/*.js" ];
var TEST_FILES   = [ "test/**/*_spec.js" ];

function jsonFile (file) {
	return JSON.parse(fs.readFileSync(file, { encoding : "utf8" }));
}

function jshintOptions (directory) {
	var options   = jsonFile(path.join(__dirname, JSHINTRC));

	if (directory) {
		options = _.merge(options, jsonFile(path.join(directory, JSHINTRC)));
	}

	return options;
}

function runJshint (options, files) {
	return gulp.src(files)
	.pipe(jshint(options))
	.pipe(jshint.reporter(stylish))
	.pipe(jshint.reporter("fail"));
}

gulp.task("coverage", function () {
	gulp.src(TEST_FILES)
	.pipe(lab("-p -r html -o coverage.html"));
});

gulp.task("default", [ "lint", "test" ]);

gulp.task("lint", [ "lint-src", "lint-test" ]);

gulp.task("lint-src", function () {
	return runJshint(jshintOptions(), SOURCE_FILES);
});

gulp.task("lint-test", function () {
	return runJshint(jshintOptions(path.join(__dirname, "test")), TEST_FILES);
});

gulp.task("test", [ "lint" ], function (done) {
	gulp.src(TEST_FILES)
	.pipe(lab("-p -t 100"))
	.on("error", done)
	.on("end", done);
});

// This ensures reasonable behavior for CI systems.
gulp.on("err", process.exit.bind(process, 1));
