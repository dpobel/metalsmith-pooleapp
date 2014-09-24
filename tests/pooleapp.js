/* global describe, it, beforeEach, afterEach */
var msPooleApp = require('..'),
    assert = require('assert'),
    nock = require('nock');

describe('PooleApp plugin', function () {
    var poole, files, metadata,
        metalsmith = {
            metadata: function () {
                return metadata;
            }
        };

    beforeEach(function () {
        nock.disableNetConnect();
        poole = nock('http://pooleapp.com');
        metadata = {};
        files = {};
    });

    afterEach(function () {
        nock.enableNetConnect();
    });

    function configureNock(config) {
        Object.keys(config).forEach(function (secret) {
            var conf = config[secret];

            poole.get('/data/' + secret + '.json')
                .reply(conf.statusCode, conf.body);
        });
    }

    function poolAppPluginConf(config) {
        var conf = {forms: {}};

        Object.keys(config).forEach(function (secret) {
            conf.forms[config[secret].name] = {
                secret: secret,
                identifier: config[secret].identifier,
            };
        });
        return conf;
    }

    it('should fetch data for the forms', function (done) {
        var config = {
                "secret1": {
                    "name": "form1",
                    "statusCode": 200,
                    "body": {sessions: "result1"},
                },
                "secret2": {
                    "name": "form2",
                    "statusCode": 200,
                    "body": {sessions: "result2"},
                },
            };

        configureNock(config);
        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err === 'undefined', "No error should be found");
            assert.ok(typeof metadata.pooleapp !== "undefined", "The pooleapp metadata should have been created");

            Object.keys(config).forEach(function (secret) {
                var form = config[secret].name;

                assert.strictEqual(
                    config[secret].body.sessions,
                    metadata.pooleapp[form],
                    "The sessions from the form '" + form + "' should have been stored"
                );
            });

            done();
        });
    });

    it('should handle http errors', function (done) {
        var config = {
                "secret1": {
                    "name": "form1",
                    "statusCode": 403,
                    "body": "",
                },
            };

        configureNock(config);
        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err !== 'undefined', "The error should be handled");

            done();
        });
    });

    it('should handle JSON errors', function (done) {
        var config = {
                "secret1": {
                    "name": "form1",
                    "statusCode": 200,
                    "body": "{invalid",
                },
            };

        configureNock(config);
        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err !== 'undefined', "The error should be handled");

            done();
        });
    });

    it('should handle network errors', function (done) {
        var config = {
                "secret1": {
                    "name": "form1",
                    "statusCode": 200,
                    "body": "{}",
                },
            };

        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err !== 'undefined', "The error should be handled");

            done();
        });
    });

    it('should add the data to object it belongs to', function (done) {
        var sessions = {
                sessions: [
                    {id: 1, path: "file1"},
                    {id: 3, path: "file3"},
                    {id: 2, path: "file1"},
                ]
            },
            config = {
                "secret": {
                    "name": "form",
                    "identifier": "path",
                    "statusCode": 200,
                    "body": JSON.stringify(sessions),
                },
            },
            files = {
                "file1": {path: "file1"},
                "file2": {path: "file2"},
                "file3": {path: "file3"},
            };

        configureNock(config);
        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err === 'undefined', "No error should be found");

            assert.ok(
                typeof files.file2.form === 'undefined',
                "No data should have been added to file2"
            );
            assert.ok(
                Array.isArray(files.file1.form),
                "Some data should have been collected in file1"
            );
            assert.equal(
                2, files.file1.form.length,
                "2 elements should have been collected in file1"
            );
            assert.equal(1, files.file1.form[0].id);
            assert.equal(2, files.file1.form[1].id);

            assert.ok(
                Array.isArray(files.file3.form),
                "Some data should have been collected in file3"
            );
            assert.equal(
                1, files.file3.form.length,
                "1 element should have been collected in file3"
            );
            assert.equal(3, files.file3.form[0].id);

            done();
        });
    });

    it('should handle mapping errors', function (done) {
        var sessions = {
                sessions: [
                    {id: 1, path: "doesNotExist"},
                    {id: 3},
                    {id: 2, path: "file1"},
                ]
            },
            config = {
                "secret": {
                    "name": "form",
                    "identifier": "path",
                    "statusCode": 200,
                    "body": JSON.stringify(sessions),
                },
            },
            files = {
                "file1": {path: "file1"},
                "file2": {},
                "file3": {path: "file3"},
            };

        configureNock(config);
        msPooleApp(poolAppPluginConf(config))(files, metalsmith, function (err) {
            poole.done();
            assert.ok(typeof err === 'undefined', "No error should be found");

            assert.ok(
                typeof files.file2.form === 'undefined',
                "No data should have been added to file2"
            );
            assert.ok(
                typeof files.file3.form === 'undefined',
                "No data should have been added to file3"
            );
            assert.ok(
                Array.isArray(files.file1.form),
                "Some data should have been collected in file1"
            );
            assert.equal(
                1, files.file1.form.length,
                "1 element should have been collected in file1"
            );
            assert.equal(2, files.file1.form[0].id);

            done();
        });
    });
});
