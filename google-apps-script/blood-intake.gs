/**
 * Sanjeevani X — Blood Request → Google Sheets intake
 *
 * Deploy:
 * 1. Open https://script.google.com → New project → paste this file
 * 2. Run once (authorize spreadsheet access)
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the /exec URL into APPS_SCRIPT_URL in your .env
 *
 * Sheet: https://docs.google.com/spreadsheets/d/19evLGSsU_PW8dPIILm8NeZWS0qKBnh57pkp2QaQYz44
 */

const SHEET_ID = '19evLGSsU_PW8dPIILm8NeZWS0qKBnh57pkp2QaQYz44';
const SHEET_NAME = 'Sheet1';

const HEADERS = [
  'request_id', 'patient_name', 'blood_group', 'units_needed', 'city', 'hospital',
  'urgency', 'status', 'patient_type', 'hospital_contact', 'patient_trust_score',
  'required_before', 'assigned_donor_pool', 'backup_donor_pool', 'request_source',
  'created_at',
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    const row = HEADERS.map(function (h) {
      return h === 'created_at' ? new Date() : (body[h] ?? '');
    });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, request_id: body.request_id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Sanjeevani X intake' }))
    .setMimeType(ContentService.MimeType.JSON);
}
