// Start enchant
enchant();

//Global variables. Don't change in code
var CONT_INPUT = {
	a: 0,
	b: 1,
	x: 2,
	y: 3,
	lb: 4,
	rb: 5,
	lt: 6,
	rt: 7,
	back: 8,
	start: 9,
	lstick: 10,
	rstick: 11,
	up: 12,
	down: 13,
	left: 14,
	right: 15,
	lstick_x: 0,
	lstick_y: 1,
	rstick_x: 2,
	rstick_y: 3
}

var game = null;
var enemies = []; // all enemies
var ships = []; // all ships
var healthDisplays = [];
var missileExists = [false, false, false, false];

var Move = Class.create({
	initialize: function(_direction, _speed, _duration, _bullets, _bulletSpeed, _rotation) {
		this.direction = _direction;
		this.speed = _speed;
		this.duration = _duration;
		this.bullets = _bullets;
		this.bulletSpeedl = _bulletSpeed;
		this.rotation = _rotation;
	}
});

var MoveSet = Class.create({
	initialize: function(_moves, _repeat) {
		this.moves = _moves;
		this.repeat = _repeat;
		this.current = -1;
		this.total = _moves.length;
	},

	nextMove: function() {
		this.current++;
		if (this.current >= this.total)
			this.current = 0;
		return this.moves[this.current];
	},

	clone: function() {
		return new MoveSet(this.moves);
	}
});

