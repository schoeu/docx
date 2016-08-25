/**
 * @file 文档页js
 * */
var $win = $(window);
var $navs = $('.docx-navs');
/**
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked-wrap');
}

/**
 * 搜索action
 * */
$win.on('keyup', function (e) {
    if (e.keyCode === 13) {
        var key = $('.docx-searchkey').val();
        $.ajax({
            url: '/search',
            data: {"name": key},
            type: 'post'
        }).done(function (data) {
            if (data.error === 0) {
                var matchedFiles = data.data || [];
                var htmlStr = '';
                var emptyString = '<div class="docx-search-content">暂无匹配文档!</div>';
                console.log(data.data);
                matchedFiles.forEach(function (it) {
                    htmlStr += [
                        '<div class="docx-search-art"><a href="' + it.path + '" class="doc-search-link">',
                        it.title,
                        '</a></div>'
                    ].join("");
                });

                $('.docx-marked').html(htmlStr ? htmlStr : emptyString);
            }
        });
    }
});

$navs.metisMenu({
    preventDefault: false
});

$(window).on('load', function(event) {
    // Prevent default timeout redirection behavior
    event.preventDefault();
    var pathname = location.pathname || '';
    var $pathDom = $('[data-path="'+ pathname +'"]');
    $pathDom.parents('.docx-submenu').addClass('in');
    $pathDom.parents('[data-dir]').addClass('active');
    $docxTitle.removeClass('docx-active');
    $(this).addClass('docx-active').parents('.docx-dir').removeClass('active');
});

$navs.metisMenu();

/*var $docxTitle = $('.docx-files');
$('.nav-title').on('click', function () {
    $docxTitle.removeClass('docx-active');
    $(this).addClass('docx-active').parents('.docx-dir').removeClass('active');
});*/
