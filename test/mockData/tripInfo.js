const moment = require('moment')

const today = moment().startOf('day')
const todayDate = today.toDate()
const todayISOStr = today.toISOString()
const yesterday = moment().subtract(1, 'days').startOf('day')
const yesterdayDate = yesterday.toDate()
const yesterdayISOStr = yesterday.toISOString()
const twoDaysFromToday = moment().subtract(2, 'days').startOf('day')
const twoDaysFromTodayDate = twoDaysFromToday.toDate()

const unchangingFields = {
    userId: 'userid',
    userName: 'username',
    userEmail: 'useremail@useremail',
    title: 'title',
    details: 'details',
}

const getTripWithDummyId = (useDateObject, locations, images) => {
    const tripInfo = {
        ...unchangingFields,
        _id: 'dummytripid',
        startDate: (useDateObject) ? yesterdayDate : yesterdayISOStr,
        endDate: (useDateObject) ? todayDate : todayISOStr,
        locations: locations,
        images: images,
        public: true,
    }
    return tripInfo
}

const getTripForCreation = (locations, images, public) => {
    const tripInfo = {
        ...unchangingFields,
        startDate: yesterdayDate,
        endDate: todayDate,
        locations: locations,
        images: images,
        public: public,
    }
    return tripInfo
}

const getTripForCreationOlderDate = (locations, images, public) => {
    const tripInfo = {
        ...unchangingFields,
        startDate: twoDaysFromTodayDate,
        endDate: yesterdayDate,
        locations: locations,
        images: images,
        public: public,
    }
    return tripInfo
}

module.exports = { getTripWithDummyId, getTripForCreation, getTripForCreationOlderDate }