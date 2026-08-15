function CanvasDemos(canvas)
{
  var myCanvas = canvas;

  // Private Methods ------------------------
  var demo1 = function(){
    
    // Check the element is in the DOM and the browser supports canvas
    if (myCanvas.getContext) {
      // Initialise a 2-dimensional drawing context
      var context = myCanvas.getContext('2d');
      var ctx = context;
      
      //Canvas commands go here
      
      // Create the yellow face
      context.strokeStyle = "#000000";
      context.fillStyle = "#1de58e";
      context.beginPath();
      //context.arc(100,100,50,0,Math.PI*2,true);
      context.arc(75, 75, 10, 0,Math.PI*2,true);
      context.closePath();
      context.stroke();
      context.fill();
      
      //the rectangle is half transparent
      ctx.fillStyle = "rgba(255, 255, 0, .5)"
      ctx.beginPath();
      ctx.rect(15, 150, 120, 120);
      ctx.closePath();
      ctx.fill();			
    }
  }

  var demo8 = function () {
    // Make image objects
    var sparrow = new Image();
    sparrow.src = "../images/blueSparrowLogo128.png";
    var number = new Image();
    number.src = "../images/number.png";
    
    // Initialize canvas manager
    //var canvas = document.getElementById("myCanvas");   
    var canvasManager = new blueSparrow.CanvasManager(myCanvas, true, true);
    
    // Make a rotating square sprite using a custom drawing function
    // The square is UI enabled
    var square = new blueSparrow.Sprite("square", 300, 200, 300, 300, null);
    square.setZOrder(1);
    square.rotation = 0;
    square.scale = 0.75;
    square.customDraw = function() {
	this.drawRectangleOutline("#cccccc", "#000000", 2, 0.8, 1);
    };
    square.addAction(new blueSparrow.Action("rotation", 360, 30,
	blueSparrow.easingFunction("linear"), blueSparrow.ACTION_REPEAT));
    square.uiEnabled = true;
    square.draggable = true;
    square.scheduled = true;   
    canvasManager.addSprite(square);
    
    // Add children to the square
    var N = 50, i, sprite;
    for (i = 0; i < N; i++) {
	sprite = new blueSparrow.Sprite("number-" + i, 150, 150, 32, 32, number);
	sprite.setSpeed(Math.round(Math.random() * 100) + 10);
	sprite.setDirection(Math.round(Math.random() * 360));
	sprite.scheduled = true;
	sprite.bounceOffParent = true;
	sprite.availableImageFrames = 10;
	sprite.imageFrameInterval = 0.5 + Math.random() * 2;
	square.addChild(sprite);
    }
    var sparrow = new blueSparrow.Sprite("sparrow", 100, 100, 128, 128, sparrow);
    sparrow.addAction(new blueSparrow.Action("rotation", -360, 15,
	blueSparrow.easingFunction("linear"), blueSparrow.ACTION_REPEAT));
    sparrow.scheduled = true;
    sparrow.opacity = 0.8;
    square.addChild(sparrow);

    // Initialize and start scheduler
    var scheduler = new blueSparrow.Scheduler(canvasManager, 60);
    scheduler.start();
  }
  
  // Public Methods -------------------------

  var init = function() {
  }

  // Return interface -----------------------

  return {
    init:init,
    demo1:demo1,
    demo8:demo8
  }

};
  