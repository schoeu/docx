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
                var emptyString =  '<div class="docx-search-content">暂无匹配文档!</div>';
                console.log(data.data);
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

/*$navs.metisMenu({
    preventDefault: false
});*/

$navs.metisMenu();

/*
$navs.on('click', 'li', function () {
    $target = $(this);
    var brandName = [];
    var $lis = $target.add($target.parents('li'));

    $lis.each(function (i, it) {
        var $li = $(it);
        brandName.push($li.attr('data-title'));
    });

    var htmlStr = '<li>PSFEDOC</li>';
    brandName.forEach(function (item) {
        htmlStr += '<li>'+ item +'</li>';
    });
    $('.breadcrumb').html(htmlStr);
});*/
