require('dotenv').config()
const request = require('supertest')
const expect = require('chai').expect
const sinon = require('sinon')
const tripMockData = require('./mockData/tripInfo')
const security = require('../security')
const dbService = require('../dbServices')
const S3Service = require('../S3Service')
const dbHandler = require('./dbHandler')

// Stub these methods before requiring app
sinon.stub(security, 'checkJwt').callsFake((req, res, next) => {
    req.user = {sub: 'userid'}
    next()
})
sinon.stub(dbService, 'connect').callsFake(async () => {
    return await dbHandler.connect()
})
const app = require('../app')

// Adding some time for memory mongodb server to be created before running tests
setTimeout(() => {
    describe('Server APIs', () => {
        describe('GET /publicTrips', () => {
            afterEach(() => {
                dbService.getPublicTrips.restore()
            })

            it('Getting public trips without images', done => {
                const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], []) ]
                const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], []) ]

                sinon.stub(dbService, 'getPublicTrips').returns(dbOutputMock)
                
                request(app)
                    .get('/publicTrips')
                    .expect(200, (err, res) => {
                        expect(res.body).to.deep.equal(apiOutputMock)
                        done()
                    })            
            })

            it('Getting public trips with images', done => {
                const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], [
                    {fileUrlName: 'fileA'},
                    {fileUrlName: 'fileB'},
                ]) ]
                const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], [
                    {fileUrlName: 'fileA', S3Url: 'url_fileA'},
                    {fileUrlName: 'fileB', S3Url: 'url_fileB'},
                ]) ]

                sinon.stub(dbService, 'getPublicTrips').returns(dbOutputMock)
                const s3UrlStub = sinon.stub(S3Service, 'getImageS3URL')
                s3UrlStub.withArgs('fileA').returns('url_fileA')
                s3UrlStub.withArgs('fileB').returns('url_fileB')
                
                request(app)
                    .get('/publicTrips')
                    .expect(200, (err, res) => {
                        S3Service.getImageS3URL.restore()
                        expect(res.body).to.deep.equal(apiOutputMock)
                        done()
                    })
            })
        })

        describe('GET /trips passing authentication', () => {
            afterEach(() => {
                dbService.getUserTrips.restore()
            })

            it('Getting user trips without images', (done) => {
                const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], []) ]
                const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], []) ]

                sinon.stub(dbService, 'getUserTrips').returns(dbOutputMock)
                
                request(app)
                    .get('/trips')
                    .expect(200, (err, res) => {
                        expect(res.body).to.deep.equal(apiOutputMock)
                        done()
                    })
            })

            it('Getting user trips with images', (done) => {
                const dbOutputMock = [ tripMockData.getTripWithDummyId(true, [], [
                    {fileUrlName: 'fileA'},
                    {fileUrlName: 'fileB'},
                ]) ]
                const apiOutputMock = [ tripMockData.getTripWithDummyId(false, [], [
                    {fileUrlName: 'fileA', S3Url: 'url_fileA'},
                    {fileUrlName: 'fileB', S3Url: 'url_fileB'},
                ]) ]

                sinon.stub(dbService, 'getUserTrips').returns(dbOutputMock)
                const s3UrlStub = sinon.stub(S3Service, 'getImageS3URL')
                s3UrlStub.withArgs('fileA').returns('url_fileA')
                s3UrlStub.withArgs('fileB').returns('url_fileB')
                
                request(app)
                    .get('/trips')
                    .expect(200, (err, res) => {
                        S3Service.getImageS3URL.restore()
                        expect(res.body).to.deep.equal(apiOutputMock)
                        done()
                    })
            })
        })

        describe('POST /trips', () => {
            afterEach(() => {
                dbService.createTrip.restore()
                S3Service.copyToPermanentBucket.restore()
            })

            it('Creating user trip without location and images', (done) => {
                const reqBody = tripMockData.getTripWithDummyId(false, [], [])
                
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(dbService, 'createTrip')

                request(app)
                    .post('/trips')
                    .send(reqBody)
                    .expect(200, done)
            })

            it('Creating user trip without images', (done) => {
                const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
                const reqBody = tripMockData.getTripWithDummyId(false, locations, [])
                
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(dbService, 'createTrip')

                request(app)
                    .post('/trips')
                    .send(reqBody)
                    .expect(200, done)
            })

            it('Creating user trip without location', (done) => {
                const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
                const reqBody = tripMockData.getTripWithDummyId(false, [], images)
                
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(dbService, 'createTrip')

                request(app)
                    .post('/trips')
                    .send(reqBody)
                    .expect(200, done)            
            })

            it('Creating user trip with location and images', (done) => {
                const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
                const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
                const reqBody = tripMockData.getTripWithDummyId(false, locations, images)
                
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(dbService, 'createTrip')

                request(app)
                    .post('/trips')
                    .send(reqBody)
                    .expect(200, done)
            })
        })

        describe('DELETE /trips/:tripId', () => {
            afterEach(() => {
                dbService.deleteTrip.restore()
                S3Service.deleteS3Images.restore()
            })

            it('Delete a trip', (done) => {
                sinon.stub(dbService, 'deleteTrip').returns({})
                sinon.stub(S3Service, 'deleteS3Images')

                request(app)
                    .delete('/trips/:1234')
                    .expect(200, done)
            })
        })

        describe('PUT /trips/:tripId', () => {
            afterEach(() => {
                dbService.getImagesForTrip.restore()
                dbService.updateTrip.restore()
                S3Service.copyToPermanentBucket.restore()
                S3Service.deleteS3Images.restore()
            })

            it('Update a trip', (done) => {
                const locations = [{latLng: ['20.2', '30.5']}, {latLng: ['50.12', '-25.74']}]
                const images = [{fileUrlName: 'fileA', S3Url: 'url_fileA'}, {fileUrlName: 'fileB', S3Url: 'url_fileB'}]
                const reqBody = tripMockData.getTripWithDummyId(false, locations, images)
                
                sinon.stub(dbService, 'getImagesForTrip').returns({images: images})
                sinon.stub(dbService, 'updateTrip').returns({})
                sinon.stub(S3Service, 'copyToPermanentBucket')
                sinon.stub(S3Service, 'deleteS3Images')

                request(app)
                    .put('/trips/:1234')
                    .send(reqBody)
                    .expect(200, done)
            })
        })

        describe('GET /get-signed-url', () => {
            afterEach(() => {
                dbService.genUrlFileName.restore()
                S3Service.genSignedUrlPut.restore()
            })

            it('Get s3 signed url', (done) => {
                const urlFileName = 'urlfilename'
                const fileType = 'image/jpeg'
                const apiOutputMock = urlFileName+'_'+fileType
                sinon.stub(dbService, 'genUrlFileName').returns(urlFileName)
                sinon.stub(S3Service, 'genSignedUrlPut').withArgs(urlFileName, fileType).returns(apiOutputMock)

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

    describe('AWS S3 Services', () => {
        describe('getImageS3URL()', () => {

            it('Generating view url for existing resource', (done) => {
                const isDev = (process.env.NODE_ENV !== 'production')
                const bucketName = (isDev) ? process.env.S3_BUCKET_NAME : process.env.S3_BUCKET_NAME_PRD
                const bucketRegion = process.env.S3_BUCKET_REGION
                const fileName = 'filename'
                const outputMock = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileName}`

                expect(S3Service.getImageS3URL(fileName)).to.equal(outputMock)
                done()
            })
        })
        // Other S3Services methods are plain wrappers for actual AWS APIs
    })

    describe('MongoDB Services', () => {
        afterEach( async () => {
            await dbHandler.clearDatabase()
        })
        after( async () => {
            await dbHandler.closeDatabase()
        })

        it('Create a trip', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)

            await dbService.createTrip(tripToAdd)
            
            const collectionCount = await dbHandler.getConnection().db('trips').collection('tripInfo')
                .countDocuments({})
            expect(collectionCount).to.equal(1)
        })

        it('Delete a trip', async () => {
            const tripToAdd = tripMockData.getTripForCreation([], [], true)
            const result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                insertOne(tripToAdd)

            await dbService.deleteTrip(result.insertedId, 'userid')
            
            const collectionCount = await dbHandler.getConnection().db('trips').collection('tripInfo')
                .countDocuments({})
            expect(collectionCount).to.equal(0)
        })

        describe('Get public trips', () => {
            it('Initial load', async () => {
                const tripToAdd1 = tripMockData.getTripForCreation([], [], true)
                const tripToAdd2 = tripMockData.getTripForCreation([], [], true)
                const tripToAdd3 = tripMockData.getTripForCreation([], [], false)
                await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertMany([tripToAdd1, tripToAdd2, tripToAdd3])
     
                 const result = await dbService.getPublicTrips(true)
     
                 expect(result.length).to.equal(2)
             })
     
             it('Subsequent load', async () => {
                 const tripToAdd1 = tripMockData.getTripForCreation([], [], true)
                 const tripToAdd2 = tripMockData.getTripForCreation([], [], false)
                 const tripToAdd3 = tripMockData.getTripForCreationOlderDate([], [], true)
                 let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                     insertMany([tripToAdd1, tripToAdd2, tripToAdd3])
                 // Use first entry as last loaded trip
                 const lastLoadedTrip = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    findOne({ '_id': result.insertedIds[0] })
     
                 result = await dbService.getPublicTrips(false, {
                     tripId: lastLoadedTrip._id.toString(),
                     endDate: lastLoadedTrip.endDate,
                     startDate: lastLoadedTrip.startDate
                 })
     
                 expect(result.length).to.equal(1)
             })
        })

        describe('Get user trips', () => {
            it('Correct user id', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], [], true)
                const userId = tripToAdd.userId
                await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                const result = await dbService.getUserTrips(userId)

                expect(result.length).to.equal(1)
            })
            
            it('Wrong user id', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], [], true)
                const userId = tripToAdd.userId
                await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                const result = await dbService.getUserTrips(userId+'wrong')

                expect(result.length).to.equal(0)
            })
            
        })

        describe('Update trip', () => {
            it('Correct user id', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], [], true)
                const userId = tripToAdd.userId
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)
                
                tripToAdd.title = 'updated title'
                result = await dbService.updateTrip(result.insertedId.toString(), userId, tripToAdd)

                expect(result.modifiedCount).to.equal(1)
            })
            
            it('Wrong user id', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], [], true)
                const userId = tripToAdd.userId
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                tripToAdd.title = 'updated title'
                result = await dbService.updateTrip(result.insertedId.toString(), userId+'wrong', tripToAdd)

                expect(result.modifiedCount).to.equal(0)
            })            
        })

        describe('Get images for trip', () => {
            const imageInfo = [
                {fileUrlName: 'fileA'},
                {fileUrlName: 'fileB'}
            ]
            it('Wrong user id', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], imageInfo, true)
                const userId = tripToAdd.userId
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                tripToAdd.title = 'updated title'
                result = await dbService.getImagesForTrip(result.insertedId.toString(), userId+'wrong')

                expect(result).to.equal(null)
            })

            it('Trip has image info', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], imageInfo, true)
                const userId = tripToAdd.userId
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                tripToAdd.title = 'updated title'
                result = await dbService.getImagesForTrip(result.insertedId.toString(), userId)

                expect(result.images.length).to.equal(2)
            })

            it('Trip has no image info', async () => {
                const tripToAdd = tripMockData.getTripForCreation([], [], true)
                const userId = tripToAdd.userId
                let result = await dbHandler.getConnection().db('trips').collection('tripInfo').
                    insertOne(tripToAdd)

                tripToAdd.title = 'updated title'
                result = await dbService.getImagesForTrip(result.insertedId.toString(), userId)

                expect(result.images.length).to.equal(0)
            })
        })

        it('Generate URL file name for image', () => {
            const urlFileName = dbService.genUrlFileName()
            expect(urlFileName.length).to.be.gt(0)
        })
    })
run()
}, 5000)