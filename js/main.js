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
var bgm = null;
var enemies = []; // all enemies
var scalingDifficultyNumber = 1;
var functions = [];

var barRed;
var barBlue;
var barGreen;
var barYellow;
var barGray;

var onlineSound;
var offlineSound;
var soundTimer = 0;
var soundsList = [];
var online = true;

var brakesToggle = false;
var brakesPressed = false;

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
var Ticker = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 6, 15);
		this.x = x;
		this.y = y + 3;
		this.speed = 4;
		this.missTimer = 0;
		this.colorTimer = 0;
		this.neutImage = game.assets['images/gui_barTick.png'];
		this.goodImage = game.assets['images/gui_barTick1.png'];
		this.badImage = game.assets['images/gui_barTick2.png'];
		this.image = this.neutImage;
	},
	onenterframe: function() {
		if (this.missTimer > 0) {
			this.missTimer--;
		}
		if (this.colorTimer > 0) {
			this.colorTimer--;
		}
		if (this.colorTimer === 0) {
			this.image = this.neutImage;
		}

	}
});
var Filling = Class.create(Sprite, {
	initialize: function(x, y, color) {
		if (color === "yellow") {
			Sprite.call(this, 15, 15);
		}
		else {
			Sprite.call(this, 118, 15);
		}
		this.color = color;
		this.x = x + 3;
		this.y = y + 3;
		this.speed = 1;
		this.released = true;
		this.minX = x;
		this.maxX = x + 112; // These are used for yellow bar
		this.ticker = new Ticker(x, y);
		this.power = 100;
	},
	addValue: function(amount) {
		this.power += amount;
		if (this.power > 100) {
			this.power = 100;
		}
		if (this.power < 0) {
			if (barRed.filling.power > 0) {
				barRed.filling.addValue(-1);
			}
			if (barGreen.filling.power > 0) {
				barGreen.filling.addValue(-1);
			}
			if (barBlue.filling.power > 0) {
				barBlue.filling.addValue(-1);
			}
			if (barGray.filling.power > 0) {
				barGray.filling.addValue(-1);
			}
			this.power = 0;
		}
	},
	onenterframe: function() {
		if (this.color === "yellow") {
			if (!getShip().checkComponent(GeneratorImage)) {
				this.ticker.visible = false;
				return;
			}
			else {
				this.ticker.visible = true;
			}
			this.x += this.speed;
			this.ticker.x += this.ticker.speed;
			if (this.ticker.x <= this.minX || this.ticker.x >= this.maxX) {
				this.ticker.speed *= -1;
			}
			if (this.x <= this.minX || this.x >= this.maxX) {
				this.speed *= -1;
			}
		}
		else {
			if (this.color === "red" && !getShip().checkComponent(GunImage)) {
				this.power = 0;
			}
			if (this.color === "green" && !getShip().checkComponent(ShieldImage)) {
				this.power = 0;
			}
			if (this.color === "gray" && !getShip().checkComponent(MissileImage)) {
				this.power = 0;
			}
			this.width = this.power / 100 * 118;
		}
	},
	checkticker: function() {
		if (this.color === "yellow" && this.ticker.missTimer === 0 && this.released === true) {
			if (this.ticker.intersect(this)) {
				this.ticker.image = this.ticker.goodImage;
				barYellow.flashGreen();
				this.ticker.colorTimer = 30;
				barRed.filling.addValue(30);
				barGreen.filling.addValue(30);
				barGray.filling.addValue(30);
				barBlue.filling.addValue(30);
				getShip().addHealth(1);
			}
			else if (Math.abs((this.ticker.x + this.ticker.width / 2)
							 - (this.x + this.width / 2)) < 20) {
				this.ticker.image = this.ticker.goodImage;
				barYellow.flashGreen();
				this.ticker.colorTimer = 30;
				barRed.filling.addValue(5);
				barGreen.filling.addValue(5);
				barGray.filling.addValue(5);
				barBlue.filling.addValue(5);
			}
			else {
				barYellow.flashRed();
				this.ticker.colorTimer = 60;
				this.ticker.missTimer = 60;
				this.ticker.image = this.ticker.badImage;
			}
			this.released = false;
		}
	},
	releaseticker: function() {
		if (this.color === "yellow") {
			this.released = true;
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
		updatecontroller();
		if (controller) {
			if (controller.buttons[this.buttonNum] === 1) {
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
		this.filling;
		this.filling2;
		this.greenFlash = null;
		this.redFlash = null;
		this.noFlash = null;
		this.neutral = game.assets['images/gui_barFrame.png'];
		this.image = this.neutral;
		this.good = true;
		this.button;
		this.timer = 0;
	},
	onenterframe: function() {
		if (this.timer === 0) {
			this.image = this.neutral;
		}
		else {
			this.timer--;
			if (this.timer % 10 === 0) {
				if (this.good) {
					this.image = this.greenFlash;
				}
				else {
					this.image = this.redFlash;
				}
			}
			else if (this.timer % 5 === 0) {
				this.image = this.noFlash;
			}
		}
	},
	flashGreen: function() {
		if (this.greenFlash !== null) {
			this.timer = 30;
			this.good = true;
			this.image = this.greenFlash;
		}
	},
	flashRed: function() {
		if (this.redFlash !== null) {
			this.timer = 60;
			this.good = false;
			this.image = this.redFlash;
		}
	}
});

var Component = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 50, 51);
		this.x = x;
		this.y = y;
		this.sound = null;
	},
	update: function() {
		if (getShip() !== undefined && getShip().health > 0) {
			this.x = getShip().x;
			this.y = getShip().y;
		}
	},
	playSound: function() {
		if (this.sound !== null) {
			this.sound.play();
		}
	}
});
var ShieldImage = Class.create(Component, {
	initialize: function(x, y) {
		Component.call(this, x, y);
		this.image = getAssets()['images/playerShip_shields.png'];
		this.sound = getAssets()['sounds/shield.mp3'];
	}
});
var MissileImage = Class.create(Component, {
	initialize: function(x, y) {
		Component.call(this, x, y);
		this.image = getAssets()['images/playerShip_missile.png'];
		this.sound = getAssets()['sounds/missiles.mp3'];
	}
});
var GunImage = Class.create(Component, {
	initialize: function(x, y) {
		Component.call(this, x, y);
		this.image = getAssets()['images/playerShip_guns.png'];
		this.sound = getAssets()['sounds/lazers.mp3'];
	}
});
var GeneratorImage = Class.create(Component, {
	initialize: function(x, y) {
		Component.call(this, x, y);
		this.image = getAssets()['images/playerShip_generator.png'];
		this.sound = getAssets()['sounds/generator.mp3'];
	}
});

