# metalsmith-pooleapp

A Metalsmith plugin to retrieve data stored in http://pooleapp.com/. PooleApp is
a hosted data store dedicated to static website. Amongst others things, it can
be used to store comments.

[![Build
Status](https://travis-ci.org/dpobel/metalsmith-pooleapp.svg?branch=master)](https://travis-ci.org/dpobel/metalsmith-pooleapp)
[![Dependency
Status](https://gemnasium.com/dpobel/metalsmith-pooleapp.svg)](https://gemnasium.com/dpobel/metalsmith-pooleapp)

## Installation

    $ npm install metalsmith-pooleapp

## JavaScript usage

```js
var pooleApp = require('metalsmith-pooleapp');

metalsmith.use(pooleApp({
    "forms": {
        "comments": {
            "secret": "theSecretKeyFromPooleApp",
            "identifier": "path",
            "filter": "foor == 2 or bar < 20"
        },
    }
});
```

The function exported by the `metalsmith-pooleapp` expects an object in
parameter with a `forms` property. This property contains an object with an
arbitrary number of *sub-objects*. Each one describing a PooleApp form and how
the data will be available in Metalsmith:

* the key (`comments` in this example) is used to register the data in the
  Metalsmith's metadata. Here, the collected data are available with:
`metalsmith.metadata().pooleapp.comments`. If `identifier` is filled (see
below), this identifier is also used to register the collected data under the
file.
* the `secret` is necessary to build the URL to fetch the data from PooleApp.com
* the `identifier` is optional, it holds a property name. The plugin compares
  the value of this property in the file object and in the remote object and if
they match, the remote object is added to the array available under the key
(`comments` here)
* the `filter` is optional, it allows to filter the PooleApp entries. It uses
  the [filtrex expression engine](https://www.npmjs.com/package/filtrex).

If you use the metalsmith-permalink plugin, the `identifier` can set to `path`.
By doing that and by adding the `path` in an hidden form field, the collected
data are directly available in the file object where the form was filled.

## CLI usage

```json
{
  "plugins": {
    "metalsmith-pooleapp": {
      "forms": {
        "comments": {
          "secret": "theSecretKeyFromPooleApp",
          "identifier": "path",
          "filter": "foor == 2 or bar < 20"
        }
      }
    }
  }
}
```
## License

MIT
