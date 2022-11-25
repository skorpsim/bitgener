/**
 * DataMatrix ECC 200 standard implementation.
 *
 */


// multiplication in galois field gf(2^8)
const champGaloisMult = function champGaloisMult(a, b) {
  if (a === 0 || b === 0) {
    return 0;
  }

  return aLogTab[(logTab[a] + logTab[b]) % 255];
};

// the operation a * 2^b in galois field gf(2^8)
const champGaloisDoub = function champGaloisDoub(a, b) {
  if (a === 0) {
    return 0;
  }

  if (b === 0) {
    return a;
  }

  return aLogTab[(logTab[a] + b) % 255];
};

// sum in galois field gf(2^8)
const champGaloisSum = function champGaloisSum(a, b) {
  return a ^ b;
};

// choose the good index for tables
const selectIndex = function selectIndex(nbDataCodeWords, rectangular) {
  if ((nbDataCodeWords < 1 || nbDataCodeWords > 1558) && !rectangular) {
    return -1;
  }

  if ((nbDataCodeWords < 1 || nbDataCodeWords > 49) && rectangular) {
    return -1;
  }

  let n = 0;

  if (rectangular) {
    n = 24;
  }

  while (dataCWCount[n] < nbDataCodeWords) {
    n += 1;
  }

  return n;
};

const encodeDataCodeWordsASCII = function encodeDataCodeWordsASCII(text) {
  const dataCodeWords = [];
  const textLength = text.length;

  for (let i = 0, n = 0; i < textLength; i += 1) {
    let c = text.charCodeAt(i);

    if (c > 127) {
      dataCodeWords[n] = 235;
      c -= 127;
      n += 1;
    } else if ((c >= 48 && c <= 57)
      && i + 1 < textLength
      && (text.charCodeAt(i + 1) >= 48 && text.charCodeAt(i + 1) <= 57)) {
      c = ((c - 48) * 10) + ((text.charCodeAt(i + 1)) - 48);
      c += 130;
      i += 1;
    } else {
      c += 1;
    }

    dataCodeWords[n] = c;
    n += 1;
  }

  return dataCodeWords;
};

// transform integer to tab of bits
const getBits = function getBits(int) {
  const bits = [];

  for (let i = 0; i < 8; i += 1) {
    bits[i] = int & (128 >> i) ? 1 : 0;
  }

  return bits;
};


/* eslint max-len: "off" */
class DataMatrix {
  constructor(data, isRectangular) {
    // NOTE: data and isRectangular values have been checked in Barcode/index.js entry point
    this.dataCodeWords = encodeDataCodeWordsASCII(data);

    this.nbDataCodeWords = this.dataCodeWords.length;

    // select the index for the data tables
    const index = selectIndex(this.nbDataCodeWords, isRectangular);

    // number of data cw
    this.nbTotalDataCodeWords = dataCWCount[index];

    // number of reed solomon cw
    const nbSolomonCW = solomonCWCount[index];

    // number of cw
    this.totalCWCount = this.nbTotalDataCodeWords + nbSolomonCW;

    // size of symbol
    const rowsTotal = lengthRows[index];
    const colsTotal = lengthCols[index];

    // number of region
    this.rowsRegion = regionRows[index];
    this.colsRegion = regionCols[index];
    this.rowsRegionCW = dataRegionRows[index];
    this.colsRegionCW = dataRegionCols[index];

    // size of matrice data
    this.rowsLengthMatrice = rowsTotal - 2 * this.rowsRegion;
    this.colsLengthMatrice = colsTotal - 2 * this.colsRegion;

    // number of reed solomon blocks
    this.nbBlocks = interleavedBlocks[index];
    this.nbErrorBlocks = (nbSolomonCW / this.nbBlocks);

    // add codewords pads
    this.addCodeWordsPad();

    // calculate the reed solomon factors
    this.genSolomonFactorsTable();

    // add reed solomon codewords
    this.addReedSolomonToCodeWords();

    // generate bits from codewords
    this.genCodeWordsBits();

    // generate a base DataMatrix by putting the codewords into the matrix
    this.genDataMatrixBase();

    // generate the final DataMatrix by adding the finder pattern based on DataMatrixBase
    this.genDataMatrix();

    // free useless properties to be handled by garbage collector
    this.dataCodeWords = undefined;
    this.nbDataCodeWords = undefined;
    this.nbTotalDataCodeWords = undefined;
    this.totalCWCount = undefined;
    this.rowsRegion = undefined;
    this.colsRegion = undefined;
    this.rowsRegionCW = undefined;
    this.colsRegionCW = undefined;
    this.rowsLengthMatrice = undefined;
    this.colsLengthMatrice = undefined;
    this.nbBlocks = undefined;
    this.nbErrorBlocks = undefined;
    this.solomonFactorsTable = undefined;
    this.codeWordsBits = undefined;
    this.DataMatrixBase = undefined;
    this.assigned = undefined;
  }

