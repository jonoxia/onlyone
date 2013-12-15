const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const UP_ARROW = 38;
const DOWN_ARROW = 40;
const SPACEBAR = 32;


// TODO add level bounds, stop scrolling when you get there


// TODO make it possible to act upon Apple using force (suck or blow)
// I think that means making Apple inherit from both Mob and Powerup... int wrist sting.
function Apple() {
}
Apple.prototype = {
  type: "apple",
  classification: "powerup",
  width: 32,
  height: 32,
  draw: function(ctx) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.left + this.width/2, this.top + this.height/2, this.height/2, 0, 2*Math.PI, false);
      ctx.fill();
  }
};
Apple.prototype.__proto__ = new Mob();
ConstructorRegistry.register(Apple);


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

    ctx.fillText(getLocalString("_useless_trinkets") + ": " + player.numTrinkets, 240, 30);
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
  var player = new Player(loader,
			  "elefun.png",
                          TheWorld.startX,
			  TheWorld.startY,
			  64, 50);


  player.selectSprite = function() {
      // top row = 4 frames moving right
      // second row = facing right: stand, leap, suck
      if (this.lastMoved == GOING_RIGHT) {
          if (!this.onGround()) {
              return {x: 1, y: 1};
          } else {
              return {x: Math.floor(this._pixelsTraveled / 100) % 4, y: 0};
          }
      } else {
          if (!this.onGround()) {
              return {x: 1, y: 3};
          } else {
              return {x: Math.floor(this._pixelsTraveled / 100) % 4, y: 2};
          }
      }
     return {x: 0, y: 0};
  };


    player.usePower = function(elapsed) {
        player.jump(elapsed);

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
    };

    player.stopUsingPower = function(elapsed) {
        player.stopJumping(elapsed);
        if (player.suckForce) {
            TheWorld.removeForceField(player.suckForce);
        }
        player.suckForce = null;
    };


  TheWorld.addForegroundObject(player);
  //TheWorld.draw(context);

  var field = new ForceField();
  field.boxInit(-250,
                247,
	        200,
		100);
  field.setVector(1, 0);
  TheWorld.addForceField(field);

    var apple = new Mob();
    apple.boxInit(900, -32, 32, 32);
    apple.mobInit(loader, "platform/octogoblin.png", false);
    TheWorld.addForegroundObject(apple);

  var leftArrowDown = false;
  var rightArrowDown = false;
  var upArrowDown = false;
  var downArrowDown = false;
  var spacebarDown = false;
  var gameStarted = false;

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

    if (spacebarDown) {
      player.usePower(elapsed);
    } else {
      player.stopUsingPower(elapsed);
    }

    if (leftArrowDown && !rightArrowDown) {
      player.goLeft(elapsed);
    } else if (rightArrowDown && !leftArrowDown) {
      player.goRight(elapsed);
    } else if (upArrowDown && !downArrowDown) {
      player.ascend(elapsed); // Only ascend if touching ladder or 
    } else if (downArrowDown && !upArrowDown) {
      player.descend(elapsed);
    }else {
      player.idle(elapsed);
    }

    TheWorld.updateEveryone(elapsed);
    TheWorld.scrollIfNeeded(player);
    TheWorld.cleanUpDead();

    StatusBar.updateTimer(currentTime - startTime);
    TheWorld.draw(context);
    StatusBar.draw(context, player);

    // Show instructions on screen until player starts moving:
    if (!gameStarted) {
      bannerText(getLocalString("_game_instructions"));
    }

    // check for #LOSING:
    if (player.dead) {
	bannerText(getLocalString("_lose_monster") + " " +
		   getLocalString("_reload_play_again"));
      $("#bgm")[0].pause();
      playSfx("death-sfx");
    } else if (player.top > bottomLimit) {
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


var offlineMode;
$(document).ready(function() {
  var loader = new AssetLoader();
  progressBar = new ProgressBar($("#game-canvas")[0].getContext("2d"));
  progressBar.draw(0);
  TheWorld.loadFromString(offlineLevelData, loader, startGame);
});