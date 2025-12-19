
import { InventoryItem } from "../types";

/**
 * ⚠️ IMPORTANTE: ISTRUZIONI DI CONFIGURAZIONE ⚠️
 * 
 * 1. Apri il tuo Google Sheet.
 * 2. Vai su "Estensioni" -> "Apps Script".
 * 3. Sostituisci TUTTO il codice esistente con questo:
 * 
 * function doGet() {
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
 *   const data = sheet.getDataRange().getValues();
 *   if (data.length <= 1) return createJsonResponse([]);
 *   const headers = data.shift();
 *   const json = data.map(row => {
 *     const obj = {};
 *     headers.forEach((h, i) => {
 *       let val = row[i];
 *       if (['quantity', 'minStockLevel', 'price'].includes(h)) val = Number(val) || 0;
 *       obj[h] = val;
 *     });
 *     return obj;
 *   });
 *   return createJsonResponse(json);
 * }
 * 
 * function doPost(e) {
 *   try {
 *     const lock = LockService.getScriptLock();
 *     lock.waitLock(30000); // Gestisce accessi simultanei
 *     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
 *     const items = JSON.parse(e.postData.contents);
 *     sheet.clear();
 *     if (items.length > 0) {
 *       const headers = Object.keys(items[0]);
 *       sheet.appendRow(headers);
 *       items.forEach(item => {
 *         sheet.appendRow(headers.map(h => item[h]));
 *       });
 *     }
 *     SpreadsheetApp.flush(); // Forza il salvataggio immediato
 *     return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
 *   } catch (err) {
 *     return ContentService.createTextOutput("Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
 *   } finally {
 *     lock.releaseLock();
 *   }
 * }
 * 
 * function createJsonResponse(data) {
 *   return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * 4. Clicca su "Esegui" -> "doGet" per autorizzare i permessi (solo la prima volta).
 * 5. Clicca su "Distribuisci" -> "Nuova distribuzione".
 * 6. Seleziona "Applicazione Web".
 * 7. Esegui come: "Tu" (Tua email).
 * 8. Chi ha accesso: "Chiunque" (Fondamentale!).
 * 9. COPIA l'URL che finisce con "/exec".
 */

export const isValidSheetUrl = (url: string) => {
  return url.includes('script.google.com/macros/s/') && url.endsWith('/exec');
};

export const fetchFromSheet = async (url: string): Promise<InventoryItem[] | null> => {
  if (!url || !isValidSheetUrl(url)) return null;

  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
};

export const saveToSheet = async (url: string, items: InventoryItem[]): Promise<boolean> => {
  if (!url || !isValidSheetUrl(url)) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(items),
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.text();
    console.log("Cloud Save Status:", result);
    return result.trim() === "OK";
  } catch (error) {
    console.error("Save Error:", error);
    return false;
  }
};
