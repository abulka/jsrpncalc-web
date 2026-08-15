(function(window, document, undefined) {
    
    var library = {
        // Scrolling direction
        SCROLL_LEFT         : 1,
        SCROLL_RIGHT        : -1,
        
        // At end behaviours (ignored in action sequence)       
        ACTION_NONE         : 1,  // No action
        ACTION_DELETE       : 2,  // Delete sprite
        ACTION_REPEAT       : 3,  // Reset elapsed time and repeat action
        ACTION_OSCILLATE    : 4,  // Reset elapsed time, reverse parameters and repeat
        
        // Debugging messages
        DEBUG : false,
        
        // Assert
        assert : function(expr, msg) {
            if (!expr) {
                alert("Assertion error: " + msg);
            }
        },
        
        // Logging function
        log : function(msg) {
            if (library.DEBUG) {
                console.log(msg);
            }
        },
        
        // Image preloader
        ImagePreloader : function(completionFunction) {
        },
               
        // Sprite
        Sprite : function(tag, x, y, width, height, image, imageWidth) {
            // Tag
            this.tag = tag;
            
            // Coordinates of center point with respect to top left of parent
            this.x = x;
            this.y = y;
                        
            // Dimensions
            this.width = width;
            this.height = height;
            this.halfWidth = (this.width / 2) | 0;
            this.halfHeight = (this.height / 2) | 0;
            this.hasCircularShape = false;
            
            // Anchor point
            this.anchorX = 0.5;
            this.anchorY = 0.5;
            
            // Top left relative to anchor point
            this.topLeftX = - ((this.width * this.anchorX) | 0);
            this.topLeftY = - ((this.height * this.anchorY) | 0);
                        
            // Visibility
            this.visible = true;
            
            // Doomed (will be deleted during next update)
            this.doomed = false;    // Use setDoomed to doom
            
            // Rotation
            this.rotation = 0;  // Degrees clockwise
            
            // Scale
            this.scale = 1;
            
            // Positional movement
            this.setSpeed(0);
            this.setDirection(0);
            this.positionAutoUpdate = true;           
            this.bounceOffParent = false;
            
            // z order (use setZorder to change)
            this.zOrder = 0;
            this.highestChildrenZOrder = 0;
            
            // Opacity
            this.opacity = 1;
            
            // Image and frames
            this.image = image;
            this.imageWidth = imageWidth;
            if (this.image != null) {
                this.availableImageFrames = 1;
            } else {
                this.availableImageFrames = 0;
            }
            this.imageFrameInterval = 0; // s, 0 = no frame update
            this.imageFrame = 0;
            this.availableImageFrames = 1;
            
            // Horizontal scrolling
            this.scrollingSpeed = 0;
            this.scrollingDirection = 0;
            this.scrollingOffset = 0;
            
            // Text
            this.text = "";
            this.textFont = "";
            this.textFillStyle = "";
            this.textStrokeStyle = "";
            this.textStrokeWidth = 0;
            this.textCentered = true;
            
            // Scheduling and updating
            this.scheduled = false;            
            
            // UI
            this.mouseControlled = false;
            this.mouseDownScalingFactor = 1.2;
            this.uiEnabled = false;
            this.draggable = false;
            this.blowUpOnSelection = false;
            
            // Children
            this.children = [];
            this.childrenNeedCleanup = false;
            
            // Actions
            this.actions = [];
            this.hasPositionAction = false;
            this.hasImageFrameAction = false;           
        },
        
        // Action
        Action : function(parameter, finalValue, duration, easingFunction,
                          atEndBehaviour) {
            this.parameter = parameter;
            this.finalValue = finalValue;
            this.elapsed = 0;
            this.duration = duration; // s
            this.easingFunction = easingFunction;
            this.atEndBehaviour = atEndBehaviour;
            this.ended = false;
        },
                
        // Action sequence
        ActionSequence : function(actionList, atEndFunction) {
            this.actionList = actionList;
            this.atEndFunction = atEndFunction;
            this.currentActionIndex = 0;
            this.ended = false;
        },
        
        // Easing functions
        easingFunction: function (type, coefficient) {
            if (type === "linear") {
                return function(t) {
                    return t;
                };
            } else if (type === "easeIn") {
                return function(t) {
                    return Math.pow(t, coefficient);
                };
            } else if (type === "easeOut") {
                return function(t) {
                    return 1 - Math.pow(1 - t, coefficient);
                };
            } else if (type === "easeInOut") {
                return function(t) {
                    return t < 0.5 ? Math.pow(2 * t, coefficient) / 2
                                   : 1 - Math.pow(2 - 2 * t, coefficient) / 2;
                };
            } else {
                return function(t) {
                    return 0;
                }
            }
        },
        
        // CanvasManager
        CanvasManager : function(canvas, showOutline, showFPS) {
            this.canvas = canvas;
            this.canvas.onselectstart = function () { return false; };
            this.context = this.canvas.getContext("2d");
            this.showOutline = showOutline;
            this.showFPS = showFPS;
            this.currentFrameCount = 0;
            this.newFrameCount = 0;
            this.mouseIsDown = false;
            this.initialMouseDown = true;
            this.currentMouseControlledSprite = null;
            // Make root sprite
            this.root = new library.Sprite("root", (this.canvas.width / 2) | 0,
                (this.canvas.height / 2) | 0, this.canvas.width,
                this.canvas.height, null);
            this.root.canvasManager = this;
            this.root.canvas = this.canvas;
            this.root.context = this.context;
            this.root.parent = null;
            this.root.scheduled = true;
            this.root.customDraw = function() {
                this.context.clearRect(this.topLeftX, this.topLeftY,
                                       this.width, this.height);
                if (this.canvasManager.showOutline) {
                    this.drawRectangleOutline("#ffffff", "#000000", 0);
                }
            };
            // Add event listeners
            this.canvas.addEventListener("mousedown", (function(that) {
                return function(e) {
                    that.mouseDown(e);
                };
            })(this), false);
            
            document.body.addEventListener("mouseup", (function(that) {
                return function(e) {
                    that.mouseUp(e);
                };
            })(this), false);

            this.canvas.addEventListener("mousemove", (function(that) {
                return function(e) {
                    that.mouseXY(e);
                };
            })(this), false);

            this.canvas.addEventListener("touchstart", (function(that) {
                return function(e) {
                    that.touchDown(e);
                };
            })(this), false);

            this.canvas.addEventListener("touchmove", (function(that) {
                return function(e) {
                    that.touchDown(e);
                };
            })(this), true);
           
            this.canvas.addEventListener("touchend", (function(that) {
                return function(e) {
                    that.touchUp(e);
                };
            })(this), false);


            document.body.addEventListener("touchcancel", (function(that) {
                return function(e) {
                    that.touchup(e);
                };
            })(this), false);
        },
        
        // Scheduler
        Scheduler : function(canvasManager, fps) {
            this.canvasManager = canvasManager;
            this.fps = fps;
            this.canvasManager.currentFrameCount = 0;
            this.canvasManager.newFrameCount = 0;
            this.lastUpdateTime = 0;
        }
    };
    
    
    // ImagePreloader prototype
    library.ImagePreloader.prototype = {
        // Preload images
        // imageSpecification = { name: name, source: source }
        preloadImages : function(imageSpecifications, allCompleteFunction) {
            var i;
            this.imageDictionary = {};
            this.allCompleteFunction = allCompleteFunction;
            this.imagesToLoad = imageSpecifications.length;
            this.imagesLoaded = 0;
            for (i = 0; i < this.imagesToLoad; i++) {
                this.loadImage(imageSpecifications[i].name, imageSpecifications[i].source);
            }
        },
        
        // Load image
        loadImage : function(name, source) {
            var image = new Image();
            image.src = source;
            var that = this;
            image.onload = function() {
                that.imageDictionary[name] = image;
                if (++that.imagesLoaded == that.imagesToLoad) {
                    that.allCompleteFunction();
                }
            }
        }
    };
    
    
    // Sprite prototype
    library.Sprite.prototype = {        
        // Return current bounding box
        boundingBox : function() {
            var ct, st,
                hct, wct, hst, wst,
                x1, y1,
                theta;
                        
            if (this.rotation == 0 || this.hasCircularShape) {
                return {
                    xMin : (this.x - this.scale * this.anchorX * this.width) | 0,
                    xMax : (this.x + this.scale * this.anchorX * this.width) | 0,
                    yMin : (this.y - this.scale * this.anchorY * this.height) | 0,
                    yMax : (this.y + this.scale * this.anchorY * this.height) | 0 };
            } else {
                theta = this.rotation * Math.PI / 180;
                ct = Math.cos(theta);
                st = Math.sin(theta);
                
                x1 = this.topLeftX * this.scale * ct -
                    this.topLeftY * this.scale * st;
                y1 = this.topLeftX * this.scale * st +
                    this.topLeftY * this.scale * ct;
                
                library.log("x1 = " + x1 + ", y1 = " + y1);
                
                hct = this.height * this.scale * ct;
                wct = this.width  * this.scale * ct;
                hst = this.height * this.scale * st;
                wst = this.width  * this.scale * st;
                               
                if (this.rotation < 90 ) {
                    return { xMin : this.x + x1 - hst,
                             xMax : this.x + x1 + wct,
                             yMin : this.y + y1,
                             yMax : this.y + y1 + hct + wst };
                } else if (this.rotation < 180) {
                    return { xMin : this.x + x1 - hst + wct,
                             xMax : this.x + x1,
                             yMin : this.y + y1 + hct,
                             yMax : this.y + y1 + wst };
                } else if (this.rotation < 270) {
                    return { xMin : this.x + x1 + wct,
                             xMax : this.x + x1 - hst,
                             yMin : this.y + y1 + wst + hct,
                             yMax : this.y + y1 };
                } else {
                    return { xMin : this.x + x1,
                             xMax : this.x + x1 + wct - hst,
                             yMin : this.y + y1 + wst,
                             yMax : this.y + y1 + hct };
                }              
            }
        },
            
        // Check whether point is within bounding box of sprite
        isPointWithin : function(x, y) {
            var bb = this.boundingBox();
            return x >= bb.xMin && x <= bb.xMax && y >= bb.yMin && y <= bb.yMax;
        },
                       
        // Set speed (pixels/s)
        setSpeed : function(speed) {
            this.speed = speed;
            this.vx = this.speed * Math.cos(this.direction * Math.PI / 180);
            this.vy = this.speed * Math.sin(this.direction * Math.PI / 180);
        },

        // Set direction (degrees)
        setDirection : function(direction) {
            this.direction = direction % 360;
            this.vx = this.speed * Math.cos(this.direction * Math.PI / 180);
            this.vy = this.speed * Math.sin(this.direction * Math.PI / 180);
        },
        
        // Set z order
        setZOrder : function(zOrder) {
            this.zOrder = zOrder;
            if (this.parent != null) {
                this.parent.childrenNeedCleanup = true;
            }
        },
        
        // Bring to front
        bringToFront : function() {
            if (this.parent != null) {
                this.setZOrder(this.parent.highestChildrenZOrder + 1);
            }
        },
        
        // Mark sprite as doomed
        setDoomed : function() {
            library.assert(this.parent != null, "Cannot remove root sprite");
            this.doomed = true;
            this.parent.childrenNeedCleanup = true;
        },           
        
        // Add child
        addChild : function(sprite) {
            sprite.parent = this;
            sprite.canvas = this.canvas;
            sprite.context = this.context;
            this.children.push(sprite);
            this.childrenNeedCleanup = true;
        },
                        
        // Add action or action sequence
        addAction : function(action) {
            action.initialValue = this[action.parameter];
            action.deltaValue = action.finalValue - action.initialValue;
            this.actions.push(action);
        },
        
        // Remove all actions
        removeAllActions : function() {
            this.actions = [];
        },
        
        // Update
        update : function(elapsed) {
            var nbrOfActions = this.actions.length,
                a, i, len,
                newActions = [],
                newChildren = [];
            // Do not apply any updates if sprite is not scheduled
            if (!this.scheduled) {
                return;
            }
            // Perfom actions and action sequences
            for (i = 0; i < nbrOfActions && !this.doomed; i++) {
                a = this.actions[i];
                if (a.hasOwnProperty("actionList")) {
                    this.updateActionSequence(a, elapsed);
                } else {
                    this.updateAction(a, elapsed, false);                    
                }
            }
            // Remove ended actions and action sequences
            for (i = 0; i < nbrOfActions; i++) {
                if (!this.actions[i].ended) {
                    newActions.push(this.actions[i]);
                }
            }
            this.actions = newActions;
            // Update position
            if (this.positionAutoUpdate && this.speed != 0 &&
                !this.mouseControlled && !this.hasPositionAction) {
                this.updatePosition(elapsed);
            }
            // Update scrolling
            if (this.scrollingSpeed > 0) {
                this.updateScrolling(elapsed);
            }
            // Update frame (only if interval > 0 and sprite has no frame action)
            if (this.imageFrameInterval !== 0 && !this.hasImageFrameAction) {
                this.updateImageFrame(elapsed);
            }
            // Do custom update if applicable
            if (this.customUpdate) {
                this.customUpdate(elapsed);
            }           
            // Do cleanup of children if necessary
            if (this.childrenNeedCleanup) {
                for (i = 0, len = this.children.length; i < len; i++) {
                    sprite = this.children[i];
                    if (sprite.doomed) {
                        delete sprite;
                    } else {
                        newChildren.push(sprite);
                    }
                }
                this.children = newChildren;
                if (this.children.length > 0) {
                    this.children.sort(function(a, b) {
                        return a.zOrder - b.zOrder;
                    });
                    this.highestChildrenZOrder =
                        this.children[this.children.length - 1].zOrder;
                } else {
                    this.highestChildrenZOrder = 0;
                }
                this.childrenNeedCleanup = false;
            }                     
            // Update all children
            for (i = 0, len = this.children.length; i < len; i++) {
                sprite = this.children[i];
                sprite.update(elapsed);
            }
        },
        
        // Update action
        updateAction : function(action, elapsed, withinActionSequence) {
            var parameter = action.parameter,
                t, swap;
            action.elapsed += elapsed;
            t = action.elapsed / (action.duration * 1000);
            this.hasPositionAction = false;
            this.hasImageFrameAction = false;               
            if (t < 1.0) {
                // Update action parameter
                if (parameter === "x" || parameter === "y") {
                    this.hasPositionAction = true;
                } else if (parameter === "imageFrame") {
                    this.hasImageFrameAction = true;
                }
                this[parameter] = action.initialValue +
                    action.easingFunction(t) * action.deltaValue;
            } else {
                // Action ends
                this[parameter] = action.finalValue;
                if (!withinActionSequence) {
                    switch (action.atEndBehaviour) {
                        case library.ACTION_DELETE :
                            // Mark sprite as doomed
                            this.doomed = true;
                            break;
                        case library.ACTION_REPEAT :
                            // Repeat action
                            this[parameter] = action.initialValue;
                            action.elapsed = 0;
                            break;
                        case library.ACTION_OSCILLATE :
                            // Reverse initial and final values and repeat
                            swap = action.finalValue;
                            action.finalValue = action.initialValue;
                            action.initialValue = swap;
                            action.deltaValue = action.finalValue -
                                action.initialValue;
                            action.elapsed = 0;
                            break;
                        case library.ACTION_NONE :
                            // Mark as ended
                            action.ended = true;                            
                            break;
                        default :
                            // Mark as ended
                            action.ended = true;                            
                            break;
                    }
                }
            }
        },
        
        // Update action sequence
        updateActionSequence : function(sequence, elapsed) {
            var action = sequence.actionList[sequence.currentActionIndex];
            this.updateAction(action, elapsed, true);
            if (action.ended) {
                sequence.currentActionIndex++;
                if (sequence.currentActionIndex == sequence.actionList.length) {
                    sequence.ended = true;
                    sequence.atEndFunction(this);
                }
            }
        },
        
        // Update position
        updatePosition : function(elapsed) {
            this.x += this.vx * elapsed / 1000;
            this.y += this.vy * elapsed / 1000;
            
            if (this.bounceOffParent) {
                if (this.x > this.parent.width -
                    (this.halfWidth * this.scale) && this.vx > 0) {
                    this.vx = -this.vx;
                }
                if (this.x < this.halfWidth * this.scale && this.vx < 0) {
                    this.vx = -this.vx;
                }
                if (this.y > this.parent.height -
                    (this.halfHeight * this.scale) && this.vy > 0) {
                    this.vy = -this.vy;
                }
                if (this.y < this.halfHeight * this.scale && this.vy < 0) {
                    this.vy = -this.vy;
                }
            }
        },
        
        // Update scrolling
        updateScrolling: function(elapsed) {
            this.scrollingOffset += this.scrollingDirection * this.scrollingSpeed * elapsed / 1000;
        },
        
        // Update image frame
        updateImageFrame : function(elapsed) {
            this.imageFrame += elapsed / (this.imageFrameInterval * 1000);
        },
        
        // Draw
        draw : function() {
            var c, sprite, scrollPointX, sourceWidth, wrapAround;

            this.context.save();
            
            // Draw sprite if it is visible
            if (this.visible) {
                // Do transformations
                if (this.parent != null) {
                    this.context.translate((this.parent.topLeftX + this.x) | 0,
                                           (this.parent.topLeftY + this.y) | 0);
                } else {
                    this.context.translate(this.x | 0, this.y | 0);
                }                    
                this.context.rotate(this.rotation / 180 * Math.PI);
                this.context.scale(this.scale, this.scale);
                this.context.globalAlpha = this.opacity;
                // Draw image if applicable
                if (this.image !== null) {
                    if (this.scrollingSpeed > 0) {
                        // Perform horizontal scrolling
                        scrollPointX = ((this.scrollingOffset | 0) % this.imageWidth +
                                        this.imageWidth) % this.imageWidth;
                        if (this.imageWidth - scrollPointX >= this.width) {
                            sourceWidth = this.width;
                            wrapAround = false;
                        } else {
                            sourceWidth = this.imageWidth - scrollPointX;
                            wrapAround = true;
                        }
                        this.context.drawImage(this.image, scrollPointX,
                            0, sourceWidth, this.height,
                            this.topLeftX, this.topLeftY,
                            sourceWidth, this.height);
                        if (wrapAround) {
                            this.context.drawImage(this.image, 0,
                                0, this.width - sourceWidth, this.height,
                                this.topLeftX + sourceWidth, this.topLeftY,
                                this.width - sourceWidth, this.height);
                        }
                    } else if (this.imageFrameInterval > 0) {
                        // Draw current frame
                        this.context.drawImage(this.image,
                            ((this.imageFrame | 0) % this.availableImageFrames) *
                                this.width,
                                0, this.width, this.height,
                                this.topLeftX, this.topLeftY,
                                this.width, this.height);                        
                    } else {
                        // Draw image
                        this.context.drawImage(this.image, this.topLeftX, this.topLeftY);
                    }
                }
                // Draw text if applicable
                if (this.text != "") {
                    this.context.font = this.textFont;
                    this.context.fillStyle = this.textFillStyle;
                    this.context.strokeStyle = this.textStrokeStyle;
                    this.context.lineWidth = this.textStrokeWidth;
                    if (this.textCentered) {
                        this.context.textAlign = "center";
                        this.context.textBaseline = "center";
                    } else {
                        this.context.textAlign = "left";
                        this.context.textBaseLine = "top";
                    }
                    this.context.fillText(this.text, 0, 0);
                    if (this.textStrokeWidth > 0) {
                        this.context.strokeText(this.text, 0, 0);
                    }
                }
                // Do additional custom drawing if applicable
                if (this.customDraw) {
                    this.customDraw();
                }               
            }
                
            // Draw all children
            for (c in this.children) {
                sprite = this.children[c];
                sprite.draw();
            }
            
            this.context.restore();
        },
        
        // Draw rectangle outline
        drawRectangleOutline : function(fillStyle, strokeStyle, lineWidth,
                                        fillOpacity, strokeOpacity) {
            this.context.fillStyle = fillStyle;
            this.context.strokeStyle = strokeStyle ? strokeStyle : "#000000";
            this.context.lineWidth = lineWidth ? lineWidth : 1;
            this.context.globalAlpha = fillOpacity ? fillOpacity : 1;
            this.context.fillRect(this.topLeftX, this.topLeftY,
                                  this.width, this.height);
            
            if (lineWidth > 0) {
                this.context.globalAlpha = strokeOpacity ? strokeOpacity : 1;
                this.context.strokeRect(this.topLeftX, this.topLeftY,
                                        this.width, this.height);
            }
        },
        
        // Mouse/touch down event
        onMouseDown : function(x, y)  {
            this.mouseControlled = true;
            this.mouseOffsetX = x - this.x;
            this.mouseOffsetY = y - this.y;
            if (this.customOnMouseDown) {
                this.customOnMouseDown(x, y);
            } else {
                // Default action: bring to front and blow up a little if applicable
                this.bringToFront();
                if (this.blowUpOnSelection) {
                    this.originalScale = this.scale;
                    this.addAction(new library.Action("scale",
                        this.scale * this.mouseDownScalingFactor, 0.2,
                        library.easingFunction("easeOut", 3), library.ACTION_NONE));
                }
            }
        },
        
        // Mouse/touch up event 
        onMouseUp : function(x, y)  {
            this.mouseControlled = false;
            if (this.customOnMouseUp) {
                this.customOnMouseUp(x, y);
            } else if (!this.customOnMouseDown) {
                // Default action: restore original scale if applicable
                if (this.blowUpOnSelection) {
                    this.addAction(new library.Action("scale",
                        this.originalScale, 0.2,
                        library.easingFunction("easeOut", 3), library.ACTION_NONE));
                }
            }
        },
        
        // Mouse/touch move event
        onMouseMove : function(x, y) {
            if (this.customOnMouseMove) {
                this.customOnMouseMove(x, y);
            } else if (this.draggable) {
                this.x = x - this.mouseOffsetX;
                this.y = y - this.mouseOffsetY;
            }
        }
    };
    
    // CanvasManager prototype
    library.CanvasManager.prototype = {       
        // Add a (top level) sprite
        addSprite : function(sprite) {
            this.root.addChild(sprite);
        },
                
        // Update
        update : function(elapsed) {
            this.root.update(elapsed);
        },
        
        // Draw
        draw : function() {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.root.draw();
            if (this.showFPS) {
                this.context.font = "20px verdana";
                this.context.fillStyle = "#666666";
                this.context.fillText("FPS = " + this.currentFrameCount,
                    this.canvas.width - 110, 20);                
            }
        },

        // Mouse down event
        mouseDown : function(e) {
            this.mouseIsDown = true;
            this.mouseXY(e);
        },
        
        // Mouse up event
        mouseUp : function(e) {
            this.mouseIsDown = false;
            this.mouseXY(e);
        },

        // Touch down event
        touchDown : function(e) {
            this.mouseIsDown = true;
            this.touchXY();
        },
        
        // Touch up event
        touchUp : function(e) {
            this.mouseIsDown = false;
            this.touchXY();
        },
        
        // Mouse event
        mouseXY : function(e) {
            e = e || window.event;
            this.handleMouseOrTouchEvent(e.pageX - this.canvas.offsetLeft,
                e.pageY - this.canvas.offsetTop);
        },
        
        // Touch event
        touchXY : function(e) {
            e = e || window.event;
            e.preventDefault();
            this.handleMouseOrTouchEvent(e.pageX - this.canvas.offsetLeft,
                e.pageY - this.canvas.offsetTop);
        },
        
        // Handle mouse/touch event for top level sprites
        handleMouseOrTouchEvent : function(x, y) {
            var c, sprite, len, children, i,
                spriteList = [];
            library.log("Mouse = " + x + ", " + y +
                        ", mouseDown = " + (this.mouseIsDown ? "yes" : "no"));
            if (this.mouseIsDown) {
                // Mouse is down
                if (this.currentMouseControlledSprite == null) {
                    if (this.initialMouseDown) {
                        this.initialMouseDown = false;
                        // Determine which sprite (if any) was clicked
                        children = this.root.children;
                        for (c in children) {
                            spriteList.push(children[c]);
                        }
                        len = spriteList.length;
                        for (i = len - 1; i >= 0; i--) {
                            sprite = spriteList[i];
                            if (sprite.uiEnabled && sprite.isPointWithin(x, y) &&
                                    !sprite.hasPositionAction) {
                                this.currentMouseControlledSprite = sprite;
                                library.log("New current sprite activated");
                                this.currentMouseControlledSprite.onMouseDown(x, y);
                                break;
                            }
                        }
                    } else {
                        // Nothing to do (ignore mouse move when no current sprite)
                        // library.log("Mouse move ignored");
                    }
                } else {
                    library.log("Move current sprite");
                    // Move current mouse controlled sprite
                    this.currentMouseControlledSprite.onMouseMove(x, y);
                }
            } else {
                // Mouse is up
                this.initialMouseDown = true;
                if (this.currentMouseControlledSprite == null) {
                    // Nothing to do (ignore mouse up when no current sprite)
                    library.log("Mouse up ignored");
                } else {
                    this.currentMouseControlledSprite.onMouseUp(x, y);
                    this.currentMouseControlledSprite = null;
                }
            }
        }    
    };
    
    // Scheduler prototype
    library.Scheduler.prototype = {
        // Start
        start : function() {
            var that = this;
            this.lastUpdateTime =  new Date().getTime();
            this.t1 = setInterval(function() {
                var currentTime = new Date().getTime(),
                    elapsed = currentTime - that.lastUpdateTime;
                that.canvasManager.update(elapsed);
                that.lastUpdateTime = currentTime;
                that.canvasManager.draw();
                that.canvasManager.newFrameCount++;
            }, Math.floor(1000 / this.fps));
            if (this.canvasManager.showFPS) {
                this.t2 = setInterval(function() {
                    that.canvasManager.currentFrameCount =
                        that.canvasManager.newFrameCount;
                    that.canvasManager.newFrameCount = 0;
                }, 1000);                
            } else {
                this.t2 = null;
            }
        },
        
        // Stop
        stop : function() {
            clearInterval(this.t1);
            if (this.t2) {
                clearInterval(this.t2);
            }
        }
    }
    
    window.blueSparrow = library;
    
})(window, window.document);