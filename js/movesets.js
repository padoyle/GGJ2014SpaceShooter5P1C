/*
 * Movesets.js - Define movement patterns for enemies
 */

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

// set consists of moveset of array of moves
// Move(direction (rad), speed, duration, bullets, angle (deg))
// For a burst fire, use: Move(0, 0, 0, <bullet_count>, <spread_angle>)
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
				new Move(0, 0, 60, 0, 0))),
	set4: new MoveSet(new Array(
				new Move(0.25 * Math.PI, 10, 30, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 5, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(Math.PI, 10, 30, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 5, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(1.75 * Math.PI, 10, 20, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 5, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0, 0, 0, 7, 126),
				new Move(0, 0, 20, 0, 0),
				new Move(0.5 * Math.PI, 10, 120, 0, 0))),
    set5: new MoveSet(new Array(
                new Move(0.25 * Math.PI, 10, 20, 0, 0),
                new Move(0, 2, 120, 6, 90),
                new Move(Math.PI, 2, 120, 6, 90),
                new Move(0, 2, 120, 7, 90),
                new Move(Math.PI, 2, 120, 6, 90),
                new Move(0.5 * Math.PI, 10, 120, 0, 0))),
    set6: new MoveSet(new Array(
                new Move(0.5 * Math.PI, 1.5, 20, 0, 0),
                new Move(0, 0, 0, 3, 60))),
    set7: new MoveSet(new Array(
                new Move(0.5 * Math.PI, 3, 60, 3, 90),
                new Move(0.25 * Math.PI, 3, 60, 2, 90),
                new Move(Math.PI, 3, 90, 5, 90))),
    set8: new MoveSet(new Array(
                new Move(0.5 * Math.PI, 2.5, 60, 0, 0),
                new Move(0, 0, 0, 12, 360),
                new Move(0, 0, 60, 0, 0),
                new Move(0.75 * Math.PI, 2.5, 75, 0, 0),
                new Move(0, 0, 0, 12, 360),
                new Move(0, 0, 60, 0, 0),
                new Move(0.25 * Math.PI, 2.5, 75, 0, 0),
                new Move(0, 0, 0, 12, 360),
                new Move(0, 0, 60, 0, 0),
                new Move(1.75 * Math.PI, 2.5, 75, 0, 0),
                new Move(0, 0, 0, 12, 360),
                new Move(0, 0, 60, 0, 0),
                new Move(1.25 * Math.PI, 2.5, 75, 0, 0),
                new Move(0, 0, 0, 12, 360),
                new Move(0, 0, 60, 0, 0))),
    set9: new MoveSet(new Array(
                new Move(0, 0, 0, 10, 30),
                new Move(0, 2.5, 100, 0, 0),
                new Move(0, 0, 0, 10, 30),
                new Move(0.75 * Math.PI, 2.5, 50, 0, 0),
                new Move(0, 0, 0, 10, 30),
                new Move(0.75 * Math.PI, 2.5, 50, 0, 0))),
    set10: new MoveSet(new Array(
                new Move(0.5 * Math.PI, 1.5, 200, 4, 90))),
    set11: new MoveSet(new Array(
                new Move(0.3 * Math.PI, 1.5, 90, 2, 90),
                new Move(0, 0, 0, 2, 90),
                new Move(0.6 * Math.PI, 2.4, 36, 1, 90),
                new Move(0, 0, 0, 2, 90),
                new Move(0.6 * Math.PI, 2.4, 10, 0, 0),
                new Move(1.5 * Math.PI, 1.5, 40, 3, 90),
                new Move(0, 0, 0, 2, 90)))
};