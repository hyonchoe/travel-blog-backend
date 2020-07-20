/**
 * Controller that processes corresponding action for routes recevied
 */

const dbService = require('./dbServices')
const S3Service = require('./S3Service')
const moment = require('moment')

/**
 * Creates new trip with given information in DB and sends back result to client.
 * Uploaded images are moved from temporary S3 bucket to permanet S3 bucket.
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {Object} req.user Authenticated user info
 * @param {Object} req.body Data for trip to be created
 */
const createTrip = async (req, res) => {
    const tripLocations = req.body.locations
    const tripImages = req.body.images
    // No need to save S3Url to database
    tripImages.forEach((img) => {
        delete img.S3Url
    })
    processTripLocData(tripLocations)

    const newTrip = {
        userId: req.user.sub,
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        title: req.body.title,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        public: req.body.public,
        details: req.body.details,
        locations: tripLocations,
        images: tripImages,
    }

    try {
        // Copy over user submitted images from temp bucket to permanent bucket
        for(let i=0; i <tripImages.length; i++){
            await S3Service.copyToPermanentBucket(tripImages[i].fileUrlName)
        }
        // Insert new trip information to the DB
        const result = await dbService.createTrip(newTrip)
        res.send(result)
    } catch (error){
        console.error(error)
        res.send(error)
    }
}

/**
 * Deletes given trip from DB and stored images in S3 and sends back result to client
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} req.user.sub Authenticated user ID
 * @param {String} req.params.tripId Trip ID to be deleted
 */
const deleteTrip = async (req, res) => {
    const tripId = req.params.tripId
    const userId = req.user.sub

    try {
        // Delete trip from DB
        const result = await dbService.deleteTrip(tripId, userId)
        // If there are images to remove from S3, remove them
        if (result.value && result.value.images && result.value.images.length > 0){
            const imagesToRemove = result.value.images.map((img) => {
                return { Key: img.fileUrlName }
            })
            S3Service.deleteS3Images(imagesToRemove)
        }
        res.send(result)
    } catch (error){
        console.error(error)
        res.send(error)
    }
}

/**
 * Retrieves user's trips from DB and sends back result to client
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} req.user.sub Authenticated user ID
 */
const getMyTrips = async (req, res) => {
    const userId = req.user.sub
    try {
        // Find all existing trips
        const result = await dbService.getUserTrips(userId)
        processDatesImages(result)
        res.send(result)
    } catch (error) {
        console.error(error)
        res.send(error)
    }
}

/**
 * Retrieves public trips from DB and sends back result to client.
 * There are two modes for this API:
 * - Initial load: loads top x most recent trips
 * - Subsequent load: loads next x most recent trips from the last loaded trip
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} req.query.tripId Trip ID of last loaded trip, null if initial load
 * @param {String} req.query.endDate ISO string of end date of the last loaded trip
 * @param {String} req.query.startDate ISO string of start date of the last loaded trip
 */
const getPublicTrips = async (req, res) => {
    const initialLoad = (req.query.tripId) ? false : true
    const lastLoadedTripInfo = (initialLoad) ? null : {
        tripId: req.query.tripId,
        endDate: new Date(req.query.endDate),
        startDate: new Date(req.query.startDate),
    }

    try {
        // Find all existing trips
        const result = await dbService.getPublicTrips(initialLoad, lastLoadedTripInfo)
        processDatesImages(result)
        res.send(result)
    } catch (error) {
        console.error(error)
        res.send(error)
    }
}

/**
 * Updates given trip with new given information and send back result to client.
 * If existing image had been removed, then we delete from S3 as well.
 * Newly uploaded images are moved from temporary S3 bucket to permanet S3 bucket.
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} req.user.sub Authenticated user ID
 * @param {String} req.params.tripId Trip ID of the trip to update
 * @param {Object} req.body Data for trip to be updated
 */
