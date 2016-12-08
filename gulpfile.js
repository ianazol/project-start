"use strict";

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cssmin = require('gulp-minify-css');
const prefixer = require('gulp-autoprefixer');
const rigger = require('gulp-rigger');
const del = require('del');
const browserSync = require("browser-sync").create();
const svgstore = require('gulp-svgstore');
const svg2string = require('gulp-svg2string');
const rename = require("gulp-rename");
const notify = require("gulp-notify");
const webpackStream = require("webpack-stream");
const webpack = webpackStream.webpack;
const plumber = require('gulp-plumber');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        jsVendor: 'build/js/vendor/',
        css: 'build/css/',
        assets: 'build/assets/',
    },
    src: {
        html: 'src/html/*.html',
        js: 'src/js/main.js',
        jsVendor: 'src/js/vendor/**/*.*',
        css: 'src/css/main.scss',
        assets: 'src/assets/**/*.*',
        svg: 'src/svg/*.svg',
    },
    watch: {
        html: 'src/html/*.html',
        htmlParts: 'src/html/parts/*.html',
        js: 'src/js/main.js',
        css: 'src/css/main.scss',
        assets: 'src/assets/**/*.*',
        svg: 'src/svg/*.svg',
    },
    clean: './build'
};

gulp.task('clean', function () {
    return del(path.clean);
});

gulp.task('assets:build', function () {
    return gulp.src(path.src.assets, {since: gulp.lastRun('assets:build')})
        .pipe(gulp.dest(path.build.assets));
});

gulp.task('js:build', function () {
    return gulp.src(path.src.jsVendor)
        .pipe(gulp.dest(path.build.jsVendor));
});

gulp.task('css:build', function () {
    return gulp.src(path.src.css)
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(sass())
        .on('error', notify.onError())
        .pipe(prefixer({ browsers: ['> 1%', 'IE 7']}))
        .pipe(gulpIf(!isDevelopment, cssmin()))
        .pipe(gulpIf(isDevelopment, sourcemaps.write()))
        .pipe(gulp.dest(path.build.css));
});

gulp.task('html:build', function () {
    return gulp.src(path.src.html, {since: gulp.lastRun('assets:build')})
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html));
});

gulp.task('htmlParts:build', function () {
    return gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html));
});

gulp.task('svg:build', function () {
    return gulp.src(path.src.svg)
        .pipe(svgstore())
        .pipe(svg2string())
        .pipe(rename('svg-lib.js'))
        .pipe(gulp.dest(path.build.js));
});

gulp.task('webpack', function(callback){
    let firstBuildReady = false;

    function done(err, stats) {
        firstBuildReady = true;
        if (err) return;
        console.log(stats.toString());
        //gulplog[stats.hasErrors() ? 'error' : 'info'](stats.toString({
            //colors: true
        //}));
    }

    let options = {
        context: __dirname + '/src/js',
        entry: {
            main: `./main`
        },
        output: {
            publicPath: '/js/'
        },
        watch: isDevelopment,
        devtool: isDevelopment ? 'cheap-module-inline-source-map' : null,
        module:  {
            loaders: [{
                test:    /\.js$/,
                include: __dirname + "/src",
                loader:  'babel?presets[]=es2015'
            }]
        },
        plugins: [
            new webpack.NoErrorsPlugin()
        ]
    };

    return gulp.src(path.src.js)
        .pipe(plumber({
            errorHandler: notify.onError()
        }))
        .pipe(webpackStream(options, null, done))
        //.pipe(gulpIf(!isDevelopment, uglify()))
        .pipe(rename('main.js'))
        .pipe(gulp.dest(path.build.js))
        .on('data', function() {
            if (firstBuildReady) {
                callback();
            }
        });
});

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('css:build', 'assets:build', 'html:build', 'htmlParts:build', 'svg:build', 'js:build', 'webpack'))
);

gulp.task('webserver', function(){
    browserSync.init({
        server: {
            baseDir: "./build"
        },
        host: 'localhost',
        port: 9000,
    });

    browserSync.watch('build/**/*.*').on('change', browserSync.reload);
});

gulp.task('watch', function(){
    gulp.watch(path.watch.css, gulp.series('css:build'));
    gulp.watch(path.watch.assets, gulp.series('assets:build'));
    gulp.watch(path.watch.html, gulp.series('html:build'));
    gulp.watch(path.watch.htmlParts, gulp.series('htmlParts:build'));
    gulp.watch(path.watch.svg, gulp.series('svg:build'));
    gulp.watch(path.watch.svg, gulp.series('js:build'));
});

gulp.task('default', gulpIf(isDevelopment,
    gulp.series('build', gulp.parallel('watch', 'webserver')),
    gulp.series('build'))
);