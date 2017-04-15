/**
 * Created by schoeu 2017/4/14.
 */
$.fn.fullImage = function (options) {
    options = options || {};
    var $body = $(document.body);
    var $container = options.el || $body;
    var $head = $(document.head);
    var $target = $(this);
    var style = '<style>.c-fullimage-close{cursor:pointer;}.c-fullimage-c{position:absolute;right:30px;top:20px;width:4px;height:20px;background-color:#fff;-moz-transform:rotate(45deg);-o-transform:rotate(45deg);-webkit-transform:rotate(45deg);transform:rotate(45deg);}.c-fullimage-cs{-moz-transform:rotate(135deg);-o-transform:rotate(135deg);-webkit-transform:rotate(135deg);transform:rotate(135deg);}.c-fullimage{position:fixed;top:0;left:0;bottom:0;right:0;background:rgba(0,0,0,0.85);z-index:9999;display:none;padding:50px 0;}.c-fullimage-wr{background-size:contain;background-repeat:no-repeat;background-position:center;width:100%;height:100%;}</style>';
    var mask = '<div class="c-fullimage"><div class="c-fullimage-close"><div class="c-fullimage-c"></div><div class="c-fullimage-c c-fullimage-cs"></div></div><div class="c-fullimage-wr"></div></div>';
    $head.append(style);
    $body.append(mask);
    var $mask = $('.c-fullimage');
    var $imageWr = $('.c-fullimage-wr');
    var $imageClose = $('.c-fullimage-close');

    $target.on('click', 'img', function (e) {
        var src = $(this).attr('src');
        $imageWr.css('background-image', 'url(' + src + ')');
        $mask.show();
    });

    $imageClose.on('click', function () {
        $mask.hide();
    });
};
