import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";
import pdfToPrinter from "pdf-to-printer";

const { print } = pdfToPrinter;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PRINTER_NAME = "Star TSP143IIILAN Cutter";
const POLL_INTERVAL = 3000;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function drawDivider(doc) {
  const y = doc.y;

  doc.moveTo(10, y).lineTo(216, y).lineWidth(1).stroke();

  doc.moveDown(0.4);
}

function createReceiptPdf(order, items) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(
      os.tmpdir(),
      `aiolia-order-${order.order_number}-${Date.now()}.pdf`,
    );

    // 80 mm paper width ≈ 226.77 PDF points
    const width = 226.77;

    const doc = new PDFDocument({
      size: [width, 600],
      margins: {
        top: 12,
        bottom: 12,
        left: 10,
        right: 10,
      },
    });

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // HEADER
    doc.font("Helvetica-Bold").fontSize(18).text("AIOLIA", {
      align: "center",
    });

    doc.font("Helvetica").fontSize(9).text("BEACH BAR", {
      align: "center",
    });

    doc.moveDown(0.5);

    drawDivider(doc);

    // ORDER NUMBER
    doc.moveDown(0.3);

    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(`ORDER #${order.order_number}`, {
        align: "center",
      });

    doc.moveDown(0.4);

    // TABLE / PICKUP
    if (order.order_type === "TABLE") {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(`TABLE ${order.table_number}`, {
          align: "center",
        });
    } else {
      doc.font("Helvetica-Bold").fontSize(18).text("PICKUP", {
        align: "center",
      });

      doc.moveDown(0.5);

      if (order.customer_name) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(`Customer: ${order.customer_name}`);
      }

      if (order.phone) {
        doc.text(`Phone: ${order.phone}`);
      }
    }

    doc.moveDown(0.7);

    drawDivider(doc);

    doc.moveDown(0.5);

    // ITEMS
    for (const item of items) {
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(`${item.quantity} x ${item.product_name}`);

      if (item.notes) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`NOTE: ${item.notes.toUpperCase()}`, {
            indent: 8,
          });
      }

      doc.moveDown(0.5);
    }

    drawDivider(doc);

    // TOTAL
    doc.moveDown(0.3);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`TOTAL: ${Number(order.total ?? 0).toFixed(2)} EUR`, {
        align: "right",
      });

    doc.moveDown(0.5);

    // GENERAL ORDER NOTES
    if (order.notes) {
      doc.font("Helvetica-Bold").fontSize(10).text("ORDER NOTES");

      doc.font("Helvetica").fontSize(10).text(order.notes);

      doc.moveDown(0.5);
    }

    drawDivider(doc);

    // DATE / TIME
    const createdAt = new Date(order.created_at);

    const formattedDate = createdAt.toLocaleString("en-GB", {
      timeZone: "Europe/Athens",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.moveDown(0.4);

    doc.font("Helvetica").fontSize(8).text(formattedDate, {
      align: "center",
    });

    doc.moveDown(0.6);

    doc.font("Helvetica-Bold").fontSize(12).text(`#${order.order_number}`, {
      align: "center",
    });

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);
    });

    stream.on("error", reject);
  });
}

async function printReceiptPdf(filePath) {
  await print(filePath, {
    printer: PRINTER_NAME,
    scale: "fit",
    monochrome: true,
  });

  console.log("PDF sent to printer");
}

async function markJobFailed(job, error) {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Printing failed:", message);

  const { error: updateError } = await supabase
    .from("print_jobs")
    .update({
      status: "FAILED",
      attempts: (job.attempts ?? 0) + 1,
      last_error: message,
    })
    .eq("id", job.id);

  if (updateError) {
    console.error("Failed to update print job status:", updateError);
  }
}

async function processNextPrintJob() {
  console.log("Checking for pending print jobs...");

  const { data: jobs, error: jobsError } = await supabase
    .from("print_jobs")
    .select("*")
    .eq("status", "PENDING")
    .order("created_at", { ascending: true })
    .limit(1);

  if (jobsError) {
    console.error("Could not fetch print jobs:", jobsError);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log("No pending print jobs.");
    return;
  }

  const job = jobs[0];

  console.log(`Found print job ${job.id}`);

  // Mark as processing before printing
  const { error: processingError } = await supabase
    .from("print_jobs")
    .update({
      status: "PROCESSING",
    })
    .eq("id", job.id);

  if (processingError) {
    console.error("Could not mark job as PROCESSING:", processingError);
    return;
  }

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", job.order_id)
    .single();

  if (orderError) {
    await markJobFailed(job, orderError);
    return;
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", {
      ascending: true,
    });

  if (itemsError) {
    await markJobFailed(job, itemsError);
    return;
  }

  let receiptPath;

  try {
    receiptPath = await createReceiptPdf(order, items);

    console.log(`Receipt created for order #${order.order_number}`);

    await printReceiptPdf(receiptPath);

    const { error: updateError } = await supabase
      .from("print_jobs")
      .update({
        status: "PRINTED",
        printed_at: new Date().toISOString(),
        attempts: (job.attempts ?? 0) + 1,
        last_error: null,
      })
      .eq("id", job.id);

    if (updateError) {
      console.error("Printed, but failed to update print job:", updateError);
      return;
    }

    console.log(`Order #${order.order_number} printed successfully`);
  } catch (error) {
    await markJobFailed(job, error);
  } finally {
    if (receiptPath) {
      fs.unlink(receiptPath, (error) => {
        if (error) {
          console.error("Could not delete temporary receipt:", error.message);
        }
      });
    }
  }
}

async function startPrintAgent() {
  console.log("Aiolia print agent started");
  console.log(`Printer: ${PRINTER_NAME}`);
  console.log(`Checking every ${POLL_INTERVAL / 1000} seconds...`);

  while (true) {
    try {
      await processNextPrintJob();
    } catch (error) {
      console.error("Unexpected print agent error:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

await startPrintAgent();
