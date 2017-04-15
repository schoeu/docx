/**
 * Created by schoeu 2017/4/14.
 */
$.fn.fullImage = function () {
    var $body = $(document.body);
    var $head = $(document.head);
    var $target = $(this);
    var src = $target.attr('src');
    var style = '<style>.c-full-image{position:fixed;top:0;left:0;bottom:0;right:0;background:rgba(0,0,0,0.4);z-index:1000;display:none;}</style>';
    var mask = '<div class="c-full-image"></div>';
    $head.append(style);
    $body.append(mask);
    var $mask = $('.c-full-image');

    $target.on('click', function () {
        $mask.show();
    });
};
