let mongoose = require("mongoose");
let server = require("./app");
let chai = require("chai");
let chaiHttp = require("chai-http");

chai.use(chaiHttp);
chai.should(); 

describe('Countries API Suite', () => {

    describe('Fetching Country Details', () => {

        it('it should fetch a country named India', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 1 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(1);
                    res.body.should.have.property('name').eql('India');
                    done();
                });
        });

        it('it should fetch a country named United States', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 2 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(2);
                    res.body.should.have.property('name').eql('United States');
                    done();
                });
        });

        it('it should fetch a country named Germany', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 3 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(3);
                    res.body.should.have.property('name').eql('Germany');
                    done();
                });
        });

        it('it should fetch a country named Brazil', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 4 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(4);
                    res.body.should.have.property('name').eql('Brazil');
                    done();
                });
        });

        it('it should fetch a country named Japan', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 5 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(5);
                    res.body.should.have.property('name').eql('Japan');
                    done();
                });
        });

        it('it should fetch a country named Australia', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 6 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(6);
                    res.body.should.have.property('name').eql('Australia');
                    done();
                });
        });

        it('it should fetch a country named South Africa', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 7 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(7);
                    res.body.should.have.property('name').eql('South Africa');
                    done();
                });
        });

        it('it should fetch a country named Canada', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 8 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(8);
                    res.body.should.have.property('name').eql('Canada');
                    done();
                });
        });

        it('it should fetch a country named France', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 9 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(9);
                    res.body.should.have.property('name').eql('France');
                    done();
                });
        });

        it('it should fetch a country named Argentina', (done) => {
            chai.request(server)
                .post('/country')
                .send({ id: 10 })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('id').eql(10);
                    res.body.should.have.property('name').eql('Argentina');
                    done();
                });
        });

    });

});

describe('Testing Other Endpoints', () => {

    describe('it should fetch OS Details', () => {
        it('it should fetch OS details', (done) => {
            chai.request(server)
                .get('/os')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
    });

    describe('it should fetch Live Status', () => {
        it('it checks Liveness endpoint', (done) => {
            chai.request(server)
                .get('/live')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('status').eql('live');
                    done();
                });
        });
    });

    describe('it should fetch Ready Status', () => {
        it('it checks Readiness endpoint', (done) => {
            chai.request(server)
                .get('/ready')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('status').eql('ready');
                    done();
                });
        });
    });

});
