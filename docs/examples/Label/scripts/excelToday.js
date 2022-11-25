function excelToday() {
    /**
     * while (new Date()).getTime() and Date.UTC() reference 01/12/1969
     * Date().now() does reference 01/01/1970
     */
    let excelJSOffset = 25569; // offset in days between excels 00/01/1900 and JS 01/01/1970
    let dNow = new Date(Date.now());
    let dNowOffset = dNow.getTimezoneOffset() * (60 * 1000);
    let dNumNow = millisToDays(dNow.getTime() + dNowOffset);
    return excelJSOffset + dNumNow;
}
function millisToDays(ms) {
    return Math.floor(ms / (1000 * 3600 * 24));
}
//# sourceMappingURL=excelToday.js.map