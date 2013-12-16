const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW = 38;
const DOWN_ARROW = 40;
const SPACEBAR = 32;

// GLOBAL VARIABLE UP THE WAZOO
  var leftArrowDown = false;
  var rightArrowDown = false;
  var upArrowDown = false;
  var downArrowDown = false;
  var spacebarDown = false;

var loader = new AssetLoader();
var g_player = null;
var g_selectedPower = null;
var g_level = 0;

PhysicsConstants.groundFriction = 6;
PhysicsConstants.groundAcceleration = 12;

// TODO add level bounds, stop scrolling when you get there

function Billboard() {
    this.img = loader.add("title_screen.jpg");
}
Billboard.prototype = {
    type: "billboard",
    draw: function(ctx) {
        ctx.drawImage(this.img, 0, 0);
    }
};
Billboard.prototype.__proto__ = new Box();
// TODO should go in background objects, not foreground..?


function Apple() {
   this.mobInit(loader, "apple.png", false);
}
Apple.prototype = {
  type: "apple",
  classification: "powerup",
  // TODO on get apple: start next level.

  onMobTouch: function(mob, intercept) {
    if (mob.type == "player") {
        // Play crazy fanfare!
        // Start next level!
        g_level ++;
        if (g_level >= all_level_data.length) {
            g_level = 0; // if we're out of levels, loop back to beginning
        }
        TheWorld.loadFromString(all_level_data[g_level], loader, function() {
            doSpecialLevelStuff();
            g_player.vx = 0;
            g_player.vy = 0;
            g_player.left = TheWorld.startX;
	    g_player.top = TheWorld.startY;
            TheWorld.addForegroundObject(g_player);

        });
    }
    return false;
  }
};
Apple.prototype.__proto__ = new Mob(); // Multi-inherit from mob and powerup??
ConstructorRegistry.register(Apple);


function Mouse() {
    this.mobInit(loader, "mouse.png", true);
}
Mouse.prototype = {
    type: "mouse",
    width: 60,
    height: 25,
    selectSprite: function() {
        if (this.lastMoved == GOING_LEFT) {
            return {x: 0, y: 0};
        } else {
            return {x: 0, y: 1};
        }
    }
};
Mouse.prototype.__proto__ = new Enemy(); // Multi-inherit from mob and powerup??
ConstructorRegistry.register(Mouse);


function PowerObject() {
}
PowerObject.prototype = {
    type: "power_object",
    name: "POW",
    draw: function(ctx) {
	ctx.strokeStyle = "black";
        ctx.font="14pt arial";
        if (g_selectedPower && this.name == g_selectedPower.name) {
            ctx.fillStyle = "yellow";
            ctx.fillRect(this.left, this.top, 64, 64);
        }
	ctx.strokeRect(this.left, this.top, 64, 64);
        ctx.strokeText(this.name, this.left + 5, this.top +32);
    },

    onMobTouch: function(mob, intercept) {
        if (mob.type == "player") {
            g_selectedPower = powers[this.name];
        }
        return false;
    }
};
PowerObject.prototype.__proto__ = new Box();
ConstructorRegistry.register(PowerObject);

function SliceRect() {
    this.img = loader.add("sprite_cut.png");
    this.time = 0;
}
SliceRect.prototype = {
    resetTime: function() {
        this.time = 0;
    },
    addTime: function(time) {
        this.time += time;
    },
    draw: function(ctx) {
        // each 64 by 16
        if (this.time < 480 && this.width > 0) {
            var offsetX = 0;
            var offsetY = Math.floor(this.time / 160);
            var spriteOffsetX = this.width * offsetX;
            var spriteOffsetY = this.height * offsetY;
            console.log("Drawing slice rect: " + this.left + ", " + this.top + ", " + 
                        this.width + ", " + this.height);
            ctx.drawImage(this.img, spriteOffsetX, spriteOffsetY, this.width, this.height,
		          this.left, this.top, this.width, this.height);
        }
    },

    onMobTouch: function(mob, intercept) {
        if (mob.type != "player") {
            mob.damage(1);
        }
    }
}
SliceRect.prototype.__proto__ = new Box();


