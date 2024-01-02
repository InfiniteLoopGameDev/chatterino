import { split_chunks, uint8array_to_bigint } from "./utils";
import type { TypedArray } from "./utils";

export const N = 13505230252136909642484357485922660997703714661558643085625570609005026648618736836130702340065843629405580691114455027019893927926634642153529884002226841727229790564330636423292332332262882840266450188232435927005016785904459664198486890246640937094945202451618472795872027188330092602205275655246943129978779n
const K = 132;

const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n, 73n, 79n, 83n, 89n, 97n, 101n, 103n, 107n, 109n, 113n, 127n, 131n, 137n, 139n, 149n, 151n, 157n, 163n, 167n, 173n, 179n, 181n, 191n, 193n, 197n, 199n, 211n, 223n, 227n, 229n, 233n, 239n, 241n, 251n, 257n, 263n, 269n, 271n, 277n, 281n, 283n, 293n, 307n, 311n, 313n, 317n, 331n, 337n, 347n, 349n, 353n, 359n, 367n, 373n, 379n, 383n, 389n, 397n, 401n, 409n, 419n, 421n, 431n, 433n, 439n, 443n, 449n, 457n, 461n, 463n, 467n, 479n, 487n, 491n, 499n, 503n, 509n, 521n, 523n, 541n, 547n, 557n, 563n, 569n, 571n, 577n, 587n, 593n, 599n, 601n, 607n, 613n, 617n, 619n, 631n, 641n, 643n, 647n, 653n, 659n, 661n, 673n, 677n, 683n, 691n, 701n, 709n, 719n, 727n, 733n, 739n, 743n, 751n, 757n, 761n, 769n, 773n, 787n, 797n, 809n, 811n, 821n, 823n, 827n, 829n, 839n, 853n, 857n, 859n, 863n, 877n, 881n, 883n, 887n, 907n, 911n, 919n, 929n, 937n, 941n, 947n, 953n, 967n, 971n, 977n, 983n, 991n, 997n, 1009n, 1013n, 1019n, 1021n, 1031n, 1033n, 1039n, 1049n, 1051n, 1061n, 1063n, 1069n, 1087n, 1091n, 1093n, 1097n, 1103n, 1109n, 1117n, 1123n, 1129n, 1151n, 1153n, 1163n, 1171n, 1181n, 1187n, 1193n, 1201n, 1213n, 1217n, 1223n, 1229n, 1231n, 1237n, 1249n, 1259n, 1277n, 1279n, 1283n, 1289n, 1291n, 1297n, 1301n, 1303n, 1307n, 1319n, 1321n, 1327n, 1361n, 1367n, 1373n, 1381n, 1399n, 1409n, 1423n, 1427n, 1429n, 1433n, 1439n, 1447n, 1451n, 1453n, 1459n, 1471n, 1481n, 1483n, 1487n, 1489n, 1493n, 1499n, 1511n, 1523n, 1531n, 1543n, 1549n, 1553n, 1559n, 1567n, 1571n, 1579n, 1583n, 1597n, 1601n, 1607n, 1609n, 1613n, 1619n, 1621n, 1627n, 1637n, 1657n, 1663n, 1667n, 1669n, 1693n, 1697n, 1699n, 1709n, 1721n, 1723n, 1733n, 1741n, 1747n, 1753n, 1759n, 1777n, 1783n, 1787n, 1789n, 1801n, 1811n, 1823n, 1831n, 1847n, 1861n, 1867n, 1871n, 1873n, 1877n, 1879n, 1889n, 1901n, 1907n, 1913n, 1931n, 1933n, 1949n, 1951n, 1973n, 1979n, 1987n, 1993n, 1997n, 1999n, 2003n, 2011n, 2017n, 2027n, 2029n, 2039n, 2053n, 2063n, 2069n, 2081n, 2083n, 2087n, 2089n, 2099n, 2111n, 2113n, 2129n, 2131n, 2137n, 2141n, 2143n, 2153n, 2161n, 2179n, 2203n, 2207n, 2213n, 2221n, 2237n, 2239n, 2243n, 2251n, 2267n, 2269n, 2273n, 2281n, 2287n, 2293n, 2297n, 2309n, 2311n, 2333n, 2339n, 2341n, 2347n, 2351n, 2357n, 2371n, 2377n, 2381n, 2383n, 2389n, 2393n, 2399n, 2411n, 2417n, 2423n, 2437n, 2441n, 2447n, 2459n, 2467n, 2473n, 2477n, 2503n, 2521n, 2531n, 2539n, 2543n, 2549n, 2551n]

export function k_calc(n: bigint): number {
    let k = 1;
	let prod = 1n;
	while (prod < n) {
		prod *= primes[k];
		k += 1;
    }
	return k - 1
}

export function hash(message: bigint, k: number, n: bigint): bigint {
    let m = message.toString(2).split("").map(BigInt);
    let l = m.length;
/*     if (l >= (1 << k)) {
        throw new Error("Message is too long, should not exeed length 2^k");
    } */

    let x = 1n;

    let L = Math.ceil(l / k);
    m = m.concat(new Array(L*k - l).fill(0n));

    let length_block = l.toString(2).split("").map(BigInt);
    length_block = new Array(k - length_block.length).fill(0n).concat(length_block);
    m = m.concat(length_block)

    let blocks = split_chunks(m, k)
    blocks.forEach((block) => {
        let indexes = block.flatMap((e, i) => e === 1n ? (k - i) : [])
        let selected_primes = indexes.flatMap((index) => primes[index - 1])
        let product = selected_primes.reduce((a, b) => a*b, 1n)
        x = (x * x) * product;
        x = x % n;
    })

    return x;
}

export function hash_uint_array<T extends TypedArray>(message: T) {
    let uint8 = new Uint8Array(message.buffer);
    let int = uint8array_to_bigint(uint8);
    return hash(int, K, N).toString(16);
}

export function hash_string(message: string) {
    let int = uint8array_to_bigint(new TextEncoder().encode(message))
    return hash(int, K, N).toString(16);
}