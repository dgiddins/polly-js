/**
 * Created by maurice on 9/17/2015.
 */

var assert = require('assert');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
var requestPromise = require('request-promise');

var polly = require('..');

describe('The retry policy', function () {

    describe('with a synchronous call', function () {
        it('should return the result when no error', function () {

            var result = polly
                .retry()
                .execute(function () {
                    return 42;
                });

            assert.equal(result, 42);
        });

        it('should throw after an error', function () {

            assert.throws(function () {
                polly
                    .retry()
                    .execute(function () {
                        throw new Error("Wrong value");
                    });
            }, /Wrong value/);
        });

        it('should retry once after an error and still fail', function () {
            var count = 0;

            try {
                polly
                    .retry()
                    .execute(function () {
                        count++;
                        throw new Error("Wrong value");
                    });
            }
            catch (ex) {

            }
            assert.equal(count, 2);
        });

        it('should retry once after an error and succeed', function () {
            var count = 0;

            var result = polly
                .retry().execute(function () {
                    count++;
                    if (count === 1) {
                        throw new Error("Wrong value");
                    }

                    return 42;
                });

            assert.equal(result, 42);
            assert.equal(count, 2);
        });
    });

    describe('with a asynchronous call', function () {
        it('should return the result when no error', function (done) {

            polly
                .retry()
                .executeForPromise(function () {
                    return Promise.resolve(42);
                }).then(function (result) {
                    assert.equal(result, 42);
                    done();
                });
        });

        it('should reject after an error', function (done) {

            polly
                .retry()
                .executeForPromise(function () {
                    return Promise.reject(new Error("Wrong value"));
                }).catch(function (err) {
                    assert.ok(err instanceof Error);
                    assert.equal(err.message, "Wrong value");
                    done();
                });
        });

        it('should retry once after an error and still fail', function (done) {
            var count = 0;

            polly
                .retry()
                .executeForPromise(function () {
                    return new Promise(function (resolve, reject) {
                        count++;
                        reject(new Error("Wrong value"));
                    });
                }).catch(function (err) {
                    assert.equal(count, 2);
                    done();
                });
        });

        it('should retry once after an error and succeed', function () {
            var count = 0;

            return polly
                .retry()
                .executeForPromise(function () {
                    return new Promise(function (resolve, reject) {
                        count++;
                        if (count === 1) {
                            reject(new Error("Wrong value"));
                        } else {
                            resolve(42);
                        }
                    });
                })
                .should.eventually.equal(42)
                .then(function () {
                    count.should.equal(2);
                });

        });

        it('we can load html from Google', function () {
            var count = 0;

            return polly
                .retry()
                .executeForPromise(function () {
                    count++;
                    return requestPromise('http://www.google.com');
                })
                .should.eventually.be.fulfilled
                .then(function () {
                    count.should.equal(1);
                })
        });

        it('we can\'t load html from am invalid URL', function () {
            var count = 0;

            return polly
                .retry()
                .executeForPromise(function () {
                    count++;
                    return requestPromise('http://www.this-is-no-site.com');
                })
                .should.eventually.be.rejected
                .then(function () {
                    count.should.equal(2);
                })
        });
    });
});
