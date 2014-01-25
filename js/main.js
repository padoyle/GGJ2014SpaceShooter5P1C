// Start enchant
enchant();

// When document loads, set up basic game
window.onload = function() {
	var game = new Game(600, 720);
	game.preload('images/bg1.png');

	game.fps = 30;
	game.scale = 1;
	game.onload = function() {
		console.log("sup guys, I'm your game");

		var scene, label, bg;
		scene = new Scene();
		label = new Label("FIVE Players.  ONE Controller.");
		label.color = 'white';
		bg = new Sprite(600, 720);
		bg.image = game.assets['images/bg1.png'];

		scene.addChild(bg);
		scene.addChild(label);

		game.pushScene(scene);
	}

	game.start();
}