const gulp = require('gulp');
const ts = require('gulp-typescript');
const watch = require('gulp-watch');
const path = require('path');

const projectOpts = ts.createProject({
  target: "es6",
  module: "commonjs",
  noImplicitAny: false,
  declaration: false,
  noResolve: true
});

gulp.task('source', () => {
  let result = gulp.src(['src/**/*.ts', 'typings/**/*.ts'], {dot: true})
    .pipe(projectOpts());

  result.js
    .pipe(gulp.dest('dist/'))
});

gulp.task('dev', ['source'], () => {
  watch('src/**/*.ts', {dot: true}, () => {
    gulp.start('source');
  });
});