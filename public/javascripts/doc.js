/**
 * @file 文档页js
 * */
var $win = $(window);
/**
* pjax委托
* */
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked');
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
        }).done(function (data) {
            if (data.error === 0) {
                var matchedFiles = data.data || [];
                var htmlStr = '';
                var emptyString =  '<div class="docx-search-content">暂无匹配文档!</div>';
                matchedFiles.forEach(function (it) {
                    htmlStr += [
                        '<div class="docx-search-art"><a href="' + it.path + '" class="doc-search-link">',
                        //'      <p class="docx-search-title">',
                        // it.title,
                        //'      </p>',
                        '      <article class="docx-search-content">',
                         it.content,
                        '      </article>',
                        '</a></div>'
                    ].join("");
                });

                $('.docx-marked').html(htmlStr ? htmlStr : emptyString);
            }
        });
    }
});

$('.docx-navs').metisMenu();