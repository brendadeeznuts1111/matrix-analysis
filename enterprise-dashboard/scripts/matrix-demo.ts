#!/usr/bin/env bun
// scripts/matrix-demo.ts
// 50-column matrix demo using Bun.inspect.table()

// Generate 50 column names
const columns = Array.from({ length: 50 }, (_, i) => "C" + (i + 1));

// Create 5 rows of data
const data = Array.from({ length: 5 }, (_, row) => {
  const obj: Record<string, number> = {};
  columns.forEach((col, i) => {
    obj[col] = (row + 1) * 100 + i + 1;
  });
  return obj;
});

console.log("50-Column Matrix:\n");
console.log(Bun.inspect.table(data, undefined, { colors: true }));
