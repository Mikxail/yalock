var assert = require('assert');
var YALock = require('../index');

describe('yalock', function(){
    describe('Lock', () => {

        var contLock;
        var lock11, lock12;

        beforeEach(() => {
            contLock = new YALock();
            lock11 = contLock.createLock("lock1", {ttl: 500});
            lock12 = contLock.createLock("lock1", {ttl: 500});
        });

        afterEach(done => {
            lock11.unlock(() => {
                lock12.unlock(() => done());
            });
        });

        describe('tryLock', () => {
            it ('should be single lock', done => {
                lock11.tryLock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);
                    done();
                });
            });

            it ("should't second lock", done => {
                lock11.tryLock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);

                    lock12.tryLock((err, isOk) => {
                        assert.ifError(err);
                        assert.ok(!isOk);
                        done();
                    });
                });
            });

            it ("should't second lock on same lock", done => {
                lock11.tryLock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);

                    lock11.tryLock((err, isOk) => {
                        assert.ifError(err);
                        assert.ok(!isOk);
                        done();
                    });
                });
            });

            it ("should unlock", done => {
                lock11.tryLock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);

                    lock11.unlock((err, isOk) => {
                        assert.ifError(err);
                        assert.ok(isOk);

                        lock11.tryLock((err, isOk) => {
                            assert.ifError(err);
                            assert.ok(isOk);
                            done();
                        });
                    });
                });
            });
        });

        describe('lock', () => {
            it ('should be single lock', done => {
                lock11.lock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);
                    done();
                });
            });

            it ("should second lock wait first lock", done => {
                lock11.lock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);

                    lock12.tryLock((err, isOk) => {
                        assert.ifError(err);
                        assert.ok(!isOk);


                        lock12.lock((err, isOk) => {
                            assert.ifError(err);
                            assert.ok(isOk);
                            done();
                        });
                    });
                });
            });

            it ("should unlock and second lock is locked", done => {
                lock11.lock((err, isOk) => {
                    assert.ifError(err);
                    assert.ok(isOk);

                    lock12.tryLock((err, isOk) => {
                        assert.ifError(err);
                        assert.ok(!isOk);


                        lock12.lock((err, isOk) => {
                            assert.ifError(err);
                            assert.ok(isOk);
                            done();
                        });

                        setTimeout(() => {
                            lock11.unlock((err, isOk) => {
                                assert.ifError(err);
                                assert.ok(isOk);
                            });
                        }, 50);
                    });
                });
            });
        });
    });
});