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
	game.preload('images/bg1.png');
	
	game.fps = 30;
	game.scale = 1;
	var lab1 = new Label("Hello there!");
	lab1.y = 50;
	lab1.color = 'white';
	game.onload = function() {
		console.log("sup guys, I'm your game");

		var label, bg;
		label = new Label("FIVE Players.  ONE Controller.");
		label.color = 'white';
		bg = new Sprite(600, 720);
		bg.image = game.assets['images/bg1.png'];

		game.rootScene.addChild(bg);
		game.rootScene.addChild(label);
		game.rootScene.addChild(lab1);

		var move = new Move(1, 2, 3, 4, 5);
		console.log(move.direction, move.speed);
	}

	game.rootScene.addEventListener('enterframe', function(e) {
		updateController();
		if (controller && controller.buttons[0] == 1) {
			lab1.text = "Button pushed!";
		}
	});

	game.start();
}

var Move = Class.create({
	initialize: function(_direction, _speed, _duration, _bullets, _rotation) {
		this.direction = _direction;
		this.speed = _speed;
		this.duration = _duration;
		this.bullets = _bullets;
		this.rotation = _rotation;
	}
});

var MoveSet = Class.create({
	initialize: function(_moves, _repeat) {
		this.moves = _moves;
		this.repeat = _repeat;
		this.current = 0;
		this.total = _moves.length;
	}

	nextMove: function() {
		current++;
		if (current >= total)
			current = 0;
		return moves[current];
	}
});