  addCodeWordsPad() {
    if (this.nbDataCodeWords < this.nbTotalDataCodeWords) {
      this.dataCodeWords[this.nbDataCodeWords] = 129;

      for (let i = this.nbDataCodeWords + 1; i < this.nbTotalDataCodeWords; i += 1) {
        const r = ((149 * (i + 1)) % 253) + 1;
        this.dataCodeWords[i] = (129 + r) % 254;
      }
    }
  }

  genSolomonFactorsTable() {
    this.solomonFactorsTable = [];

    for (let i = 0; i <= this.nbErrorBlocks; i += 1) {
      this.solomonFactorsTable[i] = 1;
    }

    for (let i = 1; i <= this.nbErrorBlocks; i += 1) {
      for (let j = i - 1; j >= 0; j -= 1) {
        this.solomonFactorsTable[j] = champGaloisDoub(this.solomonFactorsTable[j], i);

        if (j > 0) {
          this.solomonFactorsTable[j] = champGaloisSum(this.solomonFactorsTable[j], this.solomonFactorsTable[j - 1]);
        }
      }
    }
  }

  addReedSolomonToCodeWords() {
    const correctionCW = [];

    for (let k = 0; k < this.nbBlocks; k += 1) {
      for (let i = 0; i < this.nbErrorBlocks; i += 1) {
        correctionCW[i] = 0;
      }

      for (let i = k; i < this.nbTotalDataCodeWords; i += this.nbBlocks) {
        const galoisFieldSum = champGaloisSum(this.dataCodeWords[i], correctionCW[this.nbErrorBlocks - 1]);

        for (let j = this.nbErrorBlocks - 1; j >= 0; j -= 1) {
          if (galoisFieldSum === 0) {
            correctionCW[j] = 0;
          } else {
            correctionCW[j] = champGaloisMult(galoisFieldSum, this.solomonFactorsTable[j]);
          }

          if (j > 0) {
            correctionCW[j] = champGaloisSum(correctionCW[j - 1], correctionCW[j]);
          }
        }
      }

      // reverse blocks
      for (let i = this.nbErrorBlocks - 1, j = this.nbTotalDataCodeWords + k; i >= 0; i -= 1, j += this.nbBlocks) {
        this.dataCodeWords[j] = correctionCW[i];
      }
    }
  }

  genCodeWordsBits() {
    this.codeWordsBits = [];

    for (let i = 0; i < this.totalCWCount; i += 1) {
      this.codeWordsBits[i] = getBits(this.dataCodeWords[i]);
    }
  }

