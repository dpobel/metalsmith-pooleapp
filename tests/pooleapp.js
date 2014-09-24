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
            conf.forms[config[secret].name] = {secret: secret};
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
});
