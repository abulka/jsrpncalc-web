function text_area_logger($out_textarea, auto_resize, auto_scroll) {
    // Expect a text area to be passed in, as a jquery result
    // <textarea name="textarea" id="log2"></textarea>
    // $('#log1');

    if (auto_resize == undefined) auto_resize = true;
    if (auto_scroll == undefined) auto_scroll = true;
   
    //function scroll_to_bottom2() {
    //    log1.scrollTop(log1[0].scrollHeight - log1.height());
    //    log2.scrollTop(log2[0].scrollHeight - log2.height());
    //}
    //
    //function log(s) {
    //    log1.val(log1.val() + s).keyup(); // Keyup triggers auto resize, http://stackoverflow.com/questions/5850739/jquery-mobile-button-enable-disable-textarea-auto-resize-after-change
    //    log2.val(log2.val() + s);
    //    scroll_to_bottom2();
    //}

    function scroll_to_bottom() {
        $out_textarea.scrollTop($out_textarea[0].scrollHeight - $out_textarea.height());
    }
    function add_text(s) {
        $out_textarea.val($out_textarea.val() + s);
        if (auto_resize)
            $out_textarea.keyup(); // Keyup triggers auto resize, http://stackoverflow.com/questions/5850739/jquery-mobile-button-enable-disable-textarea-auto-resize-after-change
    }

    function log(s) {
        add_text(s);
        scroll_to_bottom();
    }

    function clear() {
        $out_textarea.val('');
    }
    
    return {
        log:log,
        clear:clear
    }
}

function div_logger($outdiv) {
    function log(s) {
        var e = $('<p>'+s+'</p>');
        $outdiv.append(e);
        
    }
    function logObj(o) {
        log(JSON.stringify(o))
    }
    function hr() {
        $outdiv.append($('<hr>'));
        
    }
    return {log:log, logObj:logObj, hr:hr}
}
