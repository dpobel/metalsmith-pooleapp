var http = require('http'),
    async = require('async'),
    template = require('string-template'),

    DATA_URL_TEMPLATE = 'http://pooleapp.com/data/{secret}.json';

function fetchFormData(formName, formInfo, cb) {
    http.get(template(DATA_URL_TEMPLATE, formInfo), function (res) {
        var struct, body = '';

        if ( res.statusCode >= 400 ) {
            cb("PooleApp server answered with a " + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            try {
                struct = JSON.parse(body);
            } catch(e) {
                return cb(e);
            }
            cb(false, {
                "formName": formName,
                "sessions": struct.sessions,
            });
        });
    }).on('error', cb);
}

module.exports = function (opts) {
    return function (files, metalsmith, done) {
        var tasks = [],
            metadata = metalsmith.metadata();

        metadata.pooleapp = {};
        Object.keys(opts.forms).forEach(function (formName) {
            tasks.push(function (cb) {
                fetchFormData(formName, opts.forms[formName], cb);
            });
        });
        async.parallel(tasks, function (err, data) {
            if ( err ) {
                done(err);
                return;
            }
            data.forEach(function (formData) {
                metadata.pooleapp[formData.formName] = formData.sessions;
            });
            done();
        });
    };
};