var Ship = Class.create(Sprite, {
	initialize: function(x) {
		Sprite.call(this, 50, 51);
		this.image = getAssets()['images/playerShip_base.png'];
		this.frame = 0; 
		this.maxHealth = 14; //If health is balanced, change this too
		this.health = this.maxHealth;
		this.speed = 3;
		this.x = x;
		this.y = 360;
		this.hitBox = new Sprite(20, 20);
		this.hitBox.x = this.x + 15;
		this.hitBox.y = this.y + 15;
		game.rootScene.addChild(this.hitBox);
		this.healthBar = new HealthBar();
		this.healthBar.x = this.x;
		this.healthBar.y = this.y + this.height + 5;
		this.healthBar.image = game.assets['images/gui_barHealth.png'];
		this.bulletTimer = 30;
		this.shield = null;
		this.missile = null;
		this.explosionPrimed = false;
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
				ship = null;
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
			this.hitBox.x = this.x + 10;
			this.hitBox.y = this.y + 10;
		});
	},
	updateComponents: function() {
		for (var f = 0; f < this.components.length; f++) {
			this.components[f].update();
		}
		this.healthBar.x = this.x;
		this.healthBar.y = this.y + 5 + this.height;
		this.healthBar.width = (this.health / this.maxHealth) * 49;
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
				soundsList.push(new clazz(0, 0).sound);
				soundTimer += 45;
				online = false;
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
	addComponent: function(clazzz) {
		if (!checkComponent(clazzz)) {
			soundsList.push(new clazzz(0, 0).sound);
			soundTimer += 45;
			online = true;
			this.components.push(new clazz(this.x, this.y, this.number));
		}
	},
	drawComponents: function() {
		for (var w = 0; w < this.components.length; w++) {
			if (this.components[w]) {
				game.rootScene.addChild(this.components[w]);
			}
		}
		game.rootScene.addChild(this.healthBar);
	},
	addHealth: function(_amount) {
		this.health += _amount;
		if (this.health > this.maxHealth)
			this.health = this.maxHealth;
		this.updateComponents();
	},
	explodeMissile: function() {
		if (this.missile !== null) {
			this.missile.explode();
			this.explosionPrimed = false;
			this.missilePrimed = false;
			this.missile = null;
		}
	}
});

