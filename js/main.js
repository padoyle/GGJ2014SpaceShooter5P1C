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
	}

	game.rootScene.addEventListener('enterframe', function(e) {
		updateController();
		if (controller && controller.buttons[0] == 1) {
			lab1.text = "Button pushed!";
		}
	});
	game.start();
}