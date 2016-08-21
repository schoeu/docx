var $win = $(window);
$('.docx-content').height($win.height()-$('.docx-head').height());


var pathname = location.pathname || '';
var $target = $('[data-path="' + pathname + '"]');
$target.addClass('nav-select');
var $navparents = $target.parents('.nav-dir');
$navparents.addClass('docx-open');

$('.nav-dir').on('click', function (e) {
    var $target = $(this);
    if ($target.hasClass('docx-open')) {
        $target.removeClass('docx-open');
    }
    else {
        $target.addClass('docx-open');
        $target.siblings('.nav-dir').removeClass('docx-open');
    }
});

if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked');
}