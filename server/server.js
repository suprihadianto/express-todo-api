require('./config/config.js');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const {mongoose} = require('./db/mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT

// bodyParser middleware
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Welcome!');
})

app.post('/todos', authenticate, (req, res) => {
    const newTodo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    newTodo.save().then(doc => {
        res.status(200).send(doc);
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({_creator: req.user._id}).then(todos => {
        res.status(200).send({todos});
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findOne({_id: id, _creator: req.user._id}).then((todo) => {
        if (!todo) {
            return res.status(404).send();
        }
        res.status(200).send({todo});
    }).catch(e => {
        res.status(400).send(e);
    });
});

app.delete('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findOneAndRemove({_id: id, _creator: req.user._id}).then(todo => {
        if (!todo) {
            return res.status(404).send();
        }
        res.status(200).send({todo});
    }).catch(e => {
        res.status(400).send();
    })

});

app.patch('/todos/:id', authenticate, (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectId.isValid(id)) {
        return res.status(404).send();
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then(todo => {
        if (!todo) {
            return res.status(404).send();
        }

        res.status(200).send({todo});
    }).catch(e => {
        res.status(400).send();
    })
});

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);

    user.save().then(() => {
        // res.send(user);
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user)
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.get('/users/me', authenticate, (req, res) => {
    // const token = req.header('x-auth');

    // User.findByToken(token).then((user) => {
    //     if (!user) {
    //         // res.status(401).send();
    //         return Promise.reject();
    //     }

        res.send(req.user);
    // }).catch((e) => {
    //     res.status(401).send();
    // });
    
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    
    User.findByCredentials(body.email, body.password).then((user) => {
        // res.send(user);
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user)
        });
    }).catch((e) => {
        res.status(400).send();
    });

    // User.findOne({email: body.email}, (err, user) => {
    //     if (err) throw err;

    //     if (!user) {
    //         res.status(400).send({message: 'User Not Found'});
    //     } else {
    //     user.comparePassword(body.password, function(err, isMatch) {
    //         if (err) {
    //             res.status(400).send(err);
    //         }
    //         if (!isMatch){
    //             res.status(400).send({message: 'password not march'});
    //             console.log(`${body.password}: `, isMatch); // -> Password123: false
    //         } else {
    //             res.send(user);
    //             console.log(`${body.password}: `, isMatch); // -> Password123: true
    //         }
    //     });
    //     }
    // });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(401).send();
    });
});

app.listen(port, () => {
    console.log(`Server up on ${port}`);
});

module.exports = {app};