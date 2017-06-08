// Call Plugins
var env         = require('minimist')(process.argv.slice(2)),
    gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    plumber     = require('gulp-plumber'),
    minifyHtml  = require('gulp-minify-html'),
    uglify      = require('gulp-uglify'),
    cleancss    = require('gulp-clean-css'),
    concat      = require('gulp-concat'),
    concatcss   = require('gulp-concat-css'),
    gulpif      = require('gulp-if'),
    cache       = require('gulp-cache'),
    rename      = require('gulp-rename'),
    rsync       = require('gulp-rsync'),
    order       = require("gulp-order"),
    fs          = require("fs"),
    os          = require("os"),
    homeDir     = os.homedir();

// Call Uglify and Concat JS
gulp.task('js', function(){
    return gulp.src([
        'src/js/editor.js'
    ])
        .pipe(concat('liveeditor.js'))
        .pipe(uglify())
        .pipe(gulp.dest('build/js'));
});

gulp.task('css', function() {
  return gulp.src(["src/css/editor.css"], {restore: true})
    .pipe(concatcss('liveeditor.css'))
    .pipe(cleancss())
    .pipe(gulp.dest('build/css'));
});

gulp.task('twig', function() {
  return gulp.src('src/*.twig')
    .pipe(minifyHtml())
    .pipe(gulp.dest('build'));
});

gulp.task('php', function() {
  return gulp.src('src/*.php')
    .pipe(gulp.dest('build'));
});

gulp.task('publish', function() {
  return gulp.src('build/**/*')
  .pipe(plumber())
  .pipe(rsync({
    root: 'build/',
    hostname: 'evcircuits.com',
    username: 'guruevi',
    privateKey: fs.readFileSync('/home/username/.ssh/id_rsa'),
    destination: '/var/www/html/web/modules/liveeditor',
    archive: true,
    silent: false,
    compress: true
  }))
  .on('error', function(err) {
    console.log(err);
  });
});

// Call Watch
gulp.task('watch', function(){
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/css/**/*.css', ['css']);
    gulp.watch('src/*.php', ['php']);
    gulp.watch('src/*.twig', ['twig']);
});

// Default task
gulp.task('default', ['js', 'css', 'php', 'twig', 'watch']);
