const express = require('express')
const router = express.Router()
const { checkJwt } = require('./security.js')
const tripController = require('./controllers')

// Create a trip (POST)
router.post('/trips', checkJwt, tripController.createTrip)
// Delete existing trip (DEL)
router.delete('/trips/:tripId', checkJwt, tripController.deleteTrip)
// Get existing trips for logged in user (GET)
router.get('/trips', checkJwt, tripController.getMyTrips)
// Get existing  public trips (GET)
router.get('/publicTrips', tripController.getPublicTrips)
// Update existing trip (PUT)
router.put('/trips/:tripId', checkJwt, tripController.updateTrip)
// Generate S3 signed URL for photo upload
router.get('/get-signed-url', checkJwt, tripController.getS3SignedUrl)

module.exports = router