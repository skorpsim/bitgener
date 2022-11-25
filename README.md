<p align="center">
  <img src="docs/bitgener.png" alt="Bitgener"/>
<p>

<p align="center">
  A lightweight and zero-dependencies pure js DataMatrix code generator.
<p>

# Technical information

- Language: JavaScript ES6/ES7

# Supported symbologies

Two dimensions:
- DataMatrix (ECC 200 standard, square and rectangular)

# License

[MIT](LICENSE.md).


# Presentation

FORKED FROM
*Bitgener* is a barcode generator written in pure Node.js using ES6 and ES7 features. It is based on the great work made by Jean-Baptiste Demonte and contributors: [barcode](https://github.com/jbdemonte/barcode).

Despite the fact that [bwipjs](https://github.com/metafloor/bwip-js) can generate a lot of barcodes and other libraries exist, I personally needed to generate the same ECC 200 compliant Datamatrixes from the *barcode* library and it was not possible by any of these libraries. Plus I had some issues with architecture-dependent image processor libraries used by other modules.

*Bitgener* generates barcodes in pure SVG (Scalable Vector Graphics) format. The barcode generated can be a buffer, a readable stream, a string representing SVG tags content or a file. It adds features like background and bars opacity, fixing final image width and height, keeping the original 1D/2D size, adding paddings and a generic font family for hri, adding stream, buffer and file outputs with a specific encoding.

SVGs generated by *Bitgener* uses crisp edges shape rendering to tell the user agent to turn off anti-aliasing to preserved the contrast, colors and edges without any smoothing or blurring that applies to images scaled up or down. Browsers support is nice and can be found here: https://caniuse.com/#feat=css-crisp-edges.

The aim of this project is to provide a simple, lightweight, zero-dependencies and fast barcode generator and let user choose the external or native image processing library to transform the SVG generated into the specific format if needed.

# Bitgener Online Demo

[Show me!](https://bitgener.herokuapp.com/)