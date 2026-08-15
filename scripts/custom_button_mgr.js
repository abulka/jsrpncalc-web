  /*
   * This is all a bit of a mess.
   * Need to have the custom button checkboxes CONSULTED as to where and whether to build
   * each custom button.
   * On the other hand the buttonBuilder() function creates the checkboxes which are meant to already exist!
   *
   * Also we are doing an extra uneccessary parse in this loop
   * and thus again calling buttonBuilder() yet again.
   *
   * Parse
   *  - should build the custom definitions ready for later consultation
   *  - do globaleval
   *  - should extract custom checkbox mappings (if any) and make them available
   *  
   * CustomButtonCheckboxManager
   *  - should update the custom button checkboxes for all custom button pages
   *   whilst preserving any existing checkbox state if possible
   *   If self is empty, initialise from parser mappings (if any)
   *  - save and restore from script the state of the checkboxes
   *
   * BuildButtons
   *  - clear old buttons
   *  rebuild buttons in accordance to CustomButtonCheckboxManager
   *
   * AFTER editor.save
   *  - parse
   *  - cbmgr.update
   *  - buildbuttons
   *
   * AFTER view.cbox changes
   *  - cbmgr.save_mappings to script
   *  - build buttons
   * 
   */
  
function CustomButtonsMgr(jsparser, persister, clicksound, log_f)
{
  var _next_unique_id = 0;
  
  // PRIVATE
  
  function buttonBuilder(params, $attachto) {
      var element = $('<a>'+params['function_name']+'</a>');
      element.attr('data-role', "button").attr('data-mini', true).attr('data-inline', true).attr('data-theme', "a");
      element.button(); // give jqm a chance to style it.
      
      //element.on('vmousedown', function() { clicksound.play(); });  // click sound during carousel swipe is confusing, so don't do it.
      
      element.on("click dblclick", doclickeval);  // Wire up event handler for our new custom button.
                                                  // Note we don't listen for swipe, since custom buttons on the carousel
                                                  // are likely to be swiped and the intent is for the carousel to move
      $attachto.append(element);
      return element;
  }
  
  function get_current_mapping_state(page_number, button_function_name) {
      // See what the current mapping value (if any) is
      var old_cb_state;
      if (page_number < persister.get_current_mappings().length) {
          var curr_page_of_mappings = persister.get_current_mappings()[page_number];
          old_cb_state = curr_page_of_mappings[button_function_name];  // will be undefined if doesn't exist
      }
      else
        old_cb_state = undefined;
      
      if (old_cb_state == undefined)
        old_cb_state = false;
        
      return old_cb_state;    
  }
  
  function build_cb_gui_from_jsparser_info() {
      var btb = jsparser.get_buttons_tobuild_spec();
      for (var i=0; i < btb.length; i++) {
        
          var button_function_name = btb[i]['function_name'];
          
          // Create associated checkboxes
          $(".custom-cb").each(function(page_i, cbpage){
            
              old_cb_state = get_current_mapping_state(page_i, button_function_name);
            
              var id = 'dynamic_cb' + _next_unique_id++;
              $('<input type="checkbox" id="'+id+'"></input><label for="'+id+'">' + button_function_name + '</label>')
                  .attr('data-mini', true).
                  prop('checked', old_cb_state).
                  appendTo(cbpage).
                  trigger("create");  // so that new checkboxes are reformatted to jqm styling.
          });
      }
      $(".custom-cb").closest('div').trigger('create');  // Refresh the divs for all fieldsets so that the new checkboxes are reformatted to jqm styling.
  }
  
  function extract_cb_mappings_from_gui() {
    var mappings = [];
    
    $(".custom-cb").each(function(i, fset){
      var mapping = {};
      $(fset).find('input').each(function(page_i, cbinput) {
        var cbid = $(cbinput).attr('id');
        var assoc_label = $(fset).find('[for="'+cbid+'"]')[0];
        mapping[$(assoc_label).text().trim()] = $(cbinput).is(':checked');
      });
      mappings.push(mapping);
    });
    return mappings;
  }
  
  function doclickeval(event) {
      jsparser.execute_function_from_button_info({
          'function_to_call': $(this).find('.ui-btn-text').text(), // button text nested a within a few spans in jqm
          // go off button name for now
          'num_params': $(this).data("num_params"),
          // custom attr for any dom element - see http://api.jquery.com/jQuery.data/
          'params': $(this).data("params"),
          'rpnstack': rpn,
          'log': log_f
      });
  }
  
  function doclickeval_shifted(shifted_key_text, shifted_label) {
      jsparser.execute_function_from_button_info({
          'function_to_call': shifted_key_text,
          'num_params': $(shifted_label).data("num_params"),
          // custom attr for any dom element - see http://api.jquery.com/jQuery.data/
          'params': $(shifted_label).data("params"),
          'rpnstack': rpn,
          'log': log_f
      });
  }
  
  function initialise_shifted_label_array() {
    // This array lets us get to the buttons by row, and by eating away at it
    // after each label assignment, we can tell when we run out of buttons.
    var rows = [
        [$("#btn7")[0],$("#btn8")[0],$("#btn9")[0],$("#btnDivide")[0]],
        [$("#btn4")[0],$("#btn5")[0],$("#btn6")[0],$("#btnTimes")[0]],
        [$("#btn1")[0],$("#btn2")[0],$("#btn3")[0],$("#btnSubtract")[0]]];
    return rows;        
  }

  function clear_shifted_labels() {
      $("#btn7,#btn8,#btn9,#btnDivide," +
        "#btn4,#btn5,#btn6,#btnTimes," +
        "#btn1,#btn2,#btn3,#btnSubtract").each(function(i, btn){
            $(btn).siblings("p").html('&#8201;&thinsp;').addClass("labelnobgnd");
      });
  }
  
  function clear_custom_buttons() {
      $("#customKeysPage1,#customKeysPage2,#customKeysPage3,#customKeysPage4").html(''); 
  }
  
  // PUBLIC

  function rebuild_custom_buttons(first_time) {
      if (first_time == undefined) first_time = false;
      
      jsparser.editor.setValue(persister.get_editor_text());
      
      var btb = jsparser.parse();

      if (! first_time) {
        var mappings = extract_cb_mappings_from_gui();
      
        persister.save_custom_button_mappings(mappings);
      }
      
      $(".custom-cb").empty();  // this clears multiple div contents!

      build_cb_gui_from_jsparser_info();  // though this should respect what is already there if possible...
      
      // Re-Build buttons
      
      clear_custom_buttons();   // Clear old buttons from swipe carousel
      clear_shifted_labels();   // Clear all custom shifted label positions to blank
      
      var rows = initialise_shifted_label_array();
      
      for (var i=0; i < btb.length; i++) {
          var current_function = btb[i].function_name;
          
          // Need to consult the cb mappings and build more buttons - one per carousel page
          $(".custom-cb").each(function(page_i, cbpage){

            if (get_current_mapping_state(page_i, current_function)) {
              var element = buttonBuilder(btb[i], $('#customKeysPage'+(page_i+1)));
              element.data("num_params", btb[i].num_params);  // Add custom data to the button re what function it represents
              element.data("params", btb[i].params);          // and what parameters that function takes.
            }
          });

          // Need to consult the cb mappings and build shifted key labels - max 4 custom functions per calc key row.  4 rows.
          var CUSTOM_SHIFTED_KEY_ENTRIES = 4;  // key mappings 1-4 are for the carousel, 5-8 are for the shifted calc key rows
          for (var row=0; row < 4; row++) {
              if (get_current_mapping_state(row + CUSTOM_SHIFTED_KEY_ENTRIES, current_function)) {
                  var btn = rows[row].shift();  // pop the first element, eating up the array as we go
                  //console.log('YEAH', row, current_function, btn.id); 
                  if (btn != undefined) {
                      $(btn).siblings("p").html(current_function).removeClass("labelnobgnd");
                      $(btn).siblings("p").data("num_params", btb[i].num_params);  // Add custom data to the label re what function it represents
                      $(btn).siblings("p").data("params", btb[i].params);          // and what parameters that function takes.
                  }
                  else
                      console.log("cannot fit", current_function, "onto row", row);
              }
          }

      }
  }
  
  // Return interface -----------------------

  return {
    rebuild_custom_buttons:rebuild_custom_buttons,
    doclickeval_shifted:doclickeval_shifted
  }

};
  