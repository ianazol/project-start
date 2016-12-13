"use strict";

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cssmin = require('gulp-minify-css');
const prefixer = require('gulp-autoprefixer');
//const rigger = require('gulp-rigger');
const del = require('del');
const browserSync = require("browser-sync").create();
const rename = require("gulp-rename");
const notify = require("gulp-notify");
const webpackStream = require("webpack-stream");
const webpack = webpackStream.webpack;
const plumber = require('gulp-plumber');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const sassdoc = require('sassdoc');
const svg = require('gulp-svg-sprite');
const uglify = require('gulp-uglify');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const path = {
    build: {
        js: 'build/js/',
        jsVendor: 'build/js/vendor/',
        css: 'build/css/',
        assets: 'build/assets/',
        img: 'build/img'
    },
    src: {
        js: 'src/js/main.js',
        jsVendor: 'src/js/vendor/**/*.*',
        css: 'src/css/main.scss',
        assets: 'src/assets/**',
        svg: 'src/svg/*.svg',
        img: 'src/img/**/*.*',
    },
    watch: {
        js: 'src/js/**/*.js',
        css: 'src/css/**/*.scss',
        assets: 'src/assets/**',
        svg: 'src/svg/*.svg',
        img: 'src/img/**/*.*',
    },
    clean: './build'
};

gulp.task('clean', function () {
    return del(path.clean);
});

gulp.task('assets:build', function () {
    return gulp.src(path.src.assets/*, {since: gulp.lastRun('assets:build')}*/)
        .pipe(newer(path.build.assets))
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

gulp.task('image:build', function () {
    return gulp.src(path.src.img)
        .pipe(newer(path.build.img))
        .pipe(imagemin({
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img));
});

gulp.task('svg:build', function(){
    var svgConfig = {
        shape: {
            dimension: {
                maxWidth: 30,
                maxHeight: 30,
                attributes: false
            },
            spacing: {
                padding: 0
            },
            transform: ['svgo']
        },
        svg: {
            xmlDeclaration      : false,
            doctypeDeclaration  : false
        },
        mode: {
            css: false,
            view: false,
            defs: false,
            stack: false,
            symbol: {
                dest: 'svg',
                sprite: 'sprite.svg',
                bust: false,
                example: true
            }
        }
    };
    return gulp.src(path.src.svg)
        .pipe(svg(svgConfig))
        .pipe(gulp.dest(path.build.img));
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
            publicPath: '/js/',
            libraryTarget: 'var',
            library: "Main"
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
        .pipe(gulpIf(!isDevelopment, uglify()))
        .pipe(rename('main.js'))
        .pipe(gulp.dest(path.build.js))
        .on('data', function() {
            if (firstBuildReady) {
                callback();
            }
        });
});

gulp.task('sassdoc', function () {
    var options = {
        dest: 'docs',
        verbose: true
    };

    return gulp.src(path.watch.css)
        .pipe(sassdoc(options));
});

gulp.task('build', gulp.parallel('css:build', 'assets:build', 'svg:build', 'js:build', 'image:build', 'webpack'));

gulp.task('webserver', function(){
    browserSync.init({
        proxy: "localhost/tiu/",
        host: 'localhost',
        port: 9000,
    });

    browserSync.watch(['build/**/*.*', '*.php', '**/*.php']).on('change', browserSync.reload);
});

gulp.task('watch', function(){
    gulp.watch(path.watch.css, gulp.series('css:build'));
    gulp.watch(path.watch.assets, gulp.series('assets:build'));
    gulp.watch(path.watch.svg, gulp.series('svg:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
});

gulp.task('default', gulpIf(isDevelopment,
    gulp.series('build', gulp.parallel('watch', 'webserver')),
    gulp.series('clean', 'build'))
);