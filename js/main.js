// Start enchant
enchant();
//Global variables. Don't change in code
var Controller_A = 0;
var Controller_B = 1;
var Controller_X = 2;
var Controller_Y = 3;
var Controller_Left_Bump = 4;
var Controller_Right_Bump = 5;
var Controller_Left_Trigger = 6;
var Controller_Right_Trigger = 7;
var Controller_Back = 8;
var Controller_Start = 9;
var Controller_Left_Stick = 10;
var Controller_Right_Stick = 11;
var Controller_Up_Dpad = 12;
var Controller_Down_Dpad = 13;
var Controller_Left_Dpad = 14;
var Controller_Right_Dpad = 15;
var Controller_Left_X_Axis = 0;
var Controller_Left_Y_Axis = 1;
var Controller_Right_X_Axis = 2;
var Controller_Right_Y_Axis = 3;

var gameWidth = 600;
var gameHeight = 720;

var controller = null;
function updateController()
{
	if (navigator.webkitGetGamepads) {
		controller = navigator.webkitGetGamepads()[0];
	}
}

// When document loads, set up basic game
window.onload = function() {
	var game = new Game(gameWidth, gameHeight);
	game.preload('images/bg1.png', 'images/Square.png');
	
	game.fps = 60;
	game.scale = 1;

	game.onload = function() {
		console.log("sup guys, I'm your game");

		var label, bg;
		label = new Label("FIVE Players.  ONE Controller.");
		label.color = 'white';
		bg = new Sprite(gameWidth, gameHeight);
		bg.image = game.assets['images/bg1.png'];

		game.rootScene.addChild(bg);
		game.rootScene.addChild(label);
		
		Ship = Class.create(Sprite, {
			initialize: function() {
				Sprite.call(this, 30, 30);
				this.image = game.assets['images/Square.png'];
				this.frame = 0;
				this.x = 300;
				this.y = 360;
				this.addEventListener('enterframe', function() {
					if (this.y < 0) {
						this.y = 0;
					}	
					if (this.y > gameWidth - this.height) {
						this.y = gameWidth - this.height;
					}
					if (this.x < 0) {
						this.x = 0;
					}
					if (this.x > gameWidth - this.width) {
						this.x = gameWidth - this.width;
					}
				});
			}
		});
		var ship = new Ship();
		game.rootScene.addChild(ship);
		
		var Enemy = Class.create(Sprite, {
			initialize: function(width, height) {
				Sprite.call(this, width, height);
				this.frame = 0;
				this.velY = 0;
				this.velX = 0;
			},
			onenterframe: function() {
				if (this.y > gameHeight - this.height) {
					this.y = gameHeight - this.height;
					this.velY *= -1;
				}
				if (this.y < 0) {
					this.y = 0;
					this.velY *= -1;
				}
				if (this.x < 0) {
					this.x = 0;
					this.velX *= -1;
				}
				if (this.x > gameWidth - this.width) {
					this.x = gameWidth - this.width;
					this.velX *= -1;
				}
				this.x += this.velX;
				this.y += this.velY;
			}
		});
		var EnemyX = Class.create(Enemy, {
			initialize: function() {
				Enemy.call(this, 30, 30);
				this.image = game.assets['images/Square.png'];
				this.x = 30;
				this.y = 50;
				this.velX = 1;
				this.velY = 3;
			}
		});
		var EnemyY = Class.create(Enemy, {
			initialize: function() {
				Enemy.call(this, 30, 30);
				this.image = game.assets['images/Square.png'];
				this.x = 500;
				this.y = 50;
				this.velX = 1;
				this.velY = 3;
			}
		});
		
		var enemyX = new EnemyX();
		var enemyY = new EnemyY();
		
		game.rootScene.addChild(enemyX);
		game.rootScene.addChild(enemyY);
		
		
		game.rootScene.addEventListener('enterframe', function(e) {
			updateController();
			if (controller) {
				if (controller.axes[Controller_Left_X_Axis] > 0.1 || controller.axes[Controller_Left_X_Axis] < -0.1) {
					ship.x += controller.axes[Controller_Left_X_Axis];
				}
				if (controller.axes[Controller_Left_Y_Axis] > 0.1 || controller.axes[Controller_Left_Y_Axis] < -0.1) {
					ship.y += controller.axes[Controller_Left_Y_Axis];
				}
				if (controller.buttons[Controller_A] === 1) {
					ship.scaleX += .1;
				}
				if (controller.buttons[Controller_B] === 1) {
					ship.scaleX -= .1;
				}
			}
		});
	}

	game.start();
}