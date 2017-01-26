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
var actCls = 'docx-sugact';
var winH = $win.outerHeight();
var lisH = $docxTitle.first().height();
var $scollapse = $('#sidebar-collapse');

/**
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href^="/"]', '.docx-marked-wrap', {timeout: 1200});
    // 使用pjax更底层的方法,可控性更强
    // $(document).on('click', 'a[href^="/"]', function(event) {
    //     var container = $docxBd.find('.docx-marked-wrap');
    //     $.pjax.click(event, {container: container})
    // });
    $(document).on('pjax:complete', function() {
        // fixed safari animate bug.
        setTimeout(function () {
            $('.docx-fade').addClass('docx-fade-active');
        }, 0);

        // 目录切换
        changeMenu();

        $sug.hide();
    });
}


$(function () {
    $('.docx-fade').addClass('docx-fade-active');
    $win.on('resize', function () {
        $docxBd.height($win.height() - $navbarH);
        winH = $win.outerHeight();
    });

    $docxBd.height($win.height() - $navbarH);
});

$win.load(changeMenu);

function changeMenu() {
    $('.active,.subactive').removeClass('active subactive');
    $('.docx-navs .in').removeClass('in');

    // 打开对应目录
    var pathname = location.pathname || '';
    var $pathDom = $('[data-path="' + pathname + '"]');
    $pathDom.parents('.docx-submenu').addClass('in').css('height', 'auto');
    $pathDom.parents('[data-dir]').addClass('active subactive');
    $docxTitle.removeClass('docx-active');
    $pathDom.addClass('docx-active').parents().remove('docx-active');

    var crtLis = $('.docx-active');
    var offsetTop = crtLis.offset().top;
    // 如果选中目录不在可视范围则滚动到可视范围
    if (offsetTop > winH - lisH || offsetTop < 0) {
        // $scollapse.scrollTop(offsetTop - winH/5);
        $scollapse.animate({scrollTop: offsetTop - winH / 5}, 200);
    }
}

/**
 * 搜索action
 * */
$searchIpt.on('input focus', function (e) {
    var key = $searchIpt.val();
    key ? $sug.show() : $sug.hide();
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
                htmlStr +=  '<li><a href="' + it.path + '">' + it.title + '</a></li>';
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
                var content = it.content || '';
                content = content.replace(/<(table).*?<\/\1>|<table.*?>|<\/table>/g, '');
                htmlStr +=  [
                    '<div class="docx-search-art">',
                    '    <div class="docx-search-title">',
                    '        <a href="' + it.path + '" class="doc-search-link">',
                    it.title,
                    '        </a>',
                    '    </div>',
                    '    <div class="docx-search-content">',
                    '        <a href="' + it.path + '" class="doc-search-link">',
                    content,
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

$docxTitle.add($docxDir).on('click', function () {
    $('.docx-active').removeClass('docx-active');
    $(this).addClass('docx-active');
});

$searchIpt.on('keydown', function (e) {
    var keyCode = e.keyCode;
    var $lis = $('.docx-sugul>li');
    var $act = $('.docx-sugact');
    if (keyCode === 38) {
        if ($act.length === 0) {
            $lis.last().addClass(actCls);
        }
        else if (!$act.is(':first-child')) {
            $act.removeClass().prev().addClass(actCls);
        }
        else {
            $act.removeClass();
            $lis.last().addClass(actCls);
        }
    }
    else if (keyCode === 40) {
        if ($act.length === 0) {
            $lis.first().addClass(actCls);
        }
        else if (!$act.is(':last-child')) {
            $act.removeClass().next().addClass(actCls);
        }
        else {
            $act.removeClass();
            $lis.first().addClass(actCls);
        }
    }
    else if (keyCode === 13) {
        if ($lis.length === 1) {
            $lis.click();
            $sug.hide();
        }
        $act.find('a').click();
    }
});
