const gulp = require("gulp"),
      babel = require("gulp-babel"),
      browserify = require('browserify'),
      watchify = require('watchify'),
      source = require('vinyl-source-stream'),
      buffer = require('vinyl-buffer'),
      uglify = require('gulp-uglify'),
      babelify = require('babelify');


function compile(){
  var bundler = watchify(browserify('./src/index.js', { debug: true }).transform(babelify,{presets: ["es2015"]}));

  bundler.bundle()
    .on('error', (err) => { console.error(err); this.emit('end'); })
    .pipe(source('full-build.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest('./build'));
}

gulp.task('build', () => { return compile(); });

gulp.task('default', ['build']);
