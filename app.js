let mongoose = require("mongoose");
let server = require("./app");
let { expect } = require("chai");
let chaiHttp = require("chai-http");

// chai-http v5: chaiHttp.request.execute works standalone, no chai.use() needed
let request = chaiHttp.request.execute;

describe('Countries API Suite', () => {

    describe('Fetching Country Details', () => {

        it('it should fetch a country named India', (done) => {
            let payload = { id: 1 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(1);
                    expect(res.body).to.have.property('name').eql('India');
                    done();
                });
        });

        it('it should fetch a country named United States', (done) => {
            let payload = { id: 2 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(2);
                    expect(res.body).to.have.property('name').eql('United States');
                    done();
                });
        });

        it('it should fetch a country named Germany', (done) => {
            let payload = { id: 3 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(3);
                    expect(res.body).to.have.property('name').eql('Germany');
                    done();
                });
        });

        it('it should fetch a country named Brazil', (done) => {
            let payload = { id: 4 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(4);
                    expect(res.body).to.have.property('name').eql('Brazil');
                    done();
                });
        });

        it('it should fetch a country named Japan', (done) => {
            let payload = { id: 5 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(5);
                    expect(res.body).to.have.property('name').eql('Japan');
                    done();
                });
        });

        it('it should fetch a country named Australia', (done) => {
            let payload = { id: 6 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(6);
                    expect(res.body).to.have.property('name').eql('Australia');
                    done();
                });
        });

        it('it should fetch a country named South Africa', (done) => {
            let payload = { id: 7 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(7);
                    expect(res.body).to.have.property('name').eql('South Africa');
                    done();
                });
        });

        it('it should fetch a country named Canada', (done) => {
            let payload = { id: 8 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(8);
                    expect(res.body).to.have.property('name').eql('Canada');
                    done();
                });
        });

        it('it should fetch a country named France', (done) => {
            let payload = { id: 9 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(9);
                    expect(res.body).to.have.property('name').eql('France');
                    done();
                });
        });

        it('it should fetch a country named Argentina', (done) => {
            let payload = { id: 10 }
            request(server)
                .post('/country')
                .send(payload)
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('id').eql(10);
                    expect(res.body).to.have.property('name').eql('Argentina');
                    done();
                });
        });

    });

});

// Use below test cases to achieve coverage
describe('Testing Other Endpoints', () => {

    describe('it should fetch OS Details', () => {
        it('it should fetch OS details', (done) => {
            request(server)
                .get('/os')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    done();
                });
        });
    });

    describe('it should fetch Live Status', () => {
        it('it checks Liveness endpoint', (done) => {
            request(server)
                .get('/live')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').eql('live');
                    done();
                });
        });
    });

    describe('it should fetch Ready Status', () => {
        it('it checks Readiness endpoint', (done) => {
            request(server)
                .get('/ready')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.property('status').eql('ready');
                    done();
                });
        });
    });

});