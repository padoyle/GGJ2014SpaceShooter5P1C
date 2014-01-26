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
var scalingDifficultyNumber = 1;
var energy = 0;
var stress = 0;

var barRed;
var barBlue;
var barGreen;
var barYellow;
var barGray;

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
var HealthBar = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, 49, 10);
		this.opacity = .8;
	}
});
var Filling = Class.create(Sprite, {
	initialize: function(x, y, isYellow) {
		if (isYellow) {
			Sprite.call(this, 15, 15);
		}
		else {
			Sprite.call(this, 118, 15);
		}
		this.isYellow = isYellow;
		this.x = x + 3;
		this.y = y + 3;
		this.power = 100;
	},
	addValue: function(amount) {
		this.power += amount;
		if (this.power > 100) {
			this.power = 100;
		}
		if (this.power < 0) {
			this.power = 0;
		}
	},
	onenterframe: function() {
		if (this.isYellow) {
			this.width = this.power / 100 * 15;
		}
		else {
			this.width = this.power / 100 * 118;
		}
	}
});
var HitImage = Class.create(Sprite, {
	initialize: function(x, y, big) {
		if (big) {
			Sprite.call(this, 41, 39);
			this.x = x - 3;
			this.y = y - 4;
		}
		else {
			Sprite.call(this, 35, 35);
			this.x = x;
			this.y = y - 2.5;
		}
	}
});
var ButtonIcon = Class.create(Sprite, {
	initialize: function(x, y, buttonNum) {
		Sprite.call(this, 30, 30);
		this.passiveImage;
		this.activeImage;
		this.x = x - 35;
		this.y = y - 5;
		this.buttonNum = buttonNum;
		if (buttonNum > CONT_INPUT.lb) {
			this.hitImage = new HitImage(this.x, this.y, true);
			this.hitImage.image = game.assets['images/gui_buttonHit1.png'];
		}
		else {
			this.hitImage = new HitImage(this.x, this.y, false);
			this.hitImage.image = game.assets['images/gui_buttonHit0.png'];
		}
	},
	onenterframe: function() {
		updateControllers();
		if (controllers[0]) {
			if (controllers[0].buttons[this.buttonNum] === 1) {
				this.image = this.activeImage;
				game.rootScene.addChild(this.hitImage);
			}
			else {
				this.image = this.passiveImage;
				game.rootScene.removeChild(this.hitImage);
			}
		}
	}
});
var Bar = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 131, 29);
		this.x = x;
		this.y = y;
		this.image = game.assets['images/gui_barFrame.png'];
		this.filling;
		this.button;
	}
});

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
		this.healthBar = new HealthBar();
		this.healthBar.x = this.x;
		this.healthBar.y = this.y + this.height + 5;
		this.healthBar.image = game.assets['images/gui_barHealth.png'];
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
		
		this.updateComponents();
		
		this.addEventListener('enterframe', function() {
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
		this.healthBar.x = this.x;
		this.healthBar.y = this.y + 5 + this.height;
		this.healthBar.width = (this.health / this.maxHealth) * 49;
		console.log(this.healthBar.x  + " " + this.healthBar.y);
	},
	removeComponents: function() {
		for (var g = 0; g < this.components.length; g++) {
			game.rootScene.removeChild(this.components[g]);
		}
		this.components = [];
		game.rootScene.removeChild(this.healthBar);
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
		game.rootScene.addChild(this.healthBar);
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
        this.heatlh = 10;
        this.velX = Math.cos(this.move.direction) * this.move.speed;
        this.velY = Math.sin(this.move.direction) * this.move.speed;
        this.onScreen = false;
        this.health = 5;
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
		this.health = 10;
	}
});

var Enemy2 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set2.clone(), _x, _y);
		this.image = getAssets()['images/enemy2.png'];
		this.health = 10;
	}
});

var Enemy3 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set3.clone(), _x, _y);
		this.image = getAssets()['images/enemy3_2.png'];
		this.health = 8;
	}
});

