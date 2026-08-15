// Two double tap solutions from the same post // http://forum.jquery.com/topic/doubletap-event
// Second one works better

//(function($) {  
//    $.fn.doubleTap = function(doubleTapCallback) {
//        return this.each(function() {
//            var elm = this;
//            var lastTap = 0;
//            $(elm).bind('vmousedown', function(e) {
//                var now = (new Date()).valueOf();
//                var diff = (now - lastTap);
//                lastTap = now;
//                if (diff < 250) {
//                    if ($.isFunction(doubleTapCallback)) {
//                        doubleTapCallback.call(elm);
//                    }
//                }
//            });
//        });
//    }
//})(jQuery);

jQuery.event.special.dblclick = {
    setup: function(data, namespaces) {
        var elem = this,
            $elem = jQuery(elem);
        $elem.bind('touchend.dblclick', jQuery.event.special.dblclick.handler);
    },

    teardown: function(namespaces) {
        var elem = this,
            $elem = jQuery(elem);
        $elem.unbind('touchend.dblclick');
    },

    handler: function(event) {
        var elem = event.target,
            $elem = jQuery(elem),
            lastTouch = $elem.data('lastTouch') || 0,
            now = new Date().getTime();

        var delta = now - lastTouch;
        if(delta > 20 && delta<200){      // Adjusted from 500 to 200 - ANDY
            $elem.data('lastTouch', 0);
            $elem.trigger('dblclick');
        }else
            $elem.data('lastTouch', now);
    }
};

