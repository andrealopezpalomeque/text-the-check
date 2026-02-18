import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Import routes
import whatsappRoutes from './routes/whatsapp.js'
import healthRoutes from './routes/health.js'

// Import Firebase initialization
import './config/firebase.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT

// Trust first proxy (for ngrok, Railway, Heroku, etc.)
app.set('trust proxy', 1)

// Middleware
app.use(helmet()) // Security headers
app.use(cors()) // Enable CORS
app.use(morgan('dev')) // HTTP request logging
// Parse JSON bodies.
// NOTE: We capture the raw request body so webhook signature verification can hash the exact bytes.
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/whatsapp', whatsappRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Text The Check API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      whatsapp: '/api/whatsapp/webhook'
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 Text The Check API Server       ║
║                                        ║
║     Port: ${PORT}                        ║
║     Environment: ${process.env.NODE_ENV || 'development'}           ║
║                                        ║
║     Endpoints:                         ║
║     - GET  /api/health                 ║
║     - GET  /api/whatsapp/webhook       ║
║     - POST /api/whatsapp/webhook       ║
╚════════════════════════════════════════╝
  `)
})
