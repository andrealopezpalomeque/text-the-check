const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'text-the-check', version: '1.0.0' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Text the Check server running on port ${PORT}`)
})