Ship = Class.create(Sprite, {
	initialize: function(x, shipNum) {
		Sprite.call(this, 30, 30);
		this.image = getAssets()['images/Square.png'];
		this.number = shipNum;
		this.frame = 0;
		this.health = 10;
		this.speed = 3;
		this.x = x;
		this.y = 360;
		this.bulletTimer = 30;
		this.addEventListener('enterframe', function() {
			healthDisplays[this.number].text = "Health" + this.number + ": " + this.health;
			if (this.health <= 0) {
				ships[this.number] = null;
				game.rootScene.removeChild(this);
			}
			this.bulletTimer++;
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

var Enemy = Class.create(Sprite, {
	initialize: function(width, height) {
		Sprite.call(this, width, height);
		this.frame = 0;
		this.health = 10;
		this.velY = 0;
		this.velX = 0;
	},
	onenterframe: function() {
		if (this.health <= 0) {
			var i = enemies.indexOf(this);
			enemies.splice(i, 1);
			game.rootScene.removeChild(this);
		}
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

var EnemyWithMoves = Class.create(Enemy, {
	initialize: function(_moveset, _x) {
		Enemy.call(this, 30, 30);
		this.image = getAssets()['images/Square.png'];
		this.moveset = _moveset;
		this.move = this.moveset.nextMove();
		this.move_progress = 0;
		this.x = _x;
		this.y = 50;
		this.velX = Math.cos(this.move.direction) * this.move.speed;
		this.velY = Math.sin(this.move.direction) * this.move.speed;
	},

	onenterframe: function() {
		if (this.health <= 0) {
			var i = enemies.indexOf(this);
			enemies.splice(i, 1);
			game.rootScene.removeChild(this);
		}
		if (this.move_progress >= this.move.duration) {
			this.move = this.moveset.nextMove();
			this.move_progress = 0;
			this.velX = Math.cos(this.move.direction) * this.move.speed;
			this.velY = Math.sin(this.move.direction) * this.move.speed;
		}

		if (this.move_progress % (this.move.duration / this.move.bullets) === 0) {
			var bullet = new EnemyBullet(this.x, this.y, 2);
			game.rootScene.addChild(bullet);
		}

		if (this.y > gameHeight - this.height) {
			this.y = gameHeight - this.height;
		}
		if (this.y < 0) {
			this.y = 0;
		}
		if (this.x < 0) {
			this.x = 0;
		}
		if (this.x > gameWidth - this.width) {
			this.x = gameWidth - this.width;
		}
		this.x += this.velX;
		this.y += this.velY;

		this.move_progress++;
	}
});

var Bullet = Class.create(Sprite, {
	initialize: function(width, height) {
		Sprite.call(this, width, height);
		this.damage = 0;
		this.frame = 0;
		this.velX = 0;
		this.velY = 0;
	},
	onenterframe: function() {
		var ships = getShip();
		for (var k = 0; k < ships.length; k++) {
			if (ships[k] !== null && ships[k].intersect(this)) {
				ships[k].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this)) {
				enemies[j].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		this.x += this.velX;
		this.y += this.velY;
		if (this.y > gameHeight || this.y < -this.height
		 || this.x > gameWidth || this.x < -this.width) {
			game.rootScene.removeChild(this);
		}
	}
});

var EnemyBullet = Class.create(Sprite, {
	initialize: function(_x, _y, _damage) {
		Sprite.call(this, 8, 15);
		this.image = getAssets()['images/bullet2.png'];
		this.damage = _damage;
		this.x = _x;
		this.y = _y;
		this.velX = 0;
		this.velY = 5;
	},

	onenterframe: function() {
		var ship = getShip();
		if (ship.intersect(this)) {
			ship.health -= this.damage;
			game.rootScene.removeChild(this);
		}
		this.x += this.velX;
		this.y += this.velY;
	}
});

var PlayerBullet = Class.create(Bullet, {
	initialize: function(velocityX, velocityY, shipNum) {
		Bullet.call(this, 15, 15);
		this.image = getAssets()['images/bullet.png'];
		this.damage = 1;
		this.x = getShip()[shipNum].x;
		this.y = getShip()[shipNum].y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	}
});

var PlayerMissile = Class.create(Bullet, {
	initialize: function(velocityX, velocityY, controllerNum) {
		Bullet.call(this, 15, 15);
		this.image = getAssets()['images/bullet.png'];
		this.timer = 0;
		this.damage = 5;
		this.controller = controllerNum;		
		this.angle = 0;
		this.testX = 0;
		this.testY = 0;
		var ship = getShip()[controllerNum];
		this.x = ships[controllerNum].x + 15;
		this.y = ships[controllerNum].y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	},

	onenterframe: function() {
		var ships = getShip();
		this.timer++;
		for (var k = 0; k < ships.length; k++) {
			if (ships[k] !== null && ships[k].intersect(this) && this.timer > 30) {
				missileExists[this.controller] = false;
				ships[k].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this)) {
				missileExists[this.controller] = false;
				enemies[j].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		this.x += this.velX;
		this.y += this.velY;
		if (this.y > gameHeight || this.y < -this.height
		 || this.x > gameWidth || this.x < -this.width) {
			missileExists[this.controller] = false;
			game.rootScene.removeChild(this);
		}
		else {
			if (controllers[this.controller].axes[CONT_INPUT.rstick_x] > 0.5 
			|| controllers[this.controller].axes[CONT_INPUT.rstick_x] < -0.5
			|| controllers[this.controller].axes[CONT_INPUT.rstick_y] > 0.5 
			|| controllers[this.controller].axes[CONT_INPUT.rstick_y] < -0.5) {
				this.angle = Math.atan(controllers[this.controller].axes[CONT_INPUT.rstick_y] /
				              controllers[this.controller].axes[CONT_INPUT.rstick_x]);
				if (controllers[this.controller].axes[CONT_INPUT.rstick_x] < 0) {
					this.angle += Math.PI;
				}
				this.velX = Math.cos(this.angle) * 5;
				this.velY = Math.sin(this.angle) * 5;
			}
		}
	}
});

var enemy_movesets = {
	set1 : new MoveSet(new Array(
				new Move(0, 2, 60, 3, 0),
				new Move((11.0 / 4.0) * Math.PI, 1.5, 30, 0, 0),
				new Move((13.0 / 4.0) * Math.PI, 4, 30, 0, 0),
				new Move((1.0 / 2.0) * Math.PI, 2, 60, 0, 0))),
	set2 : new MoveSet(new Array(
				new Move(0, 3, 40, 4, 0),
				new Move((15.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0),
				new Move(Math.PI, 3, 40, 4, 0),
				new Move((13.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0)))
}

var gameWidth = 600;
var gameHeight = 720;

var controllers = [];
function updateControllers()
{
	if (navigator.webkitGetGamepads) {
		controllers = navigator.webkitGetGamepads();
	}
}

function getAssets() {
	if (game != null) {
		return game.assets;
	}
}

function getShip() {
	if (game != null) {
	
		return game.getShip();
	}
}

var addEnemy = function(enemy) {
	game.rootScene.addChild(enemy);
	enemies.push(enemy);
};

// When document loads, set up basic game
window.onload = function() {
	game = new Game(gameWidth, gameHeight);
	game.preload(
		'images/bg1.png', 'images/Square.png', 'images/bullet.png',
		'images/bullet2.png');
	
	game.fps = 60;
	game.scale = 1;

	game.getShip = function() {
		return ships;
	}

	game.onload = function() {
		var label, bg;
		label = new Label("TWENTY Players.  FOUR Controller.");
		label.color = 'white';

		
		bg = new Sprite(gameWidth, gameHeight);
		bg.image = game.assets['images/bg1.png'];

		game.rootScene.addChild(bg);
		game.rootScene.addChild(label);
		
		updateControllers();

		for (var k = 0; controllers[k] !== undefined; k++) {
			ships[k] = new Ship(k * 100, k);
			game.rootScene.addChild(ships[k]);
			healthDisplays[k] = new Label("Health " + k + ": " + ships[k].health);
			healthDisplays[k].color = 'white';
			healthDisplays[k].x = gameWidth - 65;
			healthDisplays[k].y = k * 30;
			game.rootScene.addChild(healthDisplays[k]);
		}
		healthDisplay = new Label("Health: ");
		healthDisplay.color = 'white';
		healthDisplay.x = gameWidth - 60;

		addEnemy(new EnemyWithMoves(enemy_movesets.set2.clone(), 75));
		addEnemy(new EnemyWithMoves(enemy_movesets.set1.clone(), 150));
		addEnemy(new EnemyWithMoves(enemy_movesets.set2.clone(), 225));
		addEnemy(new EnemyWithMoves(enemy_movesets.set1.clone(), 300));
		addEnemy(new EnemyWithMoves(enemy_movesets.set2.clone(), 375));
				
		game.rootScene.addEventListener('enterframe', function(e) {
			var gameOver = true;
			for (var k = 0; k < ships.length; k++) {
				if (ships[k] !== null && ships[k].health > 0) {
					gameOver = false;
					break;
				}
			}
			if (gameOver) {
				game.stop();
			}
			updateControllers();
			for (var k = 0; controllers[k] !== undefined; k++) {
				if (ships[k] === null) {
					continue;
				}
				if (controllers[k] !== undefined) {
					if (controllers[k].buttons[CONT_INPUT.lstick] === 1) {
						ships[k].speed = 6;
					}
					else {
						ships[k].speed = 3;
					}
					if (controllers[k].axes[CONT_INPUT.lstick_x] > 0.5 || controllers[k].axes[CONT_INPUT.lstick_x] < -0.5) {
						ships[k].x += controllers[k].axes[CONT_INPUT.lstick_x] * ships[k].speed;
					}
					if (controllers[k].axes[CONT_INPUT.lstick_y] > 0.5 || controllers[k].axes[CONT_INPUT.lstick_y] < -0.5) {
						ships[k].y += controllers[k].axes[CONT_INPUT.lstick_y] * ships[k].speed;
					}
					if (controllers[k].buttons[CONT_INPUT.a] === 1 && ships[k].bulletTimer >= 30) {
						game.rootScene.addChild(new PlayerBullet(0, -5, k));
						ships[k].bulletTimer = 0;
					}
					if (controllers[k].buttons[CONT_INPUT.rstick] === 1) {
						if (missileExists[k] === false) {
							missileExists[k] = true;
							var y = controllers[k].axes[CONT_INPUT.rstick_y] < -0.5 ? -5 : 5;
							game.rootScene.addChild(new PlayerMissile(0, y, k));
						}
					}
				}
			}
		});
	}

	game.start();
}
