const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const {User} = require('./models/user');

const app = express();

// bodyParser middleware
app.use(bodyParser.json());

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    
    // User.findByCredentials(body.email, body.password).then((user) => {
    //     res.send(user);
    //     console.log(user);
    // }).catch((e) => {
    //     res.status(400).send();
    //     console.log(e);
    // });

    User.findOne({email:body.email}).then((result) => {
        res.send(result);
    }).catch((err) => {
        console.log(e);
    });
});

app.listen(3000, () => {
    console.log('Started on port 3000');
});