/**
 * @file 首页js
 * */

var htmlStr = '';
var $lastestArae = $('.docx-lastest-list');
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