function FreezyRect() {
}
FreezyRect.prototype = {
    draw: function(ctx) {
        ctx.strokeStyle = "lightblue";
        ctx.strokeRect(this.left, this.top, this.width, this.height);
    },
    onMobTouch: function(mob, intercept) {
        if (mob.type != "player") {
            mob.die();
            var frozenMob = new FrozenMob();
            frozenMob.setMob(mob);
            frozenMob.boxInit(mob.left, mob.top, mob.width, mob.height);
            frozenMob.vx = 0;
            frozenMob.vy = 0;
            TheWorld.addForegroundObject(frozenMob);
        }
    }
}
FreezyRect.prototype.__proto__ = new Box();


function FrozenMob() {
}
FrozenMob.prototype = {
    setMob: function(mob) {
        this.mob = mob;
    },

    draw: function(ctx) {
        ctx.fillStyle = "lightblue";
        ctx.fillRect(this.left, this.top, this.width, this.height);
        if (this.mob && this.mob.img) {
            var offsets = this.mob.selectSprite();
            var spriteOffsetX = this.width * offsets.x;
            var spriteOffsetY = this.height * offsets.y;
            ctx.drawImage(this.mob.img, spriteOffsetX, spriteOffsetY, this.width, this.height,
		          this.left, this.top, this.width, this.height);
        }
    },

    onMobTouch: function(mob, intercept) {
        // can be pushed around
        mob.stopAt(intercept);
        if (intercept.side == "left") {
            this.vx += 5;
        }
        if (intercept.side == "right") {
            this.vx -= 5;
        }
        return true;
    },


    substantial: function(edge) {
        return true;
    },

  getFrictionCoefficient: function() {
      return 0.2; // same as iceBlock
  },

  getAccelerationCoefficient: function() {
      return 1.0; // same as iceBlock
  }

} // TODO Really wants to inerhit from Mob and Platform
FrozenMob.prototype.__proto__ = new Mob();



function adjustToScreen() {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    TheWorld.canvasWidth = screenWidth * 0.9;
    TheWorld.canvasHeight = screenHeight * 0.9;

    $("#game-canvas").attr("width", TheWorld.canvasWidth);
    $("#game-canvas").attr("height", TheWorld.canvasHeight);
}

function bannerText(text) {
  var ctx = $("#game-canvas")[0].getContext("2d");
  ctx.font="36pt arial";
  ctx.fillStyle = "black";
  //var textWidth = ctx.measureText(text);
  ctx.fillText(text, 100, TheWorld.canvasHeight/2 - 50);
}

// Make a level dominated by one object, which is a ladder painted with the
// title scren image. The powerups are all here.
// Your power is "select" and if you press it when touching a powerup
// then you start level 1 and gain that power.


var StatusBar = {
  timeString: "",
  updateTimer: function(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    if (s < 10) {
	s_str = "0" + s;
    } else {
	s_str = s;
    }
    this.timeString = m + ":" + s_str;
  },

  draw: function(ctx, player) {
    // inside the top left of the canvas, draw:
    // elapsed time
    // collected trinkets
    // hearts
    var maxHP = player.maxHitPoints;
    var hp = player.hitPoints;
    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(20, 20);
    ctx.arc(30, 20, 10, Math.PI, 0, false);
    ctx.arc(50, 20, 10, Math.PI, 0, false);
    ctx.lineTo(40, 40);
    ctx.fillStyle = "black";
    ctx.fill();

    if (hp >= 1) {
	ctx.beginPath();
	ctx.moveTo(40, 38);
	ctx.lineTo(22, 20);
	ctx.arc(30, 20, 8, Math.PI, 0, false);
	if (hp >= 2) {
	    ctx.arc(50, 20, 8, Math.PI, 0, false);
	    ctx.lineTo(40, 38);
	}
	ctx.fillStyle = "red";
	ctx.fill();
    }

    ctx.font="18pt arial";
    ctx.fillStyle = "black";
    //var textWidth = ctx.measureText(text);
    //ctx.fillText(getLocalString("_time") + ": " + this.timeString, 80, 30);
      if (g_level > 0) {
          ctx.fillText("LEVEL " + g_level, 80, 30);
      }

    //ctx.fillText(getLocalString("_useless_trinkets") + ": " + player.numTrinkets, 240, 30);
      if (g_selectedPower) {
      ctx.fillText("SPACEBAR: " + g_selectedPower.name, 240, 30);
      }
  }
};


