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

$(document).on('pjax:beforeReplace', function(event) {
    // Prevent default timeout redirection behavior
    event.preventDefault();
    console.log(event);

});

$navs.metisMenu();

/*$('#sidebar-container').load(menuPath,function(){
        $('#side-menu').metisMenu();
    defaultLoad();
    //设置默认右侧菜单
    var url = window.location;
    var hash = location.hash;
    if(hash == '') url = url + '#' + globalConf.firstDoc;
    var element = $('#sidebar-container a').filter(function() {
        return this.href == url;
    }).addClass('active');
    var parentUl = element.parents('ul').filter(function(){
        if($(this).attr('data-level')){
            $(this).addClass('in');
            $(this).parent().addClass('active');
        }
    });
});*/
