import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";

const printerName = "Star TSP143IIILAN Cutter";

const receipt = `
AIOLIA BEACH BAR
----------------------------

PRINTER TEST

Order #001

1x Burger
1x Aperol Spritz

----------------------------
Windows queue test

`;

const tempFile = path.join(os.tmpdir(), "aiolia-printer-test.txt");

fs.writeFileSync(tempFile, receipt, "utf8");

const powershellScript = `
$printer = "${printerName}"
$file = "${tempFile.replace(/\\/g, "\\\\")}"

Get-Content -Path $file | Out-Printer -Name $printer
`;

execFile(
  "powershell.exe",
  ["-NoProfile", "-Command", powershellScript],
  (error, stdout, stderr) => {
    if (error) {
      console.error("Print error:", error);
      return;
    }

    if (stderr) {
      console.error("PowerShell error:", stderr);
    }

    console.log("Print job sent to Windows printer queue");
  },
);