  genDataMatrixBase() {
    // init the matrix
    this.DataMatrixBase = [];
    this.assigned = [];

    for (let i = 0; i < this.colsLengthMatrice; i += 1) {
      this.DataMatrixBase[i] = [];
      this.assigned[i] = [];
    }

    // add the bottom-right corner if needed
    if (((this.rowsLengthMatrice * this.colsLengthMatrice) % 8) === 4) {
      this.DataMatrixBase[this.rowsLengthMatrice - 2][this.colsLengthMatrice - 2] = 1;
      this.DataMatrixBase[this.rowsLengthMatrice - 1][this.colsLengthMatrice - 1] = 1;
      this.DataMatrixBase[this.rowsLengthMatrice - 1][this.colsLengthMatrice - 2] = 0;
      this.DataMatrixBase[this.rowsLengthMatrice - 2][this.colsLengthMatrice - 1] = 0;
      this.assigned[this.rowsLengthMatrice - 2][this.colsLengthMatrice - 2] = 1;
      this.assigned[this.rowsLengthMatrice - 1][this.colsLengthMatrice - 1] = 1;
      this.assigned[this.rowsLengthMatrice - 1][this.colsLengthMatrice - 2] = 1;
      this.assigned[this.rowsLengthMatrice - 2][this.colsLengthMatrice - 1] = 1;
    }

    // place of the 8th bit from the first character to [4][0]
    const etape = 0;
    let chr = 0;
    let row = 4;
    let col = 0;

    do {
      // check for a special case of corner
      if (row === this.rowsLengthMatrice && col === 0) {
        this.putBitsSpecialPattern1(this.codeWordsBits[chr]);
        chr += 1;
      } else if (etape < 3 && (row === this.rowsLengthMatrice - 2) && col === 0 && (this.colsLengthMatrice % 4 !== 0)) {
        this.putBitsSpecialPattern2(this.codeWordsBits[chr]);
        chr += 1;
      } else if ((row === this.rowsLengthMatrice - 2) && col === 0 && (this.colsLengthMatrice % 8 === 4)) {
        this.putBitsSpecialPattern3(this.codeWordsBits[chr]);
        chr += 1;
      } else if ((row === this.rowsLengthMatrice + 4) && col === 2 && (this.colsLengthMatrice % 8 === 0)) {
        this.putBitsSpecialPattern4(this.codeWordsBits[chr]);
        chr += 1;
      }

      // go up and right in the DataMatrix
      do {
        if (row < this.rowsLengthMatrice && col >= 0 && this.assigned[row][col] !== 1) {
          this.putBitsStandardPattern(this.codeWordsBits[chr], row, col);
          chr += 1;
        }

        row -= 2;
        col += 2;
      } while (row >= 0 && col < this.colsLengthMatrice);

      row += 1;
      col += 3;

      // go down and left in the DataMatrix
      do {
        if (row >= 0 && col < this.colsLengthMatrice && this.assigned[row][col] !== 1) {
          this.putBitsStandardPattern(this.codeWordsBits[chr], row, col);
          chr += 1;
        }

        row += 2;
        col -= 2;
      } while (row < this.rowsLengthMatrice && col >= 0);

      row += 3;
      col += 1;
    } while (row < this.rowsLengthMatrice || col < this.colsLengthMatrice);
  }

  // put a bit into the base matrix
  // NOTE: row and col must be integer values set in genDataMatrixBase function
  putBitInDataMatrixBase(bit, row, col) {
    let r = row.valueOf();
    let c = col.valueOf();

    if (r < 0) {
      r += this.rowsLengthMatrice;
      c += 4 - ((this.rowsLengthMatrice + 4) % 8);
    }

    if (c < 0) {
      c += this.colsLengthMatrice;
      r += 4 - ((this.colsLengthMatrice + 4) % 8);
    }

    if (this.assigned[r][c] !== 1) {
      this.DataMatrixBase[r][c] = bit;
      this.assigned[r][c] = 1;
    }
  }

  // place bits into the base matrix (standard or special case)
  putBitsStandardPattern(bits, row, col) {
    this.putBitInDataMatrixBase(bits[0], row - 2, col - 2);
    this.putBitInDataMatrixBase(bits[1], row - 2, col - 1);
    this.putBitInDataMatrixBase(bits[2], row - 1, col - 2);
    this.putBitInDataMatrixBase(bits[3], row - 1, col - 1);
    this.putBitInDataMatrixBase(bits[4], row - 1, col);
    this.putBitInDataMatrixBase(bits[5], row, col - 2);
    this.putBitInDataMatrixBase(bits[6], row, col - 1);
    this.putBitInDataMatrixBase(bits[7], row, col);
  }

  putBitsSpecialPattern1(bits) {
    this.putBitInDataMatrixBase(bits[0], this.rowsLengthMatrice - 1, 0);
    this.putBitInDataMatrixBase(bits[1], this.rowsLengthMatrice - 1, 1);
    this.putBitInDataMatrixBase(bits[2], this.rowsLengthMatrice - 1, 2);
    this.putBitInDataMatrixBase(bits[3], 0, this.colsLengthMatrice - 2);
    this.putBitInDataMatrixBase(bits[4], 0, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[5], 1, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[6], 2, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[7], 3, this.colsLengthMatrice - 1);
  }

