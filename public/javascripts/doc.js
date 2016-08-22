/**
 * @file 文档页js
 * */

var $win = $(window);
var $content = $('.docx-content');
var $navTree = $('.docx-trwrap');
var pathname = location.pathname || '';
var $target = $('[data-path="' + pathname + '"]');

/**
* 文件夹状态切换
* */
$navTree.on('click', '.nav-name', function (e) {
    var $target = $(this);
    $target.parent().toggleClass('docx-open');
    return false;
});

/**
* 文件选中样式切换
* */
$navTree.on('click', 'li[data-path]', function (e) {
    var $target = $(this);
    $('.nav-select').removeClass('nav-select');
    $target.addClass('nav-select');
});

/**
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked');
}

/**
* 选中url中文件
* */
$target.addClass('nav-select');
var $navparents = $target.parents('.nav-dir');
$navparents.addClass('docx-open');

/**
 * 搜索action
 * */
$win.on('keyup', function (e) {
    if (e.keyCode === 13) {
        var key = $('.docx-searchkey').val();
        $.ajax({
            url: '/search',
            data: {"name": key},
        }).done(function (data) {
            console.log(data);
        });
    }
});
//