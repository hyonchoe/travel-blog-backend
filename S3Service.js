require('dotenv').config()
const AWS = require('aws-sdk')
const BUCKET_REGION = process.env.S3_BUCKET_REGION
const ID = process.env.S3_ID
const ACCESS_KEY = process.env.S3_ACCESS_KEY
const BUCKET_NAME = process.env.S3_BUCKET_NAME
const TEMP_BUCKET_NAME = process.env.S3_TEMP_BUCKET_NAME

AWS.config.update({region: BUCKET_REGION})
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: ACCESS_KEY,
    signatureVersion: 'v4',
})

const deleteS3Images = (names) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET_NAME,
      Delete: { Objects: names },
    }

    s3.deleteObjects(params, (err, result) => {
      if (err) {
        console.log(err)
        resolve(err) // From end user point of view, failure to delete on S3 is fine
      }
      resolve(result)
    })
  })
}

const genSignedUrlPut = (name, type) => {
  return new Promise((resolve, reject) => {
      const params = { 
          Bucket: TEMP_BUCKET_NAME,
          Key: name, 
          Expires: 120, 
          ContentType: type,
          ACL:'public-read',
      }
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve({ 
          signedUrl: url,
          fileUrlName: name,
          pendingFileUrl: getImageS3URL(name)
        })
      })
    })
}

const copyToPermanentBucket = (name) => {
  return new Promise ((resolve ,reject) => {
    const params = {
      Bucket: BUCKET_NAME,
      CopySource: `/${TEMP_BUCKET_NAME}/${name}`,
      Key: name,
      ACL:'public-read',
    }

    s3.copyObject(params, (err, result) => {
      if (err) {
        console.log(err)
        reject(err)
      }
      resolve(result)
    })
  })
}

const getImageS3URL = (name) => {
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${name}`
}

module.exports = { genSignedUrlPut, getImageS3URL, deleteS3Images, copyToPermanentBucket }