  putBitsSpecialPattern2(bits) {
    this.putBitInDataMatrixBase(bits[0], this.rowsLengthMatrice - 3, 0);
    this.putBitInDataMatrixBase(bits[1], this.rowsLengthMatrice - 2, 0);
    this.putBitInDataMatrixBase(bits[2], this.rowsLengthMatrice - 1, 0);
    this.putBitInDataMatrixBase(bits[3], 0, this.colsLengthMatrice - 4);
    this.putBitInDataMatrixBase(bits[4], 0, this.colsLengthMatrice - 3);
    this.putBitInDataMatrixBase(bits[5], 0, this.colsLengthMatrice - 2);
    this.putBitInDataMatrixBase(bits[6], 0, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[7], 1, this.colsLengthMatrice - 1);
  }

  putBitsSpecialPattern3(bits) {
    this.putBitInDataMatrixBase(bits[0], this.rowsLengthMatrice - 3, 0);
    this.putBitInDataMatrixBase(bits[1], this.rowsLengthMatrice - 2, 0);
    this.putBitInDataMatrixBase(bits[2], this.rowsLengthMatrice - 1, 0);
    this.putBitInDataMatrixBase(bits[3], 0, this.colsLengthMatrice - 2);
    this.putBitInDataMatrixBase(bits[4], 0, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[5], 1, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[6], 2, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[7], 3, this.colsLengthMatrice - 1);
  }

  putBitsSpecialPattern4(bits) {
    this.putBitInDataMatrixBase(bits[0], this.rowsLengthMatrice - 1, 0);
    this.putBitInDataMatrixBase(bits[1], this.rowsLengthMatrice - 1, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[2], 0, this.colsLengthMatrice - 3);
    this.putBitInDataMatrixBase(bits[3], 0, this.colsLengthMatrice - 2);
    this.putBitInDataMatrixBase(bits[4], 0, this.colsLengthMatrice - 1);
    this.putBitInDataMatrixBase(bits[5], 1, this.colsLengthMatrice - 3);
    this.putBitInDataMatrixBase(bits[6], 1, this.colsLengthMatrice - 2);
    this.putBitInDataMatrixBase(bits[7], 1, this.colsLengthMatrice - 1);
  }

  genDataMatrix() {
    const totalRowsCW = (this.rowsRegionCW + 2) * this.rowsRegion;
    const totalColsCW = (this.colsRegionCW + 2) * this.colsRegion;

    this.DataMatrix = [];
    this.DataMatrix[0] = [];

    for (let j = 0; j < totalColsCW + 2; j += 1) {
      this.DataMatrix[0][j] = 0;
    }

    for (let i = 0; i < totalRowsCW; i += 1) {
      this.DataMatrix[i + 1] = [];
      this.DataMatrix[i + 1][0] = 0;
      this.DataMatrix[i + 1][totalColsCW + 1] = 0;

      for (let j = 0; j < totalColsCW; j += 1) {
        if (i % (this.rowsRegionCW + 2) === 0) {
          if (j % 2 === 0) {
            this.DataMatrix[i + 1][j + 1] = 1;
          } else {
            this.DataMatrix[i + 1][j + 1] = 0;
          }
        } else if (i % (this.rowsRegionCW + 2) === this.rowsRegionCW + 1) {
          this.DataMatrix[i + 1][j + 1] = 1;
        } else if (j % (this.colsRegionCW + 2) === this.colsRegionCW + 1) {
          if (i % 2 === 0) {
            this.DataMatrix[i + 1][j + 1] = 0;
          } else {
            this.DataMatrix[i + 1][j + 1] = 1;
          }
        } else if (j % (this.colsRegionCW + 2) === 0) {
          this.DataMatrix[i + 1][j + 1] = 1;
        } else {
          this.DataMatrix[i + 1][j + 1] = 0;
          this.DataMatrix[i + 1][j + 1] = this.DataMatrixBase[i - 1 - (2 * (int(i / (this.rowsRegionCW + 2))))][j - 1 - (2 * (int(j / (this.colsRegionCW + 2))))];
        }
      }
    }

    this.DataMatrix[totalRowsCW + 1] = [];

    for (let j = 0; j < totalColsCW + 2; j += 1) {
      this.DataMatrix[totalRowsCW + 1][j] = 0;
    }
  }

