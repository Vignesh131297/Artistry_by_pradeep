const NOTIFY_EMAIL = "artistrybypradeep@gmail.com";

// ── EXACT field names from YOUR Google Form (check your sheet column headers) ──
const COL_NAME    = "Client Name";
const COL_STARS   = "How satisfied are you with our service?";
const COL_COMMENT = "How was your overall experience with Artistry by Pradeep?";
// ─────────────────────────────────────────────────────────────────────────────

function onFormSubmit(e) {
  const sheet     = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const responses = e.namedValues;

  const name    = (responses[COL_NAME]    || ["Anonymous"])[0].trim();
  const stars   = (responses[COL_STARS]   || ["5"])[0].trim();
  const comment = (responses[COL_COMMENT] || [""])[0].trim();
  const date    = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });

  // Find or create Status column
  const headers      = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let statusColIndex = headers.indexOf("Status") + 1;
  if (statusColIndex === 0) {
    statusColIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusColIndex).setValue("Status");
  }

  // Write review row
  sheet.appendRow([date, name, stars, comment, "pending"]);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, statusColIndex).setValue("pending");

  // ── Approve / Disapprove links using doGet with action params ──
  const scriptUrl   = ScriptApp.getService().getUrl();
  const approveUrl  = scriptUrl + "?action=approve&row=" + lastRow;
  const rejectUrl   = scriptUrl + "?action=reject&row="  + lastRow;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "⭐ New Review from " + name + " (" + stars + "/5 stars)",
    htmlBody:
      "<div style='font-family:Arial,sans-serif;max-width:500px;'>" +
      "<h2 style='color:#e05424;border-bottom:2px solid #e05424;padding-bottom:8px;'>New Review Submitted</h2>" +
      "<table style='width:100%;border-collapse:collapse;'>" +
      "<tr><td style='padding:8px;font-weight:bold;color:#333;width:80px;'>Name</td><td style='padding:8px;color:#555;'>" + name + "</td></tr>" +
      "<tr style='background:#fafafa;'><td style='padding:8px;font-weight:bold;color:#333;'>Stars</td><td style='padding:8px;color:#e05424;font-size:18px;'>" + "★".repeat(parseInt(stars)||5) + "</td></tr>" +
      "<tr><td style='padding:8px;font-weight:bold;color:#333;'>Review</td><td style='padding:8px;color:#555;font-style:italic;'>" + comment + "</td></tr>" +
      "</table>" +
      "<div style='margin-top:24px;display:flex;gap:12px;'>" +
      "<a href='" + approveUrl + "' style='display:inline-block;padding:12px 28px;background:#27ae60;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;margin-right:12px;'>✅ APPROVE — Show on Website</a>" +
      "<a href='" + rejectUrl  + "' style='display:inline-block;padding:12px 28px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:15px;'>🗑 REJECT — Delete Review</a>" +
      "</div>" +
      "<p style='margin-top:16px;font-size:12px;color:#999;'>Row #" + lastRow + " in your Google Sheet</p>" +
      "</div>"
  });
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // ── Handle approve / reject button clicks from email ──
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    const row    = parseInt(e.parameter.row);

    if (row && row > 1) {
      // Find Status column
      const headers      = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const statusColIdx = headers.indexOf("Status") + 1;

      if (action === "approve" && statusColIdx > 0) {
        sheet.getRange(row, statusColIdx).setValue("approved");
        return ContentService.createTextOutput(
          "<html><body style='font-family:Arial;text-align:center;padding:40px;'>" +
          "<h2 style='color:#27ae60;'>✅ Review Approved!</h2>" +
          "<p>The review is now visible on your website.</p>" +
          "<p style='color:#999;font-size:13px;'>You can close this tab.</p>" +
          "</body></html>"
        ).setMimeType(ContentService.MimeType.HTML);
      }

      if (action === "reject" && statusColIdx > 0) {
        sheet.deleteRow(row);
        return ContentService.createTextOutput(
          "<html><body style='font-family:Arial;text-align:center;padding:40px;'>" +
          "<h2 style='color:#e74c3c;'>🗑 Review Rejected & Deleted</h2>" +
          "<p>The review has been removed from the sheet.</p>" +
          "<p style='color:#999;font-size:13px;'>You can close this tab.</p>" +
          "</body></html>"
        ).setMimeType(ContentService.MimeType.HTML);
      }
    }
  }

  // ── Serve approved reviews as JSON (for website) ──
  const rows    = sheet.getDataRange().getValues();
  const headers = rows[0];

  // Flexible column detection — finds by partial match too
  function findCol(keywords) {
    for (let k of keywords) {
      const idx = headers.findIndex(h => String(h).toLowerCase().includes(k.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  const statusIdx    = findCol(["Status"]);
  const nameIdx      = findCol(["Client Name", "name"]);
  const starsIdx     = findCol(["satisfied", "Star Rating", "stars"]);
  const commentIdx   = findCol(["overall experience", "Your Review", "review", "comment"]);
  const timestampIdx = findCol(["Timestamp", "Date"]);

  const approved = [];
  for (let i = 1; i < rows.length; i++) {
    if (statusIdx >= 0 && String(rows[i][statusIdx]).toLowerCase().trim() === "approved") {
      approved.push({
        date   : rows[i][timestampIdx] ? String(rows[i][timestampIdx]).split(" ")[0] : "",
        name   : rows[i][nameIdx]    || "Anonymous",
        stars  : rows[i][starsIdx]   || 5,
        comment: rows[i][commentIdx] || ""
      });
    }
  }

  approved.reverse();
  return ContentService
    .createTextOutput(JSON.stringify(approved))
    .setMimeType(ContentService.MimeType.JSON);
}