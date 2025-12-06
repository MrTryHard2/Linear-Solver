document.getElementById("clear").onclick = clearAll;

function clearAll() {
  matrixContainer.innerHTML = "";
  stepsDiv.innerHTML = "";
  resultDiv.innerHTML = "";
}

const matrixContainer = document.getElementById("matrix-container");
const stepsDiv = document.getElementById("steps");
const resultDiv = document.getElementById("result");

document.getElementById("generate").onclick = generateMatrix;
document.getElementById("solve").onclick = solve;
document.getElementById("sample").onclick = loadSample;

function generateMatrix() {
  matrixContainer.innerHTML = "";
  stepsDiv.innerHTML = "";
  resultDiv.innerHTML = "";

  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);
  const mode = document.getElementById("mode").value;
  const augmented = document.getElementById("augmented").checked;

  if (mode === "inverse" && rows !== cols) {
    alert("Inverse requires a square matrix.");
    return;
  }

  const totalCols = augmented ? cols + 1 : cols;

  const table = document.createElement("table");

  for (let i = 0; i < rows; i++) {
    const tr = document.createElement("tr");
    for (let j = 0; j < totalCols; j++) {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.value = "0";
      input.dataset.row = i;
      input.dataset.col = j;
      td.appendChild(input);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  matrixContainer.appendChild(table);
}


function readMatrix() {
  const inputs = document.querySelectorAll("input[data-row]");
  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);

  const matrix = Array.from({ length: rows }, () => Array(cols + 1).fill(0));

  inputs.forEach(input => {
    const r = input.dataset.row;
    const c = input.dataset.col;
    matrix[r][c] = Number(input.value);
  });

  return matrix;
}


let stepCounter = 1;

function logStep(operationText, matrix) {
  const box = document.createElement("div");
  box.className = "step-box";

  const title = document.createElement("div");
  title.className = "step-title";
  title.innerText = `Step ${stepCounter++}:`;

  const operation = document.createElement("div");
  operation.className = "row-operation";
  operation.innerText = operationText;

  const label = document.createElement("div");
  label.innerHTML = "<b>Matrix after this step</b>";

  const grid = document.createElement("div");
  grid.className = "matrix-step";

  // ✅ هنا السحر: عدد الأعمدة = طول الصف
  const cols = matrix[0].length;
  grid.style.gridTemplateColumns = `repeat(${cols}, 60px)`;

  matrix.forEach(row => {
    row.forEach(value => {
      const cell = document.createElement("input");
      cell.disabled = true;
      cell.value = smartNumber(value);
      grid.appendChild(cell);
    });
  });

  box.appendChild(title);
  box.appendChild(operation);
  box.appendChild(label);
  box.appendChild(grid);

  stepsDiv.appendChild(box);
}




function solve() {
  stepCounter = 1;
stepsDiv.innerHTML = "";

  stepsDiv.innerHTML = "";
  resultDiv.innerHTML = "";

  let A = readMatrix();
  const mode = document.getElementById("mode").value;

  if (mode === "gaussian") gaussianElimination(A);
  else if (mode === "gaussJordan") gaussJordan(A);
  else inverseMatrix(A);
}

function gaussianElimination(A) {
  const n = A.length;
  const m = A[0].length;
  const vars = m - 1;

  logStep("Initial Matrix", A);

  for (let i = 0; i < Math.min(n, vars); i++) {
    if (A[i][i] === 0) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < m; j++) {
        A[k][j] -= factor * A[i][j];
      }
      logStep(`R${k+1} = R${k+1} - (${factor.toFixed(3)})R${i+1}`, A);
    }
  }

  // ✅ No Solution detection
  for (let i = 0; i < n; i++) {
    let allZero = true;
    for (let j = 0; j < vars; j++) {
      if (Math.abs(A[i][j]) > 1e-9) {
        allZero = false;
        break;
      }
    }

    if (allZero && Math.abs(A[i][vars]) > 1e-9) {
      resultDiv.innerHTML = "<b>Status:</b> No Solution (Inconsistent System)";
      return;
    }
  }

  // ✅ Infinite Solutions detection
  let rank = 0;
  for (let i = 0; i < n; i++) {
    let nonZero = false;
    for (let j = 0; j < vars; j++) {
      if (Math.abs(A[i][j]) > 1e-9) {
        nonZero = true;
        break;
      }
    }
    if (nonZero) rank++;
  }

  if (rank < vars) {
    resultDiv.innerHTML = "<b>Status:</b> Infinite Solutions (Underdetermined System)";
    return;
  }

  // ✅ Back Substitution (Unique Solution)
  const x = Array(vars).fill(0);

  for (let i = vars - 1; i >= 0; i--) {
    let sum = A[i][vars];
    for (let j = i + 1; j < vars; j++) {
      sum -= A[i][j] * x[j];
    }
    x[i] = sum / A[i][i];
  }

 resultDiv.innerHTML =
  "<b>Status:</b> Unique Solution<br><br>" +
  "<b>Solution:</b><br>" +
  x.map(v => smartNumber(v)).join("<br>");
}



function gaussJordan(A) {
  const n = A.length;
  const m = A[0].length;

  logStep("Initial Matrix", A);

  for (let i = 0; i < n; i++) {
    let pivot = A[i][i];
    for (let j = 0; j < m; j++) A[i][j] /= pivot;

    logStep(`R${i+1} / ${pivot.toFixed(3)}`, A);

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        let factor = A[k][i];
        for (let j = 0; j < m; j++) {
          A[k][j] -= factor * A[i][j];
        }
        logStep(`R${k+1} = R${k+1} - (${factor.toFixed(3)})R${i+1}`, A);
      }
    }
  }

  const sol = A.map(row => row[m - 1]);
  resultDiv.innerHTML = "<b>Solution:</b><br>" + sol.map(v => v.toFixed(5)).join("<br>");
}

function inverseMatrix(A) {
  const n = A.length;

  const I = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  A = A.map((row, i) => row.slice(0, n).concat(I[i]));
  logStep("Augmented Matrix [A | I]", A);

  const m = A[0].length;

  for (let i = 0; i < n; i++) {
    let pivot = A[i][i];
    for (let j = 0; j < m; j++) A[i][j] /= pivot;

    logStep(`R${i+1} / ${pivot.toFixed(3)}`, A);

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        let factor = A[k][i];
        for (let j = 0; j < m; j++) {
          A[k][j] -= factor * A[i][j];
        }
        logStep(`R${k+1} = R${k+1} - (${factor.toFixed(3)})R${i+1}`, A);
      }
    }
  }

  const inv = A.map(row => row.slice(n));
  resultDiv.innerHTML = "<b>Inverse Matrix:</b><br>" +
    inv.map(r => r.map(v => v.toFixed(5)).join(" ")).join("<br>");
}

function loadSample() {
  generateMatrix();

  const sample = [
    [2, 1, -1, 8],
    [-3, -1, 2, -11],
    [-2, 1, 2, -3]
  ];

  const rows = Number(document.getElementById("rows").value);
  const cols = Number(document.getElementById("cols").value);

  document.querySelectorAll("input[data-row]").forEach(input => {
    const r = Number(input.dataset.row);
    const c = Number(input.dataset.col);

    // Fill only inside 3x3 + b column
    if (r < 3 && c < cols + 1 && c < 4) {
      input.value = sample[r][c] ?? 0;
    } else {
      input.value = 0;
    }
  });
}
function smartNumber(num) {
  if (Math.abs(num - Math.round(num)) < 1e-9) {
    return Math.round(num);  // Integer
  }
  return Number(num.toFixed(4)); // Decimal only if needed
}
