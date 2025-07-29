// https://www.npmjs.com/package/closest-match?activeTab=code

export function distance(a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  if (a.length > b.length) {
    let temp = a;
    a = b;
    b = temp;
  }

  let row = [];
  for (let i = 0; i <= a.length; ++i) {
    row.push(i);
  }

  for (let i = 1; i <= b.length; ++i) {
    let prev = i;
    for (let j = 1; j <= a.length; ++j) {
      let val = 0;
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        val = row[j - 1];
      } else {
        // Min between shift left, fix, and shift right.
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }

  return row[a.length];
}

export function closestMatch<T>(
  target: string,
  array: T[],
  transformer: (o: T) => string
) {
  if (array.length === 0) return [];

  const vars = array.map((s) => distance(target, transformer(s)));
  const min = Math.min(...vars);
  const found: T[] = [];
  console.log("Target: ", target);
  for (let i = 0; i < vars.length; ++i) {
    if (vars[i] === min) {
      console.log("Distance %s: %d", transformer(array[i]), vars[i]);
      found.push(array[i]);
    }
  }
  return found;
}
