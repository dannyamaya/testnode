'use strict'

var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('concatScripts', function () {
  gulp.src([
    'js/jquery-1.12.4.min.js',
    'js/jquery.validate.min.js',
    'js/parallax.min.js',
    'js/bootstrap.js',
    'js/wow.min.js',
    'js/smooth-scroll.min.js',
    'js/fluidvids.min.js'])
  .pipe(concat("app.js"))
  .pipe(gulp.dest("js"))
});

gulp.task('minifyScripts', function () {
  gulp.src('js/app.js')
  .pipe(uglify())
  .pipe(rename('app.min.js'))
  .pipe(gulp.dest("js"))
});