const { src, dest } = require('gulp');
const ts = require('gulp-typescript');
const include = require('gulp-include');
const replace = require('gulp-replace');
const sass = require('sass');

const USERSCRIPT_TS_SOURCE = './src/userscript.ts';
const SCSS_PATH = './src/style.scss';

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
	// Gulp does not have a standard method for merging streams, SASS is compiled
	// first, then injected into the TypeScript. For an unknown reason, replace() cannot
	// be called before tsProject(), so the replacement must occur afterwards.
	const sassResult = sass.compile(SCSS_PATH, {
		style: "compressed"
	});
	const CSS = sassResult.css.replace(/\}/gm, '}\n').trim();

	return src(USERSCRIPT_TS_SOURCE)
		.pipe(include())
		.pipe(tsProject())
		.pipe(replace(/(['"])INJECT_CSS\1/gm, `\`${CSS}\``))
		.pipe(replace(/^"use strict";\n*/gm, ''))
		.pipe(replace(/^Object\.defineProperty\(exports,.*?;\n*/gm, ''))
		.pipe(replace(/^exports\.default\s+.*?;\n*/gm, ''))
		.pipe(replace(/\/\/\s*eslint-.*\n*/gm, ''))
	  	.pipe(dest('dist'));
}

exports.default = compileUserScript;

