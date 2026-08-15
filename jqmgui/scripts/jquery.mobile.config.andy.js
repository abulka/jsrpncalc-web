// http://jquerymobile.com/test/docs/api/globalconfig.html

/*
$(document).on("mobileinit", function(){
  $.extend(  $.mobile , {
    foo: bar
  });
});
*/

$(document).on("mobileinit", function(){
  $.mobile.buttonMarkup.hoverDelay = 30;
  //console.log('hover delay is', $.mobile.buttonMarkup.hoverDelay);
  
  // By default jQuery Mobile will auto enhance form elements, if you want to
  // tell JQM to ignore them you can add the data-role="none" attribute to the
  // container, however you also need to set $.mobile.ignoreContentEnabled =
  // true. The reason for this is because by default JQM doesn't check for the
  // data-role="none" attribute (so as to not perform a check every time
  // needlessly). 
  $.mobile.ignoreContentEnabled = true;
  
  // Speed up page transitions?
  // Unfortunately the keyboard sometimes doesn't render when this is on.
  //$.mobile.defaultPageTransition = 'none';
  
  
  //$.event.special.swipe.scrollSupressionThreshold = 1;  // (default: 10px) Ð More than this horizontal displacement, and we will suppress scrolling.
  //$.event.special.swipe.durationThreshold = 2000;  // (default: 1000ms) Ð More time than this, and it isn't a swipe.
  $.event.special.swipe.horizontalDistanceThreshold = 1;  // (default: 30px) Ð Swipe horizontal displacement must be MORE than this.
  $.event.special.swipe.verticalDistanceThreshold = 100;  // (default: 75px) Ð Swipe vertical displacement must be LESS than this.

});
