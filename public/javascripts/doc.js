var $win = $(window);
$('.docx-content').height($win.height()-$('.docx-head').height());

$('.nav-dir').on('click', function (e) {
    e.stopPropagation();
    var $target = $(this);
    if ($target.hasClass('docx-open')) {
        $target.removeClass('docx-open');
    }
    else {
        $target.addClass('docx-open');
    }
});


var pathname = location.pathname || '';
var $target = $('[data-path="' + pathname + '"]');
$target.addClass('nav-select');
var $navparents = $target.parents('.nav-dir');
$navparents.addClass('docx-open');


if ($.support.pjax) {
    //$(document).pjax('a', '.docx-marked');


    $.pjax({
        selector: 'a[href$=".md"]',
        container: '.docx-marked', // 内容替换的容器
        show: '', // 展现的动画，支持默认和fade, 可以自定义动画方式，这里为自定义的function即可。
        cache: false, // 是否使用缓存
        storage: false, // 是否使用本地存储
        titleSuffix: '', // 标题后缀
        filter: function () {},
        callback: function () {
        }
    });


    /*$(document).on('pjax:end', function () {
        var pathname = location.pathname || '';
        var $target = $('[data-path="' + pathname + '"]');
        var $navparents = $target.parents('.nav-dir');
        $navparents.addClass('docx-open');
    });*/
}