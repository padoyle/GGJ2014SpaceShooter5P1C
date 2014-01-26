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
};

var game = null;
var enemies = []; // all enemies
var ships = []; // all ships
var healthDisplays = [];
var scalingDifficultyNumber = 1;
var energy = 0;
var stress = 0;

var Move = Class.create({
	initialize: function(_direction, _speed, _duration, _bullets, _angle) {
		this.direction = _direction;
		this.speed = _speed;
		this.duration = _duration;
		this.bullets = _bullets;
		this.angle = _angle;
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

var BG = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, gameWidth, gameHeight * 2);
		this.x = 0;
		this.y = -gameHeight;
	},
	onenterframe: function() {
		this.y += 1;
		if (this.y > 0) {
			this.y = -gameHeight;
		}
	}
});

var enemy_movesets = {
	set1 : new MoveSet(new Array(
				new Move(0, 2, 60, 3, 90),
				new Move((11.0 / 4.0) * Math.PI, 1.5, 30, 0, 0),
				new Move((13.0 / 4.0) * Math.PI, 4, 30, 0, 0),
				new Move((1.0 / 2.0) * Math.PI, 2, 60, 0, 0))),
	set2 : new MoveSet(new Array(
				new Move(0, 3, 40, 4, 90),
				new Move((15.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0),
				new Move(Math.PI, 3, 40, 4, 90),
				new Move((13.0 / 4.0) * Math.PI, 0.5, 60, 0, 0),
				new Move(0.5 * Math.PI, 2, 40, 0, 0))),
	set3 : new MoveSet(new Array(
				new Move(0.25 * Math.PI, 2, 60, 0, 0),
				new Move(0, 0, 0, 5, 90),
				new Move(0, 0, 60, 0, 0),
				new Move(0.75 * Math.PI, 2, 60, 0, 0),
				new Move(0, 0, 0, 5, 120),
				new Move(0, 0, 60, 0, 0)))
};

var Component = Class.create(Sprite, {
	initialize: function(x, y, shipNum) {
		Sprite.call(this, 50, 51);
		this.shipNum = shipNum;
		this.x = x;
		this.y = y;
	},
	update: function() {
		if (getShips()[this.shipNum] !== undefined && getShips()[this.shipNum].health > 0) {
			this.x = getShips()[this.shipNum].x;
			this.y = getShips()[this.shipNum].y;
		}
	}
});
var ShieldImage = Class.create(Component, {
	initialize: function(x, y, shipNum) {
		Component.call(this, x, y, shipNum);
		this.image = getAssets()['images/playerShip_shields.png'];
	}
});
var MissileImage = Class.create(Component, {
	initialize: function(x, y, shipNum) {
		Component.call(this, x, y, shipNum);
		this.image = getAssets()['images/playerShip_missile.png'];
	}
});
var GunImage = Class.create(Component, {
	initialize: function(x, y, shipNum) {
		Component.call(this, x, y, shipNum);
		this.image = getAssets()['images/playerShip_guns.png'];
	}
});
var GeneratorImage = Class.create(Component, {
	initialize: function(x, y, shipNum) {
		Component.call(this, x, y, shipNum);
		this.image = getAssets()['images/playerShip_generator.png'];
	}
});

Ship = Class.create(Sprite, {
	initialize: function(x, shipNum) {
		Sprite.call(this, 50, 51);
		this.image = getAssets()['images/playerShip_base.png'];
		this.number = shipNum;
		this.frame = 0; 
		this.health = 10;
		this.maxHealth = 10; //If health is balanced, change this too
		this.speed = 3;
		this.x = x;
		this.y = 360;
		this.bulletTimer = 30;
		this.shield = null;
		this.missileExists = false;
		this.components = [];
		var shieldImage = new ShieldImage(this.x, this.y, this.number);
		this.components.push(shieldImage);
		
		var missileImage = new MissileImage(this.x, this.y, this.number);
		this.components.push(missileImage);
		
		var gunImage = new GunImage(this.x, this.y, this.number);
		this.components.push(gunImage);
		
		var generatorImage = new GeneratorImage(this.x, this.y, this.number);
		this.components.push(generatorImage);
		
		this.addEventListener('enterframe', function() {
			healthDisplays[this.number].text = "Health" + this.number + ": " + this.health;
			if (this.health <= 0) {
				ships[this.number] = null;
				this.removeComponents();
				game.rootScene.removeChild(this);
			}
			this.bulletTimer++;
			if (this.y < 0) {
				this.y = 0;
			}	
			if (this.y > gameWidth + this.height) {
				this.y = gameWidth + this.height;
			}
			if (this.x < 0) {
				this.x = 0;
			}
			if (this.x > gameWidth - this.width) {
				this.x = gameWidth - this.width;
			}
		});
	},
	updateComponents: function() {
		for (var f = 0; f < this.components.length; f++) {
			this.components[f].update();
		}
	},
	removeComponents: function() {
		for (var g = 0; g < this.components.length; g++) {
			game.rootScene.removeChild(this.components[g]);
		}
		this.components = [];
	},
	removeComponent: function(clazz) {
		for (var r = 0; r < this.components.length; r++) {
			if (this.components[r] instanceof clazz) {
				game.rootScene.removeChild(this.components[r]);
				this.components.splice(r, 1);
				return true;
			}
		}
		return false;
	},
	checkComponent: function(clazz) {
		for (var t = 0; t < this.components.length; t++) {
			if (this.components[t] instanceof clazz) {
				return true;
			}
		}
		return false;
	},
	drawComponents: function() {
		for (var w = 0; w < this.components.length; w++) {
			if (this.components[w]) {
				game.rootScene.addChild(this.components[w]);
			}
		}
	}
});

var Shield = Class.create(Sprite, {
	initialize: function(shipNum) {
		Sprite.call(this, 71, 64);
		this.image = game.assets['images/player_shield.png'];
		this.ship = shipNum;
		this.frame = 0;
		this.x = getShips()[this.ship].x - 10;
		this.y = getShips()[this.ship].y - 12;
	},
	onenterframe: function() {
		this.x = getShips()[this.ship].x - 10;
		this.y = getShips()[this.ship].y - 12;
	}
});

var Enemy = Class.create(Sprite, {
    initialize: function (_moveset, _x, _y) {
        Sprite.call(this, 50, 50);
        this.frame = 0;
        this.moveset = _moveset;
        this.move = this.moveset.nextMove();
        this.move_progress = 0;
        this.x = _x;
        this.y = _y;
        this.velX = Math.cos(this.move.direction) * this.move.speed;
        this.velY = Math.sin(this.move.direction) * this.move.speed;
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
            if (this.move_progress >= this.move.duration) {
                this.move = this.moveset.nextMove();
                this.move_progress = 0;
                this.velX = Math.cos(this.move.direction) * this.move.speed;
                this.velY = Math.sin(this.move.direction) * this.move.speed;
            }

            if (this.move.bullets > 0 && this.move_progress % (this.move.duration / this.move.bullets) === 0) {
                var bullet = new EnemyBullet(this.x + this.width / 2, this.y + this.height / 2, 2, this.move.angle);
                game.rootScene.addChild(bullet);
            }

            if (this.move.duration === 0) {
            	var bx = this.x + this.width / 2;
            	var by = this.y + this.height / 2;
            	var dir_start = 90 - this.move.angle / 2;
            	var dir_shift = this.move.angle / (this.move.bullets - 1);
            	console.log(dir_start, dir_shift);
            	for (var i = 0; i < this.move.bullets; i++) {
            		var bullet = new EnemyBullet(bx, by, 2, dir_start + dir_shift * i);
            		game.rootScene.addChild(bullet);
            	}
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

var Enemy1 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set1.clone(), _x, _y);
		this.image = getAssets()['images/enemy1.png'];
	}
});

var Enemy2 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set2.clone(), _x, _y);
		this.image = getAssets()['images/enemy2.png'];
	}
});

