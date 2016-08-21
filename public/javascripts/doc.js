var $win = $(window);
var $content = $('.docx-content');
var $headHeight = $('.docx-head').height();
var $navTree = $('.docx-trwrap');
var pathname = location.pathname || '';
var $target = $('[data-path="' + pathname + '"]');

/*
* 文件夹状态切换
* */
$navTree.on('click', '.nav-name', function (e) {
    var $target = $(this);
    $target.parent().toggleClass('docx-open');
    return false;
});

/*
* 文件选中样式切换
* */
$navTree.on('click', 'li[data-path]', function (e) {
    var $target = $(this);
    $('.nav-select').removeClass('nav-select');
    $target.addClass('nav-select');
});

/*
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked');
}

function fixedSize() {
    $content.height($win.height()-$headHeight);
}

/*
* 窗口尺寸适应调整
* */
fixedSize();
$win.on('resize', fixedSize);

/*
* 选中url中文件
* */
$target.addClass('nav-select');
var $navparents = $target.parents('.nav-dir');
$navparents.addClass('docx-open');