/*
click is too slow, unless use
    - ftlabs technique (simplest and is global) OR
    - jQuery.fastClick.js technique and put handlers in special fastClick()
    - hook in on 'tap' and remove ghost clicks using isJQMGhostClick() 

vclick and tap are ok, but have to raise finger for them to register, and get ghosts.
vmousedown is ideal, but get ghosts.
*/


$(document).ready(function() {
    // Inside phonegap, console.log only starts working after 'deviceready' is fired.
    // And the 'deviceready' event hookup needs to happen after the document is ready.
    
    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    if ( app ) {
        // PhoneGap application
        console.log('Detected PhoneGap application');  // this won't be seen because it is before device is ready
        document.addEventListener("deviceready", onDeviceReady, false);
        function onDeviceReady() {
            // PhoneGap is ready to be used
            console.log('PhoneGap is ready to be used');
            bigapp(ClickSound_PhoneGap);  // inject sound click class
        }    
    } else {
        // Web page
        console.log('Detected Web page application');
        bigapp(ClickSound_WebAudio);   // inject sound click class
    }
    
});

function bigapp(sound_f) {
    rpn = new RpnStack('rpnstack2');  // lack of var makes this GLOBAL

    var log1 = new text_area_logger($('#log1'));
    var log2 = new text_area_logger($('#log2'), false);  // no autoresize for this one?
    
    log = function(s) {             // lack of var makes this GLOBAL
        log1.log(s);
        log2.log(s);
    }

    var persister = new PersistManager();
    
    // Sample data
    rpn.pusher([1, 2, 3, 4, 66, 77,
    {
        'a': 45,
        'b': [6, 7]
    }]);
    rpn.pusher(100);
    rpn.pusher(200);
    rpn.pusher("hello");

    var current_in = $('#current');

    var canvasDemos = new CanvasDemos($('#myCanvas')[0]);
    canvasDemos.init();

    var jsparser = new JsParser($("#code")[0]);
    persister.reload();

    var clicksound = new sound_f('sounds/Click3e_soft2.WAV');
    var clicksound2 = new sound_f('sounds/Click3g.WAV'); // 3d is ok
    var clicksound3 = new sound_f('sounds/click5d_softshort.wav');

    var custom_button_mgr = new CustomButtonsMgr(jsparser, persister, clicksound, log);
    custom_button_mgr.rebuild_custom_buttons(true);  // first time ignore cb mappings gui

    // Functionality - perhaps move somewhere else

    var opts = {
        transition: "none",
        reverse: false
    };

    var opts2 = {
        transition: "slidefade",
        reverse: false,
        changeHash: false
    };
        

    function f_doEnter() {
        rpn.doenter();
        current_in.val("").keyup();
    }
    
    function f_CustomKeysEditor() {
        $.mobile.changePage('#MultiPageEditorKeys', opts2);
    }

    function f_ScriptEditor() {
        $.mobile.changePage('#MultiPageEditorEdit', opts2);
    }
    
    function f_LoadScript() {
        $.mobile.changePage('#MultiPageEditorOpen', opts2);
    }

    function f_Options() {
        $.mobile.changePage('#AppOptions', opts2);
    }
    
    function f_ViewLogUnderMainKeys() {
        $('.iosSlider2').iosSlider('goToSlide', 2);
    }

    function f_ClearBackspace() {
        if (current_in.val() == "") {
            if (rpn.length() > 0)
                rpn.popper();
                
            //current_in.val("").keyup();
            log1.clear();
            log2.clear();
        }
        else {  // something being typed
            // remove last char
            current_in.val(current_in.val().slice(0, -1)).keyup();
        }
    }
    
    function f_Clear() {
        console.log("not implemented");
    }

    function get1param() {
        if (current_in.val() != "") {
            rpn.doenter();
            current_in.val("").keyup();
        }
        var p1 = rpn.popper();
        return p1;
    }

    function get2params() {
        if (current_in.val() != "") {
            rpn.doenter();
            current_in.val("").keyup();
        }
        var p1 = rpn.popper();
        var p2 = rpn.popper();
        return [p1, p2];
    }

    function f_times() {
        var params = get2params();
        var result = params[0].val * params[1].val;
        rpn.pusher(result);
    }
    function f_divide() {
        var params = get2params();
        var result = params[1].val / params[0].val;
        rpn.pusher(result);
    }
    function f_add() {
        var params = get2params();
        var result = params[0].val + params[1].val;
        rpn.pusher(result);
    }
    function f_subtract() {
        var params = get2params();
        var result = params[1].val - params[0].val;
        rpn.pusher(result);
    }

    function f_drop() {
        if (rpn.length() > 0)
            rpn.popper();
    }
    
    function f_Print() {
        var x = get1param();
        if (x != undefined)
            log(x + "\n");
    };
    
    function f_LastX() {
        rpn.pusher('last x goes here :-)');
    };
    
    function f_Catalog() {
        rpn.pusher('catalog goes here ;-)');
    }

    function f_RS() {
        //rpn.pusher('R/S goes here !!');
        // not implemented.
        // could run custom script main() or $(document).ready(...) ?
        //f_Help(); // temporary
        jsparser.redoeval();
    }
    
    function f_Help() {
        $.mobile.changePage('#AppHelp', opts2);
    }
    
    // KEY BINDING - Must bind here not in 'pageinit' otherwise get double binding or something, when using ftlabs technique

    // SOUND
    var btns_with_click = $('#btn1,#btn2,#btn3,#btn4,#btn5,#btn6,#btn7,#btn8,#btn9,#btn0,#btnPeriod,#btnXY,#btnDup');
    var btns_with_click2 = $('#btnEnter,#btnTimes,#btnDivide,#btnAdd,#btnSubtract,#btnUp,#btnDown');
    var btns_with_click3 = $('#btnXx');
    btns_with_click.on('vmousedown', function() {
        clicksound.play();
    });
    btns_with_click2.on('vmousedown', function() {
        clicksound2.play();
    });
    btns_with_click3.on('vmousedown', function() {
        clicksound3.play();
    });

 
    // MAIN NUMERIC DIGIT INPUT HANDLING, POSSIBLE CUSTOM SHIFTED VALUES TOO
    
    function appendDigit(s) {
        current_in.val(current_in.val() + s).keyup();
    }
    
    $("#btn1,#btn2,#btn3,#btn4,#btn5,#btn6,#btn7,#btn8,#btn9").on('click swipe dblclick', function(event, ui) { // 2. ftlabs technique, you use normal click and it looks after everything.
        if (! didCustomYellow(event)) {
            var keylabels = getKeyLabels(event.target);
            appendDigit(keylabels.main_key_text);
        }
    });

    $("#btn0").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_LastX();
        } else
            appendDigit("0");
    });

    $("#btnPeriod").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_Print();
        } else
            appendDigit(".");
    });

    // REMAINDER OF KEYS WITH CUSTOM SHIFTED VALUES
    
    $("#btnTimes").on('click swipe dblclick', function(event, ui) {
        if (! didCustomYellow(event))
            f_times();
    });

    $("#btnDivide").on('click swipe dblclick', function(event, ui) {
        if (! didCustomYellow(event))
            f_divide();
    });
    $("#btnAdd").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_Catalog();
        } else
            f_add();
    });
    $("#btnSubtract").on('click swipe dblclick', function(event, ui) {
        if (! didCustomYellow(event))
            f_subtract();
    });
    
    $("#btnRS").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_Help();
        } else
            f_RS();
    });
    
    // HITTING ENTER ON INPUT TEXTFIELD VIA ios/android keyboard
    
    $("input#current").on("keyup", function(e) {
        if (e.keyCode == 13) {
            rpn.doenter();
            return false;
        } else
            return true;
    });

    // RESERVED KEYS
    
    $("#btnEnter").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_ViewLogUnderMainKeys();
        } else
            f_doEnter();
    });

    $("#btnEditor").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_LoadScript();
        } else
            f_ScriptEditor();
    });

    $("#btnCustom").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_Options();
        } else
            f_CustomKeysEditor()
    });
    
    $("#btnXx").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_Clear();
        } else
            f_ClearBackspace();
    });

    $("#btnUp").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            // ROT
        } else
            rpn.rup();
    });

    $("#btnDown").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            rpn.dup();
        } else
            rpn.rdn();
    });

    $("#btnXY").on('click swipe dblclick', function(event, ui) {
        if (isYellow()) {
            clearYellow();
            f_drop();
        } else
            rpn.swapper();
    });


    // YELLOW BUTTON HANDLING
    
    function isYellow() {
        return $('#btnYellow').find('span.ui-btn-text').html() == 'f';
    }

    function clearYellow() {
        $("#btnYellow").find('span.ui-btn-text').html('&#8201;&thinsp;');
    }

    function setYellowShifted(t) {
        $(t).find('span.ui-btn-text').html('f');
    }

    $("#btnYellow").on('click swipe dblclick', function(event, ui) {
        if ($(this).find('span.ui-btn-text').html() == 'f')
            clearYellow();
        else
            setYellowShifted(this);
    });

    
    function getKeyLabels(target) {
        // target is typically an on click event.target
        var $parent_div = $(target).closest('div');
        var $shifted_label = $parent_div.find('p');
        var shifted_key_text = $shifted_label.text();
        var main_key_text = $parent_div.find('span[class*="ui-btn-text"]').text();
        return {'main_key_text':main_key_text,
                'shifted_key_text':shifted_key_text,
                'shifted_label':$shifted_label[0]};
    }
   
    function isEmptyYellowShift(keylabels) {
        return $.trim(keylabels.shifted_key_text) == "";
    }

    function didCustomYellow(event) {
        if (isYellow()) {
            clearYellow();
            var keylabels = getKeyLabels(event.target);
            if (! isEmptyYellowShift(keylabels))
                custom_button_mgr.doclickeval_shifted(keylabels.shifted_key_text, keylabels.shifted_label);
            return true;
        }
        else
            return false; // indicates wasn't a yellow shift situation
        
    }
    
   // CUSTOMISE KEYS PAGE
   
    $("#btnReparse").on('click', function(event, ui) {
        custom_button_mgr.rebuild_custom_buttons();
    });
   
   
    // EDITOR PAGE
    
    function editor_text_insert(s) {
        $("#code3").val(s + $("#code3")[0].value);        
    }
    
    $("#edit_addfunction").on('click', function(event, ui) {
        editor_text_insert("function untitled() { }\n");
    });
    
    $("#edit_addvar").on('click', function(event, ui) {
        editor_text_insert("var x = 100;\n");
    });
    
    $("#edit_addclass").on('click', function(event, ui) {
        editor_text_insert($("#EditorAddClassTemplate").text()+"\n");
    });
   
   
    // LOAD PAGE
    
    $("ul#directoryList li").on('click', function(event, ui) {
        var filename = $(this).text();  // or event.target.innerText
        persister.open(filename);
        custom_button_mgr.rebuild_custom_buttons();
        $.mobile.changePage('#MultiPageEditorView');
    });

    $(".savescript").on('click', function(event, ui) {
        persister.save();
        rebuild_custom_buttons_and_exit_to_calc();
    });

    $("#edit_cancel").on('click', function(event, ui) {
        persister.reload();
        rebuild_custom_buttons_and_exit_to_calc();
    });

    $("#btnInitSampleScripts").on('click', function(event, ui) {
        persister.init_samples();
        // but what do we load in now, current or last edited?
        persister.open("Current");
        custom_button_mgr.rebuild_custom_buttons();
    });

    
    // OPTIONS PAGE
    
    // Editor Options
    
    $("#flip-mini").on("change", function(event, ui) {
        var want_word_wrap = (event.target.value === 'on') ? true : false;
        var want_line_numbers = ($("#flip-mini2")[0].value === 'on') ? true : false;
        jsparser = new JsParser($("#code")[0], want_word_wrap, want_line_numbers);
        //jsparser.re_init_editor(want_word_wrap, want_line_numbers);
    });
    
    $("#flip-mini2").on("change", function(event, ui) {
        var want_word_wrap = ($("#flip-mini")[0].value === 'on') ? true : false;
        var want_line_numbers = (event.target.value === 'on') ? true : false;
        jsparser = new JsParser($("#code")[0], want_word_wrap, want_line_numbers);
    });

    $("#flip-mini3").on("change", function(event, ui) {
        $("#code3")[0].wrap = event.target.value;
    });

    // Persistence Options
    
    function rebuild_custom_buttons_and_exit_to_calc() {
        custom_button_mgr.rebuild_custom_buttons();
        $.mobile.changePage('#p0', opts);
    }
    
    
    // BINDINGS RELATED TO OTHER POPUP SCREENS ETC.

    // LOG VIEW PAGE
    
    $("#btnExitLog2").on('click swipe dblclick', function(event, ui) {
        $('.iosSlider2').iosSlider('goToSlide', 1);
    });
    
}

$(document).bind('pageinit', function() {
    // DO SOMETHING
});