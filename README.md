<p align="center">
  <img src="doc/bitgener.svg" alt="Bitgener" style="border-radius:50%"/>
<p>

<p align="center">
  A lightweight and zero-dependencies pure Node.js barcode library.
<p>

# Table of Contents
- [Presentation](#presentation)
- [Bitgener Online Demo](#bitgener-online-demo)
- [Installation](#installation)
- [Technical information](#technical-information)
  - [Node.js](#node.js)
  - [Debugging](#debugging)
  - [Tests](#tests)
    - [Linting](#linting)
    - [Unit](#unit)
- [Supported symbologies](#supported-symbologies)
- [Usage](#usage)
  - [Library](#library)
    - [Import Bitgener](#import-bitgener)
    - [bitgener(options): AsyncFunction](#bitgeneroptions-AsyncFunction)
    - [Examples](#examples)
      - [1D barcode](#1d-barcode)
      - [2D barcode](#2d-barcode)
      - [Full example using Sharp](#full-example-using-sharp)
  - [Environment variables](#environment-variables)
  - [Errors](#errors)
    - [Object structure](#object-structure)
    - [Codes](#codes)
- [Development](#development)
- [Licence](#licence)

# Presentation

*Bitgener* is a barcode library written in pure Node.js using ES6 and ES7 features. It is based on the great work made by Jean-Baptiste Demonte and contributors: [barcode](https://github.com/jbdemonte/barcode).

Despite the fact that [bwipjs](https://github.com/metafloor/bwip-js) can generate a lot of barcodes and other libraries exist, I personally needed to generate the same ECC 200 compliant Datamatrixes from the *barcode* library and it was not possible by any of these libraries. Plus I had some issues with architecture-dependent image processor libraries used by other modules.

*Bitgener* generates barcodes in pure SVG (Scalable Vector Graphics) format. The barcode generated can be a buffer, a readable stream, a string representing svg tags content or a file. It adds features like background and bars opacity, fixing final image width and height, keeping the original 1D/2D size, adding paddings and a generic font family for hri, adding stream, buffer and file outputs with a specific encoding.

SVGs generated by *Bitgener* uses crisp edges shape rendering to tell the user agent to turn off anti-aliasing to preserved the contrast, colors and edges without any smoothing or blurring that applies to images scaled up or down. Browsers support is nice and can be found here: https://caniuse.com/#feat=css-crisp-edges.

The aim of this project is to provide a simple, lightweight, zero-depency and fast barcode generator and let user choose the external or native image processing library to transform the svg generated into the specific format if needed.

# Bitgener Online Demo

[Show me!](https://bitgener.herokuapp.com/)

# Installation

`npm install bitgener`

`npm i -S bitgener`

# Technical information

## Node.js

- Language: JavaScript ES6/ES7
- VM: Node.js >=10.0.0

## Debugging

- Own debugger embedded that writes on *process.stderr* when the *DEBUG* environment variable is set. See [Environment variables](#environment-variables).

## Tests

Command to run all tests:

`npm test`

### Linting

ESLint with Airbnb base rules. See [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript).

`npm run test:lint`

### Unit

Mocha and Chai.

`npm run test:unit`

# Supported symbologies

One dimension:
- Codabar
- Code 11
- Code 39
- Code 93
- Code 128
- Ean 8
- Ean 13
- Standard 2 of 5
- Interleaved 2 of 5
- MSI
- UPC

Two dimensions:
- DataMatrix (ECC 200 standard, square and rectangular)

# Usage

## Library

### Import Bitgener

*Bitgener* module exports one async function named *bitgener*.

```javascript
const bitgener = require('bitgener');
```

### bitgener(options): AsyncFunction

  - `options`**<Object\>**:
    - `data`* **<String\>** The data to encode.
    - `type`* **<String\>** The supported symbology in which data will be encoded.
      - `codabar`: each character to encode must be one of *0123456789-$:/.+*
      - `code11`: each character to encode must be one of *0123456789-*
      - `code39`: each character to encode must be one of *0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*
      - `code93`: each character to encode must be one of *0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*
      - `code128`: each character to encode must be one of <i>!"#$%&'()*+,-./0123456789:;<=\>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~</i>
      - `ean8`: data to encode must contain 7 numerical digits.
      - `ean13`: data to encode must contain 12 numerical digits.
      - `std25` (standard 2 of 5): data to encode must contain only numerical digits.
      - `int25` (interleaved 2 of 5): data to encode must contain only numerical digits.
      - `msi`: data to encode must contain only numerical digits.
      - `upc`: data to encode must contain 11 numerical digits.
      - `datamatrix`: data to encode has no restrictions.
    - `output` **<String\>** The output format for the *svg* property of the object returned by this function. *Default*: `stream`
      - `stream`: generated svg tags as a Readable Stream.
      - `string`: generated svg tags as a string.
      - `buffer`: generated svg tags as a Buffer.
      - `{path to a file}`: a valid path to a svg file. The file will be created or overwritten, eg.: './doc/bitgener.svg'.
    - `encoding` **<String\>** For stream, buffer and file outputs. *Default*: `utf8`
      - `utf8`: multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
      - `ascii`: for 7-bit ASCII data only. This encoding is fast and will strip the high bit if set.
      - `utf16le`: 2 or 4 bytes, little-endian encoded Unicode characters. Surrogate pairs (U+10000 to U+10FFFF) are supported.
      - `ucs2`: alias of 'utf16le'.
      - `base64`: base64 encoding. When creating a Buffer from a string, this encoding will also correctly accept "URL and Filename Safe Alphabet" as specified in RFC4648, Section 5.
      - `latin1`: a way of encoding the Buffer into a one-byte encoded string (as defined by the IANA in RFC1345, page 63, to be the Latin-1 supplement block and C0/C1 control codes).
      - `binary`: alias for 'latin1'.
      - `hex`: encode each byte as two hexadecimal characters.
    - `crc` **<Boolean\>** Cyclic redundancy check. For *code93*, *std25*, *int25* and *msi* barcode types. *Default*: `true`
    - `rectangular` **<Boolean\>** For datamatrix only. *Default*: `false`
    - `padding` **<Number\>** The space in pixels around one side of the barcode that will be applied for its 4 sides. *Default*: `0`
    - `width` **<Number\>** The width in pixels to fix for the generated image. *Default*: `150`
    - `height` **<Number\>** The height in pixels to fix for the generated image. *Default*: `150`
    - `barWidth` **<Number\>** The bar width in pixels for 1D barcodes. *Default*: `1`
    - `barHeight` **<Number\>**  The bar height in pixels for 1D barcodes. *Default*: `50`
    - `original1DSize` **<Boolean\>** If true keep the original 1D barcode size determined by barWidth and barHeight else apply the specified width and height sizes to the final image. *Default*: `false`
    - `original2DSize` **<Boolean\>** For rectangular datamatrixes, if true keep the original 2D barcode size based on width else apply the specified width and height sizes to the final image. *Default*: `false`
    - `addQuietZone` **<Boolean\>** Add a quiet zone at the end of 1D barcodes. *Default*: `true`
    - `color` **<String\>** The bars and hri color. An hexadecimal value or one of these [generic names](lib/helpers/color.js). *Default*: `#000000`
    - `opacity` **<Number\>** The bars and hri opacity. *Min*: `0` *Max*: `1` *Default*: `1`
    - `bgColor` **<String\>** The background color. An hexadecimal value or one of these [generic names](lib/helpers/color.js). *Default*: `#FFFFFF`
    - `bgOpacity` **<Number\>** The background opacity. *Min*: `0` *Max*: `1` *Default*: `1`
    - `hri` **<Object\>** The human readable interpretation of the encoded data.
      - `show` **<Boolean\>** *Default*: `true`
      - `fontFamily` **<String\>** A generic font name based on [cssfontstack.com](cssfontstack.com) *Default*: `Arial`
        - `Sans-serif`
        - `Arial`
        - `Arial Black`
        - `Arial Narrow`
        - `Arial Rounded MT Bold`
        - `Avant Garde`
        - `Calibri`
        - `Candara`
        - `Century Gothic`
        - `Franklin Gothic Medium`
        - `Futura`
        - `Geneva`
        - `Gill Sans`
        - `Helvetica`
        - `Impact`
        - `Lucida Grande`
        - `Optima`
        - `Segoe UI`
        - `Tahoma`
        - `Trebuchet MS`
        - `Verdana`
        - `Serif`
        - `Bodoni MT`
        - `Book Antiqua`
        - `Calisto MT`
        - `Cambria`
        - `Didot`
        - `Garamond`
        - `Goudy Old Style`
        - `Lucida Bright`
        - `Palatino`
        - `Perpetua`
        - `Rockwell`
        - `Rockwell Extra Bold`
        - `Baskerville`
        - `Times New Roman`
        - `Consolas`
        - `Courier New`
        - `Lucida Console`
        - `Lucida Sans Typewriter`
        - `Monaco`
        - `Andale Mono`
        - `Copperlate`
        - `Papyrus`
        - `Brush Script MT`
      - `fontSize` **<Number\>** The font size in pixels. *Default*: `10`
      - `marginTop` **<Number\>** The margin size in pixels between the barcode bottom and the hri text. *Default*: `0`


  - Returns: **<Promise\>**
    - Resolve: **<Object\>**
      - `width` **<Number\>** The final image width.
      - `height` **<Number\>** The final image height.
      - `density` **<Number\>** The number of pixels per inch (DPI) calculated as optimized.
      - `type` **<String\>** The symbology used.
      - `data` **<String\>** The data encoded.
      - `hri` **<String\>** The human readable interpretation of the encoded data.
      - `output` **<String\>** The effective output option used.
      - `encoding` **<String\>** The encoding format used.
      - `svg` **<Readable\>** | **<String\>** | **<Buffer\>** The svg tags of the generated svg image. In case the ouput is a file, this field contains the svg tags in a string format.
    - Throws: **<DataError\>** | **<BarcodeTypeError\>** | **<OutputError\>**

### Examples

You can find these examples here: [doc/examples](doc/examples)

In these examples please prefer a well-known and tested asynchronous logger over the use of *console* module.

##### 1D barcode

```javascript
const bitgener = require('bitgener');

(async () => {
  try {
    const ret = await bitgener({
      data: '012345',
      type: 'code93',
      output: 'buffer',
      encoding: 'utf8',
      crc: false,
      padding: 25,
      barWidth: 5,
      barHeight: 150,
      original1DSize: true,
      addQuietZone: true,
      color: '#FFFFFF',
      opacity: 1,
      bgColor: '#F7931A',
      bgOpacity: 0.1,
      hri: {
        show: true,
        fontFamily: 'Futura',
        fontSize: 25,
        marginTop: 9,
      },
    });

    console.log(ret);
  } catch (e) {
    console.error(e.toString());
  }
})();
```

##### 2D barcode

```javascript
const bitgener = require('bitgener');

(async () => {
  try {
    const ret = await bitgener({
      data: 'Bitgener',
      type: 'datamatrix',
      output: 'bitgener.svg',
      encoding: 'utf8',
      rectangular: true,
      padding: 0,
      width: 250,
      height: 250,
      original2DSize: false,
      color: '#FFFFFF',
      opacity: 1,
      bgColor: '#F7931A',
      bgOpacity: 1,
      hri: {
        show: true,
        fontFamily: 'Courier New',
        fontSize: 15,
        marginTop: 0,
      },
    });

    console.log(ret);
  } catch (e) {
    console.error(e.toString());
  }
})();
```

##### Full example using Sharp

```javascript
const stream = require('stream');
const { createWriteStream } = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const bitgener = require('../../lib');

const pipeline = promisify(stream.pipeline);

/**
 * Generic function to convert the svg generated from Bitgener
 * into the specified format and get the specified output.
 *
 * Please note that no type/value checks are made in this function.
 *
 * @param  {Buffer} buffer    The buffer generated by Bitgener.
 * @param  {Number} density   The density needed to resize the image with no
 *                            image quality loss.
 * @param  {String} format    Format could be one of png, jpeg,
 *                            webp, tiff, raw supported by Sharp.
 * @param  {String} method    Method could be one of toFile, toBuffer,
 *                            or a Readable Stream returned by default by Sharp.
 * @param  {String} filePath  Path to write the image data to. If set, method is not required.
 * @return {Promise}          A Readable Stream by default, a Buffer,
 *                            a Sharp info object depending on the method.
 */
const convert = async function convert({
  buffer,
  density,
  format,
  method,
  filePath,
} = {}) {
  // sharp it!
  const sharped = sharp(buffer, { density });
  let ret;

  if (method === 'toFile' || filePath !== undefined) {
    ret = await sharped.toFile(filePath);
    // object returned by sharp: https://sharp.pixelplumbing.com/en/stable/api-output/#tofile
  } else if (method === 'toBuffer') {
    ret = sharped.toFormat(format).toBuffer();
  } else {
    // return a sharp/streamable object
    ret = sharped[format]();
  }

  return ret;
};

// then use it in an async function
(async () => {
  try {
    const wstream = createWriteStream(path.join(__dirname, 'sharped.png'));
    const {
      svg: buffer,
      density,
    } = await bitgener({
      data: 'Bitgener',
      type: 'datamatrix',
      output: 'buffer',
      encoding: 'utf8',
      rectangular: true,
      padding: 0,
      width: 250,
      height: 250,
      original2DSize: false,
      color: '#FFFFFF',
      opacity: 1,
      bgColor: '#F7931A',
      bgOpacity: 1,
      hri: {
        show: true,
        fontFamily: 'Courier New',
        fontSize: 15,
        marginTop: 0,
      },
    });

    const rstream = await convert({
      buffer,
      density,
      format: 'png',
    });

    // listen to rstream and wstream error events ;)

    // use pipeline to automatically clean up streams or you're exposing your code to memory leaks
    await pipeline(rstream, wstream);

    // ...
  } catch (e) {
    console.error(e.toString());
  }
})();
```

## Environment variables

- **DEBUG**: used to debug *Bitgener*.

  Examples:
  - `DEBUG=bitgener*` will debug all Bitgener modules that could use the debugger.
  - `DEBUG=*` will debug all Bitgener modules that could use the debugger plus other modules used in your project if they use an equivalent debugger.

## Errors

### Object structure

Errors emitted by Bitgener inherit the native Error prototype.

```javascript
{
  name,
  code,
  message,
  stack,
  toString(),
}
```

### Codes

<table style="text-align: center; vertical-align: center">
  <tr>
    <th style="text-align: center;">name</th>
    <th style="text-align: center;">code</th>
    <th style="text-align: center;">description</th>
    <th style="text-align: center;">module</th>
  </tr>

  <tr>
    <td rowspan="4"><i>DataError</i></td>
  </tr>

  <tr>
    <td>MISSING_DATA</td>
    <td>The data to encode is missing.</td>
    <td>lib/index</td>
  </tr>

  <tr>
    <td>EMPTY_DATA</td>
    <td>The data to encode is empty.</td>
    <td>lib/index</td>
  </tr>

  <tr>
    <td>INVALID_DATA</td>
    <td>The data to encode doesn't require the prerequisites.</td>
    <td>lib/index<br />lib/Barcode/</td>
  </tr>

  <tr>
    <td rowspan="3"><i>BarcodeTypeError</i></td>
  </tr>

  <tr>
    <td>MISSING_BARCODE_TYPE</td>
    <td>The symbology supported is missing.</td>
    <td>lib/index</td>
  </tr>

  <tr>
    <td>INVALID_BARCODE_TYPE</td>
    <td>The symbology is not one of those supported.</td>
    <td>lib/index</td>
  </tr>

  <tr>
    <td rowspan="2"><i>OutputError</i></td>
  </tr>

  <tr>
    <td>INVALID_OUTPUT</td>
    <td>The output is not one of those supported. If the ouput is a path to a file make sure that the path is valid.</td>
    <td>lib/helpers/output</td>
  </tr>

  <tr>
    <td rowspan="2"><i>BarcodeError</i></td>
  </tr>

  <tr>
    <td>NO_DIGIT</td>
    <td>The barcode generator returned no digit and cannot generate svg tags.</td>
    <td>lib/Barcode/index</td>
  </tr>

  <tr>
    <td rowspan="2"><i>ReadableStreamError</i></td>
  </tr>

  <tr>
    <td>READABLE_INTERNAL</td>
    <td>Internal failure or invalid chunk of data pushed on readable stream.</td>
    <td>lib/helpers/output</td>
  </tr>

  <tr>
    <td rowspan="2"><i>WritableStreamError</i></td>
  </tr>

  <tr>
    <td>WRITABLE_INTERNAL</td>
    <td>Internal failure writing or piping data on writable stream.</td>
    <td>lib/helpers/output</td>
  </tr>
</table>

# Development

All contributions are greatly welcomed :)

Please follow Git flow, ES6/7, ESLint Airbnb base rules.

See [TODO](TODO.md "TODO") file.

# Licence

*Bitgener* is released under the MIT license.

Copyright (C) 2020 Adrien Valcke

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
