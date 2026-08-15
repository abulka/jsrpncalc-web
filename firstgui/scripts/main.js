
// global

function log1(s) {
    //$('<div/>').append(s).appendTo('div#log1');
    //$('div#log1').append(s);
    $('div#log1').append($('<p>'+s+'</p>'));
}
function log1_clear(s) {
    $("div#log1").empty();
}
function rpnpush(v) {
    log1(v.toString());
    rpn.pusher(v);
}


$(window).load(function(){
    var jsparser = new JsParser($("#code")[0]);
    $(jsparser.editor.getScrollerElement()).height(170);
    
    rebuild_custom_buttons();

    // Custom buttons drag drop rearrange
    
    $('#design_mode').click(function() {  // can't make touch aware with our usual trick because checkbox doesn't change state.
        console.log('mode changed');
        if ($("#design_mode").is(':checked')) {
            $('.f_button').draggable("enable");
            draggable_on($('.f_button'));
        }
        else {
            $('.f_button').draggable("disable");
            $('.f_button').removeClass('draggablenow')
        }
    });
    var draggable_on = function(e) {
        e.draggable({
            cancel: false
        });
        e.addClass('draggablenow');
    }

    // Parse Button
    
    $('#btn_parse').on('touchstart click', function(e){
        e.stopPropagation(); e.preventDefault();
        rebuild_custom_buttons();
    }); 

    function rebuild_custom_buttons() {
        var btb = jsparser.parse();
        //console.log(btb);
        clear_old();
        for (var i=0; i < btb.length; i++) {
            log_functionname(btb[i].function_name);
            var element = buttonBuilder(btb[i]);
            // Add custom data to the button re what function it represents
            // and what paramters that function takes.
            element.data("num_params", btb[i].num_params);
            element.data("params", btb[i].params);
        }
    }
    
    function clear_old() {
        // Clear old buttons, old diagnostics
        $("#out").html('');
        $("#div_buttons").html('');
        $('#ul_function_names').empty();
    }
    function log_functionname(name) {
        $('#ul_function_names').append($('<li>', {
         text: name
        }));
    }

    function buttonBuilder(params) {
        var element = $("<input>", {
            type: "button",
            val: params['function_name'],
            name: "blah",
            "class": "f_button"
        });

        element.on("touchstart click", doclickeval);  // Wire up event handler for our new custom button.  Touch friendly.

        if ($("#design_mode").is(':checked')) {
            draggable_on(element);
        }

        $('#div_buttons').append(element);

        return element;
    }
    
    function doclickeval(event) {
        if ($("#design_mode").is(':checked')) {
            return;
        }
        event.stopPropagation(); event.preventDefault();   // to prevent ghost clicks on touch devices.  See http://stackoverflow.com/questions/7018919/how-to-bind-touchstart-and-click-events-but-not-respond-to-both
        
        jsparser.execute_function_from_button_info({
            'function_to_call': $(this).val(),            // go off button name for now
            'num_params': $(this).data("num_params"),     // custom attr for any dom element - see http://api.jquery.com/jQuery.data/
            'params':$(this).data("params"),
            'rpnstack': rpn,
            'log': log1
            });
    }

});




$(document).ready(function(){
    $( "button" ).button({
            icons: {
                primary: "ui-icon-locked"
            },
            text: true
        });
    
    $("div#rpn_regular_keyboard").hide();
    $("div#rpn_parsing_results").hide();
    $("div#rpn_script").hide();
    $("div#canvas1").hide();
    $("div#log1").hide();
    
    $("button#rpn_buttons").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#rpn_buttons").slideToggle("slow");
    });
    $("button#canvas1").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#canvas1").slideToggle("fast");
    });
    $("button#log1").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#log1").slideToggle("fast");
    });
    $("button#rpn_script").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#rpn_script").slideToggle("fast");
      $('.CodeMirror').each(function(i, el){
          el.CodeMirror.refresh();
      });      
    });
    $("button#rpn_custom_buttons").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#rpn_custom_buttons").slideToggle("fast");
    });
    $("button#rpn_parsing_results").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#rpn_parsing_results").slideToggle("fast");
    });
    $("button#rpn_regular_keyboard").on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      $("div#rpn_regular_keyboard").slideToggle("slow");
    });


});

// Used to be in index.html

var rpn;

$(window).load(function(){

    rpn = new RpnStack('rpnstack2');
    
    // Sample data
    rpn.pusher(100);
    rpn.pusher(200);
    rpn.pusher("hello");
      
    // Gui
    
    // Touch aware discussion, take advantage of touch but avoid ghost click
    // http://stackoverflow.com/questions/7018919/how-to-bind-touchstart-and-click-events-but-not-respond-to-both
    
    $('#btn_push2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.pusher(Math.random()*1000);
    });
    $('#btn_pop2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      var item = rpn.popper();
      console.log('popped', item, item.toString());
    });
    $('#btn_rolldown2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.rdn();
    });
    $('#btn_rollup2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.rup();
    });
    $('#btn_swap2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.swapper();
    });
    $('#btn_dup2').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.dup();
    });
    $('#btn_push2_array').on('touchstart click', function(e){
      e.stopPropagation(); e.preventDefault();
      rpn.pusher([1,2,3,"hi",{'fred':2},44]);
    });
    $("input#current").on("keyup", function(e) {
      if (e.keyCode == 13) {
          rpn.doenter();
          return false;
      }
      else
          return true;
    });
    
    
    // Drag and drop sortable / re-arrangable rpn stack
    
    function deselect_text() {
      if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {  // Firefox
          window.getSelection().removeAllRanges();
        }
      } else if (document.selection) {  // IE?
        document.selection.empty();
      }  
    }
    
    $('#stack_design_mode').click(function() {
        console.log('stack_design_mode changed');
        if ($("#stack_design_mode").is(':checked')) {
          
          deselect_text();
    
          $("#rpnstack2").sortable({ disabled: false });
          
          /*
          disableSelection() useful if you want to make text unselectable. If, for
          instance, you want to make drag-and-drop elements with text on, it'd be
          annoying to the user if the text on the box accidentally would get
          selected when trying to drag the box. 
          */
          $("#rpnstack2").disableSelection();
        }
        else {
          $("#rpnstack2").sortable({ disabled: true });
          $("#rpnstack2").enableSelection();
        }
    });


});

