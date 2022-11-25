// cast to primitive integer if possible or returns undefined
const integer = function integer(thing) {
    // first cast to number to avoid some inconsistencies with hexa
    const castNum = number(thing);
    let castInt;
  
    if (castNum !== undefined) {
      const int = parseInt(castNum, 10);
  
      if (!Number.isNaN(int)) {
        castInt = int;
      }
    }
  
    return castInt;
  };
  
  // cast to primitive integer, with 'less or equal than'
  // or 'greater or equal than' options, or returns undefined
  const int = function int(thing, { le, ge } = {}) {
    let castInt = integer(thing);
  
    if (castInt !== undefined) {
      const lessThan = integer(le);
      const greaterThan = integer(ge);
  
      if (lessThan !== undefined && greaterThan !== undefined) {
        if (castInt < greaterThan || castInt > lessThan) {
          castInt = undefined;
        }
      } else if (lessThan !== undefined && castInt > lessThan) {
        castInt = undefined;
      } else if (greaterThan !== undefined && castInt < greaterThan) {
        castInt = undefined;
      }
    }
  
    return castInt;
  };
  // cast to primitive number if possible or returns undefined
  // because Number(null) returns 0 and Number(undefined|NaN) returns NaN!
  // only finite values
  // beware to call Number.isFinite only on number values!
  const number = function number(thing) {
    let castNum;
  
    if (exists(thing)) {
      const value = thing.valueOf();
  
      if (is(Number, value)) {
        if (Number.isFinite(value)) {
          castNum = value;
        }
      } else if (is(String, value) || is(Boolean, value)) {
        const cast = Number(value);
  
        if (Number.isFinite(cast)) {
          castNum = cast;
        }
      }
    }
  
    return castNum;
  };
  
  // cast to primitive number, with 'less or equal than'
  // or 'greater or equal than' options, or returns undefined
  const num = function num(thing, { ge, le } = {}) {
    let castNum = number(thing);
  
    if (castNum !== undefined) {
      const lessThan = number(le);
      const greaterThan = number(ge);
  
      if (lessThan !== undefined && greaterThan !== undefined) {
        if (castNum < greaterThan || castNum > lessThan) {
          castNum = undefined;
        }
      } else if (lessThan !== undefined && castNum > lessThan) {
        castNum = undefined;
      } else if (greaterThan !== undefined && castNum < greaterThan) {
        castNum = undefined;
      }
    }
  
    return castNum;
  };
  
  // check for hexadecimal color string
  const isColor = function isColor(color) {
    if (is(String, color)) {
      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        return true;
      }
    }
  
    return false;
  };
  
  // does the variable exist
  const exists = function exists(thing) {
    return !(thing === undefined || thing === null || Number.isNaN(thing));
  };
  
  // is the variable of a certain type
  const is = function is(Type, thing) {
    return exists(Type)
    && exists(thing)
    && (thing.constructor === Type
    || thing instanceof Type);
  };