/**
 * gulp配置文件
 * */
var path = require('path');

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');
var livereload = require('gulp-livereload')
var rename = require("gulp-rename");
var clean = require('gulp-clean');
var concat = require('gulp-concat');

var options = process.argv.slice(2) || [];
var themes = 'default';
if (options.length > 1 && options[0] == '--theme') {
    themes = options[1];
}
console.log('~~~~~',themes)

var staticPath = path.join('./themes/', themes, './static');
var distPath = path.join(staticPath, './dist');

var srcOpts = {
    buffer: true
};

var jsDir = 'javascripts';
var styDir = 'stylesheets';

// 默认任务
gulp.task('default', ['mini']);

// 压缩js/css任务
gulp.task('mini', ['clean'],function () {
    // 压缩js
    gulp.src([
        staticPath + '/' + jsDir + '/jq.js',
        staticPath + '/' + jsDir + '/bootstrap.js',
        staticPath + '/' + jsDir + '/jq.pjax.js',
        staticPath + '/' + jsDir + '/metisMenu.js',
        staticPath + '/' + jsDir + '/fullImage.js',
        staticPath + '/' + jsDir + '/doc.js'
    ], srcOpts)
        .pipe(uglify())
        .pipe(concat('docx.js'))
        .pipe(gulp.dest(distPath + '/' + jsDir + '/'))
        .pipe(livereload());

    // 压缩css
    gulp.src([staticPath + '/' + styDir + '/*.css', '!' + staticPath + '/' + styDir + '/*.min.css'])
        .pipe(minify())
        .pipe(concat('docx.css'))
        .pipe(gulp.dest(distPath + '/' + styDir + '/'))
        .pipe(livereload());
});

gulp.task('clean', function () {
    return gulp.src([staticPath + '/dist/'], {read: false})
    .pipe(clean());
});

gulp.task('watch', function () {
    livereload.listen();

    // 监听目录下的文件，若文件发生变化，则调用mini任务。
    gulp.watch(
        [
            staticPath + '/' + jsDir + '/*.js',
            staticPath + '/' + styDir + '/*.css',
            path.join(__dirname, './views/*')
        ]
        , ['mini']
    );
});
