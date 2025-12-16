const express = require('express');
const memberShip = require('../controllers/projectMembershipController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();


router.post("/projects/:id/join-request", auth,memberShip.requestToJoinProject);
router.get("/projects/:id/join-requests", auth,memberShip.getJoinRequests);
router.patch("/projects/:id/join-requests/:requestId", auth,memberShip.handleJoinRequest);

// direct membership
router.patch("/projects/:id/add-member", auth,memberShip.addMember);
router.patch("/projects/:id/remove-member", auth,memberShip.removeMember);


module.exports = router;