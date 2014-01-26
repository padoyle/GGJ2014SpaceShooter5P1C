function FunctionSetup() {
functions.push(LoadFormation0);
functions.push(LoadFormation1);
};
function LoadFormation0() {
addEnemy(new Enemy1(90, -300));
};
function LoadFormation1() {
addEnemy(new Enemy3(300, -400));
};
