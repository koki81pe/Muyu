//// ============================================
//// MASTER.GS - CONFIGURACIÓN Y ENRUTADOR
//// ============================================

// CONFIGURACIÓN GLOBAL (solo aquí, una vez)
const SPREADSHEET_ID = '1lZ8OEIfeUvHqxWsVHYy4W1ow2VpIYCvTr9YFAxDkCCU';
const HOJA_VENTAS = 'Ventas';
const HOJA_CATEGORIAS = 'Cat';
const HOJA_MEDIOS_PAGO = 'Mpago';

//// ENRUTADOR PRINCIPAL
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

//// FUNCIONES AUXILIARES COMPARTIDAS
function obtenerSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function obtenerFechaPeru() {
  return Utilities.formatDate(new Date(), "GMT-5", "dd/MM/yyyy");
}

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
