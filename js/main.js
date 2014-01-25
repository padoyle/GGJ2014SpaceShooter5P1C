// Start enchant
enchant();
var controller = null;
function updateController()
{
	if (navigator.webkitGetGamepads) {
		controller = navigator.webkitGetGamepads()[0];
	}
}

// When document loads, set up basic game
window.onload = function() {
	var game = new Game(600, 720);
	game.preload('images/bg1.png', 'images/Square.png');
	
	game.fps = 60;
	game.scale = 1;

	game.onload = function() {
		console.log("sup guys, I'm your game");

		var label, bg;
		label = new Label("FIVE Players.  ONE Controller.");
		label.color = 'white';
		bg = new Sprite(600, 720);
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
					if (this.y < 40) {
						this.y = 40;
					}	
					if (this.y > 680) {
						this.y = 680
					}
					if (this.x < 40) {
						this.x = 40;
					}
					if (this.x > 560) {
						this.x = 560;
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
				if (this.y > 680) {
					this.y = 680;
					this.velY *= -1;
				}
				if (this.y < 40) {
					this.y = 40;
					this.velY *= -1;
				}
				if (this.x < 40) {
					this.x = 40;
					this.velX *= -1;
				}
				if (this.x > 560) {
					this.x = 560;
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
				this.x = 20;
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
				if (controller.axes[0] > 0.1 || controller.axes[0] < -0.1) {
					ship.x += controller.axes[0];
				}
				if (controller.axes[1] > 0.1 || controller.axes[1] < -0.1) {
					ship.y += controller.axes[1];
				}
				if (controller.buttons[0] === 1) {
					ship.scaleX += .1;
				}
				if (controller.buttons[1] === 1) {
					ship.scaleX -= .1;
				}
			}
		});
	}

	game.start();
}