const express = require('express')
const { registerUser, loginUser } = require('../controllers/userController')

const router = express.Router()

// Register route - POST /auth/register
router.post('/register', registerUser)

// Login route - POST /auth/login
router.post('/login', loginUser)

module.exports = router