var Enemy4 = Class.create(Enemy, {
	initialize: function(_x, _y) {
		Enemy.call(this, enemy_movesets.set4.clone(), _x, _y);
		this.image = getAssets()['images/enemy1.png'];
		this.health = 6;
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
					ships[k].updateComponents();
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
				ships[k].updateComponents();
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
				ships[k].updateComponents();
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
					getShips()[v].updateComponents();
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
		'images/playerShip_missile.png', 'images/playerShip_shields.png', 'images/enemy3_2.png',
		'images/gui_barFrame.png', 'images/gui_barRed.png', 'images/gui_barGreen.png',
		'images/gui_barYellow0.png', 'images/gui_barBlue.png', 'images/gui_barGray.png',
		'images/gui_buttonR.png', 'images/gui_buttonL.png', 'images/gui_buttonA.png',
		'images/gui_buttonY.png', 'images/gui_buttonB.png', 'images/gui_buttonRH.png',
		'images/gui_buttonAH.png', 'images/gui_buttonBH.png', 'images/gui_buttonYH.png',
		'images/gui_buttonLH.png', 'images/gui_barHealth.png', 'images/gui_buttonHit0.png',
		'images/gui_buttonHit1.png');
	
	game.fps = 60;
	game.scale = 1;

	game.getShips = function() {
		return ships;
	};

	game.onload = function() {
		var label, bg, bar;
		label = new Label("TWENTY Players.  FOUR Controllers.");
		label.color = 'white';
		
		bg = new BG();
		bg.image = game.assets['images/bg1.png'];
		
		barRed = new Bar(80, gameHeight - 50);
		barRed.filling = new Filling(barRed.x, barRed.y, false);
		barRed.filling.image = game.assets['images/gui_barRed.png'];
		barRed.button = new ButtonIcon(barRed.x, barRed.y, CONT_INPUT.b);
		barRed.button.passiveImage = game.assets['images/gui_buttonB.png'];
		barRed.button.activeImage = game.assets['images/gui_buttonBH.png'];
		
		barYellow = new Bar(245, gameHeight - 50);
		barYellow.filling = new Filling(barYellow.x, barYellow.y, true);
		barYellow.filling.image = game.assets['images/gui_barYellow0.png'];
		
		barYellow.button = new ButtonIcon(barYellow.x, barYellow.y, CONT_INPUT.y);
		barYellow.button.passiveImage = game.assets['images/gui_buttonY.png'];
		barYellow.button.activeImage = game.assets['images/gui_buttonYH.png'];
		
		barGreen = new Bar(410, gameHeight - 50);
		barGreen.filling = new Filling(barGreen.x, barGreen.y, false);
		barGreen.filling.image = game.assets['images/gui_barGreen.png'];
		barGreen.button = new ButtonIcon(barGreen.x, barGreen.y, CONT_INPUT.a);
		barGreen.button.passiveImage = game.assets['images/gui_buttonA.png'];
		barGreen.button.activeImage = game.assets['images/gui_buttonAH.png'];
		
		barBlue = new Bar(170, gameHeight - 100);
		barBlue.filling = new Filling(barBlue.x, barBlue.y, false);
		barBlue.filling.image = game.assets['images/gui_barBlue.png'];
		barBlue.button = new ButtonIcon(barBlue.x, barBlue.y, CONT_INPUT.lstick);
		barBlue.button.passiveImage = game.assets['images/gui_buttonL.png'];
		barBlue.button.activeImage = game.assets['images/gui_buttonLH.png'];
		
		barGray = new Bar(335, gameHeight - 100);
		barGray.filling = new Filling(barGray.x, barGray.y, false);
		barGray.filling.image = game.assets['images/gui_barGray.png'];
		barGray.button = new ButtonIcon(barGray.x, barGray.y, CONT_INPUT.rstick);
		barGray.button.passiveImage = game.assets['images/gui_buttonR.png'];
		barGray.button.activeImage = game.assets['images/gui_buttonRH.png'];

		game.rootScene.addChild(bg);
		game.rootScene.addChild(label);
		game.rootScene.addChild(barRed);
		game.rootScene.addChild(barRed.filling);
		game.rootScene.addChild(barRed.button);
		game.rootScene.addChild(barYellow);
		game.rootScene.addChild(barYellow.filling);
		game.rootScene.addChild(barYellow.button);
		game.rootScene.addChild(barGreen);
		game.rootScene.addChild(barGreen.filling);
		game.rootScene.addChild(barGreen.button);
		game.rootScene.addChild(barBlue);
		game.rootScene.addChild(barBlue.filling);
		game.rootScene.addChild(barBlue.button);
		game.rootScene.addChild(barGray);
		game.rootScene.addChild(barGray.filling);
		game.rootScene.addChild(barGray.button);
		
		updateControllers();
		
		var seed = Math.random() * 10000;
		aud.generatepattern(stress, energy, 8, true, seed);
		aud.playstop();
		console.log(seed);

		for (var k = 0; controllers[k] !== undefined; k++) {
			ships[k] = new Ship(k * 100, k);
			game.rootScene.addChild(ships[k]);
			ships[k].drawComponents();
		}
		healthDisplay = new Label("Health: ");
		healthDisplay.color = 'white';
		healthDisplay.x = gameWidth - 60;

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
					if (controllers[k].axes[CONT_INPUT.lstick_y] > 0.5 || controllers[k].axes[CONT_INPUT.lstick_y] < -0.5) {
						ships[k].y += controllers[k].axes[CONT_INPUT.lstick_y] * ships[k].speed;
						ships[k].updateComponents();
					}
					if (controllers[k].buttons[CONT_INPUT.b] === 1 && ships[k].bulletTimer >= 10) {
						if (ships[k].checkComponent(GunImage)) {
							game.rootScene.addChild(new PlayerBullet(ships[k].x + ships[k].width/2, ships[k].y, k));
							ships[k].bulletTimer = 0;
						}
					}
					if (controllers[k].buttons[CONT_INPUT.a] === 1) {
						if (ships[k].shield === null) {
							if (ships[k].checkComponent(ShieldImage)) {
								ships[k].shield = new Shield(k);
								game.rootScene.addChild(ships[k].shield);
							}
						}
						else {
							barGreen.filling.addValue(-2);
						}
						if (barGreen.filling.power === 0) {
							if (ships[k].shield !== null) {
								game.rootScene.removeChild(ships[k].shield);
								ships[k].shield = null;
							}
						}
					}
					else if (controllers[k].buttons[CONT_INPUT.a] === 0) {
						if (ships[k].shield !== null) {
							game.rootScene.removeChild(ships[k].shield);
							ships[k].shield = null;
						}
						barGreen.filling.addValue(1);
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
