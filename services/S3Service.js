/** 
 * Handles iteraction with AWS S3 for uploading images
 */

require('dotenv').config()
const AWS = require('aws-sdk')

const isDev = (process.env.NODE_ENV !== 'production')
const bucketRegion = process.env.S3_BUCKET_REGION
const s3Id = process.env.S3_ID
const accessKey = process.env.S3_ACCESS_KEY
const bucketName = (isDev) ? process.env.S3_BUCKET_NAME : process.env.S3_BUCKET_NAME_PRD
const tempBucketName = (isDev) ? process.env.S3_TEMP_BUCKET_NAME : process.env.S3_TEMP_BUCKET_NAME_PRD

AWS.config.update({region: bucketRegion})
const s3 = new AWS.S3({
    accessKeyId: s3Id,
    secretAccessKey: accessKey,
    signatureVersion: 'v4',
})

/**
 * Deletes given images from S3
 * @param {Array} names Images to delete represented as Object { Key: <name> }
 * @returns S3 action result
 */
const deleteS3Images = (names) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Delete: { Objects: names },
    }

    s3.deleteObjects(params, (err, result) => {
      if (err) {
        console.error(err)
        resolve(err) // From end user point of view, failure to delete on S3 is fine
      }
      resolve(result)
    })
  })
}

/**
 * Generates signed URL to upload file to S3
 * @param {string} name Image file name (aka URL file name)
 * @param {string} type File type
 * @returns {Object} Signed url data
 */
const genSignedUrlPut = (name, type) => {
  return new Promise((resolve, reject) => {
      const params = { 
          Bucket: tempBucketName,
          Key: name, 
          Expires: 120, 
          ContentType: type,
          ACL:'public-read',
      }
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          console.error(err)
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

/**
 * Copies image file from temporary bucket to permanent bucket in S3
 * @param {string} name File name to copy
 * @returns S3 action result
 */
const copyToPermanentBucket = (name) => {
  return new Promise ((resolve ,reject) => {
    const params = {
      Bucket: bucketName,
      CopySource: `/${tempBucketName}/${name}`,
      Key: name,
      ACL:'public-read',
    }

    s3.copyObject(params, (err, result) => {
      if (err) {
        console.error(err)
        reject(err)
      }
      resolve(result)
    })
  })
}

/**
 * Gets public view URL for uploaded image in S3
 * @param {string} name File name
 * @returns {string} URL for the image
 */
const getImageS3URL = (name) => {
  return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${name}`
}

module.exports = { genSignedUrlPut, getImageS3URL, deleteS3Images, copyToPermanentBucket }