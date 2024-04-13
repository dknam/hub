export class StringBuilder {
    private arr: string[] = [''];
    private currentIndex: number = 0;

    private init() {
        this.arr = [''];
        this.currentIndex = 0;
    }

    public append(input: string | undefined) {
        if (input) {
            this.arr[this.currentIndex] += input;
        }
    }
    public appendLine(input: string | undefined) {
        if (input) {
            this.arr.push(input);
            this.currentIndex++;
        }
    }
    public toString() {
        return this.arr.join('\n');
    }
    public release() {
        const result = this.toString();
        this.init();
        return result;
    }
}
