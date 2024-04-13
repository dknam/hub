import { StringBuilder } from './stringBuilder';

export class StringTokenizer {
    public static EOF: string = '65535';
    private input: string;
    private currentIndex: number = 0;
    private position: number = 0;
    private line: number = 1;
    private startLine: number = 1;

    constructor(input: string) {
        this.input = input;
    }

    public peek() {
        return this.input.at(this.currentIndex);
    }

    public pop(): string | undefined {
        const c1 = this.input.at(this.currentIndex++);
        this.position++;
        if (c1 === '\n') {
            this.line++;
            this.position = 0;
        }
        return c1;
    }

    public eat(token: string) {
        const current = this.peek();
        if (current && token === current) {
            this.pop();
            return true;
        }
        return false;
    }

    public takeUntilToString(predicate: (ch: string) => boolean, blockSelector?: (ch: string) => string) {
        const sb = new StringBuilder();
        this.takeUntil(sb, predicate, blockSelector);
        return sb.release();
    }
    public takeUntil(sb: StringBuilder, predicate: (ch: string) => boolean, blockSelector?: (ch: string) => string) {
        let c1: string | undefined, c2: string;

        while ((c1 = this.pop())) {
            if (predicate(c1)) {
                return c1;
            }

            if (c1 === '\\') {
                sb.append(c1);
                sb.append(this.pop());
            } else if (c1 === '"') {
                this.readQuotation(sb, c1, true, false);
            } else if (blockSelector) {
                c2 = blockSelector(c1);
                if (c1 !== c2) {
                    this.readBlock(sb, c1, c2, true, false);
                } else {
                    sb.append(c1);
                }
            } else {
                sb.append(c1);
            }
        }
        return;
    }
    public takeWhileToString(predicate: (ch: string) => boolean, blockSelector?: (ch: string) => string) {
        const sb = new StringBuilder();
        this.takeWhile(sb, predicate, blockSelector);
        return sb.release();
    }
    public takeWhile(sb: StringBuilder, predicate: (ch: string) => boolean, blockSelector?: (ch: string) => string) {
        let c1: string | undefined, c2: string;

        while ((c1 = this.peek())) {
            if (!predicate(c1)) {
                break;
            }
            this.pop();

            if (c1 === '\\') {
                sb.append(c1);
                sb.append(this.pop());
            } else if (c1 === '"') {
                this.readQuotation(sb, c1, true, false);
            } else if (blockSelector) {
                c2 = blockSelector(c1);
                if (c1 !== c2) {
                    this.readBlock(sb, c1, c2, true, false);
                } else {
                    sb.append(c1);
                }
            } else {
                sb.append(c1);
            }
        }
    }
    public eatUntil(tokenOrPredicate: string | ((ch: string) => boolean)) {
        let c1: string | undefined;
        let predicate: (ch: string) => boolean;

        if (typeof tokenOrPredicate === 'string') {
            predicate = (ch) => tokenOrPredicate === ch;
        } else {
            predicate = tokenOrPredicate;
        }

        while ((c1 = this.pop())) {
            if (predicate(c1)) {
                break;
            }

            if (c1 === '\\') {
                this.pop();
            } else if (c1 === '"') {
            }
        }
        return this;
    }
    public readQuotation(sb: StringBuilder, ch: string, bAppend: boolean = true, bEatBegin: boolean = true) {
        let c1: string | undefined;

        if (bAppend) {
            sb.append(ch);
        }

        if (bEatBegin) {
            this.eat(ch);
        }

        while ((c1 = this.pop())) {
            if (c1 === ch) {
                if (bAppend) {
                    sb.append(c1);
                }
                break;
            } else {
                sb.append(c1);

                if (c1 === '\\') {
                    sb.append(this.pop());
                }
            }
        }
        return c1;
    }
    public readBlock(sb: StringBuilder, begin: string, end: string, bAppend: boolean, bEatBegin: boolean) {
        let c1: string | undefined;
        let nDepth = 1;

        this.startLine = this.line;
        if (bAppend) {
            sb.append(begin);
        }

        if (bEatBegin) {
            this.eat(begin);
        }

        while ((c1 = this.pop())) {
            if (c1 === '\\') {
                sb.append(c1);
                sb.append(this.pop());
            } else if (c1 === '"') {
                this.readQuotation(sb, c1, true, false);
            } else {
                if (c1 === begin) {
                    nDepth++;
                } else if (c1 === end) {
                    if (--nDepth <= 0) {
                        if (bAppend) {
                            sb.append(end);
                        }
                        break;
                    }
                }
                sb.append(c1);
            }
        }

        if (nDepth > 0) {
            throw Error(`Invalid block format: cannot find end of block.
            FormatException: StringTokenizer.ReadBlock()
            line ${this.startLine}: ${begin}..${end}`);
        }
        return nDepth;
    }
}

export const defaultBlockSelector = (ch: string) => {
    switch (ch) {
        case '(':
            return ')';
        case '{':
            return '}';
        case '[':
            return ']';
    }
    return ch;
};

export const simpleBlockSelector = (ch: string) => {
    if (ch === '(') {
        return ')';
    }
    return ch;
};
