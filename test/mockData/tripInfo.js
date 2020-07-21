/**
 * Mock data to use for testing
 */

const moment = require('moment')

const today = moment().startOf('day')
const todayDate = today.toDate()
const yesterday = moment().subtract(1, 'days').startOf('day')
const yesterdayDate = yesterday.toDate()
const twoDaysFromToday = moment().subtract(2, 'days').startOf('day')
const twoDaysFromTodayDate = twoDaysFromToday.toDate()
const userId = 'userid'

const unchangingFields = {
    userId: userId,
    userName: 'username',
    userEmail: 'useremail@useremail',
    title: 'title',
    details: 'details',
}
const locInfo1 = {
    fmtAddr: 'Seattle, WA, USA',
    latLng: [47.6062095, -122.3320708],
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
}
const locInfo2 = {
    fmtAddr: 'Dallas, TX, USA',
    latLng: [32.7766642, -96.79698789999999],
    city: 'Dallas',
    state: 'TX',
    country: 'United States',
}
const newLocInfo = {
    fmtAddr: 'Barcelona, Spain',
    latLng: [41.38506389999999, 2.1734035],
    city: 'Barcelona',
    state: 'CT',
    country: 'Spain',
}
const imgInfo1 = {
    name: 'testimage1',
    fileUrlName: 'testimage1fileurlname',
}
const imgInfo2 = {
    name: 'testimage2',
    fileUrlName: 'testimage2fileurlname',
}
const newImgInfo = {
    name: 'testimage3',
    fileUrlName: 'testimage3fileurlname',
    S3Url: 'pendingfileurl'
}

const getUserId = () => (userId)

const getTripForCreation = (useLocations, useImages, public) => {
    const tripInfo = {
        ...unchangingFields,
        startDate: yesterdayDate,
        endDate: todayDate,
        locations: (useLocations) ? [locInfo1, locInfo2] : [],
        images: (useImages) ? [imgInfo1, imgInfo2] : [],
        public: public,
    }
    return tripInfo
}

const getTripForCreationOlderDate = (useLocations, useImages, public) => {
    const tripInfo = {
        ...unchangingFields,
        startDate: twoDaysFromTodayDate,
        endDate: yesterdayDate,
        locations: (useLocations) ? [locInfo1, locInfo2] : [],
        images: (useImages) ? [imgInfo1, imgInfo2] : [],
        public: public,
    }
    return tripInfo
}

const memMongoDbMockData = () => {
    const publicCounts = 4
    const privateCounts = 4
    const publicsWithImgsLocs = 2
    const privateWithImgsLocs = 2
    const lastLoadedPublicTripIndex = 2
    const publicCountsSubs = 1
    const tripsWithImgsLocs = publicsWithImgsLocs + privateWithImgsLocs
    const testSetSize = publicCounts + privateCounts
    
    const getPublicCounts = () => (publicCounts)
    const getSubsPublicCounts = () => (publicCountsSubs)
    const getPrivateCounts = () => (privateCounts)
    const getPublicWithImgsLocs = () => (publicsWithImgsLocs)
    const getPrivateWithImgsLocs = () => (privateWithImgsLocs)
    const getLocInfos = () => ([locInfo1, locInfo2])
    const imgInfos = () => ([imgInfo1, imgInfo2])
    const getNewLocInfo = () => (newLocInfo)
    const getNewImgInfo = () => (newImgInfo)
    const getLastLoadedPublicTripIndex = () => (lastLoadedPublicTripIndex)
    const getTripsWithImgsLocs = () => (tripsWithImgsLocs)
    const getTestSetSize = () => (testSetSize)

    return { 
        getPublicCounts, getPrivateCounts, getPublicWithImgsLocs, getPrivateWithImgsLocs,
        getLocInfos, imgInfos, getLastLoadedPublicTripIndex, getSubsPublicCounts,
        getNewLocInfo, getNewImgInfo, getTripsWithImgsLocs, getTestSetSize
     }
}

module.exports = {
    getTripForCreation, getTripForCreationOlderDate, getUserId,
    memMongoDbMockData
 }