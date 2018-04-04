const gulp              = require('gulp');
const gulpLoadPlugins   = require('gulp-load-plugins');
const browserSync       = require('browser-sync').create();
const del               = require('del');
const mainBower         = require('main-bower-files');
const runSequence       = require('run-sequence');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

let dev = true;

// Pug
gulp.task('html', () => {
    return gulp.src('./assets/html/**/*.pug')
        .pipe($.plumber())
        .pipe($.pug({
            pretty: true
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(reload({stream:true}));
});

// SASS
gulp.task('sass', () => {
    return gulp.src('./assets/sass/*.sass')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: [
                'last 8 versions',
                'android 4',
                'opera 12'
            ]
        }))
        .pipe($.cssmin())
        .pipe($.if(dev, $.sourcemaps.write()))
        .pipe(gulp.dest('./dist/css'))
        .pipe(reload({stream:true}));
});

// JS
gulp.task('js', () => {
    return gulp.src('./assets/js/**/*.js')
        .pipe($.plumber())
        .pipe($.uglify())
        .pipe($.concat('build.js'))
        .pipe(gulp.dest('./dist/js'))
        .pipe(reload({stream: true}));
});

function lint(files) {
    return gulp.src(files)
        .pipe($.eslint({ fix: true }))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
    return lint('./assets/js/**/*.js')
        .pipe(gulp.dest('./dist/js'));
});

// Images
gulp.task('images', () => {
    return gulp.src('./assets/img/**/*')
        .pipe($.plumber())
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('./dist/img'));
});

// Fonts
gulp.task('fonts', () => {
    return gulp.src('./assets/fonts/**/*')
        .pipe($.plumber())
        .pipe($.flatten())
        .pipe(gulp.dest('./dist/fonts'));
});

// Bower
gulp.task('bower', function() {
    const filterJS    = $.filter('**/*.js', { restore: true });
    const filterCSS   = $.filter('**/*.css', { restore: true });

    // FontAwesome
    gulp.src('./bower_components/**/*.{otf,eot,svg,ttf,woff,woff2}')
        .pipe($.plumber())
        .pipe($.flatten())
        .pipe(gulp.dest('./dist/fonts'));

    return gulp.src('./bower.json')
        .pipe($.plumber())
        .pipe(mainBower())
        // JS
        .pipe(filterJS)
        .pipe($.concat('vendor.js'))
        .pipe($.uglify())
        .pipe(filterJS.restore)
        // CSS
        .pipe(filterCSS)
        .pipe($.concat('vendor.css'))
        .pipe($.cssmin())
        .pipe(filterCSS.restore)
        // Out
        .pipe(gulp.dest('./dist'));
});

// Clean dist
gulp.task('clean:dist', function() {
    return del.sync('./dist');
});

// Build task
gulp.task('build', function (callback) {
    runSequence('clean:dist',
        ['html', 'sass', 'js', 'images', 'fonts'],
        callback
    )
});

// BrowserSync
gulp.task('sync', ['build'], () => {
    browserSync.init(['*.css', '*.js'], {
        notify: false,
        open: false,
        port: 9000,
        server: {
            baseDir: ['./dist']
        }
    });
});

gulp.task('default', ['build', 'sync'], () => {
    // Watchers
    gulp.watch('assets/img/**/*.+(png|jpg|jpeg|gif|svg)', ['images']);
    gulp.watch('assets/html/**/*.pug', ['html']);
    gulp.watch('assets/sass/*.sass', ['sass']);
    gulp.watch('assets/js/*.js', ['js']);
});