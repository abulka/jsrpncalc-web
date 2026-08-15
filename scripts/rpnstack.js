// RPN STACK classes

function Item() {  // 0 or 1 arg
  if (arguments.length == 1)
    this.val = arguments[0];
  else
    this.val = -99;
  this.val_type = typeof this.val;
}
Item.prototype = {
  
  DomNodeTypes: {
    // create the nodeType constants if the Node object is not defined
    // from http://code.stephenmorley.org/javascript/dom-nodetype-constants/
    ELEMENT_NODE                :  1,
    ATTRIBUTE_NODE              :  2,
    TEXT_NODE                   :  3,
    CDATA_SECTION_NODE          :  4,
    ENTITY_REFERENCE_NODE       :  5,
    ENTITY_NODE                 :  6,
    PROCESSING_INSTRUCTION_NODE :  7,
    COMMENT_NODE                :  8,
    DOCUMENT_NODE               :  9,
    DOCUMENT_TYPE_NODE          : 10,
    DOCUMENT_FRAGMENT_NODE      : 11,
    NOTATION_NODE               : 12
  },

  assertEqual: function(a, b, message)
  {
      if (a != b) throw new Error(message + " mismatch: " + a + " != " + b);
  },
  
  to_li: function() {
      var $li = $('<li>').text($.toJSON(this.val));
      $li.append($('<span>').text(this.val_type).addClass('stack_val_type'));
      $li.append($('<span>').text('').addClass('stack_comment'));
      return $li;
  },
  from_li: function($li) {
      var self = this;
      var val = $li.contents().filter(function() {
            return this.nodeType == self.DomNodeTypes.TEXT_NODE;
        }).text();
      this.val = $.evalJSON(val);
      this.val_type = $li.children('span').filter(".stack_val_type").text();
      self.assertEqual(this.val_type, typeof this.val, "val_type"); 
  },
  toString: function() {
    return "[value is " + this.val + " type is " + this.val_type + "]";
  }
}

// Stack keeps its data in the dom as li
    
function RpnStack(ul_id) {
  this.id = '#' + ul_id;
}
RpnStack.prototype = {
  pusher: function(val) {
    if (val == "" || val == undefined) {
      //alert("attempting to push empty or undefined item!");
      this.dup();
    }
    else {
      var item = new Item(val);
      $(this.id).append(item.to_li());
      this.scroll_to_bottom();
    }
  },
      
  scroll_to_bottom: function() {
    var $stackgui = $(this.id);
    $stackgui.scrollTop(
      $stackgui[0].scrollHeight - $stackgui.height()
    );
  },
      
  popper: function() {
      if (this.length() == 0)
        return undefined;
      var $li = $(this.id + ' li:last').remove();
      var item = new Item();
      item.from_li($li);
      this.scroll_to_bottom();
      return item;
  },
      
  rup: function() {
    $(this.id + ' li:first').appendTo('ul'+this.id);
  },
  
  rdn: function () {
      $(this.id + ' li:last').prependTo('ul'+this.id);
  },
      
  swapper: function () {
      if (this.length() < 2)
        return;
      var oldlast = $(this.id + ' li:last').detach();
      $(this.id + ' li:last').before(oldlast);
      this.scroll_to_bottom();
  },
      
  dup: function () {
      if (this.length() == 0)
        return;
      var dup = $(this.id + ' li:last').clone();
      $(this.id).append(dup);
      this.scroll_to_bottom();
  },
  
  doenter: function() {
    var val = $(this.id).siblings().find('input#current').val();
    var o;
    try {
      o = eval(val)
    }
    catch(err)
    {
      // Could check for err.message e.g. "sdf is not defined"
      o = val;
    }
    this.pusher(o);
  },

  length: function () {
    return $(this.id + ' li').length;
  }    
}
    
