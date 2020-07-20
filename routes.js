/**
 * Router handling for APIs
 */

const express = require('express')
const router = express.Router()
const { checkJwt } = require('./security.js') // Middleware to check authentication
const tripController = require('./controllers')

/** 
 * Creates new trip with given information
 * (POST)
 */
router.post('/trips', checkJwt, tripController.createTrip)

/** 
 * Deletes existing trip
 * (DEL)
 */
router.delete('/trips/:tripId', checkJwt, tripController.deleteTrip)

/** 
 * Retrieves existing trips for logged in user
 * (GET)
 */
router.get('/trips', checkJwt, tripController.getMyTrips)

/** 
 * Retrieves existing public trips
 * (GET)
 */
router.get('/publicTrips', tripController.getPublicTrips)

/** 
 * Updates an existing trip with given information
 * (PUT)
 */
router.put('/trips/:tripId', checkJwt, tripController.updateTrip)

/** 
 * Generate S3 signed URL for uploading photo
 * (GET)
 */
router.get('/get-signed-url', checkJwt, tripController.getS3SignedUrl)

module.exports = router