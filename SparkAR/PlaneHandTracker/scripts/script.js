const Scene = require('Scene');
const Diagnostics = require('Diagnostics');
const Networking = require('Networking')
const HandTracking = require('HandTracking');
const Time = require('Time');

// The depth the hand should be from the camera to detect a hit.
const HIT_MARGIN = 0.2
// The size of the enemy object pool.
const OBJ_COUNT = 10
const UNIT_SPEED = 0.4

var groundTracker = Scene.root.find('planeTracker');
var camera = Scene.root.find('Camera');
var handSimulator = Scene.root.find('handSimulator');  // Used to simulate the hand in worldCoordinates.
var hitIndicator = Scene.root.find('hitIndicator'); // The on-screen indicator as to whether the current state is a hit.
var hitState = false
const mainPlane = Scene.root.find('Town')
const deathSound = Scene.root.find('DeathSound');
const textNode = Scene.root.find('text0');
const objs = []
let fetchedObjs = []
// {"id":"157","x":-2.421,"y":-2.179,"z":0,"speed":0.6}

const MINION_RADIUS = 0.3;
const HAND_RADIUS = 100;

function onStart() {
	// Populate array with the pool of objects
	for (let i = 0; i < OBJ_COUNT; i++) {
	    objs.push(
	        mainPlane.find(`enemy${i}`)
	    )
	}
	fetchObjects()
}

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
	checkMinionCollisions(fetchedObjs, handSimulator.transform, HAND_RADIUS);
	// TODO: Implement actual hit logic.
}

// Set the handSimulator to follow the position of the hand but translated to
// world position.
handSimulator.transform.position = camera.worldTransform.applyTo(HandTracking.hand(0).cameraTransform.position)

// The condition for when a hit will trigger
var hitCondition = handSimulator.transform.position.z.lt(groundTracker.transform.position.z.add(HIT_MARGIN) /* should always be 0 */)
hitCondition.monitor().subscribe(function (e) {
	setHitState(e.newValue);
})


/**
 * Get the distance between two transforms.
 */
function transformDistance(transformA, transformB) {
	return Math.sqrt(
		Math.pow(transformA.x - transformB.x, 2) +
		Math.pow(transformA.y - transformB.y, 2) +
		Math.pow(transformA.z - transformB.z, 2)
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
		if (doTransformsCollide(minion, MINION_RADIUS, {x: hitTransform.x.lastValue, y: hitTransform.y.lastValue, z: 0}, hitRadius)) {
			killObject(minion.id)
		}
	}
}

const updateText = () => {
    textNode.text = 'Unit killed! 😈'
    Time.setTimeout(() => {
        textNode.text = 'Splat em!'
    }, 1500)
}


const getTimeDifference = (ts, lastTs) =>
    lastTs
        ? ts - lastTs
        : null

// Make visible those objects which have been fetched,
// update their positions
// and hide those that do not correspond to a fetched obj
const updateObjects = fetchedObjects => {
    if (fetchedObjects.length)
        for (let i = 0; i < OBJ_COUNT; i++) {
            if (i < fetchedObjects.length) {
                objs[i].hidden = false
                objs[i].x = fetchedObjects[i].x * UNIT_SPEED
                objs[i].y = fetchedObjects[i].y * UNIT_SPEED
            }
            else
                objs[i].hidden = true
        }
}

const fetchObjects = (fetchCount, lastTs) => {
    fetchCount = fetchCount || 0
    lastTs = lastTs || null

    return Networking.fetch('https://kg-backend2.appspot.com/objects')
        .then(result => {
            if ((result.status >= 200) && (result.status < 300))
                return result.json()
            else
                throw new Error(`HTTP status code ${result.status}`)
        })
        .then(json => {
            ++fetchCount
            // Diagnostics.log({
            //     dTime: getTimeDifference(json.ts, lastTs),
            //     fetchCount,
            //     json
            // })
            fetchedObjs = json.objects
            updateObjects(fetchedObjs)
            lastTs = json.ts
            fetchObjects(fetchCount, lastTs)
        })
        .catch(error => {
            Diagnostics.log(error)
        })
}

const killObject = objectId => {
	Diagnostics.log('Unit killed');
	deathSound.play()
	updateText()
    Networking.fetch(`https://kg-backend2.appspot.com/objects/kill/${objectId}`)
        .then(result => {
            if ((result.status >= 200) && (result.status < 300))
                return result.json()
            else
                throw new Error(`HTTP status code ${result.status}`)
        })
        .then(json => {
            // Diagnostics.log({ json })
            fetchedObjs = json.objects
            updateObjects(fetchedObjs)
        })
        .catch(error => {
            Diagnostics.log(error)
        })
}


onStart()


