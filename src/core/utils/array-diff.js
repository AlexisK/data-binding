export class ArrayDiff {
    constructor(source) {
        this.saved = source.slice();
    }

    compare(arr, onNew, onDelete) {
        let saved = this.saved.slice();
        let a = 0, s = 0;

        for ( ; a < arr.length && s < saved.length; ) {
            if (arr[a] !== saved[s] ) {
                let ind = saved.indexOf(arr[a]);

                if ( ind === -1 ) {
                    onNew(arr[a]);
                } else {
                    saved.splice(ind, 1);
                }
                a++;
            } else {
                a++;
                s++;
            }
        }
        for(; a < arr.length; a++) {
            onNew(arr[a]);
        }
        for(; s < saved.length; s++) {
            onDelete(saved[s]);
        }
    }
}

window.ArrayDiff = ArrayDiff;