var powers = {
    JUMP: {"name": "JUMP",
           "sprite": 1,
           onActivate: function(player, elapsed) {
               player.jump(elapsed);
           },

           onDeactivate: function(player, elapsed) {
               player.stopJumping(elapsed);
           }
          },
    
    SUCK: {"name": "SUCK",
           "sprite": 2,
           onActivate: function(player, elapsed) {
               // suck:
               if (!player.suckForce) {
                   player.suckForce = new ForceField();
                   player.suckForce.boxInit(0, 0, 0, 0);
                   TheWorld.addForceField(player.suckForce);
               }
               
               if (player.lastMoved == GOING_LEFT) {
                   // suck force is to my left and sucks right:
                   player.suckForce.boxInit(player.left - 257,
                                            player.top - 32,
                                            256,
                                            128);
                   player.suckForce.setVector(3, 0);
               } else { // going right, or haven't moved yet -
                   // the suck force is to my right and sucks left
                   player.suckForce.boxInit(player.right + 1,
                                            player.top - 32,
                                            256,
                                            128);
                   player.suckForce.setVector(-3, 0);
               }
           },

           onDeactivate: function(player, elapsed) {
               if (player.suckForce) {
                   TheWorld.removeForceField(player.suckForce);
               }
               player.suckForce = null;
           }
          },

    FREEZE: {"name": "FREEZE",
             "sprite": 2,
             onActivate: function(player, elapsed) {
                 if (!player.iceBeam) {
                     player.iceBeam = new FreezyRect(); //new IceBlock();
                     player.iceBeam.boxInit(0, 0, 0, 0);
                     TheWorld.addForegroundObject(player.iceBeam);
                     player.iceBeamDirection = player.lastMoved;
                 }
               if (player.lastMoved == GOING_LEFT && player.iceBeamDirection == GOING_LEFT) {
                   var width = player.iceBeam.width;
                   if (width < 128) {
                       width += 2;
                   player.iceBeam.boxInit(player.left - width,
                                          //player.bottom - 1,
                                          player.top +16,
                                          width,
                                          //16);
                                          40);
                   }
               }
               if (player.lastMoved == GOING_RIGHT && player.iceBeamDirection == GOING_RIGHT) {
                   var width = player.iceBeam.width;
                   if (width < 128) {
                   width += 2;
                   player.iceBeam.boxInit(player.right,
                                          //player.bottom - 1,
                                          player.top +16,
                                          width,
                                          //16);
                                          40);
                   }
               }
             },

             onDeactivate: function(player, elapsed) {
                 if (player.iceBeam) {
                     // get intersecting platform
                     var platforms = TheWorld.getObjectsOfType("platform");
                     for (var i = 0; i < platforms.length; i++) {
                         // turn intersecting platform into ice...
                         if (player.iceBeam.intersecting(platforms[i])) {
                             
                             var iceBlock = new IceBlock();
                             if (player.iceBeamDirection == GOING_LEFT) {
                                 iceBlock.boxInit(player.left - player.iceBeam.width,
                                                  platforms[i].top - 1,
                                                  player.iceBeam.width, 16);
                             } else {
                                 iceBlock.boxInit(player.right,
                                                  platforms[i].top - 1,
                                                  player.iceBeam.width, 16);
                             }
                             TheWorld.addForegroundObject(iceBlock);
                         }
                     }

                     TheWorld.removeForegroundObject(player.iceBeam);
                 }
                 // TODO remove old ice beam, or leave it?
                 player.iceBeam = null;
                 player.iceBeamDirection = null;
             }
            },

    SLICE: {"name": "SLICE",
            "sprite": 2,
            onActivate: function(player, elapsed) {
                // TODO actually kind of want this to play out its whole animation even if
                // you release the key early -- tap to slice rather than hold to slice.
                var sliceWidth = 0;
                 if (!player.sliceRect) {
                     player.sliceRect = new SliceRect();
                     player.sliceRect.resetTime();
                     player.sliceRect.boxInit(0, 0, 0, 0);
                     TheWorld.addForegroundObject(player.sliceRect);
                     //TheWorld.addForegroundObject(player.iceBeam);
                     player.sliceDirection = player.lastMoved;
                 } else {
                     player.sliceRect.addTime(elapsed);
                     if (player.sliceRect.time < 480) {
                         sliceWidth = 64;
                     } else {
                         sliceWidth = 0;
                     }
                 }

               if (player.lastMoved == GOING_LEFT && player.sliceDirection == GOING_LEFT) {
                   player.sliceRect.boxInit(player.left - sliceWidth,
                                          player.bottom - 32,
                                          sliceWidth,
                                          16);
               }
               if (player.lastMoved == GOING_RIGHT && player.sliceDirection == GOING_RIGHT) {
                   player.sliceRect.boxInit(player.right,
                                          player.bottom - 32,
                                          sliceWidth,
                                          16);
               }
                // If slice rect intersects with a platform that is narrower
                // than X, cut the platform down to that height and replace the top
                // section with a pushableBlock
                var cut = null;
                if (!player.sliceHasSliced) {
                    for (var i = 0; i < TheWorld.foregroundObjects.length; i++) {
                        var platform = TheWorld.foregroundObjects[i];
                        if (player.sliceRect.intersecting(platform)) {
                            if (platform.type == "sliceable_block") {
                                var cut = {platform: platform,
                                           height: player.sliceRect.bottom};
                            }
                        }
                    }
                }

                if (cut) {
                    player.sliceHasSliced = true;
                    var left = cut.platform.left;
                    var width = cut.platform.width;
                    var top = cut.platform.top;
                    var height = cut.platform.height;
                    // remove old block:
                    TheWorld.removeForegroundObject(cut.platform);

                    // Put in new block above the cut:
                    var newBlock1 = new TippyBlock();
                    newBlock1.boxInit(left,
                                      top,
                                      width,
                                      (cut.height - top) - 16
                                    );
                    TheWorld.addForegroundObject(newBlock1);

                    // Put in new block below the cut:
                    var newBlock2 = new Platform();
                    newBlock2.boxInit(left,
                                      cut.height,
                                      width,
                                      (top + height - cut.height)
                                    );
                    TheWorld.addForegroundObject(newBlock2);
                }
            },

            onDeactivate: function(player, elapsed) {
                TheWorld.removeForegroundObject(player.sliceRect);
                 player.sliceRect = null;
                 player.sliceDirection = null;
                player.sliceHasSliced = false;
            }
           }
};

