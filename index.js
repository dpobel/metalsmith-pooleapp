var http = require('http'),
    async = require('async'),
    template = require('string-template'),
    filtrex = require('filtrex'),

    DATA_URL_TEMPLATE = 'http://pooleapp.com/data/{secret}.json';

function filterSessions(filterExpr, struct) {
    if ( !filterExpr ) {
        return struct;
    }

    struct.sessions = struct.sessions.filter(
        filtrex(filterExpr)
    );
    return struct;
}

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
                struct = filterSessions(formInfo.filter, JSON.parse(body));
            } catch(e) {
                return cb(e);
            }
            cb(false, {
                "formName": formName,
                "identifier": formInfo.identifier,
                "sessions": struct.sessions,
            });
        });
    }).on('error', cb);
}

function storeSessions(files, formData) {
    var id, name = formData.formName;

    if ( !formData.identifier ) {
        return;
    }
    id = formData.identifier;
    Object.keys(files).forEach(function (path) {
        var fileObj = files[path];

        formData.sessions.forEach(function (data) {
            if ( fileObj[id] && data[id] && fileObj[id] === data[id] ) {
                fileObj[name] = fileObj[name] || [];
                fileObj[name].push(data);
            }
        });
    });
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
                storeSessions(files, formData);
            });
            done();
        });
    };
};