var Enemy3 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set3.clone(), _x, _y);
		this.image = getAssets()['images/enemy3.png'];
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
		var ships = getShips();
		for (var k = 0; k < ships.length; k++) {
			if (ships[k] !== null && ships[k].intersect(this)) {
				if (ships[k].shield === null) {
					ships[k].health -= this.damage;
				}
				game.rootScene.removeChild(this);
			}
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

var EnemyBullet = Class.create(Bullet, {
	initialize: function(_x, _y, _damage, _direction) {
		Bullet.call(this, 8, 15);
		this.image = getAssets()['images/bullet2.png'];
		this.damage = _damage;
		this.rotate(_direction + 90);
		this.x = _x - this.width/2;
		this.y = _y - this.height/2;
		var dir_rad = (Math.PI * _direction) / 180;
		this.velX = Math.cos(dir_rad) * 5;
		this.velY = Math.sin(dir_rad) * 5;
	},
	
	onenterframe: function() {
		var ships = getShips();
		for (var k = 0; k < ships.length; k++) {
			if (ships[k] !== null && ships[k].shield !== null && ships[k].shield.intersect(this)) {
				game.rootScene.removeChild(this);
			}
			else if (ships[k] !== null && ships[k].intersect(this)) {
				ships[k].health -= this.damage;
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
	initialize: function(_x, _y, shipNum) {
		Bullet.call(this, 16, 28);
		this.image = getAssets()['images/player_bullet.png'];
		this.damage = 1;
		this.x = _x - this.width/2;
		this.y = _y - this.height;
		this.velX = 0;
		this.velY = -10;
	}
});

var PlayerMissile = Class.create(Bullet, {
	initialize: function(velocityX, velocityY, controllerNum) {
		Bullet.call(this, 20, 44);
		this.image = getAssets()['images/player_missile.png'];
		this.timer = 0;
		this.damage = 5;
		this.controller = controllerNum;		
		this.angle = 0;
		var ship = getShips()[controllerNum];
		this.x = ships[controllerNum].x + 15;
		this.y = ships[controllerNum].y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	},

	onenterframe: function() {
		var ships = getShips();
		this.timer++;
		for (var k = 0; k < ships.length; k++) {
			if (ships[k] !== null && ships[k].shield !== null && ships[k].shield.intersect(this) && this.timer > 45) {
				ships[this.controller].missileExists = false;
				game.rootScene.removeChild(this);
			}
			else if (ships[k] !== null && ships[k].intersect(this) && this.timer > 45) {
				ships[this.controller].missileExists = false;
				ships[k].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this) && enemies[j].onScreen) {
				ships[this.controller].missileExists = false;
				enemies[j].health -= this.damage;
				game.rootScene.removeChild(this);
			}
		}
		this.x += this.velX;
		this.y += this.velY;
		if (this.y > gameHeight || this.y < -this.height
		 || this.x > gameWidth || this.x < -this.width) {
			ships[this.controller].missileExists = false;
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
				this.rotate((180 * this.angle) / Math.PI - this.rotation + 90);
				this.velX = Math.cos(this.angle) * 5;
				this.velY = Math.sin(this.angle) * 5;
			}
		}
	}
});

var Pulse = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, gameWidth, 30);
		this.image = game.assets['images/pulse.png'];
	},
	onenterframe: function() {
		this.y += 4;
	}
});

