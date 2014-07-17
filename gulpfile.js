"use strict";
const fs       = require("fs");
const gulp     = require("gulp");
const jshint   = require("gulp-jshint");
const mocha    = require("gulp-mocha");
const path     = require("path");
const stylish  = require("jshint-stylish");
const _        = require("lodash");

const JSHINTRC     = ".jshintrc";
const SOURCE_FILES = [ "*.js", "lib/**/*.js" ];
const TEST_FILES   = [ "test/**/*.js" ];

function jsonFile (file) {
	return JSON.parse(fs.readFileSync(file, { encoding : "utf8" }));
}

function jshintOptions (directory) {
	let options   = jsonFile(path.join(__dirname, JSHINTRC));

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

gulp.task("default", [ "lint", "test" ]);

gulp.task("lint", [ "lint-src", "lint-test" ]);

gulp.task("lint-src", function () {
	return runJshint(jshintOptions(), SOURCE_FILES);
});

gulp.task("lint-test", function () {
	return runJshint(jshintOptions(path.join(__dirname, "test")), TEST_FILES);
});

gulp.task("test", function (done) {
	return gulp.src(TEST_FILES)
	.pipe(mocha({ reporter : "spec" }))
	.on("error", done)
	.on("end", done);
});

// This ensures reasonable behavior for CI systems.
gulp.on("err", process.exit.bind(process, 1));

if (require.main === module) {
	gulp.start("default");
}
