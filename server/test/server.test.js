const expect = require('expect');
const request = require('supertest');

const chai = require('chai');
const chaiHttp = require('chai-http');
// const expect = chai.expect();
const should = chai.should();

chai.use(chaiHttp);

// const {mongoose} = require('./../db/mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        var text = 'Test todo text';

        // request(app)
        //     .post('/todos')
        //     .send({text})
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body.text).toBe(text);
        //     })
        //     .end((err, res) => {
        //         if (err) {
        //             return done(err);
        //         }

        //         Todo.find({text}).then((todos) => {
        //             expect(todos.length).toBe(1);
        //             expect(todos[0].text).toBe(text);
        //             done();
        //         }).catch((e) => {
        //             done(e);
        //         });
        //     });

        chai.request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({text})
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('text');
                res.body.should.have.property('_id');
                res.body.should.have.property('completed');

                Todo.find({text}).then((todos) => {
                    todos.length.should.equal(1);
                    todos[0].text.should.equal(text);
                    done();
                }).catch((e) => {
                    done(e);
                });
            });
    });

    it('should not create todo with invalid body data', (done) => {
        var text = 'Test todo text';
        // request(app)
        //     .post('/todos')
        //     .send({})
        //     .expect(400)
        //     .end((err, res) => {
        //         if (err) {
        //             return done(err);
        //         }

        //         Todo.find().then((todos) => {
        //             expect(todos.length).toBe(2);
        //             done();
        //         }).catch((err) => {
        //             done(err);
        //         })
        //     })

        chai.request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({})
            .end((err, res) => {
                res.should.have.status(400);
                
                Todo.find({}).then((todos) => {
                    todos.length.should.equal(2);
                    done();
                }).catch((e) => {
                    done(e);
                });
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        // request(app)
        //     .get('/todos')
        //     .expect(200)
        //     .expect(res => {
        //         expect(res.body.todos.length).toBe(2);
        //     })
        //     .end(done);

        chai.request(app)
            .get('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.todos.length.should.equal(1);
                done();
            });
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        // request(app)
        //     .get(`/todos/${todos[0]._id.toHexString()}`)
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body.todo.text).toBe(todos[0].text);
        //     })
        //     .end(done);

        chai.request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.todo.text.should.equal(todos[0].text);
                done();
            });
    });

    it('should not return todo doc creatted by other user', (done) => {
        chai.request(app)
            .get(`/todos/${todos[1]._id.toHexString()}`)
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectId().toHexString();

        // request(app)
        //     .get(`/todos/${hexId}`)
        //     .expect(404)
        //     .end(done);

        chai.request(app)
            .get(`/todos/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('should return 404 for non-object ids', (done) => {
        // request(app)
        //     .get('/todos/123abc')
        //     .expect(404)
        //     .end(done);

        chai.request(app)
            .get('/todos/123abc')
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        var hexId = todos[1]._id.toHexString();

        // request(app)
        //     .delete(`/todos/${hexId}`)
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body.todo._id).toBe(hexId);
        //     })
        //     .end((err, res) => {
        //         if (err) {
        //             return done(err);
        //         }

        //         Todo.find(hexId).then((todo) => {
        //             expect(todo).toNotExist;
        //             done();
        //         }).catch((e) => {
        //             done(e);
        //         })
        //     })

        chai.request(app)
            .del(`/todos/${hexId}`)
            .set('x-auth', users[1].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.todo._id.should.equal(hexId);

                Todo.find(hexId).then((todo) => {
                    todo.should.be.a('array');
                    expect(todo).toNotExist;
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });

    it('should remove a todo', (done) => {
        var hexId = todos[0]._id.toHexString();

        chai.request(app)
            .del(`/todos/${hexId}`)
            .set('x-auth', users[1].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(404);
                Todo.find(hexId).then((todo) => {
                    todo.should.be.a('array');
                    expect(todo).toExist;
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });

    it('should return 404 if todo not found', (done) => {
        var hexId = new ObjectId().toHexString();
        
                // request(app)
                //     .delete(`/todos/${hexId}`)
                //     .expect(404)
                //     .end(done);

                chai.request(app)
                    .del(`/todos/${hexId}`)
                    .set('x-auth', users[1].tokens[0].token)
                    .end((err, res) => {
                        res.should.have.status(404);
                        done();
                    });
    });

    it('should return 404 if object id is no valid', (done) => {
        // request(app)
        // .get('/todos/123abc')
        // .expect(404)
        // .end(done);

        chai.request(app)
            .get('/todos/123abc')
            .set('x-auth', users[1].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
});

describe('PATCH /todos/:id', () => {
    it('should update the todos', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = 'This should be the new text';

        // request(app)
        //     .patch(`/todos/${hexId}`)
        //     .send({
        //         completed: true,
        //         text
        //     })
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body.todo.text).toBe(text);
        //         expect(res.body.todo.completed).toBe(true);
        //         // expect(res.body.todo.completedAt).toBeA('number');
        //     })
        //     .end(done);

        chai.request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.todo.text.should.equal(text);
                res.body.todo.completed.should.equal(true);
                res.body.todo.completedAt.should.that.is.a('number');
                done();
            });
    });

    it('should not update the todos created by other user', (done) => {
        var hexId = todos[0]._id.toHexString();
        var text = 'This should be the new text';
        chai.request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('should clear completedAt when todo is not completed', (done) => {
        var hexId = todos[1]._id.toHexString();
        var text = 'This should be the new text!!';

        // request(app)
        //     .patch(`/todos/${hexId}`)
        //     .send({
        //         completed: false,
        //         text
        //     })
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body.todo.text).toBe(text);
        //         expect(res.body.todo.completed).toBe(false);
        //         expect(res.body.todo.completedAt).toNotExist;
        //     })
        //     .end(done);

        chai.request(app)
            .patch(`/todos/${hexId}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({
                completed: false,
                text
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.todo.text.should.equal(text);
                res.body.todo.completed.should.equal(false);
                // res.body.todo.completedAt.should.that.is.empty;
                expect(res.body.todo.completedAt).toNotExist;
                done();
            });
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        // request(app)
        //     .get('/users/me')
        //     .set('x-auth', users[0].tokens[0].token)
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.body._id).toBe(users[0]._id.toHexString());
        //         expect(res.body.email).toBe(users[0].email);
        //     })
        //     .end(done);

        chai.request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body._id.should.equal(users[0]._id.toHexString());
                res.body.email.should.equal(users[0].email);
                done();
            });
    });

    it('should return 401 if not authenticated', (done) => {
        var json = {}
        // request(app)
        //     .get('/users/me')
        //     .expect(401)
        //     .expect((res) => {
        //         expect(res.body).toEqual({});
        //     })
        //     .end(done)

        chai.request(app)
            .get('/users/me')
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.that.is.empty;
                done();
            });
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = 'masuk123';

        // request(app)
        //     .post('/users')
        //     .send({email, password})
        //     .expect(200)
        //     .expect((res) => {
        //         expect(res.header['x-auth']).toExist;
        //         expect(res.body._id).toExist;
        //         expect(res.body.email).toBe(email);
        //     })
        //     .end((err) => {
        //         if (err) {
        //             return done(err);
        //         }

        //         User.findOne({email}).then((user) => {
        //             expect(user).toExist;
        //             expect(user.password).toNotBe(password);
        //             done();
        //         });
        //     });

        chai.request(app)
            .post('/users')
            .send({email, password})
            .end((err, res) => {
                res.header['x-auth'].should.exist;
                res.body._id.should.exist;
                res.body.email.should.equal(email);

                User.findOne({email}).then((user) => {
                    user.should.exist;
                    user.password.should.not.equal(password);
                    done();
                }).catch((e) => {
                    done(e);
                });
            });
    });

    it('should reurn validation errors if request invalid', (done) => {
        // request(app)
        //     .post('/users')
        //     .send({
        //         email: 'and',
        //         password: '123'
        //     })
        //     .expect(400)
        //     .end(done);

        chai.request(app)
            .post('/user')
            .send({
                email: 'and',
                password: '123'
            })
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('shoud not create user if email in use', (done) => {
        // request(app)
        //     .post('/users')
        //     .send({
        //         email: users[0].email,
        //         password: 'password123!'
        //     })
        //     .expect(400)
        //     .end(done);

        chai.request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'password123'
            })
            .end((err, res) => {
                res.should.have.status(400);
                done();
            });
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        chai.request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.header['x-auth'].should.exist;

                User.findById(users[1]._id).then((user) => {
                    user.tokens[1].should.include({
                        access: 'auth',
                        token: res.header['x-auth']
                    });
                    done();
                }).catch((e) => {
                    done(e);
                });
            });
    });

    it('should reject invalid login', (done) => {
        chai.request(app)
        .post('/users/login')
        .send({
            email: users[1].email,
            password: users[1].password + '1'
        })
        .end((err, res) => {
            res.should.have.status(400);
            expect(res.header['x-auth']).toNotExist;

            User.findById(users[1]._id).then((user) => {
                user.tokens.length.should.equal(1);
                done();
            }).catch((e) => {
                done(e);
            });
        });
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        chai.request(app)
            .del('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .end((err, res) => {
                if (err) {
                    return done();
                }
                res.should.have.status(200);
                
                User.findById(users[0]._id).then((user) => {
                    user.tokens.length.should.equal(0);
                    // expect(user.tokens.length).toBe(1)
                    done();
                }).catch((e) => {
                    done(e)
                });
            });
    });
});