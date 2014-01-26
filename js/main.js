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
var ship = null;
var healthDisplay = null;
var missileExists = false;
var scalingDifficultyNumber = 1;

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
	initialize: function() {
		Sprite.call(this, 30, 30);
		this.image = getAssets()['images/Square.png'];
		this.frame = 0;
		this.health = 10;
		this.speed = 3;
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

var Enemy = Class.create(Sprite, {
    initialize: function (width, height) {
        Sprite.call(this, width, height);
        this.frame = 0;
        this.health = 10;
        this.velY = 0;
        this.velX = 0;
        this.onScreen = false;
    },
    onenterframe: function () {
        if (this.onScreen === false) {
            this.y += 0.5 * scalingDifficultyNumber;
            if (this.y >= 0) {
                this.onScreen = true;
            }
        }
        else {
            if (this.health <= 0) {
                var i = enemies.indexOf(this);
                enemies.splice(i, 1);
                game.rootScene.removeChild(this);
            }
            if (this.y + this.height > gameHeight) {
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
    }
});

var EnemyWithMoves = Class.create(Enemy, {
    initialize: function (_x, _y, _moveset) {
        Enemy.call(this, 30, 30);
        this.image = getAssets()['images/Square.png'];
        this.moveset = _moveset;
        this.move = this.moveset.nextMove();
        this.move_progress = 0;
        this.x = _x;
        this.y = _y;
        this.velX = Math.cos(this.move.direction) * this.move.speed;
        this.velY = Math.sin(this.move.direction) * this.move.speed;
    },

    onenterframe: function () {
        if (this.onScreen === false) {
            this.y += 0.5 * scalingDifficultyNumber;
            if (this.y >= 0) {
                this.onScreen = true;
            }
        }
        else {
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

            if (this.y > gameHeight) {
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
		var ship = getShip();
		if (ship.intersect(this)) {
			ship.health -= this.damage;
			healthDisplay.text = "Health: " + ship.health;
			game.rootScene.removeChild(this);
		}
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this) && enemies[j].onScreen) {
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

var PlayerBullet = Class.create(Bullet, {
	initialize: function(velocityX, velocityY) {
		Bullet.call(this, 15, 15);
		this.image = getAssets()['images/bullet.png'];
		this.damage = 1;
		this.x = getShip().x;
		this.y = getShip().y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	}
});

var PlayerMissile = Class.create(Bullet, {
	initialize: function(velocityX, velocityY) {
		Bullet.call(this, 15, 15);
		this.image = getAssets()['images/bullet.png'];
		this.timer = 0;
		this.damage = 5;
		this.angle = 0;
		this.testX = 0;
		this.testY = 0;
		var ship = getShip();
		this.x = ship.x + 15;
		this.y = ship.y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	},

	onenterframe: function() {
		var ship = getShip();
		this.timer++;
		if (ship.intersect(this) && this.timer > 30) {
			missileExists = false;
			ship.health -= this.damage;
			healthDisplay.text = "Health: " + ship.health;
			game.rootScene.removeChild(this);
		}
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this) && enemies[j].onScreen) {
				missileExists = false;
				enemies[j].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		this.x += this.velX;
		this.y += this.velY;
		if (this.y > gameHeight || this.y < -this.height
		 || this.x > gameWidth || this.x < -this.width) {
			missileExists = false;
			game.rootScene.removeChild(this);
		}
		else {
			updateController();
			if (controller) {
				if (controller.axes[CONT_INPUT.rstick_x] > 0.5 
				|| controller.axes[CONT_INPUT.rstick_x] < -0.5
				|| controller.axes[CONT_INPUT.rstick_y] > 0.5 
				|| controller.axes[CONT_INPUT.rstick_y] < -0.5) {
					this.angle = Math.atan(controller.axes[CONT_INPUT.rstick_y] /
					              controller.axes[CONT_INPUT.rstick_x]);
					if (controller.axes[CONT_INPUT.rstick_x] < 0) {
						this.angle += Math.PI;
					}
					this.velX = Math.cos(this.angle) * 5;
					this.velY = Math.sin(this.angle) * 5;
				}
			}
		}
	}
});

var enemy_movesets = {
	set1 : new MoveSet(new Array(
				new Move(0, 2, 60, 0, 0),
				new Move((11.0 / 4.0) * Math.PI, 1.5, 30, 0, 0),
				new Move((13.0 / 4.0) * Math.PI, 4, 30, 0, 0),
				new Move((1.0 / 2.0) * Math.PI, 2, 60, 0, 0))),
	set2 : new MoveSet(new Array(
				new Move(0, 3, 40, 0, 0),
				new Move((15.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0),
				new Move(Math.PI, 3, 40, 0, 0),
				new Move((13.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0)))
}

var gameWidth = 600;
var gameHeight = 720;

var controller = null;
var formations = [];

function updateController()
{
	if (navigator.webkitGetGamepads) {
		controller = navigator.webkitGetGamepads()[0];
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

var addEnemy = function (enemy) {
    game.rootScene.addChild(enemy);
    enemies.push(enemy);
};

// When document loads, set up basic game
window.onload = function () {
    game = new Game(gameWidth, gameHeight);
    game.preload('images/bg1.png', 'images/Square.png', 'images/bullet.png');

    game.fps = 60;
    game.scale = 1;

    game.getShip = function () {
        return ship;
    }

    game.onload = function () {
        var label, bg;
        var bulletTimer = 30;
        label = new Label("FIVE Players.  ONE Controller.");
        label.color = 'white';
        healthDisplay = new Label("Health: ");
        healthDisplay.color = 'white';
        healthDisplay.x = gameWidth - 60;

        bg = new Sprite(gameWidth, gameHeight);
        bg.image = game.assets['images/bg1.png'];

        game.rootScene.addChild(bg);
        game.rootScene.addChild(label);
        game.rootScene.addChild(healthDisplay);

        ship = new Ship();
        game.rootScene.addChild(ship);
        healthDisplay.text = "Health: " + ship.health;

        addEnemy(new EnemyWithMoves(75, 30, enemy_movesets.set2.clone()));
        addEnemy(new EnemyWithMoves(150, 30, enemy_movesets.set1.clone()));
        addEnemy(new EnemyWithMoves(225, 30, enemy_movesets.set2.clone()));
        addEnemy(new EnemyWithMoves(300, 30, enemy_movesets.set1.clone()));
        addEnemy(new EnemyWithMoves(375, 30, enemy_movesets.set2.clone()));

        game.rootScene.addEventListener('enterframe', function (e) {
            if (ship.health <= 0) {
                game.end();
            }
            bulletTimer++;
            updateController();
            if (enemies[enemies.length - 1].onScreen) {
                LoadFormation0();
            }
            for (i = 0; i < enemies.length; i++) {
                if (enemies[i].y > gameHeight) {
                    game.rootScene.removeChild(enemies[i]);
                    enemies.splice(i, 1);
                    i--;
                }
            }
            if (controller) {
                if (controller.buttons[CONT_INPUT.lstick] === 1) {
                    ship.speed = 6;
                }
                else {
                    ship.speed = 3;
                }
                if (controller.axes[CONT_INPUT.lstick_x] > 0.5 || controller.axes[CONT_INPUT.lstick_x] < -0.5) {
                    ship.x += controller.axes[CONT_INPUT.lstick_x] * ship.speed;
                }
                if (controller.axes[CONT_INPUT.lstick_y] > 0.5 || controller.axes[CONT_INPUT.lstick_y] < -0.5) {
                    ship.y += controller.axes[CONT_INPUT.lstick_y] * ship.speed;
                }
                if (controller.buttons[CONT_INPUT.a] === 1 && bulletTimer >= 30) {
                    game.rootScene.addChild(new PlayerBullet(0, -5));
                    bulletTimer = 0;
                }
                if (controller.buttons[CONT_INPUT.rstick] === 1) {
                    if (missileExists === false) {
                        missileExists = true;
                        var y = controller.axes[CONT_INPUT.rstick_y] < -0.5 ? -5 : 5;
                        game.rootScene.addChild(new PlayerMissile(0, y));
                    }
                }
            }
        });
    }

    game.start();
}
