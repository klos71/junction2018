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
hitCondition.monitor().subscribeWithSnapshot({handZ: handSimulator.transform.position.z}, function (e, snapshot) {
	setHitState(e.newValue);
})
