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
        $target.siblings('.nav-dir').removeClass('docx-open');
    }
});
if ($.support.pjax) {
    $(document).pjax('a[href$=".md"]', '.docx-marked');
}