const updateTrip = async (req, res) => {
    const tripId = req.params.tripId
    const tripLocations = req.body.locations
    const tripImages = req.body.images
    const userId = req.user.sub
    
    // No need to save S3Url to database
    tripImages.forEach((img) => {
        delete img.S3Url
    })    
    processTripLocData(tripLocations)
    
    const updatedTrip = {
        title: req.body.title,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        public: req.body.public,
        details: req.body.details,
        locations: tripLocations,
        images: tripImages,
    }

    try{
        // Find existing image information for the trip first to calculate
        // what is new and what is removed
        let result = await dbService.getImagesForTrip(tripId, userId)
        let imagesToRemove = []
        let imagesToAdd = []
        if (result) {
            const existingImages = result.images
            imagesToRemove = getImagesToRemove(existingImages, tripImages)
            imagesToAdd = getImagesToAdd(existingImages, tripImages)
        }
        
        // Copy over newly added images from temp bucket to permanent bucket
        for(let i=0; i<imagesToAdd.length; i++){
            await S3Service.copyToPermanentBucket(imagesToAdd[i])
        }
        // Delete existing images that are removed by the user
        if (imagesToRemove.length > 0){
            S3Service.deleteS3Images(imagesToRemove)
        }
        // Update trip information in the DB
        result = await dbService.updateTrip(tripId, userId, updatedTrip)
        res.send(result)
    } catch (error){
        console.error(error)
        res.send(error)
    }
}

/**
 * Gets S3 signed url for uploading files to AWS S3 and sends back result to client
 * @param {Object} req Request
 * @param {Object} res Response
 * @param {String} req.query.type File type for upload
 */
const getS3SignedUrl = async (req, res) => {
    const fileType = req.query.type
    const urlFileName = dbService.genUrlFileName()

    try {
        const urlInfo = await S3Service.genSignedUrlPut(urlFileName, fileType)
        res.send(urlInfo)
    } catch (error) {
        console.error(err)
        res.send(err)        
    }
}

//#region Helper methods
/**
 * Finds which existing images have beeen removed by the update to the trip
 * @param {Array} existingImages Images already in the DB (and S3) for the trip
 * @param {Array} updatedImages Images provided for the trip as an update
 * @returns {Array} Removed images by the update
 */
const getImagesToRemove = (existingImages, updatedImages) => {
    const remove = []
    const updatedImagesUrlNames = updatedImages.map((img) => {
        return img.fileUrlName
    })
    existingImages.forEach((img) => {
        if (!updatedImagesUrlNames.includes(img.fileUrlName)){
            remove.push({ Key: img.fileUrlName })
        }
    })

    return remove
}

/**
 * Finds which images in updated images are new images to add
 * @param {Array} existingImages Images already in the DB (and S3) for the trip
 * @param {Array} updatedImages Images provided for the trip as an update
 * @returns {Array} New images to add
 */
const getImagesToAdd = (existingImages, updatedImages) => {
    const add = []
    const existingImagesUrlNames = existingImages.map((img) => {
        return img.fileUrlName
    })
    updatedImages.forEach((img) => {
        if (!existingImagesUrlNames.includes(img.fileUrlName)){
            add.push(img.fileUrlName)
        }
    })

    return add
}

/**
 * Parses location latitude and longitutde data from string to number 
 * @param {Array} tripLocations
 */
const processTripLocData = (tripLocations) => {
    tripLocations.forEach((loc) => {
        loc.latLng[0] = parseFloat(loc.latLng[0])
        loc.latLng[1] = parseFloat(loc.latLng[1])
    })
}

/**
 * Parses date information to moment object
 * and populates S3Url for images based on the file url name
 * @param {Array} data Trips data
 */
const processDatesImages = (data) => {
    data.forEach((trip) => {
        //TODO: do i need to convert dates to moment() here?...
        trip.startDate = moment(trip.startDate)
        trip.endDate = moment(trip.endDate)            
        const tripImages = trip.images
        if (tripImages && tripImages.length > 0) {
            tripImages.forEach((imgInfo) => {
                imgInfo.S3Url = S3Service.getImageS3URL(imgInfo.fileUrlName)
            })
        }
    })
}
//#endregion

module.exports = { createTrip, deleteTrip, getMyTrips, getPublicTrips, updateTrip, getS3SignedUrl }