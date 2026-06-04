const router       = require('express').Router();
const controller   = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

router.post('/login',    controller.login);
router.post('/register', controller.registerClient);
router.post('/forgot-password', controller.requestPasswordReset);
router.post('/reset-password',  controller.resetPassword);

router.post('/logout',      authenticate, controller.logout);
router.get('/me',           authenticate, controller.getProfile);
router.put('/me',           authenticate, controller.updateProfile);
router.put('/me/password',  authenticate, controller.changePassword);

module.exports = router;