var Shield = Class.create(Sprite, {
	initialize: function() {
		Sprite.call(this, 71, 64);
		this.image = game.assets['images/player_shield.png'];
		this.frame = 0;
		this.x = getShip().x - 10;
		this.y = getShip().y - 12;
	},
	onenterframe: function() {
		this.x = getShip().x - 10;
		this.y = getShip().y - 12;
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
                game.rootScene.insertBefore(bullet, this);
            }

            if (this.move.duration === 0) {
                var bx = this.x + this.width / 2;
                var by = this.y + this.height / 2;
                var dir_start = 90 - this.move.angle / 2;
                var dir_shift = this.move.angle / (this.move.bullets - 1);
                console.log(dir_start, dir_shift);
                for (i = 0; i < this.move.bullets; i++) {
                    bullet = new EnemyBullet(bx, by, 2, dir_start + dir_shift * i);
 	               game.rootScene.insertBefore(bullet, this);
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
		this.image = getAssets()['images/enemy2_2.png'];
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
		Enemy.call(this, enemy_movesets.set5.clone(), _x, _y);
		this.image = getAssets()['images/enemy1.png'];
		this.health = 6;
	}
});

var Enemy5 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set6.clone(), _x, _y);
        this.image = getAssets()['images/enemy2_2.png'];
        this.health = 6;
    }
});

var Enemy6 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set7.clone(), _x, _y);
        this.image = getAssets()['images/enemy1.png'];
        this.health = 6;
    }
});

var Enemy7 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set8.clone(), _x, _y);
        this.image = getAssets()['images/enemy3_2.png'];
        this.health = 8;
    }
});

var Enemy8 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set9.clone(), _x, _y);
        this.image = getAssets()['images/enemy2_2.png'];
        this.health = 6;
    }
});

var Enemy9 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set10.clone(), _x, _y);
        this.image = getAssets()['images/enemy1.png'];
        this.health = 6;
    }
});

var Enemy10 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set11.clone(), _x, _y);
        this.image = getAssets()['images/enemy1.png'];
        this.health = 6;
    }
});

var Enemy11 = Class.create(Enemy, {
    initialize: function (_x, _y) {
        Enemy.call(this, enemy_movesets.set12.clone(), _x, _y);
        this.image = getAssets()['images/enemy1.png'];
        this.health = 6;
    }
});

