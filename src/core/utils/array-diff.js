export class ArrayDiff {
    constructor(source) {
        this.saved = source;
    }

    setBase(arr) {
        this.saved = arr;
    }

    compare(arr, onNew, onDelete) {
        let saved = this.saved.slice();
        let a = 0, s = 0, gind = 0;
        let testArr = saved.slice(); // performance hit!

        for ( ; a < arr.length && s < saved.length; ) {
            if (arr[a] !== saved[s] ) {
                let ind = saved.indexOf(arr[a]);

                if ( ind === -1 ) {
                    onNew(arr[a], gind);
                    testArr.splice(gind, 0, arr[a]);
                    gind++;
                } else {
                    saved.splice(ind, 1);
                    if ( ind < s ) {
                        s--;
                    }
                }

                a++;
            } else {
                a++;
                s++;
            }
            gind++;
        }
        for(; a < arr.length; a++) {
            gind++;
            onNew(arr[a], gind);
            testArr.splice(gind, 0, arr[a]);
        }
        for(let i = 0; s < saved.length; i++, s++) {
            let ind = testArr.indexOf(saved[s]);
            onDelete(saved[s], ind);
            testArr.splice(ind, 1);
        }
    }
}

window.ArrayDiff = ArrayDiff;

// test case
/*
var from = [1,3,5,7];
var to = [0,1,4,5,6];
var c = new ArrayDiff(from);

var result = from.slice();
c.compare(to, (v, i) => {
    console.log('new', v, i);
    result.splice(i, 0, v);
    console.log(result.join(', '));
}, (v,i) => {
    console.log('del', v, i);
    result.splice(i, 1);
});
console.log(result);
console.log(to);
*/
