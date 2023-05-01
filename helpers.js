function mean(arr) {
    let total = 0;
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        total += arr[i];
    }
    return total / n;
}

function sd(arr, population = true) {
    let total = 0;
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        total += arr[i];
    }
    let mean = total / n;

    let ss = 0;

    for (let i = 0; i < arr.length; i++) {
        ss += Math.pow(arr[i] - mean, 2);
    }

    let denominator = arr.length;

    if (!population) { denominator--; }

    return Math.sqrt(ss / denominator);
}