  getDataMatrix() {
    return this.DataMatrix;
  }
}





// generate digit for DataMatrix barcode type
const generateDMC = function generateDMC({
  data,
  settings: {
    rectangular,
  } = {},
} = {}) {

  let digit = new DataMatrix(data, rectangular).getDataMatrix();


  // if no digit generated throw error
  if (digit.length === 0) {
    throw new  Error("NO_DIGIT");
  }

  return { digit };
};

// check padding to not exceed total height or width
const checkPadding = function checkPadding({
  paddingWidth: padWidth,
  paddingHeight: padHeight,
  width,
  height,
} = {}) {

  const defaultPadding = 0;

  let paddingWidth = padWidth;
  let paddingHeight = padHeight;

  if (padHeight >= height / 2) {
    paddingWidth = defaultPadding * 2;
    paddingHeight = paddingWidth;
  } else if (padWidth >= width / 2) {
    paddingWidth = defaultPadding * 2;
    paddingHeight = paddingWidth;
  }

  return {
    paddingWidth,
    paddingHeight,
  };
};

// generate svg
const digitToSvg = function digitToSvg({
  digit,
  settings,
} = {}) {
  const digitToConvert = digit.slice(0);
  const lines = digitToConvert.length;
  const columns = digitToConvert[0].length;
  
  let width;
  let height;
  let codeWidth;
  let codeHeight;
  let moduleWidth;
  let moduleHeight;

  let residualSize = 0;

  // init paddings
  let paddingWidth = settings.padding * 2;
  let paddingHeight = paddingWidth;

  // DataMatrix
  // rectangular
  if (settings.rectangular) {
    // original size is based on settings width
    if (settings.original2DSize) {
      ({ width } = settings);

      codeWidth = width - paddingWidth;
      let moduleSize = codeWidth / columns;

      residualSize = moduleSize - floor(moduleSize);

      moduleSize -= residualSize;
      moduleWidth = moduleSize;
      moduleHeight = moduleSize;

      codeWidth -= residualSize * columns;
      paddingWidth = width - codeWidth;
      codeHeight = moduleSize * lines;

      height = codeHeight + paddingHeight;
    } else {
      // keep width and height defined in settings
      ({ width, height } = settings);

      ({
        paddingWidth,
        paddingHeight,
      } = checkPadding({
        paddingWidth,
        paddingHeight,
        width,
        height,
      }));

      codeWidth = width - paddingWidth;

      let moduleSize = codeWidth / columns;

      residualSize = moduleSize - floor(moduleSize);

      moduleSize -= residualSize;
      moduleWidth = moduleSize;
      moduleHeight = moduleSize;

      codeWidth -= residualSize * columns;
      codeHeight = moduleSize * lines;

      paddingWidth = width - codeWidth;
      paddingHeight = height - codeHeight;
    }
  } else {
    // square
    width = min(settings.width, settings.height);
    height = width;

    ({
      paddingWidth,
      paddingHeight,
    } = checkPadding({
      paddingWidth,
      paddingHeight,
      width,
      height,
    }));

    codeWidth = width - paddingWidth;
    codeHeight = height - paddingHeight;
  
    // calc residual size for 2D codes or it causes white spaces between blocks
    let moduleSize = min(codeWidth / columns, codeHeight / lines);

    residualSize = moduleSize - floor(moduleSize);

    moduleSize -= residualSize;
    moduleWidth = moduleSize;
    moduleHeight = moduleSize;

    codeWidth -= residualSize * columns;
    codeHeight -= residualSize * lines;

    paddingWidth = width - codeWidth;
    paddingHeight = height - codeHeight;
  }
  
  // svg header
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}" shape-rendering="crispEdges">`;

  // background
  svg += `<rect width="${width}" height="${height}" x="0" y="0" fill="${settings.bgColor}" opacity="${settings.bgOpacity}" />`;

  // center the code depending on padding width and padding height
  svg += `<g transform="translate(${floor(paddingWidth / 2)} ${floor(paddingHeight / 2)})">`;

  const bar = `<rect width="&W" height="${moduleHeight}" x="&X" y="&Y" fill="${settings.color}" opacity="${settings.opacity}"  />`;

  for (let y = 0, len = 0; y < lines; y += 1) {
    let currentDigit = digitToConvert[y][0];

    for (let x = 0; x < columns; x += 1) {
      if (currentDigit === digitToConvert[y][x]) {
        len += 1;
      } else {
        if (int(currentDigit) === 1) {
          svg += bar.replace('&W', len * moduleWidth).replace('&X', (x - len) * moduleWidth).replace('&Y', y * moduleHeight);
        }

        currentDigit = digitToConvert[y][x];
        len = 1;
      }
    }

    if (len > 0 && int(currentDigit) === 1) {
      svg += bar.replace('&W', len * moduleWidth).replace('&X', (columns - len) * moduleWidth).replace('&Y', y * moduleHeight);
    }
  }

  // footer
  svg += '</g></svg>';

  return { svg, width, height };
};




 // caching could improve speed
 const { floor, min, max } = Math;
 
 /**
  * @func dataMatrixSVG
  *
  * Encode data into the specificied barcode type.
  * @param  {String} data             data to encode
  *                                   string representing svg element
  * @param  {Boolean} rectangular     rectangular option for DataMatrix
  * @param  {Number} padding          the space in pixels around one side of the
  *                                   barcode that will be applied for its 4 sides
  * @param  {Number} width            the width in pixels to fix for the generated image
  * @param  {Number} height           the height in pixels to fix for the generated image
  * @param  {Boolean} original2DSize  option to keep the original 2D barcode size based on width
  * @param  {String} color            the bars color
  * @param  {Number} opacity          the bars opacity
  * @param  {String} bgColor          the background color
  * @param  {Number} bgOpacity        the background opacity
  */
 const dataMatrixSVG = function dataMatrixSVG({
   data,
   rectangular,
   padding,
   width: w,
   height: h,
   original2DSize,
   color,
   opacity,
   bgColor,
   bgOpacity,
 } = {}) {
   // check data is not missing or empty
   if (!exists(data)) {
     throw new Error("MISSING_DATA");
   } else if (!is(String, data)) {
     throw new Error("INVALID_DATA");
   } else if (data.trim().length === 0) {
     throw new Error("EMPTY_DATA");
   }
  
   let ret;
 

    /**
    * ensure user settings match default settings types and have correct values
    * or keep default values
    */
    const settings = {
      rectangular: false,
      padding: 0,
      width: 150,
      height: 150,
      original2DSize: false,
      color: '#000000',
      opacity: 1,
      bgColor: '#FFFFFF',
      bgOpacity: 1,
    };

    // rectangular
    if (is(Boolean, rectangular)) {
      settings.rectangular = rectangular;
    }

    // padding
    const paddingValue = num(padding, { ge: 0 });

    if (exists(paddingValue)) {
      settings.padding = paddingValue;
    }

    // width
    const widthValue = num(w, { ge: 10 });

    if (exists(widthValue)) {
      settings.width = widthValue;
    }

    // height
    const heightValue = num(h, { ge: 10 });

    if (exists(heightValue)) {
      settings.height = heightValue;
    }

    // original2DSize
    if (is(Boolean, original2DSize)) {
      settings.original2DSize = original2DSize;
    }

    // color
    if (isColor(color)) {
      settings.color = color;
    }

    // opacity
    const opacityValue = num(opacity, { ge: 0, le: 1 });

    if (exists(opacityValue)) {
      settings.opacity = opacityValue;
    }

    // bgColor
    if (isColor(bgColor)) {
      settings.bgColor = bgColor;
    }

    // bgOpacity
    const bgOpacityValue = num(bgOpacity, { ge: 0, le: 1 });

    if (exists(bgOpacityValue)) {
      settings.bgOpacity = bgOpacityValue;
    }


    // generate digit
    const { digit } = generateDMC({ data, settings });

    // get svg string and final width and height from digit then calculate density (for sharp only)
    const { svg, width, height } = digitToSvg({
      digit,
      settings,
    });
    const density = floor((72 * max(width, height)) / min(width, height));

    ret = {
      width,
      height,
      density,
      data,
      svg
    };

   return ret;
 };