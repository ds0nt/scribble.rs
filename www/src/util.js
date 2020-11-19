
export function rgbStr2hex(rgb) {
    if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

// returns an object
export function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
// returns an object
export function hexToRgbStr(hex) {
    let color = hexToRgb(hex)
    return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
}

export function contrastShade(colorObj) {
    const hsp = Math.sqrt(
        0.299 * (colorObj.r * colorObj.r) +
        0.587 * (colorObj.g * colorObj.g) +
        0.114 * (colorObj.b * colorObj.b)
    );

    if (hsp > 127.5) {
        borderColor = "rgb(0,0,0)";
    } else {
        borderColor = "rgb(255,255,255)";
    }
    return borderColor
}