var PulseScene = Class.create(Scene, {
	initialize: function() {
		Scene.apply(this);
		this.pulse = new Pulse();
		this.addChild(this.pulse);
		this.timer = 0;
		this.somethingDied = [false, false, false, false];
	},
	onenterframe: function() {
		this.timer++;
		if (this.pulse.y > gameHeight) {
			for (var v = 0; v < this.somethingDied.length; v++) {
				if (!this.somethingDied[v] && getShips()[v]) {
					getShips()[v].health = 0;
				}
			}
			if (!this.somethingDied) {
				
			}
			aud.resumepause();
			game.popScene();
		}
		if (this.timer > 30) {
			updateControllers();
			for (var k = 0; controllers[k] !== undefined; k++) {
				if (ships[k] === null) {
					continue;
				}
				if (controllers[k] !== undefined) {
					if (controllers[k].buttons[CONT_INPUT.rstick] === 1) {
						this.somethingDied[k] |= getShips()[k].removeComponent(MissileImage);
					}
					if (controllers[k].buttons[CONT_INPUT.a] === 1) {
						this.somethingDied[k] |= getShips()[k].removeComponent(ShieldImage);
					}
					if (controllers[k].buttons[CONT_INPUT.b] === 1) {
						this.somethingDied[k] |= getShips()[k].removeComponent(GunImage);
					}
					if (controllers[k].buttons[CONT_INPUT.y] === 1) {
						this.somethingDied[k] |= getShips()[k].removeComponent(GeneratorImage);
					}
				}
			}
		}
	}
});

var gameWidth = 600;
var gameHeight = 720;

var controller = null;
var formations = [];

var controllers = [];
function updateControllers()
{
	if (navigator.webkitGetGamepads) {
		controllers = navigator.webkitGetGamepads();
	}
}

function getAssets() {
	if (game !== null) {
		return game.assets;
	}
}

