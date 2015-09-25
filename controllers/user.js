var express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var router = express.Router();

var models = require('../models/');
var userModel = models.user;
var projectModel = models.project;

/**
 * Авторизация
 */
router.post('/login', function (req, res) {
    var email = req.body.email.trim();
    var pass  = req.body.password.trim();

    if (!email.length || !pass.length) {
        res.end(JSON.stringify({ result: false, error: 'no auth data' }));
        return;
    }

    // Ищем пользователя
    userModel.model.find({ email: email }, function(err, data) {
        if (err || !data || !data.length) {
            res.end(JSON.stringify({ result: false, error: 'no user' }));
            return;
        }

        var user = data[0];
        // Проверяем пароль
        if (userModel.validatePassword(user.password, pass)) {
            var token = jsonwebtoken.sign(email, global.config.socketIo.secret, { expiresInMinutes: global.config.socketIo.expire });

            req.session.user = {
                email: email,
                name:  user.name,
                token: token
            };

            var answer = {
                result: true,
                user: {
                    name:   user.name,
                    email:  email
                },
                token: token,
                countTickets: false
            };

            projectModel.getTicketCount(email, function(err, countTickets) {
                if (!err && countTickets) {
                    answer.countTickets = countTickets;
                }

                res.end(JSON.stringify(answer));
            });

        } else {
            res.end(JSON.stringify({ result: false, error: 'wrong pass' }));
        }
    });
});

/**
 * Логаут
 */
router.all('/logout', function (req, res) {
    req.session.user = null;
    res.end(JSON.stringify({ result: true }));
});

module.exports = router;
