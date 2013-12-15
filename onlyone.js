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
  var gameStarted = false;

var loader = new AssetLoader();
g_player = null;
g_selectedPower = null;
g_level = 0;

PhysicsConstants.groundFriction = 6;
PhysicsConstants.groundAcceleration = 12;

// TODO add level bounds, stop scrolling when you get there

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
            
            g_player.left = TheWorld.startX;
	    g_player.top = TheWorld.startY;
            TheWorld.addForegroundObject(g_player);

        });
        // TODO not sure this is clearing everything as it should be. Some weird bugs
        // seem to happen on higher levels, possibly due to leftover data
        // Seems like the player object from the older level is still hanging around?
    }
    return false;
  }
};
Apple.prototype.__proto__ = new Mob(); // Multi-inherit from mob and powerup??
ConstructorRegistry.register(Apple);


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
    ctx.fillText(getLocalString("_time") + ": " + this.timeString, 80, 30);

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
                   player.suckForce.setVector(2, 0);
               } else { // going right, or haven't moved yet -
                   // the suck force is to my right and sucks left
                   player.suckForce.boxInit(player.right + 1,
                                            player.top - 32,
                                            256,
                                            128);
                   player.suckForce.setVector(-2, 0);
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
                     player.iceBeam = new IceBlock();
                     player.iceBeam.boxInit(0, 0, 0, 0);
                     TheWorld.addForegroundObject(player.iceBeam);
                     player.iceBeamDirection = player.lastMoved;
                 }
               if (player.lastMoved == GOING_LEFT && player.iceBeamDirection == GOING_LEFT) {
                   var width = player.iceBeam.width;
                   if (width < 128) {
                       width += 2;
                   player.iceBeam.boxInit(player.left - width,
                                          player.bottom - 1,
                                          width,
                                          16);
                   }
               }
               if (player.lastMoved == GOING_RIGHT && player.iceBeamDirection == GOING_RIGHT) {
                   var width = player.iceBeam.width;
                   if (width < 128) {
                   width += 2;
                   player.iceBeam.boxInit(player.right,
                                          player.bottom - 1,
                                          width,
                                          16);
                   }
               }
             },

             onDeactivate: function(player, elapsed) {
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
                     player.sliceRect = new ForceField();
                     player.sliceRect.draw = function(ctx) {
                         ctx.fillStyle = "white";
                         ctx.fillRect(this.left, this.top, this.width, this.height);
                     };
                     player.sliceTiming = 0;
                     player.sliceRect.boxInit(0, 0, 0, 0);
                     TheWorld.addForceField(player.sliceRect);
                     //TheWorld.addForegroundObject(player.iceBeam);
                     player.sliceDirection = player.lastMoved;
                 } else {
                     player.sliceTiming += elapsed;
                     if (player.sliceTiming < 250) {
                         sliceWidth = 64 * player.sliceTiming / 250;
                     } else {
                         sliceWidth = 64 * ( 1 - (player.sliceTiming - 250) / 250 );
                         if (sliceWidth < 0) {
                             sliceWidth = 0;
                         }
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
                TheWorld.removeForceField(player.sliceRect);
                 player.sliceRect = null;
                 player.sliceDirection = null;
                player.sliceHasSliced = false;
            }
           }
};

var progressBar;

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

  TheWorld.addForegroundObject(g_player);
  //TheWorld.draw(context);

    /*var field = new ForceField();
  field.boxInit(-250,
                247,
	        200,
		100);
  field.setVector(1, 0);
  TheWorld.addForceField(field);*/


    // Or do this like only in level 0:
    var powerObjects = TheWorld.getObjectsOfType("power_object");
    if (powerObjects.length > 0) {
        powerObjects[0].name = "JUMP";
        powerObjects[1].name = "SUCK";
        powerObjects[2].name = "FREEZE";
        powerObjects[3].name = "SLICE";
    }

  var startTime = Date.now();

  $(document).bind("keydown", function(evt) {
    gameStarted = true;

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

    // Show instructions on screen until player starts moving:
    if (!gameStarted) {
      bannerText(getLocalString("_game_instructions"));
    }

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
    TheWorld.loadFromString(all_level_data[g_level], loader, startGame);
});