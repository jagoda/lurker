"use strict";
var enforcer = require("gulp-istanbul-enforcer");
var fs       = require("fs");
var gulp     = require("gulp");
var istanbul = require("gulp-istanbul");
var jshint   = require("gulp-jshint");
var mocha    = require("gulp-mocha");
var path     = require("path");
var stylish  = require("jshint-stylish");
var _        = require("lodash");

var JSHINTRC     = ".jshintrc";
var SOURCE_FILES = [ "*.js", "lib/**/*.js" ];
var TEST_FILES   = [ "test/helpers/setup.js", "test/**/*_spec.js" ];

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

gulp.task("coverage", [ "test-unit" ], function () {
	var options = {
		thresholds : {
			statements : 100,
			branches   : 100,
			lines      : 100,
			functions  : 100
		},
		coverageDirectory : "coverage",
		rootDirectory : ""
	};

	return gulp
	.src(".")
	.pipe(enforcer(options));
});

gulp.task("default", [ "lint", "test" ]);

gulp.task("lint", [ "lint-src", "lint-test" ]);

gulp.task("lint-src", function () {
	return runJshint(jshintOptions(), SOURCE_FILES);
});

gulp.task("lint-test", function () {
	return runJshint(jshintOptions(path.join(__dirname, "test")), TEST_FILES);
});

gulp.task("test", [ "lint", "test-unit", "coverage" ]);

gulp.task("test-unit", [ "lint" ], function (done) {
	gulp.src(SOURCE_FILES)
	.pipe(istanbul())
	.on("finish", function () {
		gulp.src(TEST_FILES)
		.pipe(mocha())
		.pipe(istanbul.writeReports())
		.on("end", done)
		.on("error", done);
	});
});

// This ensures reasonable behavior for CI systems.
gulp.on("err", process.exit.bind(process, 1));