var pickFormation = function () {
    var random = Math.random() * (functions.length - 1);
    random = Math.floor(random);
    functions[random]();
}

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
		if (ship !== null && ship.hitBox.intersect(this)) {
			if (ship.shield === null) {
				ship.health -= this.damage;
				ship.updateComponents();
			}
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

var EnemyBullet = Class.create(Bullet, {
	initialize: function(_x, _y, _damage, _direction) {
		Bullet.call(this, 16, 28);
		this.image = getAssets()['images/enemy_bullet.png'];
		this.damage = _damage;
		this.rotate(_direction + 90);
		this.x = _x - this.width/2;
		this.y = _y - this.height/2;
		var dir_rad = (Math.PI * _direction) / 180;
		this.velX = Math.cos(dir_rad) * 5;
		this.velY = Math.sin(dir_rad) * 5;
	},
	
	onenterframe: function() {
		var ship = getShip();
		if (ship !== null && ship.shield !== null && ship.shield.intersect(this)) {
			game.rootScene.removeChild(this);
		}
		else if (ship !== null && ship.hitBox.intersect(this)) {
			ship.health -= this.damage;
			ship.updateComponents();
			game.rootScene.removeChild(this);
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
	initialize: function(_x, _y, angle) {
		Bullet.call(this, 16, 28);
		this.image = getAssets()['images/player_bullet.png'];
		this.damage = 2;
		this.angle = angle;
		this.rotate(90 + (180 * angle) / Math.PI);
		this.x = _x - this.width/2;
		this.y = _y - this.height;
		this.velX = 10 * Math.cos(this.angle);
		this.velY = 10 * Math.sin(this.angle);
	}
});
var MissileExplosion = Class.create(Sprite, {
	initialize: function(x, y) {
		Sprite.call(this, 68, 68);
		this.x = x - 24;
		this.y = y - 11;
		this.opacity = 1;
		this.damage = 6;
		this.image = game.assets['images/explosion2.png'];
	},
	onenterframe: function() {
		if (this.opacity === 1) {
			game.assets['sounds/explosion0.mp3'].play();
			for (var c = 0; c < enemies.length; c++) {
				if (enemies[c].intersect(this)) {
					enemies[c].health -= this.damage;
				}
			}
		}
		this.opacity -= 1/60;
		if (this.opacity <= 0) {
			game.rootScene.removeChild(this);
		}
	}
});

var PlayerMissile = Class.create(Bullet, {
	initialize: function(velocityX, velocityY) {
		Bullet.call(this, 20, 44);
		this.image = getAssets()['images/player_missile.png'];
		this.timer = 0;
		this.damage = 0;
		this.angle = 0;
		var ship = getShip();
		this.x = ship.x + 15;
		this.y = ship.y - 20;
		this.velX = velocityX;
		this.velY = velocityY;
	},

	onenterframe: function() {
		var ship = getShip();
		this.timer++;
		if (ship.shield !== null && ship.shield.intersect(this) && this.timer > 45) {
			ship.explodeMissile();
			return;
		}
		else if (ship.hitBox.intersect(this) && this.timer > 45) {
			ship.explodeMissile();
			return;
		}
		
		for (var j = 0; j < enemies.length; j++) {
			if (enemies[j].intersect(this) && enemies[j].onScreen) {
				ship.explodeMissile();
				return;
			}
		}
		this.x += this.velX;
		this.y += this.velY;
		if (this.y > gameHeight || this.y < -this.height
		 || this.x > gameWidth || this.x < -this.width) {
			ship.explodeMissile();
			return;
		}
		else {
			if (controller.axes[CONT_INPUT.rstick_x] > 0.5 
			|| controller.axes[CONT_INPUT.rstick_x] < -0.5
			|| controller.axes[CONT_INPUT.rstick_y] > 0.5 
			|| controller.axes[CONT_INPUT.rstick_y] < -0.5) {
				this.angle = Math.atan(controller.axes[CONT_INPUT.rstick_y] /
				              controller.axes[CONT_INPUT.rstick_x]);
				if (controller.axes[CONT_INPUT.rstick_x] < 0) {
					this.angle += Math.PI;
				}
				this.rotate((180 * this.angle) / Math.PI - this.rotation + 90);
				this.velX = Math.cos(this.angle) * 5;
				this.velY = Math.sin(this.angle) * 5;
			}
		}
	},
	explode: function() {
		game.rootScene.addChild(new MissileExplosion(this.x, this.y));
		game.rootScene.removeChild(this);
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
		this.somethingDied = false;
	},
	onenterframe: function() {
		this.timer++;
		if (this.pulse.y > gameHeight) {
			for (var v = 0; v < this.somethingDied.length; v++) {
				if (!this.somethingDied && getShip()) {
					getShip().health = 0;
					getShip().updateComponents();
				}
			}
			bgm.play();
			game.popScene();
		}
		if (this.timer > 30) {
			updatecontroller();
			if (controller !== undefined) {
				if (controller.buttons[CONT_INPUT.rstick] === 1) {
					this.somethingDied |= getShip().removeComponent(MissileImage);
				}
				if (controller.buttons[CONT_INPUT.a] === 1) {
					this.somethingDied |= getShip().removeComponent(ShieldImage);
				}
				if (controller.buttons[CONT_INPUT.b] === 1) {
					this.somethingDied |= getShip().removeComponent(GunImage);
				}
				if (controller.buttons[CONT_INPUT.y] === 1) {
					this.somethingDied |= getShip().removeComponent(GeneratorImage);
				}
			}
		}
	}
});

var StartScene = Class.create(Scene, {
	initialize: function() {
		Scene.apply(this);
		
		var sprite = new Sprite(600, 720);
		sprite.image = game.assets['images/start.png'];
		this.addChild(sprite);
		game.pushScene(this);
	},
		
	onenterframe: function() {
		updatecontroller();
		if (controller !== undefined) {
			if (controller.buttons[CONT_INPUT.start] === 1) {
				// Call game state
				game.popScene();
			}
		}
	}
});

var gameWidth = 600;
var gameHeight = 720;

var controller = null;
var formations = [];

function updatecontroller()
{
	if (navigator.webkitGetGamepads) {
		controller = navigator.webkitGetGamepads()[0];
	}
}

function getAssets() {
	if (game !== null) {
		return game.assets;
	}
}

function getShip() {
	if (game !== null) {
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
		'images/bg1.png', 'images/Square.png', 'images/player_bullet.png',
		'images/enemy_bullet.png', 'images/enemy1.png', 'images/enemy2_2.png',
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
		'images/gui_buttonHit1.png', 'images/gui_barTick.png', 'images/gui_barTick1.png',
		'images/gui_barTick2.png', 'images/explosion0.png', 'images/explosion1.png',
		'images/explosion2.png', 'sounds/explosion0.mp3', 'images/gui_barFrame_Flash.png',
		'images/gui_barFrame_FlashRed.png', 'images/gui_barFrame_FlashGreen.png',
		'sounds/generator.mp3', 'sounds/shield.mp3', 'sounds/missiles.mp3',
		'sounds/offline.mp3', 'sounds/online.mp3', 'sounds/lazers.mp3',
		'sounds/HELLISTHEBULLET.wav', 'images/start.png');
	
	game.fps = 60;
	game.scale = 1;
	
	bgm = game.assets['sounds/HELLISTHEBULLET.wav'];

	var ship;

	game.getShip = function() {
		return ship;
	};

	game.onload = function() {
		var label, bg, bar;
		var startScreen = new StartScene();

        FunctionSetup();
		label = new Label("FIVE Players.  ONE controller.");
		label.color = 'white';
		
		bg = new BG();
		bg.image = game.assets['images/bg1.png'];
		
		onlineSound = game.assets['sounds/online.mp3'];
		offlineSound = game.assets['sounds/offline.mp3'];
		
		barRed = new Bar(80, gameHeight - 50);
		barRed.filling = new Filling(barRed.x, barRed.y, "red");
		barRed.filling.image = game.assets['images/gui_barRed.png'];
		barRed.button = new ButtonIcon(barRed.x, barRed.y, CONT_INPUT.b);
		barRed.button.passiveImage = game.assets['images/gui_buttonB.png'];
		barRed.button.activeImage = game.assets['images/gui_buttonBH.png'];
		
		barYellow = new Bar(245, gameHeight - 50);
		barYellow.greenFlash = game.assets['images/gui_barFrame_FlashGreen.png'];
		barYellow.redFlash = game.assets['images/gui_barFrame_FlashRed.png'];
		barYellow.noFlash = game.assets['images/gui_barFrame_Flash.png'];
		barYellow.filling = new Filling(barYellow.x, barYellow.y, "yellow");
		barYellow.filling.image = game.assets['images/gui_barYellow0.png'];
		barYellow.filling2 = new Filling(barYellow.x, barYellow.y, "gray2");
		barYellow.filling2.image = game.assets['images/gui_barGray.png'];
		
		barYellow.button = new ButtonIcon(barYellow.x, barYellow.y, CONT_INPUT.y);
		barYellow.button.passiveImage = game.assets['images/gui_buttonY.png'];
		barYellow.button.activeImage = game.assets['images/gui_buttonYH.png'];
		
		barGreen = new Bar(410, gameHeight - 50);
		barGreen.filling = new Filling(barGreen.x, barGreen.y, "green");
		barGreen.filling.image = game.assets['images/gui_barGreen.png'];
		barGreen.button = new ButtonIcon(barGreen.x, barGreen.y, CONT_INPUT.a);
		barGreen.button.passiveImage = game.assets['images/gui_buttonA.png'];
		barGreen.button.activeImage = game.assets['images/gui_buttonAH.png'];
		
		barBlue = new Bar(170, gameHeight - 100);
		barBlue.filling = new Filling(barBlue.x, barBlue.y, "blue");
		barBlue.filling.image = game.assets['images/gui_barBlue.png'];
		barBlue.button = new ButtonIcon(barBlue.x, barBlue.y, CONT_INPUT.lstick);
		barBlue.button.passiveImage = game.assets['images/gui_buttonL.png'];
		barBlue.button.activeImage = game.assets['images/gui_buttonLH.png'];
		
		barGray = new Bar(335, gameHeight - 100);
		barGray.filling = new Filling(barGray.x, barGray.y, "gray");
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
		game.rootScene.addChild(barYellow.filling2);
		game.rootScene.addChild(barYellow.filling);
		game.rootScene.addChild(barYellow.button);
		game.rootScene.addChild(barYellow.filling.ticker);
		game.rootScene.addChild(barGreen);
		game.rootScene.addChild(barGreen.filling);
		game.rootScene.addChild(barGreen.button);
		game.rootScene.addChild(barBlue);
		game.rootScene.addChild(barBlue.filling);
		game.rootScene.addChild(barBlue.button);
		game.rootScene.addChild(barGray);
		game.rootScene.addChild(barGray.filling);
		game.rootScene.addChild(barGray.button);
		
		updatecontroller();
		
		bgm = game.assets['sounds/HELLISTHEBULLET.wav'];
		bgm.play();
		
		ship = new Ship(100);
		game.rootScene.addChild(ship);
		ship.drawComponents();

		healthDisplay = new Label("Health: ");
		healthDisplay.color = 'white';
		healthDisplay.x = gameWidth - 60;

		game.rootScene.addEventListener('enterframe', function(e) {
			var gameOver = true;
			if (ship !== null && ship.health > 0) {
				gameOver = false;
			}
			if (gameOver) {
				bgm.stop()
				game.stop();
			}
			
			if (bgm.currentTime >= bgm.duration) {
				bgm.play();
			}
			
			if (soundTimer !== 0) {
				if (soundTimer === 1) {
					if (online) {
						onlineSound.play();
					}
					else {
						offlineSound.play();
					}
				}
				else if (soundTimer % 45 === 0) {
					soundsList[0].play();
					soundsList.splice(soundsList[0], 1);
				}
				console.log(soundTimer);
				soundTimer--;
			}
			
			updatecontroller();

			if (enemies.length == 0 || enemies[enemies.length - 1].onScreen) {
                pickFormation();
   			}
			for (i = 0; i < enemies.length; i++) {
			    if (enemies[i].y > gameHeight) {
			        game.rootScene.removeChild(enemies[i]);
			        enemies.splice(i, 1);
			        i--;
			    }
			}

			if (controller !== undefined) {
				if (controller.buttons[CONT_INPUT.lstick] === 1) {
					brakesPressed = true;
				}
				else {
					if (brakesPressed) {
						brakesToggle = !brakesToggle;
						brakesPressed = false;
					}
				}
				if (brakesToggle) {
					ship.speed = 3.5;						
					barBlue.filling.addValue(-0.9);
				}
				else {
					ship.speed = 7;
					barBlue.filling.addValue(0.5);
				}
				if (controller.axes[CONT_INPUT.lstick_x] > 0.5 || controller.axes[CONT_INPUT.lstick_x] < -0.5) {
					ship.x += controller.axes[CONT_INPUT.lstick_x] * ship.speed;
					ship.updateComponents();
				}
				if (controller.axes[CONT_INPUT.lstick_y] > 0.5 || controller.axes[CONT_INPUT.lstick_y] < -0.5) {
					ship.y += controller.axes[CONT_INPUT.lstick_y] * ship.speed;
					ship.updateComponents();
				}
				if (controller.buttons[CONT_INPUT.b] === 1 && ship.bulletTimer >= 10) {
					if (ship.checkComponent(GunImage)) {
						if (barRed.filling.power === 100) {
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI / 2));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 7 / 16));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 3 / 8));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 5 / 16));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI / 4));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 9 / 16));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 5 / 8));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 11 / 16));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 3 / 4));
							ship.bulletTimer = 0;
							barRed.filling.addValue(-28);
						}
						else {
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI / 2));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 0.42));
							game.rootScene.addChild(new PlayerBullet(ship.x + ship.width/2, ship.y, -Math.PI * 0.58));
							ship.bulletTimer = 0;
							barRed.filling.addValue(-17);
						}
					}
				}
				barRed.filling.addValue(.5);
				if (controller.buttons[CONT_INPUT.a] === 1) {
					if (ship.shield === null) {
						if (ship.checkComponent(ShieldImage)) {
							ship.shield = new Shield();
							game.rootScene.addChild(ship.shield);
						}
					}
					else {
						barGreen.filling.addValue(-3);
					}
				}
				else if (controller.buttons[CONT_INPUT.a] === 0) {
					if (ship.shield !== null) {
						game.rootScene.removeChild(ship.shield);
						ship.shield = null;
					}
					barGreen.filling.addValue(0.5);
				}
				if (controller.buttons[CONT_INPUT.rstick] === 1) {
					if (ship.checkComponent(MissileImage)) {
						if (ship.missile === null && ship.missilePrimed) {
							var y = controller.axes[CONT_INPUT.rstick_y] < -0.5 ? 5 : -5;
							ship.missile = new PlayerMissile(0, y);
							game.rootScene.addChild(ship.missile);
							barGray.filling.addValue(-35);

						}
						else if (ship.explosionPrimed) {
							ship.explodeMissile();
						}
					}
				}
				else if (controller.buttons[CONT_INPUT.rstick] === 0) {
					if (ship.missile !== null) {
						ship.explosionPrimed = true;
					}
					ship.missilePrimed = true;
				}
				if (ship.missile === null) {
					barGray.filling.addValue(40/90);
				}
				if (controller.buttons[CONT_INPUT.y] === 1) {
					if (ship.checkComponent(GeneratorImage)) {
						barYellow.filling.checkticker();
					}
				}
				else if (controller.buttons[CONT_INPUT.y] === 0 && barYellow.filling.released === false){
					if (ship.checkComponent(GeneratorImage)) {
						barYellow.filling.releaseticker();
					}
				}
				else if (controller.buttons[CONT_INPUT.lt] === 1 && game.currentScene == game.rootScene) {
					game.assets['sounds/Inception.mp3'].play();
					bgm.pause();
					game.pushScene(new PulseScene());
				}
			}
		});
	};
    game.start();
};
