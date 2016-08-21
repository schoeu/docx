var htmlStr = '';
var $lastestArae = $('.docx-lastest');
$.ajax({
    url: '/lastestfiles'
}).done(function (data) {
    if (data.errorno === 0) {
        var files = data.files || [];
        files.forEach(function (it) {
            htmlStr += '<li>'+ it + '</li>';
        });
        $lastestArae.html(htmlStr);
    }
});