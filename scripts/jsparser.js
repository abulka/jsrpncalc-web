function JsParser(code_textarea, lineWrapping_bool, lineNumbers_bool)
{
  var syntax;
  var lineWrapping = lineWrapping_bool;
  var lineNumbers = lineNumbers_bool;
  
  var buttons_tobuild_spec = [];
  //var custom_buttons_enabled_info = [];
  
  if (lineWrapping == undefined) lineWrapping = false;
  if (lineNumbers == undefined) lineNumbers = false;
  
  var last_function_call_params = undefined;
  
  // Private Methods ------------------------

  // See http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
  var globalEval = function(src) {
      if (window.execScript) // eval in global scope for IE
          window.execScript(src);
      else // other browsers
          eval.call(null, src);
  }
  
  var editor = CodeMirror.fromTextArea(code_textarea, {
      lineNumbers: lineNumbers,
      matchBrackets: true,
      tabSize: 2,
      mode: {name: "javascript", json: true},
      autoClearEmptyLines: true,
      lineWrapping: lineWrapping
  });


  // Public Methods -------------------------

  // UNUSED AT THE MOMENT - TODO
  function re_init_editor(lineWrapping_bool2, lineNumbers_bool2) {
      editor = CodeMirror.fromTextArea(code_textarea, {
          lineNumbers: lineNumbers_bool2,
          matchBrackets: true,
          tabSize: 2,
          mode: {name: "javascript", json: true},
          autoClearEmptyLines: true,
          lineWrapping: lineWrapping_bool2
      });
  }
  
  function get_buttons_tobuild_spec() { return buttons_tobuild_spec; }
  
  function parse(s) {
    buttons_tobuild_spec = [];

    // Get the text of the user code editor
    if (s == undefined)
      var thecode = editor.getValue();
    else
      var thecode = s;
    
    // Parse !!
    syntax = esprima.parse(thecode);
    
    // Scan the parse tree for functions
    var i;
    for (i = 0; i < syntax.body.length; ++i) {
        var el = syntax.body[i];
        var button_building_params = {
          'function_name':el.id.name,
          'num_params': el.params.length,
          'params': jQuery.extend({}, el.params) // shallow copy
          }
        buttons_tobuild_spec.push(button_building_params);
    }
    globalEval(thecode);
    return buttons_tobuild_spec;
  }

  var redoeval = function() {
    if (last_function_call_params != undefined)
      doeval(last_function_call_params);
  }
  
  var doeval = function(params_dict) {
    var function_to_call =  params_dict['function_to_call'];
    var num_params =        params_dict['num_params'];
    var params =            params_dict['params'];
    var rpn =               params_dict['rpnstack'];  // even though rpn and log are available globally (for now)
    var log =               params_dict['log'];       // best we explicitly get them passed in.

    last_function_call_params = params_dict;
    
    // Build parameters string.
    // There must be a better way than this e.g. by using the argument array.            
    var p = "";
    $.each(params, function(index, value) {
        console.log('param', index, value.name);
        if (p != "")
            p += ", ";
            
        // Pop a needed parameter off the stack
        var parameter = rpn.popper();
        if (parameter.val_type  == "string")
            p += '"' + parameter.val + '"';
        else
            p += JSON.stringify(parameter.val);//.toString();
    });
        
    // Build the final user function command to call
    var cmd = function_to_call + "(" + p + ");"
    console.log(cmd);
    log(cmd);
    var result = eval(cmd);
    
    if (result != undefined) {
        rpn.pusher(result);
        log(result);
    }
    
  }
  
  // Return interface -----------------------

  return {
    parse:parse,
    editor:editor,
    get_buttons_tobuild_spec:get_buttons_tobuild_spec,
    re_init_editor:re_init_editor,
    execute_function_from_button_info:doeval,
    redoeval:redoeval
  }

};
  