// debug only:
//g_selectedPower = powers["SLICE"];

var progressBar;


function doSpecialLevelStuff() {

    if (g_level == 0) {
        var powerObjects = TheWorld.getObjectsOfType("power_object");
        if (powerObjects.length > 0) {
            powerObjects[0].name = "JUMP";
            powerObjects[1].name = "SUCK";
            powerObjects[2].name = "FREEZE";
            powerObjects[3].name = "SLICE";
        }

        var billboard = new Billboard();
        billboard.boxInit(0, 0, 800, 600);
        TheWorld.addBackgroundObject(billboard);
    }
}

function startGame(loader) {

  if (TheWorld.musicUrl != "") {
    $("#bgm").attr("src", TheWorld.musicUrl);
    $("#bgm")[0].play();
  }

  adjustToScreen();
  progressBar.draw(0.5);

  // Call adjustToScreen if screen size changes
  var resizeTimer = null;
  $(window).resize(function() {
      if (resizeTimer) {
          clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(adjustToScreen, 500);
  });

  var context = $("#game-canvas")[0].getContext("2d");

  // Create player, put it in the world:
  g_player = new Player(loader,
			  "elefun.png",
                          TheWorld.startX,
			  TheWorld.startY,
			  64, 50);

  g_player.selectSprite = function() {
      // top row = 4 frames moving right
      // second row = facing right: stand, leap, suck
      if (this.lastMoved == GOING_RIGHT) {
          if (spacebarDown && g_selectedPower) {
              return {x: g_selectedPower.sprite, y: 1};
          } else if (this.motionMode == "climb") {
              return {x: Math.floor(this._pixelsTraveled / 100) % 6, y:4};
          } else if (!this.onGround()) {
              return {x: 1, y: 1};
          } else if (leftArrowDown || rightArrowDown) {
              return {x: Math.floor(this._pixelsTraveled / 100) % 4, y: 0};
          } else {
              return {x: 0, y: 1};
          }
      } else {
          if (spacebarDown && g_selectedPower) {
              return {x: g_selectedPower.sprite, y: 3};
          } else if (this.motionMode == "climb") {
              return {x: Math.floor(this._pixelsTraveled / 100) % 6, y:5};
          } else if (!this.onGround()) {
              return {x: 1, y: 3};
          } else if (leftArrowDown || rightArrowDown) {
              return {x: Math.floor(this._pixelsTraveled / 100) % 4, y: 2};
          } else {
              return {x: 0, y: 3};
          }
      }
     return {x: 0, y: 0};
  };

  doSpecialLevelStuff();
  TheWorld.addForegroundObject(g_player);
  //TheWorld.draw(context);

    /*var field = new ForceField();
  field.boxInit(-250,
                247,
	        200,
		100);
  field.setVector(1, 0);
  TheWorld.addForceField(field);*/

  var startTime = Date.now();

  $(document).bind("keydown", function(evt) {

      switch (evt.which) {
      case LEFT_ARROW:
       leftArrowDown = true;
          break;
      case RIGHT_ARROW:
          rightArrowDown = true;
          break;
      case SPACEBAR:
          spacebarDown = true;
          break;
      case UP_ARROW:
          upArrowDown = true;
          break;
      case DOWN_ARROW:
          downArrowDown = true;
          break;
      default:
          console.log(evt.which);
          break;
      }
    });
  $(document).bind("keyup", function(evt) {
      switch (evt.which) {
      case LEFT_ARROW:
       leftArrowDown = false;
          break;
      case RIGHT_ARROW:
          rightArrowDown = false;
          break;
      case SPACEBAR:
          spacebarDown = false;
          break;
      case UP_ARROW:
          upArrowDown = false;
          break;
      case DOWN_ARROW:
          downArrowDown = false;
          break;
      }
  });


  var bottomLimit = TheWorld.getBottomLimit();
  var currentTime = Date.now();
  var elapsed = 0;
  var newTime;

  var mainLoop = function() {
    newTime = Date.now();
    elapsed = newTime - currentTime;
    currentTime = newTime;

    if (g_selectedPower ) {
      if (spacebarDown) {
        g_selectedPower.onActivate(g_player, elapsed);
      } else {
        g_selectedPower.onDeactivate(g_player, elapsed);
      }
    }

    if (leftArrowDown && !rightArrowDown) {
      g_player.goLeft(elapsed);
    } else if (rightArrowDown && !leftArrowDown) {
      g_player.goRight(elapsed);
    } else if (upArrowDown && !downArrowDown) {
      g_player.ascend(elapsed); // Only ascend if touching ladder or 
    } else if (downArrowDown && !upArrowDown) {
      g_player.descend(elapsed);
    }else {
      g_player.idle(elapsed);
    }

    TheWorld.updateEveryone(elapsed);
    TheWorld.scrollIfNeeded(g_player);
    TheWorld.cleanUpDead();

    StatusBar.updateTimer(currentTime - startTime);
    TheWorld.draw(context);
    StatusBar.draw(context, g_player);

    // check for #LOSING:
    if (g_player.dead) {
	bannerText(getLocalString("_lose_monster") + " " +
		   getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else if (g_player.top > bottomLimit) {
	bannerText(getLocalString("_lose_falling") + " " +
		   getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else {
      window.requestAnimFrame(mainLoop);
    }
  };

  loader.loadThemAll(mainLoop, function(progress) {
      progressBar.draw(0.5 + 0.5 * progress);
    });
}

$(document).ready(function() {
    progressBar = new ProgressBar($("#game-canvas")[0].getContext("2d"));
    progressBar.draw(0);
    loader.add("mouse.png");
    loader.add("sprite_cut.png");
    TheWorld.loadFromString(all_level_data[g_level], loader, startGame);
});