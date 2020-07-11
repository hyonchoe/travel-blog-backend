const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(require('./routes'))

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Listening on port ${port}`))