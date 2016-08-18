const gulp = require('gulp');
const ts = require('gulp-typescript');
const watch = require('gulp-watch');
const srcmap = require('gulp-sourcemaps');
const path = require('path');

const projectOpts = ts.createProject({
  target: "es6",
  module: "commonjs",
  noImplicitAny: false,
  declaration: false,
  noExternalResolve: true
});

gulp.task('source', () => {
  let result = gulp.src(['src/**/*.ts', 'typings/**/*.ts'])
    .pipe(srcmap.init())
    .pipe(ts(projectOpts));

  result.js
    .pipe(srcmap.write({sourceRoot: path.resolve(__dirname, "src")}))
    .pipe(gulp.dest('dist/'))
});

gulp.task('dev', ['source'], () => {
  watch('src/**/*.ts', () => {
    gulp.start('source');
  });
});