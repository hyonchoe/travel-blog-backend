const dbService = require('./dbServices')
const S3Service = require('./S3Service')
const moment = require('moment')

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
        console.log(error)
        res.send(error)
    }
}

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
        console.log(error)
        res.send(error)
    }
}

const getMyTrips = async (req, res) => {
    const userId = req.user.sub
    try {
        // Find all existing trips
        const result = await dbService.getUserTrips(userId)
        processDatesImages(result)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.send(error)
    }
}

const getPublicTrips = async (req, res) => {
    const initialLoad = (req.query.tripId) ? false : true
    const lastLoadedTripInfo = (initialLoad) ? null : {
        tripId: req.query.tripId,
        endDate: req.query.endDate,
        startDate: req.query.startDate,
    }

    try {
        // Find all existing trips
        const result = await dbService.getPublicTrips(initialLoad, lastLoadedTripInfo)
        processDatesImages(result)
        res.send(result)
    } catch (error) {
        console.log(error)
        res.send(error)
    }
}

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
        console.log(error)
        res.send(error)
    }
}

const getS3SignedUrl = async (req, res) => {
    //TODO: Can add some validation for allowed file type check here
    const fileType = req.query.type
    const urlFileName = await dbService.genUrlFileName()

    try {
        const urlInfo = await S3Service.genSignedUrlPut(urlFileName, fileType)
        res.send(urlInfo)
    } catch (error) {
        console.log(err)
        res.send(err)        
    }
}

const getImagesToRemove = (existingImages, updatedImages) => {
    let remove = []
    let updatedImagesUrlNames = updatedImages.map((img) => {
        return img.fileUrlName
    })
    existingImages.forEach((img) => {
        if (!updatedImagesUrlNames.includes(img.fileUrlName)){
            remove.push({ Key: img.fileUrlName })
        }
    })

    return remove
}
const getImagesToAdd = (existingImages, updatedImages) => {
    let add = []
    let existingImagesUrlNames = existingImages.map((img) => {
        return img.fileUrlName
    })
    updatedImages.forEach((img) => {
        if (!existingImagesUrlNames.includes(img.fileUrlName)){
            add.push(img.fileUrlName)
        }
    })

    return add
}

const processTripLocData = (tripLocations) => {
    tripLocations.forEach((loc) => {
        loc.latLng[0] = parseFloat(loc.latLng[0])
        loc.latLng[1] = parseFloat(loc.latLng[1])
    })
}

const processDatesImages = (data) => {
    data.forEach((trip) => {
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

module.exports = { createTrip, deleteTrip, getMyTrips, getPublicTrips, updateTrip, getS3SignedUrl }