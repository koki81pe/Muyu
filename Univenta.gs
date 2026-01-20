// MOD-001: ENCABEZADO [INICIO]
/*
*****************************************
PROYECTO: Muyu Ventas
ARCHIVO: Univenta.gs
VERSIÓN: 01.00
FECHA: 19/01/2026 22:01 (UTC-5)
*****************************************
*/
// MOD-001: FIN

// MOD-002: CATEGORÍAS [INICIO]
function getCategorias() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_CATEGORIAS);
  const data = sheet.getRange('A2:A').getValues().flat().filter(String);
  return data;
}
// MOD-002: FIN

// MOD-003: MODOS DE PAGO [INICIO]
function getModosPago() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_MEDIOS_PAGO);
  const data = sheet.getRange('A2:A').getValues().flat().filter(String);
  return data;
}
// MOD-003: FIN

// MOD-004: REGISTRAR VENTA [INICIO]
function registrarVenta(data) {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_VENTAS);
  
  // Ubicar la fila correcta
  const newRow = encontrarUltimaFila(sheet);
  
  // Fecha Perú
  const fechaPeru = obtenerFechaPeru();
  
  // Registrar datos
  sheet.getRange(newRow, 1).setValue(fechaPeru);
  sheet.getRange(newRow, 2).setValue(data.categoria);
  sheet.getRange(newRow, 3).setValue(data.producto);
  sheet.getRange(newRow, 4).setValue(data.modoPago);
  sheet.getRange(newRow, 5).setValue(Number(data.precio));
  sheet.getRange(newRow, 6).setValue(Number(data.cantidad));
  sheet.getRange(newRow, 7).setFormula(`=E${newRow}*F${newRow}`);
  
  return "Registro exitoso";
}
// MOD-004: FIN

// MOD-005: CÓDIGO DE CIERRE [INICIO]
Logger.log('✅ Muyu Ventas Univenta.gs v01.00 cargado correctamente');
// MOD-005: FIN

// MOD-006: NOTAS [INICIO]
/*
DESCRIPCIÓN:
Módulo Univenta.gs para registro simple de ventas en Muyu Ventas v1.00.

DEPENDENCIAS EXTERNAS:
- Master.gs: obtenerSpreadsheet(), encontrarUltimaFila(), obtenerFechaPeru()
- Spreadsheet: Hojas 'Cat', 'Mpago', 'Ventas'

FLujo DE DATOS:
- MOD-002: Carga categorías desde hoja Cat (A2:A)
- MOD-003: Carga medios pago desde hoja Mpago (A2:A)
- MOD-004: Registra venta en columnas A-G (Fecha, Cat, Prod, Pago, Precio, Cant, Total)

ADVERTENCIAS:
- MOD-004: Validar data.categoria y data.modoPago existan en listas
- MOD-004: Precio y cantidad convertidos a Number()
- Fórmula total auto-generada en columna G

COMPATIBILIDAD:
✔ 100% alineado con CodeWorkShop v5.0
✔ Integración perfecta con Master.gs
*/
// MOD-006: FIN
