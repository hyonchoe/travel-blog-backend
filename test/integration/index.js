const request = require('supertest')
const expect = require('chai').expect
const sinon = require('sinon')
const tripMockData = require('../mockData/tripInfo')
const dbHandler = require('../dbHandler')
const security = require('../../security')
const dbService = require('../../dbServices')
const S3Service = require('../../S3Service')

// Stub these methods before requiring app
const userId = tripMockData.getUserId()
sinon.stub(security, 'checkJwt').callsFake((req, res, next) => {
    req.user = {sub: userId}
    next()
})
sinon.stub(dbService, 'connect').callsFake(async () => {
    return await dbHandler.connect()
})
const app = require('../../app')

setTimeout(() => {
    describe('Server APIs', () => {
        let dbTripsInfo
        beforeEach( async () => {
            dbTripsInfo = await dbHandler.setupWithTestingRecords()
        })
        after( async () => {
            await dbHandler.closeDatabase()
        })

        describe('GET /publicTrips', () => {
            it('Getting public trips - Initial load', (done) => {
                request(app)
                    .get('/publicTrips')
                    .expect(200, (err, res) => {
                        const trips = res.body
                        let imgsContainS3Url = allImgsHaveS3Url(trips)

                        expect(trips.length).to.equal(dbHandler.getPublicCounts())
                        expect(imgsContainS3Url).to.equal(true)
                        done()
                    })            
            })

            it('Getting public trips - Subsequent load', (done) => {                
                const trips = dbTripsInfo[0]
                const ids = dbTripsInfo[1]
                const tripIndex = dbHandler.getLastLoadedPublicTripIndex()

                request(app)
                    .get('/publicTrips')
                    .query({ 
                        tripId: ids[tripIndex].toString(),
                        endDate: trips[tripIndex].endDate.toISOString(),
                        startDate: trips[tripIndex].startDate.toISOString(),
                    })
                    .expect(200, (err, res) => {
                        const trips = res.body
                        let imgsContainS3Url = allImgsHaveS3Url(trips)

                        expect(trips.length).to.equal(dbHandler.getSubsPublicCounts())
                        expect(imgsContainS3Url).to.equal(true)
                        done()
                    })
            })
        })

        describe('GET /trips passing authentication', () => {
            it('Getting user trips', (done) => {
                request(app)
                    .get('/trips')
                    .expect(200, (err, res) => {
                        const trips = res.body
                        let imgsContainS3Url = allImgsHaveS3Url(trips)

                        expect(trips.length).to.equal(dbHandler.getPrivateCounts()+dbHandler.getPublicCounts())
                        expect(imgsContainS3Url).to.equal(true)
                        done()
                    })
            })
        })

        describe('POST /trips', () => {
            before(() => {
                sinon.stub(S3Service, 'copyToPermanentBucket')
            })
            after(() => {
                S3Service.copyToPermanentBucket.restore()
            })

            it('Creating user trip', (done) => {
                const reqBody = tripMockData.
                    getTripForCreation([dbHandler.getNewLocInfo()], [dbHandler.getNewImgInfo()], true)
                
                request(app)
                    .post('/trips')
                    .send(reqBody)
                    .expect(200, (err, res) => {
                        expect(res.body.insertedId.length).to.be.gt(0)
                        done()
                    })
            })
        })

        describe('DELETE /trips/:tripId', () => {
            before(() => {
                sinon.stub(S3Service, 'deleteS3Images')
            })
            after(() => {
                S3Service.deleteS3Images.restore()
            })

            it('Delete a trip', (done) => {
                const ids = dbTripsInfo[1]
                const tripId = ids[0].toString()

                request(app)
                    .delete(`/trips/${tripId}`)
                    .expect(200, (err, res) => {
                        const deletedTrip = res.body.value
                        expect(deletedTrip).to.exist
                        done()
                    })
            })

            it('Delete a trip with invalid trip id', (done) => {
                const randomObjectId = dbHandler.getNewObjectIdStr()
                request(app)
                    .delete(`/trips/${randomObjectId}`)
                    .expect(200, (err, res) => {
                        const deletedTrip = res.body.value
                        expect(deletedTrip).to.be.null
                        done()
                    })
            })
        })

        describe('PUT /trips/:tripId', () => {
            before(() => {
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(S3Service, 'deleteS3Images')
            })
            after(() => {
                S3Service.copyToPermanentBucket.restore()
                S3Service.deleteS3Images.restore()
            })

            it('Update a trip', (done) => {
                const ids = dbTripsInfo[1]
                const tripId = ids[0].toString()
                const reqBody = tripMockData.
                    getTripForCreation([dbHandler.getNewLocInfo()], [dbHandler.getNewImgInfo()], true)
                
                request(app)
                    .put(`/trips/${tripId}`)
                    .send(reqBody)
                    .expect(200, (err, res) => {
                        expect(res.body.modifiedCount).to.equal(1)
                        done()
                    })
            })

            it('Update a trip with invlaid trip id', (done) => {
                const randomObjectId = dbHandler.getNewObjectIdStr()
                const reqBody = tripMockData.
                    getTripForCreation([dbHandler.getNewLocInfo()], [dbHandler.getNewImgInfo()], true)

                request(app)
                    .put(`/trips/${randomObjectId}`)
                    .send(reqBody)
                    .expect(200, (err, res) => {
                        expect(res.body.modifiedCount).to.equal(0)
                        done()
                    })
            })
        })

        describe('GET /get-signed-url', () => {
            afterEach(() => {
                S3Service.genSignedUrlPut.restore()
            })

            it('Get s3 signed url', (done) => {
                const fileType = 'image/jpeg'
                const apiOutputMock = 'urlfilename_'+fileType
                sinon.stub(S3Service, 'genSignedUrlPut').returns(apiOutputMock)

                request(app)
                    .get('/get-signed-url')
                    .query({ type: fileType })
                    .expect(200, (err, res) => {
                        expect(res.text).to.equal(apiOutputMock)
                        done()
                    })
            })
        })
    })

run()
}, 5000)

const allImgsHaveS3Url = (trips) => {
    for(let i=0; i<trips.length; i++){
        const tripImages = trips[i].images
        if(tripImages && tripImages.length > 0){
            for(let j=0; j<tripImages.length; j++){
                if (!tripImages[j].S3Url){
                    imgsContainS3Url = false
                    return false
                }
            }
        }
    }

    return true
}