function getShips() {
	if (game !== null) {
		return game.getShips();
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
		'images/bg1.png', 'images/Square.png', 'images/player_bullet.png',
		'images/bullet2.png', 'images/enemy1.png', 'images/enemy2.png',
		'images/player_missile.png', 'images/playerShip1.png', 'images/player_shield.png',
		'images/pulse.png', 'sounds/Inception.mp3', 'images/playerShip_base.png',
		'images/playerShip_drive.png', 'images/playerShip_generator.png', 'images/playerShip_guns.png',
		'images/playerShip_missile.png', 'images/playerShip_shields.png', 'images/enemy3.png');
	
	game.fps = 60;
	game.scale = 1;

	game.getShips = function() {
		return ships;
	};

	game.onload = function() {
		var label, bg;
		label = new Label("TWENTY Players.  FOUR Controllers.");
		label.color = 'white';
		
		bg = new BG();
		bg.image = game.assets['images/bg1.png'];

		game.rootScene.addChild(bg);
		game.rootScene.addChild(label);
		
		updateControllers();
		
		var seed = Math.random() * 10000;
		aud.generatepattern(stress, energy, 8, true, seed);
		aud.playstop();
		console.log(seed);

		for (var k = 0; controllers[k] !== undefined; k++) {
			ships[k] = new Ship(k * 100, k);
			game.rootScene.addChild(ships[k]);
			healthDisplays[k] = new Label("Health " + k + ": " + ships[k].health);
			healthDisplays[k].color = 'white';
			healthDisplays[k].x = gameWidth - 65;
			healthDisplays[k].y = k * 30;
			game.rootScene.addChild(healthDisplays[k]);
			ships[k].drawComponents();
		}
		healthDisplay = new Label("Health: ");
		healthDisplay.color = 'white';
		healthDisplay.x = gameWidth - 60;

		// addEnemy(new Enemy1(75, 30));
		// addEnemy(new Enemy1(225, 30));
		// addEnemy(new Enemy1(375, 30));
		// addEnemy(new Enemy2(150, 30));
		// addEnemy(new Enemy2(300, 30));
				
		game.rootScene.addEventListener('enterframe', function(e) {
			var gameOver = true;
			for (var q = 0; q < ships.length; q++) {
				if (ships[q] !== null && ships[q].health > 0) {
					gameOver = false;
					break;
				}
			}
			if (gameOver) {
				aud.playstop();
				game.stop();
			}
			if (ships[0] !== null && game.rootScene.age % 120 === 0) {
				stress = 1 - ships[0].health / ships[0].maxHealth;
				energy = (enemies.length > 20 ? 20 : enemies.length) / 20;
				aud.adaptpattern(stress, energy);
			}
			if (game.rootScene.age % 600 === 0 && game.rootScene.age > 1) {
				game.assets['sounds/Inception.mp3'].play();
				aud.resumepause();
				game.pushScene(new PulseScene());
			}
			
			updateControllers();

			if (enemies.length == 0 || enemies[enemies.length - 1].onScreen) {
			    LoadFormation0();
			    LoadFormation1();
			}
			for (i = 0; i < enemies.length; i++) {
			    if (enemies[i].y > gameHeight) {
			        game.rootScene.removeChild(enemies[i]);
			        enemies.splice(i, 1);
			        i--;
			    }
			}

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
						ships[k].updateComponents();
					}
					else if (controllers[k].axes[CONT_INPUT.lstick_y] > 0.5 || controllers[k].axes[CONT_INPUT.lstick_y] < -0.5) {
						ships[k].y += controllers[k].axes[CONT_INPUT.lstick_y] * ships[k].speed;
						ships[k].updateComponents();
					}
					if (controllers[k].buttons[CONT_INPUT.b] === 1 && ships[k].bulletTimer >= 10) {
						if (ships[k].checkComponent(GunImage)) {
							game.rootScene.addChild(new PlayerBullet(ships[k].x + ships[k].width/2, ships[k].y, k));
							ships[k].bulletTimer = 0;
						}
					}
					if (controllers[k].buttons[CONT_INPUT.a] === 1 && ships[k].shield === null) {
						if (ships[k].checkComponent(ShieldImage)) {
							ships[k].shield = new Shield(k);
							game.rootScene.addChild(ships[k].shield);
						}
					}
					else if (controllers[k].buttons[CONT_INPUT.a] === 0 && ships[k].shield !== null) {
						game.rootScene.removeChild(ships[k].shield);
						ships[k].shield = null;
					}
					if (controllers[k].buttons[CONT_INPUT.rstick] === 1) {
						if (ships[k].checkComponent(MissileImage)) {
							if (ships[k].missileExists === false) {
								ships[k].missileExists = true;
								var y = controllers[k].axes[CONT_INPUT.rstick_y] < -0.5 ? 5 : -5;
								game.rootScene.addChild(new PlayerMissile(0, y, k));
							}
						}
					}
				}
			}
		});
	};
    game.start();
};
