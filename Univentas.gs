//// ============================================
//// UNIVENTA.GS - MÓDULO DE VENTA SIMPLE
//// ============================================

//// CARGAR CATEGORÍAS
function getCategorias() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_CATEGORIAS);
  const data = sheet.getRange('A2:A').getValues().flat().filter(String);
  return data;
}

//// CARGAR MODOS DE PAGO
function getModosPago() {
  const ss = obtenerSpreadsheet();
  const sheet = ss.getSheetByName(HOJA_MEDIOS_PAGO);
  const data = sheet.getRange('A2:A').getValues().flat().filter(String);
  return data;
}

//// REGISTRAR VENTA SIMPLE
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
