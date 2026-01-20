// MOD-001: ENCABEZADO [INICIO]
/*
*****************************************
PROYECTO: Muyu Ventas
ARCHIVO: Master.gs
VERSIÓN: 01.00
FECHA: 19/01/2026 21:59 (UTC-5)
*****************************************
*/
// MOD-001: FIN

// MOD-002: CONFIGURACIÓN GLOBAL [INICIO]
const SPREADSHEET_ID = '1lZ8OEIfeUvHqxWsVHYy4W1ow2VpIYCvTr9YFAxDkCCU';
const HOJA_VENTAS = 'Ventas';
const HOJA_CATEGORIAS = 'Cat';
const HOJA_MEDIOS_PAGO = 'Mpago';
// MOD-002: FIN

// MOD-003: ENRUTADOR PRINCIPAL [INICIO]
function doGet(e) {
  try {
    const page = e.parameter.page || 'master';
    
    switch(page) {
      case 'master':
        return HtmlService.createHtmlOutputFromFile('Masterw')
          .setTitle('Intranet Muyu')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      case 'univenta':
        return HtmlService.createHtmlOutputFromFile('Univentaw')
          .setTitle('Registro de Ventas')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      case 'multiventa':
        return HtmlService.createHtmlOutputFromFile('Multiventaw')
          .setTitle('Registro Múltiple de Ventas')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
      default:
        return HtmlService.createHtmlOutputFromFile('Masterw')
          .setTitle('Intranet Muyu')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (error) {
    return HtmlService.createHtmlOutput(`
      <h2>Error</h2>
      <p>${error.message}</p>
      <p>Verifica que los archivos HTML existan con los nombres correctos:</p>
      <ul>
        <li>Masterw.html</li>
        <li>Univentaw.html</li>
        <li>Multiventaw.html</li>
      </ul>
    `);
  }
}
// MOD-003: FIN

// MOD-004: SPREADSHEET HELPER [INICIO]
function obtenerSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
// MOD-004: FIN

// MOD-005: FECHA PERU [INICIO]
function obtenerFechaPeru() {
  return Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy");
}
// MOD-005: FIN

// MOD-006: ÚLTIMA FILA [INICIO]
function encontrarUltimaFila(sheet) {
  const colCValues = sheet.getRange('C2:C').getValues();
  let lastRow = 1;
  for (let i = colCValues.length - 1; i >= 0; i--) {
    if (colCValues[i][0] !== '') {
      lastRow = i + 2;
      break;
    }
  }
  return lastRow + 1;
}
// MOD-006: FIN

// MOD-007: CÓDIGO DE CIERRE [INICIO]
Logger.log('✅ Muyu Ventas Master.gs v01.00 cargado correctamente');
// MOD-007: FIN

// MOD-008: NOTAS [INICIO]
/*
DESCRIPCIÓN:
Enrutador principal y configuración global de Muyu Ventas v1.00.

DEPENDENCIAS:
- HTML: Masterw.html, Univentaw.html, Multiventaw.html
- Spreadsheet: 1lZ8OEIfeUvHqxWsVHYy4W1ow2VpIYCvTr9YFAxDkCCU
  - Hojas: Ventas, Cat, Mpago

FUNCIONES CRÍTICAS:
- MOD-003: doGet() - Enrutador de páginas
- MOD-002: Constantes de configuración global
- MOD-006: encontrarUltimaFila() - Para registros secuenciales

ADVERTENCIAS:
- MOD-003: Verificar nombres exactos de archivos HTML
- MOD-002: SPREADSHEET_ID debe tener permisos de edición
- GMT-5 fijo para Perú (sin DST)

COMPATIBILIDAD:
✔ 100% alineado con CodeWorkShop v5.0
✔ Google Apps Script v2026 estable
*/
// MOD-008: FIN
