const gulp = require('gulp');
const ts = require('gulp-typescript');
const include = require('gulp-include');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');

const USERSCRIPT_TS_SOURCE = './src/userscript.ts';

const tsProject = ts.createProject({
	"target": "es2019",
	"module": "commonjs",
	"noImplicitReturns": true,
	"noUnusedLocals": true,
	"noImplicitAny": true,
	"sourceMap": false,
	"rootDir": "src",
});

function compileUserScript() {
	return gulp.src(USERSCRIPT_TS_SOURCE)
		.pipe(include())
		.pipe(tsProject())
		.pipe(replace(/^"use strict";\n*/gm, ''))
		.pipe(replace(/^Object\.defineProperty\(exports,.*?;\n*/gm, ''))
		.pipe(replace(/^exports\.default\s+.*?;\n*/gm, ''))
		.pipe(replace(/\/\/ eslint-.*\n*/gm, ''))
	  	.pipe(gulp.dest('dist'));
}

exports.default = compileUserScript;
