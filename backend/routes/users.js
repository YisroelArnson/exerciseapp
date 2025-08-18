const express = require('express');
const Joi = require('joi');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const { getFirestore } = require('../firebase/config');

const router = express.Router();
const db = getFirestore();



module.exports = router;


