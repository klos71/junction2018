const Scene = require('Scene');
const Diagnostics = require('Diagnostics');
const HandTracking = require('HandTracking');

// The depth the hand should be from the camera to detect a hit.
const hitMargin = 0.2

var groundTracker = Scene.root.find('planeTracker');
var camera = Scene.root.find('Camera');
var handSimulator = Scene.root.find('handSimulator');  // Used to simulate the hand in worldCoordinates.
var hitIndicator = Scene.root.find('hitIndicator'); // The on-screen indicator as to whether the current state is a hit.
var hitState = false

/**
 * Update the hit state by providing a new value.
 * The method will proceed to call `hit` if the hit state changes from false to 
 * true.
 *
 * Function should only be called by the hitCondition monitor.
 */
function setHitState(newHitValue) {
	hitIndicator.hidden = !newHitValue
	if (hitState !== newHitValue) {
		hitState = newHitValue;
		if (hitState === true) {
			onHit();
		}
	}
}

/**
 * Method called when a hit is detected.
 * 
 * This function should only be called by the `setHitState` function.
 */
function onHit() {
	Diagnostics.log('HIT');
	// TODO: Implement actual hit logic.
}

// Set the handSimulator to follow the position of the hand but translated to
// world position.
handSimulator.transform.position = camera.worldTransform.applyTo(HandTracking.hand(0).cameraTransform.position)

// The condition for when a hit will trigger
var hitCondition = handSimulator.transform.position.z.lt(groundTracker.transform.position.z.add(hitMargin) /* should always be 0 */)
hitCondition.monitor().subscribe(function (e) {
	setHitState(e.newValue);
})


/**
 * Get the distance between two transforms.
 */
function transformDistance(transformA, transformB) {
	return Math.sqrt(
		Math.pow(transformA.x - transformB.x) +
		Math.pow(transformA.y - transformB.y) +
		Math.pow(transformA.z - transformB.z)
	);
}

/**
 * Check if two transforms are colliding.
 *
 * @param transformA the first transform.
 * @param tARange the radius of the collision sphere around transform A.
 * @param transformB the second transform.
 * @param tBRange the radius of the collision sphere around transform B.
 */
function doTransformsCollide(transformA, tARadius, transformB, tBRadius) {
	return (transformDistance(transformA, transformB) - tARadius - tBRadius) < 0;
}

/**
 * Check the collisions with a list of minions.
 *
 * @param minionList The list of minions to check. Each object should at least 
 * 					 contain a transform and hitRadius.
 * @param hitTransform The transform to check the collisions with.
 * @param hitRadius The radius of the object to check the collision with.
 */
function checkMinionCollisions(minionList, hitTransform, hitRadius) {
	for (var minion of minionList) {
		if (doTransformsCollide(minion.transform, minion.hitRadius, hitTransform, hitRadius)) {
			// TODO: Kill this minion
		}
	}
}

