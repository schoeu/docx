/**
 * @file 文档页js
 * */
var $win = $(window);
var $navs = $('.docx-navs');
var $navbarH = $('.navbar').height();
var $docxTitle = $('.docx-files');
var $docxBd = $('.docx-body');
var $docxDir = $('.docx-dir>a');
var $searchIpt = $('.docx-searchkey');
var $sug = $('.docx-sug');
var $sugul = $('.docx-sugul');

/**
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked-wrap');
    // 使用pjax更底层的方法,可控性更强
    /*$(document).on('click', 'a[href^="/"]', function(event) {
        var $target = $(this);
        var container = $docxBd.find('.docx-marked-wrap');
        if ($target.is('.docx-dirsa') && ($target.attr('aria-expanded') === 'false')) {
            return;
        }
        $.pjax.click(event, {container: container})
    });*/
    $(document).on('pjax:success', function() {
        $('.docx-fade').addClass('docx-fade-active');
        $sug.hide();
    });
}




$win.load(function () {
    $('.docx-fade').addClass('docx-fade-active');

    $win.on('resize', function () {
        $docxBd.height($win.height() - $navbarH);
    });

    $docxBd.height($win.height() - $navbarH);
});

/**
 * 搜索action
 * */
$searchIpt.on('input', function (e) {
    $sug.show();
    var key =$searchIpt.val();
    $.ajax({
        url: '/api/search',
        data: {
            name: key,
            type: 'title'
        },
        type: 'post'
    }).done(function (data) {
        var rsData = data.data;
        var htmlStr = '';
        if (Array.isArray(rsData) && rsData.length) {
            rsData.slice(0, 10).forEach(function (it) {
                htmlStr +=  '<li><a href="'+ it.path +'">'+ it.title +'</a></li>';
            });
        }
        htmlStr += '<li class="docx-fullse"><a href="#">全文搜索<span class="hljs-string">' + key + '</span></a></li>';
        $sugul.html(htmlStr);
    });
});

$docxBd.on('click', '.docx-fullse', function () {
    var key = $searchIpt.val();
    $.ajax({
        url: '/api/search',
        data: {
            name: key
        },
        type: 'post'
    }).done(function (data) {
        var rsData = data.data;
        var htmlStr = '';
        var emptyString = '<div class="docx-search-nocontent">暂无匹配文档!</div>';
        if (Array.isArray(rsData) && rsData.length) {
            rsData.forEach(function (it) {
                htmlStr +=  [
                    '<div class="docx-search-art">',
                    '    <div class="docx-search-title">',
                    '        <a href="' + it.path + '" class="doc-search-link">',
                    it.title,
                    '        </a>',
                    '    </div>',
                    '    <div class="docx-search-content">',
                    '        <a href="' + it.path + '" class="doc-search-link">',
                    it.content,
                    '        </a>',
                    '    </div>',
                    '</div>'
                ].join('');
            });
            $sug.hide();
        }
        $('.docx-marked').html(htmlStr ? htmlStr : emptyString);
    });
});

// 初始化文档目录菜单
$navs.metisMenu({
    preventDefault: false
});

$(window).on('load', function(event) {
    var pathname = location.pathname || '';
    var $pathDom = $('[data-path="'+ pathname +'"]');
    $pathDom.parents('.docx-submenu').addClass('in');
    $pathDom.parents('[data-dir]').addClass('active subactive');
    $docxTitle.removeClass('docx-active');
    $pathDom.addClass('docx-active').parents().remove('docx-active');
});

$docxTitle.add($docxDir).on('click', function () {
    $('.docx-active').removeClass('docx-active');
    $(this).addClass('docx-active');
});